import { claude, CLAUDE_MODEL } from "@/lib/ai";

interface CompareSummaryRow {
  company: string;
  coverage: string;
  policyType: string;
  access: string;
  ranking: string;
  price: number | null;
  copay: number | null;
  criteria?: unknown;
}

function fallbackSummary(drugName: string, rows: CompareSummaryRow[]) {
  const covered = rows.filter((r) => r.coverage === "Covered").length;
  const pharmacyOnly = rows.filter((r) => r.coverage === "Pharmacy Only").length;
  const notCovered = rows.filter((r) => r.coverage === "Not Covered").length;
  const noPolicyFound = rows.filter((r) => r.coverage === "No Policy Found").length;

  return `${drugName} was compared across ${rows.length} selected payers. ${covered} show covered access, ${pharmacyOnly} are pharmacy-only, ${notCovered} are not covered, and ${noPolicyFound} have no indexed policy found. Review differences in policy type, access status, and member cost to identify the strongest payer positions and outliers.`;
}

export async function POST(req: Request) {
  try {
    const { drugName, rows } = await req.json();

    if (!drugName || !Array.isArray(rows) || rows.length < 2) {
      return Response.json(
        { error: "drugName and at least 2 rows are required" },
        { status: 400 }
      );
    }

    try {
      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 400,
        system:
          "You are a pharmacy benefit analyst. Write a concise comparison summary in 3-5 sentences. Be factual, professional, and do not use markdown.",
        messages: [
          {
            role: "user",
            content: `Summarize these selected payer policy rows for ${drugName}. Focus on coverage state, access differences, policy type differences, and cost outliers.\n\n${JSON.stringify(
              rows,
              null,
              2
            )}`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const summary =
        textBlock?.type === "text" ? textBlock.text : fallbackSummary(drugName, rows);

      return Response.json({ summary });
    } catch {
      return Response.json({ summary: fallbackSummary(drugName, rows) });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Summary generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}