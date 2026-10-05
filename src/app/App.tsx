import { useState } from 'react'
import type { ClaimId } from '@/domain'
import {
  oldestFirst,
  QueueDigest,
  QueueScreen,
  useQueue,
} from '@/features/queue'
import { ReviewScreen } from '@/features/review'
import { AppProviders } from './AppProviders'
import { CURRENT_USER } from './currentUser'
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

  // Claims filed in this session, so "Next claim" doesn't offer them again.
  // The queue list is the one from the last visit to the queue.
  const [filedIds, setFiledIds] = useState<readonly ClaimId[]>([])
  const nextClaimId =
    screen.name === 'review' && queue.state.status === 'ready'
      ? (oldestFirst(queue.state.claims).find(
          (c) => c.id !== screen.claimId && !filedIds.includes(c.id),
        )?.id ?? null)
      : null

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
        <ReviewScreen
          key={screen.claimId}
          claimId={screen.claimId}
          examinerName={CURRENT_USER.name}
          nextClaimId={nextClaimId}
          onBack={goToQueue}
          onOpenClaim={openClaim}
          onFiled={(id) => setFiledIds((ids) => [...ids, id])}
        />
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
