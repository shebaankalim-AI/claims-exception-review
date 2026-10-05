import { render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { ClaimsRepository } from '@/domain'
import {
  ClaimsRepositoryContext,
  useClaimsRepository,
} from './claimsRepository'

const fakeRepository: ClaimsRepository = {
  listExceptions: () => Promise.resolve([]),
  getPipelineSummary: () =>
    Promise.resolve({
      receivedToday: 0,
      agentWorking: 0,
      filedAutomatically: 0,
    }),
  getClaim: () => Promise.reject(new Error('unused')),
  applyAction: () => Promise.reject(new Error('unused')),
}

describe('useClaimsRepository', () => {
  it('returns the repository from the provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ClaimsRepositoryContext.Provider value={fakeRepository}>
        {children}
      </ClaimsRepositoryContext.Provider>
    )
    const { result } = renderHook(() => useClaimsRepository(), { wrapper })
    expect(result.current).toBe(fakeRepository)
  })

  it('fails loudly when there is no provider', () => {
    function Probe() {
      useClaimsRepository()
      return <p>rendered</p>
    }
    // React logs the thrown error; keep the test output readable.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => render(<Probe />)).toThrow(/useClaimsRepository/)
      expect(screen.queryByText('rendered')).not.toBeInTheDocument()
    } finally {
      spy.mockRestore()
    }
  })
})
