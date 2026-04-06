// ── Reem: Vector similarity search for Policy Search page ─────────

import { supabase } from "./supabase";
import { claude, CLAUDE_MODEL } from "./ai";
import { generateEmbedding } from "./embeddings";

export interface SearchResult {
  policy_id: string;
  chunk_text: string;
  similarity: number;
  metadata: {
    payer_id: string;
    drug_name: string;
    section?: string;
  };
}

/**
 * Semantic search: embed the query, then find similar chunks via pgvector.
 * Falls back to Supabase full-text search if embeddings aren't stored yet.
 */
export async function searchPolicies(
  query: string,
  options?: {
    matchThreshold?: number;
    matchCount?: number;
    filterPayerId?: string;
    filterDrugName?: string;
  }
): Promise<SearchResult[]> {
  const threshold = options?.matchThreshold ?? 0.7;
  const count = options?.matchCount ?? 10;

  // Try vector search first
  const queryEmbedding = await generateEmbedding(query, "query");

  if (queryEmbedding.length > 0) {
    const { data, error } = await supabase.rpc("match_policy_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: count,
    });

    if (!error && data?.length > 0) {
      let results = data as SearchResult[];
      if (options?.filterPayerId) {
        results = results.filter((r) => r.metadata.payer_id === options.filterPayerId);
      }
      if (options?.filterDrugName) {
        results = results.filter((r) => r.metadata.drug_name === options.filterDrugName);
      }
      return results;
    }
  }

  // Fallback: Supabase full-text search on chunk_text
  let fallbackQuery = supabase
    .from("policy_embeddings")
    .select("policy_id, chunk_text, metadata")
    .textSearch("chunk_text", query, { type: "websearch" })
    .limit(count);

  if (options?.filterPayerId) {
    fallbackQuery = fallbackQuery.eq("metadata->>payer_id", options.filterPayerId);
  }

  const { data: fallbackData, error: fallbackError } = await fallbackQuery;

  if (fallbackError) throw new Error(`Search failed: ${fallbackError.message}`);

  return (fallbackData ?? []).map((row) => ({
    policy_id: row.policy_id,
    chunk_text: row.chunk_text,
    similarity: 1,
    metadata: row.metadata,
  }));
}

/**
 * RAG completion: search for relevant chunks, then ask Claude to answer
 * using only the retrieved context.
 */
export async function ragQuery(
  question: string,
  filters?: { payer_id?: string; drug_name?: string }
): Promise<{ answer: string; sources: SearchResult[] }> {
  const chunks = await searchPolicies(question, {
    matchCount: 8,
    filterPayerId: filters?.payer_id,
    filterDrugName: filters?.drug_name,
  });

  const context = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1} — ${c.metadata.payer_id} / ${c.metadata.drug_name}]\n${c.chunk_text}`
    )
    .join("\n\n---\n\n");

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system:
      "You are a clinical policy analyst for Anton Cx. Answer using ONLY the provided policy excerpts. If the answer is not in the context, say so. Always cite which payer/drug source you reference.",
    messages: [
      {
        role: "user",
        content: `## Retrieved Policy Context\n\n${context}\n\n---\n\n## Question\n${question}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return { answer: text, sources: chunks };
}
