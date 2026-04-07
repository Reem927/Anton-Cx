import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Map a medical_benefit_policies row to the PolicyDocument shape
 * used by dashboard, policy-lib, search, and changes pages.
 */
function medicalToPolicyDoc(row: Record<string, unknown>) {
  const indications = Array.isArray(row.indications)
    ? (row.indications as Array<Record<string, unknown>>).map(
        (ind) => (typeof ind === 'string' ? ind : (ind.diagnosis as string) ?? ''),
      ).filter(Boolean)
    : [];

  const stepTherapyDrugs: string[] = [];
  const st = row.step_therapy as Record<string, unknown> | null;
  if (st && Array.isArray(st.steps)) {
    for (const step of st.steps as Array<Record<string, unknown>>) {
      if (step.drug_name) stepTherapyDrugs.push(step.drug_name as string);
    }
  }

  const pa = row.prior_auth as Record<string, unknown> | null;

  return {
    id:                  row.id as string,
    payer_id:            row.payer_id as string,
    drug_name:           row.drug_name as string,
    drug_generic:        (row.drug_generic as string) ?? (row.drug_name as string ?? '').toLowerCase(),
    drug_id:             (row.payer_id as string) + '-' + ((row.drug_generic as string) ?? (row.drug_name as string ?? '').toLowerCase()),
    j_code:              (row.j_code as string) ?? '',
    coverage_status:     row.coverage_status as string,
    formulary_tier:      (row.formulary_tier as string) ?? null,
    prior_auth_required: (row.prior_auth_required as boolean) ?? false,
    prior_auth_criteria: (pa?.criteria_text as string) ?? '',
    step_therapy:        (row.step_therapy_required as boolean) ?? false,
    step_therapy_drugs:  stepTherapyDrugs,
    site_of_care:        null,
    indications,
    quantity_limit:      null,
    clinical_criteria:   null,
    renewal_period:      (pa?.renewal_criteria as string) ?? null,
    policy_version:      (row.policy_version as string) ?? '',
    effective_date:      (row.effective_date as string) ?? '',
    source_pdf_url:      (row.source_url as string) ?? null,
    extracted_at:        (row.extracted_at as string) ?? (row.created_at as string) ?? '',
    changed_fields:      (row.changed_fields as string[]) ?? [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const payer_id   = searchParams.get('payer_id')   ?? undefined;
    const drug_id    = searchParams.get('drug_id')    ?? undefined;
    const drug_name  = searchParams.get('drug_name')  ?? undefined;
    const date_from  = searchParams.get('date_from')  ?? undefined;
    const date_to    = searchParams.get('date_to')    ?? undefined;

    const supabase = await createClient();

    // ── Query policy_documents table ──
    let pdQuery = supabase
      .from('policy_documents')
      .select('*')
      .order('drug_name', { ascending: true })
      .order('effective_date', { ascending: false });

    if (payer_id)  pdQuery = pdQuery.eq('payer_id', payer_id);
    if (drug_id)   pdQuery = pdQuery.eq('drug_id', drug_id);
    if (drug_name) pdQuery = pdQuery.ilike('drug_name', `%${drug_name}%`);
    if (date_from) pdQuery = pdQuery.gte('effective_date', date_from);
    if (date_to)   pdQuery = pdQuery.lte('effective_date', date_to);

    // ── Query medical_benefit_policies table ──
    let mbpQuery = supabase
      .from('medical_benefit_policies')
      .select('*')
      .order('drug_name', { ascending: true })
      .order('effective_date', { ascending: false });

    if (payer_id)  mbpQuery = mbpQuery.eq('payer_id', payer_id);
    if (drug_name) mbpQuery = mbpQuery.ilike('drug_name', `%${drug_name}%`);
    if (date_from) mbpQuery = mbpQuery.gte('effective_date', date_from);
    if (date_to)   mbpQuery = mbpQuery.lte('effective_date', date_to);

    const [pdResult, mbpResult] = await Promise.all([pdQuery, mbpQuery]);

    const pdRows  = pdResult.error  ? [] : (pdResult.data  ?? []);
    const mbpRows = mbpResult.error ? [] : (mbpResult.data ?? []);

    // Map medical rows to PolicyDocument shape and merge
    const mappedMbp = mbpRows.map((row) => medicalToPolicyDoc(row as Record<string, unknown>));

    // Deduplicate: if same payer_id + drug_generic + effective_date exists in both, prefer policy_documents
    const seen = new Set(
      pdRows.map((r: Record<string, unknown>) =>
        `${r.payer_id}:${(r.drug_generic as string ?? '').toLowerCase()}:${r.effective_date}`,
      ),
    );
    const uniqueMbp = mappedMbp.filter(
      (r) => !seen.has(`${r.payer_id}:${r.drug_generic.toLowerCase()}:${r.effective_date}`),
    );

    const combined = [...pdRows, ...uniqueMbp];

    return NextResponse.json(combined, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
