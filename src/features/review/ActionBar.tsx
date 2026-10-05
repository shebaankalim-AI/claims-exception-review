import { buttonPrimary, buttonSecondary } from '@/components/controls'
import { Badge } from '@/components/Badge'
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

const secondary = buttonSecondary
const primary = buttonPrimary

type MessageTone = 'info' | 'success' | 'error' | 'needs-review'

// A soft banner per kind of message. The icon and the words carry the meaning.
const MESSAGE_CLASS: Record<MessageTone, { banner: string; icon: string }> = {
  info: { banner: 'border-accent-border bg-accent-soft', icon: 'text-accent' },
  success: {
    banner: 'border-verified-border bg-verified-soft',
    icon: 'text-verified',
  },
  error: {
    banner: 'border-missing-border bg-missing-soft',
    icon: 'text-missing',
  },
  'needs-review': {
    banner: 'border-needs-review-border bg-needs-review-soft',
    icon: 'text-needs-review',
  },
}

function Message({
  id,
  icon,
  tone,
  role = 'status',
  children,
}: {
  id: string
  icon: IconName
  tone: MessageTone
  role?: 'status' | 'alert'
  children: ReactNode
}) {
  return (
    <p
      id={id}
      role={role}
      className={`flex min-w-0 flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm text-ink tabular-nums ${MESSAGE_CLASS[tone].banner}`}
    >
      <span className={`shrink-0 ${MESSAGE_CLASS[tone].icon}`}>
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
      <Message id={messageId} icon="error" tone="error" role="alert">
        {errorMessage}
      </Message>
    )
  }

  if (claim.state === 'needs_review') {
    const ready = unresolved === 0
    message ??= ready ? (
      <Message id={messageId} icon="info" tone="info">
        All flagged fields are resolved. Approve is now available.
      </Message>
    ) : (
      <Message id={messageId} icon="stateNeedsReview" tone="needs-review">
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
          className={primary}
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
        <Message id={messageId} icon="error" tone="error" role="alert">
          Couldn&apos;t file. The system of record didn&apos;t respond. Nothing
          was changed, and your approval is saved.
        </Message>
      )
    } else {
      message ??= (
        <Message id={messageId} icon="stateApproved" tone="info">
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
          className={primary}
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
      <Message id={messageId} icon="success" tone="success">
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
      <Message id={messageId} icon={CLAIM_STATE_ICON[claim.state]} tone="info">
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
      className="relative flex shrink-0 items-center gap-4 border-t border-border bg-surface p-4 shadow-raised"
    >
      <div className="flex shrink-0 flex-col items-start gap-1">
        <span className="font-semibold tabular-nums">{claim.id}</span>
        <Badge
          icon={CLAIM_STATE_ICON[claim.state]}
          tone={CLAIM_STATE_TONE[claim.state]}
          label={CLAIM_STATE_LABELS[claim.state]}
        />
      </div>
      {message}
      <div className="flex shrink-0 items-center gap-2">{buttons}</div>
    </section>
  )
}
