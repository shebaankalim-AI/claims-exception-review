import { useId, useState } from 'react'
import type { ReactNode } from 'react'

export type TooltipTriggerProps = {
  'aria-describedby': string | undefined
  onFocus: () => void
  onBlur: () => void
}

type TooltipProps = {
  /** Pass null to turn the tooltip off without remounting the trigger. */
  text: string | null
  /** Spread the given props onto the one focusable trigger element. */
  children: (trigger: TooltipTriggerProps) => ReactNode
}

// Opens on hover and on keyboard focus, and closes on mouse leave and blur.
// State, not CSS :hover, so it works the same for a screen reader and in tests.
export function Tooltip({ text, children }: TooltipProps) {
  const id = useId()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const open = text !== null && (hovered || focused)

  return (
    <span
      className="relative flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children({
        'aria-describedby': open ? id : undefined,
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
      })}
      {open && (
        <span
          role="tooltip"
          id={id}
          className="pointer-events-none absolute top-1/2 left-full z-10 ml-2 -translate-y-1/2 rounded-sm bg-slate-800 px-2 py-1 text-xs whitespace-nowrap text-surface"
        >
          {text}
        </span>
      )}
    </span>
  )
}
