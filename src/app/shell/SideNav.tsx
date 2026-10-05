import { KeyHint } from './KeyHint'
import { SHORTCUTS } from './shortcutDefinitions'

type SideNavProps = {
  onGoToQueue: () => void
}

const itemClass =
  'focus-ring flex h-row w-full items-center gap-2 rounded-md px-2 text-left'

function LaterItem({ label }: { label: string }) {
  return (
    <li>
      <button
        type="button"
        disabled
        className={`${itemClass} cursor-not-allowed text-slate-500`}
      >
        <span className="flex-1">{label}</span>
        <span className="text-xs text-slate-600">Later</span>
      </button>
    </li>
  )
}

export function SideNav({ onGoToQueue }: SideNavProps) {
  return (
    <nav
      aria-label="Main"
      className="flex w-nav flex-col border-r border-slate-200 bg-surface p-2"
    >
      <ul className="flex flex-col gap-1">
        <li>
          <button
            type="button"
            aria-current="page"
            aria-keyshortcuts={SHORTCUTS.goToQueue.key}
            onClick={onGoToQueue}
            className={`${itemClass} bg-accent-soft font-medium text-slate-900`}
          >
            <span className="flex-1">Exceptions</span>
            <KeyHint>{SHORTCUTS.goToQueue.key.toUpperCase()}</KeyHint>
            <span
              aria-hidden="true"
              className="min-w-6 rounded-sm bg-surface px-1 text-center text-xs tabular-nums"
            >
              –
            </span>
            <span className="sr-only">count not available yet</span>
          </button>
        </li>
        <LaterItem label="All claims" />
        <LaterItem label="Agent activity" />
        <LaterItem label="Reports" />
      </ul>
      <ul className="mt-auto">
        <LaterItem label="Help and shortcuts" />
      </ul>
    </nav>
  )
}
