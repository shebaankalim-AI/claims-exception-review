import { Badge } from '@/components/Badge'
import { useState } from 'react'
import {
  buttonPrimary,
  buttonSecondary,
  card,
  input,
} from '@/components/controls'
import { Icon } from '@/components/Icon'
import type { Claim, Field } from '@/domain'
import { FIELD_STATUS_LABELS } from '@/lib/labels'
import { FIELD_STATUS_ICON, FIELD_STATUS_TONE } from './labels'

type FieldListProps = {
  claim: Claim
  fields: Field[]
  selectedKey: string | null
  /** False once the claim is approved, or while an action is running. */
  canAct: boolean
  examinerName: string
  onSelect: (key: string) => void
  onConfirm: (key: string) => void
  onSave: (key: string, value: string) => void
}

const buttonClass = buttonSecondary
const primaryButtonClass = buttonPrimary

function sourceTitle(claim: Claim, field: Field): string {
  const documentId = field.sources[0]?.documentId
  return claim.documents.find((d) => d.id === documentId)?.title ?? 'No source'
}

function Value({ field }: { field: Field }) {
  if (field.status === 'missing')
    return <span className="text-ink-muted">–</span>
  if (field.status === 'edited') {
    return (
      <span>
        <s className="mr-2 text-ink-subtle">{field.previousValue ?? 'empty'}</s>
        {field.value}
      </span>
    )
  }
  return <span>{field.value}</span>
}

function Provenance({
  field,
  examinerName,
}: {
  field: Field
  examinerName: string
}) {
  if (field.status === 'verified') {
    return (
      <span className="text-xs text-ink-muted">
        by {field.resolvedBy === 'agent' ? 'agent' : 'you'}
      </span>
    )
  }
  if (field.status === 'edited') {
    return <span className="text-xs text-ink-muted">by {examinerName}</span>
  }
  return null
}

export function FieldList({
  claim,
  fields,
  selectedKey,
  canAct,
  examinerName,
  onSelect,
  onConfirm,
  onSave,
}: FieldListProps) {
  // Which field is being typed into, and what has been typed so far.
  const [editing, setEditing] = useState<{ key: string; draft: string } | null>(
    null,
  )
  const [requested, setRequested] = useState<ReadonlySet<string>>(new Set())

  return (
    <ul
      className={`${card} flex flex-col divide-y divide-border overflow-hidden`}
    >
      {fields.map((field) => {
        const selected = field.key === selectedKey
        const isEditing = editing?.key === field.key
        return (
          <li
            key={field.key}
            className={`border-l-3 ${
              selected ? 'border-accent bg-accent-soft' : 'border-transparent'
            }`}
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(field.key)}
              className="focus-ring grid w-full grid-cols-[var(--spacing-col-label)_minmax(0,1fr)_var(--spacing-col-state)_var(--spacing-col-source)] min-h-13 items-center gap-x-4 gap-y-1 px-4 py-2 text-left"
            >
              <span className="text-sm font-medium break-words text-ink-muted">
                {field.label}
              </span>
              <Value field={field} />
              <span className="flex flex-col items-start gap-0.5 whitespace-nowrap">
                <Badge
                  icon={FIELD_STATUS_ICON[field.status]}
                  tone={FIELD_STATUS_TONE[field.status]}
                  label={FIELD_STATUS_LABELS[field.status]}
                />
                <Provenance field={field} examinerName={examinerName} />
              </span>
              <span className="block min-w-0 truncate text-sm text-ink-muted">
                {field.status === 'missing'
                  ? 'Not received'
                  : sourceTitle(claim, field)}
              </span>
              {(field.status === 'needs_review' ||
                field.status === 'missing') &&
                field.reason && (
                  <span className="col-span-4 text-sm text-ink-muted">
                    {field.reason}
                  </span>
                )}
            </button>

            {selected && canAct && (
              <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
                {isEditing ? (
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (editing.draft.trim() === '') return
                      onSave(field.key, editing.draft)
                      setEditing(null)
                    }}
                  >
                    <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
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
                      type="submit"
                      disabled={editing.draft.trim() === ''}
                      className={primaryButtonClass}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className={buttonClass}
                    >
                      Cancel
                    </button>
                  </form>
                ) : field.status === 'needs_review' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onConfirm(field.key)}
                      className={primaryButtonClass}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({ key: field.key, draft: field.value ?? '' })
                      }
                      className={buttonClass}
                    >
                      Edit
                    </button>
                  </>
                ) : field.status === 'missing' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing({ key: field.key, draft: '' })}
                      className={primaryButtonClass}
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
                        onClick={() =>
                          setRequested(new Set(requested).add(field.key))
                        }
                        className={buttonClass}
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
