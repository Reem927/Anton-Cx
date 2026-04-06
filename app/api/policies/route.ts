import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SEED_POLICIES } from '@/lib/seed-data';
import type { PolicyDocument } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const payer_id   = searchParams.get('payer_id')   ?? undefined;
    const drug_id    = searchParams.get('drug_id')    ?? undefined;
    const drug_name  = searchParams.get('drug_name')  ?? undefined;
    const date_from  = searchParams.get('date_from')  ?? undefined;
    const date_to    = searchParams.get('date_to')    ?? undefined;

    // Try database first
    try {
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

      if (!error && rows && rows.length > 0) {
        return NextResponse.json(rows, { status: 200 });
      }
    } catch (dbError) {
      console.log("Database query failed, using seed data");
    }

    // Fallback to seed data
    let policies = [...SEED_POLICIES];

    // Apply filters to seed data
    if (payer_id) {
      policies = policies.filter(p => p.payer_id === payer_id);
    }
    if (drug_id) {
      policies = policies.filter(p => p.drug_id === drug_id);
    }
    if (drug_name) {
      policies = policies.filter(p => 
        p.drug_name.toLowerCase().includes(drug_name.toLowerCase())
      );
    }
    if (date_from) {
      policies = policies.filter(p => p.effective_date >= date_from);
    }
    if (date_to) {
      policies = policies.filter(p => p.effective_date <= date_to);
    }

    // Sort by drug name, then by effective date (newest first)
    policies.sort((a, b) => {
      const nameCompare = a.drug_name.localeCompare(b.drug_name);
      if (nameCompare !== 0) return nameCompare;
      return new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime();
    });

    return NextResponse.json(policies, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
