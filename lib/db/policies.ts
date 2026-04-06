// ── Supabase CRUD for policy tables ────────────────────────────────

import { supabase } from '../supabase';
import type { MedicalBenefitPolicy, PharmacyBenefitPolicy } from '../types/policy';

export async function saveMedicalPolicy(policy: MedicalBenefitPolicy) {
  const { data, error } = await supabase
    .from('medical_benefit_policies')
    .upsert(
      {
        id:                    policy.id,
        source_url:            policy.source_url,
        source_type:           policy.source_type,
        extracted_at:          policy.extracted_at,
        drug_name:             policy.drug_name,
        drug_generic:          policy.drug_generic,
        j_code:                policy.j_code,
        drug_category:         policy.drug_category,
        payer_name:            policy.payer_name,
        payer_id:              policy.payer_id,
        plan_types:            policy.plan_types,
        policy_type_value:     policy.policy_type,
        coverage_status:       policy.coverage_status,
        medical_policy_exists: policy.medical_policy_exists,
        formulary_tier:        policy.formulary_tier,
        formulary_position:    policy.formulary_position,
        indications:           policy.indications,
        prior_auth_required:   policy.prior_auth_required,
        prior_auth:            policy.prior_auth,
        step_therapy_required: policy.step_therapy_required,
        step_therapy:          policy.step_therapy,
        covered_alternatives:  policy.covered_alternatives,
        site_of_care:          policy.site_of_care,
        dosing:                policy.dosing,
        effective_date:        policy.effective_date,
        last_reviewed_date:    policy.last_reviewed_date,
        next_review_date:      policy.next_review_date,
        policy_version:        policy.policy_version,
        supersedes_version:    policy.supersedes_version,
        source_document_title: policy.source_document_title,
        price:                 policy.price,
        copay:                 policy.copay,
        rebate:                policy.rebate,
        flags:                 policy.flags,
        changed_fields:        policy.changed_fields,
      },
      { onConflict: 'payer_id,drug_generic,effective_date' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save medical policy: ${error.message}`);
  return data;
}

export async function savePharmacyPolicy(policy: PharmacyBenefitPolicy) {
  const { data, error } = await supabase
    .from('pharmacy_benefit_policies')
    .upsert(
      {
        id:                    policy.id,
        source_url:            policy.source_url,
        source_type:           policy.source_type,
        extracted_at:          policy.extracted_at,
        drug_name:             policy.drug_name,
        drug_generic:          policy.drug_generic,
        j_code:                policy.j_code,
        ndc:                   policy.ndc,
        drug_category:         policy.drug_category,
        payer_name:            policy.payer_name,
        payer_id:              policy.payer_id,
        plan_types:            policy.plan_types,
        coverage_status:       policy.coverage_status,
        formulary_tier:        policy.formulary_tier,
        prior_auth_required:   policy.prior_auth_required,
        step_therapy_required: policy.step_therapy_required,
        quantity_limit:        policy.quantity_limit,
        effective_date:        policy.effective_date,
        policy_version:        policy.policy_version,
        notes:                 policy.notes,
      },
      { onConflict: 'payer_id,drug_generic,effective_date' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save pharmacy policy: ${error.message}`);
  return data;
}

export async function getMedicalPolicy(payerId: string, drugGeneric: string) {
  const { data, error } = await supabase
    .from('medical_benefit_policies')
    .select('*')
    .eq('payer_id', payerId)
    .eq('drug_generic', drugGeneric)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

// ── Library queries ───────────────────────────────────────────────

export async function getAllLibraryPolicies() {
  const { data, error } = await supabase
    .from('medical_benefit_policies')
    .select('*')
    .order('drug_name', { ascending: true })
    .order('effective_date', { ascending: false });

  if (error) throw new Error(`Failed to fetch library policies: ${error.message}`);
  return (data ?? []) as MedicalBenefitPolicy[];
}

export async function getPoliciesByDrug(drugGeneric: string) {
  const { data, error } = await supabase
    .from('medical_benefit_policies')
    .select('*')
    .eq('drug_generic', drugGeneric.toLowerCase())
    .order('payer_name', { ascending: true });

  if (error) throw new Error(`Failed to fetch policies for drug: ${error.message}`);
  return (data ?? []) as MedicalBenefitPolicy[];
}

export async function getPharmacyPolicy(payerId: string, drugGeneric: string) {
  const { data, error } = await supabase
    .from('pharmacy_benefit_policies')
    .select('*')
    .eq('payer_id', payerId)
    .eq('drug_generic', drugGeneric)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}
