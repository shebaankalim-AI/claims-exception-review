import { useNow } from '@/lib/clock'
import { formatAge } from '@/lib/formatAge'
import { REASON_LABELS } from './labels'
import { countByReason, oldestClaim } from './queueStats'
import type { Queue } from './useQueue'

export const QUEUE_PLACEHOLDER = "Ask about today's queue"

export const QUEUE_CHIPS = [
  'What should I start with?',
  'Why are claims stopping?',
  'How many need me?',
] as const

const has = (question: string, words: string[]) =>
  words.some((w) => question.includes(w))

/**
 * Demo replies about the queue, picked by keyword from the queue's own data.
 * There is no model behind this, which is why the panel says so. `now` is
 * passed in so the age in a reply matches what the screen shows.
 */
export function queueReply(queue: Queue, question: string, now: Date): string {
  const q = question.toLowerCase()
  const { state } = queue
  if (state.status !== 'ready') {
    return 'I am still reading the queue. Ask me again in a moment.'
  }

  const { claims } = state
  if (claims.length === 0) {
    return 'The queue is clear. Nothing needs you right now.'
  }
  const reasons = countByReason(claims)
  const oldest = oldestClaim(claims)
  const reasonCount = (reason: keyof typeof REASON_LABELS) =>
    reasons.find(([r]) => r === reason)?.[1] ?? 0

  if (has(q, ['start', 'first', 'oldest']) && oldest) {
    return `Start with ${oldest.id}. It has waited longest, ${formatAge(oldest.flaggedAt, now)}, and it stopped on: ${REASON_LABELS[oldest.exceptionReasons[0]].toLowerCase()}.`
  }
  if (has(q, ['why', 'reason'])) {
    const [top, count] = reasons[0]
    const others = reasons
      .slice(1)
      .map(([r, n]) => `${REASON_LABELS[r]}: ${n}`)
      .join(', ')
    return `Most claims stopped on: ${REASON_LABELS[top].toLowerCase()}, ${count} of ${claims.length}.${others ? ` The rest: ${others}.` : ''}`
  }
  if (has(q, ['class'])) {
    const n = reasonCount('class_code_unclear')
    return n === 0
      ? 'No claim is waiting on a class code right now.'
      : `${n} ${n === 1 ? 'claim is' : 'claims are'} waiting on an unclear class code.`
  }
  if (has(q, ['missing'])) {
    const n = reasonCount('document_missing')
    return n === 0
      ? 'No claim is waiting on a missing document right now.'
      : `${n} ${n === 1 ? 'claim is' : 'claims are'} waiting on a missing document.`
  }
  if (has(q, ['how many', 'need'])) {
    return `${claims.length} ${claims.length === 1 ? 'claim needs' : 'claims need'} you.`
  }

  return 'I can tell you what to start with, why claims are stopping, or how many need you. These are demo replies, not a live AI.'
}

/** Binds the queue and the current time, so callers pass only the question. */
export function useQueueReply(queue: Queue): (question: string) => string {
  const now = useNow()
  return (question) => queueReply(queue, question, now)
}
