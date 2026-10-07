# 0008: A labelled demo assistant, not a live model

**Status:** Accepted

## Context

The point of the interface is how a person works alongside an agent: what it did, why it stopped, what it compared, and how the person asks it something. That needs an assistant panel with a chat in it. But this prototype has no backend and no key, and a live model would make every demo different, slow, and impossible to test.

## Decision

The assistant is a scripted demo. Its summaries are worked out from the data on screen, and its chat answers from a few canned replies chosen by keyword, plus a fallback that says what it can answer. The panel says "Demo replies, not a live AI" wherever a chat can start, so nobody mistakes it for a model. Replies are worked out when the question is sent, so they match what the screen shows, and each claim keeps its own thread.

## Consequences

- The behaviour is deterministic, so it can be tested and demonstrated the same way every time, offline.
- It can't answer anything outside its keywords, and the fallback says so rather than guessing.
- The panel's layout, tabs, threads and prompt bar are real. Replacing the reply function with a call to a model, with sources it can cite and its answers logged, changes one function per screen and nothing in the panel.
