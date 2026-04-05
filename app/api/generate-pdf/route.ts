import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generatePolicyPdf } from "@/lib/pdf/generate-policy-pdf";
import { claude, CLAUDE_MODEL } from "@/lib/ai";

async function generateAiSummary(drugName: string, drugGeneric: string, rows: any[]) {
  const payers = rows.map((p) => p.payer_name);
  const coveredCount = rows.filter((p) => p.coverage_status === "covered").length;
  const paCount = rows.filter((p) => p.prior_auth_required).length;
  const stCount = rows.filter((p) => p.step_therapy_required).length;
  const deniedCount = rows.filter((p) => p.coverage_status === "not_covered").length;

  const snapshot = rows.map((p) => ({
    payer: p.payer_name,
    status: p.coverage_status,
    pa: p.prior_auth_required,
    step_therapy: p.step_therapy_required,
    tier: p.formulary_tier,
  }));

  try {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      system:
        "You are a pharmacy benefit analyst writing a short executive summary for a policy report. Be concise and professional. No markdown.",
      messages: [
        {
          role: "user",
          content: `Summarize the coverage landscape for ${drugName} (${drugGeneric}) across ${payers.length} payers: ${payers.join(
            ", "
          )}.\n\nStats: ${coveredCount} covered, ${paCount} require prior auth, ${stCount} require step therapy, ${deniedCount} denied/not covered.\n\n${JSON.stringify(
            snapshot,
            null,
            2
          )}`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text");
    return text?.type === "text"
      ? text.text
      : `${drugName} was analyzed across ${payers.length} payers. Review the report for payer-by-payer policy detail.`;
  } catch {
    return `${drugName} was analyzed across ${payers.length} payers. Review the report for payer-by-payer policy detail.`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const policyId = searchParams.get("policy_id");
    const source = searchParams.get("source");
    const drugGeneric = searchParams.get("drug");

    let rows: any[] = [];

    if (policyId && source === "medical") {
      const { data } = await supabase
        .from("medical_benefit_policies")
        .select("*")
        .eq("id", policyId)
        .single();

      if (data) {
        const { data: drugRows } = await supabase
          .from("medical_benefit_policies")
          .select("*")
          .eq("drug_generic", data.drug_generic);

        rows = drugRows ?? [];
      }
    } else if (policyId && source === "pharmacy") {
      const { data } = await supabase
        .from("pharmacy_benefit_policies")
        .select("*")
        .eq("id", policyId)
        .single();

      if (data) {
        rows = [data];
      }
    } else if (drugGeneric) {
      const { data } = await supabase
        .from("medical_benefit_policies")
        .select("*")
        .eq("drug_generic", drugGeneric);

      rows = data ?? [];
    }

    if (!rows.length) {
      return NextResponse.json({ error: "No policies found" }, { status: 404 });
    }

    const first = rows[0];
    const aiSummary = await generateAiSummary(first.drug_name, first.drug_generic, rows);

    const pdfBuffer = generatePolicyPdf({
      drugName: first.drug_name,
      drugGeneric: first.drug_generic,
      jCode: first.j_code ?? "",
      policies: rows,
      aiSummary,
    });

    const filename = `${first.drug_name.replace(/\s+/g, "-")}-policy-report.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}