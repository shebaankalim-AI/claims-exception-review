import { useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { matchesExceptionFilter } from '@/domain'
import type { ClaimId, PipelineSummary } from '@/domain'
import { useNow } from '@/lib/clock'
import { formatClock } from '@/lib/formatClock'
import { AGE_OPTIONS } from './labels'
import { PipelineStrip, PipelineStripSkeleton } from './PipelineStrip'
import { hasActiveFilters, NO_FILTERS } from './filterState'
import type { FilterState } from './filterState'
import { QueueFilters } from './QueueFilters'
import { QueueTable, QueueTableSkeleton } from './QueueTable'
import { oldestFirst } from './sortClaims'
import type { Queue } from './useQueue'

type QueueScreenProps = {
  queue: Queue
  onOpenClaim: (id: ClaimId) => void
  /** A line about what just happened, such as a claim being sent back. */
  notice?: string | null
  onDismissNotice?: () => void
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-border bg-surface p-6">
      {children}
    </div>
  )
}

const buttonClass =
  'focus-ring h-control rounded-md border border-border-strong bg-surface px-3 hover:bg-surface-muted'

function ErrorCard({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <Card>
      <p role="alert" className="flex items-center gap-2 font-medium">
        <span className="text-missing">
          <Icon name="exceptions" size="lg" />
        </span>
        Couldn&apos;t load the queue
      </p>
      <p className="text-ink-muted">{message}</p>
      <button type="button" onClick={onRetry} className={buttonClass}>
        Retry
      </button>
    </Card>
  )
}

function AllClearCard({
  pipeline,
  checkedAt,
}: {
  pipeline: PipelineSummary
  checkedAt: string
}) {
  return (
    <Card>
      <p className="flex items-center gap-2 text-lg font-semibold">
        <span className="text-verified">
          <Icon name="stateVerified" size="lg" />
        </span>
        All clear
      </p>
      <p className="text-ink-muted">
        Nothing needs you right now. The agent is working on{' '}
        {pipeline.agentWorking}.
      </p>
      <p className="text-ink-muted">Last checked {formatClock(checkedAt)}</p>
    </Card>
  )
}

export function QueueScreen({
  queue,
  onOpenClaim,
  notice,
  onDismissNotice,
}: QueueScreenProps) {
  const now = useNow()
  const [filters, setFilters] = useState<FilterState>(NO_FILTERS)
  const { state } = queue

  const needYou = state.status === 'ready' ? state.claims.length : null
  const subtitle = "Claims the agent couldn't finish."

  let body: ReactNode
  if (state.status === 'loading') {
    body = (
      <>
        <p role="status" className="sr-only">
          Loading exceptions
        </p>
        <PipelineStripSkeleton />
        <QueueTableSkeleton />
      </>
    )
  } else if (state.status === 'error') {
    body = <ErrorCard message={state.message} onRetry={queue.retry} />
  } else if (state.claims.length === 0) {
    // The day's numbers stay, with the queue at zero.
    body = (
      <>
        <PipelineStrip pipeline={state.pipeline} needsReview={0} />
        <AllClearCard pipeline={state.pipeline} checkedAt={state.checkedAt} />
      </>
    )
  } else {
    // The same definition of a filter the repository uses, applied to the list we hold.
    const ageMinutes = AGE_OPTIONS.find((o) => o.id === filters.age)?.minutes
    const visible = oldestFirst(
      state.claims.filter((claim) =>
        matchesExceptionFilter(
          claim,
          {
            reason: filters.reason || undefined,
            lineOfBusiness: filters.line || undefined,
            minAgeMinutes: ageMinutes,
          },
          now,
        ),
      ),
    )
    const active = hasActiveFilters(filters)
    const clear = () => setFilters(NO_FILTERS)

    body = (
      <>
        <PipelineStrip
          pipeline={state.pipeline}
          needsReview={state.claims.length}
        />
        <QueueFilters
          filters={filters}
          onChange={setFilters}
          showClear={active && visible.length > 0}
          onClear={clear}
        />
        {visible.length === 0 ? (
          <Card>
            <p className="font-medium">No claims match these filters</p>
            <button type="button" onClick={clear} className={buttonClass}>
              Clear filters
            </button>
          </Card>
        ) : (
          <QueueTable claims={visible} now={now} onOpenClaim={onOpenClaim} />
        )}
      </>
    )
  }

  return (
    <section
      aria-labelledby="queue-heading"
      aria-busy={state.status === 'loading'}
      className="flex flex-col gap-4 p-6"
    >
      <div>
        <h1 id="queue-heading" className="text-xl font-semibold">
          Exceptions
        </h1>
        <p className="text-ink-muted">
          {subtitle}
          {needYou !== null &&
            ` ${needYou} need${needYou === 1 ? 's' : ''} you.`}
        </p>
      </div>
      {notice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md border border-border bg-verified-soft p-2"
        >
          <span className="text-verified">
            <Icon name="success" />
          </span>
          {notice}
          {onDismissNotice && (
            <button
              type="button"
              onClick={onDismissNotice}
              className="focus-ring ml-auto rounded-sm px-2 hover:underline"
            >
              Dismiss
            </button>
          )}
        </p>
      )}
      {body}
    </section>
  )
}
