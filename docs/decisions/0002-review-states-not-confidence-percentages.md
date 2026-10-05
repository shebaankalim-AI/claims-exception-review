# 0002: Review states, not confidence percentages

**Status:** Accepted (a design hypothesis, not yet tested with real examiners)

## Context

When an agent extracts a field from a document, the interface has to say how far to trust it. A model's confidence score is easy to show as a number. But "93%" doesn't tell an examiner what to do, it invites false precision, and the score's meaning varies by field and model.

## Decision

Each field shows a state, **Verified**, **Needs review**, **Missing** or **Edited**, and, when it needs attention, a short reason in plain words ("two class codes plausible"). Each state has an icon and a text label as well as colour. No raw confidence number is shown in the interface.

## Consequences

- The examiner sees what to do next and why, without interpreting a score.
- A threshold in `domain/` decides when a field becomes `needs_review`. That threshold is a product decision and is mock-only here.
- Some experts may want the raw number. If real examiners ask, a details view can reveal it without making it the primary signal.
- This is untested. The point of a real engagement would be to check it with people who do the work.
