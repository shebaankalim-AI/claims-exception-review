import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/Icon'
import { KeyHint } from './KeyHint'
import { Tooltip } from './Tooltip'

type NavItemProps = {
  label: string
  icon: IconName
  collapsed: boolean
  current?: boolean
  /** Not built yet. Stays focusable (aria-disabled) so its tooltip can say "Later". */
  later?: boolean
  onClick?: () => void
  shortcutKey?: string
  /** Shown at the right edge when expanded. */
  badge?: ReactNode
}

export function NavItem({
  label,
  icon,
  collapsed,
  current = false,
  later = false,
  onClick,
  shortcutKey,
  badge,
}: NavItemProps) {
  const tooltip = later
    ? `${label} (Later)`
    : shortcutKey
      ? `${label} (${shortcutKey.toUpperCase()})`
      : label

  return (
    <li>
      <Tooltip text={collapsed ? tooltip : null}>
        {(trigger) => (
          <button
            type="button"
            {...trigger}
            aria-label={collapsed ? label : undefined}
            aria-current={current ? 'page' : undefined}
            aria-disabled={later || undefined}
            aria-keyshortcuts={shortcutKey}
            onClick={later ? undefined : onClick}
            className={`focus-ring flex h-row w-full items-center gap-2 rounded-md px-2 ${
              collapsed ? 'justify-center' : ''
            } ${
              later
                ? 'cursor-not-allowed text-slate-500'
                : current
                  ? 'bg-accent-soft font-medium text-slate-900'
                  : 'text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon name={icon} size="lg" weight={current ? 'fill' : 'regular'} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{label}</span>
                {later ? (
                  <span className="text-xs text-slate-600">Later</span>
                ) : (
                  <>
                    {shortcutKey && (
                      <KeyHint>{shortcutKey.toUpperCase()}</KeyHint>
                    )}
                    {badge}
                  </>
                )}
              </>
            )}
          </button>
        )}
      </Tooltip>
    </li>
  )
}
