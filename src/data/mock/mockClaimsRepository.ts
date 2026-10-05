import {
  ClaimsRepositoryError,
  matchesExceptionFilter,
  reviewReducer,
} from '@/domain'
import type {
  Claim,
  ClaimId,
  ClaimsRepository,
  ClaimSummary,
  ExceptionFilter,
  PipelineSummary,
  ReviewAction,
} from '@/domain'
import { detailedClaims } from './detailedClaims'
import { lightClaims } from './lightClaims'
import { MOCK_REFERENCE_TIME } from './referenceTime'

export const mockClaims: readonly Claim[] = [...detailedClaims, ...lightClaims]

// Counts the mock agent reports. They don't have to add up to the queue length:
// the queue also holds claims from earlier days.
const MOCK_PIPELINE: PipelineSummary = {
  receivedToday: 142,
  agentWorking: 6,
  filedAutomatically: 127,
}

export type MockRepositoryOptions = {
  /** Artificial latency per call, so loading states have something to show. Zero in tests. */
  delayMs?: number
  /** Defaults to the shared fixtures. Tests may pass their own. */
  claims?: readonly Claim[]
  pipeline?: PipelineSummary
  /** The repository's clock. Ages are measured against it. */
  now?: () => Date
}

function toSummary(claim: Claim): ClaimSummary {
  const [primary, ...others] = claim.exceptionReasons
  return {
    id: claim.id,
    employer: claim.employer,
    lineOfBusiness: claim.lineOfBusiness,
    exceptionReasons: [primary, ...others],
    agentNote: claim.agentNote,
    receivedAt: claim.receivedAt,
    flaggedAt: claim.flaggedAt,
    assignee: claim.assignee,
    state: claim.state,
    // Counted from the fields, so a summary can't disagree with its claim.
    toConfirmCount: claim.fields.filter((f) => f.status === 'needs_review')
      .length,
    missingCount: claim.fields.filter((f) => f.status === 'missing').length,
  }
}

function shiftTime(iso: string, shiftMs: number): string {
  return new Date(new Date(iso).getTime() + shiftMs).toISOString()
}

function rebase(claim: Claim, shiftMs: number): Claim {
  if (shiftMs === 0) return structuredClone(claim)
  const copy = structuredClone(claim)
  copy.receivedAt = shiftTime(copy.receivedAt, shiftMs)
  copy.flaggedAt = shiftTime(copy.flaggedAt, shiftMs)
  copy.activity = copy.activity.map((a) => ({
    ...a,
    at: shiftTime(a.at, shiftMs),
  }))
  return copy
}

export function createMockClaimsRepository(
  options: MockRepositoryOptions = {},
): ClaimsRepository {
  const {
    delayMs = 0,
    claims = mockClaims,
    pipeline = MOCK_PIPELINE,
    now = () => new Date(),
  } = options

  // Each repository owns a private copy, and hands out copies, so one
  // caller can never change what another sees.
  const shiftMs = now().getTime() - MOCK_REFERENCE_TIME.getTime()
  const store = new Map<ClaimId, Claim>(
    claims.map((c) => [c.id, rebase(c, shiftMs)]),
  )

  const wait = () =>
    delayMs > 0
      ? new Promise<void>((resolve) => setTimeout(resolve, delayMs))
      : Promise.resolve()

  function requireClaim(id: ClaimId): Claim {
    const claim = store.get(id)
    if (!claim) {
      throw new ClaimsRepositoryError('not_found', `No claim ${id}.`)
    }
    return claim
  }

  return {
    async listExceptions(filter: ExceptionFilter = {}) {
      await wait()
      const at = now()
      return [...store.values()]
        .map(toSummary)
        .filter((summary) => matchesExceptionFilter(summary, filter, at))
    },

    async getPipelineSummary() {
      await wait()
      return { ...pipeline }
    },

    async getClaim(id: ClaimId) {
      await wait()
      return structuredClone(requireClaim(id))
    },

    async applyAction(id: ClaimId, action: ReviewAction) {
      await wait()
      const result = reviewReducer(requireClaim(id), action, now())
      if (!result.ok) {
        throw new ClaimsRepositoryError(result.error.code, result.error.message)
      }
      store.set(id, result.claim)
      return structuredClone(result.claim)
    },
  }
}
