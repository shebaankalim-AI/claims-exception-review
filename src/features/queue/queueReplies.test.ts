import { toClaimId } from '@/domain'
import type { ClaimSummary, ExceptionReason } from '@/domain'
import { queueReply } from './queueReplies'
import type { Queue } from './useQueue'

const NOW = new Date('2025-02-27T15:00:00.000Z')

function claim(
  id: string,
  reason: ExceptionReason,
  hoursAgo: number,
): ClaimSummary {
  return {
    id: toClaimId(id),
    employer: 'Test Employer',
    lineOfBusiness: 'workers_comp',
    exceptionReasons: [reason],
    agentNote: 'a note',
    receivedAt: new Date(
      NOW.getTime() - (hoursAgo + 1) * 3_600_000,
    ).toISOString(),
    flaggedAt: new Date(NOW.getTime() - hoursAgo * 3_600_000).toISOString(),
    assignee: 'Test Examiner',
    state: 'needs_review',
    toConfirmCount: 1,
    missingCount: 0,
  }
}

function queueOf(claims: ClaimSummary[]): Queue {
  return {
    state: {
      status: 'ready',
      claims,
      pipeline: { receivedToday: 0, agentWorking: 0, filedAutomatically: 0 },
      checkedAt: NOW.toISOString(),
    },
    retry: () => {},
  }
}

const QUEUE = queueOf([
  claim('CLM-T-0001', 'class_code_unclear', 20),
  claim('CLM-T-0002', 'class_code_unclear', 5),
  claim('CLM-T-0003', 'document_missing', 2),
])

describe('queueReply', () => {
  it.each([
    ['What should I start with?', /Start with CLM-T-0001.*20 h 00/],
    ['which is the oldest', /Start with CLM-T-0001/],
    ['what is first', /Start with CLM-T-0001/],
    ['Why are claims stopping?', /class code unclear, 2 of 3/],
    ['what is the main reason', /class code unclear, 2 of 3/],
    [
      'any class code problems?',
      /2 claims are waiting on an unclear class code/,
    ],
    ['anything missing?', /1 claim is waiting on a missing document/],
    ['How many need me?', /3 claims need you/],
    ['who needs help', /3 claims need you/],
  ])('answers "%s"', (question, expected) => {
    expect(queueReply(QUEUE, question, NOW)).toMatch(expected)
  })

  it('checks the keywords in order, so "why" beats "need"', () => {
    expect(queueReply(QUEUE, 'why do they need me', NOW)).toMatch(/stopped on/)
  })

  it('falls back to what it can answer, and says the replies are a demo', () => {
    expect(queueReply(QUEUE, 'tell me a joke', NOW)).toMatch(/demo replies/)
  })

  it('says so when the queue is empty or not loaded yet', () => {
    expect(queueReply(queueOf([]), 'how many need me', NOW)).toMatch(/clear/)
    expect(
      queueReply({ state: { status: 'loading' }, retry: () => {} }, 'why', NOW),
    ).toMatch(/still reading/)
  })
})
