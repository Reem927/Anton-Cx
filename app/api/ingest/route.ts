// ── POST /api/ingest ────────────────────────────────────────────────
// Policy ingestion endpoint. Three modes:
//   1. auto_fetch  — drug name/HCPCS + payer → MCP server → Claude → Supabase
//   2. pdf_upload  — base64 PDF + payer → Claude → Supabase
//   3. url_paste   — URL → fetch content → Claude → Supabase
//
// Returns the extracted policy (medical and/or pharmacy) or error.

import { NextRequest, NextResponse } from 'next/server';
import { extractFromPdf, extractFromText } from '@/lib/extraction';
import { fetchPolicyFromMcp } from '@/lib/mcp/policy-fetch';
import { saveMedicalPolicy, savePharmacyPolicy } from '@/lib/db/policies';
import type { IngestionSource } from '@/lib/types/policy';

interface IngestBody {
  drug_name?:  string;
  hcpcs_code?: string;
  payer_name:  string;
  source:      IngestionSource;
  pdf_base64?: string;
  url?:        string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as IngestBody;

    // ── Validate request ──
    if (!body.payer_name) {
      return NextResponse.json({ error: 'payer_name is required' }, { status: 400 });
    }

    if (!body.source || !['pdf_upload', 'url_paste', 'auto_fetch'].includes(body.source)) {
      return NextResponse.json({ error: 'source must be pdf_upload, url_paste, or auto_fetch' }, { status: 400 });
    }

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
          payer_name: body.payer_name,
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
            body.payer_name,
            body.drug_name,
            'auto_fetch',
            fetchResult.source_url,
          );
        } else if (fetchResult.content_type === 'text' && fetchResult.text_content) {
          result = await extractFromText(
            fetchResult.text_content,
            body.payer_name,
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
          body.payer_name,
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

        // Fetch the document from the URL
        const urlResponse = await fetch(body.url);
        if (!urlResponse.ok) {
          return NextResponse.json(
            { error: `Failed to fetch URL: ${urlResponse.status} ${urlResponse.statusText}` },
            { status: 502 }
          );
        }

        const contentType = urlResponse.headers.get('content-type') ?? '';

        if (contentType.includes('application/pdf')) {
          const buffer = await urlResponse.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          result = await extractFromPdf(
            base64,
            body.payer_name,
            body.drug_name,
            'url_paste',
            body.url,
          );
        } else {
          // Treat as text (HTML pages, plain text policy documents)
          const text = await urlResponse.text();
          result = await extractFromText(
            text,
            body.payer_name,
            body.drug_name,
            'url_paste',
            body.url,
          );
        }
        break;
      }
    }

    // ── Save to Supabase ──
    if (result?.medical_policy) {
      await saveMedicalPolicy(result.medical_policy);
    }
    if (result?.pharmacy_policy) {
      await savePharmacyPolicy(result.pharmacy_policy);
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during ingestion';
    console.error('[/api/ingest]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
