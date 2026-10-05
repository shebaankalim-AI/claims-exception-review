import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

function renderApp() {
  render(<App />)
  return userEvent.setup()
}

const nav = () => screen.getByRole('navigation', { name: 'Main' })
const collapseButton = () =>
  screen.getByRole('button', { name: 'Collapse navigation' })
const expandButton = () =>
  screen.getByRole('button', { name: 'Expand navigation' })

describe('side navigation structure', () => {
  it('groups items under Work and Insights, with the brand and user row', () => {
    renderApp()
    expect(
      within(nav()).getByRole('img', { name: 'Assay' }),
    ).toBeInTheDocument()
    expect(within(nav()).getByText('Work')).toBeInTheDocument()
    expect(within(nav()).getByText('Insights')).toBeInTheDocument()
    expect(
      within(within(nav()).getByRole('group', { name: 'Work' })).getAllByRole(
        'button',
      ),
    ).toHaveLength(3)
    expect(
      within(
        within(nav()).getByRole('group', { name: 'Insights' }),
      ).getAllByRole('button'),
    ).toHaveLength(1)
    expect(within(nav()).getByText('Casey Lindqvist')).toBeInTheDocument()
  })

  it('keeps aria-current on the active item', () => {
    renderApp()
    expect(
      within(nav()).getByRole('button', { name: /^Exceptions/ }),
    ).toHaveAttribute('aria-current', 'page')
  })
})

describe('the logo', () => {
  // Only the logo may carry the name: the avatar is also an image, so filter by name.
  const logos = () => within(nav()).getAllByRole('img', { name: 'Assay' })

  it('is exposed once, by the name Assay, when expanded', () => {
    renderApp()
    expect(logos()).toHaveLength(1)
    // The wordmark is real text, visible but not announced a second time.
    expect(within(nav()).getByText('assay')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('is exposed once, by the name Assay, when collapsed, without the wordmark', async () => {
    const user = renderApp()
    await user.click(collapseButton())
    expect(logos()).toHaveLength(1)
    expect(within(nav()).queryByText('assay')).not.toBeInTheDocument()
  })

  it('does not repeat the old placeholder name anywhere in the page', () => {
    renderApp()
    expect(screen.queryByText(/Exception Review/)).not.toBeInTheDocument()
  })
})

describe('collapsing the side navigation', () => {
  it('starts expanded, and the button toggles aria-expanded and the section labels', async () => {
    const user = renderApp()
    expect(collapseButton()).toHaveAttribute('aria-expanded', 'true')
    expect(within(nav()).getByText('Work')).toBeInTheDocument()

    await user.click(collapseButton())

    expect(expandButton()).toHaveAttribute('aria-expanded', 'false')
    expect(within(nav()).queryByText('Work')).not.toBeInTheDocument()
    expect(within(nav()).queryByText('Insights')).not.toBeInTheDocument()
    expect(within(nav()).queryByText('assay')).not.toBeInTheDocument()
    expect(within(nav()).queryByText('Later')).not.toBeInTheDocument()

    await user.click(expandButton())
    expect(collapseButton()).toHaveAttribute('aria-expanded', 'true')
    expect(within(nav()).getByText('Work')).toBeInTheDocument()
  })

  it.each([
    ['Exceptions'],
    ['All claims'],
    ['Agent activity'],
    ['Reports'],
    ['Help and shortcuts'],
  ])('still gives %s an accessible name when collapsed', async (name) => {
    const user = renderApp()
    await user.click(collapseButton())
    expect(within(nav()).getByRole('button', { name })).toBeInTheDocument()
  })

  it('keeps aria-current on the active item when collapsed', async () => {
    const user = renderApp()
    await user.click(collapseButton())
    expect(
      within(nav()).getByRole('button', { name: 'Exceptions' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('shows a tooltip when a collapsed item gets keyboard focus, and hides it on blur', async () => {
    const user = renderApp()
    await user.click(collapseButton())
    expect(
      screen.queryByRole('tooltip', { name: /All claims|Exceptions/ }),
    ).not.toBeInTheDocument()

    within(nav()).getByRole('button', { name: 'Exceptions' }).focus()
    expect(
      await screen.findByRole('tooltip', { name: 'Exceptions (Q)' }),
    ).toBeInTheDocument()

    await user.tab()
    expect(
      screen.queryByRole('tooltip', { name: 'Exceptions (Q)' }),
    ).not.toBeInTheDocument()
  })

  it('says Later in the tooltip of a disabled collapsed item, on focus and on hover', async () => {
    const user = renderApp()
    await user.click(collapseButton())
    const item = within(nav()).getByRole('button', { name: 'All claims' })

    act(() => item.focus())
    expect(
      await screen.findByRole('tooltip', { name: 'All claims (Later)' }),
    ).toBeInTheDocument()
    act(() => item.blur())
    expect(
      screen.queryByRole('tooltip', { name: /All claims|Exceptions/ }),
    ).not.toBeInTheDocument()

    await user.hover(item)
    expect(
      await screen.findByRole('tooltip', { name: 'All claims (Later)' }),
    ).toBeInTheDocument()
    await user.unhover(item)
    expect(
      screen.queryByRole('tooltip', { name: /All claims|Exceptions/ }),
    ).not.toBeInTheDocument()
  })

  it('shows the shortcut in the collapse button tooltip', async () => {
    const user = renderApp()
    await user.hover(collapseButton())
    expect(
      await screen.findByRole('tooltip', { name: 'Collapse navigation ([)' }),
    ).toBeInTheDocument()
  })

  it('does not show tooltips on items while expanded, since the labels are visible', async () => {
    const user = renderApp()
    await user.hover(within(nav()).getByRole('button', { name: /^All claims/ }))
    expect(
      screen.queryByRole('tooltip', { name: /All claims|Exceptions/ }),
    ).not.toBeInTheDocument()
  })

  it('does not activate a disabled item when collapsed', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: 'Open sample claim' }))
    await user.click(collapseButton())
    await user.click(within(nav()).getByRole('button', { name: 'Reports' }))
    expect(
      screen.getByRole('heading', { name: /Review CLM-24-0417/ }),
    ).toBeInTheDocument()
  })
})

describe('the [ shortcut', () => {
  it('toggles the navigation', async () => {
    const user = renderApp()
    await user.keyboard('[[')
    expect(expandButton()).toBeInTheDocument()
    await user.keyboard('[[')
    expect(collapseButton()).toBeInTheDocument()
  })

  it('does not toggle the navigation while typing in the search box', async () => {
    const user = renderApp()
    const search = screen.getByRole('searchbox', { name: 'Search claims' })
    await user.click(search)
    await user.keyboard('[[')

    expect(search).toHaveValue('[')
    expect(collapseButton()).toBeInTheDocument()
  })
})
