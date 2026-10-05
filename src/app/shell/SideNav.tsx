import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { LogoMark } from './LogoMark'
import { NavItem } from './NavItem'
import { SHORTCUTS } from './shortcutDefinitions'
import { Tooltip } from './Tooltip'

type SideNavProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  onGoToQueue: () => void
}

// A fictional user, for the placeholder row.
const USER = { name: 'Casey Lindqvist', initials: 'CL', role: 'Examiner' }

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
        <h2 className="px-2 pb-1 text-xs font-medium tracking-wide text-slate-600 uppercase">
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
    <Tooltip text={`${label} (${SHORTCUTS.toggleNav.key})`}>
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

function UserRow({ collapsed }: { collapsed: boolean }) {
  const description = `${USER.name}, ${USER.role}`
  return (
    <Tooltip text={collapsed ? description : null}>
      {() => (
        <div
          className={`flex w-full items-center gap-2 px-2 py-1 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span
            role="img"
            aria-label={collapsed ? description : undefined}
            aria-hidden={collapsed ? undefined : true}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700"
          >
            {USER.initials}
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{USER.name}</span>
              <span className="text-xs text-slate-600">{USER.role}</span>
            </span>
          )}
        </div>
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
      className={`flex flex-col border-r border-slate-200 bg-surface p-2 transition-[width] duration-(--duration-nav) motion-reduce:transition-none ${
        collapsed ? 'w-nav-collapsed' : 'w-nav'
      }`}
    >
      <div
        className={
          collapsed
            ? 'flex flex-col items-center gap-1'
            : 'flex items-center justify-between gap-2'
        }
      >
        <div className="flex items-center gap-2 px-2">
          <LogoMark />
          {!collapsed && (
            <span className="text-lg font-semibold whitespace-nowrap">
              Exception Review
            </span>
          )}
        </div>
        <CollapseButton collapsed={collapsed} onToggle={onToggleCollapsed} />
      </div>

      <NavSection label="Work" collapsed={collapsed}>
        <NavItem
          label="Exceptions"
          icon="exceptions"
          collapsed={collapsed}
          current
          onClick={onGoToQueue}
          shortcutKey={SHORTCUTS.goToQueue.key}
          badge={
            <>
              <span
                aria-hidden="true"
                className="min-w-6 rounded-sm bg-surface px-1 text-center text-xs tabular-nums"
              >
                –
              </span>
              <span className="sr-only">count not available yet</span>
            </>
          }
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

      <div className="mt-auto flex flex-col gap-1 pt-2">
        <ul>
          <NavItem
            label="Help and shortcuts"
            icon="help"
            collapsed={collapsed}
            later
          />
        </ul>
        <UserRow collapsed={collapsed} />
      </div>
    </nav>
  )
}
