import { Icon } from '@/components/Icon'
import {
  AGE_OPTIONS,
  LINE_LABELS,
  LINES,
  REASON_LABELS,
  REASONS,
} from './labels'
import type { AgeOptionId } from './labels'
import type { FilterState } from './filterState'

const selectClass =
  'focus-ring h-row rounded-md border border-slate-300 bg-surface px-2'

type QueueFiltersProps = {
  filters: FilterState
  onChange: (filters: FilterState) => void
  /** Shown beside the filters. The empty-result card has its own button instead. */
  showClear: boolean
  onClear: () => void
}

export function QueueFilters({
  filters,
  onChange,
  showClear,
  onClear,
}: QueueFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-slate-600">
        Reason
        <select
          className={selectClass}
          value={filters.reason}
          onChange={(e) =>
            onChange({
              ...filters,
              reason: e.target.value as FilterState['reason'],
            })
          }
        >
          <option value="">All reasons</option>
          {REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {REASON_LABELS[reason]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-slate-600">
        Line
        <select
          className={selectClass}
          value={filters.line}
          onChange={(e) =>
            onChange({
              ...filters,
              line: e.target.value as FilterState['line'],
            })
          }
        >
          <option value="">All lines</option>
          {LINES.map((line) => (
            <option key={line} value={line}>
              {LINE_LABELS[line]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-slate-600">
        Age
        <select
          className={selectClass}
          value={filters.age}
          onChange={(e) =>
            onChange({ ...filters, age: e.target.value as AgeOptionId })
          }
        >
          {AGE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className="focus-ring h-row rounded-md px-2 text-accent hover:underline"
        >
          Clear filters
        </button>
      )}

      <p className="ml-auto flex h-row items-center gap-1 text-slate-600">
        <Icon name="sort" />
        Sorted: Oldest first
      </p>
    </div>
  )
}
