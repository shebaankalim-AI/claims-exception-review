import {
  buttonPrimary,
  buttonSecondary,
  input,
  textarea,
} from '@/components/controls'
import { useState } from 'react'
import { Dialog } from '@/components/Dialog'
import type { ClaimId } from '@/domain'

const primary = buttonPrimary
const secondary = buttonSecondary
const field = textarea

const SEND_BACK_REASONS = [
  'Ask the claimant for a document',
  'Re-run the extraction',
  'Something else',
] as const

const PEOPLE = [
  'Senior examiner: Rowan Pike',
  'Team lead: Mira Okonkwo',
] as const

type DialogProps = {
  open: boolean
  claimId: ClaimId
  onCancel: () => void
}

type SendBackDialogProps = DialogProps & {
  onConfirm: (note: string) => void
}

function SendBackForm({
  onCancel,
  onConfirm,
}: Pick<SendBackDialogProps, 'onCancel' | 'onConfirm'>) {
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState('')

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (reason === null) return
        onConfirm(note.trim() === '' ? reason : `${reason}: ${note.trim()}`)
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink-muted">
          Reason
        </legend>
        {SEND_BACK_REASONS.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-3 rounded-sm border border-border px-3 py-2 hover:bg-surface-muted has-checked:border-accent has-checked:bg-accent-soft"
          >
            <input
              type="radio"
              name="send-back-reason"
              value={option}
              checked={reason === option}
              onChange={() => setReason(option)}
              className="focus-ring size-4 accent-accent"
            />
            {option}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-muted">
        Note
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`${field} text-base font-normal`}
        />
      </label>
      <div className="flex items-center justify-end gap-2 pt-2">
        {/* A disabled button still says why. */}
        {reason === null && (
          <p id="send-back-hint" className="mr-auto text-sm text-ink-muted">
            Choose a reason first.
          </p>
        )}
        <button type="button" onClick={onCancel} className={secondary}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={reason === null}
          aria-describedby={reason === null ? 'send-back-hint' : undefined}
          className={primary}
        >
          Send back
        </button>
      </div>
    </form>
  )
}

export function SendBackDialog({
  open,
  claimId,
  onCancel,
  onConfirm,
}: SendBackDialogProps) {
  return (
    <Dialog
      open={open}
      title={`Send back ${claimId}`}
      subtitle="The agent picks it up again with your note."
      onClose={onCancel}
    >
      <SendBackForm onCancel={onCancel} onConfirm={onConfirm} />
    </Dialog>
  )
}

type EscalateDialogProps = DialogProps & {
  /** The person chosen, and the reason given. */
  onConfirm: (person: string, note: string) => void
}

function EscalateForm({
  onCancel,
  onConfirm,
}: Pick<EscalateDialogProps, 'onCancel' | 'onConfirm'>) {
  const [person, setPerson] = useState<string>(PEOPLE[0])
  const [note, setNote] = useState('')

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (note.trim() === '') return
        onConfirm(person, note.trim())
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-muted">
        Escalate to
        <select
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          className={`${input} text-base font-normal`}
        >
          {PEOPLE.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-muted">
        Why are you escalating?
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`${field} text-base font-normal`}
        />
      </label>
      <div className="flex items-center justify-end gap-2 pt-2">
        {note.trim() === '' && (
          <p id="escalate-hint" className="mr-auto text-sm text-ink-muted">
            Add a note first.
          </p>
        )}
        <button type="button" onClick={onCancel} className={secondary}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={note.trim() === ''}
          aria-describedby={note.trim() === '' ? 'escalate-hint' : undefined}
          className={primary}
        >
          Escalate
        </button>
      </div>
    </form>
  )
}

export function EscalateDialog({
  open,
  claimId,
  onCancel,
  onConfirm,
}: EscalateDialogProps) {
  return (
    <Dialog
      open={open}
      title={`Escalate ${claimId}`}
      subtitle="Choose who should take it. They'll see your note and the full feed."
      onClose={onCancel}
    >
      <EscalateForm onCancel={onCancel} onConfirm={onConfirm} />
    </Dialog>
  )
}
