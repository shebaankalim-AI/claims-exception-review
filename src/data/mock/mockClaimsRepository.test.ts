import { ClaimsRepositoryError, toClaimId } from '@/domain'
import type { ClaimId, ExceptionReason } from '@/domain'
import { createMockClaimsRepository, mockClaims } from './index'

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
      ['email', 'fax', 'form', 'froi', 'medical_report'].sort(),
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
      'assignee',
      'employer',
      'exceptionReasons',
      'id',
      'receivedAt',
      'state',
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

describe('getClaim', () => {
  it('returns the full claim', async () => {
    const claim = await repo().getClaim(DETAILED)
    expect(claim.documents).toHaveLength(2)
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
    expect(reread.activity.at(-1)?.action).toBe('Confirmed Class code')
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
