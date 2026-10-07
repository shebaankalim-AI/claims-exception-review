import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'
import { LogoMark } from './LogoMark'

describe('Logo', () => {
  it('is one image named Assay, with the wordmark as text', () => {
    render(<Logo />)
    expect(screen.getAllByRole('img', { name: 'Assay' })).toHaveLength(1)
    expect(screen.getByText('assay')).toBeInTheDocument()
  })
})

describe('LogoMark', () => {
  it('is hidden from assistive technology unless it is given a label', () => {
    const { container } = render(<LogoMark />)
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('is exposed by its label when it stands alone', () => {
    render(<LogoMark label="Assay" />)
    expect(screen.getByRole('img', { name: 'Assay' })).toBeInTheDocument()
  })

  it('takes its size from a token class and has no fixed width or height', () => {
    const { container } = render(<LogoMark size="lg" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('size-logo-lg')
    expect(svg).not.toHaveAttribute('width')
    expect(svg).not.toHaveAttribute('height')
  })
})
