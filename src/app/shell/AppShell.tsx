import { useState } from 'react'
import type { ReactNode } from 'react'
import { useShortcut } from '@/lib/shortcutContext'
import { AiPanel } from './AiPanel'
import type { AssistantConfig } from './assistant'
import { Header } from './Header'
import { SHORTCUTS } from './shortcutDefinitions'
import { SideNav } from './SideNav'

type AppShellProps = {
  onGoToQueue: () => void
  /** What the assistant panel shows for the screen that is open. */
  assistant: AssistantConfig
  children: ReactNode
}

export function AppShell({ onGoToQueue, assistant, children }: AppShellProps) {
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  const toggleNav = () => setNavCollapsed((collapsed) => !collapsed)
  const toggleAiPanel = () => setAiPanelOpen((open) => !open)

  useShortcut(SHORTCUTS.toggleNav, toggleNav)
  useShortcut(SHORTCUTS.toggleAiPanel, toggleAiPanel)
  useShortcut(SHORTCUTS.goToQueue, onGoToQueue)

  return (
    <div className="grid h-screen min-w-app-min grid-cols-[auto_1fr_auto] grid-rows-[auto_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>
      <Header />
      <SideNav
        collapsed={navCollapsed}
        onToggleCollapsed={toggleNav}
        onGoToQueue={onGoToQueue}
      />
      <main
        id="main-content"
        // tabIndex -1 only so the skip link can move focus here. The region is not
        // a control, so it shows no ring when clicked or when it has focus.
        tabIndex={-1}
        className="col-start-2 row-start-2 min-w-0 overflow-auto focus:outline-none focus-visible:outline-none"
      >
        {children}
      </main>
      <AiPanel
        open={aiPanelOpen}
        onToggle={toggleAiPanel}
        assistant={assistant}
      />
    </div>
  )
}
