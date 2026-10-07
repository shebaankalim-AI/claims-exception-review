# 0004: State-based screen switching, no router

**Status:** Accepted

## Context

The app has two screens so far, the exception queue and the review of one claim, and the shell needs a way to move between them. A router library is the usual answer. Adding one means a new runtime dependency, which CLAUDE.md allows only with a decision note.

## Decision

Hold the current screen in React state inside `app/`: either the queue or a claim id. `app/` renders the matching feature screen and passes it plain callbacks. Features never import `app/`, so they don't know how switching works. No router library is added.

## Consequences

- No new runtime dependency, and no routing concepts to learn for two screens.
- The cost is real URLs and the back button. A claim has no link that can be shared or bookmarked, the browser's back button leaves the app instead of returning to the queue, and a page refresh returns to the queue.
- A router is the planned next step when deep links are needed, for example linking straight to a claim from another tool. The change is limited to `app/`, because screens already receive their inputs as props. That will get its own decision note.
