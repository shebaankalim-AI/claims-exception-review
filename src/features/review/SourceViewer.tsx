import type { Claim, Field } from '@/domain'

type SourceViewerProps = {
  claim: Claim
  field: Field | undefined
}

function Frame({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby="source-heading"
      className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4"
    >
      <h2
        id="source-heading"
        className="text-xs font-medium tracking-wide text-ink-muted uppercase"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

// The title is already shown above the text, so a first line that only repeats it
// ("FIRST REPORT FORM") is dropped rather than shown twice.
function withoutTitleLine(page: string, title: string): string {
  const [first, ...rest] = page.split('\n')
  return first.trim().toLowerCase() === title.trim().toLowerCase()
    ? rest.join('\n')
    : page
}

export function SourceViewer({ claim, field }: SourceViewerProps) {
  if (!field) {
    return (
      <Frame title="Source">
        <p className="text-ink-muted">
          Select a field to see where it came from.
        </p>
      </Frame>
    )
  }

  // Nothing was read for a missing field, so there is nothing to point at.
  if (field.status === 'missing') {
    return (
      <Frame title="Source">
        <p className="font-medium">Missing: {field.label}</p>
        <p className="text-ink-muted">
          Nothing on file yet.{' '}
          {field.expectedIn
            ? `This would normally be in ${field.expectedIn}.`
            : 'Ask the employer to send it.'}
        </p>
      </Frame>
    )
  }

  const source = field.sources[0]
  const document = claim.documents.find((d) => d.id === source?.documentId)
  const rawPage = document?.pages[(source?.page ?? 1) - 1]
  if (!source || !document || rawPage === undefined) {
    return (
      <Frame title="Source">
        <p className="text-ink-muted">No source is recorded for this value.</p>
      </Frame>
    )
  }

  const page = withoutTitleLine(rawPage, document.title)
  const at = page.indexOf(source.excerpt)
  return (
    <Frame title={document.title}>
      <p className="text-xs text-ink-muted">
        Page {source.page ?? 1} of {document.pages.length}
        {field.sources.length > 1 &&
          `. ${field.sources.length - 1} more source${field.sources.length > 2 ? 's' : ''} for this field.`}
      </p>
      <div className="whitespace-pre-wrap">
        {at < 0 ? (
          page
        ) : (
          <>
            {page.slice(0, at)}
            {/* A background and a left bar, so the passage is not marked by colour alone. */}
            <mark className="border-l-4 border-needs-review bg-needs-review-soft px-1 text-ink">
              {source.excerpt}
            </mark>
            {page.slice(at + source.excerpt.length)}
          </>
        )}
      </div>
    </Frame>
  )
}
