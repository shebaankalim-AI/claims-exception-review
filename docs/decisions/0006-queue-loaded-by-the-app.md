# 0006: The app loads the queue once and shares it

**Status:** Accepted

## Context

The exceptions queue is read in two places at once: the queue screen, and the digest the agent panel shows beside it. The digest's counts must agree with the table, and fetching the same list twice would let them drift. The panel belongs to the app shell, and features never import `app/`, so a feature can't reach into the panel itself.

## Decision

`app/` calls `useQueue` once per visit to the queue and passes the result as a prop to the queue screen and to the digest component, which the shell renders in the panel. Nothing is shared through context or a store. Leaving the queue and coming back fetches again, so a claim approved in between is gone from the list.

Filters work the other way round. The screen filters the list it already holds, using `matchesExceptionFilter` from `domain/`, the same function the repository applies when a caller asks it to filter. There is one definition of what a filter means.

## Consequences

- The screen and the digest can't disagree, because they read the same array.
- The data hook lives in `features/queue/` but is owned by the caller, which is a little less self-contained than a screen that fetches for itself.
- The repository's filters are implemented and tested but the queue doesn't call them yet, since it filters locally. A real API with thousands of rows would use them, and the screen would then need a loading state per filter change.
- If more screens need the queue, a shared store or a query library becomes worth a decision note of its own.
