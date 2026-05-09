> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 006: AI evaluation engine

## Goal

Implement schema-first AI evaluation logic.

## Acceptance Criteria

- `EvaluationResult` schema exists.
- Rubrics exist for each content type.
- `validateEvaluationResult` exists.
- Fixtures cover news, model, tool, integration, article, paper, guide, and course.
- Tests verify score ranges, required fields, and legal enum values.
- No real AI API is required yet.

## Do Not Do

- Do not write prompts inline across components.
- Do not trust model output without validation.
- Do not auto-publish evaluated content.
