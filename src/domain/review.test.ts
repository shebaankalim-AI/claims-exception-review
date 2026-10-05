import { reviewReducer } from './review'
import type { ReviewErrorCode } from './review'
import { toClaimId } from './types'
import type {
  Claim,
  ClaimState,
  Field,
  FieldStatus,
  ReviewAction,
} from './types'

const NOW = new Date('2025-03-10T09:30:00.000Z')

const STATES: ClaimState[] = [
  'needs_review',
  'approved',
  'filed',
  'sent_back',
  'escalated',
]

function field(
  key: string,
  status: FieldStatus,
  value: string | null = 'x',
): Field {
  return {
    key,
    label: `Label ${key}`,
    value,
    status,
    sources: [{ documentId: 'doc-1', excerpt: 'an excerpt' }],
    resolvedBy: 'agent',
  }
}

function claim(state: ClaimState, fields: Field[]): Claim {
  return {
    id: toClaimId('CLM-TEST-0001'),
    employer: 'Test Employer',
    exceptionReasons: ['class_code_unclear'],
    receivedAt: '2025-03-09T08:00:00.000Z',
    assignee: 'Test Examiner',
    state,
    fields,
    documents: [],
    activity: [
      {
        at: '2025-03-09T08:05:00.000Z',
        actor: 'agent',
        action: 'Extracted fields',
      },
    ],
  }
}

const resolvedFields = () => [field('a', 'verified'), field('b', 'edited')]
const mixedFields = () => [
  field('a', 'verified'),
  field('b', 'needs_review'),
  field('c', 'missing', null),
]

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function expectError(
  result: ReturnType<typeof reviewReducer>,
  code: ReviewErrorCode,
) {
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.error.code).toBe(code)
}

describe('reviewReducer: transitions by claim state', () => {
  // Every action x every state. The expected value is the resulting state,
  // or the error code when the action is illegal from that state.
  type Row = [
    name: string,
    action: ReviewAction,
    from: ClaimState,
    expected: ClaimState | ReviewErrorCode,
  ]

  const actions: [string, ReviewAction][] = [
    ['confirmField', { type: 'confirmField', fieldKey: 'b' }],
    ['editField', { type: 'editField', fieldKey: 'a', value: 'new' }],
    ['approve', { type: 'approve' }],
    ['file', { type: 'file' }],
    ['sendBack', { type: 'sendBack' }],
    ['escalate', { type: 'escalate' }],
  ]

  const legal: Record<string, ClaimState[]> = {
    confirmField: ['needs_review'],
    editField: ['needs_review'],
    approve: ['needs_review'],
    file: ['approved'],
    sendBack: ['needs_review'],
    escalate: ['needs_review'],
  }
  const resulting: Record<string, ClaimState | undefined> = {
    confirmField: 'needs_review',
    editField: 'needs_review',
    approve: 'approved',
    file: 'filed',
    sendBack: 'sent_back',
    escalate: 'escalated',
  }

  const rows: Row[] = actions.flatMap(([name, action]) =>
    STATES.map((from): Row => {
      const allowed = legal[name].includes(from)
      return [
        name,
        action,
        from,
        allowed ? (resulting[name] as ClaimState) : 'invalid_state',
      ]
    }),
  )

  it.each(rows)('%s from %s -> %s', (_name, action, from, expected) => {
    // Fields all resolved so approve's field rule never masks the state rule.
    const fields = [field('a', 'verified'), field('b', 'needs_review')]
    if (action.type === 'approve') fields[1] = field('b', 'verified')
    const before = claim(from, fields)

    const result = reviewReducer(before, action, NOW)

    if (expected === 'invalid_state') {
      expectError(result, 'invalid_state')
    } else {
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.claim.state).toBe(expected)
    }
  })

  it('covers every action in every state', () => {
    expect(rows).toHaveLength(6 * STATES.length)
  })
})

describe('reviewReducer: approve', () => {
  it.each<[string, Field[]]>([
    [
      'a needs_review field',
      [field('a', 'verified'), field('b', 'needs_review')],
    ],
    ['a missing field', [field('a', 'verified'), field('b', 'missing', null)]],
    ['both kinds', mixedFields()],
  ])('is blocked by %s', (_label, fields) => {
    const result = reviewReducer(
      claim('needs_review', fields),
      { type: 'approve' },
      NOW,
    )
    expectError(result, 'unresolved_fields')
  })

  it('names the unresolved fields in the message', () => {
    const result = reviewReducer(
      claim('needs_review', mixedFields()),
      { type: 'approve' },
      NOW,
    )
    expect(!result.ok && result.error.message).toContain('Label b')
    expect(!result.ok && result.error.message).toContain('Label c')
  })

  it('is allowed when every field is verified or edited', () => {
    const result = reviewReducer(
      claim('needs_review', resolvedFields()),
      { type: 'approve' },
      NOW,
    )
    expect(result.ok && result.claim.state).toBe('approved')
  })

  it('does not file: approved is not filed', () => {
    const result = reviewReducer(
      claim('needs_review', resolvedFields()),
      { type: 'approve' },
      NOW,
    )
    expect(result.ok && result.claim.state).not.toBe('filed')
  })
})

describe('reviewReducer: confirmField', () => {
  it('sets a needs_review field to verified, resolved by the examiner', () => {
    const result = reviewReducer(
      claim('needs_review', mixedFields()),
      { type: 'confirmField', fieldKey: 'b' },
      NOW,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const b = result.claim.fields.find((f) => f.key === 'b')
    expect(b).toMatchObject({
      status: 'verified',
      resolvedBy: 'examiner',
      value: 'x',
    })
    // Other fields untouched.
    expect(result.claim.fields.find((f) => f.key === 'a')?.resolvedBy).toBe(
      'agent',
    )
  })

  it.each<[FieldStatus]>([['verified'], ['edited'], ['missing']])(
    'rejects a field that is %s',
    (status) => {
      const result = reviewReducer(
        claim('needs_review', [
          field('b', status, status === 'missing' ? null : 'x'),
        ]),
        { type: 'confirmField', fieldKey: 'b' },
        NOW,
      )
      expectError(result, 'field_not_confirmable')
    },
  )

  it('rejects an unknown field key', () => {
    const result = reviewReducer(
      claim('needs_review', mixedFields()),
      { type: 'confirmField', fieldKey: 'nope' },
      NOW,
    )
    expectError(result, 'field_not_found')
  })
})

describe('reviewReducer: editField', () => {
  it.each<[FieldStatus]>([
    ['needs_review'],
    ['missing'],
    ['verified'],
    ['edited'],
  ])('sets a new value on a %s field', (status) => {
    const result = reviewReducer(
      claim('needs_review', [
        field('b', status, status === 'missing' ? null : 'old'),
      ]),
      { type: 'editField', fieldKey: 'b', value: '  new value ' },
      NOW,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.claim.fields[0]).toMatchObject({
      value: 'new value',
      status: 'edited',
      resolvedBy: 'examiner',
    })
  })

  it.each([[''], ['   ']])('rejects the empty value %j', (value) => {
    const result = reviewReducer(
      claim('needs_review', mixedFields()),
      { type: 'editField', fieldKey: 'b', value },
      NOW,
    )
    expectError(result, 'empty_value')
  })

  it('rejects an unknown field key', () => {
    const result = reviewReducer(
      claim('needs_review', mixedFields()),
      { type: 'editField', fieldKey: 'nope', value: 'v' },
      NOW,
    )
    expectError(result, 'field_not_found')
  })

  it('lets the examiner resolve every field, then approve', () => {
    let current = claim('needs_review', mixedFields())
    for (const action of [
      { type: 'confirmField', fieldKey: 'b' },
      { type: 'editField', fieldKey: 'c', value: 'filled in' },
      { type: 'approve' },
    ] satisfies ReviewAction[]) {
      const result = reviewReducer(current, action, NOW)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      current = result.claim
    }
    expect(current.state).toBe('approved')
  })
})

describe('reviewReducer: sendBack and escalate', () => {
  it('records the note as the activity detail', () => {
    const result = reviewReducer(
      claim('needs_review', mixedFields()),
      { type: 'sendBack', note: 'Need the medical report' },
      NOW,
    )
    expect(result.ok && result.claim.activity.at(-1)).toMatchObject({
      action: 'Sent back to the agent',
      detail: 'Need the medical report',
    })
  })

  it('is allowed with unresolved fields', () => {
    const result = reviewReducer(
      claim('needs_review', mixedFields()),
      { type: 'escalate' },
      NOW,
    )
    expect(result.ok && result.claim.state).toBe('escalated')
  })
})

describe('reviewReducer: activity log', () => {
  const successes: [string, ReviewAction, ClaimState, Field[]][] = [
    [
      'confirmField',
      { type: 'confirmField', fieldKey: 'b' },
      'needs_review',
      mixedFields(),
    ],
    [
      'editField',
      { type: 'editField', fieldKey: 'b', value: 'v' },
      'needs_review',
      mixedFields(),
    ],
    ['approve', { type: 'approve' }, 'needs_review', resolvedFields()],
    ['file', { type: 'file' }, 'approved', resolvedFields()],
    ['sendBack', { type: 'sendBack' }, 'needs_review', mixedFields()],
    ['escalate', { type: 'escalate' }, 'needs_review', mixedFields()],
  ]

  it.each(successes)(
    '%s appends exactly one examiner entry',
    (_n, action, state, fields) => {
      const before = claim(state, fields)
      const result = reviewReducer(before, action, NOW)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.claim.activity).toHaveLength(before.activity.length + 1)
      expect(result.claim.activity.slice(0, -1)).toEqual(before.activity)
      expect(result.claim.activity.at(-1)).toMatchObject({
        at: NOW.toISOString(),
        actor: 'examiner',
      })
    },
  )

  it('links confirm and edit entries to the field sources', () => {
    const result = reviewReducer(
      claim('needs_review', mixedFields()),
      { type: 'confirmField', fieldKey: 'b' },
      NOW,
    )
    expect(result.ok && result.claim.activity.at(-1)?.sourceRefs).toEqual([
      { documentId: 'doc-1', excerpt: 'an excerpt' },
    ])
  })

  it('records the old and new value on an edit', () => {
    const result = reviewReducer(
      claim('needs_review', [field('b', 'needs_review', '8810')]),
      { type: 'editField', fieldKey: 'b', value: '8292' },
      NOW,
    )
    expect(result.ok && result.claim.activity.at(-1)?.detail).toBe(
      '8810 → 8292',
    )
  })

  it('appends nothing when the action is rejected', () => {
    const before = claim('needs_review', mixedFields())
    const result = reviewReducer(before, { type: 'approve' }, NOW)
    expect(result.ok).toBe(false)
    expect(before.activity).toHaveLength(1)
  })
})

describe('reviewReducer: purity and safety', () => {
  it('never mutates its input, on success or failure', () => {
    const before = deepFreeze(claim('needs_review', mixedFields()))
    const snapshot = structuredClone(before)
    const actions: ReviewAction[] = [
      { type: 'confirmField', fieldKey: 'b' },
      { type: 'editField', fieldKey: 'c', value: 'v' },
      { type: 'approve' },
      { type: 'file' },
      { type: 'sendBack', note: 'n' },
      { type: 'escalate' },
    ]
    for (const action of actions) {
      expect(() => reviewReducer(before, action, NOW)).not.toThrow()
    }
    expect(before).toEqual(snapshot)
  })

  it('returns a new claim object rather than the input', () => {
    const before = claim('needs_review', resolvedFields())
    const result = reviewReducer(before, { type: 'approve' }, NOW)
    expect(result.ok && result.claim).not.toBe(before)
  })

  it('returns an error instead of throwing on an invalid time', () => {
    const result = reviewReducer(
      claim('needs_review', resolvedFields()),
      { type: 'approve' },
      new Date('not a date'),
    )
    expectError(result, 'invalid_time')
  })

  it('returns an error instead of throwing on an unknown action', () => {
    const bogus = { type: 'explode' } as unknown as ReviewAction
    const result = reviewReducer(
      claim('needs_review', resolvedFields()),
      bogus,
      NOW,
    )
    expectError(result, 'unknown_action')
  })
})
