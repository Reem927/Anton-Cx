// ── GET /api/generate-pdf ─────────────────────────────────────────
// Generates a branded PDF report for a single drug across payers.
//
// Query params:
//   drug      — drug_generic (required)
//   policy_id — single policy ID (optional, overrides drug)
//
// Returns: application/pdf blob

import { NextRequest, NextResponse } from 'next/server';
import { getPoliciesByDrug } from '@/lib/db/policies';
import { generatePolicyPdf } from '@/lib/pdf/generate-policy-pdf';
import { claude, CLAUDE_MODEL } from '@/lib/ai';
import type { MedicalBenefitPolicy } from '@/lib/types/policy';

async function generateAiSummary(
  drugName: string,
  drugGeneric: string,
  policies: MedicalBenefitPolicy[],
): Promise<string> {
  const payers = policies.map(p => p.payer_name);
  const coveredCount = policies.filter(p => p.coverage_status === 'covered').length;
  const paCount = policies.filter(p => p.prior_auth_required).length;
  const stCount = policies.filter(p => p.step_therapy_required).length;
  const deniedCount = policies.filter(p => p.coverage_status === 'not_covered').length;

  const policySnapshot = policies.map(p => ({
    payer: p.payer_name,
    status: p.coverage_status,
    pa: p.prior_auth_required,
    step_therapy: p.step_therapy_required,
    indications: Array.isArray(p.indications)
      ? p.indications.map(i => typeof i === 'string' ? i : i.diagnosis).join(', ')
      : '',
    tier: p.formulary_tier,
  }));

  try {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: `You are a pharmacy benefit analyst writing a brief executive summary for a policy intelligence report. Be concise, factual, and professional. Write 3-5 sentences max. Do not use markdown. Do not say "this report" — just state the findings.`,
      messages: [{
        role: 'user',
        content: `Summarize the coverage landscape for ${drugName} (${drugGeneric}) across ${payers.length} payers: ${payers.join(', ')}.

Stats: ${coveredCount} covered, ${paCount} require prior auth, ${stCount} require step therapy, ${deniedCount} denied/not covered.

Policy details:
${JSON.stringify(policySnapshot, null, 2)}

Write a brief analyst summary highlighting key coverage patterns, notable restrictions, and any outlier payers.`,
      }],
    });

    const text = response.content.find(b => b.type === 'text');
    return text?.type === 'text' ? text.text : fallbackSummary(drugName, policies);
  } catch {
    return fallbackSummary(drugName, policies);
  }
}

function fallbackSummary(drugName: string, policies: MedicalBenefitPolicy[]): string {
  const payers = [...new Set(policies.map(p => p.payer_name))];
  const coveredCount = policies.filter(p => p.coverage_status === 'covered').length;
  const paCount = policies.filter(p => p.prior_auth_required).length;

  return `${drugName} was analyzed across ${payers.length} payer${payers.length === 1 ? '' : 's'} (${payers.join(', ')}). ${coveredCount} of ${policies.length} policies provide coverage. ${paCount} require prior authorization. This report contains the full extraction details for each payer policy.`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const drugGeneric = searchParams.get('drug');
    const policyId = searchParams.get('policy_id');

    let policies: MedicalBenefitPolicy[] = [];

    if (policyId) {
      // Single policy mode — we need to find it
      // getPoliciesByDrug returns by drug, so we'll query differently
      // For now, search across all policies (the policy_id uniquely identifies)
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase
        .from('medical_benefit_policies')
        .select('*')
        .eq('id', policyId)
        .single();

      if (data) {
        const policy = data as unknown as MedicalBenefitPolicy;
        // Get all policies for same drug to include in the report
        policies = await getPoliciesByDrug(policy.drug_generic);
      }
    } else if (drugGeneric) {
      policies = await getPoliciesByDrug(drugGeneric);
    }

    if (policies.length === 0) {
      return NextResponse.json(
        { error: 'No policies found for the specified drug' },
        { status: 404 },
      );
    }

    const first = policies[0];
    const drugName = first.drug_name;
    const jCode = first.j_code ?? '';

    // Generate AI summary
    const aiSummary = await generateAiSummary(drugName, first.drug_generic, policies);

    // Generate PDF
    const pdfBuffer = generatePolicyPdf({
      drugName,
      drugGeneric: first.drug_generic,
      jCode,
      policies,
      aiSummary,
    });

    const filename = `${drugName.replace(/\s+/g, '-')}-policy-report.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF generation failed';
    console.error('[/api/generate-pdf]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
