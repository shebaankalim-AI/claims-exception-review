import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { Logo } from '@/components/Logo'
import { LogoMark } from '@/components/LogoMark'
import { NavItem } from './NavItem'
import { SHORTCUTS } from './shortcutDefinitions'
import { Tooltip } from './Tooltip'

type SideNavProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  onGoToQueue: () => void
}

function NavSection({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed: boolean
  children: ReactNode
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={collapsed ? 'mt-2 border-t border-slate-200 pt-2' : 'mt-4'}
    >
      {!collapsed && (
        <h2 className="px-2 pb-1 text-xs font-medium tracking-wide whitespace-nowrap text-slate-600 uppercase">
          {label}
        </h2>
      )}
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  )
}

function CollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const label = collapsed ? 'Expand navigation' : 'Collapse navigation'
  return (
    <Tooltip
      text={`${label} (${SHORTCUTS.toggleNav.key})`}
      // Collapsed, the top row is only as tall as the header, so the button
      // hangs just below it. It is the same element in both states, so keyboard
      // focus survives a toggle.
      className={
        collapsed
          ? 'absolute top-full left-1/2 mt-1 flex -translate-x-1/2'
          : 'relative flex'
      }
    >
      {(trigger) => (
        <button
          type="button"
          {...trigger}
          onClick={onToggle}
          aria-label={label}
          aria-expanded={!collapsed}
          aria-keyshortcuts={SHORTCUTS.toggleNav.key}
          className="focus-ring flex h-row w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
        >
          <Icon name="menu" size="lg" />
        </button>
      )}
    </Tooltip>
  )
}

export function SideNav({
  collapsed,
  onToggleCollapsed,
  onGoToQueue,
}: SideNavProps) {
  return (
    <nav
      aria-label="Main"
      className={`col-start-1 row-span-2 row-start-1 flex flex-col border-r border-slate-200 bg-surface transition-[width] duration-(--duration-nav) motion-reduce:transition-none ${
        collapsed ? 'w-nav-collapsed' : 'w-nav'
      }`}
    >
      {/* Same height as the header, so the two bottom borders line up. */}
      <div
        className={`relative flex h-header shrink-0 items-center border-b border-slate-200 px-2 ${
          collapsed ? 'justify-center' : 'justify-between gap-2'
        }`}
      >
        {/* overflow-hidden clips the wordmark, rather than letting it spill
            over the page, while the width animates. */}
        <div className="min-w-0 overflow-hidden px-2 text-slate-900">
          {collapsed ? <LogoMark label="Assay" /> : <Logo />}
        </div>
        <CollapseButton collapsed={collapsed} onToggle={onToggleCollapsed} />
      </div>

      <div
        className={`flex flex-1 flex-col px-2 pb-2 ${collapsed ? 'pt-11' : 'pt-0'}`}
      >
        <NavSection label="Work" collapsed={collapsed}>
          <NavItem
            label="Exceptions"
            icon="exceptions"
            collapsed={collapsed}
            current
            onClick={onGoToQueue}
            shortcutKey={SHORTCUTS.goToQueue.key}
          />
          <NavItem
            label="All claims"
            icon="allClaims"
            collapsed={collapsed}
            later
          />
          <NavItem
            label="Agent activity"
            icon="agentActivity"
            collapsed={collapsed}
            later
          />
        </NavSection>

        <NavSection label="Insights" collapsed={collapsed}>
          <NavItem label="Reports" icon="reports" collapsed={collapsed} later />
        </NavSection>

        <ul className="mt-auto pt-2">
          <NavItem
            label="Help and shortcuts"
            icon="help"
            collapsed={collapsed}
            later
          />
        </ul>
      </div>
    </nav>
  )
}
