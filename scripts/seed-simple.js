const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simplified seed data
const POLICIES = [
  {
    id: 'seed-001',
    payer_id: 'aetna',
    drug_name: 'Humira',
    drug_generic: 'adalimumab', 
    drug_id: 'adalimumab',
    j_code: 'J0135',
    coverage_status: 'covered',
    formulary_tier: 'preferred_specialty',
    prior_auth_required: true,
    prior_auth_criteria: 'Patient must have moderate to severe RA and failed ≥1 DMARD for 3 months.',
    step_therapy: true,
    step_therapy_drugs: ['methotrexate', 'sulfasalazine'],
    site_of_care: null,
    indications: ['RA', 'PsA', 'CD', 'UC', 'AS'],
    quantity_limit: '40mg every 2 weeks',
    clinical_criteria: 'CDAI >10 or DAS28 >3.2',
    renewal_period: '12 months',
    policy_version: 'v4.1',
    effective_date: '2025-01-01',
    source_pdf_url: null,
    extracted_at: '2026-04-01T00:00:00Z',
    changed_fields: ['coverage_status']
  },
  {
    id: 'seed-002',
    payer_id: 'uhc', 
    drug_name: 'Humira',
    drug_generic: 'adalimumab',
    drug_id: 'adalimumab',
    j_code: 'J0135',
    coverage_status: 'covered',
    formulary_tier: 'non_preferred',
    prior_auth_required: true,
    prior_auth_criteria: 'Patient must have moderate to severe RA and tried biosimilar first.',
    step_therapy: true,
    step_therapy_drugs: ['adalimumab-biosimilar', 'methotrexate'],
    site_of_care: null,
    indications: ['RA', 'PsA', 'CD', 'UC'],
    quantity_limit: '40mg every 2 weeks',
    clinical_criteria: 'Must try biosimilar first',
    renewal_period: '6 months',
    policy_version: 'v3.8',
    effective_date: '2025-01-01', 
    source_pdf_url: null,
    extracted_at: '2026-04-01T00:00:00Z',
    changed_fields: ['formulary_tier']
  },
  {
    id: 'seed-003',
    payer_id: 'cigna',
    drug_name: 'Humira', 
    drug_generic: 'adalimumab',
    drug_id: 'adalimumab',
    j_code: 'J0135',
    coverage_status: 'covered',
    formulary_tier: 'preferred_specialty',
    prior_auth_required: false,
    prior_auth_criteria: null,
    step_therapy: false,
    step_therapy_drugs: [],
    site_of_care: null,
    indications: ['RA', 'PsA', 'CD', 'UC', 'AS'],
    quantity_limit: '40mg every 2 weeks or 80mg every 4 weeks',
    clinical_criteria: 'Diagnosis confirmation required',
    renewal_period: '12 months',
    policy_version: 'v5.2',
    effective_date: '2025-01-01',
    source_pdf_url: null, 
    extracted_at: '2026-04-01T00:00:00Z',
    changed_fields: []
  },
  {
    id: 'seed-004',
    payer_id: 'emblemhealth',
    drug_name: 'Humira',
    drug_generic: 'adalimumab',
    drug_id: 'adalimumab', 
    j_code: 'J0135',
    coverage_status: 'not_covered',
    formulary_tier: 'not_covered',
    prior_auth_required: false,
    prior_auth_criteria: null,
    step_therapy: false,
    step_therapy_drugs: [],
    site_of_care: null,
    indications: [],
    quantity_limit: null,
    clinical_criteria: 'Not covered - biosimilar preferred',
    renewal_period: null,
    policy_version: 'v2.1',
    effective_date: '2025-01-01',
    source_pdf_url: null,
    extracted_at: '2026-04-01T00:00:00Z', 
    changed_fields: ['coverage_status']
  }
];

async function seedDatabase() {
  console.log('🌱 Seeding Anton Cx database...\n');

  try {
    // First ensure the table exists
    console.log('📋 Checking if policy_documents table exists...');
    
    const { data: tableExists, error: tableError } = await supabase
      .from('policy_documents')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.log('⚠️  Table does not exist. Creating it now...');
      
      // Create table via SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.policy_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          payer_id TEXT NOT NULL,
          drug_name TEXT NOT NULL,
          drug_generic TEXT,
          drug_id TEXT NOT NULL,
          j_code TEXT,
          coverage_status TEXT CHECK (coverage_status IN ('covered', 'not_covered', 'no_policy_found', 'pharmacy_only')),
          formulary_tier TEXT CHECK (formulary_tier IN ('preferred_specialty', 'non_specialty', 'non_preferred', 'not_covered')),
          prior_auth_required BOOLEAN DEFAULT false,
          prior_auth_criteria TEXT,
          step_therapy BOOLEAN DEFAULT false,
          step_therapy_drugs TEXT[] DEFAULT '{}',
          site_of_care TEXT,
          indications TEXT[] DEFAULT '{}',
          quantity_limit TEXT,
          clinical_criteria TEXT,
          renewal_period TEXT,
          policy_version TEXT,
          effective_date DATE NOT NULL,
          source_pdf_url TEXT,
          extracted_at TIMESTAMPTZ DEFAULT now(),
          changed_fields TEXT[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Allow anonymous read access" ON public.policy_documents
          FOR SELECT USING (true);
          
        CREATE POLICY IF NOT EXISTS "Allow anonymous insert" ON public.policy_documents
          FOR INSERT WITH CHECK (true);
      `;
      
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (sqlError) {
        console.log('⚠️  Could not create table via RPC. You may need to run the SQL manually.');
        console.log('SQL to run:', createTableSQL);
      } else {
        console.log('✅ Table created successfully');
      }
    } else {
      console.log('✅ Table exists');
    }

    // Clear existing seed data
    console.log('🧹 Clearing existing seed data...');
    const { error: deleteError } = await supabase
      .from('policy_documents')
      .delete()
      .like('id', 'seed-%');

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('⚠️  Warning clearing data:', deleteError.message);
    }

    // Insert seed policies
    console.log(`📄 Inserting ${POLICIES.length} policy documents...`);
    
    const { data, error } = await supabase
      .from('policy_documents')
      .insert(POLICIES)
      .select('id, drug_name, payer_id');

    if (error) {
      console.error('❌ Insert error:', error.message);
      console.error('Full error:', error);
      console.log('\n💡 If table does not exist, please run this SQL in Supabase Dashboard:');
      console.log('---');
      console.log(createTableSQL);
      console.log('---');
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${data?.length || 0} policy documents`);
    
    // Show summary
    const drugCounts = POLICIES.reduce((acc, policy) => {
      acc[policy.drug_name] = (acc[policy.drug_name] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Seed Summary:');
    Object.entries(drugCounts).forEach(([drug, count]) => {
      console.log(`   ${drug}: ${count} policies`);
    });

    console.log('\n🎉 Database seeding complete!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();