import type { ClaimId } from '@/domain'

/** Which screen is showing. Held in React state; see docs/decisions/0004. */
export type Screen = { name: 'queue' } | { name: 'review'; claimId: ClaimId }
