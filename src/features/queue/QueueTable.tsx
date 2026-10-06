import { Badge } from '@/components/Badge'
import { card } from '@/components/controls'
import type { ClaimId, ClaimSummary } from '@/domain'
import { formatAge } from '@/lib/formatAge'
import { LINE_LABELS, REASON_LABELS } from './labels'

const headerClass =
  'h-10 px-4 text-left text-xs font-medium whitespace-nowrap text-ink-muted'
const cellClass = 'px-4 py-2 align-middle'

function WhatsNeeded({ claim }: { claim: ClaimSummary }) {
  const { toConfirmCount, missingCount } = claim
  // Nothing open but still in the queue means the examiner only has to approve.
  if (toConfirmCount === 0 && missingCount === 0) {
    return (
      <Badge tone="verified" icon="stateVerified" label="Ready to approve" />
    )
  }
  return (
    <span className="flex flex-col items-start gap-1">
      {toConfirmCount > 0 && (
        <Badge
          tone="needs-review"
          icon="stateNeedsReview"
          label={`${toConfirmCount} to confirm`}
        />
      )}
      {missingCount > 0 && (
        <Badge
          tone="missing"
          icon="stateMissing"
          label={`${missingCount} missing`}
        />
      )}
    </span>
  )
}

type QueueTableProps = {
  /** Already sorted, oldest first. */
  claims: ClaimSummary[]
  now: Date
  onOpenClaim: (id: ClaimId) => void
}

export function QueueTable({ claims, now, onOpenClaim }: QueueTableProps) {
  return (
    // The card keeps its corners; the scroller inside it lets a narrow window
    // scroll the table sideways instead of squeezing columns into each other.
    <div className={`${card} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-queue-table table-fixed border-collapse">
          <caption className="sr-only">Exceptions, oldest first</caption>
          <thead className="border-b border-border bg-surface-muted">
            <tr>
              <th scope="col" className={`${headerClass} w-col-claim`}>
                Claim
              </th>
              <th scope="col" className={`${headerClass} w-col-line`}>
                Line
              </th>
              <th scope="col" className={headerClass}>
                Why the agent stopped
              </th>
              <th scope="col" className={`${headerClass} w-col-needed`}>
                What&apos;s needed
              </th>
              <th scope="col" className={`${headerClass} w-col-age`}>
                Age
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {claims.map((claim) => (
              // The whole row opens the claim for the mouse. The ID button is the
              // keyboard and screen reader path, and stops the click so it only fires once.
              <tr
                key={claim.id}
                onClick={() => onOpenClaim(claim.id)}
                className="h-12 cursor-pointer hover:bg-surface-muted"
              >
                <td className={cellClass}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenClaim(claim.id)
                    }}
                    className="focus-ring rounded-sm font-medium whitespace-nowrap text-accent tabular-nums hover:text-accent-hover hover:underline"
                  >
                    {claim.id}
                  </button>
                </td>
                <td className={`${cellClass} whitespace-nowrap`}>
                  {LINE_LABELS[claim.lineOfBusiness]}
                </td>
                <td className={cellClass}>
                  <div className="truncate font-medium">
                    {REASON_LABELS[claim.exceptionReasons[0]]}
                  </div>
                  <div className="line-clamp-2 text-sm text-ink-muted">
                    {claim.agentNote}
                  </div>
                </td>
                <td className={cellClass}>
                  <WhatsNeeded claim={claim} />
                </td>
                <td className={`${cellClass} whitespace-nowrap tabular-nums`}>
                  {formatAge(claim.flaggedAt, now)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function QueueTableSkeleton() {
  return (
    <div aria-hidden="true" className={`${card} overflow-hidden`}>
      <table className="w-full border-collapse">
        <tbody className="divide-y divide-border">
          {[0, 1, 2, 3, 4].map((i) => (
            <tr key={i} className="h-12">
              {['w-24', 'w-32', 'w-64', 'w-32', 'w-16'].map((width, j) => (
                <td key={j} className={cellClass}>
                  <div className={`h-4 rounded-sm bg-border ${width}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
