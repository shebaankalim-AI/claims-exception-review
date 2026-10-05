import type { ExceptionReason, LineOfBusiness } from '@/domain'

// Display words live here, not in domain: the domain says what a reason is,
// the screen says how to phrase it.
export const REASON_LABELS: Record<ExceptionReason, string> = {
  class_code_unclear: 'Class code unclear',
  policy_tier_ambiguous: 'Policy tier unclear',
  document_missing: 'Document missing',
  non_english_form: 'Non-English form',
  possible_duplicate: 'Possible duplicate',
}

export const LINE_LABELS: Record<LineOfBusiness, string> = {
  workers_comp: "Workers' comp",
  occupational_accident: 'Occupational accident',
  employers_liability: "Employers' liability",
}

export const REASONS = Object.keys(REASON_LABELS) as ExceptionReason[]
export const LINES = Object.keys(LINE_LABELS) as LineOfBusiness[]

export const AGE_OPTIONS = [
  { id: 'any', label: 'Any age', minutes: undefined },
  { id: '1h', label: 'Over 1 hour', minutes: 60 },
  { id: '4h', label: 'Over 4 hours', minutes: 4 * 60 },
  { id: '1d', label: 'Over 1 day', minutes: 24 * 60 },
] as const

export type AgeOptionId = (typeof AGE_OPTIONS)[number]['id']
