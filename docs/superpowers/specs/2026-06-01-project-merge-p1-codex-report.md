# Project Merge P1 Codex Report

## Changed files

- `scripts/columns/projects/sources.mjs`
- `scripts/columns/projects/prompts.mjs`
- `scripts/columns/projects/evaluate.mjs`
- `scripts/columns/projects/index.mjs`
- `scripts/lib/db.mjs`
- `scripts/__tests__/projects-evaluate.test.mjs`
- `scripts/__tests__/db.test.mjs`
- `docs/superpowers/specs/2026-06-01-project-merge-p1-codex-report.md`

## P1 implementation

- Discovery now filters repos already deep-dived in `brief-wiki/content/*.md`.
  - Reads frontmatter with `type: project`.
  - Treats `status: deep_dived` or a `[[deep-dives/...]]` body link as the deep-dive marker.
  - Matches by normalized GitHub URL and parsed `owner/name`.
  - Missing or unreadable content directory falls back to an empty skip set.

- Evidence collection now attaches an `artifactAudit` object while preserving `evidence.content` as README text.
  - GitHub REST metadata fields: `stargazers_count`, `forks_count`, `license_spdx_id`, `pushed_at`, `open_issues_count`, `default_branch`, `topics`, `archived`, `homepage`.
  - Top-level tree fields: `top_level_entries`, `has_src`, `has_tests`, `has_docs`, `has_examples`, `has_packages`, `has_ci`.
  - Latest release fields: `latest_release_tag_name`, `latest_release_published_at`.
  - Missing/unfetched fields use `"not_found"`.
  - Offline mode returns all audit fields as `"not_found"` and uses cached README/description content.

- DB evidence persistence now supports optional structured metadata.
  - Added nullable `evidence.metadata` JSON column and migration compatibility in `initSchema()`.
  - `upsertEvidence({ artifactAudit })` stores it as `metadata.artifactAudit`.
  - `getEvidence()` / `listEvidence()` decode and expose `evidence.artifactAudit`.

- LIGHT triage now asks for and normalizes:
  - `project_type`: `ai_app | agent_framework | devtool_cli | model_infra | frontend_ui | dataset_benchmark | library_sdk | template_boilerplate | non_ai_eng`
  - `verdict`: `skip | watch | L1 | deep_dive | clone_and_run`
  - `ratings`: `relevance_to_ai_engineer`, `engineering_depth`, `reuse_value`, `maturity` as 1-5 integers.

- Triage payload now includes `artifactAudit` and keyword-ranking input signals.
  - `projectRanking.boostTerms`
  - `projectRanking.capTerms`
  - `projectRanking.sourceTerms`
  - `projectRanking.popularityBoost`

- Selection gating now follows verdict.
  - Only `deep_dive` and `clone_and_run` emit `decision: "select"`.
  - Other verdicts emit `decision: "skip"` even if `worthDeepDive` is numerically high.
  - `worthDeepDive` remains numeric for back-compat ranking and board display.

- Publish now carries the new light fields into project cards:
  - `project_type`
  - `verdict`
  - `ratings`

## Test updates

- `scripts/__tests__/projects-evaluate.test.mjs`
  - Updated the finance-keyword test to include `project_type`, `verdict`, and `ratings`.
  - Added coverage that a high-score `watch` verdict is not selected for deep dive.

- `scripts/__tests__/db.test.mjs`
  - Added artifact audit metadata roundtrip coverage for `upsertEvidence()`.

## PM verification

- I did not run npm/node/git/tests per the P1 work order.
- PM should run the normal verification suite, including DB migration coverage against an existing `data/ai-brief.db`.
- PM should spot-check that `brief-wiki/content/pi-agent.md` causes `badlogic/pi-mono` to be skipped during project discovery.
- PM should verify live GitHub API behavior with and without `GITHUB_TOKEN`, especially latest-release 404 handling.
- Phase 2 should wire the deep-dive generator to consume `artifactAudit`, `project_type`, `verdict`, and `ratings` as inputs for `project_verdict`, `next_actions`, and `claim_ledger`.
