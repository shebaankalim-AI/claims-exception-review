import { useId } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/Icon'
import type { Claim, ClaimId } from '@/domain'
import { formatClock } from '@/lib/formatClock'
import { CLAIM_STATE_LABELS } from '@/lib/labels'
import {
  approvedTime,
  filedTime,
  filingReference,
  isUnresolved,
} from './claimRules'
import { CLAIM_STATE_ICON, CLAIM_STATE_TONE } from './labels'
import { StateLabel } from './StateLabel'

type ActionBarProps = {
  claim: Claim
  busy: boolean
  /** The last filing attempt didn't reach the system of record. */
  filingFailed: boolean
  /** Some other action went wrong. */
  errorMessage: string | null
  nextClaimId: ClaimId | null
  onApprove: () => void
  onFile: () => void
  onSendBack: () => void
  onEscalate: () => void
  onBack: () => void
  onOpenClaim: (id: ClaimId) => void
}

const secondary =
  'focus-ring h-control rounded-md border border-border-strong bg-surface px-3 hover:bg-surface-muted'
const primary =
  'focus-ring h-control rounded-md bg-accent px-3 text-on-accent hover:opacity-90'

function Message({
  id,
  icon,
  tone,
  role = 'status',
  children,
}: {
  id: string
  icon: IconName
  tone: string
  role?: 'status' | 'alert'
  children: ReactNode
}) {
  return (
    <p id={id} role={role} className="flex flex-1 items-center gap-2">
      <span className={tone}>
        <Icon name={icon} size="lg" />
      </span>
      {children}
    </p>
  )
}

export function ActionBar({
  claim,
  busy,
  filingFailed,
  errorMessage,
  nextClaimId,
  onApprove,
  onFile,
  onSendBack,
  onEscalate,
  onBack,
  onOpenClaim,
}: ActionBarProps) {
  const messageId = useId()
  const unresolved = claim.fields.filter(isUnresolved).length

  let message: ReactNode
  let buttons: ReactNode

  if (errorMessage) {
    message = (
      <Message id={messageId} icon="error" tone="text-missing" role="alert">
        {errorMessage}
      </Message>
    )
  }

  if (claim.state === 'needs_review') {
    const ready = unresolved === 0
    message ??= ready ? (
      <Message id={messageId} icon="info" tone="text-edited">
        All flagged fields are resolved. Approve is now available.
      </Message>
    ) : (
      <Message id={messageId} icon="stateNeedsReview" tone="text-needs-review">
        {unresolved}{' '}
        {unresolved === 1 ? 'field still needs' : 'fields still need'} you
      </Message>
    )
    buttons = (
      <>
        {/* aria-disabled, not disabled, so the button stays reachable and its reason is read out. */}
        <button
          type="button"
          aria-disabled={!ready || busy}
          aria-describedby={messageId}
          onClick={!ready || busy ? undefined : onApprove}
          className={`${primary} ${!ready || busy ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          Approve
        </button>
        <button type="button" onClick={onSendBack} className={secondary}>
          Send back
        </button>
        <button type="button" onClick={onEscalate} className={secondary}>
          Escalate
        </button>
      </>
    )
  } else if (claim.state === 'approved') {
    const time = approvedTime(claim)
    if (filingFailed) {
      message ??= (
        <Message id={messageId} icon="error" tone="text-missing" role="alert">
          Couldn&apos;t file. The system of record didn&apos;t respond. Nothing
          was changed, and your approval is saved.
        </Message>
      )
    } else {
      message ??= (
        <Message id={messageId} icon="stateApproved" tone="text-verified">
          Approved by you at {time ? formatClock(time) : '–'}. Not filed yet:
          the system of record hasn&apos;t changed.
        </Message>
      )
    }
    buttons = (
      <>
        <button
          type="button"
          aria-disabled={busy}
          onClick={busy ? undefined : onFile}
          className={`${primary} ${busy ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {filingFailed ? 'Try again' : 'File claim'}
        </button>
        <button type="button" onClick={onBack} className={secondary}>
          Back to queue
        </button>
      </>
    )
  } else if (claim.state === 'filed') {
    const time = filedTime(claim)
    message ??= (
      <Message id={messageId} icon="success" tone="text-verified">
        Filed in the system of record at {time ? formatClock(time, true) : '–'}.
        Reference {filingReference(claim)}.
      </Message>
    )
    buttons = (
      <>
        {/* With none left, "Next claim" goes to the queue, which then says it is all clear. */}
        <button
          type="button"
          onClick={() => (nextClaimId ? onOpenClaim(nextClaimId) : onBack())}
          className={primary}
        >
          {nextClaimId ? `Next claim: ${nextClaimId}` : 'Next claim'}
        </button>
        <button type="button" onClick={onBack} className={secondary}>
          Back to queue
        </button>
      </>
    )
  } else {
    message ??= (
      <Message
        id={messageId}
        icon={CLAIM_STATE_ICON[claim.state]}
        tone={CLAIM_STATE_TONE[claim.state]}
      >
        This claim is {CLAIM_STATE_LABELS[claim.state].toLowerCase()}.
      </Message>
    )
    buttons = (
      <button type="button" onClick={onBack} className={primary}>
        Back to queue
      </button>
    )
  }

  return (
    <section
      aria-label="Claim actions"
      className="flex shrink-0 items-center gap-4 border-t border-border bg-surface px-6 py-3"
    >
      <div className="flex flex-col">
        <span className="font-medium tabular-nums">{claim.id}</span>
        <StateLabel
          icon={CLAIM_STATE_ICON[claim.state]}
          tone={CLAIM_STATE_TONE[claim.state]}
          label={CLAIM_STATE_LABELS[claim.state]}
        />
      </div>
      {message}
      <div className="flex items-center gap-2">{buttons}</div>
    </section>
  )
}
