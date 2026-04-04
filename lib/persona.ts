import type { Persona } from './types';

export type { Persona };

// ─── Column definitions ──────────────────────────────────────────────────────

interface Column {
  key:   string;
  label: string;
}

const COLUMNS: Record<Persona, Column[]> = {
  analyst: [
    { key: 'payer_id',            label: 'Payer' },
    { key: 'coverage_status',     label: 'Coverage' },
    { key: 'prior_auth_criteria', label: 'PA Criteria' },
    { key: 'step_therapy',        label: 'Step Therapy' },
    { key: 'changed_fields',      label: 'Changed This Qtr' },
    { key: 'effective_date',      label: 'Effective Date' },
  ],
  mfr: [
    { key: 'payer_id',         label: 'Payer' },
    { key: 'coverage_status',  label: 'Coverage' },
    { key: 'indications',      label: 'Covered Indications' },
    { key: 'quantity_limit',   label: 'Net Price Tier' },
    { key: 'site_of_care',     label: 'Access Classification' },
    { key: 'effective_date',   label: 'Effective Date' },
  ],
  plan: [
    { key: 'payer_id',         label: 'Payer' },
    { key: 'coverage_status',  label: 'Your Policy' },
    { key: 'clinical_criteria', label: 'Peer Benchmark Rank' },
    { key: 'changed_fields',   label: 'Variance Flag' },
    { key: 'effective_date',   label: 'Effective Date' },
  ],
};

// ─── Filter chips ────────────────────────────────────────────────────────────

const FILTERS: Record<Persona, string[]> = {
  analyst: ['All payers', 'PA required', 'Changed this qtr', 'Denied'],
  mfr:     ['All payers', 'By indication', 'Biosimilar exposure', 'Open access', 'Restricted'],
  plan:    ['All drugs', 'My policy only', 'Outliers', 'More restrictive', 'More permissive', 'Changed'],
};

// ─── Action buttons ──────────────────────────────────────────────────────────

const ACTIONS: Record<Persona, string[]> = {
  analyst: ['Open in Compare', 'Export CSV', 'Upload policy'],
  mfr:     ['Export access report', 'View competitive positioning'],
  plan:    ['Export benchmark report', 'Flag for review'],
};

// ─── Banner text ─────────────────────────────────────────────────────────────

const BANNER_TEXT: Record<Persona, string> = {
  analyst: 'Tracking policy changes across 48+ payers in real time.',
  mfr:     'Monitoring formulary access and competitive positioning for your portfolio.',
  plan:    'Benchmarking your clinical policies against peer payers.',
};

// ─── Search labels ────────────────────────────────────────────────────────────

const SEARCH_LABELS: Record<Persona, string> = {
  analyst: 'Search by drug, payer, or J-code…',
  mfr:     'Search by drug or indication…',
  plan:    'Search by drug or peer payer…',
};

// ─── Dashboard metric cards ──────────────────────────────────────────────────

interface MetricCard {
  label: string;
  key:   string;
}

const METRIC_CARDS: Record<Persona, MetricCard[]> = {
  analyst: [
    { label: 'PAYERS TRACKED',  key: 'payersTracked' },
    { label: 'POLICIES INDEXED', key: 'policiesIndexed' },
    { label: 'CHANGED THIS QTR', key: 'changedThisQtr' },
    { label: 'PA REQUIRED',     key: 'paRequired' },
  ],
  mfr: [
    { label: 'PAYERS COVERING',   key: 'payersCovering' },
    { label: 'OPEN ACCESS',       key: 'openAccess' },
    { label: 'PA REQUIRED',       key: 'paRequired' },
    { label: 'BIOSIMILAR EXPOSED', key: 'biosimilarExposed' },
  ],
  plan: [
    { label: 'DRUGS BENCHMARKED', key: 'drugsBenchmarked' },
    { label: 'MORE RESTRICTIVE',  key: 'moreRestrictive' },
    { label: 'MORE PERMISSIVE',   key: 'morePermissive' },
    { label: 'POLICY CHANGES',    key: 'policyChanges' },
  ],
};

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PersonaConfig {
  columns:     Column[];
  filters:     string[];
  actions:     string[];
  bannerText:  string;
  searchLabel: string;
  metricCards: MetricCard[];
}

export function getPersonaConfig(persona: Persona): PersonaConfig {
  return {
    columns:     COLUMNS[persona],
    filters:     FILTERS[persona],
    actions:     ACTIONS[persona],
    bannerText:  BANNER_TEXT[persona],
    searchLabel: SEARCH_LABELS[persona],
    metricCards: METRIC_CARDS[persona],
  };
}

export const ROLE_TO_PERSONA: Record<string, Persona> = {
  'ANALYST':      'analyst',
  'MANUFACTURER': 'mfr',
  'HEALTH PLAN':  'plan',
};
