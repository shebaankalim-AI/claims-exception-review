import { useRef } from 'react'
import { useShortcut } from '@/lib/shortcutContext'
import type { Screen } from '../screen'
import { Breadcrumb } from './Breadcrumb'
import { KeyHint } from './KeyHint'
import { SHORTCUTS } from './shortcutDefinitions'

type HeaderProps = {
  screen: Screen
  onGoToQueue: () => void
}

export function Header({ screen, onGoToQueue }: HeaderProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  useShortcut(SHORTCUTS.focusSearch, () => searchRef.current?.focus())

  return (
    <header className="col-span-3 flex h-header items-center gap-4 border-b border-slate-200 bg-surface px-4">
      <Breadcrumb screen={screen} onGoToQueue={onGoToQueue} />

      <div role="search" className="relative ml-auto w-80">
        <input
          ref={searchRef}
          type="search"
          aria-label="Search claims"
          aria-keyshortcuts={SHORTCUTS.focusSearch.key}
          placeholder="Search claims"
          className="focus-ring h-row w-full rounded-md border border-slate-300 bg-surface pr-8 pl-2 placeholder:text-slate-500"
        />
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
          <KeyHint>{SHORTCUTS.focusSearch.key}</KeyHint>
        </span>
      </div>

      <p className="text-slate-600">
        <span aria-hidden="true" className="mr-1 text-verified">
          ●
        </span>
        Agent online, 0 claims running
      </p>

      <button
        type="button"
        disabled
        className="focus-ring h-row cursor-not-allowed rounded-md border border-slate-200 px-3 text-slate-500"
      >
        User menu (later)
      </button>
    </header>
  )
}
