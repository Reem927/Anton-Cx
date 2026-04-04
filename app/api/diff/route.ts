import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { diffPolicies } from '@/lib/diff';
import type { PolicyDocument, DiffResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      policy_id_a: string;
      policy_id_b: string;
    };

    if (!body.policy_id_a || !body.policy_id_b) {
      return NextResponse.json(
        { error: 'Missing required fields: policy_id_a, policy_id_b' },
        { status: 400 }
      );
    }

    const [rowA, rowB] = await Promise.all([
      prisma.policyDocument.findUnique({ where: { id: body.policy_id_a } }),
      prisma.policyDocument.findUnique({ where: { id: body.policy_id_b } }),
    ]);

    if (!rowA) {
      return NextResponse.json({ error: `Policy not found: ${body.policy_id_a}` }, { status: 404 });
    }
    if (!rowB) {
      return NextResponse.json({ error: `Policy not found: ${body.policy_id_b}` }, { status: 404 });
    }

    const policyA = deserializePolicy(rowA as unknown as Record<string, unknown>);
    const policyB = deserializePolicy(rowB as unknown as Record<string, unknown>);

    const diffs: DiffResult[] = diffPolicies(policyA, policyB);

    return NextResponse.json(diffs, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Diff failed';
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
