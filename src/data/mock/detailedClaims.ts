import { toClaimId } from '@/domain'
import type { Claim } from '@/domain'
import { classCodeClaim } from './classCodeClaim'

// Everything in this file is invented. Names, employers, policy and claim
// numbers are fictional and do not refer to real people or organizations.

const duplicateClaim: Claim = {
  id: toClaimId('CLM-24-0422'),
  employer: 'Quillfeather Bakery Co.',
  lineOfBusiness: 'workers_comp',
  exceptionReasons: ['policy_tier_ambiguous', 'possible_duplicate'],
  agentNote: 'Two tiers fit; may duplicate an earlier claim',
  receivedAt: '2025-02-27T07:20:00.000Z',
  flaggedAt: '2025-02-27T07:23:00.000Z',
  assignee: 'Tomas Ekwueme',
  state: 'needs_review',
  documents: [
    {
      id: 'CLM-24-0422-fax',
      kind: 'fax',
      title: 'Faxed injury notice',
      language: 'en',
      pages: [
        [
          '*** FAX RECEIVED 2025-02-27 07:12 ***',
          'FROM: Quillfeather Bakery Co. front office',
          'INJURY NOTICE',
          'Name: Rosalind Okonkwo-Bell',
          'Hurt on: 02/03/2025',
          'What happened: burned right forearm on oven rack, first aid at work',
          'Policy no. POL-52-88107',
        ].join('\n'),
        [
          '(page 2 of 2 -- scan is faint)',
          'Signature: R. Okonkwo-Bell',
          'Shift: night bake, 10pm start',
          'Note: same thing happened to Rosalind a few weeks ago, form was sent before',
        ].join('\n'),
      ],
    },
    {
      id: 'CLM-24-0422-payroll',
      kind: 'form',
      title: 'Payroll and coverage summary',
      language: 'en',
      pages: [
        [
          'PAYROLL AND COVERAGE SUMMARY',
          'Annual payroll estimate: 410,000',
          'Headcount: 38',
          'Coverage tier requested: Standard or Plus (box not ticked)',
        ].join('\n'),
      ],
    },
  ],
  fields: [
    {
      key: 'claimant_name',
      label: 'Claimant',
      stage: 'intake',
      value: 'Rosalind Okonkwo-Bell',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: 'CLM-24-0422-fax',
          page: 1,
          excerpt: 'Name: Rosalind Okonkwo-Bell',
        },
      ],
    },
    {
      key: 'date_of_injury',
      label: 'Date of injury',
      stage: 'intake',
      value: '2025-02-03',
      status: 'needs_review',
      reason:
        'Written 02/03/2025, which reads as 3 Feb or 2 Mar; the fax is dated 27 Feb',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: 'CLM-24-0422-fax',
          page: 1,
          excerpt: 'Hurt on: 02/03/2025',
        },
      ],
    },
    {
      key: 'injury_description',
      label: 'Injury description',
      stage: 'intake',
      value: 'Burn to right forearm from an oven rack',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: 'CLM-24-0422-fax',
          page: 1,
          excerpt:
            'What happened: burned right forearm on oven rack, first aid at work',
        },
      ],
    },
    {
      key: 'policy_tier',
      label: 'Policy tier',
      stage: 'coverage',
      value: 'Standard',
      status: 'needs_review',
      reason:
        'Payroll fits Standard, headcount fits Plus, and the tier box is not ticked',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: 'CLM-24-0422-payroll',
          page: 1,
          excerpt: 'Coverage tier requested: Standard or Plus (box not ticked)',
        },
        {
          documentId: 'CLM-24-0422-payroll',
          page: 1,
          excerpt: 'Headcount: 38',
        },
      ],
    },
    {
      key: 'related_claim',
      label: 'Possible duplicate of',
      stage: 'liability',
      value: 'CLM-24-0388',
      status: 'needs_review',
      reason: 'Same claimant, a similar injury a few weeks earlier',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: 'CLM-24-0422-fax',
          page: 2,
          excerpt:
            'Note: same thing happened to Rosalind a few weeks ago, form was sent before',
        },
      ],
    },
  ],
  activity: [
    {
      at: '2025-02-27T07:22:00.000Z',
      actor: 'agent',
      action: 'Read 2 documents',
      detail: 'Page 2 of the fax is faint; read with lower certainty',
    },
    {
      at: '2025-02-27T07:23:00.000Z',
      actor: 'agent',
      action: 'Extracted 5 fields',
    },
    {
      at: '2025-02-27T07:23:00.000Z',
      actor: 'agent',
      action: 'Flagged Policy tier',
      detail:
        'Payroll fits Standard, headcount fits Plus, and the tier box is not ticked',
    },
    {
      at: '2025-02-27T07:23:00.000Z',
      actor: 'agent',
      action: 'Flagged Possible duplicate of',
      detail: 'Same claimant, a similar injury a few weeks earlier',
    },
  ],
}

const nonEnglishClaim: Claim = {
  id: toClaimId('CLM-24-0431'),
  employer: 'Marlow Fields Farms',
  lineOfBusiness: 'workers_comp',
  exceptionReasons: ['non_english_form'],
  agentNote: 'Spanish form; one description needs a check',
  receivedAt: '2025-02-27T10:45:00.000Z',
  flaggedAt: '2025-02-27T10:48:00.000Z',
  assignee: 'Dana Whitcombe',
  state: 'needs_review',
  documents: [
    {
      id: 'CLM-24-0431-form',
      kind: 'form',
      title: 'Employee injury report (Spanish)',
      language: 'es',
      pages: [
        [
          'REPORTE DE LESIÓN DEL EMPLEADO',
          'Empleador: Marlow Fields Farms',
          'Nombre del empleado: Teodoro Valcárcel',
          'Fecha de la lesión: 2025-02-26',
          'Descripción: Me corté la mano izquierda con una cuchilla al cortar cajas en el almacén.',
          'Parte del cuerpo: mano izquierda',
          'Testigo: Anselma Ruiz',
        ].join('\n'),
        [
          'ENGLISH READING (plain-text stand-in, not a certified translation)',
          'EMPLOYEE INJURY REPORT',
          'Employer: Marlow Fields Farms',
          'Employee name: Teodoro Valcárcel',
          'Date of injury: 2025-02-26',
          'Description: I cut my left hand with a blade while cutting boxes in the warehouse.',
          'Body part: left hand',
          'Witness: Anselma Ruiz',
        ].join('\n'),
      ],
    },
    {
      id: 'CLM-24-0431-email',
      kind: 'email',
      title: 'Email from the supervisor',
      language: 'en',
      pages: [
        [
          'From: Anselma Ruiz',
          'To: Claims intake',
          "Subject: Teodoro's report",
          '',
          'Teodoro filled in the form in Spanish. He cut his hand on a box cutter in the packing shed on the 26th. He went to the clinic the same afternoon.',
          '',
          'He works in packing, not in the fields.',
        ].join('\n'),
      ],
    },
    {
      id: 'CLM-24-0431-medical',
      kind: 'medical_report',
      title: 'Clinic note',
      language: 'en',
      pages: [
        [
          'CLINIC NOTE',
          'Patient: Teodoro Valcárcel',
          'Visit date: 2025-02-26',
          'Findings: Laceration, left palm, 3 cm. Sutured. No tendon involvement.',
          'Work status: Light duty for 7 days',
        ].join('\n'),
      ],
    },
  ],
  fields: [
    {
      key: 'claimant_name',
      label: 'Claimant',
      stage: 'intake',
      value: 'Teodoro Valcárcel',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: 'CLM-24-0431-form',
          page: 1,
          excerpt: 'Nombre del empleado: Teodoro Valcárcel',
        },
        {
          documentId: 'CLM-24-0431-medical',
          page: 1,
          excerpt: 'Patient: Teodoro Valcárcel',
        },
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
        {
          documentId: 'CLM-24-0431-form',
          page: 1,
          excerpt: 'Fecha de la lesión: 2025-02-26',
        },
        {
          documentId: 'CLM-24-0431-medical',
          page: 1,
          excerpt: 'Visit date: 2025-02-26',
        },
      ],
    },
    {
      key: 'injury_description',
      label: 'Injury description',
      stage: 'intake',
      value: 'Cut left hand on a blade while cutting boxes',
      status: 'needs_review',
      reason:
        'Read from a Spanish form; the form says warehouse and the supervisor says packing shed',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: 'CLM-24-0431-form',
          page: 1,
          excerpt:
            'Me corté la mano izquierda con una cuchilla al cortar cajas en el almacén.',
        },
        {
          documentId: 'CLM-24-0431-form',
          page: 2,
          excerpt:
            'I cut my left hand with a blade while cutting boxes in the warehouse.',
        },
        {
          documentId: 'CLM-24-0431-email',
          page: 1,
          excerpt: 'in the packing shed on the 26th',
        },
      ],
    },
    {
      key: 'injury_detail',
      label: 'Injury detail',
      stage: 'damages',
      value: 'Laceration, left palm, 3 cm, sutured',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: 'CLM-24-0431-medical',
          page: 1,
          excerpt:
            'Laceration, left palm, 3 cm. Sutured. No tendon involvement.',
        },
      ],
    },
    {
      key: 'work_status',
      label: 'Work status',
      stage: 'damages',
      value: 'Light duty for 7 days',
      status: 'verified',
      resolvedBy: 'agent',
      sources: [
        {
          documentId: 'CLM-24-0431-medical',
          page: 1,
          excerpt: 'Work status: Light duty for 7 days',
        },
      ],
    },
  ],
  activity: [
    {
      at: '2025-02-27T10:47:00.000Z',
      actor: 'agent',
      action: 'Read 3 documents',
      detail:
        'The injury report is in Spanish; an English reading was prepared',
    },
    {
      at: '2025-02-27T10:48:00.000Z',
      actor: 'agent',
      action: 'Extracted 5 fields',
    },
    {
      at: '2025-02-27T10:48:00.000Z',
      actor: 'agent',
      action: 'Flagged Injury description',
      detail:
        'Read from a Spanish form; the form says warehouse and the supervisor says packing shed',
    },
  ],
}

export const detailedClaims: Claim[] = [
  classCodeClaim,
  duplicateClaim,
  nonEnglishClaim,
]
