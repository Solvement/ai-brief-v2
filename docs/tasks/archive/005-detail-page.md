> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 005: Content detail page

## Goal

Build the universal content detail page.

## Acceptance Criteria

- `/content/[slug]` or equivalent route works.
- It displays TL;DR, background, key facts, why it matters, impact, opportunities, risks, how to use, checklist/prompt/workflow, and related items.
- Detail layout adapts by content type.
- Missing optional fields are handled gracefully.

## Do Not Do

- Do not generate Playbooks yet.
- Do not call external AI APIs.
