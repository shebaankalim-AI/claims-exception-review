import type { ReviewError } from './review'
import type {
  Claim,
  ClaimId,
  ClaimState,
  ClaimSummary,
  ExceptionReason,
  ReviewAction,
} from './types'

export type ExceptionFilter = {
  reason?: ExceptionReason
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
  getClaim(id: ClaimId): Promise<Claim>
  /** Rejects with ClaimsRepositoryError if the action is illegal for the claim. */
  applyAction(id: ClaimId, action: ReviewAction): Promise<Claim>
}
