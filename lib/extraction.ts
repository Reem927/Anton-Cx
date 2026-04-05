import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { claude, CLAUDE_MODEL } from './ai';
import type { PolicyDocument, CoverageStatus } from './types';

const EXTRACTION_SYSTEM_PROMPT = `
You are a clinical policy document parser for Anton Cx, a medical benefit drug intelligence platform.

Extract the following fields from the provided clinical policy document (CPB) and return ONLY valid JSON.
Do not include markdown code fences or any text outside the JSON object.

Fields to extract:
1. drug_name: Brand name of the drug (string)
2. drug_generic: Generic/INN name (string)
3. j_code: HCPCS J-code, format "J####" (string, empty string if not found)
4. coverage_status: One of: "covered", "pa_required", "denied", "not_covered"
5. prior_auth_required: true/false
6. prior_auth_criteria: Verbatim clinical criteria text for PA approval, max 500 characters
7. step_therapy: true/false (true if patient must try other drugs first)
8. step_therapy_drugs: Array of generic drug names required before this drug (string[], empty array if none)
9. site_of_care: Where the drug must be administered, or null if no restriction (string | null)
10. indications: Array of covered diagnosis abbreviations e.g. ["RA", "PsA"] (string[])
11. quantity_limit: Dose and frequency limit, or null if not specified (string | null)
12. clinical_criteria: Specific score thresholds required e.g. "DAS28 >3.2", or null (string | null)
13. renewal_period: How often PA must be renewed e.g. "12 months", or null (string | null)
14. policy_version: Version number from document header/footer e.g. "v4.2" (string)
15. effective_date: Policy effective date in YYYY-MM-DD format (string)

If a field cannot be determined from the document, use null for nullable fields,
false for booleans, empty string for j_code, and empty array for arrays.
`;

const VALID_STATUSES: CoverageStatus[] = ['covered', 'pa_required', 'denied', 'not_covered'];

export class ExtractionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionValidationError';
  }
}

function validatePolicyDocument(raw: unknown, payerId: string): PolicyDocument {
  if (!raw || typeof raw !== 'object') {
    throw new ExtractionValidationError('Extraction returned non-object response');
  }

  const doc = raw as Record<string, unknown>;
  const required = ['drug_name', 'drug_generic', 'coverage_status', 'policy_version', 'effective_date'];

  for (const field of required) {
    if (!doc[field] || typeof doc[field] !== 'string' || (doc[field] as string).trim() === '') {
      throw new ExtractionValidationError(`Required field missing or empty: ${field}`);
    }
  }

  if (!VALID_STATUSES.includes(doc.coverage_status as CoverageStatus)) {
    throw new ExtractionValidationError(`Invalid coverage_status: ${doc.coverage_status}`);
  }

  const drugGeneric = (doc.drug_generic as string).toLowerCase().trim();
  const drugId = drugGeneric.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return {
    id:                  uuidv4(),
    payer_id:            payerId,
    drug_id:             drugId,
    drug_name:           doc.drug_name as string,
    drug_generic:        doc.drug_generic as string,
    j_code:              typeof doc.j_code === 'string' ? doc.j_code : '',
    coverage_status:     doc.coverage_status as CoverageStatus,
    prior_auth_required: typeof doc.prior_auth_required === 'boolean' ? doc.prior_auth_required : false,
    prior_auth_criteria: typeof doc.prior_auth_criteria === 'string'
      ? doc.prior_auth_criteria.slice(0, 500)
      : '',
    step_therapy:        typeof doc.step_therapy === 'boolean' ? doc.step_therapy : false,
    step_therapy_drugs:  Array.isArray(doc.step_therapy_drugs) ? doc.step_therapy_drugs as string[] : [],
    site_of_care:        typeof doc.site_of_care === 'string' ? doc.site_of_care : null,
    indications:         Array.isArray(doc.indications) ? doc.indications as string[] : [],
    quantity_limit:      typeof doc.quantity_limit === 'string' ? doc.quantity_limit : null,
    clinical_criteria:   typeof doc.clinical_criteria === 'string' ? doc.clinical_criteria : null,
    renewal_period:      typeof doc.renewal_period === 'string' ? doc.renewal_period : null,
    policy_version:      doc.policy_version as string,
    effective_date:      doc.effective_date as string,
    source_pdf_url:      null,
    extracted_at:        new Date().toISOString(),
    changed_fields:      [],
  };
}

export async function extractPolicyFromPdf(
  pdfBase64: string,
  payerId: string,
  drugName?: string
): Promise<PolicyDocument> {
  const userContent: Anthropic.MessageParam['content'] = [
    {
      type: 'text',
      text: drugName
        ? `Extract policy information for ${drugName} from this clinical policy document.`
        : 'Extract policy information from this clinical policy document.',
    },
    {
      type: 'image',
      source: {
        type:       'base64',
        media_type: 'application/pdf' as 'image/png', // Anthropic accepts PDF as image type
        data:       pdfBase64,
      },
    },
  ];

  const response = await claude.messages.create({
    model:      CLAUDE_MODEL,
    max_tokens: 2048,
    system:     EXTRACTION_SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new ExtractionValidationError('No text content in extraction response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text.trim());
  } catch {
    throw new ExtractionValidationError('Extraction response is not valid JSON');
  }

  return validatePolicyDocument(parsed, payerId);
}
