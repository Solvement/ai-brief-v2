# AI Brief

AI Brief is a Chinese-first AI intelligence product for turning noisy AI information into readable, actionable briefings.

The product principle is:

```text
Information -> Judgment -> Action
```

The current repository is a local-first MVP. It focuses on AI projects, model evolution, academic papers, and a small research radar for AI engineer job preparation.

## Why This Exists

Most AI feeds optimize for volume. AI Brief optimizes for judgment:

- what happened;
- why it matters;
- who should care;
- whether to read, try, save, ignore, or monitor;
- what to do next;
- how to verify understanding.

The long-term goal is a daily-updated AI intelligence website that prefers a small number of high-signal items over broad coverage.

## Current Surfaces

- `Home`: navigation hub plus pipeline status.
- `Projects`: GitHub Trending daily / weekly / monthly repository briefings.
- `Models`: curated company-level model and product-capability evolution archive.
- `Articles`: recent AI paper deep-reading workbench.
- `AI Job Research Radar`: standalone CLI/data pipeline for paper discovery, triage, and 1-2 professor-style paper reviews.
- `News` and `Skills`: placeholders.

Routes:

```text
#/
#/projects
#/repo/:owner/:name
#/models
#/models/:companyId
#/articles
#/articles/:paperId
```

## What Works Today

- Vite + React + TypeScript frontend.
- Static JSON data contracts in `public/data/`.
- GitHub Trending ingestion through `npm run ingest`.
- One-click dev refresh from the Projects page.
- Articles are published from the papers pipeline into `public/data/articles.json`.
- AI Job Research Radar through `npm run papers:run`.
- Shared local pipeline status through `public/data/pipeline-status.json`.
- Validation gates for JSON shape, UI contract checks, and Chinese text encoding.
- Model routing via environment variables, for example `PROJECT_LIGHT_MODEL` and `PAPERS_REVIEW_MODEL`.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the Vite URL printed by the terminal.

For real AI analysis, set:

```env
DEEPSEEK_API_KEY=
GITHUB_TOKEN=
```

`GITHUB_TOKEN` is optional but recommended for README rate limits. Do not commit `.env.local`.

## Commands

```bash
npm run typecheck
npm run lint
npm run validate
npm run build
```

Project refresh:

```bash
npm run ingest
npm run ingest:force
npm run ingest:dry
```

Articles and paper radar:

```bash
node scripts/run.mjs papers all --dry-run
node scripts/run.mjs papers publish
npm run papers:discover
npm run papers:triage
npm run papers:review
npm run papers:daily
npm run papers:run
```

Pipeline status rebuild:

```bash
npm run pipeline:sync
```

## Architecture

Canonical content pipeline:

```text
discover -> evidence -> rank -> review -> verify -> publish -> archive
```

Current implementation is intentionally lightweight:

- `src/`: frontend routes, components, and typed data contracts.
- `public/data/`: active frontend JSON data.
- `data/`: local generated research and pipeline memory.
- `scripts/`: ingestion, paper radar, validation, and pipeline utilities.
- `scripts/lib/agentic-pipeline.mjs`: shared local pipeline contract.
- `scripts/lib/github-trending.mjs`: GitHub Trending source adapter.
- `scripts/lib/project-ranking.mjs`: project deep-dive ranking rules.
- `scripts/lib/project-prompts.mjs`: project analysis prompt contracts.

No database, queue, Kubernetes, Prometheus, or external orchestration runtime is required for the current MVP.

## Data Contracts

- `public/data/trending.json`: GitHub Trending project briefings.
- `public/data/models.json`: curated model archive.
- `public/data/articles.json`: active top paper deep dives.
- `public/data/articles-archive.json`: archived or non-active paper deep dives.
- `public/data/paper-radar.json`: latest paper radar digest for frontend visibility.
- `public/data/pipeline-status.json`: shared pipeline run status for Home.
- `data/agent-memory/*.json`: local pipeline memory.
- `data/papers/*.json`: AI Job Research Radar outputs.

All public data shapes should stay reflected in `src/types.ts` and validation scripts.

## Where The Project Is Not Good Enough Yet

The useful next improvements are not more UI polish. The hard parts are product judgment and source grounding:

- Home should become a true daily recommended mix, not just a navigation hub.
- News needs a real small-batch signal pipeline.
- Models need same-day official-source verification for any "latest" claim.
- Project ranking needs structured reasons, not only `worthDeepDive`.
- Paper Radar and Articles need a narrow promotion step so strong radar papers can become full Articles deep dives.
- Project, model, and article claims need better provenance display.
- GitHub Trending HTML parsing needs snapshot tests.
- CSS is still one large file and should be split once the product surface stabilizes.

See:

- `docs/architecture.md`
- `docs/repo_map.md`
- `docs/current_problems.md`
- `docs/goals.md`

## Open Source Status

This repository is published as an experimental learning and product-architecture project.

It is not a finished SaaS product. It is useful as:

- an AI PM / AI engineer portfolio base;
- a local AI intelligence workflow;
- a reference for JSON-first agentic content pipelines;
- a study tool for AI projects, model releases, and papers.

## License

MIT.
