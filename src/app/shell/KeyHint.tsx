import type { ReactNode } from 'react'

// Decorative: the real announcement is aria-keyshortcuts on the control.
export function KeyHint({ children }: { children: ReactNode }) {
  return (
    <kbd
      aria-hidden="true"
      className="rounded-sm border border-slate-300 bg-slate-100 px-1 text-xs text-slate-600 tabular-nums"
    >
      {children}
    </kbd>
  )
}
