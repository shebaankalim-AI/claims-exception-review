import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import {
  ClaimsRepositoryError,
  matchesExceptionFilter,
  toClaimId,
} from '@/domain'
import type {
  ClaimId,
  ClaimsRepository,
  ClaimSummary,
  ExceptionFilter,
  PipelineSummary,
} from '@/domain'
import { ClaimsRepositoryContext } from '@/lib/claimsRepository'
import { ClockContext } from '@/lib/clock'
import { QueueDigest } from './QueueDigest'
import { QueueScreen } from './QueueScreen'
import { useQueue } from './useQueue'

const NOW = new Date('2025-02-27T15:00:00.000Z')
const minutesAgo = (m: number) =>
  new Date(NOW.getTime() - m * 60_000).toISOString()

function summary(
  id: string,
  overrides: Partial<ClaimSummary> & { ago: number },
): ClaimSummary {
  const { ago, ...rest } = overrides
  return {
    id: toClaimId(id),
    employer: 'Test Employer',
    lineOfBusiness: 'workers_comp',
    exceptionReasons: ['class_code_unclear'],
    agentNote: 'two codes plausible',
    receivedAt: minutesAgo(ago + 3),
    flaggedAt: minutesAgo(ago),
    assignee: 'Test Examiner',
    state: 'needs_review',
    toConfirmCount: 1,
    missingCount: 0,
    ...rest,
  }
}

// Deliberately out of order, so sorting is something the screen has to do.
const CLAIMS: ClaimSummary[] = [
  summary('CLM-T-0003', {
    ago: 48,
    toConfirmCount: 1,
    missingCount: 1,
    agentNote: 'note three',
  }),
  summary('CLM-T-0001', {
    ago: 3 * 24 * 60,
    toConfirmCount: 2,
    agentNote: 'note one',
  }),
  summary('CLM-T-0004', {
    ago: 4,
    exceptionReasons: ['possible_duplicate'],
    lineOfBusiness: 'employers_liability',
    toConfirmCount: 0,
    missingCount: 0,
    agentNote: 'note four',
  }),
  summary('CLM-T-0002', {
    ago: 5 * 60 + 5,
    exceptionReasons: ['document_missing'],
    lineOfBusiness: 'occupational_accident',
    toConfirmCount: 0,
    missingCount: 1,
    agentNote: 'note two',
  }),
]

const PIPELINE: PipelineSummary = {
  receivedToday: 142,
  agentWorking: 6,
  filedAutomatically: 127,
}

function fakeRepository(
  claims: ClaimSummary[] = CLAIMS,
  overrides: Partial<ClaimsRepository> = {},
): ClaimsRepository {
  return {
    listExceptions: (filter: ExceptionFilter = {}) =>
      Promise.resolve(
        claims.filter((c) => matchesExceptionFilter(c, filter, NOW)),
      ),
    getPipelineSummary: () => Promise.resolve(PIPELINE),
    getClaim: () => Promise.reject(new Error('unused')),
    applyAction: () => Promise.reject(new Error('unused')),
    ...overrides,
  }
}

function Harness({
  repository,
  onOpenClaim = () => {},
}: {
  repository: ClaimsRepository
  onOpenClaim?: (id: ClaimId) => void
}) {
  return (
    <ClaimsRepositoryContext.Provider value={repository}>
      <ClockContext.Provider value={() => NOW}>
        <Screens onOpenClaim={onOpenClaim} />
      </ClockContext.Provider>
    </ClaimsRepositoryContext.Provider>
  )
}

// Mirrors what app/ does: load once, hand the same data to the screen and the digest.
function Screens({ onOpenClaim }: { onOpenClaim: (id: ClaimId) => void }) {
  const [active, setActive] = useState(true)
  const queue = useQueue(active)
  return (
    <>
      <button type="button" onClick={() => setActive((a) => !a)}>
        toggle view
      </button>
      <main>
        <QueueScreen queue={queue} onOpenClaim={onOpenClaim} />
      </main>
      <aside aria-label="digest">
        <QueueDigest queue={queue} onOpenClaim={onOpenClaim} />
      </aside>
    </>
  )
}

function setup(
  repository: ClaimsRepository = fakeRepository(),
  onOpenClaim?: (id: ClaimId) => void,
) {
  const user = userEvent.setup()
  render(<Harness repository={repository} onOpenClaim={onOpenClaim} />)
  return user
}

const main = () => screen.getByRole('main')
const region = () => screen.getByRole('region', { name: 'Exceptions' })
const table = () => within(main()).getByRole('table')
const rowIds = () =>
  within(table())
    .getAllByRole('button', { name: /^CLM-/ })
    .map((b) => b.textContent)
const digest = () => screen.getByRole('complementary', { name: 'digest' })

describe('loading', () => {
  it('shows skeleton rows while loading, then the rows', async () => {
    let resolve: (claims: ClaimSummary[]) => void = () => {}
    const pending = new Promise<ClaimSummary[]>((r) => (resolve = r))
    setup(fakeRepository(CLAIMS, { listExceptions: () => pending }))

    expect(screen.getByRole('status')).toHaveTextContent('Loading exceptions')
    expect(region()).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText(/Reading the queue/)).toBeInTheDocument()

    await act(async () => resolve(CLAIMS))
    expect(await within(main()).findByRole('table')).toBeInTheDocument()
    expect(region()).toHaveAttribute('aria-busy', 'false')
    expect(rowIds()).toHaveLength(4)
  })

  it('does not set state after it is unmounted', async () => {
    let resolve: (claims: ClaimSummary[]) => void = () => {}
    const pending = new Promise<ClaimSummary[]>((r) => (resolve = r))
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const user = userEvent.setup()
      const { unmount } = render(
        <Harness
          repository={fakeRepository(CLAIMS, { listExceptions: () => pending })}
        />,
      )
      expect(user).toBeDefined()
      unmount()
      await act(async () => resolve(CLAIMS))
      expect(errors).not.toHaveBeenCalled()
    } finally {
      errors.mockRestore()
    }
  })

  it('loads again when the queue is shown again, so the list is fresh', async () => {
    const list = vi.fn(() => Promise.resolve(CLAIMS))
    const user = setup(fakeRepository(CLAIMS, { listExceptions: list }))
    await within(main()).findByRole('table')
    expect(list).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'toggle view' }))
    await user.click(screen.getByRole('button', { name: 'toggle view' }))
    await within(main()).findByRole('table')
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('fetches once for the screen and the digest together', async () => {
    const list = vi.fn(() => Promise.resolve(CLAIMS))
    const pipeline = vi.fn(() => Promise.resolve(PIPELINE))
    setup(
      fakeRepository(CLAIMS, {
        listExceptions: list,
        getPipelineSummary: pipeline,
      }),
    )
    await within(main()).findByRole('table')
    expect(list).toHaveBeenCalledTimes(1)
    expect(pipeline).toHaveBeenCalledTimes(1)
  })
})

describe('the table', () => {
  it('lists claims oldest first', async () => {
    setup()
    await within(main()).findByRole('table')
    expect(rowIds()).toEqual([
      'CLM-T-0001', // 3 days
      'CLM-T-0002', // 5 h 05
      'CLM-T-0003', // 48 min
      'CLM-T-0004', // 4 min
    ])
    expect(screen.getByText('Sorted: Oldest first')).toBeInTheDocument()
  })

  it('has real column headers', async () => {
    setup()
    const headers = within(await within(main()).findByRole('table'))
      .getAllByRole('columnheader')
      .map((h) => h.textContent)
    expect(headers).toEqual([
      'Claim',
      'Line',
      'Why the agent stopped',
      "What's needed",
      'Age',
    ])
  })

  it('shows the line, the reason with the agent note, and the age', async () => {
    setup()
    const row = within(
      (
        await within(main()).findByRole('button', { name: 'CLM-T-0002' })
      ).closest('tr')!,
    )
    expect(row.getByText('Occupational accident')).toBeInTheDocument()
    expect(row.getByText('Document missing')).toBeInTheDocument()
    expect(row.getByText('note two')).toBeInTheDocument()
    expect(row.getByText('5 h 05')).toBeInTheDocument()
  })

  it.each([
    ['CLM-T-0001', ['2 to confirm']],
    ['CLM-T-0002', ['1 missing']],
    ['CLM-T-0003', ['1 to confirm', '1 missing']],
    ['CLM-T-0004', ['Ready to approve']],
  ])('says what %s needs, in words as well as icons', async (id, expected) => {
    setup()
    const row = within(
      (await within(main()).findByRole('button', { name: id })).closest('tr')!,
    )
    const all = [
      '2 to confirm',
      '1 to confirm',
      '1 missing',
      'Ready to approve',
    ]
    for (const text of all) {
      if (expected.includes(text)) {
        expect(row.getByText(text)).toBeInTheDocument()
      } else {
        expect(row.queryByText(text)).not.toBeInTheDocument()
      }
    }
  })
})

describe('the pipeline strip and the count', () => {
  it('shows the pipeline numbers, and a needs-review count that matches the rows', async () => {
    setup()
    await within(main()).findByRole('table')

    const strip = within(main()).getAllByRole('definition')
    expect(strip.map((d) => d.textContent)).toEqual(['142', '6', '127', '4'])
    expect(within(main()).getByText('Needs review')).toBeInTheDocument()
    expect(within(main()).getByText('Received today')).toBeInTheDocument()
    expect(within(main()).getByText('Agent working')).toBeInTheDocument()
    expect(within(main()).getByText('Filed automatically')).toBeInTheDocument()

    expect(rowIds()).toHaveLength(4)
    expect(
      within(main()).getByText(
        /Claims the agent couldn't finish\. 4 need you\./,
      ),
    ).toBeInTheDocument()
  })

  it('says "needs you" for a single claim', async () => {
    setup(fakeRepository([CLAIMS[0]]))
    expect(await within(main()).findByText(/1 needs you./)).toBeInTheDocument()
  })

  it('does not change the needs-review count when filters hide rows', async () => {
    const user = setup()
    await within(main()).findByRole('table')
    await user.selectOptions(
      screen.getByLabelText('Reason'),
      'document_missing',
    )
    expect(rowIds()).toHaveLength(1)
    expect(
      within(main())
        .getAllByRole('definition')
        .map((d) => d.textContent),
    ).toEqual(['142', '6', '127', '4'])
  })
})

describe('filters', () => {
  it.each([
    ['Reason', 'class_code_unclear', ['CLM-T-0001', 'CLM-T-0003']],
    ['Line', 'employers_liability', ['CLM-T-0004']],
    ['Age', '4h', ['CLM-T-0001', 'CLM-T-0002']],
  ])(
    '%s narrows the table, and Clear filters restores it',
    async (label, value, expected) => {
      const user = setup()
      await within(main()).findByRole('table')
      expect(rowIds()).toHaveLength(4)

      await user.selectOptions(screen.getByLabelText(label), value)
      expect(rowIds()).toEqual(expected)

      await user.click(screen.getByRole('button', { name: 'Clear filters' }))
      expect(rowIds()).toHaveLength(4)
      expect(screen.getByLabelText(label)).toHaveValue(
        label === 'Age' ? 'any' : '',
      )
    },
  )

  it('combines filters', async () => {
    const user = setup()
    await within(main()).findByRole('table')
    await user.selectOptions(
      screen.getByLabelText('Reason'),
      'class_code_unclear',
    )
    await user.selectOptions(screen.getByLabelText('Age'), '1d')
    expect(rowIds()).toEqual(['CLM-T-0001'])
  })

  it('offers no Clear filters button until a filter is set', async () => {
    setup()
    await within(main()).findByRole('table')
    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument()
  })

  it('says so when no claim matches, with a way out', async () => {
    const user = setup()
    await within(main()).findByRole('table')
    await user.selectOptions(screen.getByLabelText('Line'), 'workers_comp')
    await user.selectOptions(
      screen.getByLabelText('Reason'),
      'possible_duplicate',
    )

    expect(
      screen.getByText('No claims match these filters'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Clear filters' }),
    ).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(rowIds()).toHaveLength(4)
  })

  it('leaves the digest alone, since it describes the whole queue', async () => {
    const user = setup()
    await within(main()).findByRole('table')
    await user.selectOptions(
      screen.getByLabelText('Reason'),
      'document_missing',
    )
    expect(within(digest()).getByText('Class code unclear')).toBeInTheDocument()
  })
})

describe('errors and an empty queue', () => {
  it('shows the error with Retry, and recovers', async () => {
    const list = vi
      .fn<ClaimsRepository['listExceptions']>()
      .mockRejectedValueOnce(
        new ClaimsRepositoryError('not_found', 'The queue is offline.'),
      )
      .mockResolvedValue(CLAIMS)
    const user = setup(fakeRepository(CLAIMS, { listExceptions: list }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't load the queue",
    )
    expect(
      within(main()).getByText('The queue is offline.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(
      within(digest()).getByText(/digest is unavailable/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await within(main()).findByRole('table')).toBeInTheDocument()
    expect(rowIds()).toHaveLength(4)
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('uses a plain message for an error that is not a repository error', async () => {
    setup(
      fakeRepository(CLAIMS, {
        getPipelineSummary: () => Promise.reject(new Error('socket hang up')),
      }),
    )
    expect(
      await within(main()).findByText(
        'Something went wrong while loading the queue.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/socket hang up/)).not.toBeInTheDocument()
  })

  it('shows the All clear card for an empty queue', async () => {
    setup(fakeRepository([]))
    expect(await screen.findByText('All clear')).toBeInTheDocument()
    expect(screen.getByText(/The agent is working on 6/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText(/0 need you\./)).toBeInTheDocument()
    expect(within(digest()).getByText(/None need you/)).toBeInTheDocument()
  })
})

describe('opening a claim', () => {
  it('opens it from the ID button', async () => {
    const onOpenClaim = vi.fn()
    const user = setup(fakeRepository(), onOpenClaim)
    await user.click(
      await within(main()).findByRole('button', { name: 'CLM-T-0003' }),
    )
    expect(onOpenClaim).toHaveBeenCalledTimes(1)
    expect(onOpenClaim).toHaveBeenCalledWith('CLM-T-0003')
  })

  it('opens it from the keyboard, with Tab and Enter', async () => {
    const onOpenClaim = vi.fn()
    const user = setup(fakeRepository(), onOpenClaim)
    const first = await within(main()).findByRole('button', {
      name: 'CLM-T-0001',
    })
    // The filters come first in tab order; walk until the first claim has focus.
    for (let i = 0; i < 10 && document.activeElement !== first; i++) {
      await user.tab()
    }
    expect(first).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onOpenClaim).toHaveBeenCalledWith('CLM-T-0001')
  })

  it('opens it by clicking anywhere on the row, once', async () => {
    const onOpenClaim = vi.fn()
    const user = setup(fakeRepository(), onOpenClaim)
    await user.click(await within(main()).findByText('note four'))
    expect(onOpenClaim).toHaveBeenCalledTimes(1)
    expect(onOpenClaim).toHaveBeenCalledWith('CLM-T-0004')
  })
})

describe('the agent digest', () => {
  it('counts the reasons, largest first', async () => {
    setup()
    await within(main()).findByRole('table')
    const section = within(digest())
      .getByRole('heading', { name: 'Why they stopped' })
      .closest('section')!
    const rows = within(section)
      .getAllByRole('listitem')
      .map((li) => li.textContent)
    expect(rows).toEqual([
      'Class code unclear2',
      'Document missing1',
      'Possible duplicate1',
    ])
  })

  it('summarises the day from the pipeline and the queue', async () => {
    setup()
    await within(main()).findByRole('table')
    expect(
      within(digest()).getByText(
        /142 claims received\. The agent filed 127 on its own and is working on 6\. 4 need you\./,
      ),
    ).toBeInTheDocument()
  })

  it('shows what was just flagged, when it was within ten minutes', async () => {
    setup()
    await within(main()).findByRole('table')
    const section = within(digest())
      .getByRole('heading', { name: 'Just flagged' })
      .closest('section')!
    expect(
      within(section).getByRole('button', { name: 'CLM-T-0004' }),
    ).toBeInTheDocument()
    expect(section).toHaveTextContent('Possible duplicate')
    expect(section).toHaveTextContent('4 min ago')
  })

  it('leaves out Just flagged when nothing is recent', async () => {
    setup(fakeRepository(CLAIMS.filter((c) => c.id !== 'CLM-T-0004')))
    await within(main()).findByRole('table')
    expect(
      within(digest()).queryByRole('heading', { name: 'Just flagged' }),
    ).not.toBeInTheDocument()
  })

  it('suggests starting with the oldest claim', async () => {
    const onOpenClaim = vi.fn()
    const user = setup(fakeRepository(), onOpenClaim)
    await within(main()).findByRole('table')
    const section = within(digest())
      .getByRole('heading', { name: 'Suggested order' })
      .closest('section')!
    expect(section).toHaveTextContent('Start with CLM-T-0001')
    expect(section).toHaveTextContent('3 d 00 h')

    await user.click(
      within(section).getByRole('button', { name: 'CLM-T-0001' }),
    )
    expect(onOpenClaim).toHaveBeenCalledWith('CLM-T-0001')
  })
})
