import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    const [resA, resB] = await Promise.all([
      supabase.from('policy_documents').select('*').eq('id', body.policy_id_a).single(),
      supabase.from('policy_documents').select('*').eq('id', body.policy_id_b).single(),
    ]);

    if (resA.error || !resA.data) {
      return NextResponse.json({ error: `Policy not found: ${body.policy_id_a}` }, { status: 404 });
    }
    if (resB.error || !resB.data) {
      return NextResponse.json({ error: `Policy not found: ${body.policy_id_b}` }, { status: 404 });
    }

    const policyA = resA.data as unknown as PolicyDocument;
    const policyB = resB.data as unknown as PolicyDocument;

    const diffs: DiffResult[] = diffPolicies(policyA, policyB);

    return NextResponse.json(diffs, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Diff failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
