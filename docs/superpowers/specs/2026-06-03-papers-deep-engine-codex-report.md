# Papers Deep Engine Codex Report

Date: 2026-06-03

## Summary

Papers daily now uses the canonical deep column engine in `scripts/columns/papers/`:

```text
discover -> collectEvidence -> evaluate -> select -> analyze -> reviewer audit -> qa -> publish -> archive
```

The old `scripts/papers-radar.mjs` is no longer the daily engine. Its `discover`, `triage`, and `review` commands remain as helper commands; direct `daily` and `run` now delegate to `scripts/columns/papers/daily.mjs`.

## How Articles Get Deep Analysis

`scripts/columns/papers/daily.mjs` opens the AI Brief DB, loads `.env.local` without overwriting existing OS env values, and runs:

```js
runColumnPipeline(papersColumnModule, { paperAnalysisTier: "deep", ...options })
```

`papersColumnModule.publish()` writes:

- `public/data/articles.json`
- `public/data/articles-archive.json`
- `public/data/paper-radar.json`
- `data/papers/paper-radar-archive.json`
- `data/agent-memory/papers.json`

The public article contract remains:

```json
{
  "generatedAt": "...",
  "papers": [
    {
      "id": "...",
      "title": "...",
      "originalReading": [],
      "analystNotes": "...",
      "leadJudgment": "...",
      "meta": {}
    }
  ]
}
```

## Analyst To Reviewer Loop

`scripts/columns/papers/analyze.mjs` now runs two distinct roles:

1. Analyst LLM: produces `AcademicPaperAnalysis`.
2. Reviewer/Critic LLM: audits grounding, no filler/template text, and whether depth is justified by collected paper text.

Reviewer output is normalized as:

```json
{ "verdict": "pass|revise|downgrade", "issues": [] }
```

Behavior:

- `pass`: analysis continues to QA.
- `revise`: analyst gets one revision attempt, then reviewer audits again.
- second `revise`: converted to `downgrade`.
- `downgrade`: QA fails the item, so it is excluded from deep publish.
- reviewer/analyst LLM failure in online mode: downgraded, not published as fake deep content.
- offline/dry-run: private offline reviewer stub marks the fixture path as pass so PM can verify wiring cheaply.

The verdict is recorded privately on `_reviewAudit` in the DB analysis payload. `publish()` strips private `_` keys before writing public JSON, preserving `validate-articles.mjs`'s forbidden public `verdict` rule.

Reviewer model config:

- `PAPERS_REVIEW_MODEL`
- fallback: papers analyze model (`PAPERS_DEEP_MODEL` / `DEEPSEEK_PRO_MODEL` / `DEEPSEEK_MODEL`)

## Retention

Deep articles accumulate into a deduped library:

- `articles.json`: bounded recent front list, default `PAPERS_ARTICLES_ACTIVE_LIMIT=12`.
- `articles-archive.json`: deduped full library by paper id/source/title. Current-shape deep articles are preserved, not pruned.
- `data/agent-memory/papers.json`: pipeline memory records selected and archived run summaries.

Radar rolls:

- `paper-radar.json`: current public radar only.
- previous public radar snapshots are archived into `data/papers/paper-radar-archive.json`.
- snapshot cap defaults to `PAPERS_RADAR_ARCHIVE_LIMIT=90`.

## Files Changed

- `scripts/columns/papers/daily.mjs`
- `scripts/columns/papers/analyze.mjs`
- `scripts/columns/papers/prompts.mjs`
- `scripts/columns/papers/qa.mjs`
- `scripts/columns/papers/index.mjs`
- `scripts/daily.mjs`
- `scripts/papers-radar.mjs`
- `package.json`

## PM Verification

Author did not run node/npm/git/tests or call an LLM per the work order.

Cheap offline verification:

```powershell
$env:NO_LLM = "1"
node --no-warnings scripts/columns/papers/daily.mjs --dry-run --cap 1 --db data/pm-papers-dryrun.db
npm run validate
```

What this proves:

- daily entry runs `scripts/columns/papers/daily.mjs`
- the full column pipeline reaches publish
- `public/data/articles.json` is written by the deep engine path
- each active paper has non-empty `originalReading[]` and `analystNotes`
- `public/data/paper-radar.json` remains valid

Quick spot check:

```powershell
Select-String -Path public/data/articles.json -Pattern '"originalReading"', '"analystNotes"', '"leadJudgment"'
```

Real small run:

```powershell
node --no-warnings scripts/columns/papers/daily.mjs --cap 1 --limit 20
npm run validate
```

Expected real-run behavior:

- uses `DEEPSEEK_API_KEY` from OS env if present
- analyst model writes the deep paper analysis
- reviewer model audits it
- one revision is attempted only if reviewer says `revise`
- `downgrade` items are excluded before publish
- `articles.json` shows the recent deep library front list
- `articles-archive.json` accumulates the deep library
- `paper-radar.json` is overwritten with current radar, with prior snapshot capped in `data/papers/paper-radar-archive.json`
