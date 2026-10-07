import { Icon } from './Icon'
import type { IconName } from './Icon'

export type BadgeTone =
  'verified' | 'needs-review' | 'missing' | 'edited' | 'neutral' | 'accent'

// Soft background, a 1px border and the state's own text colour. The icon and
// the word carry the meaning; the colour only repeats it.
const TONE_CLASS: Record<BadgeTone, string> = {
  verified: 'border-verified-border bg-verified-soft text-verified',
  'needs-review':
    'border-needs-review-border bg-needs-review-soft text-needs-review',
  missing: 'border-missing-border bg-missing-soft text-missing',
  edited: 'border-edited-border bg-edited-soft text-edited',
  neutral: 'border-border bg-surface-muted text-ink-muted',
  accent: 'border-accent-border bg-accent-soft text-accent',
}

type BadgeProps = {
  tone: BadgeTone
  icon: IconName
  label: string
}

/** The one state badge: icon plus word, used everywhere a state is shown. */
export function Badge({ tone, icon, label }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums ${TONE_CLASS[tone]}`}
    >
      <Icon name={icon} />
      {label}
    </span>
  )
}
