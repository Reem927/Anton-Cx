// ── Simple policy search endpoint with fallback to seed data ─────────────────────

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SEED_POLICIES } from "@/lib/seed-data";

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

function searchSeedPolicies(query: string, options?: {
  filterPayerId?: string;
  filterDrugName?: string;
  matchCount?: number;
}): SearchResult[] {
  const queryLower = query.toLowerCase();
  const maxResults = options?.matchCount ?? 20;
  
  let filteredPolicies = SEED_POLICIES.filter(policy => {
    // Text matching
    const textMatch = 
      policy.drug_name.toLowerCase().includes(queryLower) ||
      policy.drug_generic.toLowerCase().includes(queryLower) ||
      policy.payer_id.toLowerCase().includes(queryLower) ||
      (policy.prior_auth_criteria && policy.prior_auth_criteria.toLowerCase().includes(queryLower)) ||
      policy.indications.some(indication => indication.toLowerCase().includes(queryLower));
    
    if (!textMatch) return false;
    
    // Apply filters
    if (options?.filterPayerId && policy.payer_id !== options.filterPayerId) return false;
    if (options?.filterDrugName && !policy.drug_name.toLowerCase().includes(options.filterDrugName.toLowerCase())) return false;
    
    return true;
  });

  // Convert to search results format
  return filteredPolicies.slice(0, maxResults).map(policy => ({
    policy_id: policy.id,
    chunk_text: `${policy.drug_name} (${policy.drug_generic}) - ${policy.payer_id}\n\nCoverage: ${policy.coverage_status}\nPrior Auth: ${policy.prior_auth_required ? 'Required' : 'Not Required'}\nStep Therapy: ${policy.step_therapy ? 'Required' : 'Not Required'}\nQuantity Limit: ${policy.quantity_limit || 'None'}\n\nCriteria: ${policy.prior_auth_criteria || 'No specific criteria listed'}`,
    similarity: 0.8, // Mock similarity score
    metadata: {
      payer_id: policy.payer_id,
      drug_name: policy.drug_name,
      section: 'policy_overview'
    }
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q");
    const payer_id = searchParams.get("payer_id") ?? undefined;
    const drug_name = searchParams.get("drug_name") ?? undefined;
    const mode = searchParams.get("mode") ?? "search"; // "search" | "rag"

    if (!q) {
      return NextResponse.json(
        { error: "Missing required query parameter: q" },
        { status: 400 }
      );
    }

    // Try database search first
    try {
      const { data: dbResults, error: dbError } = await supabase
        .from("policy_documents")
        .select("*")
        .or(`drug_name.ilike.%${q}%,drug_generic.ilike.%${q}%,prior_auth_criteria.ilike.%${q}%`)
        .limit(20);

      if (!dbError && dbResults && dbResults.length > 0) {
        const results = dbResults.map(policy => ({
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
      }
    } catch (dbError) {
      console.log("Database search failed, using seed data fallback");
    }

    // Fallback to seed data search
    const results = searchSeedPolicies(q, {
      filterPayerId: payer_id,
      filterDrugName: drug_name,
      matchCount: 20
    });

    return NextResponse.json(results, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
