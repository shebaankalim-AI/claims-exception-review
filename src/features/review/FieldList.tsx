import { useState } from 'react'
import { Icon } from '@/components/Icon'
import type { Claim, Field } from '@/domain'
import { FIELD_STATUS_LABELS } from '@/lib/labels'
import { FIELD_STATUS_ICON, FIELD_STATUS_TONE } from './labels'
import { StateLabel } from './StateLabel'

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

const buttonClass =
  'focus-ring h-row rounded-md border border-slate-300 bg-surface px-3 hover:bg-slate-100'
const primaryButtonClass =
  'focus-ring h-row rounded-md bg-accent px-3 text-on-accent hover:opacity-90'

function sourceTitle(claim: Claim, field: Field): string {
  const documentId = field.sources[0]?.documentId
  return claim.documents.find((d) => d.id === documentId)?.title ?? 'No source'
}

function Value({ field }: { field: Field }) {
  if (field.status === 'missing')
    return <span className="text-slate-600">–</span>
  if (field.status === 'edited') {
    return (
      <span>
        <s className="mr-2 text-slate-600">{field.previousValue ?? 'empty'}</s>
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
      <span className="text-slate-600">
        by {field.resolvedBy === 'agent' ? 'agent' : 'you'}
      </span>
    )
  }
  if (field.status === 'edited') {
    return <span className="text-slate-600">by {examinerName}</span>
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
    <ul className="flex flex-col divide-y divide-slate-200 rounded-md border border-slate-200 bg-surface">
      {fields.map((field) => {
        const selected = field.key === selectedKey
        const isEditing = editing?.key === field.key
        return (
          <li
            key={field.key}
            className={`border-l-4 ${
              selected ? 'border-accent bg-accent-soft' : 'border-transparent'
            }`}
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(field.key)}
              className="focus-ring grid w-full grid-cols-[var(--spacing-col-label)_minmax(0,1fr)_var(--spacing-col-state)_var(--spacing-col-source)] gap-3 px-3 py-2 text-left"
            >
              <span className="font-medium break-words">{field.label}</span>
              <Value field={field} />
              <span className="flex flex-col whitespace-nowrap">
                <StateLabel
                  icon={FIELD_STATUS_ICON[field.status]}
                  tone={FIELD_STATUS_TONE[field.status]}
                  label={FIELD_STATUS_LABELS[field.status]}
                />
                <Provenance field={field} examinerName={examinerName} />
              </span>
              <span className="block min-w-0 truncate text-slate-600">
                {field.status === 'missing'
                  ? 'Not received'
                  : sourceTitle(claim, field)}
              </span>
              {(field.status === 'needs_review' ||
                field.status === 'missing') &&
                field.reason && (
                  <span className="col-span-4 text-slate-600">
                    {field.reason}
                  </span>
                )}
            </button>

            {selected && canAct && (
              <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
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
                    <label className="flex flex-col gap-1 text-slate-600">
                      New value for {field.label}
                      <input
                        type="text"
                        autoFocus
                        value={editing.draft}
                        onChange={(e) =>
                          setEditing({ key: field.key, draft: e.target.value })
                        }
                        className="focus-ring h-row rounded-md border border-slate-300 bg-surface px-2 text-slate-900"
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
                      <span className="flex items-center gap-1 text-slate-600">
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
