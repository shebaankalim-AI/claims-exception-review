import type { ReactNode } from 'react'
import type { ClaimDocument } from '@/domain'

type DocumentBodyProps = {
  document: ClaimDocument
  /** The page's text, title line already removed. */
  text: string
  /** The passage the field was read from. Its line is found in the page. */
  excerpt: string
  /** The exact words inside the passage to mark, when the data names them. */
  highlight?: string
}

const LABELLED = /^([^:]{1,40}):\s+(.*)$/

/**
 * What to mark inside the line: the named words if they are there, otherwise the
 * value part of the passage (after "Label: "), otherwise the whole passage.
 */
function markedRange(
  line: string,
  excerpt: string,
  highlight: string | undefined,
): [number, number] | null {
  const candidates = [highlight, LABELLED.exec(excerpt)?.[2], excerpt]
  for (const words of candidates) {
    if (!words) continue
    const at = line.indexOf(words)
    if (at >= 0) return [at, at + words.length]
  }
  return null
}

// A highlighter pen on the words: marked text, a heavier weight and an
// underline, so it never relies on colour alone. It adds no layout of its own,
// so nothing around it moves. The fade-in replays whenever the panel remounts.
function Mark({ children }: { children: ReactNode }) {
  return (
    <mark
      data-highlight
      className="highlight-mark box-decoration-clone rounded-mark bg-highlight-bg px-0.75 font-semibold text-ink underline decoration-highlight-line decoration-2 underline-offset-3"
    >
      {children}
    </mark>
  )
}

function Marked({
  text,
  range,
}: {
  text: string
  range: [number, number] | null
}) {
  if (!range) return <>{text}</>
  return (
    <>
      {text.slice(0, range[0])}
      <Mark>{text.slice(range[0], range[1])}</Mark>
      {text.slice(range[1])}
    </>
  )
}

type Ctx = {
  lines: string[]
  hit: number
  excerpt: string
  highlight: string | undefined
}

const rangeFor = (ctx: Ctx, i: number, text: string) =>
  i === ctx.hit ? markedRange(text, ctx.excerpt, ctx.highlight) : null

function Transcript(ctx: Ctx) {
  return (
    <div className="flex flex-col gap-2">
      {ctx.lines.map((line, i) => {
        const match = /^(Agent|Caller):\s*(.*)$/.exec(line)
        if (!match) {
          return (
            <div key={i} className="px-3 py-1 text-sm text-ink-muted">
              <Marked text={line} range={rangeFor(ctx, i, line)} />
            </div>
          )
        }
        const [, speaker, said] = match
        // Neutral tints only: the agent's lines sit on a slightly different
        // background from the caller's, nothing more.
        const tint = speaker === 'Agent' ? 'bg-surface-muted' : 'bg-edited-soft'
        return (
          <div key={i} className={`rounded-md px-3 py-2 ${tint}`}>
            <span className="block text-xs font-medium tracking-wide text-ink-muted uppercase">
              {speaker}
            </span>
            <Marked text={said} range={rangeFor(ctx, i, said)} />
          </div>
        )
      })}
    </div>
  )
}

function Form(ctx: Ctx) {
  return (
    <div className="flex flex-col">
      {ctx.lines.map((line, i) => {
        const match = LABELLED.exec(line)
        if (!match) {
          return line.trim() === '' ? null : (
            <div
              key={i}
              className="px-2 pt-3 pb-1 text-xs font-medium text-ink-muted"
            >
              {line}
            </div>
          )
        }
        const [, label, value] = match
        return (
          <div
            key={i}
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-b border-border px-2 py-2 last:border-b-0"
          >
            <span className="text-sm text-ink-muted">{label}</span>
            <span>
              <Marked text={value} range={rangeFor(ctx, i, value)} />
            </span>
          </div>
        )
      })}
    </div>
  )
}

function PayStub(ctx: Ctx) {
  const rows = ctx.lines
    .map((line, i) => ({ match: LABELLED.exec(line), i }))
    .filter((r): r is { match: RegExpExecArray; i: number } => r.match !== null)
  const gross = rows.find((r) => r.match[1] === 'Gross pay for the week')

  return (
    <table className="w-full border-collapse text-left">
      <tbody>
        {rows.map(({ match, i }) => (
          <tr key={i} className="border-b border-border">
            <th
              scope="row"
              className="py-2 pr-3 pl-2 text-sm font-normal text-ink-muted"
            >
              {match[1]}
            </th>
            <td className="py-2 pr-2 tabular-nums">
              <Marked text={match[2]} range={rangeFor(ctx, i, match[2])} />
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

function Plain(ctx: Ctx) {
  return (
    <div className="flex flex-col">
      {ctx.lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-3" />
        ) : (
          <div key={i} className="px-2 py-0.5">
            <Marked text={line} range={rangeFor(ctx, i, line)} />
          </div>
        ),
      )}
    </div>
  )
}

/** Renders a page the way its document type looks: a conversation, a form, a pay stub, or plain text. */
export function DocumentBody({
  document,
  text,
  excerpt,
  highlight,
}: DocumentBodyProps) {
  const lines = text.split('\n')
  const ctx: Ctx = {
    lines,
    hit: lines.findIndex((line) => line.includes(excerpt)),
    excerpt,
    highlight,
  }

  switch (document.kind) {
    case 'transcript':
      return <Transcript {...ctx} />
    case 'froi':
    case 'form':
      return <Form {...ctx} />
    case 'pay_stub':
      return <PayStub {...ctx} />
    default:
      return <Plain {...ctx} />
  }
}
