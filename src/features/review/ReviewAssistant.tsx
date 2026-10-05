import { useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/Icon'
import type { ActivityEntry, ActivityOutcome, Claim, Field } from '@/domain'
import { formatClock } from '@/lib/formatClock'
import { FIELD_STATUS_LABELS } from '@/lib/labels'
import { cannedReply } from './cannedReplies'
import { FIELD_STATUS_ICON, FIELD_STATUS_TONE } from './labels'
import { StateLabel } from './StateLabel'
import type { Review } from './useReview'

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-ink-muted uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Feed({ claim }: { claim: Claim }) {
  const entries = claim.activity.filter((a) => a.actor === 'agent')
  return (
    <Section title="What the agent did">
      <ol className="flex flex-col gap-2">
        {entries.map((entry, index) => {
          const outcome = OUTCOMES[outcomeOf(entry)]
          return (
            <li key={index} className="flex flex-col">
              <span className="flex items-baseline gap-2">
                <time
                  dateTime={entry.at}
                  className="text-xs text-ink-muted tabular-nums"
                >
                  {formatClock(entry.at)}
                </time>
                <span>{entry.action}</span>
              </span>
              <span className="text-xs">
                <StateLabel
                  icon={outcome.icon}
                  tone={outcome.tone}
                  label={outcome.label}
                />
              </span>
            </li>
          )
        })}
      </ol>
    </Section>
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
        Select a field to see what the agent made of it.
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
        <p>It compared:</p>
        <ul className="flex flex-col gap-1">
          {field.sources.map((source, i) => (
            <li key={i}>
              <span className="font-medium">{title(source.documentId)}:</span>{' '}
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
    <Section title="About this field">
      {field && (
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {field.label}
          <StateLabel
            icon={FIELD_STATUS_ICON[field.status]}
            tone={FIELD_STATUS_TONE[field.status]}
            label={FIELD_STATUS_LABELS[field.status]}
          />
        </p>
      )}
      <div className="flex flex-col gap-2">{body}</div>
    </Section>
  )
}

function Ask({ claim }: { claim: Claim }) {
  const [question, setQuestion] = useState('')
  const [thread, setThread] = useState<{ question: string; answer: string }[]>(
    [],
  )

  return (
    <Section title="Ask about this claim">
      <p className="flex items-center gap-1 text-xs text-ink-muted">
        <Icon name="info" />
        Demo replies, not a live AI
      </p>
      <ul aria-live="polite" className="flex flex-col gap-2">
        {thread.map((turn, i) => (
          <li key={i} className="flex flex-col gap-1">
            <span className="font-medium">You: {turn.question}</span>
            <span>{turn.answer}</span>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const asked = question.trim()
          if (asked === '') return
          setThread([
            ...thread,
            { question: asked, answer: cannedReply(asked, claim) },
          ])
          setQuestion('')
        }}
      >
        <label className="flex flex-col gap-1 text-ink-muted">
          Your question
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="For example: why was this flagged?"
            className="focus-ring h-control rounded-md border border-border-strong bg-surface px-2 text-ink placeholder:text-ink-subtle"
          />
        </label>
        <button
          type="submit"
          disabled={question.trim() === ''}
          className="focus-ring h-control self-start rounded-md border border-border-strong bg-surface px-3 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </Section>
  )
}

/** The AI panel while a claim is open: what the agent did, about the selected field, and a demo Q and A. */
export function ReviewAssistant({ review }: { review: Review }) {
  if (review.load.status !== 'ready') {
    return <p className="text-ink-muted">Reading the claim…</p>
  }
  const { claim } = review.load
  const selected = claim.fields.find((f) => f.key === review.selectedKey)

  return (
    <div className="flex min-h-full flex-col gap-4">
      <Feed claim={claim} />
      <AboutField claim={claim} field={selected} />
      {/* Pushed to the bottom of the panel. */}
      <div className="mt-auto border-t border-border pt-3">
        <Ask claim={claim} />
      </div>
    </div>
  )
}
