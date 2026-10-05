import { createContext, useContext, useEffect, useState } from 'react'

export type Clock = () => Date

/** The real clock by default. Tests provide a fixed one, so ages are predictable. */
export const ClockContext = createContext<Clock>(() => new Date())

/**
 * The current time, refreshed once a minute so ages on screen stay true while
 * a page is left open. A minute is the finest unit anything shows.
 */
export function useNow(tickMs = 60_000): Date {
  const clock = useContext(ClockContext)
  const [now, setNow] = useState(clock)

  useEffect(() => {
    const id = setInterval(() => setNow(clock()), tickMs)
    return () => clearInterval(id)
  }, [clock, tickMs])

  return now
}
