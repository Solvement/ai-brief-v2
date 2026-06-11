# Plan: News freshness and failure visibility (2026-06-11)

## 1. Direction / Acceptance Target
- Big direction: the news column must not silently stall; a stale or failed news run has to become visible to the daily pipeline and deployed health data.
- Small direction:
  - Reproduce the current `news:daily` behavior and document the observed timeout / source results.
  - Keep partial source failures recoverable, but fail when discovery yields no new publishable items or all primary sources fail.
  - Add a deployable `public/data/news-health.json` freshness file; older than 2 days is unhealthy.
  - Add tests for source-failure health and freshness computation.

## 2. Requirements
- Goals:
  - Diagnose with real command output/exit behavior.
  - Make news failures explicit through process exit and/or health status.
  - Preserve degraded operation when only some sources fail.
  - Validate `articles.json` after the change as requested.
- Non-goals:
  - Do not modify `scripts/columns/projects/*`, papers column, frontend, deployment, or git commits.
  - Do not add new dependencies.
  - Do not change upstream product/spec documents.
- Impact:
  - `scripts/columns/news/*`, `scripts/daily.mjs`, validation/test scripts, package scripts, public news health data, report under `.agent/`.
- Acceptance:
  - `npm run news:daily` either completes and writes fresh health, or exits non-zero with an unhealthy health file.
  - Relevant tests pass.
  - `node scripts/validate-articles.mjs` passes.

## 3. Approach
- Add news run health helpers that compute source success, discovered count, generated-day count, and freshness.
- Add bounded fetch timeouts for news fetches so the command cannot hang indefinitely on network reads.
- Make the news CLI throw on unhealthy discovery/run conditions after writing the health file.
- Add a validator for `public/data/news-health.json` and include it in `npm run validate`.
- Connect daily's `--only news` path to the same failure behavior by relying on `runColumn` catching thrown errors.
- Data contract/schema change: new deployable health file only, no existing public contract break.

## 4. Eval
- Structural gates:
  - `node --test scripts/__tests__/news-normalize-dedupe.test.mjs`
  - `node scripts/validate-articles.mjs`
  - `node scripts/validate-news-health.mjs`
  - If feasible, `npm run news:daily`
- Content gate:
  - Independent review by Claude after diff is left in worktree, using this plan and `.agent/codex-news-fix-report.md`.
- Success signal:
  - The stale-news bug is represented by a deterministic freshness check and a command exit status, not by manual date inspection.

## 5. Tools
- Tools/scripts:
  - PowerShell commands for reads/runs.
  - `apply_patch` for edits.
  - Node test runner.
- New dependencies: none.

## 6. Orchestration
- Single Codex implementation is enough for diagnosis and deterministic backend changes.
- Independent review required after completion; dispatch parameters:
  - Role: code review.
  - Eval: compare diff against this plan and run/report relevant gates.
  - Model/effort: Claude Opus high, because this is pipeline reliability.
- No LangGraph/CrewAI/AutoGen runtime change.

## 7. Slices
- Slice 1: reproduce + inspect root cause.
- Slice 2: implement health/failure visibility + tests.
- Slice 3: run news, validators, write report.

## 8. Risks / Rollback
- Risk: live network remains slow or unavailable; mitigation is explicit timeout and unhealthy health file.
- Risk: tightening failure criteria breaks boot on transient all-source outage; mitigation is partial-source tolerance and clear health details.
- Rollback: remove the news health script/validator and restore `news:daily` to write-only behavior.
