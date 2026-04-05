// ── Policy Extraction Engine ────────────────────────────────────────
// Sends documents to Claude API with the extraction briefing,
// validates output, routes to medical or pharmacy table.

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { claude, CLAUDE_MODEL } from './ai';
import { EXTRACTION_BRIEFING } from './prompts/extraction-briefing';
import type {
  MedicalBenefitPolicy,
  PharmacyBenefitPolicy,
  MedicalExtractionResult,
  PharmacyExtractionResult,
  CoverageStatus,
  PolicyType,
  IngestionSource,
  IngestionResult,
} from './types/policy';

// ── Validation ─────────────────────────────────────────────────────

export class ExtractionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionValidationError';
  }
}

const VALID_COVERAGE: CoverageStatus[] = ['covered', 'not_covered', 'no_policy_found', 'pharmacy_only'];

function slugifyPayer(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Casting unknown Claude API output to typed schema */
function validateMedicalExtraction(raw: unknown): MedicalExtractionResult {
  if (!raw || typeof raw !== 'object') {
    throw new ExtractionValidationError('Extraction returned non-object response');
  }

  const doc = raw as Record<string, unknown>;

  // Soft defaults — never throw on missing fields, use fallbacks
  const str = (key: string, fallback = '') =>
    typeof doc[key] === 'string' && (doc[key] as string).trim() !== '' ? (doc[key] as string) : fallback;

  const coverageStatus: CoverageStatus = VALID_COVERAGE.includes(doc.coverage_status as CoverageStatus)
    ? (doc.coverage_status as CoverageStatus)
    : 'covered';

  return {
    drug_name:             str('drug_name', 'Unknown Drug'),
    drug_generic:          str('drug_generic', 'unknown').toLowerCase().trim(),
    j_code:                typeof doc.j_code === 'string' ? doc.j_code : '',
    drug_category:         typeof doc.drug_category === 'string' ? doc.drug_category : '',
    payer_name:            typeof doc.payer_name === 'string' ? doc.payer_name : '',
    plan_types:            Array.isArray(doc.plan_types) ? doc.plan_types : [],
    policy_type:           (['medical_benefit', 'pharmacy_benefit', 'both'].includes(doc.policy_type as string)
                            ? doc.policy_type as PolicyType : 'medical_benefit'),
    coverage_status:       coverageStatus,
    medical_policy_exists: typeof doc.medical_policy_exists === 'boolean' ? doc.medical_policy_exists : true,
    formulary_tier:        typeof doc.formulary_tier === 'string' ? doc.formulary_tier as any : null,
    formulary_position:    doc.formulary_position && typeof doc.formulary_position === 'object' ? doc.formulary_position as any : null,
    indications:           Array.isArray(doc.indications) ? doc.indications as any : [],
    prior_auth_required:   typeof doc.prior_auth_required === 'boolean' ? doc.prior_auth_required : false,
    prior_auth:            doc.prior_auth && typeof doc.prior_auth === 'object' ? doc.prior_auth as any : null,
    step_therapy_required: typeof doc.step_therapy_required === 'boolean' ? doc.step_therapy_required : false,
    step_therapy:          doc.step_therapy && typeof doc.step_therapy === 'object' ? doc.step_therapy as any : null,
    covered_alternatives:  Array.isArray(doc.covered_alternatives) ? doc.covered_alternatives as any : [],
    site_of_care:          doc.site_of_care && typeof doc.site_of_care === 'object' ? doc.site_of_care as any : null,
    dosing:                doc.dosing && typeof doc.dosing === 'object' ? doc.dosing as any : null,
    effective_date:        str('effective_date', new Date().toISOString().split('T')[0]),
    last_reviewed_date:    typeof doc.last_reviewed_date === 'string' ? doc.last_reviewed_date : null,
    next_review_date:      typeof doc.next_review_date === 'string' ? doc.next_review_date : null,
    policy_version:        typeof doc.policy_version === 'string' ? doc.policy_version : '',
    supersedes_version:    typeof doc.supersedes_version === 'string' ? doc.supersedes_version : null,
    source_document_title: typeof doc.source_document_title === 'string' ? doc.source_document_title : null,
    price:                 doc.price && typeof doc.price === 'object' ? doc.price as any : { amount: null, unit: null, pricing_basis: null, appears_in_policy: false },
    copay:                 doc.copay && typeof doc.copay === 'object' ? doc.copay as any : { amount: null, percentage: null, frequency: null, assistance_program: null, appears_in_policy: false },
    rebate:                doc.rebate && typeof doc.rebate === 'object' ? doc.rebate as any : { percentage: null, type: null, conditions: null, appears_in_policy: false },
    flags:                 doc.flags && typeof doc.flags === 'object' ? doc.flags as any : { pa_flag: false, sos_flag: false, cc_flag: false, ca_flag: false },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

function validatePharmacyExtraction(raw: unknown): PharmacyExtractionResult {
  if (!raw || typeof raw !== 'object') {
    throw new ExtractionValidationError('Pharmacy extraction returned non-object response');
  }

  const doc = raw as Record<string, unknown>;

  return {
    policy_type:           'pharmacy_benefit',
    drug_name:             typeof doc.drug_name === 'string' ? doc.drug_name : '',
    drug_generic:          typeof doc.drug_generic === 'string' ? (doc.drug_generic as string).toLowerCase().trim() : '',
    j_code:                typeof doc.j_code === 'string' ? doc.j_code : '',
    ndc:                   typeof doc.ndc === 'string' ? doc.ndc : null,
    payer_name:            typeof doc.payer_name === 'string' ? doc.payer_name : '',
    plan_types:            Array.isArray(doc.plan_types) ? doc.plan_types : [],
    drug_category:         typeof doc.drug_category === 'string' ? doc.drug_category : '',
    formulary_tier:        typeof doc.formulary_tier === 'string' ? doc.formulary_tier : null,
    coverage_status:       VALID_COVERAGE.includes(doc.coverage_status as CoverageStatus)
                            ? doc.coverage_status as CoverageStatus : 'no_policy_found',
    prior_auth_required:   typeof doc.prior_auth_required === 'boolean' ? doc.prior_auth_required : false,
    step_therapy_required: typeof doc.step_therapy_required === 'boolean' ? doc.step_therapy_required : false,
    quantity_limit:        typeof doc.quantity_limit === 'string' ? doc.quantity_limit : null,
    effective_date:        typeof doc.effective_date === 'string' ? doc.effective_date : new Date().toISOString().split('T')[0],
    policy_version:        typeof doc.policy_version === 'string' ? doc.policy_version : '',
    notes:                 typeof doc.notes === 'string' ? doc.notes : null,
  };
}

// ── Core extraction function ───────────────────────────────────────

async function callClaudeExtraction(
  content: Anthropic.MessageParam['content'],
  drugHint?: string,
  payerHint?: string,
): Promise<unknown> {
  const userText = [
    'Extract policy information from this clinical policy document.',
    drugHint ? `Drug to extract: ${drugHint}` : null,
    // Only provide a payer hint if we actually know it (not "Unknown")
    payerHint && payerHint !== 'Unknown' ? `Payer hint: ${payerHint}` : 'Determine the payer name from the document content.',
    'If the document covers MULTIPLE payers, set payer_name to all payer names separated by " | " (e.g. "Aetna | UnitedHealthcare | Cigna"). If only one payer, use their full name.',
    'Return ONLY the JSON object. No markdown, no explanation.',
  ].filter(Boolean).join('\n');

  const userContent: Anthropic.MessageParam['content'] = Array.isArray(content)
    ? [{ type: 'text' as const, text: userText }, ...content]
    : [{ type: 'text' as const, text: `${userText}\n\nDocument text:\n${content}` }];

  const response = await claude.messages.create({
    model:      CLAUDE_MODEL,
    max_tokens: 8192,
    system:     EXTRACTION_BRIEFING,
    messages:   [{ role: 'user', content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new ExtractionValidationError('No text content in extraction response');
  }

  try {
    return JSON.parse(textBlock.text.trim());
  } catch {
    // Try to extract JSON from response if Claude wrapped it
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new ExtractionValidationError('Extraction response is not valid JSON');
  }
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Extract from PDF (base64 encoded)
 */
export async function extractFromPdf(
  pdfBase64: string,
  payerName: string,
  drugName?: string,
  source: IngestionSource = 'pdf_upload',
  sourceUrl?: string,
): Promise<IngestionResult> {
  const documentContent: Anthropic.DocumentBlockParam = {
    type:   'document',
    source: {
      type:       'base64',
      media_type: 'application/pdf',
      data:       pdfBase64,
    },
  };

  const raw = await callClaudeExtraction([documentContent], drugName, payerName);
  return routeExtractionResult(raw, payerName, source, sourceUrl);
}

/**
 * Extract from plain text (fetched document content)
 */
export async function extractFromText(
  documentText: string,
  payerName: string,
  drugName?: string,
  source: IngestionSource = 'auto_fetch',
  sourceUrl?: string,
): Promise<IngestionResult> {
  const raw = await callClaudeExtraction(documentText, drugName, payerName);
  return routeExtractionResult(raw, payerName, source, sourceUrl);
}

/**
 * Split a payer_name like "Aetna | UHC | Cigna" into individual names.
 * Returns at least one entry (falls back to the original string).
 */
function splitPayers(payerName: string): string[] {
  const parts = payerName.split('|').map(s => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [payerName];
}

/**
 * Route extraction result to medical or pharmacy table format.
 * When Claude returns multiple payers separated by " | ", this creates
 * one policy record per payer so each appears as its own entry in the library.
 */
function routeExtractionResult(
  raw: unknown,
  payerNameHint: string,
  source: IngestionSource,
  sourceUrl?: string,
): IngestionResult {
  const doc = raw as Record<string, unknown>;
  const policyType = doc.policy_type as string;
  const now = new Date().toISOString();

  // Use Claude's extracted payer_name if available, fall back to hint
  const extractedPayer = typeof doc.payer_name === 'string' && doc.payer_name.trim()
    ? doc.payer_name.trim()
    : payerNameHint;
  const resolvedPayer = extractedPayer !== 'Unknown' ? extractedPayer : 'Unknown Payer';

  // Split multi-payer names into individual payers
  const payers = splitPayers(resolvedPayer);

  // Pharmacy-only document
  if (policyType === 'pharmacy_benefit') {
    const validated = validatePharmacyExtraction(raw);
    const pharmacyPolicies: PharmacyBenefitPolicy[] = payers.map(payer => ({
      ...validated,
      id:           uuidv4(),
      created_at:   now,
      updated_at:   now,
      source_url:   sourceUrl ?? null,
      source_type:  source,
      extracted_at: now,
      payer_id:     slugifyPayer(payer),
      payer_name:   payer,
    }));

    return {
      success:            true,
      policy_type:        'pharmacy_benefit',
      medical_policies:   [],
      pharmacy_policies:  pharmacyPolicies,
      pharmacy_policy:    pharmacyPolicies[0],
    };
  }

  // Medical benefit (or both)
  const validated = validateMedicalExtraction(raw);

  const medicalPolicies: MedicalBenefitPolicy[] = payers.map(payer => ({
    ...validated,
    id:             uuidv4(),
    created_at:     now,
    updated_at:     now,
    source_url:     sourceUrl ?? null,
    source_type:    source,
    extracted_at:   now,
    payer_id:       slugifyPayer(payer),
    payer_name:     payer,
    changed_fields: [],
  }));

  const result: IngestionResult = {
    success:           true,
    policy_type:       validated.policy_type === 'both' ? 'both' : 'medical_benefit',
    medical_policies:  medicalPolicies,
    pharmacy_policies: [],
    medical_policy:    medicalPolicies[0],
  };

  // If policy_type is "both", also create pharmacy entries per payer
  if (validated.policy_type === 'both') {
    result.pharmacy_policies = payers.map(payer => ({
      id:                    uuidv4(),
      created_at:            now,
      updated_at:            now,
      source_url:            sourceUrl ?? null,
      source_type:           source,
      extracted_at:          now,
      policy_type:           'pharmacy_benefit' as const,
      drug_name:             validated.drug_name,
      drug_generic:          validated.drug_generic,
      j_code:                validated.j_code,
      ndc:                   null,
      payer_name:            payer,
      payer_id:              slugifyPayer(payer),
      plan_types:            validated.plan_types,
      drug_category:         validated.drug_category,
      formulary_tier:        validated.formulary_tier,
      coverage_status:       validated.coverage_status,
      prior_auth_required:   validated.prior_auth_required,
      step_therapy_required: validated.step_therapy_required,
      quantity_limit:        validated.dosing?.max_quantity ?? null,
      effective_date:        validated.effective_date,
      policy_version:        validated.policy_version,
      notes:                 'Detected from medical benefit document that also covers pharmacy benefit.',
    }));
    result.pharmacy_policy = result.pharmacy_policies[0];
  }

  return result;
}
