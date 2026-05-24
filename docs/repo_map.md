# repo_map.md

Last updated: 2026-05-21

## Purpose

This document maps the repository for future agents. Keep it current when directories are added, removed, renamed, or when ownership boundaries change.

## Multi-Agent Contract In This Repo

The product pipeline is:

```text
discover -> evidence -> rank -> review -> verify -> publish -> archive
```

There is no physical `agents/` directory yet. The current role mapping is:

- `Discoverer`: source adapter and candidate collection code in `scripts/ingest.mjs`, `scripts/refresh-articles.mjs`, and `scripts/papers-radar.mjs`.
- `Evidence Collector`: README fetches, paper metadata, source URLs, and trace fields stored in generated JSON.
- `Ranker`: project `worthDeepDive`, article `qualityDecision`, paper radar deterministic/model triage, and future section-specific scoring fields.
- `Teacher Reviewer`: DeepSeek-generated project deep dives, article deep-reading objects, and paper radar professor-style reviews.
- `Verifier`: `scripts/validate-*.mjs`, `scripts/lint.mjs`, `npm run validate`, typecheck, build, and same-day official checks for model "latest" claims.
- `Publisher`: scripts or curated edits that write active user-facing JSON in `public/data/`.
- `Archivist`: `public/data/articles-archive.json`, `data/papers/reviewed/`, and `data/agent-memory/*.json` for durable non-active research memory.

The shared local helper for this contract is `scripts/lib/agentic-pipeline.mjs`. It creates agent-flow objects, quality gates, optional trace/reflection records, per-surface memory files, and `public/data/pipeline-status.json`.

Discovery and triage outputs must carry observability trace: source adapter, query label, query expansion terms, candidate counts, matched topics, freshness/hotness signals, ranking reasons, and rejection reasons. Paper Radar daily output additionally carries `run_trace` and `reflection` so future agents can inspect stage timing, model usage, review depth, watch items, and next-run adjustments. The trace is stored in JSON outputs for now; there is no Prometheus, Kafka, Kubernetes, queue, or database dependency in the current MVP.

## Current Top-Level Map

```text
.
├── AGENTS.md
├── README.md
├── data/
├── docs/
├── public/
├── scripts/
├── src/
├── vite.config.js
├── package.json
└── tsconfig.json
```

## src/

Main frontend application code.

```text
src/
├── App.tsx
├── main.tsx
├── styles.css
├── types.ts
├── components/
├── lib/
└── pages/
```

### `src/App.tsx`

Tiny hash router. Current routes:

```text
#/                         Home
#/projects                 GitHub Trending project boards
#/repo/:owner/:name        project detail
#/models                   model company index
#/models/:companyId        model company detail
#/articles                 academic article index
#/articles/:paperId        academic paper deep-reading workbench
#/news                     placeholder
#/skills                   placeholder
```

### `src/main.tsx`

React app entry point.

### `src/types.ts`

Canonical TypeScript data contracts for:

- GitHub Trending projects;
- project deep dives;
- model company archive;
- academic article deep-reading workbench.

Update this file before changing JSON data shapes.

### `src/lib/`

Data loader layer.

Current file:

```text
src/lib/data.ts
```

It loads:

- `./data/trending.json`
- `./data/models.json`
- `./data/articles.json`
- `./data/paper-radar.json`
- `./data/pipeline-status.json`

The loader uses in-memory cache variables to avoid repeated fetches during one browser session.

### `src/components/`

Small reusable UI pieces.

```text
src/components/
├── Markdown.tsx
├── RepoCard.tsx
└── SiteHeader.tsx
```

- `SiteHeader.tsx`: shared top navigation.
- `RepoCard.tsx`: GitHub project card for the Projects board.
  It now renders beginner decision signals: why it matters, who it is for, recommended action, and explicit value/total score labels.
- `Markdown.tsx`: lightweight markdown-ish renderer for project deep dives.

### `src/pages/`

Page-level UI.

```text
src/pages/
├── Home.tsx
├── Projects.tsx
├── Detail.tsx
├── Models.tsx
└── Articles.tsx
```

- `Home.tsx`: navigation hub plus compact Agentic Pipeline status panel loaded from `public/data/pipeline-status.json`.
- `Projects.tsx`: GitHub Trending boards and manual one-click ingest trigger.
- `Detail.tsx`: project detail page for `#/repo/:owner/:name`.
  It includes beginner overview loops, lite details for non-deep repos, and derived project verification prompts.
- `Models.tsx`: model company archive, version workbench, benchmark charts.
  It includes release chips, benchmark plain-language notes, previous-release deltas, and derived model verification prompts.
- `Articles.tsx`: academic paper workbench with `paper_type`-aware detail views.
  The index is quality-first: it displays the daily active top 5 from `public/data/articles.json`, sorted by `qualityDecision.qualityScore`, and only then shows the chosen interpretation template.
  Generic/system papers keep plain-language, architecture, evidence, professor/self-check, and optional version views.
  Benchmark/evaluation papers use dedicated Paper Question, Claim Map, Experiment Matrix, Critical Review, Application, and Interview Card views, with the version lens hidden unless the paper has meaningful version differences.
  It defaults to a main reading path before tab-specific exploration.

## public/

Static assets and data served by Vite.

```text
public/
├── favicon.svg
└── data/
    ├── trending.json
    ├── models.json
    ├── articles.json
    ├── articles-archive.json
    ├── paper-radar.json
    └── pipeline-status.json
```

### `public/data/trending.json`

Generated by `scripts/ingest.mjs`. Do not manually rewrite unless intentionally editing generated data.

### `public/data/models.json`

Curated data. Contains model company profiles, model releases, benchmark chart data, learning paths, and product/API updates.

### `public/data/articles.json`

Daily active curated data. Contains at most 5 academic papers selected by `qualityDecision`, plus plain-language explanations, prerequisite terms, idea/architecture breakdowns, architecture block walkthroughs, method flows, design choices, evidence lenses, experiment-reading templates, executable verification tasks, optional version timelines, source links, `paperType`, `templateDecision`, and optional type-specific analysis blocks such as `benchmarkEvaluation`.

### `public/data/articles-archive.json`

Archive of previous or non-top-5 papers. It preserves full paper objects plus archive metadata so older work can be reused for future idea, architecture, and foundation references without crowding the daily feed.

### `public/data/paper-radar.json`

Generated by `scripts/papers-radar.mjs daily`. It exposes the latest AI Job Research Radar digest to the Articles page: must-read paper, skim papers, agent flow, triage summary, selection trace, run trace, reflection, professor lesson, transferable pattern, and project idea. It is not a substitute for `articles.json`; radar papers still need a full deep dive before entering the active Articles feed.

### `public/data/pipeline-status.json`

Generated by `scripts/lib/agentic-pipeline.mjs` through Projects / Articles / Paper Radar runs, or rebuilt from existing public data with `scripts/sync-pipeline-status.mjs`. Home reads it to show the latest quality status, selected/archive counts, and memory run counts for each surface.

## data/

Local generated data that is not served directly by the Vite app.

```text
data/
├── agent-memory/
│   ├── projects.json
│   ├── articles.json
│   └── paper_radar.json
└── papers/
    ├── candidates-YYYY-MM-DD.json
    ├── triage-YYYY-MM-DD.json
    ├── reviews-YYYY-MM-DD.json
    ├── daily-YYYY-MM-DD.json
    ├── cache/
    │   └── radar-cache.json
    └── reviewed/
        └── <paper-id>-YYYY-MM-DD.json
```

`data/papers/` belongs to AI Job Research Radar. It is still independent from News and Projects, but its latest daily digest is now published to `public/data/paper-radar.json` so the Articles page can show the research pipeline status without automatically promoting radar papers into the curated Articles feed.

`data/agent-memory/` is the lightweight shared memory layer. It stores recent runs, quality gates, optional trace/reflection objects, selected items, archived items, and reusable patterns for each surface. It is JSON memory, not a database.

## scripts/

Validation, ingestion, and maintenance scripts.

```text
scripts/
├── ingest.mjs
├── lib/
│   ├── agentic-pipeline.mjs
│   ├── github-trending.mjs
│   ├── project-prompts.mjs
│   └── project-ranking.mjs
├── maybe-ingest.mjs
├── papers-radar.mjs
├── refresh-articles.mjs
├── sync-pipeline-status.mjs
├── run-papers-radar.ps1
├── lint.mjs
├── validate-papers-radar.mjs
├── validate-pipeline-status.mjs
├── validate-text-encoding.mjs
├── validate-trending.mjs
├── validate-models.mjs
├── validate-model-workbench.mjs
└── validate-articles.mjs
```

### `scripts/ingest.mjs`

Current project ingestion pipeline:

```text
GitHub Trending -> GitHub README -> DeepSeek analysis -> trending.json
```

This is the closest current equivalent to an `agents/` pipeline.

It now delegates the three highest-friction responsibilities to deeper modules:

- `scripts/lib/github-trending.mjs`: GitHub Trending HTML parsing and GitHub README fetch adapter.
- `scripts/lib/project-ranking.mjs`: AI-engineer project focus adjustment and deep-dive index selection.
- `scripts/lib/project-prompts.mjs`: project light/deep DeepSeek prompt contracts and user prompt builders.

`ingest.mjs` remains the orchestrator: cache, model calls, normalization, quality gate, memory write, and publishing. It also writes a shared pipeline run record through `scripts/lib/agentic-pipeline.mjs`: agent flow, quality gate, selected deep-dive repos, light-read archive items, and `public/data/pipeline-status.json`.

Model selection:

- `PROJECT_LIGHT_MODEL` controls repo card triage and light summaries; default `deepseek-v4-flash`.
- `PROJECT_DEEP_MODEL` controls selected project deep dives; default `deepseek-v4-pro`.
- `DEEPSEEK_MODEL` remains a fallback for older local setups.

### `scripts/maybe-ingest.mjs`

Runs before dev server start. It checks whether `trending.json` is stale and decides whether to ingest.

### `scripts/refresh-articles.mjs`

Refreshes the curated recent AI-engineer paper batch in `public/data/articles.json`.

Current scope:

- recent agent / memory / RAG-tool-use / coding-agent evaluation papers;
- big-lab, well-known university, top-conference, or clear AI-engineer relevance;
- every included paper receives a full deep dive object, not a shallow excerpt.

It also writes Articles pipeline memory and quality-gate status through `scripts/lib/agentic-pipeline.mjs`.

### `scripts/papers-radar.mjs`

Standalone AI Job Research Radar pipeline.

Commands:

- `discover`: fetches candidates from paper/research sources, records discovery trace, and writes `data/papers/candidates-YYYY-MM-DD.json`;
- `triage`: deterministic score plus optional cheap model pass through `PAPERS_TRIAGE_MODEL` defaulting to `deepseek-v4-flash`, records freshness/hotness signals plus selection/rejection reasons, and writes top 10 to `data/papers/triage-YYYY-MM-DD.json`;
- `review`: reviews only top 1-2 papers through `PAPERS_REVIEW_MODEL` defaulting to `deepseek-v4-pro`, stores durable reviews under `data/papers/reviewed/`, and emphasizes professor-style learning, good ideas, weak points, transferable patterns, and future work applications;
- `daily`: creates the daily job-prep digest, records run trace/reflection, and publishes the current frontend summary to `public/data/paper-radar.json`;
- `run`: full sequence.

`daily` also writes Paper Radar pipeline memory, stores trace/reflection in `data/agent-memory/paper_radar.json`, and updates `public/data/pipeline-status.json`.

### `scripts/lib/agentic-pipeline.mjs`

Shared local Orchestrator contract for the MVP.

Responsibilities:

- build canonical role flow: discover -> evidence -> rank -> review -> verify -> publish -> archive;
- create quality gates with pass/warning/fail checks;
- write per-surface JSON memory to `data/agent-memory/`, including optional trace and reflection records;
- publish `public/data/pipeline-status.json` for Home.

### `scripts/lib/github-trending.mjs`

GitHub source adapter for Projects. It owns:

- fetching GitHub Trending HTML;
- parsing repository rows;
- fetching README text through the GitHub API;
- keeping GitHub-specific user-agent, HTML decoding, and README truncation details out of the ingest orchestrator.

### `scripts/lib/project-ranking.mjs`

Projects ranking module. It owns:

- the AI-engineer focus regular expressions;
- project focus guidance used by the light-analysis prompt;
- worthDeepDive post-processing for agent/RAG/MCP/A2A/memory/AI-coding/eval signals;
- deep-dive candidate selection from worth threshold and cap.

### `scripts/lib/project-prompts.mjs`

Projects prompt module. It owns:

- the light analysis system prompt;
- the deep analysis system prompt;
- repo/readme user prompt builders for each tier.

### `scripts/sync-pipeline-status.mjs`

Backfills pipeline memory from existing `public/data/*.json` without re-crawling GitHub or overwriting Projects content. Use `npm run pipeline:sync` after manual data edits or when the status file needs to be regenerated.

### `scripts/run-papers-radar.ps1`

Windows Task Scheduler wrapper for the full radar run.

### Validation scripts

- `validate-trending.mjs`: checks project data shape.
- `validate-models.mjs`: checks model archive data shape.
- `validate-model-workbench.mjs`: checks required model UI pieces exist.
- `validate-articles.mjs`: checks academic article data shape.
- `validate-papers-radar.mjs`: checks AI Job Research Radar generated files when present.
- `validate-pipeline-status.mjs`: checks shared pipeline status and agent-memory files.
- `validate-text-encoding.mjs`: catches public JSON mojibake and suspicious repeated question marks.
- `lint.mjs`: repository-specific lightweight lint validation.

## docs/

Project memory and design notes.

```text
docs/
├── architecture.md
├── repo_map.md
├── current_problems.md
├── goals.md
├── ai_brief_ui_mockup_v2.html
└── superpowers/
```

The four markdown files above are long-term maintenance docs. Future agents should update them when the project changes.

`docs/ai_brief_ui_mockup_v2.html` exists as a mockup artifact. It is currently untracked in git in this workspace unless the user chooses to add it.

## Logical Modules Requested By Product Direction

The user thinks about the system in these logical modules:

```text
src/
agents/
ranking/
crawler/
frontend/
```

Current physical repo does not yet have `agents/`, `ranking/`, `crawler/`, or `frontend/` top-level directories. The current equivalents are:

### agents/

Current equivalent:

```text
scripts/ingest.mjs
scripts/refresh-articles.mjs
scripts/papers-radar.mjs
scripts/lib/agentic-pipeline.mjs
scripts/lib/project-prompts.mjs
```

Responsibilities:

- call LLM;
- request light and deep project analysis;
- enforce JSON output through prompt shape;
- decide which repos deserve deep dive.
- preserve discovery/triage traces where a script performs candidate discovery.
- write shared local agent-flow, quality-gate, and memory records for Projects, Articles, and Paper Radar.

Future direction:

- split into agent modules;
- make project/news/model/article agents explicit;
- add retries, provenance, and evaluation logs.

### ranking/

Current equivalent:

```text
worthDeepDive in public/data/trending.json
score fields in model/article data
scripts/lib/project-ranking.mjs
```

Responsibilities:

- score project value;
- decide deep-dive candidates;
- present impact/actionability/readability/confidence.

Future direction:

- extract scoring rubric into code;
- make ranking deterministic where possible;
- log why an item received a score.
- improve query expansion so AHE-like emerging terms are not missed silently.

### crawler/

Current equivalent:

```text
scripts/lib/github-trending.mjs
```

The GitHub Trending source adapter is now separate from `scripts/ingest.mjs`, but still uses HTML parsing and still needs parser snapshot tests.

Responsibilities:

- scrape GitHub Trending HTML;
- fetch GitHub README through API;
- normalize repo metadata.

Future direction:

- split crawler from analysis;
- add duplicate detection;
- add source adapters for papers, news, and model release pages.
- handle 403 or dynamic company research pages with source-specific fallback rules.

### frontend/

Current equivalent:

```text
src/
```

Responsibilities:

- render navigation and pages;
- load static JSON;
- show cards, workbenches, charts, timelines, details;
- provide dev-only ingest trigger on Projects.
- provide dev-only article refresh trigger on Articles.

Future direction:

- possibly move frontend to `frontend/` only if repo becomes multi-package.
- avoid premature restructure before backend/agent modules exist.

## Maintenance Rule

Update this map when:

- a new directory is added;
- logical modules become physical modules;
- a page moves;
- a data file is added or removed;
- scripts are renamed;
- a placeholder section becomes implemented.
