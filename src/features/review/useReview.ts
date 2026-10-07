import { useEffect, useState } from 'react'
import { ClaimsRepositoryError } from '@/domain'
import type { Claim, ClaimId, ReviewAction, Stage } from '@/domain'
import { useClaimsRepository } from '@/lib/claimsRepository'
import { defaultFieldKey, firstStageWithFlags } from './claimRules'

export type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; claim: Claim }

export type Review = {
  load: Load
  stage: Stage
  selectedKey: string | null
  busy: boolean
  /** The last filing attempt didn't reach the system of record. */
  filingFailed: boolean
  /** Some other action went wrong. */
  errorMessage: string | null
  selectStage: (stage: Stage) => void
  selectField: (key: string) => void
  /** Applies an action. Resolves true if it worked. */
  run: (action: ReviewAction) => Promise<boolean>
  retry: () => void
}

const messageFor = (error: unknown, fallback: string) =>
  error instanceof ClaimsRepositoryError ? error.message : fallback

/**
 * Loads one claim and holds everything about reviewing it. Whoever calls this
 * owns it and hands it to both the review screen and the AI panel beside it,
 * so the two always show the same claim and the same selected field.
 * Pass null while another screen is showing.
 */
export function useReview(claimId: ClaimId | null): Review {
  const repository = useClaimsRepository()
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [stage, setStage] = useState<Stage>('intake')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [filingFailed, setFilingFailed] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // A different claim starts from scratch. Adjusted during render, not in the
  // effect, so the first frame never shows the previous claim.
  const [shownId, setShownId] = useState(claimId)
  if (claimId !== shownId) {
    setShownId(claimId)
    setLoad({ status: 'loading' })
    setStage('intake')
    setSelectedKey(null)
    setBusy(false)
    setFilingFailed(false)
    setErrorMessage(null)
  }

  useEffect(() => {
    if (claimId === null) return
    let cancelled = false
    repository.getClaim(claimId).then(
      (claim) => {
        if (cancelled) return
        // Open where the work is: the first stage with a flagged field, selected.
        const first = firstStageWithFlags(claim)
        setStage(first)
        setSelectedKey(defaultFieldKey(claim, first))
        setLoad({ status: 'ready', claim })
      },
      (error: unknown) => {
        if (!cancelled) {
          setLoad({
            status: 'error',
            message: messageFor(
              error,
              'Something went wrong while loading the claim.',
            ),
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [repository, claimId, attempt])

  async function run(action: ReviewAction): Promise<boolean> {
    if (claimId === null) return false
    setBusy(true)
    setErrorMessage(null)
    try {
      const claim = await repository.applyAction(claimId, action)
      setLoad({ status: 'ready', claim })
      setFilingFailed(false)
      return true
    } catch (error) {
      if (
        action.type === 'file' &&
        error instanceof ClaimsRepositoryError &&
        error.code === 'unavailable'
      ) {
        setFilingFailed(true)
      } else {
        setErrorMessage(
          messageFor(error, 'Something went wrong. Nothing was changed.'),
        )
      }
      return false
    } finally {
      setBusy(false)
    }
  }

  return {
    load,
    stage,
    selectedKey,
    busy,
    filingFailed,
    errorMessage,
    selectStage: (next) => {
      setStage(next)
      if (load.status === 'ready') {
        setSelectedKey(defaultFieldKey(load.claim, next))
      }
    },
    selectField: setSelectedKey,
    run,
    retry: () => {
      setLoad({ status: 'loading' })
      setAttempt((n) => n + 1)
    },
  }
}
