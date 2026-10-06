import type { ReactNode } from 'react'
import { AssistantCard } from '@/components/AssistantCard'
import { Badge } from '@/components/Badge'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/Icon'
import type { ActivityEntry, ActivityOutcome, Claim, Field } from '@/domain'
import { formatClock } from '@/lib/formatClock'
import { FIELD_STATUS_LABELS } from '@/lib/labels'
import { FIELD_STATUS_ICON, FIELD_STATUS_TONE } from './labels'
import type { Review } from './useReview'

// How an agent step ended: plain icon and word in the state's colour, not a box.
const OUTCOMES: Record<
  ActivityOutcome,
  { icon: IconName; tone: string; label: string }
> = {
  completed: {
    icon: 'resultCompleted',
    tone: 'text-ink-muted',
    label: 'Completed',
  },
  verified: { icon: 'stateVerified', tone: 'text-verified', label: 'Verified' },
  needs_review: {
    icon: 'stateNeedsReview',
    tone: 'text-needs-review',
    label: 'Needs review',
  },
  waiting: { icon: 'resultWaiting', tone: 'text-edited', label: 'Waiting' },
}

// Entries written before outcomes existed read well enough from their wording.
const outcomeOf = (entry: ActivityEntry): ActivityOutcome =>
  entry.outcome ??
  (entry.action.startsWith('Flagged') ? 'needs_review' : 'completed')

function Timeline({ claim }: { claim: Claim }) {
  const entries = claim.activity.filter((a) => a.actor === 'agent')
  return (
    <AssistantCard title="What the agent did" icon="agentActivity">
      {/* A vertical timeline: a dot per step, joined by a line. */}
      <ol className="flex flex-col">
        {entries.map((entry, index) => {
          const outcome = OUTCOMES[outcomeOf(entry)]
          const last = index === entries.length - 1
          return (
            <li key={index} className="flex gap-3 pb-4 last:pb-0">
              <span
                aria-hidden="true"
                className="relative flex w-3 justify-center"
              >
                <span className="mt-1.5 size-2 rounded-full bg-border-strong" />
                {!last && (
                  <span className="absolute top-4 -bottom-4 w-px bg-border" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <time
                  dateTime={entry.at}
                  className="text-xs text-ink-muted tabular-nums"
                >
                  {formatClock(entry.at)}
                </time>
                <span className="font-medium">{entry.action}</span>
                <span
                  className={`inline-flex items-center gap-1 text-sm ${outcome.tone}`}
                >
                  <Icon name={outcome.icon} />
                  {outcome.label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </AssistantCard>
  )
}

function AboutField({
  claim,
  field,
}: {
  claim: Claim
  field: Field | undefined
}) {
  const title = (id: string) =>
    claim.documents.find((d) => d.id === id)?.title ?? 'a document'
  let body: ReactNode

  if (!field) {
    body = (
      <p className="text-ink-muted">
        Select a field to see why it was flagged.
      </p>
    )
  } else if (field.status === 'missing') {
    body = (
      <>
        <p>The agent looked for this and found nothing. {field.reason}.</p>
        <p>
          <span className="font-medium">Next:</span>{' '}
          {field.expectedIn
            ? `Request ${field.expectedIn}, or add the value yourself if you already have it.`
            : 'Ask the employer to send it, or add the value yourself.'}
        </p>
      </>
    )
  } else if (field.status === 'needs_review') {
    body = (
      <>
        <p>The agent flagged this because: {field.reason}.</p>
        <p className="text-ink-muted">It compared:</p>
        <ul className="flex flex-col gap-2">
          {field.sources.map((source, i) => (
            <li
              key={i}
              className="rounded-sm border border-border bg-surface-muted px-3 py-2"
            >
              <span className="block text-xs font-medium text-ink-muted">
                {title(source.documentId)}
              </span>
              &ldquo;{source.excerpt}&rdquo;
            </li>
          ))}
        </ul>
        <p>
          <span className="font-medium">Next:</span> Check the source, then
          confirm the value or edit it.
        </p>
      </>
    )
  } else if (field.status === 'edited') {
    body = (
      <p>
        You changed this from {field.previousValue ?? 'empty'} to {field.value}.
        The agent&apos;s first reading is kept, so the change can be audited.
      </p>
    )
  } else {
    body = (
      <p>
        The agent read this from{' '}
        {field.sources[0] ? title(field.sources[0].documentId) : 'the claim'}{' '}
        and found nothing that disagrees with it.
        {field.resolvedBy === 'examiner' && ' You confirmed it.'}
      </p>
    )
  }

  return (
    <AssistantCard title="About this field" icon="info">
      {field && (
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {field.label}
          <Badge
            icon={FIELD_STATUS_ICON[field.status]}
            tone={FIELD_STATUS_TONE[field.status]}
            label={FIELD_STATUS_LABELS[field.status]}
          />
        </p>
      )}
      <div className="flex flex-col gap-2">{body}</div>
    </AssistantCard>
  )
}

/** The assistant's summary while a claim is open: what the agent did, and about the selected field. */
export function ReviewSummary({ review }: { review: Review }) {
  if (review.load.status !== 'ready') {
    return <p className="text-ink-muted">Reading the claim…</p>
  }
  const { claim } = review.load
  const selected = claim.fields.find((f) => f.key === review.selectedKey)

  return (
    <div className="flex flex-col gap-3">
      <Timeline claim={claim} />
      <AboutField claim={claim} field={selected} />
    </div>
  )
}
