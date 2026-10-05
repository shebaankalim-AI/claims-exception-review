import { render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { useClaimsRepository } from '@/lib/claimsRepository'
import { AppProviders } from './AppProviders'

function ClaimCount() {
  const repository = useClaimsRepository()
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    void repository.listExceptions().then((claims) => setCount(claims.length))
  }, [repository])
  return <p>{count === null ? 'loading' : `${count} claims`}</p>
}

describe('AppProviders', () => {
  it('provides the mock repository to descendants through the hook', async () => {
    render(
      <AppProviders>
        <ClaimCount />
      </AppProviders>,
    )
    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(await screen.findByText('12 claims')).toBeInTheDocument()
  })
})
