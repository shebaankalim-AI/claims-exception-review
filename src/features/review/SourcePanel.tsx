import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { buttonSecondary, card } from '@/components/controls'
import { Icon } from '@/components/Icon'
import type { Claim, Field } from '@/domain'
import { DocumentBody } from './DocumentBody'

type SourcePanelProps = {
  claim: Claim
  field: Field | undefined
  /** Whether the examiner can still act on the claim. */
  canAct: boolean
  requested: ReadonlySet<string>
  onRequest: (key: string) => void
}

// The title is already shown in the header, so a first line that only repeats
// it ("FIRST REPORT FORM") is dropped rather than shown twice.
function withoutTitleLine(page: string, title: string): string {
  const [first, ...rest] = page.split('\n')
  return first.trim().toLowerCase() === title.trim().toLowerCase()
    ? rest.join('\n')
    : page
}

// Fixed height when stacked under the fields; the visible area when beside them.
const frame = `${card} flex max-h-source flex-col overflow-hidden @review-wide:max-h-source-wide`

function Empty({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Source" className={frame}>
      <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
        {children}
      </div>
    </section>
  )
}

/** Where the selected field's value came from, with the passage highlighted. */
export function SourcePanel({
  claim,
  field,
  canAct,
  requested,
  onRequest,
}: SourcePanelProps) {
  // The parent keys this panel by field, so a new field starts on its first source.
  const [sourceIndex, setSourceIndex] = useState(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Bring the highlighted passage into view inside the panel only, so the page
  // itself doesn't jump.
  useEffect(() => {
    const body = bodyRef.current
    const mark = body?.querySelector<HTMLElement>('[data-highlight]')
    if (body && mark) {
      body.scrollTop = Math.max(0, mark.offsetTop - body.clientHeight / 3)
    }
  }, [field?.key, sourceIndex])

  if (!field) {
    return (
      <Empty>
        <p className="text-ink-muted">
          Select a field to see where it came from.
        </p>
      </Empty>
    )
  }

  if (field.status === 'missing') {
    return (
      <Empty>
        <span className="flex size-10 items-center justify-center rounded-full bg-missing-soft text-missing">
          <Icon name="stateMissing" size="lg" />
        </span>
        <p className="font-semibold">No document yet</p>
        <p className="max-w-sm text-sm text-ink-muted">
          {field.expectedIn
            ? `${field.label} would normally be in ${field.expectedIn}.`
            : `Nothing on file for ${field.label} yet.`}
        </p>
        {canAct &&
          (requested.has(field.key) ? (
            <p className="flex items-center gap-1 text-sm text-ink-muted">
              <Icon name="info" />
              Document requested. Nothing is sent in this prototype.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onRequest(field.key)}
              className={`${buttonSecondary} mt-2`}
            >
              Request document
            </button>
          ))}
      </Empty>
    )
  }

  const source = field.sources[Math.min(sourceIndex, field.sources.length - 1)]
  const document = claim.documents.find((d) => d.id === source?.documentId)
  const pageNumber = source?.page ?? 1
  const page = document?.pages[pageNumber - 1]
  if (!source || !document || page === undefined) {
    return (
      <Empty>
        <p className="text-ink-muted">No source is recorded for this value.</p>
      </Empty>
    )
  }

  const titleOf = (id: string) =>
    claim.documents.find((d) => d.id === id)?.title ?? 'Document'

  return (
    <section aria-labelledby="source-heading" className={frame}>
      <div className="flex flex-col gap-1 border-b border-border px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-ink-muted">
            <Icon name="document" />
          </span>
          <h2 id="source-heading" className="min-w-0 truncate font-semibold">
            {document.title}
          </h2>
          <span className="ml-auto shrink-0 text-sm text-ink-muted tabular-nums">
            Page {pageNumber} of {document.pages.length}
          </span>
        </div>
        <p className="text-sm text-ink-muted">
          Showing where {field.label} came from
        </p>
        {field.sources.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1" aria-label="Sources">
            {field.sources.map((s, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={i === sourceIndex}
                onClick={() => setSourceIndex(i)}
                className={`focus-ring rounded-sm border px-2 py-0.5 text-xs font-medium ${
                  i === sourceIndex
                    ? 'border-accent-border bg-accent-soft text-accent'
                    : 'border-border text-ink-muted hover:bg-surface-muted'
                }`}
              >
                {titleOf(s.documentId)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div
        ref={bodyRef}
        className="focus-ring relative min-h-0 flex-1 overflow-auto px-5 py-4 text-base leading-relaxed"
      >
        <DocumentBody
          // A new key replays the fade-in for each field and each source tab.
          key={`${field.key}-${sourceIndex}`}
          document={document}
          text={withoutTitleLine(page, document.title)}
          excerpt={source.excerpt}
          highlight={source.highlight}
        />
      </div>
    </section>
  )
}
