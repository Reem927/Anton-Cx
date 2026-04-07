# RAG Pipeline — PDF → Chunks → Embeddings → Search → Completion

> Auto-load when working on PDF ingestion, text chunking, embedding generation,
> vector search, context assembly, or any file in the extraction/RAG pipeline.

---

## Pipeline Overview

```
PDF (base64 or URL)
  → Parse (pdf-parse / Claude Vision)
  → Chunk (section-aware, overlap)
  → Embed (Claude / Google API)
  → Store (Supabase pgvector)
  → Query (similarity search via RPC)
  → Assemble context window
  → Claude completion with retrieved chunks
  → Structured PolicyDocument output
```

---

## 1. PDF Parsing

### pdf-parse (text-based PDFs)
```ts
import pdf from "pdf-parse";

async function parsePdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text; // full text content
}
```

### Node Fetch for URL-based PDFs
```ts
async function fetchPdf(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PDF fetch failed: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### Claude Vision (scanned/image PDFs)
```ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function parsePdfWithVision(base64Pdf: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64Pdf },
        },
        {
          type: "text",
          text: "Extract all text content from this clinical policy document. Preserve section headers, criteria lists, and drug names exactly as written.",
        },
      ],
    }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}
```

### Strategy
- Try `pdf-parse` first (fast, no API cost)
- If extracted text is <100 chars or garbled → fall back to Claude Vision
- For URL sources: fetch → buffer → parse

---

## 2. Chunking

### Section-aware chunking
```ts
interface Chunk {
  text: string;
  index: number;
  metadata: {
    section?: string;   // e.g. "Prior Authorization Criteria"
    page?: number;
    payer_id: string;
    drug_name: string;
  };
}

function chunkDocument(
  text: string,
  options: {
    maxChunkSize?: number;   // default 800 tokens (~3200 chars)
    overlapSize?: number;    // default 100 tokens (~400 chars)
    payer_id: string;
    drug_name: string;
  }
): Chunk[] {
  const maxChars = (options.maxChunkSize ?? 800) * 4;
  const overlapChars = (options.overlapSize ?? 100) * 4;

  // Split on section headers first
  const sections = text.split(/\n(?=[A-Z][A-Z\s]{4,}:?\n)/);
  const chunks: Chunk[] = [];
  let index = 0;

  for (const section of sections) {
    const sectionHeader = section.match(/^([A-Z][A-Z\s]{4,}):?\n/)?.[1] ?? undefined;
    let remaining = section;

    while (remaining.length > 0) {
      const chunkText = remaining.slice(0, maxChars);
      chunks.push({
        text: chunkText.trim(),
        index: index++,
        metadata: {
          section: sectionHeader,
          payer_id: options.payer_id,
          drug_name: options.drug_name,
        },
      });

      // Advance with overlap
      const advance = Math.max(maxChars - overlapChars, 1);
      remaining = remaining.slice(advance);
    }
  }

  return chunks.filter((c) => c.text.length > 50); // drop tiny fragments
}
```

### Chunking rules
- **Max chunk size:** 800 tokens (~3200 chars) — fits well in context window
- **Overlap:** 100 tokens (~400 chars) — preserves cross-boundary context
- **Section-aware:** Split on section headers before size-based splitting
- **Filter:** Drop chunks under 50 chars (headers, footers, page numbers)

---

## 3. Embedding Generation

### Using Claude (Voyage via Anthropic)
```ts
// Note: If using Anthropic's embedding endpoint or a third-party
// embedding model, adjust the endpoint and dimensions accordingly.

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Batch in groups of 20 (API limit)
  const batchSize = 20;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "voyage-3",
        input: batch,
        input_type: "document",
      }),
    });

    const data = await response.json();
    allEmbeddings.push(...data.data.map((d: { embedding: number[] }) => d.embedding));
  }

  return allEmbeddings;
}
```

### Using Google (text-embedding-004)
```ts
async function generateEmbeddingsGoogle(texts: string[]): Promise<number[][]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${process.env.GOOGLE_AI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] },
        })),
      }),
    }
  );
  const data = await response.json();
  return data.embeddings.map((e: { values: number[] }) => e.values);
}
```

### Embedding dimensions reference
| Model | Dimensions | Notes |
|---|---|---|
| voyage-3 | 1024 | Best for retrieval |
| text-embedding-004 (Google) | 768 | Free tier available |
| text-embedding-3-small (OpenAI) | 1536 | If needed later |

**IMPORTANT:** The `VECTOR(n)` dimension in your pgvector table MUST match the model output dimension.

---

## 4. Vector Storage (pgvector via Supabase)

### Upsert embeddings
```ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function storeEmbeddings(
  policyId: string,
  chunks: Chunk[],
  embeddings: number[][]
): Promise<void> {
  const rows = chunks.map((chunk, i) => ({
    policy_id: policyId,
    chunk_index: chunk.index,
    chunk_text: chunk.text,
    embedding: JSON.stringify(embeddings[i]),
    metadata: chunk.metadata,
  }));

  const { error } = await supabaseAdmin
    .from("policy_embeddings")
    .upsert(rows, { onConflict: "policy_id,chunk_index" });

  if (error) throw new Error(`Embedding storage failed: ${error.message}`);
}
```

---

## 5. Similarity Search

### Query function
```ts
async function searchPolicies(
  queryText: string,
  options?: {
    matchThreshold?: number;  // default 0.7
    matchCount?: number;      // default 10
    filterPayerId?: string;
    filterDrugName?: string;
  }
): Promise<{ chunk_text: string; policy_id: string; similarity: number; metadata: Record<string, string> }[]> {
  // 1. Embed the query
  const [queryEmbedding] = await generateEmbeddings([queryText]);

  // 2. Search via Supabase RPC
  const { data, error } = await supabase.rpc("match_policy_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: options?.matchThreshold ?? 0.7,
    match_count: options?.matchCount ?? 10,
  });

  if (error) throw new Error(`Search failed: ${error.message}`);

  // 3. Optional client-side metadata filtering
  let results = data ?? [];
  if (options?.filterPayerId) {
    results = results.filter((r: { metadata: { payer_id: string } }) => r.metadata.payer_id === options.filterPayerId);
  }
  if (options?.filterDrugName) {
    results = results.filter((r: { metadata: { drug_name: string } }) => r.metadata.drug_name === options.filterDrugName);
  }

  return results;
}
```

---

## 6. Context Assembly + Claude Completion

### Build prompt with retrieved context
```ts
async function ragCompletion(
  userQuery: string,
  retrievedChunks: { chunk_text: string; metadata: Record<string, string> }[]
): Promise<string> {
  const context = retrievedChunks
    .map((c, i) => `[Source ${i + 1} — ${c.metadata.payer_id} / ${c.metadata.drug_name}]\n${c.chunk_text}`)
    .join("\n\n---\n\n");

  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    system: `You are an expert clinical policy analyst for Anton Cx. Answer questions using ONLY the provided policy document excerpts. If the answer is not in the provided context, say so explicitly. Always cite which payer/drug source you are referencing.`,
    messages: [{
      role: "user",
      content: `## Retrieved Policy Context\n\n${context}\n\n---\n\n## Question\n${userQuery}`,
    }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
```

### Full RAG query flow
```ts
async function queryPolicies(question: string, filters?: { payer_id?: string; drug_name?: string }) {
  // 1. Search for relevant chunks
  const chunks = await searchPolicies(question, {
    matchThreshold: 0.7,
    matchCount: 8,
    filterPayerId: filters?.payer_id,
    filterDrugName: filters?.drug_name,
  });

  // 2. Generate answer with context
  const answer = await ragCompletion(question, chunks);

  return {
    answer,
    sources: chunks.map((c) => ({
      policy_id: c.policy_id,
      payer: c.metadata.payer_id,
      drug: c.metadata.drug_name,
      similarity: c.similarity,
    })),
  };
}
```

---

## Environment Variables

```env
# Already set (Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (extraction + completion)
ANTHROPIC_API_KEY=

# Embeddings (choose one)
VOYAGE_API_KEY=              # If using Voyage
GOOGLE_AI_KEY=               # If using Google text-embedding-004
```

---

## Required packages

```bash
npm install pdf-parse @anthropic-ai/sdk
npm install -D @types/pdf-parse
```

---

## Rules

```
NEVER send full PDF content as embeddings — always chunk first
NEVER embed chunks over 800 tokens — retrieval quality degrades
NEVER skip overlap between chunks — cross-boundary context is critical for PA criteria
NEVER store embeddings via the anon key — always use service role (supabaseAdmin)
NEVER mix embedding dimensions — all vectors in a table must come from the same model
ALWAYS try pdf-parse before falling back to Claude Vision (cost + speed)
ALWAYS include payer_id and drug_name in chunk metadata for filtered search
ALWAYS use HNSW index (not IVFFlat) — no reindex needed after inserts
ALWAYS batch embedding API calls (max 20 per request for Voyage)
ALWAYS return source citations with RAG completions
ALWAYS validate that retrieved chunk similarity > 0.7 before including in context
```
