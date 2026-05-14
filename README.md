# AI Brief

Chinese-first AI intelligence briefings for learning, judgment, and action.

The current app has two working surfaces:

- `Home`: GitHub Trending daily / weekly / monthly repository briefings.
- `Models`: curated company-level model and product-capability evolution archives.

## What It Does

- Shows three boards: daily, weekly, monthly.
- Scores every fetched repository with `worthDeepDive`.
- Generates deep dives for the highest-value repositories above the threshold.
- Adds a `Models` column with the first company page: DeepSeek.
- Explains each model generation and its relationship to the next generation.
- Tracks selected major model/product/API updates.
- Uses a tiny hash router:
  - `#/`
  - `#/models`
  - `#/models/:companyId`
  - `#/repo/:owner/:name`
- Reads static data from `public/data/trending.json`.
- Reads curated model data from `public/data/models.json`.
- In dev, the home page can trigger `/__ingest`, which streams `scripts/ingest.mjs` output and reloads after success.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the Vite URL, currently `http://127.0.0.1:5180`.

If `public/data/trending.json` is fresh enough, `predev` skips ingestion. If it is older than `INGEST_INTERVAL_HOURS` (default 18), dev startup runs ingestion first.

## Commands

```bash
npm run typecheck
npm run lint
npm run validate
npm run build

npm run ingest
npm run ingest:force
npm run ingest:dry
```

`npm run build` writes to `dist/`, which is ignored.

`npm run validate` checks both `public/data/trending.json` and `public/data/models.json`.

## Ingestion

`scripts/ingest.mjs`:

- scrapes GitHub Trending for `daily`, `weekly`, and `monthly`;
- fetches each repository README through the GitHub API;
- asks DeepSeek for a light analysis of every fetched repository;
- selects deep-dive candidates by `worthDeepDive >= 60`, capped by `--cap`;
- writes `public/data/trending.json`.

The `Models` column is intentionally not part of ingestion. It is manually curated from official sources so each company page can focus on learning value and model-generation reasoning instead of daily churn.

Defaults:

- `--limit=15`
- `--cap=6`
- `--worth=60`

Useful variants:

```bash
npm run ingest:dry
npm run ingest -- --limit=10 --cap=4 --worth=70
npm run ingest:force
```

## Environment

```text
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
GITHUB_TOKEN=
INGEST_INTERVAL_HOURS=18
```

`DEEPSEEK_API_KEY` is required for real analysis. `GITHUB_TOKEN` is optional but strongly recommended for README rate limits.

## Project Structure

```text
.
├── index.html
├── package.json
├── public/
│   └── data/
│       ├── models.json
│       └── trending.json
├── scripts/
│   ├── ingest.mjs
│   ├── lint.mjs
│   ├── maybe-ingest.mjs
│   ├── validate-models.mjs
│   └── validate-trending.mjs
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── styles.css
    ├── types.ts
    ├── components/
    │   ├── Markdown.tsx
    │   ├── RepoCard.tsx
    │   └── SiteHeader.tsx
    ├── lib/
    │   └── data.ts
    └── pages/
        ├── Detail.tsx
        ├── Home.tsx
        └── Models.tsx
```

## Current Scope

The legacy AI-brief v2 multi-column implementation was removed from this workspace. Do not depend on old `src/lib/content`, `src/lib/ai`, `src/pages/DirectoryPages`, or old admin pages; they are intentionally gone.

`Models` currently includes DeepSeek only. Add future companies by extending `public/data/models.json` and keeping `scripts/validate-models.mjs` green.
