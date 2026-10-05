import type { ReactNode } from 'react'
import { ageInMinutes } from '@/domain'
import type { ClaimId, ClaimSummary, ExceptionReason } from '@/domain'
import { useNow } from '@/lib/clock'
import { formatAge } from '@/lib/formatAge'
import { REASON_LABELS } from './labels'
import type { Queue } from './useQueue'

// "Just flagged" only shows for something that really is just flagged.
const JUST_FLAGGED_MINUTES = 10

type QueueDigestProps = {
  queue: Queue
  onOpenClaim: (id: ClaimId) => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-xs font-medium tracking-wide text-ink-muted uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function ClaimLink({
  id,
  onOpen,
}: {
  id: ClaimId
  onOpen: (id: ClaimId) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(id)}
      className="focus-ring rounded-sm font-medium text-accent tabular-nums hover:underline"
    >
      {id}
    </button>
  )
}

/** Counts by primary reason, largest first. Ties keep a stable order by label. */
function countByReason(claims: ClaimSummary[]) {
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

const flaggedTime = (claim: ClaimSummary) => new Date(claim.flaggedAt).getTime()

/**
 * What the agent would say about the queue, worked out from the same list the
 * table shows. There is no model behind it: every line is derived from the
 * data, so it can't claim anything the queue doesn't.
 */
export function QueueDigest({ queue, onOpenClaim }: QueueDigestProps) {
  const now = useNow()
  const { state } = queue

  if (state.status === 'loading') {
    return <p className="text-ink-muted">Reading the queue…</p>
  }
  if (state.status === 'error') {
    return (
      <p className="text-ink-muted">
        The digest is unavailable because the queue could not load.
      </p>
    )
  }

  const { claims, pipeline } = state
  const newest = claims.reduce<ClaimSummary | null>(
    (best, c) =>
      best === null || flaggedTime(c) > flaggedTime(best) ? c : best,
    null,
  )
  const oldest = claims.reduce<ClaimSummary | null>(
    (best, c) =>
      best === null || flaggedTime(c) < flaggedTime(best) ? c : best,
    null,
  )
  const justFlagged =
    newest && ageInMinutes(newest.flaggedAt, now) <= JUST_FLAGGED_MINUTES
      ? newest
      : null
  const needYou = claims.length

  return (
    <div className="flex flex-col gap-4 text-ink">
      {justFlagged && (
        <Section title="Just flagged">
          <p>
            <ClaimLink id={justFlagged.id} onOpen={onOpenClaim} />:{' '}
            {REASON_LABELS[justFlagged.exceptionReasons[0]]},{' '}
            {formatAge(justFlagged.flaggedAt, now)} ago.
          </p>
        </Section>
      )}

      <Section title="Today so far">
        <p>
          {pipeline.filedAutomatically + pipeline.agentWorking + needYou} claims
          received. The agent filed {pipeline.filedAutomatically} on its own and
          is working on {pipeline.agentWorking}.{' '}
          {needYou === 0
            ? 'None need you.'
            : `${needYou} ${needYou === 1 ? 'needs' : 'need'} you.`}
        </p>
      </Section>

      {needYou > 0 && (
        <Section title="Why they stopped">
          <ul className="flex flex-col gap-1">
            {countByReason(claims).map(([reason, count]) => (
              <li key={reason} className="flex justify-between gap-2">
                <span>{REASON_LABELS[reason]}</span>
                <span className="tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {oldest && (
        <Section title="Suggested order">
          <p>
            Start with <ClaimLink id={oldest.id} onOpen={onOpenClaim} />. It has
            waited longest, {formatAge(oldest.flaggedAt, now)}.
          </p>
        </Section>
      )}
    </div>
  )
}
