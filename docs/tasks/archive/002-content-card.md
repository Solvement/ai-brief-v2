> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 002: Reusable content cards

## Goal

Create reusable card components for AI-brief content.

## Acceptance Criteria

- `ContentCard` component exists.
- It supports different content types.
- It displays title, takeaway, why_it_matters, audience, action label, scores, source, and date.
- Loading, empty, and error-friendly states exist where relevant.
- It is responsive.

## Do Not Do

- Do not hard-code mock data in components.
- Do not create new data models unless required by Task 001 gaps.
