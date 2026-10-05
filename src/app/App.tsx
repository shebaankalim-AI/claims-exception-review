import { useState } from 'react'
import { toClaimId } from '@/domain'
import { QueueScreen } from '@/features/queue'
import { ReviewScreen } from '@/features/review'
import { AppProviders } from './AppProviders'
import type { Screen } from './screen'
import { AppShell } from './shell/AppShell'

// An id from the mock fixtures. Only used to prove that screen switching works.
const SAMPLE_CLAIM_ID = toClaimId('CLM-24-0417')

const QUEUE: Screen = { name: 'queue' }

function Workspace() {
  const [screen, setScreen] = useState<Screen>(QUEUE)
  const goToQueue = () => setScreen(QUEUE)

  return (
    <AppShell onGoToQueue={goToQueue}>
      {screen.name === 'queue' ? (
        <QueueScreen
          onOpenSampleClaim={() =>
            setScreen({ name: 'review', claimId: SAMPLE_CLAIM_ID })
          }
        />
      ) : (
        <ReviewScreen claimId={screen.claimId} onBack={goToQueue} />
      )}
    </AppShell>
  )
}

export default function App() {
  return (
    <AppProviders>
      <Workspace />
    </AppProviders>
  )
}
