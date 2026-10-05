import { useState } from 'react'
import type { ReactNode } from 'react'
import { createMockClaimsRepository } from '@/data/mock'
import { ClaimsRepositoryContext } from '@/lib/claimsRepository'

// The one place that decides the repository is the mock. Swapping in a real
// API client means changing this line, not any screen.
const MOCK_LATENCY_MS = 400

export function AppProviders({ children }: { children: ReactNode }) {
  // useState keeps one repository, and so one in-memory store, per mount.
  const [repository] = useState(() =>
    createMockClaimsRepository({ delayMs: MOCK_LATENCY_MS }),
  )
  return (
    <ClaimsRepositoryContext.Provider value={repository}>
      {children}
    </ClaimsRepositoryContext.Provider>
  )
}
