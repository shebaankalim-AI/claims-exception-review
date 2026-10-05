import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

function renderApp() {
  render(<App />)
  return userEvent.setup()
}

const queueHeading = () => screen.getByRole('heading', { name: 'Exceptions' })
const reviewHeading = () =>
  screen.getByRole('heading', { name: /Review CLM-24-0417/ })

describe('app shell landmarks', () => {
  it('has a header, navigation, main area and AI panel, plus a skip link', () => {
    renderApp()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(
      screen.getByRole('complementary', { name: 'AI panel' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Skip to main content' }),
    ).toHaveAttribute('href', '#main-content')
  })

  it('lets a keyboard user reach the skip link first', async () => {
    const user = renderApp()
    await user.tab()
    expect(
      screen.getByRole('link', { name: 'Skip to main content' }),
    ).toHaveFocus()
  })
})

describe('side navigation', () => {
  it('marks Exceptions as the current page', () => {
    renderApp()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(
      within(nav).getByRole('button', { name: /^Exceptions/ }),
    ).toHaveAttribute('aria-current', 'page')
  })
})

describe('switching screens', () => {
  it('opens the review placeholder from the queue, and the back link returns', async () => {
    const user = renderApp()
    expect(queueHeading()).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open sample claim' }))
    expect(reviewHeading()).toBeInTheDocument()

    await user.click(
      within(screen.getByRole('main')).getByRole('button', {
        name: 'Exceptions',
      }),
    )
    expect(queueHeading()).toBeInTheDocument()
  })

  it('has no breadcrumb', async () => {
    const user = renderApp()
    expect(
      screen.queryByRole('navigation', { name: 'Breadcrumb' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open sample claim' }))
    expect(
      screen.queryByRole('navigation', { name: 'Breadcrumb' }),
    ).not.toBeInTheDocument()
  })

  it('goes back to the queue with the shortcut', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Open sample claim' }))
    expect(reviewHeading()).toBeInTheDocument()

    await user.keyboard('q')
    expect(queueHeading()).toBeInTheDocument()
  })
})

describe('AI panel', () => {
  const placeholder = () => screen.getByText(/Placeholder for the AI panel/)

  it('collapses and expands from the button', async () => {
    const user = renderApp()
    expect(placeholder()).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Collapse AI panel' }))
    expect(placeholder()).not.toBeVisible()

    // The thin strip keeps the toggle.
    await user.click(screen.getByRole('button', { name: 'Expand AI panel' }))
    expect(placeholder()).toBeVisible()
  })

  it('collapses and expands from its shortcut', async () => {
    const user = renderApp()
    await user.keyboard(']')
    expect(placeholder()).not.toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Expand AI panel' }),
    ).toHaveAttribute('aria-expanded', 'false')

    await user.keyboard(']')
    expect(placeholder()).toBeVisible()
  })
})

describe('shortcuts and the search box', () => {
  it('does not fire shortcuts while typing in the search box', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Open sample claim' }))

    const search = screen.getByRole('searchbox', { name: 'Search claims' })
    await user.click(search)
    await user.keyboard('q]')

    expect(search).toHaveValue('q]')
    expect(reviewHeading()).toBeInTheDocument() // q did not go to the queue
    expect(
      screen.getByRole('button', { name: 'Collapse AI panel' }), // ] did not collapse the panel
    ).toBeInTheDocument()
  })

  it('focuses the search box with its shortcut, without typing the key into it', async () => {
    const user = renderApp()
    await user.keyboard('/')
    const search = screen.getByRole('searchbox', { name: 'Search claims' })
    expect(search).toHaveFocus()
    expect(search).toHaveValue('')
  })
})
