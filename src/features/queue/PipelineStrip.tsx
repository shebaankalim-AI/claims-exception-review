import { card } from '@/components/controls'
import type { PipelineSummary } from '@/domain'

type PipelineStripProps = {
  pipeline: PipelineSummary
  /** The length of the queue itself, so this number can't disagree with the table. */
  needsReview: number
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className={`${card} flex min-w-0 flex-col gap-1 p-5`}>
      <dt className="truncate text-sm text-ink-muted">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

export function PipelineStrip({ pipeline, needsReview }: PipelineStripProps) {
  // Everything received is filed, with the agent, or waiting for an examiner,
  // so the first number is worked out from the other three and always adds up.
  const received =
    pipeline.filedAutomatically + pipeline.agentWorking + needsReview
  return (
    <dl className="grid grid-cols-4 gap-4">
      <Cell label="Received today" value={received} />
      <Cell label="Agent working" value={pipeline.agentWorking} />
      <Cell label="Filed automatically" value={pipeline.filedAutomatically} />
      <Cell label="Needs review" value={needsReview} />
    </dl>
  )
}

export function PipelineStripSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${card} flex flex-col gap-2 p-5`}>
          <div className="h-3 w-24 rounded-sm bg-border" />
          <div className="h-6 w-12 rounded-sm bg-border" />
        </div>
      ))}
    </div>
  )
}
