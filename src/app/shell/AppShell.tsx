import { useState } from 'react'
import type { ReactNode } from 'react'
import { useShortcut } from '@/lib/shortcutContext'
import type { Screen } from '../screen'
import { AiPanel } from './AiPanel'
import { Header } from './Header'
import { SHORTCUTS } from './shortcutDefinitions'
import { SideNav } from './SideNav'

type AppShellProps = {
  screen: Screen
  onGoToQueue: () => void
  children: ReactNode
}

export function AppShell({ screen, onGoToQueue, children }: AppShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  const toggleAiPanel = () => setAiPanelOpen((open) => !open)

  useShortcut(SHORTCUTS.toggleAiPanel, toggleAiPanel)
  useShortcut(SHORTCUTS.goToQueue, onGoToQueue)

  return (
    <div className="grid h-screen min-w-app-min grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr]">
      <a
        href="#main-content"
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>
      <Header screen={screen} onGoToQueue={onGoToQueue} />
      <SideNav onGoToQueue={onGoToQueue} />
      <main id="main-content" tabIndex={-1} className="min-w-0 overflow-auto">
        {children}
      </main>
      <AiPanel open={aiPanelOpen} onToggle={toggleAiPanel} />
    </div>
  )
}
