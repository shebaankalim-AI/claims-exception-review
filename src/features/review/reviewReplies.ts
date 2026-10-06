import { cannedReply } from './cannedReplies'
import type { Review } from './useReview'

export const REVIEW_PLACEHOLDER = 'Ask about this claim'

export const REVIEW_CHIPS = [
  'Why was this flagged?',
  'What should I check first?',
  "What's missing?",
] as const

/** Demo replies for the open claim. Worked out when the question is sent. */
export function reviewReply(review: Review, question: string): string {
  if (review.load.status !== 'ready') {
    return 'I am still reading the claim. Ask me again in a moment.'
  }
  return cannedReply(question, review.load.claim)
}
