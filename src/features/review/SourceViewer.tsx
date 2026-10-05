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
      className="flex flex-col gap-2 rounded-md border border-slate-200 bg-surface p-4"
    >
      <h2
        id="source-heading"
        className="text-xs font-medium tracking-wide text-slate-600 uppercase"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function SourceViewer({ claim, field }: SourceViewerProps) {
  if (!field) {
    return (
      <Frame title="Source">
        <p className="text-slate-600">
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
        <p className="text-slate-600">
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
  const page = document?.pages[(source?.page ?? 1) - 1]
  if (!source || !document || page === undefined) {
    return (
      <Frame title="Source">
        <p className="text-slate-600">No source is recorded for this value.</p>
      </Frame>
    )
  }

  const at = page.indexOf(source.excerpt)
  return (
    <Frame title={document.title}>
      <p className="text-xs text-slate-600">
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
            <mark className="border-l-4 border-needs-review bg-needs-review-soft px-1 text-slate-900">
              {source.excerpt}
            </mark>
            {page.slice(at + source.excerpt.length)}
          </>
        )}
      </div>
    </Frame>
  )
}
