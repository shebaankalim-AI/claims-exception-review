import { Icon } from '@/components/Icon'
import type { ClaimId, ClaimSummary } from '@/domain'
import { formatAge } from '@/lib/formatAge'
import { LINE_LABELS, REASON_LABELS } from './labels'

const headerClass =
  'px-3 py-2 text-left text-xs font-medium tracking-wide text-slate-600 uppercase'
const cellClass = 'px-3 py-2 align-top'

function WhatsNeeded({ claim }: { claim: ClaimSummary }) {
  const { toConfirmCount, missingCount } = claim
  // Nothing open but still in the queue means the examiner only has to approve.
  if (toConfirmCount === 0 && missingCount === 0) {
    return (
      <span className="flex items-center gap-1">
        <span className="text-verified">
          <Icon name="stateVerified" />
        </span>
        Ready to approve
      </span>
    )
  }
  return (
    <ul className="flex flex-col gap-1">
      {toConfirmCount > 0 && (
        <li className="flex items-center gap-1">
          <span className="text-needs-review">
            <Icon name="stateNeedsReview" />
          </span>
          {toConfirmCount} to confirm
        </li>
      )}
      {missingCount > 0 && (
        <li className="flex items-center gap-1">
          <span className="text-missing">
            <Icon name="stateMissing" />
          </span>
          {missingCount} missing
        </li>
      )}
    </ul>
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
    <table className="w-full border-collapse rounded-md border border-slate-200 bg-surface">
      <caption className="sr-only">Exceptions, oldest first</caption>
      <thead className="border-b border-slate-200 bg-slate-50">
        <tr>
          <th scope="col" className={headerClass}>
            Claim
          </th>
          <th scope="col" className={headerClass}>
            Line
          </th>
          <th scope="col" className={headerClass}>
            Why the agent stopped
          </th>
          <th scope="col" className={headerClass}>
            What&apos;s needed
          </th>
          <th scope="col" className={headerClass}>
            Age
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {claims.map((claim) => (
          // The whole row opens the claim for the mouse. The ID button is the
          // keyboard and screen reader path, and stops the click so it only fires once.
          <tr
            key={claim.id}
            onClick={() => onOpenClaim(claim.id)}
            className="cursor-pointer hover:bg-slate-50"
          >
            <td className={cellClass}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenClaim(claim.id)
                }}
                className="focus-ring rounded-sm font-medium text-accent tabular-nums hover:underline"
              >
                {claim.id}
              </button>
            </td>
            <td className={cellClass}>{LINE_LABELS[claim.lineOfBusiness]}</td>
            <td className={cellClass}>
              <div className="font-medium">
                {REASON_LABELS[claim.exceptionReasons[0]]}
              </div>
              <div className="text-slate-600">{claim.agentNote}</div>
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
  )
}

export function QueueTableSkeleton() {
  return (
    <table
      aria-hidden="true"
      className="w-full border-collapse rounded-md border border-slate-200 bg-surface"
    >
      <tbody className="divide-y divide-slate-200">
        {[0, 1, 2, 3, 4].map((i) => (
          <tr key={i}>
            {['w-24', 'w-32', 'w-64', 'w-32', 'w-16'].map((width, j) => (
              <td key={j} className={cellClass}>
                <div className={`h-4 rounded-sm bg-slate-200 ${width}`} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
