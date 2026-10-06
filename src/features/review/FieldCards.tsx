import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { buttonPrimary, buttonSecondary, input } from '@/components/controls'
import { Icon } from '@/components/Icon'
import type { Claim, Field } from '@/domain'
import { FIELD_STATUS_LABELS } from '@/lib/labels'
import { FIELD_STATUS_ICON, FIELD_STATUS_TONE } from './labels'

type FieldCardsProps = {
  claim: Claim
  fields: Field[]
  selectedKey: string | null
  /** False once the claim is approved, or while an action is running. */
  canAct: boolean
  examinerName: string
  /** Fields whose document was requested in this visit. */
  requested: ReadonlySet<string>
  onSelect: (key: string) => void
  onConfirm: (key: string) => void
  onSave: (key: string, value: string) => void
  onRequest: (key: string) => void
}

function sourceTitle(claim: Claim, field: Field): string | null {
  const documentId = field.sources[0]?.documentId
  return claim.documents.find((d) => d.id === documentId)?.title ?? null
}

/** Source name, who settled the value, and for an edit the value it replaced. */
function Provenance({
  claim,
  field,
  examinerName,
}: {
  claim: Claim
  field: Field
  examinerName: string
}) {
  const source = sourceTitle(claim, field)
  const who =
    field.status === 'edited'
      ? `by ${examinerName}`
      : field.status === 'verified'
        ? field.resolvedBy === 'agent'
          ? 'by agent'
          : 'by you'
        : null
  const parts = [source, who].filter(Boolean)
  if (parts.length === 0 && field.status !== 'edited') return null
  return (
    <p className="text-sm text-ink-muted">
      {field.status === 'edited' && (
        <>
          <s className="text-ink-subtle">{field.previousValue ?? 'empty'}</s>
          {parts.length > 0 && (
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
          )}
        </>
      )}
      {parts.join(' · ')}
    </p>
  )
}

export function FieldCards({
  claim,
  fields,
  selectedKey,
  canAct,
  examinerName,
  requested,
  onSelect,
  onConfirm,
  onSave,
  onRequest,
}: FieldCardsProps) {
  // Which field is being typed into, and what has been typed so far.
  const [editing, setEditing] = useState<{ key: string; draft: string } | null>(
    null,
  )

  return (
    <ul className="flex flex-col gap-2">
      {fields.map((field) => {
        const selected = field.key === selectedKey
        const isEditing = editing?.key === field.key
        return (
          <li
            key={field.key}
            // The whole card selects for the mouse; the button below is the
            // keyboard path, so there is one tab stop per card.
            onClick={() => onSelect(field.key)}
            className={`relative cursor-pointer rounded-lg border bg-surface p-4 shadow-card ${
              selected
                ? 'border-border-strong'
                : 'border-border hover:border-border-strong'
            }`}
          >
            {selected && (
              <span
                aria-hidden="true"
                className="absolute inset-y-3 left-0 w-0.75 rounded-r-sm bg-accent"
              />
            )}
            <button
              type="button"
              aria-pressed={selected}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(field.key)
              }}
              className="focus-ring flex w-full flex-col gap-1 rounded-sm text-left"
            >
              <span className="flex w-full items-start justify-between gap-3">
                <span className="text-sm font-medium text-ink-muted">
                  {field.label}
                </span>
                <Badge
                  icon={FIELD_STATUS_ICON[field.status]}
                  tone={FIELD_STATUS_TONE[field.status]}
                  label={FIELD_STATUS_LABELS[field.status]}
                />
              </span>
              <span className="text-lg font-medium break-words text-ink">
                {field.status === 'missing' ? (
                  <span className="text-ink-subtle">No value yet</span>
                ) : (
                  field.value
                )}
              </span>
              {field.status === 'needs_review' && field.reason && (
                <span className="text-sm text-ink">{field.reason}</span>
              )}
              {field.status === 'missing' && (
                <span className="text-sm text-ink">
                  {field.expectedIn
                    ? `Missing. This would normally be in ${field.expectedIn}.`
                    : (field.reason ?? 'Missing.')}
                </span>
              )}
              <Provenance
                claim={claim}
                field={field}
                examinerName={examinerName}
              />
            </button>

            {selected && canAct && (
              // Clicks here act, they don't reselect.
              <div
                className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {isEditing ? (
                  <form
                    className="flex w-full flex-wrap items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (editing.draft.trim() === '') return
                      onSave(field.key, editing.draft)
                      setEditing(null)
                    }}
                  >
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-ink-muted">
                      New value for {field.label}
                      <input
                        type="text"
                        autoFocus
                        value={editing.draft}
                        onChange={(e) =>
                          setEditing({ key: field.key, draft: e.target.value })
                        }
                        className={`${input} text-base font-normal`}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className={buttonSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editing.draft.trim() === ''}
                      className={buttonPrimary}
                    >
                      Save
                    </button>
                  </form>
                ) : field.status === 'needs_review' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onConfirm(field.key)}
                      className={buttonPrimary}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({ key: field.key, draft: field.value ?? '' })
                      }
                      className={buttonSecondary}
                    >
                      Edit
                    </button>
                  </>
                ) : field.status === 'missing' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing({ key: field.key, draft: '' })}
                      className={buttonPrimary}
                    >
                      Add value
                    </button>
                    {requested.has(field.key) ? (
                      <span className="flex items-center gap-1 text-sm text-ink-muted">
                        <Icon name="info" />
                        Document requested. Nothing is sent in this prototype.
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRequest(field.key)}
                        className={buttonSecondary}
                      >
                        Request document
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
