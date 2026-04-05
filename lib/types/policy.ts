// ── Policy Types — maps 1:1 to extraction briefing JSON schemas ────
// These types are the contract between Claude API extraction output,
// the validation layer, and Supabase table columns.

// ── Enums ──────────────────────────────────────────────────────────

export type CoverageStatus = 'covered' | 'not_covered' | 'no_policy_found' | 'pharmacy_only';
export type PolicyType = 'medical_benefit' | 'pharmacy_benefit' | 'both';
export type PlanType = 'commercial' | 'medicare' | 'medicaid';
export type FormularyTier = 'preferred_specialty' | 'non_specialty' | 'non_preferred' | 'not_covered';
export type RebateImplication = 'exclusive' | 'semi_exclusive' | 'competitive' | 'non_preferred';
export type StepDrugType = 'biosimilar' | 'reference_biologic' | 'chemotherapy' | 'targeted_therapy' | 'generic' | 'other';
export type DoseCalculation = 'flat_dose' | 'weight_based' | 'bsa_based';
export type AllowedSite = 'physician_office' | 'ambulatory_infusion_center' | 'home_infusion' | 'hospital_outpatient_department' | 'inpatient_hospital';

// ── Nested Structures ──────────────────────────────────────────────

export interface FormularyPosition {
  rank:                number | null;
  total_on_tier:       number | null;
  position_label:      string | null;
  competing_drugs:     string[];
  rebate_implication:  RebateImplication | null;
}

export interface Indication {
  diagnosis:               string;
  diagnosis_code:          string | null;
  stage_severity:          string | null;
  line_of_therapy:         string | null;
  biomarker_requirements:  string[];
  combination_therapy:     string | null;
  monotherapy_allowed:     boolean | null;
  patient_population:      string | null;
  histology_type:          string | null;
  excluded_subtypes:       string[];
}

export interface PriorAuth {
  prescriber_requirements:   string | null;
  diagnosis_documentation:   string | null;
  biomarker_testing:         string[];
  performance_status:        string | null;
  prior_treatment_failure:   string | null;
  lab_requirements:          string[];
  imaging_requirements:      string | null;
  duration_requirements:     string | null;
  tumor_board_required:      boolean | null;
  clinical_trial_considered: boolean | null;
  renewal_criteria:          string | null;
  pa_frequency:              string | null;
  criteria_text:             string;
}

export interface StepTherapyStep {
  step_number:              number;
  drug_name:                string;
  drug_type:                StepDrugType;
  min_trial_duration:       string | null;
  failure_definition:       string | null;
  acceptable_alternatives:  string[];
}

export interface StepTherapy {
  steps:                          StepTherapyStep[];
  bypass_conditions:              string | null;
  prior_payer_treatment_counts:   boolean | null;
  documentation_required:         string | null;
  applies_to_all_indications:     boolean | null;
}

export interface CoveredAlternative {
  drug_name:     string;
  j_code:        string | null;
  is_biosimilar: boolean;
  pa_required:   boolean | null;
}

export interface SiteOfCare {
  allowed_sites:         AllowedSite[];
  restricted_sites:      AllowedSite[];
  preferred_site:        AllowedSite | null;
  site_of_care_program:  boolean;
}

export interface Dosing {
  dose_amount:             string | null;
  dose_calculation:        DoseCalculation | null;
  frequency:               string | null;
  max_quantity:            string | null;
  max_treatment_duration:  string | null;
  max_cycles:              number | null;
  wastage_policy:          string | null;
}

export interface PriceInfo {
  amount:            number | null;
  unit:              string | null;
  pricing_basis:     string | null;
  appears_in_policy: boolean;
}

export interface CopayInfo {
  amount:              number | null;
  percentage:          number | null;
  frequency:           string | null;
  assistance_program:  string | null;
  appears_in_policy:   boolean;
}

export interface RebateInfo {
  percentage:         number | null;
  type:               string | null;
  conditions:         string | null;
  appears_in_policy:  boolean;
}

export interface PolicyFlags {
  pa_flag:  boolean;
  sos_flag: boolean;
  cc_flag:  boolean;
  ca_flag:  boolean;
}

// ── Main Types ─────────────────────────────────────────────────────

export interface MedicalBenefitPolicy {
  // DB-generated (not from extraction)
  id:            string;
  created_at:    string;
  updated_at:    string;
  source_url:    string | null;
  source_type:   'pdf_upload' | 'url_paste' | 'auto_fetch';
  extracted_at:  string;

  // Drug identity
  drug_name:     string;
  drug_generic:  string;
  j_code:        string;
  drug_category: string;

  // Payer & plan
  payer_name:            string;
  payer_id:              string;   // Slugified payer name for lookups
  plan_types:            PlanType[];
  policy_type:           PolicyType;

  // Coverage
  coverage_status:       CoverageStatus;
  medical_policy_exists: boolean;

  // Formulary
  formulary_tier:        FormularyTier | null;
  formulary_position:    FormularyPosition | null;

  // Clinical details
  indications:           Indication[];
  prior_auth_required:   boolean;
  prior_auth:            PriorAuth | null;
  step_therapy_required: boolean;
  step_therapy:          StepTherapy | null;
  covered_alternatives:  CoveredAlternative[];
  site_of_care:          SiteOfCare | null;
  dosing:                Dosing | null;

  // Policy metadata
  effective_date:          string;
  last_reviewed_date:      string | null;
  next_review_date:        string | null;
  policy_version:          string;
  supersedes_version:      string | null;
  source_document_title:   string | null;

  // Financials (rarely populated)
  price:   PriceInfo;
  copay:   CopayInfo;
  rebate:  RebateInfo;

  // Flags
  flags:   PolicyFlags;

  // Change tracking (populated by diff system, not extraction)
  changed_fields: string[];
}

export interface PharmacyBenefitPolicy {
  // DB-generated
  id:          string;
  created_at:  string;
  updated_at:  string;
  source_url:  string | null;
  source_type: 'pdf_upload' | 'url_paste' | 'auto_fetch';
  extracted_at: string;

  // From extraction
  policy_type:           'pharmacy_benefit';
  drug_name:             string;
  drug_generic:          string;
  j_code:                string;
  ndc:                   string | null;
  payer_name:            string;
  payer_id:              string;
  plan_types:            PlanType[];
  drug_category:         string;
  formulary_tier:        string | null;
  coverage_status:       CoverageStatus;
  prior_auth_required:   boolean;
  step_therapy_required: boolean;
  quantity_limit:        string | null;
  effective_date:        string;
  policy_version:        string;
  notes:                 string | null;
}

// ── Extraction output (what Claude returns, before DB fields added) ──

export type MedicalExtractionResult = Omit<MedicalBenefitPolicy,
  'id' | 'created_at' | 'updated_at' | 'source_url' | 'source_type' | 'extracted_at' | 'payer_id' | 'changed_fields'
>;

export type PharmacyExtractionResult = Omit<PharmacyBenefitPolicy,
  'id' | 'created_at' | 'updated_at' | 'source_url' | 'source_type' | 'extracted_at' | 'payer_id'
>;

// ── Ingestion request types ────────────────────────────────────────

export type IngestionSource = 'pdf_upload' | 'url_paste' | 'auto_fetch';

export interface IngestionRequest {
  drug_name?:   string;
  hcpcs_code?:  string;
  payer_name:   string;
  source:       IngestionSource;
  pdf_base64?:  string;       // For pdf_upload
  url?:         string;       // For url_paste
  // auto_fetch uses MCP server — no additional input needed
}

export interface IngestionResult {
  success:            boolean;
  policy_type:        PolicyType;
  medical_policies:   MedicalBenefitPolicy[];
  pharmacy_policies:  PharmacyBenefitPolicy[];
  /** @deprecated Use medical_policies[0] — kept for single-policy compat */
  medical_policy?:    MedicalBenefitPolicy;
  /** @deprecated Use pharmacy_policies[0] — kept for single-policy compat */
  pharmacy_policy?:   PharmacyBenefitPolicy;
  error?:             string;
}
