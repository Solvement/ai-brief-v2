> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 010: Quality gates and CI

## Goal

Add quality gates for code and content.

## Acceptance Criteria

- `typecheck`, `lint`, and `test` scripts exist.
- Content validation script exists.
- Evaluation schema tests exist.
- Playbook quality tests exist.
- GitHub Actions workflow runs checks on PR.
- `docs/quality-gates.md` exists.

## Do Not Do

- Do not depend on real external APIs in CI.
- Do not let failures produce unclear messages.
