import { useState } from 'react'
import type { ClaimId } from '@/domain'
import {
  oldestFirst,
  QueueDigest,
  QueueScreen,
  useQueue,
} from '@/features/queue'
import { ReviewAssistant, ReviewScreen, useReview } from '@/features/review'
import { AppProviders } from './AppProviders'
import { CURRENT_USER } from './currentUser'
import type { Screen } from './screen'
import { AppShell } from './shell/AppShell'

const QUEUE: Screen = { name: 'queue' }

function Workspace() {
  const [screen, setScreen] = useState<Screen>(QUEUE)
  // A line for the queue about what just happened, such as a claim sent back.
  const [notice, setNotice] = useState<string | null>(null)
  const goToQueue = () => setScreen(QUEUE)
  const openClaim = (claimId: ClaimId) => {
    setNotice(null)
    setScreen({ name: 'review', claimId })
  }

  // The queue and the open claim are each loaded here, once, and handed to both
  // the screen and the AI panel beside it, so the two always agree. Features
  // can't import app/, so the app does the sharing.
  const queue = useQueue(screen.name === 'queue')
  const review = useReview(screen.name === 'review' ? screen.claimId : null)

  // Claims finished with in this session (filed, sent back or escalated), so
  // "Next claim" doesn't offer them again. The queue list is the one from the
  // last visit to the queue.
  const [doneIds, setDoneIds] = useState<readonly ClaimId[]>([])
  const markDone = (id: ClaimId) => setDoneIds((ids) => [...ids, id])
  const nextClaimId =
    screen.name === 'review' && queue.state.status === 'ready'
      ? (oldestFirst(queue.state.claims).find(
          (c) => c.id !== screen.claimId && !doneIds.includes(c.id),
        )?.id ?? null)
      : null

  return (
    <AppShell
      onGoToQueue={goToQueue}
      panel={
        screen.name === 'queue' ? (
          <QueueDigest queue={queue} onOpenClaim={openClaim} />
        ) : (
          <ReviewAssistant key={screen.claimId} review={review} />
        )
      }
    >
      {screen.name === 'queue' ? (
        <QueueScreen
          queue={queue}
          onOpenClaim={openClaim}
          notice={notice}
          onDismissNotice={() => setNotice(null)}
        />
      ) : (
        <ReviewScreen
          key={screen.claimId}
          claimId={screen.claimId}
          review={review}
          examinerName={CURRENT_USER.name}
          nextClaimId={nextClaimId}
          onBack={goToQueue}
          onOpenClaim={openClaim}
          onFiled={markDone}
          onHandedOff={(id, message) => {
            markDone(id)
            setNotice(message)
            goToQueue()
          }}
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
