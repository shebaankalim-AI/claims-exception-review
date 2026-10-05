import type { Claim, ClaimDocument, Field, Stage } from '@/domain'

// Gives every claim something to review in all five stages. The hand-written
// claims already do; the lighter ones get the same standard, verified fields
// plus an intake call transcript and a pay stub for them to cite. All values
// are invented and derived from the claim number, so they are stable.

const STAGE_BY_KEY: Record<string, Stage> = {
  claimant_name: 'intake',
  date_of_injury: 'intake',
  injury_description: 'intake',
  employer: 'coverage',
  policy_number: 'coverage',
  policy_period: 'coverage',
  class_code: 'coverage',
  policy_tier: 'coverage',
  related_claim: 'liability',
  work_related: 'liability',
  reported_on_time: 'liability',
  witness: 'liability',
  witness_statement: 'liability',
  incident_report: 'liability',
  injury_detail: 'damages',
  work_status: 'damages',
  body_part: 'damages',
  average_weekly_wage: 'damages',
  treating_physician: 'damages',
  medical_report: 'damages',
  third_party: 'recovery',
}

export function stageForKey(key: string): Stage {
  return STAGE_BY_KEY[key] ?? 'intake'
}

function claimNumber(claim: Claim): number {
  return Number(claim.id.slice(-4))
}

function transcriptFor(claim: Claim, policyNumber: string): ClaimDocument {
  return {
    id: `${claim.id}-transcript`,
    kind: 'transcript',
    title: 'Intake call transcript',
    language: 'en',
    pages: [
      [
        'INTAKE CALL TRANSCRIPT',
        `Caller: HR contact at ${claim.employer}`,
        'Agent: Did the injury happen while working?',
        'Caller: Yes, during a normal shift.',
        'Agent: Was it reported to a supervisor the same day?',
        'Caller: Yes, the same day.',
        'Agent: Was anyone outside the company involved?',
        'Caller: No, nobody else was involved.',
        'Agent: Can I take the policy number?',
        `Caller: It is ${policyNumber}.`,
      ].join('\n'),
    ],
  }
}

function payStubFor(claim: Claim, weeklyWage: string): ClaimDocument {
  return {
    id: `${claim.id}-paystub`,
    kind: 'pay_stub',
    title: 'Pay stub',
    language: 'en',
    pages: [
      [
        'PAY STUB',
        `Employer: ${claim.employer}`,
        'Pay period: weekly',
        `Gross pay for the week: ${weeklyWage}`,
        'Hours: 40',
      ].join('\n'),
    ],
  }
}

export function completeStages(claim: Claim): Claim {
  const n = claimNumber(claim)
  const policyNumber = `POL-${50 + (n % 40)}-${String(10000 + ((n * 7919) % 89999))}`
  const weeklyWage = `$${640 + ((n * 37) % 460)}`

  const documents = [...claim.documents]
  if (!documents.some((d) => d.kind === 'transcript')) {
    documents.push(transcriptFor(claim, policyNumber))
  }
  if (!documents.some((d) => d.kind === 'pay_stub')) {
    documents.push(payStubFor(claim, weeklyWage))
  }
  const transcript = `${claim.id}-transcript`
  const payStub = `${claim.id}-paystub`

  const standard: Field[] = [
    {
      key: 'policy_number',
      label: 'Policy number',
      stage: 'coverage',
      value: policyNumber,
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: transcript,
          page: 1,
          excerpt: `It is ${policyNumber}.`,
        },
      ],
    },
    {
      key: 'work_related',
      label: 'Work-related',
      stage: 'liability',
      value: 'Yes',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: transcript,
          page: 1,
          excerpt: 'Yes, during a normal shift.',
        },
      ],
    },
    {
      key: 'reported_on_time',
      label: 'Reported on time',
      stage: 'liability',
      value: 'Same day',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        { documentId: transcript, page: 1, excerpt: 'Yes, the same day.' },
      ],
    },
    {
      key: 'average_weekly_wage',
      label: 'Average weekly wage',
      stage: 'damages',
      value: weeklyWage,
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: payStub,
          page: 1,
          excerpt: `Gross pay for the week: ${weeklyWage}`,
        },
      ],
    },
    {
      key: 'third_party',
      label: 'Third party involved',
      stage: 'recovery',
      value: 'None',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: transcript,
          page: 1,
          excerpt: 'No, nobody else was involved.',
        },
      ],
    },
  ]

  const present = new Set(claim.fields.map((f) => f.key))
  const fields = [
    ...claim.fields,
    ...standard.filter((f) => !present.has(f.key)),
  ]
  // The feed counts what the agent read and extracted, so keep it in step.
  const activity = claim.activity.map((entry) =>
    /^Read d+ documents?$/.test(entry.action)
      ? { ...entry, action: `Read ${documents.length} documents` }
      : /^Extracted d+ fields/.test(entry.action)
        ? {
            ...entry,
            action: entry.action.replace(
              /^Extracted d+ fields/,
              `Extracted ${fields.length} fields`,
            ),
          }
        : entry,
  )
  return { ...claim, documents, fields, activity }
}
