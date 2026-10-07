import { createContext, useContext, useEffect, useRef } from 'react'
import type { Shortcut, ShortcutRegistry } from './shortcuts'

export const ShortcutRegistryContext = createContext<ShortcutRegistry | null>(
  null,
)

export function useShortcutRegistry(): ShortcutRegistry {
  const registry = useContext(ShortcutRegistryContext)
  if (!registry) {
    throw new Error('useShortcut must be used inside a ShortcutProvider.')
  }
  return registry
}

/**
 * Registers a shortcut while the calling component is mounted. The handler may
 * change on every render without re-registering.
 */
export function useShortcut(
  { id, key, description }: Omit<Shortcut, 'handler'>,
  handler: () => void,
): void {
  const registry = useShortcutRegistry()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(
    () =>
      registry.register({
        id,
        key,
        description,
        handler: () => handlerRef.current(),
      }),
    [registry, id, key, description],
  )
}
