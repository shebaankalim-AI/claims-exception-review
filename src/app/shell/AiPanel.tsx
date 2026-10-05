import type { ReactNode } from 'react'
import { KeyHint } from './KeyHint'
import { SHORTCUTS } from './shortcutDefinitions'

type AiPanelProps = {
  open: boolean
  onToggle: () => void
  children?: ReactNode
}

export function AiPanel({ open, onToggle, children }: AiPanelProps) {
  const toggleLabel = open ? 'Collapse AI panel' : 'Expand AI panel'

  return (
    <aside
      aria-label="AI panel"
      className={`col-start-3 row-start-2 flex flex-col border-l border-slate-200 bg-surface ${
        open ? 'w-panel' : 'w-panel-collapsed'
      }`}
    >
      <div
        className={`flex h-row items-center gap-2 border-b border-slate-200 px-2 ${
          open ? 'justify-between' : 'justify-center'
        }`}
      >
        {open && <h2 className="font-medium">AI panel</h2>}
        <button
          type="button"
          onClick={onToggle}
          aria-label={toggleLabel}
          aria-expanded={open}
          aria-controls="ai-panel-body"
          aria-keyshortcuts={SHORTCUTS.toggleAiPanel.key}
          className="focus-ring flex h-6 items-center gap-1 rounded-sm px-1 hover:bg-slate-100"
        >
          <span aria-hidden="true">{open ? '›' : '‹'}</span>
          {open && <KeyHint>{SHORTCUTS.toggleAiPanel.key}</KeyHint>}
        </button>
      </div>
      <div id="ai-panel-body" hidden={!open} className="overflow-auto p-3">
        {children ?? (
          <p className="text-slate-600">
            Placeholder for the AI panel. What the agent did, why, and what it
            read will appear here.
          </p>
        )}
      </div>
    </aside>
  )
}
