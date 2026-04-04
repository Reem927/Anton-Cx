import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import 'dotenv/config';

const prisma = new PrismaClient();

const PAYERS = ['aetna', 'uhc', 'cigna', 'bcbs-tx', 'humana', 'elevance', 'centene', 'kaiser'];

const DRUGS = [
  {
    drug_name:    'Humira',
    drug_generic: 'adalimumab',
    drug_id:      'adalimumab',
    j_code:       'J0135',
    payers:       PAYERS, // all 8
    indications:  ['RA', 'PsA', 'CD', 'UC', 'AS'],
  },
  {
    drug_name:    'Keytruda',
    drug_generic: 'pembrolizumab',
    drug_id:      'pembrolizumab',
    j_code:       'J9271',
    payers:       PAYERS, // all 8
    indications:  ['NSCLC', 'HNSCC', 'TNBC', 'CRC', 'GC'],
  },
  {
    drug_name:    'Dupixent',
    drug_generic: 'dupilumab',
    drug_id:      'dupilumab',
    j_code:       'J0173',
    payers:       PAYERS.slice(0, 6), // 6 of 8
    indications:  ['AD', 'Asthma', 'CRSwNP', 'EoE'],
  },
  {
    drug_name:    'Stelara',
    drug_generic: 'ustekinumab',
    drug_id:      'ustekinumab',
    j_code:       'J3357',
    payers:       PAYERS.slice(0, 6), // 6 of 8
    indications:  ['PsO', 'PsA', 'CD', 'UC'],
  },
  {
    drug_name:    'Enbrel',
    drug_generic: 'etanercept',
    drug_id:      'etanercept',
    j_code:       'J1438',
    payers:       PAYERS.slice(0, 5), // 5 of 8
    indications:  ['RA', 'PsA', 'PsO', 'AS', 'JIA'],
  },
];

type CoverageStatus = 'covered' | 'pa_required' | 'denied' | 'not_covered';

const COVERAGE_BY_PAYER: Record<string, CoverageStatus[]> = {
  'aetna':    ['pa_required', 'pa_required', 'pa_required', 'pa_required', 'pa_required'],
  'uhc':      ['pa_required', 'covered',     'pa_required', 'pa_required', 'covered'    ],
  'cigna':    ['pa_required', 'pa_required', 'pa_required', 'denied',      'pa_required'],
  'bcbs-tx':  ['covered',     'pa_required', 'pa_required', 'pa_required', 'pa_required'],
  'humana':   ['pa_required', 'covered',     'denied',      'pa_required', 'covered'    ],
  'elevance': ['pa_required', 'pa_required', 'covered',     'pa_required', 'pa_required'],
  'centene':  ['pa_required', 'denied',      'pa_required', 'pa_required', 'pa_required'],
  'kaiser':   ['covered',     'pa_required', 'pa_required', 'covered',     'pa_required'],
};

const STEP_THERAPY_DRUGS_BY_DRUG: Record<string, string[]> = {
  'adalimumab':    ['methotrexate', 'sulfasalazine'],
  'pembrolizumab': [],
  'dupilumab':     ['topical corticosteroids', 'cyclosporine'],
  'ustekinumab':   ['methotrexate', 'TNF inhibitor'],
  'etanercept':    ['methotrexate', 'hydroxychloroquine'],
};

const PA_CRITERIA_BY_DRUG: Record<string, string> = {
  'adalimumab':
    'Patient must have moderate to severe RA (DAS28 >3.2 or CDAI >10) and have failed or been intolerant to at least one conventional DMARD (methotrexate, sulfasalazine, or hydroxychloroquine) for a minimum of 3 months.',
  'pembrolizumab':
    'Patient must have PD-L1 expression ≥1% (TPS) confirmed by FDA-approved test. For first-line NSCLC, PD-L1 ≥50% required. Documented ECOG performance status 0–1.',
  'dupilumab':
    'Patient must have moderate-to-severe atopic dermatitis (IGA score ≥3 or EASI score ≥16) with inadequate response to topical corticosteroids of at least medium potency used for ≥4 weeks.',
  'ustekinumab':
    'For CD/UC: patient must have failed or been intolerant to conventional therapy (corticosteroids, azathioprine, 6-MP) and at least one anti-TNF agent.',
  'etanercept':
    'Patient must have active moderate-to-severe RA (≥6 tender and ≥6 swollen joints) and inadequate response to methotrexate at therapeutic doses for ≥3 months.',
};

const VERSIONS = ['v3.1', 'v3.2', 'v4.0', 'v4.1', 'v4.2'];

function pickVersion(payerIndex: number, drugIndex: number): string {
  return VERSIONS[(payerIndex + drugIndex) % VERSIONS.length];
}

function buildEffectiveDate(payerIndex: number, drugIndex: number): string {
  const year = 2025;
  const month = [1, 4, 7, 10][(payerIndex + drugIndex) % 4];
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function buildChangedFields(payerIndex: number, drugIndex: number): string[] {
  if ((payerIndex + drugIndex) % 5 === 0) {
    return ['coverage_status', 'prior_auth_criteria'];
  }
  if ((payerIndex + drugIndex) % 3 === 0) {
    return ['step_therapy_drugs'];
  }
  return [];
}

async function main() {
  console.log('Seeding database...');

  await prisma.policyDocument.deleteMany();

  let count = 0;

  for (let di = 0; di < DRUGS.length; di++) {
    const drug = DRUGS[di];

    for (let pi = 0; pi < drug.payers.length; pi++) {
      const payerId = drug.payers[pi];
      const payerGlobalIndex = PAYERS.indexOf(payerId);

      const coverageStatuses = COVERAGE_BY_PAYER[payerId];
      const coverageStatus: CoverageStatus = coverageStatuses[di] ?? 'pa_required';

      const priorAuthRequired = coverageStatus === 'pa_required';
      const stepTherapy = priorAuthRequired && drug.drug_id !== 'pembrolizumab';

      await prisma.policyDocument.create({
        data: {
          id:                  uuidv4(),
          payer_id:            payerId,
          drug_id:             drug.drug_id,
          drug_name:           drug.drug_name,
          drug_generic:        drug.drug_generic,
          j_code:              drug.j_code,
          coverage_status:     coverageStatus,
          prior_auth_required: priorAuthRequired,
          prior_auth_criteria: priorAuthRequired
            ? PA_CRITERIA_BY_DRUG[drug.drug_id]
            : '',
          step_therapy:        stepTherapy,
          step_therapy_drugs:  JSON.stringify(
            stepTherapy ? STEP_THERAPY_DRUGS_BY_DRUG[drug.drug_id] : []
          ),
          site_of_care:        drug.drug_id === 'pembrolizumab'
            ? 'Outpatient infusion center or oncology clinic only'
            : null,
          indications:         JSON.stringify(drug.indications),
          quantity_limit:      drug.drug_id === 'adalimumab'
            ? '40mg every 2 weeks or 80mg every 4 weeks'
            : null,
          clinical_criteria:   drug.drug_id === 'adalimumab'
            ? 'CDAI >10 or DAS28 >3.2'
            : drug.drug_id === 'pembrolizumab'
            ? 'PD-L1 TPS ≥1%'
            : null,
          renewal_period:      priorAuthRequired ? '12 months' : null,
          policy_version:      pickVersion(payerGlobalIndex, di),
          effective_date:      buildEffectiveDate(payerGlobalIndex, di),
          source_pdf_url:      null,
          extracted_at:        new Date().toISOString(),
          changed_fields:      JSON.stringify(
            buildChangedFields(payerGlobalIndex, di)
          ),
        },
      });

      count++;
    }
  }

  console.log(`Seeded ${count} policy records across ${PAYERS.length} payers and ${DRUGS.length} drug classes.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
