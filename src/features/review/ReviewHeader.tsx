import { useId } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/Badge'
import {
  buttonPrimary,
  buttonSecondary,
  linkButton,
} from '@/components/controls'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/Icon'
import type { Claim, ClaimId } from '@/domain'
import { formatAge } from '@/lib/formatAge'
import { formatClock } from '@/lib/formatClock'
import { CLAIM_STATE_LABELS, LINE_LABELS } from '@/lib/labels'
import {
  approvedTime,
  filedTime,
  filingReference,
  isUnresolved,
} from './claimRules'
import { CLAIM_STATE_ICON, CLAIM_STATE_TONE } from './labels'

type ReviewHeaderProps = {
  claim: Claim
  now: Date
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

type BannerTone = 'info' | 'success' | 'error'

// The soft banner under the header. The icon and the words carry the meaning.
const BANNER: Record<BannerTone, { box: string; icon: string }> = {
  info: { box: 'border-accent-border bg-accent-soft', icon: 'text-accent' },
  success: {
    box: 'border-verified-border bg-verified-soft',
    icon: 'text-verified',
  },
  error: { box: 'border-missing-border bg-missing-soft', icon: 'text-missing' },
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: BannerTone
  icon: IconName
  children: ReactNode
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-ink tabular-nums ${BANNER[tone].box}`}
    >
      <span className={`shrink-0 ${BANNER[tone].icon}`}>
        <Icon name={icon} size="lg" />
      </span>
      {children}
    </p>
  )
}

/** Back link, title, state and the claim's actions, with a banner when there is something to say. */
export function ReviewHeader({
  claim,
  now,
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
}: ReviewHeaderProps) {
  const hintId = useId()
  const unresolved = claim.fields.filter(isUnresolved).length

  let banner: ReactNode = null
  let hint: string | null = null
  let buttons: ReactNode

  if (claim.state === 'needs_review') {
    const ready = unresolved === 0
    const blocked = !ready || busy
    if (!ready) {
      hint = `${unresolved} ${unresolved === 1 ? 'field still needs' : 'fields still need'} you`
    } else {
      banner = (
        <Banner tone="info" icon="info">
          All flagged fields are resolved. Approve is now available.
        </Banner>
      )
    }
    buttons = (
      <>
        <button type="button" onClick={onSendBack} className={buttonSecondary}>
          Send back
        </button>
        <button type="button" onClick={onEscalate} className={buttonSecondary}>
          Escalate
        </button>
        {/* aria-disabled, not disabled, so the button stays reachable and its reason is read out. */}
        <button
          type="button"
          aria-disabled={blocked}
          aria-describedby={hint ? hintId : undefined}
          onClick={blocked ? undefined : onApprove}
          className={buttonPrimary}
        >
          Approve
        </button>
      </>
    )
  } else if (claim.state === 'approved') {
    const time = approvedTime(claim)
    banner = filingFailed ? (
      <Banner tone="error" icon="error">
        Couldn&apos;t file. The system of record didn&apos;t respond. Nothing
        was changed, and your approval is saved.
      </Banner>
    ) : (
      <Banner tone="info" icon="stateApproved">
        Approved by you at {time ? formatClock(time) : '–'}. Not filed yet: the
        system of record hasn&apos;t changed.
      </Banner>
    )
    buttons = (
      <button
        type="button"
        aria-disabled={busy}
        onClick={busy ? undefined : onFile}
        className={buttonPrimary}
      >
        {filingFailed ? 'Try again' : 'File claim'}
      </button>
    )
  } else if (claim.state === 'filed') {
    const time = filedTime(claim)
    banner = (
      <Banner tone="success" icon="success">
        Filed in the system of record at {time ? formatClock(time, true) : '–'}.
        Reference {filingReference(claim)}.
      </Banner>
    )
    buttons = (
      <>
        <button type="button" onClick={onBack} className={buttonSecondary}>
          Back to queue
        </button>
        {/* With none left, "Next claim" goes to the queue, which then says it is all clear. */}
        <button
          type="button"
          onClick={() => (nextClaimId ? onOpenClaim(nextClaimId) : onBack())}
          className={buttonPrimary}
        >
          {nextClaimId ? `Next claim: ${nextClaimId}` : 'Next claim'}
        </button>
      </>
    )
  } else {
    banner = (
      <Banner tone="info" icon={CLAIM_STATE_ICON[claim.state]}>
        This claim is {CLAIM_STATE_LABELS[claim.state].toLowerCase()}.
      </Banner>
    )
    buttons = (
      <button type="button" onClick={onBack} className={buttonPrimary}>
        Back to queue
      </button>
    )
  }

  // An action error outranks the state's own message.
  if (errorMessage) {
    banner = (
      <Banner tone="error" icon="error">
        {errorMessage}
      </Banner>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className={`${linkButton} self-start text-sm`}
      >
        <span aria-hidden="true">← </span>Exceptions
      </button>

      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              id="review-heading"
              className="text-2xl font-semibold tabular-nums"
            >
              {claim.id}
            </h1>
            <Badge
              icon={CLAIM_STATE_ICON[claim.state]}
              tone={CLAIM_STATE_TONE[claim.state]}
              label={CLAIM_STATE_LABELS[claim.state]}
            />
          </div>
          <p className="text-ink-muted">
            {LINE_LABELS[claim.lineOfBusiness]}
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            Flagged{' '}
            <span className="tabular-nums">
              {formatAge(claim.flaggedAt, now)}
            </span>{' '}
            ago
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap justify-end gap-2">{buttons}</div>
          {hint && (
            <p id={hintId} className="text-sm text-ink-muted">
              {hint}
            </p>
          )}
        </div>
      </header>

      {banner}
    </div>
  )
}
