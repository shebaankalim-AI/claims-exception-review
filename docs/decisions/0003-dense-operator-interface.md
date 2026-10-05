# 0003: Dense operator-tool interface

**Status:** Proposed (pending confirmation of the visual direction)

## Context

The people who use this screen are examiners who work in it for hours, replacing software they have used for years. Two directions were considered: a dense operator tool, in the spirit of a mail client or a trading terminal, and a lighter, more spacious SaaS look.

## Decision

Go with the dense operator tool:

- 13px base type, rows around 32px, tabular numerals for IDs and amounts.
- A restrained neutral palette with a single accent colour, and colour used for state, not decoration.
- Explicit state everywhere, keyboard-first, and no decorative motion.

## Consequences

- More information per screen and faster repeated tasks, at the cost of a steeper first impression for someone who has never used it.
- Density makes accessibility more important: contrast, focus rings and a minimum comfortable hit area stay non-negotiable.
- If the direction changes, only tokens and a few components change. The structure in ARCHITECTURE.md doesn't depend on it.
