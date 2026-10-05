import { Badge } from '@/components/Badge'
import type { Claim } from '@/domain'
import { formatAge } from '@/lib/formatAge'
import { CLAIM_STATE_LABELS, LINE_LABELS } from '@/lib/labels'
import { CLAIM_STATE_ICON, CLAIM_STATE_TONE } from './labels'

export function ClaimHeader({ claim, now }: { claim: Claim; now: Date }) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h1 id="review-heading" className="text-2xl font-semibold tabular-nums">
        {claim.id}
      </h1>
      <Badge
        icon={CLAIM_STATE_ICON[claim.state]}
        tone={CLAIM_STATE_TONE[claim.state]}
        label={CLAIM_STATE_LABELS[claim.state]}
      />
      <span className="text-ink-muted">
        {LINE_LABELS[claim.lineOfBusiness]}
        <span aria-hidden="true" className="mx-2">
          ·
        </span>
        Flagged{' '}
        <span className="tabular-nums">{formatAge(claim.flaggedAt, now)}</span>{' '}
        ago
      </span>
    </header>
  )
}
