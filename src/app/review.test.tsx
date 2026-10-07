import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { openOldestClaim } from '@/test/helpers'

// Whole-app tests of the claim review, written as an examiner would act. The
// mock repository has a short delay, so everything is awaited.

function renderApp() {
  render(<App />)
  // No pause between keystrokes: typing is not what these tests are about.
  return userEvent.setup({ delay: null })
}

const WAIT = { timeout: 4000 }
const main = () => screen.getByRole('main')

async function openClaim(user: ReturnType<typeof renderApp>) {
  await openOldestClaim(user)
  // CLM-24-0388 has one flagged field: a missing medical contact.
  await within(main()).findByRole('button', { name: 'Approve' }, WAIT)
}

const approve = () => within(main()).getByRole('button', { name: 'Approve' })

describe('approving a claim', () => {
  it('keeps Approve disabled until no field needs the examiner', async () => {
    const user = renderApp()
    await openClaim(user)

    expect(approve()).toHaveAttribute('aria-disabled', 'true')
    expect(approve()).toHaveAccessibleDescription(/still needs you/)

    // A disabled Approve does nothing when clicked.
    await user.click(approve())
    expect(
      within(main()).queryByText(/Approved by you/),
    ).not.toBeInTheDocument()

    await user.click(within(main()).getByRole('button', { name: 'Add value' }))
    await user.type(
      within(main()).getByLabelText(/New value for/),
      'Dr. Example',
    )
    await user.click(within(main()).getByRole('button', { name: 'Save' }))

    expect(
      await within(main()).findByText(
        /All flagged fields are resolved/,
        {},
        WAIT,
      ),
    ).toBeInTheDocument()
    expect(approve()).toHaveAttribute('aria-disabled', 'false')

    await user.click(approve())
    expect(
      await within(main()).findByText(/Approved by you at/, {}, WAIT),
    ).toBeInTheDocument()
    expect(
      within(main()).getByRole('button', { name: 'File claim' }),
    ).toBeInTheDocument()
  })
})

describe('sending back and escalating', () => {
  it('keeps Send back disabled until a reason is chosen', async () => {
    const user = renderApp()
    await openClaim(user)

    await user.click(within(main()).getByRole('button', { name: 'Send back' }))
    const dialog = screen.getByRole('dialog', { name: 'Send back CLM-24-0388' })
    const submit = within(dialog).getByRole('button', { name: 'Send back' })
    expect(submit).toBeDisabled()
    expect(submit).toHaveAccessibleDescription('Choose a reason first')

    await user.click(
      within(dialog).getByRole('radio', { name: 'Re-run the extraction' }),
    )
    expect(submit).toBeEnabled()
  })

  it('keeps Escalate disabled until the note has text', async () => {
    const user = renderApp()
    await openClaim(user)

    await user.click(within(main()).getByRole('button', { name: 'Escalate' }))
    const dialog = screen.getByRole('dialog', { name: 'Escalate CLM-24-0388' })
    const submit = within(dialog).getByRole('button', { name: 'Escalate' })
    expect(submit).toBeDisabled()

    await user.type(
      within(dialog).getByLabelText(/Why are you escalating/),
      '   ',
    )
    expect(submit).toBeDisabled()

    await user.type(
      within(dialog).getByLabelText(/Why are you escalating/),
      'Needs a senior look',
    )
    expect(submit).toBeEnabled()
  })

  it('sends the claim back, returns to the queue and says so', async () => {
    const user = renderApp()
    await openClaim(user)

    await user.click(within(main()).getByRole('button', { name: 'Send back' }))
    const dialog = screen.getByRole('dialog', { name: 'Send back CLM-24-0388' })
    await user.click(
      within(dialog).getByRole('radio', { name: 'Re-run the extraction' }),
    )
    await user.click(within(dialog).getByRole('button', { name: 'Send back' }))

    expect(
      await within(main()).findByText(
        'CLM-24-0388 sent back to the agent',
        {},
        WAIT,
      ),
    ).toBeInTheDocument()
    expect(
      await within(main()).findByRole('heading', { name: 'Exceptions' }, WAIT),
    ).toBeInTheDocument()
  })
})

describe('the assistant panel', () => {
  it('switches to Chat when a message is sent, and answers after a moment', async () => {
    const user = renderApp()
    const panel = () => screen.getByRole('complementary', { name: 'AI panel' })
    await within(panel()).findByText(/claims received today/, {}, WAIT)
    expect(
      within(panel()).getByRole('button', { name: 'Summary' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.type(
      within(panel()).getByRole('textbox', { name: "Ask about today's queue" }),
      'How many need me?{Enter}',
    )

    expect(
      within(panel()).getByRole('button', { name: /^Chat/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(within(panel()).getByText('How many need me?')).toBeInTheDocument()
    expect(
      await within(panel()).findByText(/claims need you\./, {}, WAIT),
    ).toBeInTheDocument()
  })

  it('does not send an empty message', async () => {
    const user = renderApp()
    const panel = () => screen.getByRole('complementary', { name: 'AI panel' })
    expect(within(panel()).getByRole('button', { name: 'Send' })).toBeDisabled()
    await user.type(
      within(panel()).getByRole('textbox', { name: "Ask about today's queue" }),
      '   {Enter}',
    )
    expect(
      within(panel()).getByRole('button', { name: 'Summary' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
