import type {
  ClaimState,
  ExceptionReason,
  FieldStatus,
  LineOfBusiness,
} from '@/domain'

// Display words for domain values, shared by the screens that show them.
// The domain says what a value is; this says how to phrase it.
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

export const CLAIM_STATE_LABELS: Record<ClaimState, string> = {
  needs_review: 'Needs review',
  approved: 'Approved',
  filed: 'Filed',
  sent_back: 'Sent back',
  escalated: 'Escalated',
}

export const FIELD_STATUS_LABELS: Record<FieldStatus, string> = {
  verified: 'Verified',
  needs_review: 'Needs review',
  missing: 'Missing',
  edited: 'Edited',
}
