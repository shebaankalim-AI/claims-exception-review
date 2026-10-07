# 0007: Inter as the interface font

**Status:** Accepted

## Context

The interface used the system font stack. It renders differently on every machine, its figures are proportional by default, and some system fonts set dense 13–14px text poorly. Examiners read claim IDs, ages, times and amounts all day, so figures that line up in columns matter, and so does one look that holds on every machine.

## Decision

Add `@fontsource-variable/inter` as a runtime dependency and make Inter the base font, with the system stack as the fallback. It is self-hosted: the font files ship with the app, so no request goes to a font service. Tabular figures are switched on for IDs, ages, times and counts.

Considered:

- **The system font stack:** no dependency, but uneven across machines, and tabular figures depend on the font the system happens to have.
- **Loading Inter from a font service:** no package, but every page view then calls a third party, which a claims tool shouldn't do, and it fails offline.

## Consequences

- One runtime dependency and a few hundred kilobytes of font files, loaded once and cached. The variable font covers every weight in one file.
- Text looks the same for everyone, and numbers line up in tables.
- Swapping the font later means changing one import and the `--font-sans` token.
