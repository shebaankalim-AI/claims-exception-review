import type { ClaimId } from '@/domain'

type ReviewScreenProps = {
  claimId: ClaimId
  /** Goes back to the queue. The app owns which screen is showing. */
  onBack: () => void
}

export function ReviewScreen({ claimId, onBack }: ReviewScreenProps) {
  return (
    <section aria-labelledby="review-heading" className="p-6">
      <button
        type="button"
        onClick={onBack}
        className="focus-ring rounded-sm text-accent hover:underline"
      >
        <span aria-hidden="true">← </span>Exceptions
      </button>
      <h1 id="review-heading" className="mt-3 text-xl font-semibold">
        Review <span className="tabular-nums">{claimId}</span>
      </h1>
      <p className="mt-2 text-slate-600">
        Placeholder for the review screen. The extracted fields, the source
        documents and the approve and send-back actions will go here.
      </p>
    </section>
  )
}
