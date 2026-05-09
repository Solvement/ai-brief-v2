> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 001: Content model

## Goal

Implement the core `ContentItem` model and type-specific extensions.

## Acceptance Criteria

- `ContentType`, `ActionLabel`, `Audience`, and `ContentItem` are defined.
- Type-specific models exist for news, model, tool, integration, article, paper, guide, and course.
- Seed data includes at least 3 items per main section.
- Query functions exist:
  - `getHomeBrief`
  - `getContentByType`
  - `getContentBySlug`
  - `getRelatedContent`
  - `getRecommendedContent`
- Tests or validation scripts pass.

## Do Not Do

- Do not build new UI.
- Do not connect external APIs.
- Do not add a database.
