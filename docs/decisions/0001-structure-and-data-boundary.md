# 0001: Feature-first structure with a domain/data boundary

**Status:** Accepted

## Context

The prototype will grow past two screens. Mock data is the only data source today, but the interface is designed for a world where an agent platform supplies it, with latency, partial failure and races.

## Decision

- Organize `src/` by feature first, and inside it by layer.
- Put types, the claim state machine and the repository interface in `domain/`, pure TypeScript with no React.
- Put implementations, including the mock, in `data/`.
- `features/` never import `data/`. `app/` wires the repository in through context.
- Enforce the rules with ESLint import restrictions, added in Phase 1.

## Consequences

- Swapping mock data for a real API means changing `app/` and `data/`, not screens.
- The review rules can be tested without a DOM.
- There are more folders and some indirection than a two-screen demo strictly needs. That cost is accepted because the screens will multiply, and because the boundary keeps loading and error states from being skipped.
- Until the lint rules exist, the boundary rests on review. ARCHITECTURE.md says so.
