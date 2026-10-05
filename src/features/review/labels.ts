import type { IconName } from '@/components/Icon'
import type { ClaimState, FieldStatus, Stage } from '@/domain'

export const STAGE_LABELS: Record<Stage, string> = {
  intake: 'Intake',
  coverage: 'Coverage',
  liability: 'Liability',
  damages: 'Damages',
  recovery: 'Recovery',
}

// Icons and colours for state. The colour is only ever a second signal: each
// state is always drawn with its icon and its word.
export const FIELD_STATUS_ICON: Record<FieldStatus, IconName> = {
  verified: 'stateVerified',
  needs_review: 'stateNeedsReview',
  missing: 'stateMissing',
  edited: 'stateEdited',
}

export const FIELD_STATUS_TONE: Record<FieldStatus, string> = {
  verified: 'text-verified',
  needs_review: 'text-needs-review',
  missing: 'text-missing',
  edited: 'text-edited',
}

export const CLAIM_STATE_ICON: Record<ClaimState, IconName> = {
  needs_review: 'stateNeedsReview',
  approved: 'stateApproved',
  filed: 'stateFiled',
  sent_back: 'stateSentBack',
  escalated: 'stateEscalated',
}

export const CLAIM_STATE_TONE: Record<ClaimState, string> = {
  needs_review: 'text-needs-review',
  approved: 'text-verified',
  filed: 'text-verified',
  sent_back: 'text-edited',
  escalated: 'text-missing',
}
