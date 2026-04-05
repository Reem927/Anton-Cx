// ── Policy Mapper ─────────────────────────────────────────────────
// Converts MedicalBenefitPolicy (extraction schema, Supabase) →
// PolicyDocument (library display schema, UI components).

import type { MedicalBenefitPolicy } from '../types/policy';
import type { PolicyDocument, CoverageStatus, FormularyTier } from '../types';

/**
 * Convert a MedicalBenefitPolicy row from Supabase into the
 * PolicyDocument shape that the library UI expects.
 *
 * Coverage status passes through directly — no remapping.
 * Formulary tier passes through directly.
 */
export function toLibraryPolicy(med: MedicalBenefitPolicy): PolicyDocument {
  const indications = Array.isArray(med.indications)
    ? med.indications.map(i =>
        typeof i === 'string' ? i : i.diagnosis ?? '',
      )
    : [];

  const stepDrugs = med.step_therapy?.steps?.map(s => s.drug_name) ?? [];

  const siteOfCare =
    med.site_of_care?.preferred_site ??
    med.site_of_care?.allowed_sites?.[0] ??
    null;

  const coverageStatus: CoverageStatus =
    (['covered', 'not_covered', 'no_policy_found', 'pharmacy_only'] as const)
      .includes(med.coverage_status as CoverageStatus)
      ? (med.coverage_status as CoverageStatus)
      : 'not_covered';

  const formularyTier: FormularyTier =
    (['preferred_specialty', 'non_specialty', 'non_preferred', 'not_covered'] as const)
      .includes(med.formulary_tier as NonNullable<FormularyTier>)
      ? (med.formulary_tier as FormularyTier)
      : null;

  return {
    id:                  med.id,
    payer_id:            med.payer_id,
    drug_name:           med.drug_name,
    drug_generic:        med.drug_generic,
    drug_id:             med.drug_generic,
    j_code:              med.j_code ?? '',
    coverage_status:     coverageStatus,
    formulary_tier:      formularyTier,
    prior_auth_required: med.prior_auth_required,
    prior_auth_criteria: med.prior_auth?.criteria_text ?? '',
    step_therapy:        med.step_therapy_required,
    step_therapy_drugs:  stepDrugs,
    site_of_care:        siteOfCare,
    indications,
    quantity_limit:      med.dosing?.max_quantity ?? null,
    clinical_criteria:   med.indications?.[0]?.biomarker_requirements?.join(', ') ?? null,
    renewal_period:      med.prior_auth?.renewal_criteria ?? null,
    policy_version:      med.policy_version ?? '',
    effective_date:      med.effective_date,
    source_pdf_url:      med.source_url ?? null,
    extracted_at:        med.extracted_at ?? new Date().toISOString(),
    changed_fields:      med.changed_fields ?? [],
  };
}

/**
 * Batch-convert an array of extraction results for library display.
 */
export function toLibraryPolicies(
  rows: MedicalBenefitPolicy[],
): PolicyDocument[] {
  return rows.map(toLibraryPolicy);
}
