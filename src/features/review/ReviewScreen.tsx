import { useEffect, useState } from 'react'
import { ClaimsRepositoryError } from '@/domain'
import type { Claim, ClaimId, ReviewAction, Stage } from '@/domain'
import { useClaimsRepository } from '@/lib/claimsRepository'
import { useNow } from '@/lib/clock'
import { ActionBar } from './ActionBar'
import {
  defaultFieldKey,
  fieldsInStage,
  firstStageWithFlags,
} from './claimRules'
import { ClaimHeader } from './ClaimHeader'
import { FieldList } from './FieldList'
import { SourceViewer } from './SourceViewer'
import { StageTabs } from './StageTabs'

type ReviewScreenProps = {
  claimId: ClaimId
  /** Who is signed in. The app knows, and features can't import app/. */
  examinerName: string
  /** The next claim waiting in the queue, if any. */
  nextClaimId: ClaimId | null
  /** Goes back to the queue. The app owns which screen is showing. */
  onBack: () => void
  onOpenClaim: (id: ClaimId) => void
  onFiled: (id: ClaimId) => void
}

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; claim: Claim }

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="focus-ring self-start rounded-sm text-accent hover:underline"
    >
      <span aria-hidden="true">← </span>Exceptions
    </button>
  )
}

const messageFor = (error: unknown, fallback: string) =>
  error instanceof ClaimsRepositoryError ? error.message : fallback

export function ReviewScreen({
  claimId,
  examinerName,
  nextClaimId,
  onBack,
  onOpenClaim,
  onFiled,
}: ReviewScreenProps) {
  const repository = useClaimsRepository()
  const now = useNow()
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [stage, setStage] = useState<Stage>('intake')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [filingFailed, setFilingFailed] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
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

  async function run(action: ReviewAction) {
    setBusy(true)
    setErrorMessage(null)
    try {
      const claim = await repository.applyAction(claimId, action)
      setLoad({ status: 'ready', claim })
      setFilingFailed(false)
      if (action.type === 'file') onFiled(claimId)
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
    } finally {
      setBusy(false)
    }
  }

  function selectStage(next: Stage, claim: Claim) {
    setStage(next)
    setSelectedKey(defaultFieldKey(claim, next))
  }

  if (load.status !== 'ready') {
    return (
      <section
        aria-labelledby="review-heading"
        className="flex flex-col gap-4 p-6"
      >
        <BackLink onBack={onBack} />
        <h1 id="review-heading" className="text-xl font-semibold tabular-nums">
          {claimId}
        </h1>
        {load.status === 'loading' ? (
          <p role="status" className="text-slate-600">
            Loading the claim…
          </p>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <p role="alert">Couldn&apos;t load this claim. {load.message}</p>
            <button
              type="button"
              onClick={() => {
                setLoad({ status: 'loading' })
                setAttempt((n) => n + 1)
              }}
              className="focus-ring h-row rounded-md border border-slate-300 bg-surface px-3 hover:bg-slate-100"
            >
              Retry
            </button>
          </div>
        )}
      </section>
    )
  }

  const { claim } = load
  const fields = fieldsInStage(claim, stage)
  const selected = claim.fields.find((f) => f.key === selectedKey)

  return (
    // Fills the main area: the work scrolls and the action bar stays at the bottom.
    <div className="flex h-full flex-col">
      <section
        aria-labelledby="review-heading"
        className="flex flex-1 flex-col gap-4 overflow-auto p-6"
      >
        <BackLink onBack={onBack} />
        <ClaimHeader claim={claim} now={now} />
        <StageTabs
          claim={claim}
          active={stage}
          onSelect={(next) => selectStage(next, claim)}
        />
        <div className="grid grid-cols-5 items-start gap-4">
          <div className="col-span-3">
            <FieldList
              claim={claim}
              fields={fields}
              selectedKey={selectedKey}
              canAct={claim.state === 'needs_review' && !busy}
              examinerName={examinerName}
              onSelect={setSelectedKey}
              onConfirm={(fieldKey) => run({ type: 'confirmField', fieldKey })}
              onSave={(fieldKey, value) =>
                run({ type: 'editField', fieldKey, value })
              }
            />
          </div>
          <div className="col-span-2">
            <SourceViewer claim={claim} field={selected} />
          </div>
        </div>
      </section>
      <ActionBar
        claim={claim}
        busy={busy}
        filingFailed={filingFailed}
        errorMessage={errorMessage}
        nextClaimId={nextClaimId}
        onApprove={() => run({ type: 'approve' })}
        onFile={() => run({ type: 'file' })}
        onBack={onBack}
        onOpenClaim={onOpenClaim}
      />
    </div>
  )
}
