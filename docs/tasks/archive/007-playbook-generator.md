> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 007: Playbook generator

## Goal

Convert content items into executable Playbooks.

## Acceptance Criteria

- Playbook schema exists.
- `generatePlaybookFromContent` exists.
- `validatePlaybookQuality` exists.
- Playbook includes outcome, prerequisites, tools, steps, prompts, checklist, validation methods, risks, and fallback options.
- At least 3 fixture tests pass.

## Do Not Do

- Do not create weak guides from non-actionable source content.
- Do not skip expected_result for any step.
