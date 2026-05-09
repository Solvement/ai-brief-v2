> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 017: Admin image review

## Goal

Create an admin media review surface for generated, uploaded, source, and placeholder images.

## Required Route

- `/admin/media`

## Required Capabilities

- List media assets by status:
  - draft
  - needs_review
  - approved
  - rejected
- Show thumbnail/cover preview.
- Show source_type.
- Show alt text.
- Show credit.
- Show prompt and revised_prompt when generated.
- Approve media.
- Reject media.
- Keep public pages limited to approved media.

## Acceptance Criteria

- Admin media page renders from seed/mock data.
- Approve/reject actions can be mocked locally.
- Empty/loading/error states exist.
- No real external API calls.
- Typecheck, lint, tests, and build pass.

## Do Not Do

- Do not build full content admin review.
- Do not add authentication yet.
- Do not add subscription UI.
