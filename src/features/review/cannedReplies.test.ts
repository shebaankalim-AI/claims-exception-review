import { toClaimId } from '@/domain'
import type { Claim, Field } from '@/domain'
import { cannedReply } from './cannedReplies'

function field(
  overrides: Partial<Field> & Pick<Field, 'key' | 'label'>,
): Field {
  return {
    stage: 'intake',
    value: 'x',
    status: 'verified',
    resolvedBy: 'agent',
    sources: [],
    ...overrides,
  }
}

function claim(fields: Field[], state: Claim['state'] = 'needs_review'): Claim {
  return {
    id: toClaimId('CLM-T-0001'),
    employer: 'Test Employer',
    lineOfBusiness: 'workers_comp',
    exceptionReasons: ['class_code_unclear'],
    agentNote: 'Two class codes plausible',
    receivedAt: '2025-02-27T10:00:00.000Z',
    flaggedAt: '2025-02-27T10:03:00.000Z',
    assignee: 'Test Examiner',
    state,
    fields,
    documents: [],
    activity: [],
  }
}

const WAGE = field({
  key: 'average_weekly_wage',
  label: 'Average weekly wage',
  value: '$780',
  status: 'needs_review',
  reason: 'Form says $780, pay stub says $812',
})
const CLASS = field({
  key: 'class_code',
  label: 'Job class code',
  value: 'A-102',
  status: 'needs_review',
  reason: 'Form says A-102, transcript says B-340',
})
const REPORT = field({
  key: 'medical_report',
  label: 'Medical report',
  value: null,
  status: 'missing',
  expectedIn: 'a medical report from the treating clinic',
})

const OPEN = claim([WAGE, CLASS, REPORT])

describe('cannedReply', () => {
  it.each([
    ['What is the wage?', /Average weekly wage is \$780.*pay stub says \$812/],
    ['how much do they get paid', /Average weekly wage/],
    ['Which class code?', /Job class code is A-102.*transcript says B-340/],
    ["What's missing?", /Still missing: Medical report.*treating clinic/],
    ['do we have the report', /Still missing: Medical report/],
    ['Why was this flagged?', /class code unclear.*Two class codes plausible/],
    [
      'What should I check first?',
      /Resolve the 3 flagged fields.*Job class code/,
    ],
  ])('answers "%s"', (question, expected) => {
    expect(cannedReply(question, OPEN)).toMatch(expected)
  })

  it('checks the keywords in order, so "wage" beats "why"', () => {
    expect(cannedReply('why is the wage different', OPEN)).toMatch(
      /Average weekly wage is/,
    )
  })

  it('says nothing is missing when every field is there', () => {
    expect(cannedReply('anything missing?', claim([CLASS]))).toMatch(
      /Nothing is missing/,
    )
  })

  it('points to approving when nothing is left, and to filing once approved', () => {
    const done = claim([field({ key: 'a', label: 'A' })])
    expect(cannedReply('what should I do next', done)).toMatch(
      /Approve the claim/,
    )
    expect(
      cannedReply('what should I do next', claim(done.fields, 'approved')),
    ).toMatch(/Filing it/)
  })

  it('falls back to what it can answer, and says the replies are a demo', () => {
    expect(cannedReply('tell me a joke', OPEN)).toMatch(/demo replies/)
  })
})
