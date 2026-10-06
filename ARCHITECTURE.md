# Architecture

How this prototype is structured, and why. Every section is tagged **Implemented**, **Partial** or **Planned**, because a document that describes a system that doesn't exist is worse than no document. The [status table](#status) at the bottom is updated in every phase.

## 1. What this is, and what it isn't

An independent concept prototype of the screens a claims examiner works in when AI agents do the claims work and a person reviews the exceptions. It is built from public information only. It has **no backend**: every claim, document and agent action is mock data.

It is not a product, and it does not try to model a real claims system. The goal is to show how the interface should behave when an agent does real work: what it did, why, what it read, where it was unsure, and how a person agrees or steps in. The architecture exists to keep that interaction model testable and to make the mocks replaceable.

## 2. Layout

```
src/
  app/          providers, screen switching and the shell (nav, header, assistant panel)
  domain/       types, the review reducer, filters, repository interface; pure TypeScript
  data/         repository implementations; mock/ holds the fixtures
  features/     one folder per feature (queue, review): screens, hooks, local components
  components/   shared UI building blocks: icons, logo, badge, dialog, control styles
  lib/          small utilities: shortcut registry, clock, chat threads, labels, formatting
  styles/       design tokens and global CSS
  test/         test setup and helpers
```

The split inside `src/` is by **feature first**, then by layer. A change request almost always names a screen ("the field list on review"), not a layer in isolation, so everything one piece of work touches lives in one folder.

**Status:** Implemented. `app/` holds the providers, the screen switching and `app/shell/`. `domain/` holds the types, the review reducer, the filter definition and the repository interface. `data/mock/` holds the mock repository and fixtures. `features/queue/` and `features/review/` are the two screens, each with the hooks and the assistant summary it needs. `components/` holds `Icon`, `Logo`, `LogoMark`, `Badge`, `Dialog`, `AssistantCard` and the shared control and card styles. `lib/` holds the repository hook, the shortcut registry, the clock, `formatAge`, `formatClock`, the label maps and the chat threads. `styles/` holds the tokens in `index.css`.

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
- Only `components/Icon.tsx` may import the icon package.

**Why:** these rules are what make "swap the mock for a real API without touching a screen" true in practice, not only on a diagram. They also keep `domain` testable with plain function calls, with no DOM and no mocked network.

**Enforcement:** Implemented. ESLint `no-restricted-imports` zones in `eslint.config.js` make a violation fail `npm run lint` and CI. Cross-folder imports use the `@/` alias (for example `@/domain`) so the zones can match them. Relative paths that pass through a forbidden folder are caught too.

## 4. The claim state model

The central idea of the design is that a claim, and each field on it, is always in an explicit, visible state.

**Claim:** `needs_review` → `approved` → `filed`, with side exits `sent_back` and `escalated`. Claims the agent handles cleanly are filed without a person and never appear in the queue. The queue contains exceptions only.

**Field:** `verified`, `needs_review`, `missing` or `edited`, plus who resolved it (`agent` or `examiner`). Every field belongs to one of five stages (intake, coverage, liability, damages, recovery), keeps the agent's value after an edit, and, if missing, says which document would normally contain it. Every agent step in the activity log can carry an outcome (completed, verified, needs review, waiting) for the assistant's feed.

**Rules, enforced in `domain/`:**

- A claim cannot be approved while any field is `needs_review` or `missing`. The examiner must confirm or edit each one.
- Fields can only be changed while the claim needs review. A missing field cannot be confirmed, only given a value.
- `filed` is the only state that means the system of record changed. The UI always shows the difference between "approved" and "filed".
- Every transition appends an entry to the claim's activity log.

The transitions live in a pure reducer, `reviewReducer`, so the rules can be tested exhaustively without rendering anything. The mock repository runs it inside `applyAction`.

**Status:** Implemented in `domain/review.ts` with table-driven tests.

## 5. State management

- **Domain state** (the claim and its fields) changes through the pure reducer from §4, called by the repository's `applyAction`. The app never edits a claim itself.
- **Server-shaped state** is read through the repository interface from §6. `useQueue` loads the queue and `useReview` loads the open claim. Both are called once in `app/` and handed to the screen and to the assistant panel as props, so the two can't disagree (decision 0006).
- **UI state** (selected field, open dialog, tab, filters) stays local to the component that owns it.
- **Chat threads** are kept per claim, and one for the queue, by a small hook in `lib/chat.ts` for as long as the app is open.

No global state library and no router (decision 0004). If the app grows cross-screen state that justifies one, that is a decision note, not a quiet `npm install`.

**Status:** Implemented.

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

**Status:** Implemented: the interface in `domain/repositories.ts`, the mock in `data/mock/` (12 fictional claims, each with fields in all five stages and source documents; one detailed claim with 14 fields), the context and `useClaimsRepository` hook in `lib/claimsRepository.ts`, and the provider in `app/`. The mock fails the first filing attempt on one claim, with an `unavailable` error, so the error state can be seen. `getPipelineSummary` returns received, working and filed-automatically counts only (in the mock, received is derived as working + filed + the queue, so the strip always adds up): the needs-review number comes from the queue itself, so it can't disagree with the table. A claim summary holds the line of business, the agent's note and counts derived from the claim's fields, and never a claimant name. Filters (reason, line, minimum age) are implemented in the mock and share one definition, `matchesExceptionFilter`, with the queue screen, which currently filters the list it holds. Time is injectable: the mock repository takes a clock and the UI reads one from `lib/clock.ts`; the fixtures' dates move with the clock so ages look right whenever the app runs.

## 7. Screens

**Exceptions queue.** A strip of four cards (received today, agent working, filed automatically, needs review), filters for reason, line and age, and a table sorted oldest first. Loading, error with retry, an all-clear state with the day's numbers, and a no-match state are all designed. A line confirms a claim that was just sent back or escalated.

**Claim review.** A header with the claim ID, its state and the actions (Send back, Escalate, Approve, then File claim, Try again, or Next claim as the claim moves on), with a slim banner for what just happened. Stage tabs with counts of what needs the examiner. The active stage's fields are cards: state badge, value, reason, and where it came from. Only the selected card shows its actions. Beside them, the source panel shows the document the value was read from, laid out as a conversation, a form or a pay stub, with the relevant words highlighted. Send back and Escalate use a native dialog. The layout is one column when the content area is narrow and two when it is wide, decided by a container query, so opening the assistant panel switches it cleanly.

**Status:** Implemented.

## 8. The assistant panel

On the right, in both screens. A segmented control switches between **Summary** and **Chat**, and a prompt bar stays pinned at the bottom of both.

- **Summary** is derived from the data on screen. On the queue: the day in a sentence, why claims stopped, and which to open next. On a claim: a timeline of what the agent did, and an explanation of the selected field.
- **Chat** answers from a few canned replies matched on keywords, with suggested questions, a short typing pause and one thread per claim. It is labelled "Demo replies, not a live AI" because there is no model behind it (decision 0008).
- While the prompt bar has focus, or the assistant is "typing", a gradient border glows around it, and a line sweeps across the top of the panel each time it opens. Both are CSS only and switched off for reduced motion.

**Status:** Implemented as a demo. There is no model, no streaming and no memory beyond the open session.

## 9. Design tokens and components

Visual decisions are tokens in the `@theme` block of `src/styles/index.css` (Tailwind 4). Components use tokens only. No raw hex values, pixel sizes or font stacks in components. The direction is a dense operator tool, accepted in [decision 0003](docs/decisions/0003-dense-operator-interface.md).

Shared primitives go in `components/` once they are used by two features, not before.

**Status:** Tokens: Implemented. The `@theme` block holds the cool slate neutrals, the blue accent, the four review-state colours (text, soft background and border), the highlight and glow colours, the type scale (Inter, 12 to 24px), the 4px grid, control and row sizes, radii, shadows, icon and logo sizes, layout widths, motion durations and the focus ring. It resets the default colour, text, radius and shadow namespaces so only token values exist. Light mode only. Components: Partial. The shared ones are listed in §2; the shell pieces live in `app/shell/` and the screens' own pieces in their features. `Icon` is the only file allowed to import the icon package (decision 0005). The font is self-hosted (decision 0007).

## 10. Keyboard and accessibility

Examiners work in this screen for hours, so frequent actions need to be fast without a mouse. Shortcuts go through a single registry in `lib/` so they can't collide. State is never colour alone: every state has an icon and a text label (the stage tabs show an icon and a count, with the words as their accessible name).

**Status:** Partial. The shortcut registry is Implemented in `lib/shortcuts.ts`, with one document-level listener in `ShortcutProvider`. It ignores keys typed into text fields, modified keys and key repeat, and rejects two shortcuts on one key. Four shortcuts are registered (collapse the side nav, toggle the assistant panel, go to the queue, focus search). The shell has landmarks, a skip link and visible focus rings. Features that are not built yet are dimmed and `aria-disabled`, stay focusable, and say "Later" in a tooltip and an accessible description. Disabled buttons explain themselves to screen readers without visible text. Shortcuts for working in the queue (moving between rows, opening a claim) and for the review actions (confirm, edit, approve, send back) are Planned. Until they exist, every control is reachable with Tab and Enter. The help overlay that lists shortcuts, and the accessibility audit (contrast, screen reader pass), are Planned.

## 11. Testing

- `domain/`: exhaustive unit tests, since it holds the rules.
- Features and the app: React Testing Library for the interactions that matter (approve, add a value, send back, switch tabs, ask a question), written the way a user would act.
- No snapshot tests.
- CI runs lint, typecheck, test and build on every pull request.

**Status:** Implemented. Unit tests cover `domain/`, the mock repository, the shortcut registry, the clock, formatting and the canned replies. Interaction tests cover the shell, the queue (loading, ordering, filters, errors, empty states, the summary and opening a claim), approving, adding a value, sending back, escalating and the assistant panel. The review screen's field cards, stage tabs and source panel have no tests of their own beyond those flows.

## 12. Planned seam: analytics

A `track(event, props)` function in `lib/` with a no-op implementation behind it. Screens call it for meaningful actions (field edited, claim approved, shortcut used). No vendor is chosen. The point is that measuring friction needs a place to hook in, and adding one later means touching every screen.

**Status:** Planned.

## 13. What would change in production

- A real API behind the same repository interface, with caching, retries and optimistic updates, which is where a data-fetching library earns its place.
- Authentication and role-based access, enforced on the server. The client only reflects it.
- The activity log written on the server, as an audit trail the client can't alter.
- Live updates while an agent is working on a claim (streaming or sockets).
- A real assistant behind the same panel, with sources it can cite, and its answers logged.
- A router, so a claim has a link that can be shared and the back button works.
- A virtualized table for queues of thousands of rows.
- Redaction of personal and health data in logs and analytics.
- A port to Next.js if the host product uses it. The layering above doesn't depend on Vite.

## Status

| Area                                 | Status      |
| ------------------------------------ | ----------- |
| Vite, React, TypeScript, Tailwind    | Implemented |
| Lint, format, typecheck, test, build | Implemented |
| CI on pull requests                  | Implemented |
| Layer folders and dependency rules   | Implemented |
| Claim state machine                  | Implemented |
| Repository interface and mock data   | Implemented |
| Design tokens                        | Implemented |
| App shell and screen switching       | Implemented |
| Exceptions queue screen              | Implemented |
| Claim review screen                  | Implemented |
| Assistant panel (demo replies)       | Implemented |
| Keyboard shortcut registry           | Partial     |
| Shared components (`components/`)    | Partial     |
| Shortcut help overlay                | Planned     |
| Accessibility audit                  | Planned     |
| Analytics seam                       | Planned     |
