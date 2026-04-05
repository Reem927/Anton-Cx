import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { PolicyDocument } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const payer_id   = searchParams.get('payer_id')   ?? undefined;
    const drug_id    = searchParams.get('drug_id')    ?? undefined;
    const drug_name  = searchParams.get('drug_name')  ?? undefined;
    const date_from  = searchParams.get('date_from')  ?? undefined;
    const date_to    = searchParams.get('date_to')    ?? undefined;

    let query = supabase
      .from('policy_documents')
      .select('*')
      .order('drug_name', { ascending: true })
      .order('effective_date', { ascending: false });

    if (payer_id)  query = query.eq('payer_id', payer_id);
    if (drug_id)   query = query.eq('drug_id', drug_id);
    if (drug_name) query = query.ilike('drug_name', `%${drug_name}%`);
    if (date_from) query = query.gte('effective_date', date_from);
    if (date_to)   query = query.lte('effective_date', date_to);

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const policies = (rows ?? []) as unknown as PolicyDocument[];

    return NextResponse.json(policies, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
