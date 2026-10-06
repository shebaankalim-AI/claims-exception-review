import { toClaimId } from '@/domain'
import type { Claim } from '@/domain'

// The fully worked claim: 14 fields across all five stages, 11 verified and 3
// for the examiner. Everything here is invented. Names, employers and numbers
// are fictional and do not refer to real people or organizations.

const FROI = 'CLM-24-0417-froi'
const EMAIL = 'CLM-24-0417-email'
const TRANSCRIPT = 'CLM-24-0417-transcript'
const PAY_STUB = 'CLM-24-0417-paystub'

export const classCodeClaim: Claim = {
  id: toClaimId('CLM-24-0417'),
  employer: 'Harbor & Pine Logistics',
  lineOfBusiness: 'workers_comp',
  exceptionReasons: ['class_code_unclear', 'document_missing'],
  agentNote: 'Class code and weekly wage need a check; no medical report yet',
  receivedAt: '2025-02-27T05:12:00.000Z',
  flaggedAt: '2025-02-27T05:15:00.000Z',
  assignee: 'Priya Natarajan',
  state: 'needs_review',
  documents: [
    {
      id: FROI,
      kind: 'froi',
      title: 'First report form',
      language: 'en',
      pages: [
        [
          'FIRST REPORT FORM',
          'Employer: Harbor & Pine Logistics',
          'Employee: Devon Achterberg',
          'Date of injury: 2025-02-26',
          'Job title: Dispatch clerk / yard assistant',
          'Job class code: A-102',
          'Policy: POL-77-30412',
          'Policy period: 2025-01-01 to 2025-12-31',
          'Description: Employee slipped on wet loading dock steps while carrying paperwork to a truck driver and twisted left ankle.',
          'Body part: left ankle',
          'Average weekly wage: $780',
          'Witness: Calloway Reyes, supervisor',
          'Reported by: Imogen Fairweather, HR coordinator',
        ].join('\n'),
        [
          'EMPLOYER STATEMENT',
          'Employee works mostly at a desk in the dispatch office but spends part of each shift on the dock and yard.',
          'Supervisor: Calloway Reyes',
        ].join('\n'),
      ],
    },
    {
      id: EMAIL,
      kind: 'email',
      title: 'Email thread: dock injury follow-up',
      language: 'en',
      pages: [
        [
          'From: Imogen Fairweather',
          'To: Claims intake',
          "Subject: Devon's ankle injury",
          '',
          'Devon is mostly in the dispatch office, but he helps load paperwork and tags on the dock a couple of hours a day. Payroll lists him under the warehouse team.',
          '',
          '---',
          'From: Claims intake',
          'To: Imogen Fairweather',
          "Subject: RE: Devon's ankle injury",
          '',
          "Thanks. Can you send the doctor's note when you have it?",
          '',
          '---',
          'From: Imogen Fairweather',
          "Subject: RE: RE: Devon's ankle injury",
          '',
          'He was seen at an urgent care on Feb 26 but we do not have the paperwork yet.',
        ].join('\n'),
      ],
    },
    {
      id: TRANSCRIPT,
      kind: 'transcript',
      title: 'Intake call transcript',
      language: 'en',
      pages: [
        [
          'INTAKE CALL TRANSCRIPT',
          'Caller: Imogen Fairweather, HR coordinator at Harbor & Pine Logistics',
          'Agent: Did the injury happen while working?',
          'Caller: Yes, on the loading dock during his shift.',
          'Agent: Was it reported to a supervisor the same day?',
          'Caller: Yes, the same day.',
          'Agent: Which team is he paid under?',
          'Caller: The warehouse team, class B-340.',
          'Agent: Was anyone outside the company involved?',
          'Caller: No, nobody else was involved.',
        ].join('\n'),
      ],
    },
    {
      id: PAY_STUB,
      kind: 'pay_stub',
      title: 'Pay stub',
      language: 'en',
      pages: [
        [
          'PAY STUB',
          'Employer: Harbor & Pine Logistics',
          'Employee: Devon Achterberg',
          'Pay period: weekly',
          'Gross pay for the week: $812',
          'Hours: 40',
        ].join('\n'),
      ],
    },
  ],
  fields: [
    // Intake
    {
      key: 'claimant_name',
      label: 'Claimant',
      stage: 'intake',
      value: 'Devon Achterberg',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        { documentId: FROI, page: 1, excerpt: 'Employee: Devon Achterberg' },
      ],
    },
    {
      key: 'date_of_injury',
      label: 'Date of injury',
      stage: 'intake',
      value: '2025-02-26',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        { documentId: FROI, page: 1, excerpt: 'Date of injury: 2025-02-26' },
      ],
    },
    {
      key: 'injury_description',
      label: 'Injury description',
      stage: 'intake',
      value: 'Slipped on wet dock steps and twisted left ankle',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: FROI,
          page: 1,
          excerpt:
            'Employee slipped on wet loading dock steps while carrying paperwork to a truck driver and twisted left ankle.',
        },
      ],
    },
    // Coverage
    {
      key: 'employer',
      label: 'Employer',
      stage: 'coverage',
      value: 'Harbor & Pine Logistics',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: FROI,
          page: 1,
          excerpt: 'Employer: Harbor & Pine Logistics',
        },
      ],
    },
    {
      key: 'policy_number',
      label: 'Policy number',
      stage: 'coverage',
      value: 'POL-77-30412',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [{ documentId: FROI, page: 1, excerpt: 'Policy: POL-77-30412' }],
    },
    {
      key: 'policy_period',
      label: 'Policy period',
      stage: 'coverage',
      value: '2025-01-01 to 2025-12-31',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: FROI,
          page: 1,
          excerpt: 'Policy period: 2025-01-01 to 2025-12-31',
        },
      ],
    },
    {
      key: 'class_code',
      label: 'Job class code',
      stage: 'coverage',
      value: 'A-102 (office)',
      status: 'needs_review',
      reason: 'Form says A-102, transcript says B-340',
      resolvedBy: 'agent',
      sources: [
        { documentId: FROI, page: 1, excerpt: 'Job class code: A-102' },
        {
          documentId: TRANSCRIPT,
          page: 1,
          excerpt: 'The warehouse team, class B-340.',
          highlight: 'class B-340',
        },
      ],
    },
    // Liability
    {
      key: 'work_related',
      label: 'Work-related',
      stage: 'liability',
      value: 'Yes',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: TRANSCRIPT,
          page: 1,
          excerpt: 'Yes, on the loading dock during his shift.',
          highlight: 'on the loading dock',
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
        {
          documentId: TRANSCRIPT,
          page: 1,
          excerpt: 'Yes, the same day.',
          highlight: 'the same day',
        },
      ],
    },
    {
      key: 'witness',
      label: 'Witness',
      stage: 'liability',
      value: 'Calloway Reyes, supervisor',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: FROI,
          page: 1,
          excerpt: 'Witness: Calloway Reyes, supervisor',
        },
      ],
    },
    // Damages
    {
      key: 'average_weekly_wage',
      label: 'Average weekly wage',
      stage: 'damages',
      value: '$780',
      status: 'needs_review',
      reason: 'Form says $780, pay stub says $812',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: PAY_STUB,
          page: 1,
          excerpt: 'Gross pay for the week: $812',
        },
        { documentId: FROI, page: 1, excerpt: 'Average weekly wage: $780' },
      ],
    },
    {
      key: 'body_part',
      label: 'Body part',
      stage: 'damages',
      value: 'Left ankle',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        { documentId: FROI, page: 1, excerpt: 'Body part: left ankle' },
      ],
    },
    {
      key: 'medical_report',
      label: 'Medical report',
      stage: 'damages',
      value: null,
      status: 'missing',
      reason: 'No medical report received yet',
      expectedIn: 'a medical report from the treating clinic',
      resolvedBy: 'agent',
      sources: [],
    },
    // Recovery
    {
      key: 'third_party',
      label: 'Third party involved',
      stage: 'recovery',
      value: 'None',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: TRANSCRIPT,
          page: 1,
          excerpt: 'No, nobody else was involved.',
          highlight: 'nobody else was involved',
        },
      ],
    },
  ],
  activity: [
    {
      at: '2025-02-27T05:12:00.000Z',
      actor: 'agent',
      action: 'Called the claimant: 4 min 12 s',
      outcome: 'completed',
    },
    {
      at: '2025-02-27T05:13:00.000Z',
      actor: 'agent',
      action: 'Read 4 documents',
      outcome: 'completed',
    },
    {
      at: '2025-02-27T05:14:00.000Z',
      actor: 'agent',
      action: 'Extracted 14 fields from the first report form',
      outcome: 'completed',
    },
    {
      at: '2025-02-27T05:14:00.000Z',
      actor: 'agent',
      action: 'Checked coverage: active on date of loss',
      outcome: 'verified',
    },
    {
      at: '2025-02-27T05:15:00.000Z',
      actor: 'agent',
      action: 'Flagged: job class code differs between sources',
      detail: 'Form says A-102, transcript says B-340',
      outcome: 'needs_review',
    },
    {
      at: '2025-02-27T05:15:00.000Z',
      actor: 'agent',
      action: 'Flagged: average weekly wage differs between sources',
      detail: 'Form says $780, pay stub says $812',
      outcome: 'needs_review',
    },
    {
      at: '2025-02-27T05:15:00.000Z',
      actor: 'agent',
      action: 'Asked the clinic for the medical report',
      detail: 'No medical report received yet',
      outcome: 'waiting',
    },
  ],
}
