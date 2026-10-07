import type { ExceptionFilter } from './repositories'
import type { ClaimSummary } from './types'

/** Whole minutes since the claim was flagged. Never negative. */
export function ageInMinutes(flaggedAt: string, now: Date): number {
  const elapsed = now.getTime() - new Date(flaggedAt).getTime()
  return Number.isNaN(elapsed) ? 0 : Math.max(0, Math.floor(elapsed / 60_000))
}

/**
 * The one definition of what a filter means. A repository applies it on the
 * server side of the boundary and the queue applies it to the list it already
 * holds, so the two can't drift apart.
 */
export function matchesExceptionFilter(
  claim: ClaimSummary,
  filter: ExceptionFilter,
  now: Date,
): boolean {
  return (
    (filter.reason === undefined ||
      claim.exceptionReasons[0] === filter.reason) &&
    (filter.lineOfBusiness === undefined ||
      claim.lineOfBusiness === filter.lineOfBusiness) &&
    (filter.state === undefined || claim.state === filter.state) &&
    (filter.assignee === undefined || claim.assignee === filter.assignee) &&
    (filter.minAgeMinutes === undefined ||
      ageInMinutes(claim.flaggedAt, now) >= filter.minAgeMinutes)
  )
}
