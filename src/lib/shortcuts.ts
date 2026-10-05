export type Shortcut = {
  /** Stable name, used to unregister and to list shortcuts in a help view. */
  id: string
  /** A KeyboardEvent.key value, e.g. "q" or "]". Matched ignoring case. */
  key: string
  description: string
  handler: () => void
}

export type ShortcutRegistry = {
  /** Returns a function that unregisters the shortcut. Throws on an id or key collision. */
  register(shortcut: Shortcut): () => void
  unregister(id: string): void
  list(): readonly Omit<Shortcut, 'handler'>[]
  /** The single place key events are interpreted. Returns true if one fired. */
  handleKeyDown(event: KeyboardEvent): boolean
}

const TYPING_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

// Letters typed into a field must never trigger an action. closest() rather
// than isContentEditable, which jsdom does not implement.
export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(TYPING_SELECTOR) !== null
}

export function createShortcutRegistry(): ShortcutRegistry {
  const shortcuts = new Map<string, Shortcut>()

  const normalize = (key: string) => key.toLowerCase()

  return {
    register(shortcut) {
      if (shortcuts.has(shortcut.id)) {
        throw new Error(`Shortcut id "${shortcut.id}" is already registered.`)
      }
      const clash = [...shortcuts.values()].find(
        (s) => normalize(s.key) === normalize(shortcut.key),
      )
      if (clash) {
        throw new Error(
          `Key "${shortcut.key}" is already used by "${clash.id}", so "${shortcut.id}" cannot use it.`,
        )
      }
      shortcuts.set(shortcut.id, shortcut)
      // Only remove our own registration: a stale cleanup must not remove a
      // later shortcut that reused the id.
      return () => {
        if (shortcuts.get(shortcut.id) === shortcut) {
          shortcuts.delete(shortcut.id)
        }
      }
    },

    unregister(id) {
      shortcuts.delete(id)
    },

    list() {
      return [...shortcuts.values()].map(({ id, key, description }) => ({
        id,
        key,
        description,
      }))
    },

    handleKeyDown(event) {
      // Modified keys belong to the browser and the OS (Ctrl+F, Alt+Left, ...).
      if (event.ctrlKey || event.metaKey || event.altKey) return false
      // A held key would otherwise toggle things dozens of times a second.
      if (event.repeat) return false
      if (event.defaultPrevented) return false
      if (isTypingTarget(event.target)) return false

      const key = normalize(event.key)
      const match = [...shortcuts.values()].find(
        (s) => normalize(s.key) === key,
      )
      if (!match) return false

      event.preventDefault()
      match.handler()
      return true
    },
  }
}
