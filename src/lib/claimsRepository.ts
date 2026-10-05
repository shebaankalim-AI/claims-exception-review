import { createContext, useContext } from 'react'
import type { ClaimsRepository } from '@/domain'

export const ClaimsRepositoryContext = createContext<ClaimsRepository | null>(
  null,
)

/**
 * The only way a feature reaches claim data. Features never import `data/`, so
 * which repository they get (mock or real) is decided once, in `app/`.
 */
export function useClaimsRepository(): ClaimsRepository {
  const repository = useContext(ClaimsRepositoryContext)
  if (!repository) {
    throw new Error(
      'useClaimsRepository must be used inside a ClaimsRepositoryContext provider.',
    )
  }
  return repository
}
