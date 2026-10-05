# CLAUDE.md

Instructions for AI coding tools working in this repo. Humans: read [ARCHITECTURE.md](ARCHITECTURE.md) first.

## What this is

An independent concept prototype of an exception-review interface for a claims-automation tool. Mock data only, no backend. Built from public information.

## Commands

```bash
npm install          # Node 22.22+ (see .nvmrc)
npm run dev          # dev server
npm run lint         # ESLint
npm run typecheck    # tsc -b --noEmit
npm test             # Vitest, run once
npm run build        # typecheck and production build
npm run format       # Prettier, writes files
```

Before you say work is done, run `lint`, `typecheck`, `test` and `build`. Report the results as they are. If one fails, say which and why.

## Structure

`src/` is `app`, `domain`, `data`, `features`, `components`, `lib`, `styles`, `test`. Read the dependency rules in ARCHITECTURE.md §3 before adding an import. The short version: `features` never import `data`, and `domain` imports nothing from the rest of `src` and never React. If a rule is in the way, stop and say so. Do not route around it.

## Conventions

- TypeScript strict. No `any`, no `@ts-ignore`. Use `unknown` and narrow.
- Styling: Tailwind with design tokens from `src/styles/index.css`. No raw hex values, pixel sizes or font stacks in components. If a token is missing, add it.
- State of a claim or field is never colour alone. Always icon plus text.
- Show review states, not confidence percentages (see `docs/decisions/0002`).
- Every frequent action has a keyboard path. Shortcuts go through the registry in `src/lib`, not ad-hoc `keydown` handlers.
- Mock data lives only in `src/data/mock/`. It must be fictional. No real people, companies, policy numbers or products.
- Components: small and named for what they are. If a `build`-style render function grows past about 150 lines, split it.
- Comments explain **why**, not what. If a choice is unusual, say what it protects against.

## Testing

- Rules in `domain/` get thorough unit tests.
- Interactions get Testing Library tests written as a user would act. No snapshot tests.
- A bug fix includes a test that fails without it.

## Git workflow

- Never commit to `main`. One branch per piece of work: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
- Small commits, conventional messages (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Open a pull request into `main`. CI must be green before merging.
- Do not edit `package-lock.json` by hand.

## Dependencies

Do not add a runtime dependency without a decision note in `docs/decisions/` saying what problem it solves and what was considered. Dev tooling is lighter, but still say why in the commit message.

## Docs stay true

- Changing structure, a dependency rule or the state model means updating ARCHITECTURE.md, including its status table, in the same pull request.
- A choice a reviewer would reasonably ask "why?" about gets a short decision note. Copy the format of the existing ones.
- Never describe something as implemented unless it is.

## Do not

- Do not use any real company's name, logo, wording or screenshots anywhere in the code, docs, metadata or mock data.
- Do not present this as a real product. It is a concept.
- Do not add a backend, authentication, or a global state library.
- Do not add files or documents that nobody asked for.
