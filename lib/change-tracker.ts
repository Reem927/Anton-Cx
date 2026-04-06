// ── Ruthvik: Claude-powered JSON diff for Change Tracker ──────────

import { claude, CLAUDE_MODEL } from "./ai";
import type { PolicyDocument } from "./types";

export interface TrackedChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
  severity: "critical" | "moderate" | "minor";
  summary: string;
}

/**
 * Send old and new policy JSON to Claude for intelligent diff analysis.
 * Returns structured change descriptions with severity ratings.
 */
export async function trackChanges(
  oldPolicy: PolicyDocument,
  newPolicy: PolicyDocument
): Promise<TrackedChange[]> {
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are a clinical policy change analyst for Anton Cx. Compare two versions of a drug policy document and identify all meaningful changes.

For each change, return a JSON array of objects with:
- field: the field name that changed
- old_value: the previous value
- new_value: the new value
- severity: "critical" (coverage status, PA requirements), "moderate" (step therapy, indications), or "minor" (quantity limits, renewal period, formatting)
- summary: one-sentence plain-English description of the change and its clinical impact

Return ONLY a valid JSON array. No markdown fences, no extra text.`,
    messages: [
      {
        role: "user",
        content: `## Previous Version (${oldPolicy.policy_version}, effective ${oldPolicy.effective_date})
${JSON.stringify(oldPolicy, null, 2)}

## New Version (${newPolicy.policy_version}, effective ${newPolicy.effective_date})
${JSON.stringify(newPolicy, null, 2)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    return JSON.parse(text.trim()) as TrackedChange[];
  } catch {
    return [];
  }
}
