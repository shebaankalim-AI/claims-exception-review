import { ClaimsRepositoryError, toClaimId } from '@/domain'
import type { ClaimId, ExceptionReason } from '@/domain'
import {
  createMockClaimsRepository,
  MOCK_REFERENCE_TIME,
  mockClaims,
} from './index'

const DETAILED = toClaimId('CLM-24-0417')
const NOW = new Date('2025-03-10T09:30:00.000Z')

function repo() {
  return createMockClaimsRepository({ now: () => NOW })
}

async function resolveAll(r: ReturnType<typeof repo>, id: ClaimId) {
  const claim = await r.getClaim(id)
  for (const f of claim.fields) {
    if (f.status === 'needs_review') {
      await r.applyAction(id, { type: 'confirmField', fieldKey: f.key })
    } else if (f.status === 'missing') {
      await r.applyAction(id, {
        type: 'editField',
        fieldKey: f.key,
        value: 'Dr. Example',
      })
    }
  }
}

describe('fixtures', () => {
  it('has 12 claims with unique ids, all awaiting review', () => {
    expect(mockClaims).toHaveLength(12)
    expect(new Set(mockClaims.map((c) => c.id)).size).toBe(12)
    expect(mockClaims.every((c) => c.state === 'needs_review')).toBe(true)
  })

  it('covers all five exception reasons', () => {
    const reasons = new Set(mockClaims.flatMap((c) => c.exceptionReasons))
    const all: ExceptionReason[] = [
      'class_code_unclear',
      'policy_tier_ambiguous',
      'document_missing',
      'non_english_form',
      'possible_duplicate',
    ]
    expect([...reasons].sort()).toEqual([...all].sort())
  })

  it('has at least 3 detailed claims, covering every document kind', () => {
    const detailed = mockClaims.filter((c) => c.documents.length > 1)
    expect(detailed.length).toBeGreaterThanOrEqual(3)
    const kinds = new Set(
      detailed.flatMap((c) => c.documents.map((d) => d.kind)),
    )
    expect([...kinds].sort()).toEqual(
      [
        'email',
        'fax',
        'form',
        'froi',
        'medical_report',
        'pay_stub',
        'transcript',
      ].sort(),
    )
  })

  it('includes a non-English form with an English reading', () => {
    const doc = mockClaims
      .flatMap((c) => c.documents)
      .find((d) => d.language === 'es')
    expect(doc?.pages.some((p) => p.includes('ENGLISH READING'))).toBe(true)
  })

  it.each(mockClaims.map((c) => [c.id, c] as const))(
    '%s is valid: unique field keys, and every source excerpt is in its document',
    (_id, claim) => {
      expect(claim.exceptionReasons.length).toBeGreaterThan(0)
      expect(claim.fields.length).toBeGreaterThan(0)
      const keys = claim.fields.map((f) => f.key)
      expect(new Set(keys).size).toBe(keys.length)

      for (const field of claim.fields) {
        if (field.status === 'missing') expect(field.value).toBeNull()
        else expect(field.value).not.toBeNull()
        if (field.status === 'needs_review' || field.status === 'missing') {
          expect(field.reason).toBeTruthy()
        }
        for (const source of field.sources) {
          const doc = claim.documents.find((d) => d.id === source.documentId)
          expect(doc, `${field.key} cites a document that exists`).toBeDefined()
          const page = doc?.pages[(source.page ?? 1) - 1]
          expect(page, `${field.key} cites a page that exists`).toBeDefined()
          expect(page).toContain(source.excerpt)
        }
      }
    },
  )
})

describe('listExceptions', () => {
  it('lists every claim as a summary without fields or documents', async () => {
    const list = await repo().listExceptions()
    expect(list).toHaveLength(12)
    expect(Object.keys(list[0]).sort()).toEqual([
      'agentNote',
      'assignee',
      'employer',
      'exceptionReasons',
      'flaggedAt',
      'id',
      'lineOfBusiness',
      'missingCount',
      'receivedAt',
      'state',
      'toConfirmCount',
    ])
  })

  it('filters by reason, assignee and state', async () => {
    const r = repo()
    const byReason = await r.listExceptions({ reason: 'non_english_form' })
    expect(byReason.length).toBeGreaterThan(0)
    expect(
      byReason.every((c) => c.exceptionReasons.includes('non_english_form')),
    ).toBe(true)

    const byAssignee = await r.listExceptions({ assignee: 'Priya Natarajan' })
    expect(byAssignee.length).toBeGreaterThan(0)
    expect(byAssignee.every((c) => c.assignee === 'Priya Natarajan')).toBe(true)

    expect(await r.listExceptions({ state: 'filed' })).toEqual([])
  })
})

describe('the detailed claim', () => {
  it('has 14 fields across all five stages: 11 verified, 3 for the examiner', async () => {
    const claim = await repo().getClaim(DETAILED)
    expect(claim.fields).toHaveLength(14)
    expect(new Set(claim.fields.map((f) => f.stage)).size).toBe(5)
    expect(claim.fields.filter((f) => f.status === 'verified')).toHaveLength(11)
    expect(
      claim.fields
        .filter((f) => f.status !== 'verified')
        .map((f) => [f.key, f.status]),
    ).toEqual([
      ['class_code', 'needs_review'],
      ['average_weekly_wage', 'needs_review'],
      ['medical_report', 'missing'],
    ])
  })

  it('gives every claim fields in all five stages', () => {
    for (const claim of mockClaims) {
      expect(new Set(claim.fields.map((f) => f.stage)).size).toBe(5)
    }
  })
})

describe('queue summaries', () => {
  // Fixtures are as written when the repository's clock is the reference time.
  const atReference = () =>
    createMockClaimsRepository({ now: () => MOCK_REFERENCE_TIME })

  it('counts fields to confirm and missing fields from the claim itself', async () => {
    const r = atReference()
    for (const summary of await r.listExceptions()) {
      const claim = await r.getClaim(summary.id)
      expect(summary.toConfirmCount).toBe(
        claim.fields.filter((f) => f.status === 'needs_review').length,
      )
      expect(summary.missingCount).toBe(
        claim.fields.filter((f) => f.status === 'missing').length,
      )
    }
  })

  it('shows 2 to confirm and 1 missing for the detailed claim', async () => {
    const summary = (await atReference().listExceptions()).find(
      (c) => c.id === DETAILED,
    )
    expect(summary).toMatchObject({
      toConfirmCount: 2,
      missingCount: 1,
      lineOfBusiness: 'workers_comp',
      agentNote:
        'Class code and weekly wage need a check; no medical report yet',
    })
  })

  it('updates the counts when the examiner resolves a field', async () => {
    const r = atReference()
    await r.applyAction(DETAILED, {
      type: 'confirmField',
      fieldKey: 'class_code',
    })
    const summary = (await r.listExceptions()).find((c) => c.id === DETAILED)
    expect(summary).toMatchObject({ toConfirmCount: 1, missingCount: 1 })
  })

  it('never puts a claimant name in a summary', async () => {
    const names = mockClaims.flatMap((c) =>
      c.fields
        .filter((f) => f.key === 'claimant_name' || f.label === 'Employee')
        .map((f) => f.value),
    )
    expect(names.length).toBeGreaterThan(0)
    const json = JSON.stringify(await atReference().listExceptions())
    for (const name of names) expect(json).not.toContain(name as string)
  })

  it('has every claim received before it was flagged, and both before the reference time', () => {
    for (const c of mockClaims) {
      expect(new Date(c.receivedAt).getTime()).toBeLessThanOrEqual(
        new Date(c.flaggedAt).getTime(),
      )
      expect(new Date(c.flaggedAt).getTime()).toBeLessThan(
        MOCK_REFERENCE_TIME.getTime(),
      )
    }
  })

  it('flags every claim within the last 24 hours, spread over one working day', () => {
    const hoursAgo = mockClaims.map(
      (c) =>
        (MOCK_REFERENCE_TIME.getTime() - new Date(c.flaggedAt).getTime()) /
        3_600_000,
    )
    expect(Math.max(...hoursAgo)).toBeLessThan(24)
    expect(Math.max(...hoursAgo)).toBeGreaterThan(18)
    expect(Math.min(...hoursAgo)).toBeLessThan(0.25)
  })

  it('keeps a claim waiting on a missing document as the oldest', async () => {
    const [oldest] = [...mockClaims].sort((a, b) =>
      a.flaggedAt.localeCompare(b.flaggedAt),
    )
    expect(oldest.exceptionReasons[0]).toBe('document_missing')
    expect(oldest.fields.some((f) => f.status === 'missing')).toBe(true)
  })

  it('flags exactly one claim within the last ten minutes', async () => {
    const recent = (await atReference().listExceptions()).filter(
      (c) =>
        MOCK_REFERENCE_TIME.getTime() - new Date(c.flaggedAt).getTime() <=
        10 * 60_000,
    )
    expect(recent.map((c) => c.id)).toEqual(['CLM-24-0444'])
  })

  it('moves every timestamp forward with the repository clock, keeping the ages', async () => {
    const later = new Date(MOCK_REFERENCE_TIME.getTime() + 3 * 24 * 60 * 60_000)
    const [shifted] = await createMockClaimsRepository({
      now: () => later,
    }).listExceptions({
      minAgeMinutes: 0,
    })
    const [original] = await atReference().listExceptions()
    expect(new Date(shifted.flaggedAt).getTime() - later.getTime()).toBe(
      new Date(original.flaggedAt).getTime() - MOCK_REFERENCE_TIME.getTime(),
    )
  })
})

describe('new filters', () => {
  const atReference = () =>
    createMockClaimsRepository({ now: () => MOCK_REFERENCE_TIME })
  const ids = async (
    filter: Parameters<ReturnType<typeof atReference>['listExceptions']>[0],
  ) => (await atReference().listExceptions(filter)).map((c) => c.id)

  it('matches the primary reason, so a secondary reason does not count', async () => {
    // CLM-24-0417 lists document_missing second.
    expect(await ids({ reason: 'document_missing' })).not.toContain(DETAILED)
    expect(await ids({ reason: 'class_code_unclear' })).toContain(DETAILED)
  })

  it('filters by line of business', async () => {
    const result = await atReference().listExceptions({
      lineOfBusiness: 'occupational_accident',
    })
    expect(result.map((c) => c.id).sort()).toEqual([
      'CLM-24-0425',
      'CLM-24-0436',
    ])
    expect(
      (
        await atReference().listExceptions({
          lineOfBusiness: 'employers_liability',
        })
      ).map((c) => c.id),
    ).toEqual(['CLM-24-0413'])
  })

  // Ages at the reference time, in minutes: 1205, 1050, 860, 710, 585, 457,
  // 370, 252, 166, 95, 40 and 4 (see detailedClaims.ts and lightClaims.ts).
  it.each([
    [60, 10],
    [4 * 60, 8],
    [10 * 60, 4],
    [24 * 60, 0],
  ])(
    'keeps claims at least %i minutes old: %i of 12',
    async (minAgeMinutes, count) => {
      expect(await ids({ minAgeMinutes })).toHaveLength(count)
    },
  )

  it('combines filters', async () => {
    // Primary class-code claims are 0402 (17 h 30), 0417 (9 h 45) and 0436 (1 h 35).
    expect(
      (
        await ids({ reason: 'class_code_unclear', minAgeMinutes: 10 * 60 })
      ).sort(),
    ).toEqual(['CLM-24-0402'])
  })
})

describe('getPipelineSummary', () => {
  it('returns the mock counts, with received today derived and no needs-review number', async () => {
    expect(await repo().getPipelineSummary()).toEqual({
      receivedToday: 145, // 6 working + 127 filed + 12 waiting for an examiner
      agentWorking: 6,
      filedAutomatically: 127,
    })
  })

  it('always adds up: received = working + filed + the queue', async () => {
    const r = repo()
    const sum = async () => {
      const p = await r.getPipelineSummary()
      const queue = await r.listExceptions({ state: 'needs_review' })
      expect(p.receivedToday).toBe(
        p.agentWorking + p.filedAutomatically + queue.length,
      )
      return queue.length
    }
    expect(await sum()).toBe(12)

    await r.applyAction(DETAILED, { type: 'escalate' })
    expect(await sum()).toBe(11)
    expect((await r.getPipelineSummary()).receivedToday).toBe(144)
  })

  it('accepts other agent counts for a test', async () => {
    const r = createMockClaimsRepository({
      pipeline: { agentWorking: 2, filedAutomatically: 3 },
    })
    expect(await r.getPipelineSummary()).toEqual({
      receivedToday: 17, // 2 + 3 + 12
      agentWorking: 2,
      filedAutomatically: 3,
    })
  })
})

describe('getClaim', () => {
  it('returns the full claim', async () => {
    const claim = await repo().getClaim(DETAILED)
    expect(claim.documents).toHaveLength(4)
    expect(claim.fields.length).toBeGreaterThan(0)
  })

  it('rejects an unknown id with not_found', async () => {
    await expect(repo().getClaim(toClaimId('nope'))).rejects.toMatchObject({
      name: 'ClaimsRepositoryError',
      code: 'not_found',
    })
  })

  it('hands out copies, so callers cannot change stored data', async () => {
    const r = repo()
    const first = await r.getClaim(DETAILED)
    first.fields[0].value = 'tampered'
    first.state = 'filed'
    const second = await r.getClaim(DETAILED)
    expect(second.fields[0].value).not.toBe('tampered')
    expect(second.state).toBe('needs_review')
  })
})

describe('applyAction', () => {
  it('persists the change and returns the updated claim', async () => {
    const r = repo()
    const updated = await r.applyAction(DETAILED, {
      type: 'confirmField',
      fieldKey: 'class_code',
    })
    expect(updated.fields.find((f) => f.key === 'class_code')?.status).toBe(
      'verified',
    )

    const reread = await r.getClaim(DETAILED)
    expect(reread).toEqual(updated)
    expect(reread.activity.at(-1)?.action).toBe('Confirmed Job class code')
    expect(reread.activity.at(-1)?.at).toBe(NOW.toISOString())
  })

  it('takes a claim through approve and file, and the list reflects it', async () => {
    const r = repo()
    await resolveAll(r, DETAILED)
    expect((await r.applyAction(DETAILED, { type: 'approve' })).state).toBe(
      'approved',
    )
    expect((await r.getClaim(DETAILED)).state).toBe('approved')
    expect((await r.applyAction(DETAILED, { type: 'file' })).state).toBe(
      'filed',
    )

    const filed = await r.listExceptions({ state: 'filed' })
    expect(filed.map((c) => c.id)).toEqual([DETAILED])
  })

  it('rejects an illegal action and leaves the stored claim unchanged', async () => {
    const r = repo()
    const before = await r.getClaim(DETAILED)

    await expect(
      r.applyAction(DETAILED, { type: 'approve' }),
    ).rejects.toMatchObject({
      code: 'unresolved_fields',
    })
    await expect(
      r.applyAction(DETAILED, { type: 'file' }),
    ).rejects.toMatchObject({
      code: 'invalid_state',
    })
    await expect(
      r.applyAction(DETAILED, { type: 'file' }),
    ).rejects.toBeInstanceOf(ClaimsRepositoryError)
    expect(await r.getClaim(DETAILED)).toEqual(before)
  })

  it('rejects an action for an unknown claim', async () => {
    await expect(
      repo().applyAction(toClaimId('nope'), { type: 'escalate' }),
    ).rejects.toMatchObject({ code: 'not_found' })
  })

  it('does not share state between repositories', async () => {
    const a = repo()
    const b = repo()
    await a.applyAction(DETAILED, { type: 'escalate' })
    expect((await b.getClaim(DETAILED)).state).toBe('needs_review')
  })
})

describe('delay', () => {
  it('waits the configured delay before resolving', async () => {
    vi.useFakeTimers()
    try {
      const r = createMockClaimsRepository({ delayMs: 500 })
      let done = false
      const pending = r.listExceptions().then(() => {
        done = true
      })
      await vi.advanceTimersByTimeAsync(499)
      expect(done).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      await pending
      expect(done).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
