import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import type { PipelineSummary } from '@/domain'

type PipelineStripProps = {
  pipeline: PipelineSummary
  /** The length of the queue itself, so this number can't disagree with the table. */
  needsReview: number
}

function Cell({
  label,
  value,
  children,
}: {
  label: string
  value: number
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <dt className="flex items-center gap-1 text-slate-600">
        {children}
        {label}
      </dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

export function PipelineStrip({ pipeline, needsReview }: PipelineStripProps) {
  // Everything received is filed, with the agent, or waiting for an examiner,
  // so the first number is worked out from the other three and always adds up.
  const received =
    pipeline.filedAutomatically + pipeline.agentWorking + needsReview
  return (
    <dl className="grid grid-cols-4 divide-x divide-slate-200 rounded-md border border-slate-200 bg-surface">
      <Cell label="Received today" value={received} />
      <Cell label="Agent working" value={pipeline.agentWorking} />
      <Cell label="Filed automatically" value={pipeline.filedAutomatically} />
      <Cell label="Needs review" value={needsReview}>
        <span className="text-needs-review">
          <Icon name="stateNeedsReview" />
        </span>
      </Cell>
    </dl>
  )
}

export function PipelineStripSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-4 divide-x divide-slate-200 rounded-md border border-slate-200 bg-surface"
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2 px-4 py-3">
          <div className="h-4 w-24 rounded-sm bg-slate-200" />
          <div className="h-6 w-12 rounded-sm bg-slate-200" />
        </div>
      ))}
    </div>
  )
}
