// ── Policy search endpoint — queries Supabase directly ──────────────

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

    let query = supabase
      .from("policy_documents")
      .select("*")
      .or(`drug_name.ilike.%${q}%,drug_generic.ilike.%${q}%,prior_auth_criteria.ilike.%${q}%,payer_id.ilike.%${q}%`)
      .limit(20);

    if (payer_id)   query = query.eq("payer_id", payer_id);
    if (drug_name)  query = query.ilike("drug_name", `%${drug_name}%`);

    const { data: rows, error } = await query;

    if (error) {
      console.error("Search query failed:", error.message);
      return NextResponse.json([], { status: 200 });
    }

    // Map to SearchResult shape for backwards compatibility
    const results: SearchResult[] = (rows ?? []).map(policy => ({
      policy_id: policy.id,
      chunk_text: `${policy.drug_name} (${policy.drug_generic}) - ${policy.payer_id}\n\nCoverage: ${policy.coverage_status}\nPrior Auth: ${policy.prior_auth_required ? 'Required' : 'Not Required'}\nStep Therapy: ${policy.step_therapy ? 'Required' : 'Not Required'}\nQuantity Limit: ${policy.quantity_limit || 'None'}\n\nCriteria: ${policy.prior_auth_criteria || 'No specific criteria listed'}`,
      similarity: 0.9,
      metadata: {
        payer_id: policy.payer_id,
        drug_name: policy.drug_name,
        section: 'policy_overview'
      }
    }));

    return NextResponse.json(results, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
