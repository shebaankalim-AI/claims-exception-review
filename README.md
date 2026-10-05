# Claims Exception Review (concept)

An independent concept prototype for an exception-review screen in a claims-automation tool, built from public information. It uses mock data only and has no backend.

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
  components/  shared UI building blocks
  features/    one folder per feature
  data/        mock data only
  lib/         small utilities
  styles/      design tokens and global CSS
  test/        test setup
```

## Author

TODO

## Assumptions

TODO
