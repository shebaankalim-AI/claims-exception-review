import type { ExceptionReason, LineOfBusiness } from '@/domain'

import { LINE_LABELS, REASON_LABELS } from '@/lib/labels'

export { LINE_LABELS, REASON_LABELS }

export const REASONS = Object.keys(REASON_LABELS) as ExceptionReason[]
export const LINES = Object.keys(LINE_LABELS) as LineOfBusiness[]

export const AGE_OPTIONS = [
  { id: 'any', label: 'Any age', minutes: undefined },
  { id: '1h', label: 'Over 1 hour', minutes: 60 },
  { id: '4h', label: 'Over 4 hours', minutes: 4 * 60 },
  { id: '1d', label: 'Over 1 day', minutes: 24 * 60 },
] as const

export type AgeOptionId = (typeof AGE_OPTIONS)[number]['id']
