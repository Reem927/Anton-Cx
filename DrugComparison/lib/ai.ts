import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn("Missing ANTHROPIC_API_KEY in environment variables.");
}

export const claude = new Anthropic({
  apiKey: apiKey || "",
});