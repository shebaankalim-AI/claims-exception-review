import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import type { ClaimDocument } from '@/domain'

type DocumentBodyProps = {
  document: ClaimDocument
  /** The page's text, title line already removed. */
  text: string
  /** The passage to highlight. Its whole line is marked. */
  excerpt: string
}

// Marked with a background, a bar and a word, so it isn't colour alone.
// data-highlight lets the panel scroll it into view.
const highlightBox = 'border-l-3 border-needs-review bg-needs-review-soft'

function HighlightLabel() {
  return (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1 self-start text-xs font-medium text-needs-review">
      <Icon name="stateNeedsReview" />
      Highlighted
    </span>
  )
}

function Line({
  highlighted,
  className = '',
  children,
}: {
  highlighted: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      data-highlight={highlighted || undefined}
      className={`flex gap-3 ${highlighted ? `${highlightBox} rounded-r-sm` : ''} ${className}`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {highlighted && <HighlightLabel />}
    </div>
  )
}

const LABELLED = /^([^:]{1,40}):\s+(.*)$/

function Transcript({ lines, hit }: { lines: string[]; hit: number }) {
  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, i) => {
        const match = /^(Agent|Caller):\s*(.*)$/.exec(line)
        if (!match) {
          return (
            <Line key={i} highlighted={i === hit} className="px-3 py-1">
              <span className="text-sm text-ink-muted">{line}</span>
            </Line>
          )
        }
        const [, speaker, said] = match
        // Neutral tints only: the agent's lines sit on a slightly different
        // background from the caller's, nothing more.
        const tint = speaker === 'Agent' ? 'bg-surface-muted' : 'bg-edited-soft'
        return (
          <Line
            key={i}
            highlighted={i === hit}
            className={`rounded-md px-3 py-2 ${i === hit ? '' : tint}`}
          >
            <span className="block text-xs font-medium tracking-wide text-ink-muted uppercase">
              {speaker}
            </span>
            {said}
          </Line>
        )
      })}
    </div>
  )
}

function Form({ lines, hit }: { lines: string[]; hit: number }) {
  return (
    <div className="flex flex-col">
      {lines.map((line, i) => {
        const match = LABELLED.exec(line)
        if (!match) {
          return line.trim() === '' ? null : (
            <Line key={i} highlighted={i === hit} className="px-2 pt-3 pb-1">
              <span className="text-xs font-medium text-ink-muted">{line}</span>
            </Line>
          )
        }
        const [, label, value] = match
        return (
          <Line
            key={i}
            highlighted={i === hit}
            className="border-b border-border px-2 py-2 last:border-b-0"
          >
            <span className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
              <span className="text-sm text-ink-muted">{label}</span>
              <span>{value}</span>
            </span>
          </Line>
        )
      })}
    </div>
  )
}

function PayStub({ lines, hit }: { lines: string[]; hit: number }) {
  const rows = lines
    .map((line, i) => ({ match: LABELLED.exec(line), i }))
    .filter((r): r is { match: RegExpExecArray; i: number } => r.match !== null)
  const gross = rows.find((r) => r.match[1] === 'Gross pay for the week')

  return (
    <table className="w-full border-collapse text-left">
      <tbody>
        {rows.map(({ match, i }) => (
          <tr
            key={i}
            data-highlight={i === hit || undefined}
            className={`border-b border-border ${i === hit ? 'bg-needs-review-soft' : ''}`}
          >
            <th
              scope="row"
              className={`py-2 pr-3 pl-2 text-sm font-normal text-ink-muted ${
                i === hit ? 'border-l-3 border-needs-review' : ''
              }`}
            >
              {match[1]}
            </th>
            <td className="py-2 pr-2 tabular-nums">
              <span className="flex gap-3">
                <span className="flex-1">{match[2]}</span>
                {i === hit && <HighlightLabel />}
              </span>
            </td>
          </tr>
        ))}
        {/* A weekly stub's gross pay is the weekly wage; shown so it can be compared. */}
        {gross && (
          <tr>
            <th
              scope="row"
              className="py-2 pr-3 pl-2 text-sm font-normal text-ink-muted"
            >
              Average weekly wage
            </th>
            <td className="py-2 pr-2 tabular-nums">
              {gross.match[2]}{' '}
              <span className="text-sm text-ink-muted">(from gross pay)</span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

function Plain({ lines, hit }: { lines: string[]; hit: number }) {
  return (
    <div className="flex flex-col">
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-3" />
        ) : (
          <Line key={i} highlighted={i === hit} className="px-2 py-0.5">
            {line}
          </Line>
        ),
      )}
    </div>
  )
}

/** Renders a page the way its document type looks: a conversation, a form, a pay stub, or plain text. */
export function DocumentBody({ document, text, excerpt }: DocumentBodyProps) {
  const lines = text.split('\n')
  const hit = lines.findIndex((line) => line.includes(excerpt))

  switch (document.kind) {
    case 'transcript':
      return <Transcript lines={lines} hit={hit} />
    case 'froi':
    case 'form':
      return <Form lines={lines} hit={hit} />
    case 'pay_stub':
      return <PayStub lines={lines} hit={hit} />
    default:
      return <Plain lines={lines} hit={hit} />
  }
}
