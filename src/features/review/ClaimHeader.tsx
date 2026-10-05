import type { Claim } from '@/domain'
import { formatAge } from '@/lib/formatAge'
import { CLAIM_STATE_LABELS, LINE_LABELS } from '@/lib/labels'
import { CLAIM_STATE_ICON, CLAIM_STATE_TONE } from './labels'
import { StateLabel } from './StateLabel'

export function ClaimHeader({ claim, now }: { claim: Claim; now: Date }) {
  return (
    <header className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
      <h1 id="review-heading" className="text-xl font-semibold tabular-nums">
        {claim.id}
      </h1>
      <StateLabel
        icon={CLAIM_STATE_ICON[claim.state]}
        tone={CLAIM_STATE_TONE[claim.state]}
        label={CLAIM_STATE_LABELS[claim.state]}
      />
      <span>{LINE_LABELS[claim.lineOfBusiness]}</span>
      <span className="text-slate-600">
        Flagged {formatAge(claim.flaggedAt, now)} ago
      </span>
    </header>
  )
}
