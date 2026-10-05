import type { ActivityEntry, Claim, Field, ReviewAction } from './types'

export type ReviewErrorCode =
  | 'invalid_state'
  | 'field_not_found'
  | 'field_not_confirmable'
  | 'empty_value'
  | 'unresolved_fields'
  | 'invalid_time'
  | 'unknown_action'

export type ReviewError = { code: ReviewErrorCode; message: string }

export type ReviewResult =
  { ok: true; claim: Claim } | { ok: false; error: ReviewError }

function fail(code: ReviewErrorCode, message: string): ReviewResult {
  return { ok: false, error: { code, message } }
}

function succeed(
  claim: Claim,
  changes: Partial<Pick<Claim, 'state' | 'fields'>>,
  entry: ActivityEntry,
): ReviewResult {
  return {
    ok: true,
    claim: { ...claim, ...changes, activity: [...claim.activity, entry] },
  }
}

function isUnresolved(field: Field): boolean {
  return field.status === 'needs_review' || field.status === 'missing'
}

function replaceField(claim: Claim, updated: Field): Field[] {
  return claim.fields.map((f) => (f.key === updated.key ? updated : f))
}

/**
 * Pure transition function for a claim under review. It never throws and never
 * mutates its input: illegal actions come back as `{ ok: false }` so callers
 * (and the UI) handle them as data. `now` is a parameter so tests need no clock.
 */
export function reviewReducer(
  claim: Claim,
  action: ReviewAction,
  now: Date,
): ReviewResult {
  // toISOString throws on an invalid Date, which would break the never-throws promise.
  if (Number.isNaN(now.getTime())) {
    return fail('invalid_time', 'The time for this action is not valid.')
  }
  const at = now.toISOString()

  switch (action.type) {
    case 'confirmField': {
      const found = findEditableField(claim, action.fieldKey)
      if (!found.ok) return found.result
      const { field } = found
      if (field.status !== 'needs_review') {
        return fail(
          'field_not_confirmable',
          `"${field.label}" is ${field.status}; only a field that needs review can be confirmed.`,
        )
      }
      return succeed(
        claim,
        {
          fields: replaceField(claim, {
            ...field,
            status: 'verified',
            resolvedBy: 'examiner',
          }),
        },
        {
          at,
          actor: 'examiner',
          action: `Confirmed ${field.label}`,
          detail: field.value ?? undefined,
          sourceRefs: field.sources,
        },
      )
    }

    case 'editField': {
      const found = findEditableField(claim, action.fieldKey)
      if (!found.ok) return found.result
      const { field } = found
      const value = action.value.trim()
      if (value === '') {
        return fail('empty_value', `"${field.label}" needs a value.`)
      }
      return succeed(
        claim,
        {
          fields: replaceField(claim, {
            ...field,
            value,
            status: 'edited',
            resolvedBy: 'examiner',
          }),
        },
        {
          at,
          actor: 'examiner',
          action: `Edited ${field.label}`,
          detail: `${field.value ?? 'empty'} → ${value}`,
          sourceRefs: field.sources,
        },
      )
    }

    case 'approve': {
      if (claim.state !== 'needs_review') {
        return fail(
          'invalid_state',
          `Only a claim that needs review can be approved, not one that is ${claim.state}.`,
        )
      }
      const open = claim.fields.filter(isUnresolved)
      if (open.length > 0) {
        return fail(
          'unresolved_fields',
          `Resolve ${open.map((f) => f.label).join(', ')} before approving.`,
        )
      }
      return succeed(
        claim,
        { state: 'approved' },
        { at, actor: 'examiner', action: 'Approved' },
      )
    }

    case 'file': {
      // `filed` is the only state meaning the system of record changed, so it
      // is reachable only from an explicit approval.
      if (claim.state !== 'approved') {
        return fail(
          'invalid_state',
          `Only an approved claim can be filed, not one that is ${claim.state}.`,
        )
      }
      return succeed(
        claim,
        { state: 'filed' },
        { at, actor: 'examiner', action: 'Filed to the system of record' },
      )
    }

    case 'sendBack': {
      if (claim.state !== 'needs_review') {
        return fail(
          'invalid_state',
          `Only a claim that needs review can be sent back, not one that is ${claim.state}.`,
        )
      }
      return succeed(
        claim,
        { state: 'sent_back' },
        {
          at,
          actor: 'examiner',
          action: 'Sent back to the agent',
          detail: action.note,
        },
      )
    }

    case 'escalate': {
      if (claim.state !== 'needs_review') {
        return fail(
          'invalid_state',
          `Only a claim that needs review can be escalated, not one that is ${claim.state}.`,
        )
      }
      return succeed(
        claim,
        { state: 'escalated' },
        { at, actor: 'examiner', action: 'Escalated', detail: action.note },
      )
    }

    default:
      return fail(
        'unknown_action',
        `Unknown action "${String((action as { type?: unknown }).type)}".`,
      )
  }
}

type FieldLookup =
  { ok: true; field: Field } | { ok: false; result: ReviewResult }

// Field changes are only legal while the claim is under review: once approved,
// the examiner has signed off on exactly these values.
function findEditableField(claim: Claim, fieldKey: string): FieldLookup {
  if (claim.state !== 'needs_review') {
    return {
      ok: false,
      result: fail(
        'invalid_state',
        `Fields can only be changed while a claim needs review, not when it is ${claim.state}.`,
      ),
    }
  }
  const field = claim.fields.find((f) => f.key === fieldKey)
  if (!field) {
    return {
      ok: false,
      result: fail('field_not_found', `No field "${fieldKey}".`),
    }
  }
  return { ok: true, field }
}
