# Plan: Codex C1 Projects Coverage (2026-06-11)

> Trigger: this task changes classifier, ranking/depth behavior, tests, and public type contract. It is expected to exceed 100 lines, so RULES #11 requires a plan before implementation.

## 1. Direction / Review Targets
- Big direction: make the Projects column cover every AI-relevant ranked repo at least at light depth, while separating agent skills from agent frameworks.
- Small direction:
  - Add `agent_skill` as a first-class project type in deterministic classification and normalization.
  - Prevent customer-support/live-chat "agent" language and non-AI infra/security/education/collaboration projects from being treated as AI.
  - Ensure AI project types never end as `list_only`; only non-AI/off-topic items may stay list-only.
  - Prefer deep for structure-informing harness/memory/taste/eval/orchestration skill or infra projects, while keeping tutorial/resource/template projects capped at light.

## 2. Requirements
- Goals:
  - `node scripts/eval-projects-coverage.mjs` passes classifier and coverage gates.
  - New or changed behavior has focused `node --test` coverage.
  - `npm run verify` passes.
- Non-goals:
  - Do not edit eval scripts, fixtures, paradigms, paper/news/frontend surfaces, self-evo implementation, DB/schema, dependencies, deploy, or git history.
- Impact scope:
  - `scripts/columns/projects/evaluate.mjs`
  - `scripts/columns/projects/project-ranking.mjs`
  - project type consumers only where needed for contract consistency
  - focused tests and final `.agent/codex-coverage-report.md`
- Acceptance:
  - classifier accuracy >= 0.85 with zero `agent_skill -> agent_framework` and zero non-AI -> AI in the golden fixture.
  - AI ranked repos in `public/data/trending.json` all have `light|standard|deep`.
  - each window has at most 2 deep entries; no AI repo is `list_only`.

## 3. Implementation
- `evaluate.mjs`:
  - Extend `PROJECT_TYPES`, `LIGHT_SYS`, and normalize mappings to include `agent_skill`.
  - Add rule helpers for agent skills, non-AI exclusions, customer-support agent ambiguity, and AI-agent context.
  - Make signal-based project type selection return `agent_skill` for skills/plugins/prompt collections before framework fallback.
- `project-ranking.mjs`:
  - Add deterministic project type signal and `informs_our_structure` / `self_evo_eligible` booleans to depth decisions.
  - Redefine depth gate so AI types are at least light, `agent_skill` defaults light, and structure-informing items can become deep.
  - Keep tutorial/resource/template identities capped at light and not deep.
  - Enforce daily/window deep cap of 2 by default.
- Contract/schema:
  - Add `agent_skill` and optional evolution flags where public TypeScript types need to reflect published data.
  - Keep validators permissive unless the existing schema explicitly requires more.

## 4. Eval
- Structural:
  - `node scripts/eval-projects-coverage.mjs`
  - targeted `node --test` files for classifier and ranking changes
  - `npm run verify`
  - `npm run ops:baseline:diff`
- Content/review:
  - Independent Claude review is required after this Codex diff; this agent will not self-review the final diff.
- Success metric:
  - Eval exits 0 and verify exits 0 without editing protected fixture/eval files.

## 5. Tools
- Tools/scripts:
  - `rg`, PowerShell `Get-Content`, codegraph, `apply_patch`, `node --test`, npm scripts.
- New dependencies:
  - None.

## 6. Orchestration
- Single Codex implementer is sufficient because the upstream spec and eval already exist.
- No runtime agent framework or open-ended daily-pipeline agent is introduced.
- Independent review is deferred to Claude/another agent after implementation.

## 7. Slices
- Slice 1: classifier rules and tests, prove fixture gate classification passes.
- Slice 2: depth gate rules and tests, prove coverage gate passes against current `trending.json`.
- Slice 3: contract/report, then full verify.

## 8. Risks / Rollback
- Risks:
  - Regex rules may overmatch generic "skill" or "plugin" projects.
  - Depth cap changes may alter existing tests that expected broader deep windows.
  - Existing `trending.json` may need regeneration if it contains stale `list_only` AI entries.
- Rollback:
  - Revert this plan's code/test/report changes as one scoped diff; no data deletion or git reset needed.
