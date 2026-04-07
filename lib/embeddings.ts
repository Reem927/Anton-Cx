// ── Reem: Chunking + Embedding generation + pgvector storage ──────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { claude, CLAUDE_MODEL } from "./ai";
import { supabase } from "./supabase";

// ── Chunking ──────────────────────────────────────────────────────

export interface Chunk {
  text: string;
  index: number;
  metadata: {
    section?: string;
    payer_id: string;
    drug_name: string;
  };
}

export function chunkDocument(
  text: string,
  payer_id: string,
  drug_name: string,
  maxChars = 3200,
  overlapChars = 400
): Chunk[] {
  // Split on section headers first
  const sections = text.split(/\n(?=[A-Z][A-Z\s]{4,}:?\n)/);
  const chunks: Chunk[] = [];
  let index = 0;

  for (const section of sections) {
    const header = section.match(/^([A-Z][A-Z\s]{4,}):?\n/)?.[1];
    let remaining = section;

    while (remaining.length > 0) {
      chunks.push({
        text: remaining.slice(0, maxChars).trim(),
        index: index++,
        metadata: { section: header, payer_id, drug_name },
      });
      remaining = remaining.slice(Math.max(maxChars - overlapChars, 1));
    }
  }

  return chunks.filter((c) => c.text.length > 50);
}

// ── Embedding via Claude ──────────────────────────────────────────

/**
 * Generate embeddings using Claude.
 * Claude doesn't have a native embedding endpoint yet —
 * we use a structured prompt that returns a semantic fingerprint,
 * then store the text chunks directly for pgvector full-text + semantic search.
 *
 * When a dedicated embedding model is chosen (Voyage, Google, OpenAI),
 * swap this function body. The interface stays the same.
 */
export async function generateEmbedding(
  text: string,
  inputType: "document" | "query" = "document"
): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3",
      input: [text],
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage embedding failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding; // 1024-dimensional
}

// ── Store in pgvector ─────────────────────────────────────────────

export async function storeChunksWithEmbeddings(
  policyId: string,
  chunks: Chunk[]
): Promise<void> {
  const rows = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk.text);
      return {
        policy_id: policyId,
        chunk_index: chunk.index,
        chunk_text: chunk.text,
        embedding: embedding.length > 0 ? JSON.stringify(embedding) : null,
        metadata: chunk.metadata,
      };
    })
  );

  const { error } = await supabase
    .from("policy_embeddings")
    .upsert(rows, { onConflict: "policy_id,chunk_index" });

  if (error) throw new Error(`Embedding storage failed: ${error.message}`);
}

// ── Full pipeline: text → chunks → embeddings → pgvector ─────────

export async function ingestPolicyText(
  policyId: string,
  text: string,
  payer_id: string,
  drug_name: string
): Promise<number> {
  const chunks = chunkDocument(text, payer_id, drug_name);
  await storeChunksWithEmbeddings(policyId, chunks);
  return chunks.length;
}
