import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/Badge'
import type { BadgeTone } from '@/components/Badge'
import { buttonSecondary, input, sectionTitle } from '@/components/controls'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/Icon'
import type { ActivityEntry, ActivityOutcome, Claim, Field } from '@/domain'
import { formatClock } from '@/lib/formatClock'
import { FIELD_STATUS_LABELS } from '@/lib/labels'
import { cannedReply } from './cannedReplies'
import { FIELD_STATUS_ICON, FIELD_STATUS_TONE } from './labels'
import type { Review } from './useReview'

const OUTCOMES: Record<
  ActivityOutcome,
  { icon: IconName; tone: BadgeTone; label: string }
> = {
  completed: { icon: 'resultCompleted', tone: 'neutral', label: 'Completed' },
  verified: { icon: 'stateVerified', tone: 'verified', label: 'Verified' },
  needs_review: {
    icon: 'stateNeedsReview',
    tone: 'needs-review',
    label: 'Needs review',
  },
  waiting: { icon: 'resultWaiting', tone: 'edited', label: 'Waiting' },
}

// Entries written before outcomes existed read well enough from their wording.
const outcomeOf = (entry: ActivityEntry): ActivityOutcome =>
  entry.outcome ??
  (entry.action.startsWith('Flagged') ? 'needs_review' : 'completed')

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className={sectionTitle}>{title}</h3>
      {children}
    </section>
  )
}

function Feed({ claim }: { claim: Claim }) {
  const entries = claim.activity.filter((a) => a.actor === 'agent')
  return (
    <Section title="What the agent did">
      {/* A small timeline: a dot per step, joined by a line. */}
      <ol className="flex flex-col">
        {entries.map((entry, index) => {
          const outcome = OUTCOMES[outcomeOf(entry)]
          const last = index === entries.length - 1
          return (
            <li key={index} className="relative flex gap-3 pb-4 last:pb-0">
              <span
                aria-hidden="true"
                className="relative flex w-3 justify-center"
              >
                <span className="mt-1.5 size-2 rounded-full bg-border-strong" />
                {!last && (
                  <span className="absolute top-4 bottom-0 w-px bg-border" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-baseline gap-2">
                  <time
                    dateTime={entry.at}
                    className="text-xs text-ink-muted tabular-nums"
                  >
                    {formatClock(entry.at)}
                  </time>
                  <span className="text-sm">{entry.action}</span>
                </span>
                <span>
                  <Badge
                    icon={outcome.icon}
                    tone={outcome.tone}
                    label={outcome.label}
                  />
                </span>
              </div>
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
        <p className="text-ink-muted">It compared:</p>
        <ul className="flex flex-col gap-2">
          {field.sources.map((source, i) => (
            <li
              key={i}
              className="rounded-sm border border-border bg-surface-muted px-3 py-2 text-sm"
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
    <Section title="About this field">
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
      <div className="flex flex-col gap-2 text-sm leading-relaxed">{body}</div>
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
      <ul aria-live="polite" className="flex flex-col gap-3">
        {thread.map((turn, i) => (
          <li key={i} className="flex flex-col gap-1 text-sm">
            <span className="self-end rounded-md bg-accent-soft px-3 py-2 text-ink">
              {turn.question}
            </span>
            <span className="rounded-md border border-border bg-surface-muted px-3 py-2">
              {turn.answer}
            </span>
          </li>
        ))}
      </ul>
      <form
        className="flex items-end gap-2"
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
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-ink-muted">
          Your question
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="For example: why was this flagged?"
            className={`${input} text-base font-normal`}
          />
        </label>
        <button
          type="submit"
          disabled={question.trim() === ''}
          className={buttonSecondary}
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
    <div className="flex min-h-full flex-col gap-6">
      <Feed claim={claim} />
      <div className="border-t border-border pt-5">
        <AboutField claim={claim} field={selected} />
      </div>
      {/* Pushed to the bottom of the panel. */}
      <div className="mt-auto border-t border-border pt-5">
        <Ask claim={claim} />
      </div>
    </div>
  )
}
