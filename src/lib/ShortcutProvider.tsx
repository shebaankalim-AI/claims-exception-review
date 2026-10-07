import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ShortcutRegistryContext } from './shortcutContext'
import { createShortcutRegistry } from './shortcuts'

/** Owns the one registry and the one document-level keydown listener. */
export function ShortcutProvider({ children }: { children: ReactNode }) {
  const [registry] = useState(createShortcutRegistry)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      registry.handleKeyDown(event)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [registry])

  return (
    <ShortcutRegistryContext.Provider value={registry}>
      {children}
    </ShortcutRegistryContext.Provider>
  )
}
