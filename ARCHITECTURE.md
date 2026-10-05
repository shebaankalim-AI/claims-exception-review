# Architecture

How this prototype is structured, and why. Every section is tagged **Implemented** or **Planned**, because a document that describes a system that doesn't exist is worse than no document. The [status table](#status) at the bottom is updated in every phase.

## 1. What this is, and what it isn't

An independent concept prototype of the screens a claims examiner works in when AI agents do the claims work and a person reviews the exceptions. It is built from public information only. It has **no backend**: every claim, document and agent action is mock data.

It is not a product, and it does not try to model a real claims system. The goal is to show how the interface should behave when an agent does real work: what it did, why, what it read, where it was unsure, and how a person agrees or steps in. The architecture exists to keep that interaction model testable and to make the mocks replaceable.

## 2. Layout

```
src/
  app/          routes and providers; the one place that wires things together
  domain/       types, state machines, repository interfaces; pure TypeScript
  data/         repository implementations; mock/ holds the fixtures
  features/     one folder per feature (queue, review, ...): screens, hooks, local components
  components/   shared UI primitives (the design system)
  lib/          small utilities: keyboard shortcuts, formatting, analytics seam
  styles/       design tokens and global CSS
  test/         test setup and helpers
```

The split inside `src/` is by **feature first**, then by layer. A change request almost always names a screen ("the field list on review"), not a layer in isolation, so everything one piece of work touches lives in one folder.

**Status:** Implemented. All eight folders exist. `app/` holds the providers, the screen switching and the app shell in `app/shell/` (a full-height collapsible side nav; a header with the search box, a settings button and an avatar, spanning the main area and the AI panel; and the AI panel below the header). `domain/` holds the types, the review reducer and the repository interface, and `data/mock/` holds the mock repository and fixtures. `lib/` holds the repository hook and the shortcut registry. `features/` has `queue/`, the exceptions queue with its agent digest, and `review/`, still a labelled placeholder. `components/` holds the `Icon` wrapper and the logo (`Logo`, `LogoMark`), `styles/` holds the design tokens in `index.css`, and `test/` holds the test setup.

## 3. Dependency rules

```
app  ──▶  features  ──▶  components, lib, domain
 │
 └──────▶  data  ──▶  domain
```

- `domain` imports nothing else from `src/` and never imports React.
- `data` imports `domain` only.
- `components` imports nothing from `features` or `data`.
- `lib` imports `domain` types only (`import type`), never `data`, `features` or `components`.
- `features` import `domain`, `components` and `lib`. They **never import `data`**. They receive a repository through React context.
- `app` is the only layer allowed to import `data`. It decides which repository is real.

**Why:** these rules are what make "swap the mock for a real API without touching a screen" true in practice, not only on a diagram. They also keep `domain` testable with plain function calls, with no DOM and no mocked network.

**Enforcement:** Implemented. ESLint `no-restricted-imports` zones in `eslint.config.js` make a violation fail `npm run lint` and CI. Cross-folder imports use the `@/` alias (for example `@/domain`) so the zones can match them. Relative paths that pass through a forbidden folder are caught too.

## 4. The claim state model

The central idea of the design is that a claim, and each field on it, is always in an explicit, visible state.

**Claim:** `needs_review` → `approved` → `filed`, with side exits `sent_back` and `escalated`. Claims the agent handles cleanly are filed without a person and never appear in the queue. The queue contains exceptions only.

**Field:** `verified`, `needs_review`, `missing` or `edited`, plus who resolved it (`agent` or `examiner`).

**Rules, enforced in `domain/`:**

- A claim cannot be approved while any field is `needs_review` or `missing`. The examiner must confirm or edit each one.
- `filed` is the only state that means the system of record changed. The UI always shows the difference between "approved" and "filed".
- Every transition appends an entry to the claim's activity log.

The transitions live in a pure reducer, so the rules can be tested exhaustively without rendering anything.

**Status:** Implemented in `domain/review.ts` with table-driven tests. Holding it with `useReducer` in the review feature is Planned (see §5).

## 5. State management

- **Domain state** (the claim and its fields) changes through the pure reducer from §4, held with `useReducer` inside the review feature.
- **Server-shaped state** (the queue, a claim's documents) is read through the repository interface from §6.
- **UI state** (selected row, focused field, open panels) stays local to the component that owns it.

No global state library. The app has no cross-screen state that justifies one. If it grows one, that is a decision note, not a quiet `npm install`.

**Status:** Planned.

## 6. Data boundary

```ts
// domain/repositories.ts (shape, not final)
interface ClaimsRepository {
  listExceptions(filter?: ExceptionFilter): Promise<ClaimSummary[]>
  getPipelineSummary(): Promise<PipelineSummary>
  getClaim(id: ClaimId): Promise<Claim>
  applyAction(id: ClaimId, action: ReviewAction): Promise<Claim>
}
```

`data/mock/` implements it with in-memory fixtures and a small artificial delay, so loading and error states are designed and not skipped. `app/` provides it through context.

**Why an interface and not "just import the JSON":** the screens would otherwise couple to the shape of the fixtures. A real agent platform has latency, partial failures and races, and the interface keeps that design problem visible from day one.

**Status:** Implemented: the interface in `domain/repositories.ts`, the mock in `data/mock/` (12 fictional claims, configurable delay), the context and `useClaimsRepository` hook in `lib/claimsRepository.ts`, and the provider in `app/`. The queue uses `listExceptions` and `getPipelineSummary`; the review screen doesn't use the repository yet. `getPipelineSummary` returns received, working and filed-automatically counts only (in the mock, received is derived as working + filed + the queue, so the strip always adds up): the needs-review number comes from the queue itself, so it can't disagree with the table. A claim summary holds the line of business, the agent's note and counts derived from the claim's fields, and never a claimant name. Filters (reason, line, minimum age) are implemented in the mock and share one definition, `matchesExceptionFilter`, with the queue screen, which currently filters the list it holds (decision 0006). Time is injectable: the mock repository takes a clock and the UI reads one from `lib/clock.ts`.

## 7. Design tokens and components

Visual decisions are tokens in the `@theme` block of `src/styles/index.css` (Tailwind 4). Components use tokens only. No raw hex values, pixel sizes or font stacks in components. The direction is a dense operator tool; see [decision 0003](docs/decisions/0003-dense-operator-interface.md).

Shared primitives go in `components/` once they are used by two features, not before.

**Status:** Tokens: Implemented. The `@theme` block holds the neutral ramp, the accent, the four review-state colours with soft backgrounds, the type scale, the 4px grid, row height, radii, icon and logo sizes, the logo letter-spacing, the nav animation duration, the focus ring and the layout widths. It resets the default colour, text and radius namespaces so only token values exist. Light mode only. Components: partly. The shell pieces (side nav, header, AI panel) live in `app/shell/` and use tokens only, and `components/` has the `Icon` wrapper and the logo. `Icon` is the only file allowed to import the icon package (decision 0005; a lint rule enforces it). The other shared primitives are Planned, and the state badge that pairs each review state with an icon and a label is not built yet.

## 8. Keyboard and accessibility

Examiners work in this screen for hours, so frequent actions need to be fast without a mouse. Shortcuts go through a single registry in `lib/` so they are listed in one help overlay and can't collide. State is never colour alone: every state has an icon and a text label.

**Status:** Partial. The shortcut registry is Implemented in `lib/shortcuts.ts`, with one document-level listener in `ShortcutProvider`. It ignores keys typed into text fields, modified keys and key repeat, and rejects two shortcuts on one key. Four shortcuts are registered (collapse the side nav, toggle the AI panel, go to the queue, focus search). The shell has landmarks, a skip link and visible focus rings. Features that are not built yet are dimmed and `aria-disabled`, stay focusable, and say "Later" in a tooltip and an accessible description instead of visible text. Shortcuts for working in the queue (moving between rows, opening a claim) and for the review actions (confirm, edit, approve, send back) are Planned. Until they exist, every control is reachable with Tab and Enter. The help overlay that lists shortcuts, and the accessibility audit (contrast, screen reader pass), are Planned.

## 9. Testing

- `domain/`: exhaustive unit tests, since it holds the rules.
- Features: React Testing Library for the interactions that matter (approve, edit a field, jump to a source), written the way a user would act.
- No snapshot tests.
- CI runs lint, typecheck, test and build on every pull request.

**Status:** Test runner and CI are Implemented. Unit tests for `domain/`, the mock repository, the hook and the provider are Implemented. Interaction tests for the shell (navigation, header, screen switching, the AI panel, shortcuts) and unit tests for the shortcut registry are Implemented. Interaction tests for the queue (loading, ordering, filters, errors, empty states, the digest and opening a claim) are Implemented. Interaction tests for the review feature are Planned.

## 10. Planned seam: analytics

A `track(event, props)` function in `lib/` with a no-op implementation behind it. Screens call it for meaningful actions (field edited, claim approved, shortcut used). No vendor is chosen. The point is that measuring friction needs a place to hook in, and adding one later means touching every screen.

**Status:** Planned.

## 11. What would change in production

- A real API behind the same repository interface, with caching, retries and optimistic updates, which is where a data-fetching library earns its place.
- Authentication and role-based access, enforced on the server. The client only reflects it.
- The activity log written on the server, as an audit trail the client can't alter.
- Live updates while an agent is working on a claim (streaming or sockets).
- A virtualized table for queues of thousands of rows.
- Redaction of personal and health data in logs and analytics.
- A port to Next.js if the host product uses it. The layering above doesn't depend on Vite.

## Status

| Area                                 | Status      |
| ------------------------------------ | ----------- |
| Vite, React, TypeScript, Tailwind    | Implemented |
| Lint, format, typecheck, test, build | Implemented |
| CI on pull requests                  | Implemented |
| `app/` and `domain/` folders         | Implemented |
| Dependency rules enforced by ESLint  | Implemented |
| Claim state machine                  | Implemented |
| Repository interface and mock data   | Implemented |
| Design tokens                        | Implemented |
| App shell and screen switching       | Implemented |
| Keyboard shortcut registry           | Partial     |
| Shared components (`components/`)    | Partial     |
| Shortcut help overlay                | Planned     |
| Accessibility audit                  | Planned     |
| Exceptions queue screen              | Implemented |
| Review screen                        | Planned     |
| Analytics seam                       | Planned     |
