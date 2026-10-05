type QueueScreenProps = {
  /** Temporary: only proves screen switching works. Removed when the queue lists real rows. */
  onOpenSampleClaim: () => void
}

export function QueueScreen({ onOpenSampleClaim }: QueueScreenProps) {
  return (
    <section aria-labelledby="queue-heading" className="p-6">
      <h1 id="queue-heading" className="text-xl font-semibold">
        Exceptions
      </h1>
      <p className="mt-2 text-slate-600">
        Placeholder for the exception queue. The list of claims that need an
        examiner, with filters and a preview, will go here.
      </p>
      <button
        type="button"
        onClick={onOpenSampleClaim}
        className="focus-ring mt-4 h-row rounded-md border border-slate-300 bg-surface px-3 hover:bg-slate-100"
      >
        Open sample claim
      </button>
    </section>
  )
}
