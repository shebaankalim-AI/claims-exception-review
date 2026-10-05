import { ageInMinutes, matchesExceptionFilter } from './filters'
import { toClaimId } from './types'
import type { ClaimSummary } from './types'

const NOW = new Date('2025-02-27T15:00:00.000Z')

function summary(overrides: Partial<ClaimSummary> = {}): ClaimSummary {
  return {
    id: toClaimId('CLM-TEST-0001'),
    employer: 'Test Employer',
    lineOfBusiness: 'workers_comp',
    exceptionReasons: ['class_code_unclear', 'document_missing'],
    agentNote: 'two codes plausible',
    receivedAt: '2025-02-27T11:00:00.000Z',
    flaggedAt: '2025-02-27T12:00:00.000Z', // 180 minutes before NOW
    assignee: 'Test Examiner',
    state: 'needs_review',
    toConfirmCount: 1,
    missingCount: 0,
    ...overrides,
  }
}

describe('ageInMinutes', () => {
  it('counts whole minutes since the claim was flagged', () => {
    expect(ageInMinutes('2025-02-27T12:00:00.000Z', NOW)).toBe(180)
    expect(ageInMinutes('2025-02-27T14:59:30.000Z', NOW)).toBe(0)
  })

  it('is never negative, and never NaN', () => {
    expect(ageInMinutes('2025-02-27T16:00:00.000Z', NOW)).toBe(0)
    expect(ageInMinutes('not a date', NOW)).toBe(0)
  })
})

describe('matchesExceptionFilter', () => {
  it('matches everything when the filter is empty', () => {
    expect(matchesExceptionFilter(summary(), {}, NOW)).toBe(true)
  })

  it('matches the primary reason only, not a secondary one', () => {
    const claim = summary()
    expect(
      matchesExceptionFilter(claim, { reason: 'class_code_unclear' }, NOW),
    ).toBe(true)
    expect(
      matchesExceptionFilter(claim, { reason: 'document_missing' }, NOW),
    ).toBe(false)
  })

  it('matches line of business, state and assignee', () => {
    const claim = summary()
    expect(
      matchesExceptionFilter(claim, { lineOfBusiness: 'workers_comp' }, NOW),
    ).toBe(true)
    expect(
      matchesExceptionFilter(
        claim,
        { lineOfBusiness: 'employers_liability' },
        NOW,
      ),
    ).toBe(false)
    expect(matchesExceptionFilter(claim, { state: 'filed' }, NOW)).toBe(false)
    expect(
      matchesExceptionFilter(claim, { assignee: 'Someone Else' }, NOW),
    ).toBe(false)
  })

  it.each([
    [60, true],
    [180, true], // exactly as old as the minimum counts
    [181, false],
  ])('applies a minimum age of %i minutes -> %s', (minAgeMinutes, expected) => {
    expect(matchesExceptionFilter(summary(), { minAgeMinutes }, NOW)).toBe(
      expected,
    )
  })

  it('requires every part of the filter to match', () => {
    const filter = { reason: 'class_code_unclear' as const, minAgeMinutes: 300 }
    expect(matchesExceptionFilter(summary(), filter, NOW)).toBe(false)
  })
})
