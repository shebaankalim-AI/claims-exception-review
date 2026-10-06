export type ClaimId = string & { readonly __brand: 'ClaimId' }

// The one place a plain string becomes a ClaimId, so brand casts don't spread.
export function toClaimId(value: string): ClaimId {
  return value as ClaimId
}

export type DocumentId = string

export type ExceptionReason =
  | 'class_code_unclear'
  | 'policy_tier_ambiguous'
  | 'document_missing'
  | 'non_english_form'
  | 'possible_duplicate'

export type LineOfBusiness =
  'workers_comp' | 'occupational_accident' | 'employers_liability'

export type ClaimState =
  'needs_review' | 'approved' | 'filed' | 'sent_back' | 'escalated'

/** The stages a claim moves through, in order. Every field belongs to one. */
export const STAGES = [
  'intake',
  'coverage',
  'liability',
  'damages',
  'recovery',
] as const

export type Stage = (typeof STAGES)[number]

export type FieldStatus = 'verified' | 'needs_review' | 'missing' | 'edited'

export type Actor = 'agent' | 'examiner'

export type SourceRef = {
  documentId: DocumentId
  page?: number
  /** The passage the value was read from. */
  excerpt: string
  /** The exact words inside the passage to mark. Without it, the value part is marked. */
  highlight?: string
}

export type Field = {
  key: string
  label: string
  stage: Stage
  value: string | null
  /** What the agent had before the examiner edited the field. */
  previousValue?: string | null
  status: FieldStatus
  /** Plain words for why the agent was unsure, e.g. "two class codes plausible". */
  reason?: string
  /** For a missing field: which document would normally contain it. */
  expectedIn?: string
  sources: SourceRef[]
  resolvedBy: Actor
}

export type DocumentKind =
  | 'froi'
  | 'email'
  | 'fax'
  | 'medical_report'
  | 'form'
  | 'transcript'
  | 'pay_stub'

export type ClaimDocument = {
  id: DocumentId
  kind: DocumentKind
  title: string
  /** BCP 47 language tag, e.g. "en" or "es". */
  language: string
  /** Plain text, one string per page. */
  pages: string[]
}

/** How an agent step ended, for the feed. */
export type ActivityOutcome =
  'completed' | 'verified' | 'needs_review' | 'waiting'

export type ActivityEntry = {
  /** ISO 8601 timestamp. */
  at: string
  actor: Actor
  action: string
  detail?: string
  outcome?: ActivityOutcome
  sourceRefs?: SourceRef[]
}

export type Claim = {
  id: ClaimId
  employer: string
  lineOfBusiness: LineOfBusiness
  /** Why the agent stopped. The first reason is the primary one, shown in the queue. */
  exceptionReasons: [ExceptionReason, ...ExceptionReason[]]
  /** A short note in the agent's own words, e.g. "two codes plausible". Never names the claimant. */
  agentNote: string
  /** ISO 8601 timestamp. */
  receivedAt: string
  /** ISO 8601 timestamp: when the agent flagged the claim. The queue's age counts from here. */
  flaggedAt: string
  assignee: string
  state: ClaimState
  fields: Field[]
  documents: ClaimDocument[]
  activity: ActivityEntry[]
}

/** The queue's view of a claim. It holds no claimant names and no field values. */
export type ClaimSummary = Pick<
  Claim,
  | 'id'
  | 'employer'
  | 'lineOfBusiness'
  | 'exceptionReasons'
  | 'agentNote'
  | 'receivedAt'
  | 'flaggedAt'
  | 'assignee'
  | 'state'
> & {
  /** Fields still marked needs_review. Derived from the claim's fields, never stored apart from them. */
  toConfirmCount: number
  /** Fields still marked missing. Derived the same way. */
  missingCount: number
}

/** Counts the agent's pipeline reports. "Needs review" is deliberately absent: the queue is the source for it. */
export type PipelineSummary = {
  receivedToday: number
  agentWorking: number
  filedAutomatically: number
}

export type ReviewAction =
  | { type: 'confirmField'; fieldKey: string }
  | { type: 'editField'; fieldKey: string; value: string }
  | { type: 'approve' }
  | { type: 'file' }
  | { type: 'sendBack'; note?: string }
  | { type: 'escalate'; note?: string }
