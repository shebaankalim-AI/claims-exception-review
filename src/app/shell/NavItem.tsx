import { useId } from 'react'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/Icon'
import { Tooltip } from './Tooltip'

type NavItemProps = {
  label: string
  icon: IconName
  collapsed: boolean
  current?: boolean
  /** Not built yet. Dimmed, aria-disabled and still focusable, so its tooltip can say "Later". */
  later?: boolean
  onClick?: () => void
  /** Announced to assistive tech only. The shortcut itself is registered in AppShell. */
  shortcutKey?: string
}

export function NavItem({
  label,
  icon,
  collapsed,
  current = false,
  later = false,
  onClick,
  shortcutKey,
}: NavItemProps) {
  const laterId = useId()
  // Items that are not built yet explain themselves in both nav states, since
  // there is no visible "Later" text. Working items only need a tooltip when
  // the label is hidden.
  const tooltip = later ? `${label} (Later)` : collapsed ? label : null

  return (
    <li>
      <Tooltip text={tooltip}>
        {({ 'aria-describedby': tooltipId, ...handlers }) => (
          <button
            type="button"
            {...handlers}
            aria-label={collapsed ? label : undefined}
            aria-current={current ? 'page' : undefined}
            aria-disabled={later || undefined}
            // The tooltip exists only while open, so the description is a
            // permanent hidden element, with the tooltip added while it shows.
            aria-describedby={
              [later ? laterId : undefined, tooltipId]
                .filter(Boolean)
                .join(' ') || undefined
            }
            aria-keyshortcuts={shortcutKey}
            onClick={later ? undefined : onClick}
            className={`focus-ring flex h-control w-full items-center gap-3 overflow-hidden rounded-md px-3 whitespace-nowrap ${
              collapsed ? 'justify-center' : ''
            } ${
              later
                ? 'cursor-not-allowed text-disabled'
                : current
                  ? 'bg-surface font-semibold text-ink shadow-card'
                  : 'text-ink-muted hover:bg-sidebar-hover hover:text-ink'
            }`}
          >
            <span className={current ? 'text-accent' : undefined}>
              <Icon
                name={icon}
                size="lg"
                weight={current ? 'fill' : 'regular'}
              />
            </span>
            {!collapsed && <span className="flex-1 text-left">{label}</span>}
          </button>
        )}
      </Tooltip>
      {later && (
        <span id={laterId} hidden>
          Later
        </span>
      )}
    </li>
  )
}
