// ── Reem: PDF ingestion (text parse + URL fetch + Vision fallback) ─

// @ts-expect-error — pdf-parse lacks proper ESM default export typings
import pdf from "pdf-parse";
import { claude, CLAUDE_MODEL } from "./ai";

/** Fetch a PDF from a URL and return the raw buffer. */
export async function fetchPdfFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PDF fetch failed (${res.status}): ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Extract text from a PDF buffer using pdf-parse (fast, no API cost). */
export async function parseTextFromBuffer(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Claude Vision fallback for scanned / image-heavy PDFs.
 * Only call this when pdf-parse returns <100 usable chars.
 */
export async function parseWithVision(base64Pdf: string): Promise<string> {
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            type: "text",
            text: "Extract all text content from this clinical policy document. Preserve section headers, criteria lists, and drug names exactly as written.",
          },
        ],
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
}

/**
 * Smart parse: tries pdf-parse first, falls back to Vision if text is too short.
 * Accepts either a base64 string or a URL.
 */
export async function parsePdf(
  input: { base64: string } | { url: string }
): Promise<string> {
  let buffer: Buffer;
  let base64: string;

  if ("url" in input) {
    buffer = await fetchPdfFromUrl(input.url);
    base64 = buffer.toString("base64");
  } else {
    base64 = input.base64;
    buffer = Buffer.from(base64, "base64");
  }

  // Try fast text extraction first
  const text = await parseTextFromBuffer(buffer);

  // If we got meaningful text, use it
  if (text.trim().length > 100) return text;

  // Otherwise fall back to Claude Vision
  return parseWithVision(base64);
}
