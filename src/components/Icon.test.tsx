import { render, screen } from '@testing-library/react'
import { Icon } from './Icon'

describe('Icon', () => {
  it('is hidden from assistive technology by default', () => {
    const { container } = render(<Icon name="exceptions" />)
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('is exposed with a name when given a label', () => {
    render(<Icon name="info" label="Info" />)
    expect(screen.getByRole('img', { name: 'Info' })).toBeInTheDocument()
  })

  it('takes its size from a token class', () => {
    const { container } = render(<Icon name="menu" size="lg" />)
    expect(container.querySelector('svg')).toHaveClass('size-icon-lg')
  })
})
