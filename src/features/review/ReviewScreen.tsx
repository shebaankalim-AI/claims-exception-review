import type { ClaimId } from '@/domain'

type ReviewScreenProps = {
  claimId: ClaimId
}

export function ReviewScreen({ claimId }: ReviewScreenProps) {
  return (
    <section aria-labelledby="review-heading" className="p-6">
      <h1 id="review-heading" className="text-xl font-semibold">
        Review <span className="tabular-nums">{claimId}</span>
      </h1>
      <p className="mt-2 text-slate-600">
        Placeholder for the review screen. The extracted fields, the source
        documents and the approve and send-back actions will go here.
      </p>
    </section>
  )
}
