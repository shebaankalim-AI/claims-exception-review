import { createShortcutRegistry } from './shortcuts'
import type { Shortcut } from './shortcuts'

function shortcut(overrides: Partial<Shortcut> = {}): Shortcut {
  return {
    id: 'test',
    key: 'q',
    description: 'A test shortcut',
    handler: vi.fn(),
    ...overrides,
  }
}

function press(
  registry: ReturnType<typeof createShortcutRegistry>,
  key: string,
  init: KeyboardEventInit = {},
  target?: Element,
) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  // Dispatching on the target makes event.target real, as a browser would.
  if (target) {
    document.body.append(target)
    target.addEventListener('keydown', () => registry.handleKeyDown(event))
    target.dispatchEvent(event)
    target.remove()
    return event
  }
  registry.handleKeyDown(event)
  return event
}

describe('shortcut registry', () => {
  it('runs the handler for a registered key and prevents the default', () => {
    const registry = createShortcutRegistry()
    const s = shortcut()
    registry.register(s)

    const event = press(registry, 'q')

    expect(s.handler).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('reports whether a shortcut fired', () => {
    const registry = createShortcutRegistry()
    registry.register(shortcut())
    expect(
      registry.handleKeyDown(new KeyboardEvent('keydown', { key: 'q' })),
    ).toBe(true)
    expect(
      registry.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })),
    ).toBe(false)
  })

  it('matches ignoring case', () => {
    const registry = createShortcutRegistry()
    const s = shortcut({ key: 'q' })
    registry.register(s)
    press(registry, 'Q')
    expect(s.handler).toHaveBeenCalledTimes(1)
  })

  it('stops firing after the returned unregister function is called', () => {
    const registry = createShortcutRegistry()
    const s = shortcut()
    const unregister = registry.register(s)
    unregister()
    press(registry, 'q')
    expect(s.handler).not.toHaveBeenCalled()
  })

  it('stops firing after unregister(id)', () => {
    const registry = createShortcutRegistry()
    const s = shortcut()
    registry.register(s)
    registry.unregister('test')
    press(registry, 'q')
    expect(s.handler).not.toHaveBeenCalled()
  })

  it('lets a key be registered again after it is unregistered', () => {
    const registry = createShortcutRegistry()
    registry.register(shortcut()) // first registration is never unregistered via its own handle
    registry.unregister('test')
    const second = shortcut()
    expect(() => registry.register(second)).not.toThrow()
    press(registry, 'q')
    expect(second.handler).toHaveBeenCalledTimes(1)
  })

  it('a stale unregister does not remove a later shortcut with the same id', () => {
    const registry = createShortcutRegistry()
    const staleUnregister = registry.register(shortcut())
    registry.unregister('test')
    const later = shortcut()
    registry.register(later)
    staleUnregister()
    press(registry, 'q')
    expect(later.handler).toHaveBeenCalledTimes(1)
  })

  it('rejects a duplicate id', () => {
    const registry = createShortcutRegistry()
    registry.register(shortcut())
    expect(() => registry.register(shortcut({ key: 'x' }))).toThrow(
      /already registered/,
    )
  })

  it('rejects a key that is already taken, naming the owner', () => {
    const registry = createShortcutRegistry()
    registry.register(shortcut({ id: 'first' }))
    expect(() =>
      registry.register(shortcut({ id: 'second', key: 'Q' })),
    ).toThrow(/used by "first"/)
  })

  it('lists registered shortcuts without their handlers', () => {
    const registry = createShortcutRegistry()
    registry.register(shortcut())
    expect(registry.list()).toEqual([
      { id: 'test', key: 'q', description: 'A test shortcut' },
    ])
  })

  describe('when it should stay out of the way', () => {
    it.each([
      ['an input', () => document.createElement('input')],
      ['a textarea', () => document.createElement('textarea')],
      ['a select', () => document.createElement('select')],
      [
        'a contenteditable element',
        () => {
          const el = document.createElement('div')
          el.setAttribute('contenteditable', 'true')
          return el
        },
      ],
    ])('ignores keys typed into %s', (_name, make) => {
      const registry = createShortcutRegistry()
      const s = shortcut()
      registry.register(s)

      press(registry, 'q', {}, make())

      expect(s.handler).not.toHaveBeenCalled()
    })

    it('still fires from a button, which is not a text field', () => {
      const registry = createShortcutRegistry()
      const s = shortcut()
      registry.register(s)
      press(registry, 'q', {}, document.createElement('button'))
      expect(s.handler).toHaveBeenCalledTimes(1)
    })

    it.each([['ctrlKey'], ['metaKey'], ['altKey']])(
      'ignores a key pressed with %s, which belongs to the browser or OS',
      (modifier) => {
        const registry = createShortcutRegistry()
        const s = shortcut()
        registry.register(s)
        const event = press(registry, 'q', { [modifier]: true })
        expect(s.handler).not.toHaveBeenCalled()
        expect(event.defaultPrevented).toBe(false)
      },
    )

    it('ignores a held-down key repeating', () => {
      const registry = createShortcutRegistry()
      const s = shortcut()
      registry.register(s)
      press(registry, 'q', { repeat: true })
      expect(s.handler).not.toHaveBeenCalled()
    })

    it('leaves unregistered keys alone', () => {
      const registry = createShortcutRegistry()
      registry.register(shortcut())
      const event = press(registry, 'z')
      expect(event.defaultPrevented).toBe(false)
    })
  })
})
