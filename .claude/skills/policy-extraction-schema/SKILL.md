---
name: policy-extraction-schema
description: >
  Anton Cx policy extraction schema and Anthropic API prompt spec.
  Auto-load when working on the extract API route, Prisma schema,
  seed data, or any file that imports or defines PolicyDocument.
---

# Policy extraction schema

## The normalized fields

Every ingested clinical policy PDF must produce exactly this structure.
Do not add fields. Do not remove fields. Do not rename fields.

```typescript
interface PolicyDocument {
  id:                   string       // uuid, generated server-side
  payer_id:             string       // lowercase slug: "aetna" | "uhc" | "cigna" | "bcbs-tx" | "humana" | "elevance" | "centene" | "kaiser"
  drug_name:            string       // brand name e.g. "Humira"
  drug_generic:         string       // INN e.g. "adalimumab"
  j_code:               string       // HCPCS J-code e.g. "J0135" — empty string if not found
  coverage_status:      'covered' | 'pa_required' | 'denied' | 'not_covered'
  prior_auth_required:  boolean
  prior_auth_criteria:  string       // verbatim extracted text, max 500 chars
  step_therapy:         boolean
  step_therapy_drugs:   string[]     // e.g. ["methotrexate", "sulfasalazine"]
  site_of_care:         string | null
  indications:          string[]     // covered diagnoses as abbreviations e.g. ["RA", "PsA", "CD"]
  quantity_limit:       string | null
  clinical_criteria:    string | null
  renewal_period:       string | null
  policy_version:       string       // e.g. "v4.2"
  effective_date:       string       // ISO date YYYY-MM-DD
  source_pdf_url:       string | null
  extracted_at:         string       // ISO datetime, set server-side
  changed_fields:       string[]     // populated by diff logic, not extraction
}
```

## Anthropic extraction prompt

```typescript
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
8. step_therapy_drugs: Array of drug names required before this drug (string[], empty array if none)
9. site_of_care: Where the drug must be administered, or null if no restriction (string | null)
10. indications: Array of covered diagnosis abbreviations e.g. ["RA", "PsA"] (string[])
11. quantity_limit: Dose and frequency limit, or null if not specified (string | null)
12. clinical_criteria: Specific score thresholds required e.g. "DAS28 >3.2", or null (string | null)
13. renewal_period: How often PA must be renewed e.g. "12 months", or null (string | null)
14. policy_version: Version number from document header/footer e.g. "v4.2" (string)
15. effective_date: Policy effective date in YYYY-MM-DD format (string)

If a field cannot be determined, use null for nullable fields, false for booleans,
empty string for j_code, and empty array for arrays.
`
```

## Validation

```typescript
function validatePolicyDocument(raw: unknown): PolicyDocument {
  const required = ['drug_name', 'drug_generic', 'coverage_status', 'policy_version', 'effective_date']
  const validStatuses = ['covered', 'pa_required', 'denied', 'not_covered']
  // Throw ExtractionValidationError if any required field is missing or status is invalid
}
```

## Diff algorithm

```typescript
const DIFFABLE_FIELDS = [
  'coverage_status', 'prior_auth_required', 'prior_auth_criteria',
  'step_therapy', 'step_therapy_drugs', 'site_of_care',
  'indications', 'quantity_limit', 'clinical_criteria', 'renewal_period'
]
// For arrays: compare sorted JSON.stringify
// For strings: trim and lowercase before comparison
```

## Gotchas

- `payer_id` is a slug, always lowercase, always hyphenated — never "BCBS TX" or "BCBSTx"
- `j_code` must match format `J####` exactly
- `prior_auth_criteria` is free text — preserve clinical language exactly, do not paraphrase
- `step_therapy_drugs` should use generic names, not brand names
- `effective_date` must be ISO format — convert "January 1, 2026" to "2026-01-01"
- `changed_fields` is NEVER populated by extraction — only by the diff route
