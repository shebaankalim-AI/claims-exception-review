import type { ExceptionReason, LineOfBusiness } from '@/domain'
import type { AgeOptionId } from './labels'

export type FilterState = {
  reason: ExceptionReason | ''
  line: LineOfBusiness | ''
  age: AgeOptionId
}

export const NO_FILTERS: FilterState = { reason: '', line: '', age: 'any' }

export function hasActiveFilters(filters: FilterState): boolean {
  return filters.reason !== '' || filters.line !== '' || filters.age !== 'any'
}
