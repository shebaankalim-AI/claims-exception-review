import { ACTIVITY_ACTIONS, STAGES } from '@/domain'
import type { Claim, Field, Stage } from '@/domain'

export const isUnresolved = (field: Field): boolean =>
  field.status === 'needs_review' || field.status === 'missing'

export function fieldsInStage(claim: Claim, stage: Stage): Field[] {
  return claim.fields.filter((f) => f.stage === stage)
}

export function stageSummary(claim: Claim, stage: Stage) {
  const fields = fieldsInStage(claim, stage)
  return {
    toConfirm: fields.filter((f) => f.status === 'needs_review').length,
    missing: fields.filter((f) => f.status === 'missing').length,
  }
}

/** The field to select when a stage opens: the first one that needs the examiner, else the first. */
export function defaultFieldKey(claim: Claim, stage: Stage): string | null {
  const fields = fieldsInStage(claim, stage)
  return (fields.find(isUnresolved) ?? fields[0])?.key ?? null
}

/** The first stage with something flagged, so a claim opens where the work is. */
export function firstStageWithFlags(claim: Claim): Stage {
  return (
    STAGES.find((s) => fieldsInStage(claim, s).some(isUnresolved)) ?? STAGES[0]
  )
}

export function activityTime(claim: Claim, action: string): string | undefined {
  return [...claim.activity].reverse().find((a) => a.action === action)?.at
}

export const approvedTime = (claim: Claim) =>
  activityTime(claim, ACTIVITY_ACTIONS.approved)
export const filedTime = (claim: Claim) =>
  activityTime(claim, ACTIVITY_ACTIONS.filed)

/** A made-up reference, standing in for what the system of record would return. */
export const filingReference = (claim: Claim) => `FIL-${claim.id.slice(-4)}-A`
