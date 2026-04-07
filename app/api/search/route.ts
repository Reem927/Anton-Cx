// ── Policy search endpoint — queries both policy tables ──────────────

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface SearchResult {
  policy_id: string;
  chunk_text: string;
  similarity: number;
  metadata: {
    payer_id: string;
    drug_name: string;
    section?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q");
    const payer_id = searchParams.get("payer_id") ?? undefined;
    const drug_name = searchParams.get("drug_name") ?? undefined;

    if (!q) {
      return NextResponse.json(
        { error: "Missing required query parameter: q" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Query policy_documents
    let pdQuery = supabase
      .from("policy_documents")
      .select("*")
      .or(`drug_name.ilike.%${q}%,drug_generic.ilike.%${q}%,prior_auth_criteria.ilike.%${q}%,payer_id.ilike.%${q}%`)
      .limit(20);

    if (payer_id)  pdQuery = pdQuery.eq("payer_id", payer_id);
    if (drug_name) pdQuery = pdQuery.ilike("drug_name", `%${drug_name}%`);

    // Query medical_benefit_policies
    let mbpQuery = supabase
      .from("medical_benefit_policies")
      .select("*")
      .or(`drug_name.ilike.%${q}%,drug_generic.ilike.%${q}%,payer_id.ilike.%${q}%,payer_name.ilike.%${q}%`)
      .limit(20);

    if (payer_id)  mbpQuery = mbpQuery.eq("payer_id", payer_id);
    if (drug_name) mbpQuery = mbpQuery.ilike("drug_name", `%${drug_name}%`);

    const [pdResult, mbpResult] = await Promise.all([pdQuery, mbpQuery]);

    const pdRows  = pdResult.error  ? [] : (pdResult.data  ?? []);
    const mbpRows = mbpResult.error ? [] : (mbpResult.data ?? []);

    // Map policy_documents rows
    const pdResults: SearchResult[] = pdRows.map((policy: Record<string, unknown>) => ({
      policy_id: policy.id as string,
      chunk_text: `${policy.drug_name} (${policy.drug_generic}) - ${policy.payer_id}\n\nCoverage: ${policy.coverage_status}\nPrior Auth: ${policy.prior_auth_required ? 'Required' : 'Not Required'}\nStep Therapy: ${policy.step_therapy ? 'Required' : 'Not Required'}\nQuantity Limit: ${policy.quantity_limit || 'None'}\n\nCriteria: ${policy.prior_auth_criteria || 'No specific criteria listed'}`,
      similarity: 0.9,
      metadata: {
        payer_id: policy.payer_id as string,
        drug_name: policy.drug_name as string,
        section: 'policy_overview',
      },
    }));

    // Map medical_benefit_policies rows
    const mbpResults: SearchResult[] = mbpRows.map((row: Record<string, unknown>) => {
      const pa = row.prior_auth as Record<string, unknown> | null;
      return {
        policy_id: row.id as string,
        chunk_text: `${row.drug_name} (${row.drug_generic}) - ${row.payer_name}\n\nCoverage: ${row.coverage_status}\nPrior Auth: ${row.prior_auth_required ? 'Required' : 'Not Required'}\nStep Therapy: ${row.step_therapy_required ? 'Required' : 'Not Required'}\n\nCriteria: ${(pa?.criteria_text as string) || 'No specific criteria listed'}`,
        similarity: 0.85,
        metadata: {
          payer_id: row.payer_id as string,
          drug_name: row.drug_name as string,
          section: 'medical_benefit',
        },
      };
    });

    // Deduplicate by payer_id + drug_generic
    const seen = new Set(pdResults.map(r => `${r.metadata.payer_id}:${r.metadata.drug_name}`));
    const uniqueMbp = mbpResults.filter(r => !seen.has(`${r.metadata.payer_id}:${r.metadata.drug_name}`));

    return NextResponse.json([...pdResults, ...uniqueMbp], { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
