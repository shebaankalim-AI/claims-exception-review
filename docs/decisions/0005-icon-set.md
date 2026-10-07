# 0005: Phosphor as the icon set

**Status:** Accepted

## Context

The app had no icon set: the few symbols so far were text characters. The side nav needs icons now, and the four field states (verified, needs review, missing, edited) need an icon each later, because state is never colour alone. We want one consistent family, with a regular weight for ordinary use and a fill weight for the active or selected state.

## Decision

Add `@phosphor-icons/react` as a runtime dependency. Import only the icons used, as named imports, and only inside one wrapper, `components/Icon.tsx`. The wrapper takes an icon by name, sets the size from a token, and hides decorative icons from assistive technology. Everything else asks for an icon by name and never imports the package.

Considered:

- **lucide-react:** a good, consistent set, but it has a single stroke style. Active versus inactive would need a hand-made variant of each icon.
- **Hand-drawn inline SVG:** no dependency, and full control. But a consistent family means drawing and maintaining every icon ourselves, including the four state icons and their active variants. That is design work with no product value here.

## Consequences

- One new runtime dependency, which adds some size. Named imports keep unused icons out of the production bundle.
- A lint rule keeps the package confined to `components/`, so swapping the set later means editing one file.
- Weights give us active and inactive versions of each icon without extra assets.
- A dev server that pre-bundles a large icon package can start slower. If that shows up, switch to the package's per-icon import paths, inside the same wrapper.
