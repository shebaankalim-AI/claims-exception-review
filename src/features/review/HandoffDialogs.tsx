import { useState } from 'react'
import { Dialog } from '@/components/Dialog'
import type { ClaimId } from '@/domain'

const primary =
  'focus-ring h-control rounded-md bg-accent px-3 text-on-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
const secondary =
  'focus-ring h-control rounded-md border border-border-strong bg-surface px-3 hover:bg-surface-muted'
const field =
  'focus-ring rounded-md border border-border-strong bg-surface px-2 py-1 text-ink'

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
        <legend className="mb-1 font-medium">Reason</legend>
        {SEND_BACK_REASONS.map((option) => (
          <label key={option} className="flex items-center gap-2">
            <input
              type="radio"
              name="send-back-reason"
              value={option}
              checked={reason === option}
              onChange={() => setReason(option)}
            />
            {option}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1">
        Note
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={field}
        />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondary}>
          Cancel
        </button>
        <button type="submit" disabled={reason === null} className={primary}>
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
      <label className="flex flex-col gap-1">
        Escalate to
        <select
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          className={`${field} h-control`}
        >
          {PEOPLE.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Why are you escalating?
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={field}
        />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondary}>
          Cancel
        </button>
        <button type="submit" disabled={note.trim() === ''} className={primary}>
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
