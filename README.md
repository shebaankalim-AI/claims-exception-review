# Assay (concept)

An independent concept prototype for an exception-review screen in a claims-automation tool, built from public information. It uses mock data only and has no backend.

The name Assay and its logo are placeholders.

## About this project

This is a concept prototype, built as practice to show how I design and build: from product thinking to a working interface. It is not a real product. It uses mock data only, has no backend, and is not affiliated with any company.

## Getting started

Requires Node.js 22.22 or newer (24 recommended; see `.nvmrc`).

```bash
npm install
npm run dev
```

## Scripts

| Script              | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start the Vite dev server          |
| `npm run build`     | Typecheck and build for production |
| `npm run preview`   | Preview the production build       |
| `npm run lint`      | Lint with ESLint                   |
| `npm run format`    | Format all files with Prettier     |
| `npm run typecheck` | Typecheck with TypeScript          |
| `npm test`          | Run unit tests with Vitest         |

## Folder structure

```
src/
  app/          providers, screen switching and the shell
  domain/       types, the review rules and the repository interface
  data/         mock repository and fictional fixtures
  features/     the queue and the claim review
  components/   shared UI building blocks
  lib/          small utilities
  styles/       design tokens and global CSS
  test/         test setup and helpers
```

## Author

Built by Shebaan Kalim — https://shebaan-portfolio.netlify.app/

## Assumptions

TODO
