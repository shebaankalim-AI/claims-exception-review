import type { ReactNode } from 'react'

/** What the assistant panel shows for the screen that is open. The screen supplies it; the shell lays it out. */
export type AssistantConfig = {
  /** Chat threads are kept per key: a claim ID, or "queue". */
  threadKey: string
  summary: ReactNode
  /** Also the prompt bar's accessible name. */
  placeholder: string
  chips: readonly string[]
  /** Worked out when the question is sent. */
  reply: (question: string) => string
}
