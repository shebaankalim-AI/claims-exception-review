import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

type DialogProps = {
  open: boolean
  title: string
  subtitle?: string
  /** Called when the dialog closes itself, for example on Escape. */
  onClose: () => void
  children: ReactNode
}

/**
 * A native <dialog>, opened with showModal(), so the browser handles the focus
 * trap, the backdrop, Escape and returning focus to the button that opened it.
 */
export function Dialog({
  open,
  title,
  subtitle,
  onClose,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-full max-w-lg rounded-md border border-border bg-surface p-0 text-ink backdrop:bg-backdrop"
    >
      {/* Rendered only while open, so a form never keeps a stale draft. */}
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {subtitle && <p className="text-ink-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
