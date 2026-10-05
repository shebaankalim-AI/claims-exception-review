import { toClaimId } from '@/domain'
import { stageForKey } from './standardFields'
import type {
  Claim,
  ClaimDocument,
  ExceptionReason,
  Field,
  FieldStatus,
  LineOfBusiness,
} from '@/domain'

// Lighter fixtures: one document each, built so every source excerpt is a real
// line of that document. All names and numbers are invented.

type FieldSpec = {
  key: string
  label: string
  value: string | null
  status: FieldStatus
  reason?: string
  /** For a missing field: which document would normally contain it. */
  expectedIn?: string
}

type LightClaimSpec = {
  id: string
  employer: string
  lineOfBusiness?: LineOfBusiness
  exceptionReasons: [ExceptionReason, ...ExceptionReason[]]
  receivedAt: string
  /** Defaults to three minutes after receipt. */
  flaggedAt?: string
  assignee: string
  language?: string
  fields: FieldSpec[]
}

function buildClaim(spec: LightClaimSpec): Claim {
  const documentId = `${spec.id}-froi`
  const lines = spec.fields
    .filter((f) => f.value !== null)
    .map((f) => `${f.label}: ${f.value}`)
  const document: ClaimDocument = {
    id: documentId,
    kind: 'froi',
    title: 'First report form',
    language: spec.language ?? 'en',
    pages: [
      ['FIRST REPORT FORM', `Employer: ${spec.employer}`, ...lines].join('\n'),
    ],
  }

  const fields: Field[] = spec.fields.map((f) => ({
    key: f.key,
    label: f.label,
    stage: stageForKey(f.key),
    value: f.value,
    status: f.status,
    ...(f.reason ? { reason: f.reason } : {}),
    ...(f.expectedIn ? { expectedIn: f.expectedIn } : {}),
    resolvedBy: 'agent',
    sources:
      f.value === null
        ? []
        : [{ documentId, page: 1, excerpt: `${f.label}: ${f.value}` }],
  }))

  const flagged = spec.fields.filter((f) => f.status !== 'verified')
  const flaggedAt =
    spec.flaggedAt ??
    new Date(new Date(spec.receivedAt).getTime() + 3 * 60_000).toISOString()
  return {
    id: toClaimId(spec.id),
    employer: spec.employer,
    lineOfBusiness: spec.lineOfBusiness ?? 'workers_comp',
    exceptionReasons: spec.exceptionReasons,
    // The agent's own words: its reason for the first field it flagged.
    agentNote: flagged[0]?.reason ?? '',
    receivedAt: spec.receivedAt,
    flaggedAt,
    assignee: spec.assignee,
    state: 'needs_review',
    documents: [document],
    fields,
    activity: [
      { at: spec.receivedAt, actor: 'agent', action: 'Read 1 document' },
      {
        at: spec.receivedAt,
        actor: 'agent',
        action: `Extracted ${fields.length} fields`,
      },
      ...flagged.map((f) => ({
        at: flaggedAt,
        actor: 'agent' as const,
        action: `Flagged ${f.label}`,
        detail: f.reason,
      })),
    ],
  }
}

const claimant = (value: string): FieldSpec => ({
  key: 'claimant_name',
  label: 'Employee',
  value,
  status: 'verified',
})
const injuryDate = (value: string): FieldSpec => ({
  key: 'date_of_injury',
  label: 'Date of injury',
  value,
  status: 'verified',
})
const description = (value: string): FieldSpec => ({
  key: 'injury_description',
  label: 'Description',
  value,
  status: 'verified',
})

export const lightClaims: Claim[] = [
  buildClaim({
    id: 'CLM-24-0388',
    employer: 'Quillfeather Bakery Co.',
    exceptionReasons: ['document_missing'],
    receivedAt: '2025-02-26T18:52:00.000Z',
    assignee: 'Tomas Ekwueme',
    fields: [
      claimant('Rosalind Okonkwo-Bell'),
      injuryDate('2025-01-13'),
      description('Burn to left hand from a hot tray'),
      {
        key: 'treating_physician',
        label: 'Treating physician',
        value: null,
        status: 'missing',
        reason: 'No medical report received yet',
        expectedIn: 'a medical report from the treating clinic',
      },
    ],
  }),
  buildClaim({
    id: 'CLM-24-0402',
    employer: 'Northgate Timber Works',
    exceptionReasons: ['class_code_unclear'],
    receivedAt: '2025-02-26T21:27:00.000Z',
    assignee: 'Priya Natarajan',
    fields: [
      claimant('Bertrand Oyelaran'),
      injuryDate('2025-02-25'),
      description('Splinter injury to right palm at the sawmill'),
      {
        key: 'class_code',
        label: 'Class code',
        value: 'C-217 (sawmill)',
        status: 'needs_review',
        reason: 'Job title also fits C-220 (log yard)',
      },
    ],
  }),
  buildClaim({
    id: 'CLM-24-0409',
    employer: 'Ashbourne Dental Group',
    exceptionReasons: ['policy_tier_ambiguous'],
    receivedAt: '2025-02-27T00:37:00.000Z',
    assignee: 'Dana Whitcombe',
    fields: [
      claimant('Philippa Strand'),
      injuryDate('2025-02-26'),
      description('Needle-stick injury while cleaning an instrument tray'),
      {
        key: 'policy_tier',
        label: 'Policy tier',
        value: 'Plus',
        status: 'needs_review',
        reason:
          'Two policies on file for this employer, one Standard and one Plus',
      },
    ],
  }),
  buildClaim({
    id: 'CLM-24-0413',
    lineOfBusiness: 'employers_liability',
    employer: 'Tidewater Metal Fabrication',
    exceptionReasons: ['possible_duplicate', 'class_code_unclear'],
    receivedAt: '2025-02-27T03:07:00.000Z',
    assignee: 'Priya Natarajan',
    fields: [
      claimant('Lazlo Mbeki-Ferreira'),
      injuryDate('2025-02-26'),
      description('Metal shard in left eye, flushed on site'),
      {
        key: 'class_code',
        label: 'Class code',
        value: 'C-301 (fabrication)',
        status: 'needs_review',
        reason: 'Employee is listed under both fabrication and shipping',
      },
      {
        key: 'related_claim',
        label: 'Possible duplicate of',
        value: 'CLM-24-0391',
        status: 'needs_review',
        reason: 'Same claimant and date, filed by a different contact',
      },
    ],
  }),
  buildClaim({
    id: 'CLM-24-0425',
    lineOfBusiness: 'occupational_accident',
    employer: 'Brightwell Staffing Partners',
    exceptionReasons: ['document_missing', 'policy_tier_ambiguous'],
    receivedAt: '2025-02-27T08:47:00.000Z',
    assignee: 'Tomas Ekwueme',
    fields: [
      claimant('Ottilie Vandermeer'),
      injuryDate('2025-02-26'),
      description('Back strain lifting boxes at a client site'),
      {
        key: 'policy_tier',
        label: 'Policy tier',
        value: 'Standard',
        status: 'needs_review',
        reason: 'The client site may be covered by a separate policy',
      },
      {
        key: 'witness_statement',
        label: 'Witness statement',
        value: null,
        status: 'missing',
        reason: 'The client has not sent a statement',
        expectedIn: 'a witness statement from the client site',
      },
    ],
  }),
  buildClaim({
    id: 'CLM-24-0428',
    employer: 'Copperleaf Hospitality',
    exceptionReasons: ['non_english_form'],
    receivedAt: '2025-02-27T12:11:00.000Z',
    assignee: 'Dana Whitcombe',
    language: 'fr',
    fields: [
      claimant('Mathilde Ouedraogo'),
      injuryDate('2025-02-26'),
      {
        key: 'injury_description',
        label: 'Description',
        value:
          'Brûlure à la main droite en cuisine (burn to right hand in the kitchen)',
        status: 'needs_review',
        reason:
          'Form is in French; the English reading was prepared by the agent',
      },
    ],
  }),
  buildClaim({
    id: 'CLM-24-0436',
    lineOfBusiness: 'occupational_accident',
    employer: 'Juniper Ridge Construction',
    exceptionReasons: ['class_code_unclear'],
    receivedAt: '2025-02-27T13:22:00.000Z',
    assignee: 'Priya Natarajan',
    fields: [
      claimant('Cormac Idowu-Lindqvist'),
      injuryDate('2025-02-26'),
      description('Fell from a low scaffold while measuring'),
      {
        key: 'class_code',
        label: 'Class code',
        value: 'D-410 (site supervisor)',
        status: 'needs_review',
        reason: 'Works as supervisor but was doing hands-on carpentry',
      },
    ],
  }),
  buildClaim({
    id: 'CLM-24-0440',
    employer: 'Oldmill Textile Works',
    exceptionReasons: ['possible_duplicate'],
    receivedAt: '2025-02-27T14:17:00.000Z',
    assignee: 'Tomas Ekwueme',
    fields: [
      claimant('Winifred Achebe-Rask'),
      injuryDate('2025-02-26'),
      description('Finger caught in loom'),
      {
        key: 'related_claim',
        label: 'Possible duplicate of',
        value: 'CLM-24-0433',
        status: 'needs_review',
        reason:
          'Same employer, same machine, same day, different employee name spelling',
      },
    ],
  }),
  buildClaim({
    id: 'CLM-24-0444',
    employer: 'Saltmarsh Marine Services',
    exceptionReasons: ['document_missing'],
    receivedAt: '2025-02-27T14:50:00.000Z',
    // The newest claim: flagged four minutes before the fixtures' reference time.
    flaggedAt: '2025-02-27T14:56:00.000Z',
    assignee: 'Dana Whitcombe',
    fields: [
      claimant('Evander Pretorius-Nkemelu'),
      injuryDate('2025-02-26'),
      description('Rope burn to both palms while mooring a vessel'),
      {
        key: 'incident_report',
        label: 'Incident report',
        value: null,
        status: 'missing',
        reason: 'The harbour office report was referenced but not attached',
        expectedIn: 'the harbour office incident report',
      },
    ],
  }),
]
