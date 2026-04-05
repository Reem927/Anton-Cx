import { NextRequest, NextResponse } from 'next/server';
import { extractFromPdf } from '@/lib/extraction';
import { supabase } from '@/lib/supabase';
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

    // Legacy route — calls new extraction engine, returns medical policy
    const result = await extractFromPdf(body.pdf, body.payer_id, body.drug_name, 'pdf_upload');
    const extracted = result.medical_policy;
    if (!extracted) {
      return NextResponse.json({ error: 'No medical policy extracted' }, { status: 422 });
    }

    // Look for a previous version to diff against
    const { data: prev } = await supabase
      .from('policy_documents')
      .select('*')
      .eq('payer_id', body.payer_id)
      .eq('drug_generic', extracted.drug_generic)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    let changedFields: string[] = [];
    if (prev) {
      changedFields = getChangedFields(prev as unknown as PolicyDocument, extracted as unknown as PolicyDocument);
    }

    const toSave = { ...extracted, changed_fields: changedFields };

    const { data: saved, error } = await supabase
      .from('policy_documents')
      .upsert(toSave, { onConflict: 'payer_id,drug_id,effective_date' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(saved as unknown as PolicyDocument, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
