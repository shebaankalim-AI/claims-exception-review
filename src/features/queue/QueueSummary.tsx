import { AssistantCard } from '@/components/AssistantCard'
import { buttonSecondary, linkButton } from '@/components/controls'
import type { ClaimId } from '@/domain'
import { useNow } from '@/lib/clock'
import { formatAge } from '@/lib/formatAge'
import { REASON_LABELS } from './labels'
import { countByReason, oldestClaim } from './queueStats'
import type { Queue } from './useQueue'

type QueueSummaryProps = {
  queue: Queue
  onOpenClaim: (id: ClaimId) => void
}

/**
 * The assistant's summary of the queue, worked out from the same list the
 * table shows. There is no model behind it: every line is derived from the
 * data, so it can't claim anything the queue doesn't.
 */
export function QueueSummary({ queue, onOpenClaim }: QueueSummaryProps) {
  const now = useNow()
  const { state } = queue

  if (state.status === 'loading') {
    return <p className="text-ink-muted">Reading the queue…</p>
  }
  if (state.status === 'error') {
    return (
      <p className="text-ink-muted">
        The summary is unavailable because the queue could not load.
      </p>
    )
  }

  const { claims, pipeline } = state
  const needYou = claims.length
  const received = pipeline.filedAutomatically + pipeline.agentWorking + needYou
  const reasons = countByReason(claims)
  const largest = reasons[0]?.[1] ?? 1
  const oldest = oldestClaim(claims)

  return (
    <div className="flex flex-col gap-3">
      <AssistantCard>
        <p className="text-lg">
          {received} claims received today. The agent filed{' '}
          {pipeline.filedAutomatically} on its own and is working on{' '}
          {pipeline.agentWorking}.{' '}
          {needYou === 0 ? (
            <>None need you.</>
          ) : (
            <>
              <strong className="font-semibold tabular-nums">{needYou}</strong>{' '}
              {needYou === 1 ? 'needs' : 'need'} you.
            </>
          )}
        </p>
      </AssistantCard>

      {needYou > 0 && (
        <AssistantCard title="Why they stopped" icon="reports">
          <ul className="flex flex-col gap-3">
            {reasons.map(([reason, count]) => (
              <li key={reason} className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span>{REASON_LABELS[reason]}</span>
                  <span className="font-semibold tabular-nums">{count}</span>
                </span>
                {/* Scaled to the largest count; the number is the real value. */}
                <span
                  aria-hidden="true"
                  className="h-2 rounded-full bg-surface-hover"
                >
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(count / largest) * 100}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </AssistantCard>
      )}

      {oldest && (
        <AssistantCard title="Suggested next" icon="next">
          <p>
            <button
              type="button"
              onClick={() => onOpenClaim(oldest.id)}
              className={`${linkButton} tabular-nums`}
            >
              {oldest.id}
            </button>
            <span className="text-ink-muted">
              {' '}
              waited longest, {formatAge(oldest.flaggedAt, now)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => onOpenClaim(oldest.id)}
            className={`${buttonSecondary} self-start tabular-nums`}
          >
            Open {oldest.id}
          </button>
        </AssistantCard>
      )}
    </div>
  )
}
