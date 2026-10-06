import { useState } from 'react'
import { useChatThreads } from '@/lib/chat'
import type { AssistantConfig } from './assistant'
import { ChatTab } from './ChatTab'
import { KeyHint } from './KeyHint'
import { PromptBar } from './PromptBar'
import { SHORTCUTS } from './shortcutDefinitions'

type AiPanelProps = {
  open: boolean
  onToggle: () => void
  assistant: AssistantConfig
}

type Tab = 'summary' | 'chat'

const NO_MESSAGES: never[] = []

export function AiPanel({ open, onToggle, assistant }: AiPanelProps) {
  const toggleLabel = open ? 'Collapse AI panel' : 'Expand AI panel'
  const [tab, setTab] = useState<Tab>('summary')
  const { threads, typing, send } = useChatThreads()
  const messages = threads[assistant.threadKey] ?? NO_MESSAGES
  const isTyping = typing.has(assistant.threadKey)

  // A line sweeps across the top each time the panel opens. A new key restarts
  // it; the counter is adjusted during render, as the open state changes.
  const [wasOpen, setWasOpen] = useState(open)
  const [sweeps, setSweeps] = useState(0)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setSweeps((n) => n + 1)
  }

  const sendMessage = (text: string) => {
    // Asking from the summary shows the answer where it will appear.
    setTab('chat')
    send(assistant.threadKey, text, assistant.reply)
  }

  return (
    <aside
      aria-label="AI panel"
      className={`relative isolate col-start-3 row-start-2 flex flex-col overflow-hidden border-l border-border panel-surface text-sm leading-normal ${
        open ? 'w-panel' : 'w-panel-collapsed'
      }`}
    >
      {open && <span key={sweeps} aria-hidden="true" className="glow-trace" />}
      <div
        className={`flex h-12 shrink-0 items-center gap-2 px-3 ${
          open ? 'justify-between' : 'justify-center px-0'
        }`}
      >
        {open && <h2 className="text-sm font-semibold">Assistant</h2>}
        <button
          type="button"
          onClick={onToggle}
          aria-label={toggleLabel}
          aria-expanded={open}
          aria-controls="ai-panel-body"
          aria-keyshortcuts={SHORTCUTS.toggleAiPanel.key}
          className="focus-ring flex h-6 items-center gap-1 rounded-sm px-1 text-ink-muted hover:bg-surface-hover hover:text-ink"
        >
          <span aria-hidden="true">{open ? '›' : '‹'}</span>
          {open && <KeyHint>{SHORTCUTS.toggleAiPanel.key}</KeyHint>}
        </button>
      </div>

      <div
        id="ai-panel-body"
        hidden={!open}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {/* A neutral track with a white pill on the active tab. */}
        <div className="shrink-0 px-3 pb-2.5">
          <div className="flex gap-1 rounded-track bg-tab-track p-0.75">
            {(['summary', 'chat'] as const).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
                className={`focus-ring flex h-8 flex-1 items-center justify-center gap-2 rounded-sm text-sm transition-colors duration-(--duration-hover) motion-reduce:transition-none ${
                  tab === id
                    ? 'bg-surface font-semibold text-ink shadow-card'
                    : 'font-medium text-ink-muted hover:bg-surface/60'
                }`}
              >
                {id === 'summary' ? 'Summary' : 'Chat'}
                {id === 'chat' && messages.length > 0 && (
                  <span className="rounded-full bg-accent-soft px-1.5 text-xs text-accent tabular-nums">
                    {messages.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* The only scroll area in the panel. Bottom padding keeps the last card clear of the prompt bar. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
          {tab === 'summary' ? (
            assistant.summary
          ) : (
            <ChatTab
              messages={messages}
              typing={isTyping}
              chips={assistant.chips}
              onSend={sendMessage}
            />
          )}
        </div>

        <div className="shrink-0 px-3 pt-1 pb-3">
          <PromptBar
            key={assistant.threadKey}
            placeholder={assistant.placeholder}
            typing={isTyping}
            onSend={sendMessage}
          />
        </div>
      </div>
    </aside>
  )
}
