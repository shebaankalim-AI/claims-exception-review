import type { ReactNode } from 'react'

// Decorative: the real announcement is aria-keyshortcuts on the control.
export function KeyHint({ children }: { children: ReactNode }) {
  return (
    <kbd
      aria-hidden="true"
      className="rounded-sm border border-border bg-surface-muted px-1.5 text-xs text-ink-subtle tabular-nums"
    >
      {children}
    </kbd>
  )
}
