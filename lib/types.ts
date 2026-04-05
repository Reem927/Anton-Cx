export type CoverageStatus = 'covered' | 'not_covered' | 'no_policy_found' | 'pharmacy_only';
export type FormularyTier = 'preferred_specialty' | 'non_specialty' | 'non_preferred' | 'not_covered' | null;
export type Persona = 'analyst' | 'mfr' | 'plan';

export interface PolicyDocument {
  id:                   string;
  payer_id:             string;
  drug_name:            string;
  drug_generic:         string;
  j_code:               string;
  coverage_status:      CoverageStatus;
  formulary_tier:       FormularyTier;
  prior_auth_required:  boolean;
  prior_auth_criteria:  string;
  step_therapy:         boolean;
  step_therapy_drugs:   string[];
  site_of_care:         string | null;
  indications:          string[];
  quantity_limit:       string | null;
  clinical_criteria:    string | null;
  renewal_period:       string | null;
  policy_version:       string;
  effective_date:       string;
  source_pdf_url:       string | null;
  extracted_at:         string;
  changed_fields:       string[];
  drug_id:              string;
}

export type DiffChangeType = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffResult {
  field:        string;
  change_type:  DiffChangeType;
  prev_value:   unknown;
  next_value:   unknown;
}
