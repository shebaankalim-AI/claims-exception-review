import { useState } from 'react'
import { buttonSecondary, linkButton } from '@/components/controls'
import type { ClaimId } from '@/domain'
import { useNow } from '@/lib/clock'
import { fieldsInStage } from './claimRules'
import { FieldCards } from './FieldCards'
import { EscalateDialog, SendBackDialog } from './HandoffDialogs'
import { ReviewHeader } from './ReviewHeader'
import { SourcePanel } from './SourcePanel'
import { StageTabs } from './StageTabs'
import type { Review } from './useReview'

type ReviewScreenProps = {
  claimId: ClaimId
  review: Review
  /** Who is signed in. The app knows, and features can't import app/. */
  examinerName: string
  /** The next claim waiting in the queue, if any. */
  nextClaimId: ClaimId | null
  /** Goes back to the queue. The app owns which screen is showing. */
  onBack: () => void
  onOpenClaim: (id: ClaimId) => void
  onFiled: (id: ClaimId) => void
  /** The claim was sent back or escalated. The message is for the queue to show. */
  onHandedOff: (id: ClaimId, message: string) => void
}

export function ReviewScreen({
  claimId,
  review,
  examinerName,
  nextClaimId,
  onBack,
  onOpenClaim,
  onFiled,
  onHandedOff,
}: ReviewScreenProps) {
  const now = useNow()
  const [dialog, setDialog] = useState<'sendBack' | 'escalate' | null>(null)
  // Documents requested in this visit. Nothing is sent in the prototype.
  const [requested, setRequested] = useState<ReadonlySet<string>>(new Set())
  const { load } = review

  if (load.status !== 'ready') {
    return (
      <section
        aria-labelledby="review-heading"
        className="flex flex-col gap-4 p-8"
      >
        <button
          type="button"
          onClick={onBack}
          className={`${linkButton} self-start text-sm`}
        >
          <span aria-hidden="true">← </span>Exceptions
        </button>
        <h1 id="review-heading" className="text-2xl font-semibold tabular-nums">
          {claimId}
        </h1>
        {load.status === 'loading' ? (
          <p role="status" className="text-ink-muted">
            Loading the claim…
          </p>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <p role="alert">Couldn&apos;t load this claim. {load.message}</p>
            <button
              type="button"
              onClick={review.retry}
              className={buttonSecondary}
            >
              Retry
            </button>
          </div>
        )}
      </section>
    )
  }

  const { claim } = load
  const fields = fieldsInStage(claim, review.stage)
  const selected = claim.fields.find((f) => f.key === review.selectedKey)
  const canAct = claim.state === 'needs_review' && !review.busy
  const request = (key: string) => setRequested(new Set(requested).add(key))

  async function file() {
    if (await review.run({ type: 'file' })) onFiled(claimId)
  }

  // Sending back and escalating both end the visit: the claim leaves the open
  // queue, so go back to it with a line saying what happened.
  async function handOff(
    action:
      { type: 'sendBack'; note: string } | { type: 'escalate'; note: string },
    message: string,
  ) {
    setDialog(null)
    if (await review.run(action)) onHandedOff(claimId, message)
  }

  return (
    // @container: the layout follows the width this area actually has, which
    // changes with the AI panel and the nav, not with the window.
    <section
      aria-labelledby="review-heading"
      className="@container flex min-w-0 flex-col gap-5 p-8"
    >
      <ReviewHeader
        claim={claim}
        now={now}
        busy={review.busy}
        filingFailed={review.filingFailed}
        errorMessage={review.errorMessage}
        nextClaimId={nextClaimId}
        onApprove={() => void review.run({ type: 'approve' })}
        onFile={() => void file()}
        onSendBack={() => setDialog('sendBack')}
        onEscalate={() => setDialog('escalate')}
        onBack={onBack}
        onOpenClaim={onOpenClaim}
      />
      <StageTabs
        claim={claim}
        active={review.stage}
        onSelect={review.selectStage}
      />
      {/* One column when narrow; fields and source side by side when wide. */}
      <div className="grid grid-cols-1 items-start gap-4 @review-wide:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        <FieldCards
          claim={claim}
          fields={fields}
          selectedKey={review.selectedKey}
          canAct={canAct}
          examinerName={examinerName}
          requested={requested}
          onSelect={review.selectField}
          onConfirm={(fieldKey) =>
            void review.run({ type: 'confirmField', fieldKey })
          }
          onSave={(fieldKey, value) =>
            void review.run({ type: 'editField', fieldKey, value })
          }
          onRequest={request}
        />
        {/* Sticky beside the fields, so the source stays in view while they scroll. */}
        <div className="min-w-0 @review-wide:sticky @review-wide:top-0">
          <SourcePanel
            key={selected?.key ?? 'none'}
            claim={claim}
            field={selected}
            canAct={canAct}
            requested={requested}
            onRequest={request}
          />
        </div>
      </div>
      <SendBackDialog
        open={dialog === 'sendBack'}
        claimId={claimId}
        onCancel={() => setDialog(null)}
        onConfirm={(note) =>
          void handOff(
            { type: 'sendBack', note },
            `${claimId} sent back to the agent`,
          )
        }
      />
      <EscalateDialog
        open={dialog === 'escalate'}
        claimId={claimId}
        onCancel={() => setDialog(null)}
        onConfirm={(person, note) =>
          void handOff(
            { type: 'escalate', note: `${person}: ${note}` },
            `${claimId} escalated to ${person.split(': ')[1] ?? person}`,
          )
        }
      />
    </section>
  )
}
