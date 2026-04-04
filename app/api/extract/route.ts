import { NextRequest, NextResponse } from 'next/server';
import { extractPolicyFromPdf } from '@/lib/extraction';
import { prisma } from '@/lib/db';
import { getChangedFields } from '@/lib/diff';
import type { PolicyDocument } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      pdf:       string;
      payer_id:  string;
      drug_name?: string;
    };

    if (!body.pdf || !body.payer_id) {
      return NextResponse.json(
        { error: 'Missing required fields: pdf, payer_id' },
        { status: 400 }
      );
    }

    const extracted = await extractPolicyFromPdf(body.pdf, body.payer_id, body.drug_name);

    // Look for a previous version to diff against
    const prev = await prisma.policyDocument.findFirst({
      where:   { payer_id: body.payer_id, drug_id: extracted.drug_id },
      orderBy: { effective_date: 'desc' },
    });

    let changedFields: string[] = [];
    if (prev) {
      const prevDoc = deserializePolicy(prev);
      changedFields = getChangedFields(prevDoc, extracted);
    }

    const toSave = {
      ...extracted,
      step_therapy_drugs: JSON.stringify(extracted.step_therapy_drugs),
      indications:        JSON.stringify(extracted.indications),
      changed_fields:     JSON.stringify(changedFields),
    };

    const saved = await prisma.policyDocument.upsert({
      where: {
        payer_id_drug_id_effective_date: {
          payer_id:      toSave.payer_id,
          drug_id:       toSave.drug_id,
          effective_date: toSave.effective_date,
        },
      },
      create: toSave,
      update: toSave,
    });

    return NextResponse.json(deserializePolicy(saved), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function deserializePolicy(row: Record<string, unknown>): PolicyDocument {
  return {
    ...(row as unknown as PolicyDocument),
    step_therapy_drugs: JSON.parse(row.step_therapy_drugs as string ?? '[]'),
    indications:        JSON.parse(row.indications as string ?? '[]'),
    changed_fields:     JSON.parse(row.changed_fields as string ?? '[]'),
  };
}
