import type { Claim, Field } from '@/domain'
import { FIELD_STATUS_LABELS, REASON_LABELS } from '@/lib/labels'
import { isUnresolved } from './claimRules'

// Demo replies: a few answers picked by keyword from the claim's own data. There
// is no model behind this, which is why the panel says so.

const has = (question: string, words: string[]) =>
  words.some((w) => question.includes(w))

function describeField(field: Field | undefined, missingText: string): string {
  if (!field) return missingText
  const value = field.value ?? 'not set'
  const why = field.reason ?? 'The agent found no conflict between the sources.'
  return `${field.label} is ${value} (${FIELD_STATUS_LABELS[field.status].toLowerCase()}). ${why}.`.replace(
    '..',
    '.',
  )
}

export function cannedReply(question: string, claim: Claim): string {
  const q = question.toLowerCase()
  const field = (key: string) => claim.fields.find((f) => f.key === key)

  if (has(q, ['wage', 'pay', 'paid', 'salary'])) {
    return describeField(
      field('average_weekly_wage'),
      'No weekly wage is recorded for this claim.',
    )
  }

  if (has(q, ['class', 'tier', 'code'])) {
    return describeField(
      field('class_code') ?? field('policy_tier'),
      'No class code or policy tier is recorded for this claim.',
    )
  }

  if (has(q, ['document', 'missing', 'report'])) {
    const missing = claim.fields.filter((f) => f.status === 'missing')
    if (missing.length === 0) {
      return 'Nothing is missing. Every document the agent needs is on file.'
    }
    return `Still missing: ${missing
      .map((f) =>
        f.expectedIn
          ? `${f.label} (would normally be in ${f.expectedIn})`
          : f.label,
      )
      .join('; ')}. You can request it, or add the value yourself.`
  }

  if (has(q, ['why', 'flag', 'stop'])) {
    return `This claim is in your queue because of: ${REASON_LABELS[claim.exceptionReasons[0]].toLowerCase()}. ${claim.agentNote}.`
  }

  if (has(q, ['next', 'now', 'should'])) {
    if (claim.state === 'approved') {
      return 'You have approved this claim. Filing it is the step that changes the system of record.'
    }
    if (claim.state === 'filed') {
      return 'This claim is filed. Nothing is left to do here. Open the next claim in the queue.'
    }
    if (claim.state !== 'needs_review') {
      return 'This claim has been handed on. Nothing is left for you to do on it.'
    }
    const open = claim.fields.filter(isUnresolved)
    if (open.length === 0) {
      return 'Everything flagged is resolved. Approve the claim, then file it.'
    }
    return `Resolve ${open.length === 1 ? 'the 1 flagged field' : `the ${open.length} flagged fields`}: ${open
      .map((f) => f.label)
      .join(', ')}. Then approve, and file.`
  }

  return 'I can answer questions about the wage, the class code, documents, why this claim was flagged, or what to do next. These are demo replies, not a live AI.'
}
