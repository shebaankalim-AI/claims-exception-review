import { Badge } from '@/components/Badge'
import { STAGES } from '@/domain'
import type { Claim, Stage } from '@/domain'
import { stageSummary } from './claimRules'
import { FIELD_STATUS_ICON, FIELD_STATUS_TONE, STAGE_LABELS } from './labels'

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
                {toConfirm > 0 && (
                  <span>
                    <Badge
                      icon={FIELD_STATUS_ICON.needs_review}
                      tone={FIELD_STATUS_TONE.needs_review}
                      label={`${toConfirm} to confirm`}
                    />
                  </span>
                )}
                {missing > 0 && (
                  <span>
                    <Badge
                      icon={FIELD_STATUS_ICON.missing}
                      tone={FIELD_STATUS_TONE.missing}
                      label={`${missing} missing`}
                    />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
