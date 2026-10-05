import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ClockContext, useNow } from './clock'

describe('useNow', () => {
  it('returns the injected clock time', () => {
    const fixed = new Date('2025-02-27T15:00:00.000Z')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ClockContext.Provider value={() => fixed}>
        {children}
      </ClockContext.Provider>
    )
    const { result } = renderHook(() => useNow(), { wrapper })
    expect(result.current).toBe(fixed)
  })

  it('refreshes on the tick, and stops when unmounted', () => {
    vi.useFakeTimers()
    try {
      let current = new Date('2025-02-27T15:00:00.000Z')
      const clock = () => current
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>
      )
      const { result, unmount } = renderHook(() => useNow(1000), { wrapper })
      expect(result.current.toISOString()).toBe('2025-02-27T15:00:00.000Z')

      current = new Date('2025-02-27T15:01:00.000Z')
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.toISOString()).toBe('2025-02-27T15:01:00.000Z')

      unmount()
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
