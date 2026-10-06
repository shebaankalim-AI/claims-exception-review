import { useEffect, useRef, useState } from 'react'

export type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
}

/**
 * Chat threads kept by key (a claim ID, or "queue") for as long as the app is
 * open. A send adds the question at once and the reply after a short "typing"
 * pause. The reply is worked out when the question is sent, so moving to
 * another claim in between can't change what it says, and it still lands in
 * the thread it belongs to.
 */
export function useChatThreads(replyDelayMs = 600) {
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({})
  const [typing, setTyping] = useState<ReadonlySet<string>>(new Set())
  const nextId = useRef(1)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const add = (key: string, role: ChatMessage['role'], text: string) =>
    setThreads((all) => ({
      ...all,
      [key]: [...(all[key] ?? []), { id: nextId.current++, role, text }],
    }))

  function send(key: string, question: string, reply: (q: string) => string) {
    const text = question.trim()
    if (text === '') return
    const answer = reply(text)
    add(key, 'user', text)
    setTyping((keys) => new Set(keys).add(key))

    const timer = setTimeout(() => {
      timers.current.delete(timer)
      add(key, 'assistant', answer)
      setTyping((keys) => {
        const next = new Set(keys)
        next.delete(key)
        return next
      })
    }, replyDelayMs)
    timers.current.add(timer)
  }

  return { threads, typing, send }
}
