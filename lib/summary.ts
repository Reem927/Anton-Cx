// ── Aryan: Claude-powered policy comparison summaries ─────────────

import { claude, CLAUDE_MODEL } from "./ai";
import type { PolicyDocument } from "./types";

/**
 * Generate a plain-English summary comparing a drug's coverage
 * across multiple payers. Used in the Comparison Engine.
 */
export async function summarizeComparison(
  drug_name: string,
  policies: PolicyDocument[]
): Promise<string> {
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are a clinical policy analyst for Anton Cx. Summarize drug coverage differences across payers in clear, concise language suitable for healthcare professionals. Focus on: coverage status differences, PA criteria gaps, step therapy variations, and notable restrictions. Keep it under 300 words.`,
    messages: [
      {
        role: "user",
        content: `Summarize the coverage landscape for ${drug_name} across these payers:\n\n${JSON.stringify(policies, null, 2)}`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

/**
 * Generate a single-policy summary for the policy detail view.
 */
export async function summarizePolicy(
  policy: PolicyDocument
): Promise<string> {
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    system: `You are a clinical policy analyst. Summarize this drug policy in 2-3 sentences, highlighting coverage status, key requirements, and any notable restrictions.`,
    messages: [
      {
        role: "user",
        content: JSON.stringify(policy, null, 2),
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
