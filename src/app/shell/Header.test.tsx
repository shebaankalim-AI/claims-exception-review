import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { openOldestClaim } from '@/test/helpers'

function renderApp() {
  render(<App />)
  return userEvent.setup()
}

const header = () => screen.getByRole('banner')

describe('header', () => {
  it('starts with the search box, then a settings button and an avatar button', () => {
    renderApp()
    const controls = [
      ...header().querySelectorAll<HTMLElement>('input, button'),
    ]
    expect(controls.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Search claims',
      'Settings',
      'Casey Lindqvist, Examiner',
    ])
    expect(
      within(header()).getByRole('searchbox', { name: 'Search claims' }),
    ).toBe(controls[0])
  })

  it('no longer shows a breadcrumb, an agent status line or a user menu button', async () => {
    const user = renderApp()
    const absent = () => {
      expect(
        screen.queryByRole('navigation', { name: 'Breadcrumb' }),
      ).not.toBeInTheDocument()
      expect(screen.queryByText(/Agent online/)).not.toBeInTheDocument()
      expect(screen.queryByText(/User menu/)).not.toBeInTheDocument()
    }
    absent()
    await openOldestClaim(user)
    absent()
  })

  it('keeps the search hint and the / shortcut', async () => {
    const user = renderApp()
    expect(within(header()).getByText('/')).toBeInTheDocument()
    await user.keyboard('/')
    expect(
      screen.getByRole('searchbox', { name: 'Search claims' }),
    ).toHaveFocus()
  })

  describe('settings button', () => {
    it('is dimmed and aria-disabled, and does nothing', async () => {
      const user = renderApp()
      const settings = within(header()).getByRole('button', {
        name: 'Settings',
      })
      expect(settings).toHaveAttribute('aria-disabled', 'true')
      await user.click(settings)
      expect(
        screen.getByRole('heading', { name: 'Exceptions' }),
      ).toBeInTheDocument()
    })

    it('has the tooltip "Settings (later)" on hover and on keyboard focus', async () => {
      const user = renderApp()
      const settings = within(header()).getByRole('button', {
        name: 'Settings',
      })

      act(() => settings.focus())
      expect(
        await screen.findByRole('tooltip', { name: 'Settings (later)' }),
      ).toBeInTheDocument()
      act(() => settings.blur())
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      await user.hover(settings)
      expect(
        await screen.findByRole('tooltip', { name: 'Settings (later)' }),
      ).toBeInTheDocument()
    })
  })

  describe('avatar button', () => {
    it('shows the initials, and its name and tooltip are the user and role', async () => {
      const user = renderApp()
      const avatar = within(header()).getByRole('button', {
        name: 'Casey Lindqvist, Examiner',
      })
      expect(avatar).toHaveTextContent('CL')

      await user.hover(avatar)
      expect(
        await screen.findByRole('tooltip', {
          name: 'Casey Lindqvist, Examiner',
        }),
      ).toBeInTheDocument()
    })

    it('does not repeat its name as a description', async () => {
      const user = renderApp()
      const avatar = within(header()).getByRole('button', {
        name: 'Casey Lindqvist, Examiner',
      })
      await user.hover(avatar)
      await screen.findByRole('tooltip')
      expect(avatar).not.toHaveAttribute('aria-describedby')
    })
  })

  it('stays the same when the AI panel is collapsed', async () => {
    const user = renderApp()
    await user.keyboard(']')
    expect(
      screen.getByRole('button', { name: 'Expand AI panel' }),
    ).toBeInTheDocument()
    expect(
      within(header()).getByRole('searchbox', { name: 'Search claims' }),
    ).toBeInTheDocument()
    expect(
      within(header()).getByRole('button', { name: 'Settings' }),
    ).toBeInTheDocument()
  })
})
