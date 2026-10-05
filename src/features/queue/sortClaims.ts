import type { ClaimSummary } from '@/domain'

export function oldestFirst(claims: ClaimSummary[]): ClaimSummary[] {
  return [...claims].sort(
    (a, b) => new Date(a.flaggedAt).getTime() - new Date(b.flaggedAt).getTime(),
  )
}
