import type { ReactNode } from 'react'
import { card } from './controls'
import { Icon } from './Icon'
import type { IconName } from './Icon'

type AssistantCardProps = {
  title?: string
  icon?: IconName
  children: ReactNode
}

/** A white card on the assistant panel's tinted background, with a small 12/500 muted heading. */
export function AssistantCard({ title, icon, children }: AssistantCardProps) {
  return (
    <section className={`${card} flex flex-col gap-2.5 px-3.5 py-3`}>
      {title && (
        <h3 className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          {icon && <Icon name={icon} />}
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}
