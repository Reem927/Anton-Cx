// ── Crawl4AI Service Connector — Policy Document Fetcher ───────────
// Connects to the Railway-deployed crawl4ai scraper service.
//
// Endpoint: POST /scrape
// Body:     { url?: string, drug_name?: string, payer?: string }
// Returns scraped page content which we pipe to Claude for extraction.

export interface PolicyFetchRequest {
  drug_name?:  string;
  hcpcs_code?: string;
  payer_name:  string;
}

export interface PolicyFetchResult {
  success:       boolean;
  content_type:  'text' | 'pdf' | 'not_found';
  text_content?: string;
  pdf_base64?:   string;
  source_url:    string;
  error?:        string;
}

const CRAWL4AI_URL = process.env.CRAWL4AI_SERVICE_URL;

if (!CRAWL4AI_URL) {
  console.warn(
    'Missing CRAWL4AI_SERVICE_URL — auto_fetch ingestion will not work. ' +
    'Add it to .env.local pointing to the Railway-deployed crawl4ai service.'
  );
}

/**
 * Fetch a policy document via the scraper service (POST /scrape).
 *
 * The service accepts:
 *   - drug_name: brand or generic name, or HCPCS code
 *   - payer: payer name
 *   - url: optional direct URL to scrape
 *
 * It finds and scrapes the policy page, returning the content.
 */
export async function fetchPolicyFromMcp(
  request: PolicyFetchRequest
): Promise<PolicyFetchResult> {
  if (!CRAWL4AI_URL) {
    return {
      success:      false,
      content_type: 'not_found',
      source_url:   '',
      error:        'CRAWL4AI_SERVICE_URL is not configured',
    };
  }

  const endpoint = `${CRAWL4AI_URL}/scrape`;

  // Use HCPCS code as drug_name if that's what was provided
  const drugIdentifier = request.drug_name ?? request.hcpcs_code ?? null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drug_name: drugIdentifier,
        payer:     request.payer_name,
        url:       null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        success:      false,
        content_type: 'not_found',
        source_url:   endpoint,
        error:        `Scraper returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    // Handle response — check common field names the service may return
    const textContent = data.raw_text ?? data.content ?? data.markdown ?? data.text ?? data.extracted_content ?? data.result ?? null;

    if (typeof textContent === 'string' && textContent.trim().length > 0) {
      return {
        success:      true,
        content_type: 'text',
        text_content: textContent,
        source_url:   data.source_url ?? data.url ?? endpoint,
      };
    }

    // PDF binary response (base64 encoded)
    if (data.pdf_base64 || data.pdf) {
      return {
        success:      true,
        content_type: 'pdf',
        pdf_base64:   data.pdf_base64 ?? data.pdf,
        source_url:   data.source_url ?? data.url ?? endpoint,
      };
    }

    // No usable content
    return {
      success:      false,
      content_type: 'not_found',
      source_url:   data.source_url ?? data.url ?? endpoint,
      error:        `No policy content found for "${drugIdentifier}" at ${request.payer_name}`,
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error';
    return {
      success:      false,
      content_type: 'not_found',
      source_url:   endpoint,
      error:        `Scraper error: ${message}`,
    };
  }
}

/**
 * Scrape a direct URL via the service.
 * Used by the "Paste URL" tab.
 */
export async function scrapeDirectUrl(
  url: string,
  payerName: string,
  drugName?: string,
): Promise<PolicyFetchResult> {
  if (!CRAWL4AI_URL) {
    return {
      success:      false,
      content_type: 'not_found',
      source_url:   url,
      error:        'CRAWL4AI_SERVICE_URL is not configured',
    };
  }

  const endpoint = `${CRAWL4AI_URL}/scrape`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        drug_name: drugName ?? null,
        payer:     payerName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        success:      false,
        content_type: 'not_found',
        source_url:   url,
        error:        `Scraper returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const textContent = data.raw_text ?? data.content ?? data.markdown ?? data.text ?? data.extracted_content ?? data.result ?? null;

    if (typeof textContent === 'string' && textContent.trim().length > 0) {
      return {
        success:      true,
        content_type: 'text',
        text_content: textContent,
        source_url:   data.source_url ?? url,
      };
    }

    if (data.pdf_base64 || data.pdf) {
      return {
        success:      true,
        content_type: 'pdf',
        pdf_base64:   data.pdf_base64 ?? data.pdf,
        source_url:   data.source_url ?? url,
      };
    }

    return {
      success:      false,
      content_type: 'not_found',
      source_url:   url,
      error:        `No content extracted from ${url}`,
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error';
    return {
      success:      false,
      content_type: 'not_found',
      source_url:   url,
      error:        `Scraper error: ${message}`,
    };
  }
}
