import { ClaimsRepositoryError, reviewReducer } from '@/domain'
import type {
  Claim,
  ClaimId,
  ClaimsRepository,
  ClaimSummary,
  ExceptionFilter,
  ReviewAction,
} from '@/domain'
import { detailedClaims } from './detailedClaims'
import { lightClaims } from './lightClaims'

export const mockClaims: readonly Claim[] = [...detailedClaims, ...lightClaims]

export type MockRepositoryOptions = {
  /** Artificial latency per call, so loading states have something to show. Zero in tests. */
  delayMs?: number
  /** Defaults to the shared fixtures. Tests may pass their own. */
  claims?: readonly Claim[]
  now?: () => Date
}

function toSummary(claim: Claim): ClaimSummary {
  return {
    id: claim.id,
    employer: claim.employer,
    exceptionReasons: [...claim.exceptionReasons],
    receivedAt: claim.receivedAt,
    assignee: claim.assignee,
    state: claim.state,
  }
}

export function createMockClaimsRepository(
  options: MockRepositoryOptions = {},
): ClaimsRepository {
  const { delayMs = 0, claims = mockClaims, now = () => new Date() } = options

  // Each repository owns a private copy, and hands out copies, so one
  // caller can never change what another sees.
  const store = new Map<ClaimId, Claim>(
    claims.map((c) => [c.id, structuredClone(c)]),
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
    async listExceptions(filter?: ExceptionFilter) {
      await wait()
      return [...store.values()]
        .filter(
          (c) =>
            (!filter?.reason || c.exceptionReasons.includes(filter.reason)) &&
            (!filter?.state || c.state === filter.state) &&
            (!filter?.assignee || c.assignee === filter.assignee),
        )
        .map(toSummary)
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
