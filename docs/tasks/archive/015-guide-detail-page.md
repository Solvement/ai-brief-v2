> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 015: Guide detail page

## Goal

Create `/playbooks/[slug]` as a follow-along Playbook detail page.

## Required Sections

- Breadcrumb.
- Title.
- Difficulty.
- Estimated time.
- Target audience.
- Cover image or approved placeholder.
- Start follow-along action.
- Overview.
- Steps.
- Prompt copy blocks.
- Checklist.
- Validation.
- Risks.
- Fallback options.
- Related content.

## Acceptance Criteria

- The page feels executable, not like a long article.
- Each step has expected_result when data exists.
- Prompt blocks are easy to copy once interaction is implemented.
- Validation methods are visible.
- Missing optional fields do not render empty headings.
- Mobile layout is readable.
- Typecheck, lint, tests, and build pass.

## Do Not Do

- Do not add persistence for completion state.
- Do not add save-for-later until persistence exists.
- Do not add subscription UI.
