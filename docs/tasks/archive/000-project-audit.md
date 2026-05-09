> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 000: Project audit and plan

## Goal

Understand the current repository and create the implementation plan for AI-brief.

## Context

AI-brief is a Chinese-first AI intelligence product. It turns AI news, models, tools, projects, articles, papers, guides, and courses into readable and actionable briefings.

## Constraints

- Do not implement product features yet.
- Do not introduce new dependencies.
- Do not delete existing code.
- Focus on product architecture and engineering plan.

## Acceptance Criteria

- `docs/product-model.md` exists.
- `docs/implementation-plan.md` exists.
- `AGENTS.md` exists or is updated.
- The plan uses Home, News, Models, Tools, Playbooks, Learn as main navigation.
- The plan includes data model, pages, AI evaluation, ingestion, review flow, and quality gates.

## Commands To Run

- `npm run typecheck`
- `npm run lint`
- `npm run validate`
