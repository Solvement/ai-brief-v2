> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 014: Directory pages

## Goal

Create directory-style pages for Tools and Playbooks, plus prepare shared directory components.

## Required Pages

- `/tools`
- `/tools/[slug]`
- `/playbooks`

## Required Components

- DirectoryHero.
- CategoryPills.
- SortSelect.
- DirectoryGrid.
- ToolCard.
- PlaybookCard.
- EmptyState.

## Tools Directory Requirements

- Category filters.
- Sort by newest, impact, actionability, setup cost where data exists.
- Tool cards show thumbnail/logo placeholder, title, use case, chips, setup difficulty, recommended action, and related Playbook.

## Playbooks Directory Requirements

- Use-case categories.
- Guide cards show cover placeholder, title, outcome, difficulty, estimated time, tools needed when available, audience, and recommended action.

## Acceptance Criteria

- Directory pages do not look like generic blog grids.
- Cards use the content/query layer.
- Filtering and sorting work on the client for MVP.
- Empty/loading/error states exist.
- Typecheck, lint, tests, and build pass.

## Do Not Do

- Do not implement Playbook detail yet.
- Do not implement media generation.
- Do not add subscription UI.
