# Workorder: repo cleanup (dead code + stale artifacts + spec archiving)

Role: you are the implementer. Spawn your own sub-agents if helpful. This is a CLEANUP task — file deletions + git moves only. A reviewer (Claude, PM) verified every item below with grep; re-verify before deleting and STOP if any assumption is wrong.

## HARD CONSTRAINTS (a content pipeline is running concurrently)
- DO NOT run `npm run build`, `npm test`, `npm run daily`, `npm run lint`, or any node/npm script. File operations + git only.
- DO NOT touch, read-lock, or modify: `public/data/**`, `data/**` (except the one cache file listed), `brief-wiki/**`, `ai-brief.db`, `logs/gen-*.log`, `.next/` is OK to delete but nothing else under build dirs is live.
- Only delete the EXACT paths listed. Do not improvise additional deletions.
- Use `git rm` for git-tracked files and `git mv` for the spec moves so history is preserved; use plain `rm -rf` only for gitignored dirs (.next, .tmp, dist, _harness-archive, *.log).

## TIER 1 — backend dead code (verified zero importers). Use `git rm`.
- `scripts/lib/project-prompts.mjs`  (grep: no importer anywhere in scripts/)
- `scripts/validate-model-workbench.mjs`  (retired stub; NOT in package.json "validate")
Re-verify each with: `grep -rn "project-prompts" scripts` and `grep -rn "validate-model-workbench" scripts package.json`. If either shows a real importer, SKIP that file and report it.

## TIER 2 — stale artifacts / build caches. Plain `rm -rf` (these are gitignored or untracked).
- `.next/`  (Next build cache, regenerated)
- `.tmp/`
- `dist/`  (old Vite build output)
- `_harness-archive-20260529/`
- `vite-articles.log`
- `vite-articles.err.log`
- `dev-server.log`
- `data/papers/cache/radar-cache.json`  (orphaned cache, no reader/writer — verify with `grep -rn "radar-cache" scripts src app`; if a reference exists, SKIP and report)

## TIER 4 — archive historical specs. Use `git mv` into `docs/superpowers/specs/_archive/` (create the dir).
- `docs/superpowers/specs/2026-05-31-fde-analysis-paradigm.md`
- `docs/superpowers/specs/2026-05-30-content-analysis-model-redesign.md`
- `docs/superpowers/specs/2026-05-29-backend-eval-architecture-design.md`
- `docs/superpowers/plans/2026-05-30-academic-chunk3-papers-single-engine.md`
(If a path doesn't exist, report it; don't guess a replacement.)

## DO NOT TOUCH (verified ALIVE — for your awareness)
- `src/legacy/**` — the live Next.js frontend (misnamed, not legacy)
- `scripts/papers-radar.mjs` + `scripts/run-papers-radar.ps1` — used by npm scripts papers:discover/triage/review
- all `data/papers/*.json` date-stamped files — pipeline intermediates
- everything under `brief-wiki/`, `public/data/`, `data/agent-memory/`

## DELIVERABLE
Do NOT commit. Leave changes staged/unstaged in the working tree. Output a short report: for each path — DELETED / MOVED / SKIPPED(reason). The PM will review `git status` and commit.
