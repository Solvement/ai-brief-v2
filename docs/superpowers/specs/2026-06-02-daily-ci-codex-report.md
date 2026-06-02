# Daily Backend + CI Codex Report

Date: 2026-06-02
Branch target: `feat/nextjs-migration`

## Files Changed

- `scripts/columns/models/daily.mjs`
- `scripts/daily.mjs`
- `.github/workflows/daily.yml`
- `package.json` added only `"daily": "node --no-warnings scripts/daily.mjs"`

## Models Daily Behavior

`scripts/columns/models/daily.mjs` now implements the check-first flow:

1. Loads `.env.local` using the same pattern as `scripts/columns/projects/daily.mjs`.
2. Does not overwrite an already-set `process.env` value, so OS-level `DEEPSEEK_API_KEY` wins over blank local env values.
3. Reads `public/data/models.json` and matches existing entries by `id`.
4. Runs stage-1 `fetchModelStatus()` for each selected model from `MODEL_REGISTRY`.
5. Compares fetched `latestVersion` to the existing entry.
6. If the model is new or the version changed, runs stage-2 `generateModelEntry()`.
7. If unchanged, keeps the existing `analysis` / `changelog` and refreshes only status-card fields like `latestVersion`, `latestReleasedAt`, `license`, `hasEvalData`, `changelogUrl`, and `lastCheckedAt`.
8. Writes `{ generatedAt, models: [...] }` back to `public/data/models.json`, preserving existing entry order and appending newly registered models at the end.

The version comparison tolerates display-only differences such as hyphens vs spaces and `(preview)` labels. This keeps the hand-authored `deepseek-v4` gold entry intact unless the actual version changes.

Flags:

- `--offline`: no LLM/network for models; existing entries are treated as unchanged because offline stubs are not release evidence.
- `--dry-run`: computes and logs what would change, writes nothing.
- `--only <id,...>`: limits the model set.
- `--cap N`: limits the selected model set after `--only`.

Summary log format:

```text
models: N checked, M new versions, K regenerated
```

## Unified Daily Orchestrator

`scripts/daily.mjs` runs columns in this sequence:

1. Papers: spawns `node --no-warnings scripts/papers-radar.mjs daily`
2. Projects: calls exported `main()` from `scripts/columns/projects/daily.mjs`
3. Models: calls exported `main()` from `scripts/columns/models/daily.mjs`

It passes through `--offline`, `--dry-run`, and `--cap`. A column failure is logged and does not stop later columns. The process exits non-zero only if all columns fail.

## GitHub Actions

`.github/workflows/daily.yml` runs daily at `16:00 UTC` and also supports `workflow_dispatch`.

Required repo secrets:

- `DEEPSEEK_API_KEY`
- `HF_TOKEN`
- `GITHUB_TOKEN`

CI steps:

1. Checkout.
2. Setup Node 20.
3. `npm ci`.
4. `npm run daily`.
5. If `git status --porcelain -- public/data data` shows changes, commit only `public/data` and `data` with:

```text
chore(daily): refresh content <date>
```

Then push back to the current branch.

## Cheap Test Command

Use this command for a cheap local verification pass:

```bash
npm run daily -- --offline --dry-run
```

This is intended to avoid LLM calls. For the models column, it also writes nothing.

## PM Still Owns

- Vite to Next script swap in `package.json`.
- Vercel deployment setup.
- API routes for the Next migration.
- Any frontend changes under `app/**`, `src/**`, and related config files.

## Verification Note

Per instruction, I did not run `npm`, `node`, `git`, tests, or any LLM calls while authoring these changes.
