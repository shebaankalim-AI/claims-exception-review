import { useState } from 'react'
import type { ClaimId } from '@/domain'
import {
  oldestFirst,
  QUEUE_CHIPS,
  QUEUE_PLACEHOLDER,
  QueueScreen,
  QueueSummary,
  useQueue,
  useQueueReply,
} from '@/features/queue'
import {
  REVIEW_CHIPS,
  REVIEW_PLACEHOLDER,
  ReviewScreen,
  ReviewSummary,
  reviewReply,
  useReview,
} from '@/features/review'
import { AppProviders } from './AppProviders'
import { CURRENT_USER } from './currentUser'
import type { Screen } from './screen'
import type { AssistantConfig } from './shell/assistant'
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

  // What the assistant panel shows: a summary and canned replies for whichever
  // screen is open, with its own chat thread (the queue's, or the claim's).
  const queueReply = useQueueReply(queue)
  const assistant: AssistantConfig =
    screen.name === 'queue'
      ? {
          threadKey: 'queue',
          summary: <QueueSummary queue={queue} onOpenClaim={openClaim} />,
          placeholder: QUEUE_PLACEHOLDER,
          chips: QUEUE_CHIPS,
          reply: queueReply,
        }
      : {
          threadKey: screen.claimId,
          summary: <ReviewSummary review={review} />,
          placeholder: REVIEW_PLACEHOLDER,
          chips: REVIEW_CHIPS,
          reply: (question) => reviewReply(review, question),
        }

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
    <AppShell onGoToQueue={goToQueue} assistant={assistant}>
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
