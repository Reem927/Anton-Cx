import Anthropic from "@anthropic-ai/sdk";

// ── Shared Claude client ──────────────────────────────────────────
// Single instance, reused across all API routes.
// Model constant keeps the entire team on the same version.

export const CLAUDE_MODEL = "claude-sonnet-4-6";

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
