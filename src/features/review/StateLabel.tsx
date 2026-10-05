import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/Icon'

type StateLabelProps = {
  icon: IconName
  /** A colour class for the icon. Never the only signal: the word is always shown. */
  tone: string
  label: string
}

export function StateLabel({ icon, tone, label }: StateLabelProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={tone}>
        <Icon name={icon} />
      </span>
      {label}
    </span>
  )
}
