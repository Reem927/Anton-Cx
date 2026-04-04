import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { PolicyDocument } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const payer_id   = searchParams.get('payer_id')   ?? undefined;
    const drug_id    = searchParams.get('drug_id')    ?? undefined;
    const drug_name  = searchParams.get('drug_name')  ?? undefined;
    const date_from  = searchParams.get('date_from')  ?? undefined;
    const date_to    = searchParams.get('date_to')    ?? undefined;

    const where: Record<string, unknown> = {};
    if (payer_id)  where.payer_id  = payer_id;
    if (drug_id)   where.drug_id   = drug_id;
    if (drug_name) where.drug_name = { contains: drug_name };

    if (date_from || date_to) {
      where.effective_date = {
        ...(date_from ? { gte: date_from } : {}),
        ...(date_to   ? { lte: date_to   } : {}),
      };
    }

    const rows = await prisma.policyDocument.findMany({
      where,
      orderBy: [{ drug_name: 'asc' }, { effective_date: 'desc' }],
    });

    const policies: PolicyDocument[] = rows.map((row) => ({
      ...(row as unknown as PolicyDocument),
      step_therapy_drugs: JSON.parse(row.step_therapy_drugs ?? '[]'),
      indications:        JSON.parse(row.indications ?? '[]'),
      changed_fields:     JSON.parse(row.changed_fields ?? '[]'),
    }));

    return NextResponse.json(policies, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
