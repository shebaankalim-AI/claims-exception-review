import type { ReviewError } from './review'
import type {
  Claim,
  ClaimId,
  ClaimState,
  ClaimSummary,
  ExceptionReason,
  LineOfBusiness,
  PipelineSummary,
  ReviewAction,
} from './types'

export type ExceptionFilter = {
  /** Matches the claim's primary reason, the one the queue shows. */
  reason?: ExceptionReason
  lineOfBusiness?: LineOfBusiness
  /** Only claims flagged at least this many minutes ago. */
  minAgeMinutes?: number
  state?: ClaimState
  assignee?: string
}

export type ClaimsRepositoryErrorCode = 'not_found' | ReviewError['code']

/** What every repository rejects with, so screens handle one error shape. */
export class ClaimsRepositoryError extends Error {
  readonly code: ClaimsRepositoryErrorCode

  constructor(code: ClaimsRepositoryErrorCode, message: string) {
    super(message)
    this.name = 'ClaimsRepositoryError'
    this.code = code
  }
}

export interface ClaimsRepository {
  listExceptions(filter?: ExceptionFilter): Promise<ClaimSummary[]>
  getPipelineSummary(): Promise<PipelineSummary>
  getClaim(id: ClaimId): Promise<Claim>
  /** Rejects with ClaimsRepositoryError if the action is illegal for the claim. */
  applyAction(id: ClaimId, action: ReviewAction): Promise<Claim>
}
