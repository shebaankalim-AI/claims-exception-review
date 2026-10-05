// Keys are single characters with no modifier, so they cannot clash with
// browser or OS shortcuts (which use Ctrl, Cmd or Alt). Review actions will
// need keys later, so these leave the common letters free.
export const SHORTCUTS = {
  toggleAiPanel: {
    id: 'toggle-ai-panel',
    key: ']',
    description: 'Show or hide the AI panel',
  },
  goToQueue: {
    id: 'go-to-queue',
    key: 'q',
    description: 'Go to the exception queue',
  },
  focusSearch: {
    id: 'focus-search',
    key: '/',
    description: 'Focus the search box',
  },
} as const
