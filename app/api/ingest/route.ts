// ── POST /api/ingest ────────────────────────────────────────────────
// Policy ingestion endpoint. Three modes:
//   1. auto_fetch  — drug name/HCPCS + payer → MCP server → Claude → Supabase
//   2. pdf_upload  — base64 PDF → Claude → Supabase
//   3. url_paste   — URL → fetch content → Claude → Supabase
//
// payer_name is optional for pdf_upload and url_paste — Claude extracts
// the payer and plan type directly from the document.
//
// Returns the extracted policy (medical and/or pharmacy) or error.

import { NextRequest, NextResponse } from 'next/server';
import { extractFromPdf, extractFromText } from '@/lib/extraction';
import { fetchPolicyFromMcp, scrapeDirectUrl } from '@/lib/mcp/policy-fetch';
import { saveMedicalPolicy, savePharmacyPolicy } from '@/lib/db/policies';
import { createClient } from '@/lib/supabase-server';
import type { IngestionSource } from '@/lib/types/policy';

/**
 * Strip HTML tags and collapse whitespace to get readable text.
 * Used as fallback when Crawl4AI scraper is unavailable.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface IngestBody {
  drug_name?:  string;
  hcpcs_code?: string;
  payer_name?: string;
  source:      IngestionSource;
  pdf_base64?: string;
  url?:        string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as IngestBody;

    if (!body.source || !['pdf_upload', 'url_paste', 'auto_fetch'].includes(body.source)) {
      return NextResponse.json({ error: 'source must be pdf_upload, url_paste, or auto_fetch' }, { status: 400 });
    }

    // auto_fetch still requires payer_name (MCP needs it to find the right document)
    if (body.source === 'auto_fetch' && !body.payer_name) {
      return NextResponse.json({ error: 'auto_fetch requires payer_name' }, { status: 400 });
    }

    // For pdf_upload and url_paste, payer_name is optional —
    // Claude extracts it from the document content.
    const payerHint = body.payer_name || 'Unknown';

    // ── Route by source type ──
    let result;

    switch (body.source) {
      // ── Mode 1: Auto-fetch from MCP server ──
      case 'auto_fetch': {
        if (!body.drug_name && !body.hcpcs_code) {
          return NextResponse.json(
            { error: 'auto_fetch requires drug_name or hcpcs_code' },
            { status: 400 }
          );
        }

        const fetchResult = await fetchPolicyFromMcp({
          drug_name:  body.drug_name,
          hcpcs_code: body.hcpcs_code,
          payer_name: body.payer_name!,
        });

        if (!fetchResult.success) {
          return NextResponse.json(
            { error: fetchResult.error, source_url: fetchResult.source_url },
            { status: 404 }
          );
        }

        if (fetchResult.content_type === 'pdf' && fetchResult.pdf_base64) {
          result = await extractFromPdf(
            fetchResult.pdf_base64,
            body.payer_name!,
            body.drug_name,
            'auto_fetch',
            fetchResult.source_url,
          );
        } else if (fetchResult.content_type === 'text' && fetchResult.text_content) {
          result = await extractFromText(
            fetchResult.text_content,
            body.payer_name!,
            body.drug_name,
            'auto_fetch',
            fetchResult.source_url,
          );
        } else {
          return NextResponse.json({ error: 'Fetched document has no content' }, { status: 502 });
        }
        break;
      }

      // ── Mode 2: PDF upload ──
      case 'pdf_upload': {
        if (!body.pdf_base64) {
          return NextResponse.json({ error: 'pdf_upload requires pdf_base64' }, { status: 400 });
        }

        result = await extractFromPdf(
          body.pdf_base64,
          payerHint,
          body.drug_name,
          'pdf_upload',
        );
        break;
      }

      // ── Mode 3: URL paste ──
      case 'url_paste': {
        if (!body.url) {
          return NextResponse.json({ error: 'url_paste requires url' }, { status: 400 });
        }

        // Try Crawl4AI scraper first (better at extracting clean text from HTML)
        const scraped = await scrapeDirectUrl(body.url, payerHint, body.drug_name);

        if (scraped.success && scraped.content_type === 'pdf' && scraped.pdf_base64) {
          result = await extractFromPdf(
            scraped.pdf_base64,
            payerHint,
            body.drug_name,
            'url_paste',
            body.url,
          );
        } else if (scraped.success && scraped.content_type === 'text' && scraped.text_content) {
          result = await extractFromText(
            scraped.text_content,
            payerHint,
            body.drug_name,
            'url_paste',
            body.url,
          );
        } else {
          // Fallback: direct fetch if scraper is unavailable
          const urlResponse = await fetch(body.url);
          if (!urlResponse.ok) {
            return NextResponse.json(
              { error: `Failed to fetch URL: ${urlResponse.status} ${urlResponse.statusText}` },
              { status: 502 }
            );
          }

          const contentType = urlResponse.headers.get('content-type') ?? '';
          const urlLower = body.url.toLowerCase();

          // Detect PDF by content-type, URL extension, or file magic bytes
          const buffer = await urlResponse.arrayBuffer();
          const bytes = new Uint8Array(buffer.slice(0, 5));
          const isPdfMagic = bytes[0] === 0x25 && bytes[1] === 0x50 &&
                             bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF

          const isPdf = contentType.includes('application/pdf') ||
                        contentType.includes('application/octet-stream') && urlLower.endsWith('.pdf') ||
                        urlLower.endsWith('.pdf') ||
                        isPdfMagic;

          if (isPdf) {
            const base64 = Buffer.from(buffer).toString('base64');
            result = await extractFromPdf(
              base64,
              payerHint,
              body.drug_name,
              'url_paste',
              body.url,
            );
          } else {
            // Decode as text and strip HTML for Claude
            const decoder = new TextDecoder();
            const rawText = decoder.decode(buffer);
            const cleanText = stripHtml(rawText);

            if (cleanText.length < 100) {
              return NextResponse.json(
                { error: 'Could not extract meaningful content from this URL' },
                { status: 422 }
              );
            }

            result = await extractFromText(
              cleanText,
              payerHint,
              body.drug_name,
              'url_paste',
              body.url,
            );
          }
        }
        break;
      }
    }

    // ── Save all split policies to Supabase (server client for RLS) ──
    const supabase = await createClient();
    if (result?.medical_policies?.length) {
      await Promise.all(result.medical_policies.map(p => saveMedicalPolicy(supabase, p)));
    }
    if (result?.pharmacy_policies?.length) {
      await Promise.all(result.pharmacy_policies.map(p => savePharmacyPolicy(supabase, p)));
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during ingestion';
    console.error('[/api/ingest]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
