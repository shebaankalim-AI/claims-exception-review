import type { ClaimSummary, ExceptionReason } from '@/domain'
import { REASON_LABELS } from './labels'

/** Counts by primary reason, largest first. Ties keep a stable order by label. */
export function countByReason(
  claims: ClaimSummary[],
): [ExceptionReason, number][] {
  const counts = new Map<ExceptionReason, number>()
  for (const claim of claims) {
    const reason = claim.exceptionReasons[0]
    counts.set(reason, (counts.get(reason) ?? 0) + 1)
  }
  return [...counts.entries()].sort(
    ([reasonA, a], [reasonB, b]) =>
      b - a || REASON_LABELS[reasonA].localeCompare(REASON_LABELS[reasonB]),
  )
}

export function oldestClaim(claims: ClaimSummary[]): ClaimSummary | null {
  return claims.reduce<ClaimSummary | null>(
    (best, c) =>
      best === null || new Date(c.flaggedAt) < new Date(best.flaggedAt)
        ? c
        : best,
    null,
  )
}
