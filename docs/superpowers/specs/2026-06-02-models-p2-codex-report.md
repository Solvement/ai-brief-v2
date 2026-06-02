# Models P2 Backend Codex Report

Date: 2026-06-02

## Files Added

- `scripts/columns/models/registry.mjs`
  - Seed registry for open families: DeepSeek-V4, Qwen, Llama, Mistral.
  - Seed registry for closed families: OpenAI GPT, Claude, Gemini.
  - Closed changelog URLs are present but marked `TODO(PM)` for official-source verification before P3 wiring.
- `scripts/columns/models/prompts.mjs`
  - Open-model and closed-model prompts.
  - Persona-first, Chinese, applied-builder angle.
  - Hard rules baked in: latest-version-only, official-source grounding, closed features only from official changelog, vendor self-claims marked low confidence, no fabricated benchmark numbers.
- `scripts/columns/models/sources.mjs`
  - Stage-1 cheap fetchers.
  - Open: HuggingFace API model + org listing, license/eval/card/status extraction.
  - Closed: official changelog fetch + best-effort latest named release parse.
  - Also supports `--offline` shape dry-run status.
- `scripts/columns/models/generate.mjs`
  - Stage-2 generator.
  - Exports `generateModelEntry({ model, fetched, options, logger })`.
  - Online: `createDeepSeekClient().chatJson`, model env = `MODEL_ANALYSIS_MODEL || DEEPSEEK_MODEL || deepseek-v4-pro`.
  - Offline: deterministic stub, clearly marked, no LLM.
  - Loads the DeepSeek gold JSON as the open-model few-shot exemplar.
- `scripts/columns/models/daily.mjs`
  - P3 placeholder only.

## Files Changed

- `src/types.ts`
  - Replaced old `ModelCompany` / `ModelSeries` / `ModelRelease` shape.
  - New exports include `ModelsData`, `ModelEntry`, `ModelStatusCard`, `ModelOpenAnalysis`, `ModelClosedChangelog`, `ModelBenchmark`, `ModelBenchmarkChart`, `ModelBenchmarkItem`, etc.
- `public/data/models.json`
  - Replaced old company/series data with:
    - `{ generatedAt, models: [...] }`
    - One DeepSeek-V4 gold seed entry copied from the gold standard, with `_note` removed.
- `scripts/validate-models.mjs`
  - Rewritten for the new latest-version-only shape.
  - Validates identity, flattened status card, open/closed dispatch, sources, benchmark chart/item shape.
- `scripts/validate-model-workbench.mjs`
  - Retired no-op. P4 owns the frontend/workbench rewrite.
- `package.json`
  - Added:
    - `models:check`
    - `models:generate`
    - `models:daily`
  - Removed `validate-model-workbench.mjs` from `npm run validate`.

## New Shape

Top level:

```json
{
  "generatedAt": "ISO",
  "models": ["ModelEntry"]
}
```

Each `ModelEntry` is flattened:

- Identity: `id`, `name`, `vendor`, `country`, `kind`
- Status card: `latestVersion`, `latestVersionVariants?`, `latestReleasedAt`, `latestReleasedAtPrecision?`, `isOpen`, `license`, `hasEvalData`, `evalSources`, `evalThirdPartyPending?`, `hasChangelog`, `changelogUrl`, `lastCheckedAt`
- Open only: `analysis`
- Closed only: `changelog`
- Metadata: `analysisGeneratedAt`, `analysisAuthor`

## Invocation

Stage-1 cheap version check:

```bash
node scripts/columns/models/sources.mjs
node scripts/columns/models/sources.mjs deepseek-v4
node scripts/columns/models/sources.mjs --kind open
node scripts/columns/models/sources.mjs --offline
```

Via npm:

```bash
npm run models:check -- deepseek-v4
```

Stage-2 generation:

```bash
node scripts/columns/models/generate.mjs deepseek-v4 --offline
node scripts/columns/models/generate.mjs deepseek-v4
node scripts/columns/models/generate.mjs openai-gpt --kind closed
```

Via npm:

```bash
npm run models:generate -- deepseek-v4 --offline
```

Daily placeholder:

```bash
npm run models:daily
```

## Cheap PM Verification

I did not run these, per author-only instruction. PM can run:

```bash
node scripts/columns/models/generate.mjs deepseek-v4 --offline
npm run validate
```

Optional no-network stage-1 shape check:

```bash
node scripts/columns/models/sources.mjs --offline
```

## Expected Breakage

`src/pages/Models.tsx` still imports and consumes the old model types (`ModelCompany`, `ModelRelease`, `ModelSeries`, etc.). Typecheck/build will break until P4 rewrites the frontend against `ModelsData.models`.

This is expected and intentional for P2. I did not touch frontend `.tsx`.

## Remaining Work

- P3: Vercel `/api/models`, `/api/models/refresh`, `/api/models/analyze`, token gate, and KV persistence.
- P4: `src/pages/Models.tsx` frontend rewrite for status cards, latest-version detail view, and refresh/analyze UI.
- P5: Deploy, fill env vars, run the 2026-06-02 full refresh, and verify current official changelog URLs.
