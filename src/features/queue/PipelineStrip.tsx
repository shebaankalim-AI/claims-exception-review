import { card } from '@/components/controls'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/Icon'
import type { PipelineSummary } from '@/domain'

type PipelineStripProps = {
  pipeline: PipelineSummary
  /** The length of the queue itself, so this number can't disagree with the table. */
  needsReview: number
}

function Cell({
  label,
  value,
  icon,
  tint,
}: {
  label: string
  value: number
  icon: IconName
  /** Classes for the icon circle only. The card itself stays white. */
  tint: string
}) {
  return (
    <div className={`${card} flex items-center gap-4 p-5`}>
      <span
        aria-hidden="true"
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tint}`}
      >
        <Icon name={icon} size="lg" />
      </span>
      <div className="flex flex-col">
        <dt className="text-sm text-ink-muted">{label}</dt>
        <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
      </div>
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
      <Cell
        label="Received today"
        value={received}
        icon="allClaims"
        tint="bg-edited-soft text-ink-muted"
      />
      <Cell
        label="Agent working"
        value={pipeline.agentWorking}
        icon="agentActivity"
        tint="bg-accent-soft text-accent"
      />
      <Cell
        label="Filed automatically"
        value={pipeline.filedAutomatically}
        icon="stateFiled"
        tint="bg-verified-soft text-verified"
      />
      <Cell
        label="Needs review"
        value={needsReview}
        icon="stateNeedsReview"
        tint="bg-needs-review-soft text-needs-review"
      />
    </dl>
  )
}

export function PipelineStripSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${card} flex items-center gap-4 p-5`}>
          <div className="size-10 rounded-full bg-surface-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-24 rounded-sm bg-border" />
            <div className="h-5 w-12 rounded-sm bg-border" />
          </div>
        </div>
      ))}
    </div>
  )
}
