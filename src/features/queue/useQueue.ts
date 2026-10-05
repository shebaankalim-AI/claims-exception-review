import { useEffect, useState } from 'react'
import { ClaimsRepositoryError } from '@/domain'
import type { ClaimSummary, PipelineSummary } from '@/domain'
import { useClaimsRepository } from '@/lib/claimsRepository'

export type QueueState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; claims: ClaimSummary[]; pipeline: PipelineSummary }

export type Queue = {
  state: QueueState
  retry: () => void
}

type Outcome = Exclude<QueueState, { status: 'loading' }>

/**
 * Loads the queue and the pipeline counts once per visit to the queue.
 * Whoever calls this owns the data and passes it down, so the screen and the
 * agent digest read the same list and can never disagree.
 *
 * `active` is false while another screen is showing. Turning it on again
 * starts a fresh load, so a claim approved in between is gone from the list.
 */
export function useQueue(active: boolean): Queue {
  const repository = useClaimsRepository()
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [attempt, setAttempt] = useState(0)

  // Going back to loading when the queue is shown again is adjusted during
  // render, not in the effect, so the first frame never shows stale rows.
  const [wasActive, setWasActive] = useState(active)
  if (active !== wasActive) {
    setWasActive(active)
    if (active) setOutcome(null)
  }

  useEffect(() => {
    if (!active) return
    let cancelled = false

    Promise.all([
      repository.listExceptions({ state: 'needs_review' }),
      repository.getPipelineSummary(),
    ]).then(
      ([claims, pipeline]) => {
        if (!cancelled) setOutcome({ status: 'ready', claims, pipeline })
      },
      (error: unknown) => {
        if (cancelled) return
        setOutcome({
          status: 'error',
          message:
            error instanceof ClaimsRepositoryError
              ? error.message
              : 'Something went wrong while loading the queue.',
        })
      },
    )

    // A late answer for a view that has gone must not land on the next one.
    return () => {
      cancelled = true
    }
  }, [active, repository, attempt])

  return {
    state: outcome ?? { status: 'loading' },
    retry: () => {
      setOutcome(null)
      setAttempt((n) => n + 1)
    },
  }
}
