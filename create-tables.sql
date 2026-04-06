-- ============================================================
-- CREATE TABLES FOR ANTON CX - Run in Supabase SQL Editor
-- ============================================================

-- Main policy documents table
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

-- Enable RLS
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for demo purposes
CREATE POLICY IF NOT EXISTS "Allow anonymous read access" ON public.policy_documents
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous insert" ON public.policy_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous update" ON public.policy_documents
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous delete" ON public.policy_documents
  FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_documents_payer_drug ON public.policy_documents(payer_id, drug_name);
CREATE INDEX IF NOT EXISTS idx_policy_documents_effective_date ON public.policy_documents(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_policy_documents_drug_name ON public.policy_documents USING gin(to_tsvector('english', drug_name));
CREATE INDEX IF NOT EXISTS idx_policy_documents_coverage_status ON public.policy_documents(coverage_status);

-- Insert seed data
INSERT INTO public.policy_documents (
  id, payer_id, drug_name, drug_generic, drug_id, j_code, coverage_status, formulary_tier,
  prior_auth_required, prior_auth_criteria, step_therapy, step_therapy_drugs, site_of_care,
  indications, quantity_limit, clinical_criteria, renewal_period, policy_version, effective_date,
  source_pdf_url, extracted_at, changed_fields
) VALUES 
  (
    'seed-001', 'aetna', 'Humira', 'adalimumab', 'adalimumab', 'J0135', 'covered', 'preferred_specialty',
    true, 'Patient must have moderate to severe RA and failed ≥1 DMARD for 3 months.', true, 
    ARRAY['methotrexate', 'sulfasalazine'], null, ARRAY['RA', 'PsA', 'CD', 'UC', 'AS'],
    '40mg every 2 weeks', 'CDAI >10 or DAS28 >3.2', '12 months', 'v4.1', '2025-01-01',
    null, '2026-04-01T00:00:00Z', ARRAY['coverage_status']
  ),
  (
    'seed-002', 'uhc', 'Humira', 'adalimumab', 'adalimumab', 'J0135', 'covered', 'non_preferred',
    true, 'Patient must have moderate to severe RA and tried biosimilar first.', true,
    ARRAY['adalimumab-biosimilar', 'methotrexate'], null, ARRAY['RA', 'PsA', 'CD', 'UC'],
    '40mg every 2 weeks', 'Must try biosimilar first', '6 months', 'v3.8', '2025-01-01',
    null, '2026-04-01T00:00:00Z', ARRAY['formulary_tier']
  ),
  (
    'seed-003', 'cigna', 'Humira', 'adalimumab', 'adalimumab', 'J0135', 'covered', 'preferred_specialty',
    false, null, false, ARRAY[]::TEXT[], null, ARRAY['RA', 'PsA', 'CD', 'UC', 'AS'],
    '40mg every 2 weeks or 80mg every 4 weeks', 'Diagnosis confirmation required', '12 months', 'v5.2', '2025-01-01',
    null, '2026-04-01T00:00:00Z', ARRAY[]::TEXT[]
  ),
  (
    'seed-004', 'emblemhealth', 'Humira', 'adalimumab', 'adalimumab', 'J0135', 'not_covered', 'not_covered',
    false, null, false, ARRAY[]::TEXT[], null, ARRAY[]::TEXT[],
    null, 'Not covered - biosimilar preferred', null, 'v2.1', '2025-01-01',
    null, '2026-04-01T00:00:00Z', ARRAY['coverage_status']
  ),
  (
    'seed-005', 'upmc', 'Humira', 'adalimumab', 'adalimumab', 'J0135', 'covered', 'preferred_specialty',
    true, 'Patient must meet specific clinical criteria.', false, ARRAY[]::TEXT[], null, ARRAY['RA', 'PsA'],
    '40mg every 2 weeks', 'Clinical diagnosis required', '12 months', 'v4.0', '2025-01-01',
    null, '2026-04-01T00:00:00Z', ARRAY[]::TEXT[]
  ),
  (
    'seed-006', 'priority_health', 'Humira', 'adalimumab', 'adalimumab', 'J0135', 'covered', 'non_preferred',
    true, 'Step therapy and prior authorization required.', true, ARRAY['methotrexate'], null, ARRAY['RA'],
    '40mg every 2 weeks', 'Must fail conventional therapy', '6 months', 'v3.5', '2025-01-01',
    null, '2026-04-01T00:00:00Z', ARRAY[]::TEXT[]
  ),
  (
    'seed-007', 'florida_blue', 'Humira', 'adalimumab', 'adalimumab', 'J0135', 'covered', 'preferred_specialty',
    false, null, false, ARRAY[]::TEXT[], null, ARRAY['RA', 'PsA', 'CD', 'UC'],
    '40mg every 2 weeks', 'Standard coverage', '12 months', 'v4.3', '2025-01-01',
    null, '2026-04-01T00:00:00Z', ARRAY[]::TEXT[]
  )
ON CONFLICT (id) DO NOTHING;