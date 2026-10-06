import { useState } from 'react'
import { Icon } from '@/components/Icon'

type PromptBarProps = {
  placeholder: string
  /** The assistant is replying: the bar glows, the way it does when focused. */
  typing: boolean
  onSend: (text: string) => void
}

/**
 * One rounded bar with a round send button inside it. Enter sends. Focused, or
 * while the assistant is typing, a gradient border glows around it (see
 * glow-bar in index.css); the glow is behind the bar, never over the text.
 */
export function PromptBar({ placeholder, typing, onSend }: PromptBarProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const empty = value.trim() === ''

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (empty) return
        onSend(value)
        setValue('')
      }}
    >
      <div className="glow-bar" data-active={focused || typing}>
        <div className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface py-1 pr-1 pl-3 shadow-raised">
          <input
            type="text"
            aria-label={placeholder}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="h-8 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={empty}
            className="focus-ring flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent enabled:hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-disabled"
          >
            <Icon name="send" />
          </button>
        </div>
      </div>
    </form>
  )
}
