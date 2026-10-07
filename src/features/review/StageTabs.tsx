import { Icon } from '@/components/Icon'
import { STAGES } from '@/domain'
import type { Claim, Stage } from '@/domain'
import { stageSummary } from './claimRules'
import { FIELD_STATUS_ICON, STAGE_LABELS } from './labels'

const PILL = {
  missing: {
    box: 'border-missing-border bg-missing-soft text-missing',
    icon: FIELD_STATUS_ICON.missing,
  },
  'needs-review': {
    box: 'border-needs-review-border bg-needs-review-soft text-needs-review',
    icon: FIELD_STATUS_ICON.needs_review,
  },
} as const

/** Icon plus a number. The words ("2 to confirm") are its accessible name. */
function CountPill({
  tone,
  count,
  label,
}: {
  tone: keyof typeof PILL
  count: number
  label: string
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-medium tabular-nums ${PILL[tone].box}`}
    >
      <Icon name={PILL[tone].icon} />
      <span aria-hidden="true">{count}</span>
    </span>
  )
}

type StageTabsProps = {
  claim: Claim
  active: Stage
  onSelect: (stage: Stage) => void
}

export function StageTabs({ claim, active, onSelect }: StageTabsProps) {
  return (
    <nav aria-label="Stages">
      <ul className="flex flex-wrap gap-2 border-b border-border">
        {STAGES.map((stage) => {
          const { toConfirm, missing } = stageSummary(claim, stage)
          const isActive = stage === active
          return (
            <li key={stage}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelect(stage)}
                className={`focus-ring -mb-px flex h-11 items-center gap-2 rounded-t-sm border-b-2 px-3 font-medium ${
                  isActive
                    ? 'border-accent text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {STAGE_LABELS[stage]}
                {/* Missing first: it is the harder thing to resolve. */}
                {missing > 0 && (
                  <CountPill
                    tone="missing"
                    count={missing}
                    label={`${missing} missing`}
                  />
                )}
                {toConfirm > 0 && (
                  <CountPill
                    tone="needs-review"
                    count={toConfirm}
                    label={`${toConfirm} to confirm`}
                  />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
