import { useState } from 'react'
import type { ClaimId } from '@/domain'
import { ActionBar } from './ActionBar'
import { fieldsInStage } from './claimRules'
import { ClaimHeader } from './ClaimHeader'
import { FieldList } from './FieldList'
import { EscalateDialog, SendBackDialog } from './HandoffDialogs'
import { SourceViewer } from './SourceViewer'
import { StageTabs } from './StageTabs'
import type { Review } from './useReview'
import { useNow } from '@/lib/clock'

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
  const { load } = review

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
              onClick={review.retry}
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
  const fields = fieldsInStage(claim, review.stage)
  const selected = claim.fields.find((f) => f.key === review.selectedKey)

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
          active={review.stage}
          onSelect={review.selectStage}
        />
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <FieldList
              claim={claim}
              fields={fields}
              selectedKey={review.selectedKey}
              canAct={claim.state === 'needs_review' && !review.busy}
              examinerName={examinerName}
              onSelect={review.selectField}
              onConfirm={(fieldKey) =>
                void review.run({ type: 'confirmField', fieldKey })
              }
              onSave={(fieldKey, value) =>
                void review.run({ type: 'editField', fieldKey, value })
              }
            />
          </div>
          <div className="col-span-2">
            {/* Sticks to the top of the scrolling area while the field list moves. */}
            <div className="sticky top-0">
              <SourceViewer claim={claim} field={selected} />
            </div>
          </div>
        </div>
      </section>
      <ActionBar
        claim={claim}
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
    </div>
  )
}
