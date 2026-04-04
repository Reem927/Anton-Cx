import type { PolicyDocument, DiffResult, DiffChangeType } from './types';

const DIFFABLE_FIELDS: Array<keyof PolicyDocument> = [
  'coverage_status',
  'prior_auth_required',
  'prior_auth_criteria',
  'step_therapy',
  'step_therapy_drugs',
  'site_of_care',
  'indications',
  'quantity_limit',
  'clinical_criteria',
  'renewal_period',
];

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return JSON.stringify([...value].map(String).sort());
  }
  if (typeof value === 'string') return value.trim().toLowerCase();
  return String(value);
}

function detectChangeType(prev: unknown, next: unknown): DiffChangeType {
  const prevNorm = normalizeValue(prev);
  const nextNorm = normalizeValue(next);

  if (prevNorm === nextNorm) return 'unchanged';

  const prevEmpty = prevNorm === '' || prevNorm === '[]';
  const nextEmpty = nextNorm === '' || nextNorm === '[]';

  if (prevEmpty && !nextEmpty) return 'added';
  if (!prevEmpty && nextEmpty) return 'removed';
  return 'changed';
}

export function diffPolicies(prev: PolicyDocument, next: PolicyDocument): DiffResult[] {
  return DIFFABLE_FIELDS.map((field) => ({
    field,
    change_type: detectChangeType(prev[field], next[field]),
    prev_value:  prev[field],
    next_value:  next[field],
  }));
}

export function getChangedFields(prev: PolicyDocument, next: PolicyDocument): string[] {
  return diffPolicies(prev, next)
    .filter((d) => d.change_type !== 'unchanged')
    .map((d) => d.field);
}
