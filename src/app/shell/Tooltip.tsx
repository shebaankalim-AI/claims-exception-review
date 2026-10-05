import { useId, useState } from 'react'
import type { ReactNode } from 'react'

export type TooltipTriggerProps = {
  'aria-describedby': string | undefined
  onFocus: () => void
  onBlur: () => void
}

// Where the bubble sits. Header buttons hug the right edge of the window, so
// they open downwards and align to their right edge instead of running off it.
const PLACEMENT_CLASS = {
  right: 'top-1/2 left-full ml-2 -translate-y-1/2',
  'bottom-end': 'top-full right-0 mt-2',
} as const

type TooltipProps = {
  /** Pass null to turn the tooltip off without remounting the trigger. */
  text: string | null
  placement?: keyof typeof PLACEMENT_CLASS
  /** Classes for the wrapper. It must stay a positioned element, since the bubble is placed against it. */
  className?: string
  /** Spread the given props onto the one focusable trigger element. */
  children: (trigger: TooltipTriggerProps) => ReactNode
}

// Opens on hover and on keyboard focus, and closes on mouse leave and blur.
// State, not CSS :hover, so it works the same for a screen reader and in tests.
export function Tooltip({
  text,
  placement = 'right',
  className = 'relative flex',
  children,
}: TooltipProps) {
  const id = useId()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const open = text !== null && (hovered || focused)

  return (
    <span
      className={className}
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
          className={`pointer-events-none absolute z-10 rounded-sm bg-ink px-2 py-1 text-xs whitespace-nowrap text-surface ${PLACEMENT_CLASS[placement]}`}
        >
          {text}
        </span>
      )}
    </span>
  )
}
