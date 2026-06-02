# Project Merge P3 Codex Report

Author-only note: I did not run npm/node/git/tests and did not call an external LLM.

## Files changed

- `scripts/columns/projects/index.mjs`
  - Branches the project `analyze` stage for the daily brief-wiki pipeline.
  - Calls `generateProjectDeepDive({ candidate, evidence, triage, options, logger })` for selected `deep_dive` / `clone_and_run` repos.
  - Defensively skips repos already marked deep-dived in `brief-wiki/content`.
  - Records per-generated-repo bookkeeping in SQLite via `insertAnalysis(tier: "brief-wiki")` and `recordRun(stage: "deep-dive")`.
  - Runs BriefGuard layer-A before publish, then refreshes the brief mirror.
  - Keeps `public/data/trending.json` as the light radar board and omits legacy heavy `deep` payloads for the new daily path.
- `scripts/columns/projects/brief-pipeline.mjs`
  - Uses the lint CLI fallback and now fails if the `Summary: RED n, YELLOW n, BLUE n` line cannot be parsed.
  - Keeps the reviewer/layer-B hook as an explicit TODO stub.
- `scripts/columns/projects/daily.mjs`
  - New daily entrypoint for the full project deep-dive chain.
- `package.json`
  - Adds `projects:daily`.
- `docs/superpowers/specs/2026-06-01-project-merge-p3-codex-report.md`
  - This report.

## New daily entry

Run:

```bash
npm run projects:daily -- --cap 1
```

Flags:

- `--cap N`: max selected deep-dive candidates. Default is `6`.
- `--offline`: no LLM path; discovery/evaluation/deep-dive use the offline/stub path.
- `--dry-run`: also sets offline/no-LLM mode for cheap shape verification.
- `--wiki-root DIR`: optional brief-wiki root override.
- `--db PATH`: optional SQLite DB path override.

Daily flow:

```text
discover -> evidence/artifactAudit -> triage -> verdict-gated select(cap)
-> generate brief-wiki project entity set -> brief:lint guard
-> brief:build mirror publish -> trending.json light radar publish -> archive
```

## Guard behavior

`publish` runs `runProjectBriefWikiGuard()` before `brief:build`.

- If `brief:lint` reports `RED > 0`, the run throws and `brief:build` is not invoked.
- If the lint CLI exits non-zero or the RED/YELLOW/BLUE summary is missing, the run throws.
- Generated markdown may remain in `brief-wiki` for inspection, but `public/data/brief/*.json` is not refreshed after a guard failure.
- Reviewer/layer-B is intentionally skipped for now via `runReviewerLayerBGuard()` TODO.

## PM cheap verification

First verify the cheap offline shape:

```bash
npm run projects:daily -- --offline --cap 1
npm run brief:lint
```

Then run one real small deep-dive:

```bash
npm run projects:daily -- --cap 1
```

Recommended spot checks:

- `brief-wiki/content/<slug>.md` has `type: project` and `status: deep_dived`.
- `brief-wiki/source-packs`, `evidence-packs`, `deep-dives`, `concepts`, `claims`, and `artifacts` contain the generated entity set.
- `public/data/brief/index.json` changes only after the lint guard passes.
- `public/data/trending.json` still has light cards with `tldr`, `tags`, `worthDeepDive`, `project_type`, `verdict`, and `ratings`.
- SQLite `runs` includes per-repo `stage: deep-dive` rows for generated repos.

## Remaining work

- Frontend: point project deep cards to `#/brief/<slug>` from the brief-wiki mirror.
- Add reviewer/layer-B groundedness guard after layer-A lint.
- Add cron/scheduler for a true daily cadence.
