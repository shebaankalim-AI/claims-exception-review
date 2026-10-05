import { useState } from 'react'
import type { ClaimId } from '@/domain'
import { QueueDigest, QueueScreen, useQueue } from '@/features/queue'
import { ReviewScreen } from '@/features/review'
import { AppProviders } from './AppProviders'
import type { Screen } from './screen'
import { AppShell } from './shell/AppShell'

const QUEUE: Screen = { name: 'queue' }

function Workspace() {
  const [screen, setScreen] = useState<Screen>(QUEUE)
  const goToQueue = () => setScreen(QUEUE)
  const openClaim = (claimId: ClaimId) => setScreen({ name: 'review', claimId })

  // The queue is loaded here, once per visit, and handed to both the screen and
  // the agent digest. Features can't import app/, so the app does the sharing.
  const queue = useQueue(screen.name === 'queue')

  return (
    <AppShell
      onGoToQueue={goToQueue}
      panel={
        screen.name === 'queue' ? (
          <QueueDigest queue={queue} onOpenClaim={openClaim} />
        ) : undefined
      }
    >
      {screen.name === 'queue' ? (
        <QueueScreen queue={queue} onOpenClaim={openClaim} />
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
