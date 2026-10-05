import type { Screen } from '../screen'

type BreadcrumbProps = {
  screen: Screen
  onGoToQueue: () => void
}

export function Breadcrumb({ screen, onGoToQueue }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {screen.name === 'queue' ? (
          <li aria-current="page" className="font-medium">
            Exceptions
          </li>
        ) : (
          <>
            <li>
              <button
                type="button"
                onClick={onGoToQueue}
                className="focus-ring rounded-sm text-accent hover:underline"
              >
                Exceptions
              </button>
            </li>
            <li aria-hidden="true" className="text-slate-400">
              /
            </li>
            <li aria-current="page" className="font-medium tabular-nums">
              {screen.claimId}
            </li>
          </>
        )}
      </ol>
    </nav>
  )
}
