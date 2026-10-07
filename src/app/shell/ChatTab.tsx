import { useEffect, useRef } from 'react'
import { Icon } from '@/components/Icon'
import type { ChatMessage } from '@/lib/chat'

type ChatTabProps = {
  messages: readonly ChatMessage[]
  typing: boolean
  chips: readonly string[]
  onSend: (text: string) => void
}

function DemoTag() {
  return (
    <p className="text-center text-xs font-medium text-ink-muted">
      Demo replies, not a live AI
    </p>
  )
}

function Avatar() {
  return (
    <span
      aria-hidden="true"
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
    >
      <Icon name="assistant" />
    </span>
  )
}

export function ChatTab({ messages, typing, chips, onSend }: ChatTabProps) {
  const endRef = useRef<HTMLLIElement>(null)

  // Bring the newest message, or the typing dots, into view.
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages.length, typing])

  if (messages.length === 0 && !typing) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <Avatar />
        <p className="max-w-56 text-ink">
          Ask a question and I will answer from what is on screen.
        </p>
        <DemoTag />
        <div className="flex flex-wrap justify-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onSend(chip)}
              className="focus-ring rounded-full border border-border-strong bg-surface px-3 py-1.5 text-sm text-ink hover:bg-surface-hover"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Stays at the top of the thread while it scrolls. */}
      <div className="sticky top-0 z-10 flex justify-center">
        <span className="rounded-full border border-border bg-surface px-3 py-1 shadow-card">
          <DemoTag />
        </span>
      </div>
      <ul aria-live="polite" className="flex flex-col gap-3">
        {messages.map((message) =>
          message.role === 'user' ? (
            <li key={message.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-lg bg-accent-soft px-3 py-2 text-ink">
                {message.text}
              </p>
            </li>
          ) : (
            <li key={message.id} className="flex items-start gap-2">
              <Avatar />
              <p className="max-w-[85%] rounded-lg border border-border bg-surface px-3 py-2 text-ink">
                {message.text}
              </p>
            </li>
          ),
        )}
        {typing && (
          <li className="flex items-center gap-2">
            <Avatar />
            <span className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-3">
              <span className="sr-only">The assistant is typing</span>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-ink-subtle motion-safe:animate-pulse"
                />
              ))}
            </span>
          </li>
        )}
        <li ref={endRef} aria-hidden="true" />
      </ul>
    </div>
  )
}
