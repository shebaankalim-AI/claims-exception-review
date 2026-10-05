import { useRef } from 'react'
import { Icon } from '@/components/Icon'
import { useShortcut } from '@/lib/shortcutContext'
import { CURRENT_USER } from '../currentUser'
import { KeyHint } from './KeyHint'
import { SHORTCUTS } from './shortcutDefinitions'
import { Tooltip } from './Tooltip'

const USER = CURRENT_USER

export function Header() {
  const searchRef = useRef<HTMLInputElement>(null)
  useShortcut(SHORTCUTS.focusSearch, () => searchRef.current?.focus())

  return (
    <header className="col-span-2 col-start-2 row-start-1 flex h-header items-center gap-4 border-b border-border bg-surface px-4">
      <div role="search" className="relative w-80">
        <input
          ref={searchRef}
          type="search"
          aria-label="Search claims"
          aria-keyshortcuts={SHORTCUTS.focusSearch.key}
          placeholder="Search claims"
          className="focus-ring h-control w-full rounded-md border border-border-strong bg-surface pr-8 pl-2 placeholder:text-ink-subtle"
        />
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
          <KeyHint>{SHORTCUTS.focusSearch.key}</KeyHint>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip text="Settings (later)" placement="bottom-end">
          {({ 'aria-describedby': describedBy, ...handlers }) => (
            <button
              type="button"
              {...handlers}
              aria-label="Settings"
              aria-describedby={describedBy}
              aria-disabled="true"
              className="focus-ring flex size-8 cursor-not-allowed items-center justify-center rounded-md text-disabled"
            >
              <Icon name="settings" size="lg" />
            </button>
          )}
        </Tooltip>

        <Tooltip text={`${USER.name}, ${USER.role}`} placement="bottom-end">
          {/* The tooltip repeats the accessible name, so it is not also a description. */}
          {(trigger) => (
            <button
              type="button"
              onFocus={trigger.onFocus}
              onBlur={trigger.onBlur}
              aria-label={`${USER.name}, ${USER.role}`}
              className="focus-ring flex size-8 items-center justify-center rounded-full bg-border text-xs font-medium text-ink hover:bg-accent-border"
            >
              <span aria-hidden="true">{USER.initials}</span>
            </button>
          )}
        </Tooltip>
      </div>
    </header>
  )
}
