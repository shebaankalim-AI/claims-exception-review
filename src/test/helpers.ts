import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

// The oldest claim in the mock data, so it is the first row of the queue.
export const OLDEST_CLAIM_ID = 'CLM-24-0388'

// The mock repository has a delay, so the rows arrive a moment after the first
// render. Scoped to the main area, because the agent digest links the same claim.
export async function openOldestClaim(user: UserEvent) {
  await user.click(
    await within(screen.getByRole('main')).findByRole(
      'button',
      { name: OLDEST_CLAIM_ID },
      { timeout: 3000 },
    ),
  )
}
