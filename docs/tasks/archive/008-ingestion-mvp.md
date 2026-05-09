> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 008: Ingestion MVP

## Goal

Implement basic content ingestion.

## Acceptance Criteria

- Source model exists.
- Manual JSON import works.
- RSS import structure exists.
- Dedupe by canonical_url or title hash exists.
- Imported items are draft by default.
- Ingestion logs errors without crashing the whole process.

## Do Not Do

- Do not connect many third-party APIs at once.
- Do not auto-publish imported content.
