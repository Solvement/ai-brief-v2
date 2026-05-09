# AI-brief

> **Information -> Judgment -> Action.** A Chinese-first AI intelligence product that turns AI news, model updates, hot projects, skills, papers, articles, and courses into readable, actionable briefings.

[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

AI-brief is not a generic AI blog or a tool directory. Every public item should help the reader answer:

1. What happened?
2. Why does it matter?
3. Who is affected?
4. Should I read, try, save, ignore, or monitor it?
5. What can I do next?
6. How do I verify success?

## Current Columns

- **Home**: daily summary of the other columns. Home does not ingest content directly.
- **News**: AI stories and reporting. News cards intentionally do not show scoring UI.
- **Models**: model releases, benchmark-relevant updates, safety notes, cost/speed/context/tool-use analysis.
- **Projects**: GitHub Trending and topic/query search first, Hugging Face projects second; Product Hunt is configured but disabled until an approved API/import path is available.
- **Skills / MCP / Hooks**: installable or extractable agent behavior packs.
- **Articles**: high-quality company posts, research posts, papers, and discovery-linked deep reads.
- **Courses**: weekly checks of trusted AI learning sources.

## Status

| Capability | Status |
| --- | --- |
| LLM-backed evaluator with strict schema validation | done |
| Column-specific source policies | done |
| News / Models / Projects / Skills / Articles / Courses scoped ingestion | done |
| GitHub Trending + topic/query project ingestion | done |
| Hugging Face model, space, paper, and course ingestion | done |
| HN discovery signal handling | done |
| Rich BriefDetail detail pages | done |
| `prompt_version` cache invalidation | done |
| `image_plan` schema and media review states | done |
| Personal signals panel | done |
| Real scheduler / cron | todo |
| SSR / public deployment | todo |

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the dev server at `http://127.0.0.1:5173` or the port Vite prints.

The repository includes a checked-in live snapshot at `src/lib/content/live.generated.ts`, so the app is usable immediately after `npm install`. Live ingestion requires real API keys in `.env.local`; run it only after setting at least `DEEPSEEK_API_KEY` and `GITHUB_TOKEN`.

## Live Ingestion

Public pages read from `src/lib/content/live.generated.ts`. Seed data stays in the repo for tests and fixtures only; it is not used as the public fallback.

Source policy is column-scoped. See [`docs/source-policy.md`](./docs/source-policy.md) for the full list and the rules for what each column should and should not import.

Column groups:

- **News**: TechCrunch, The Verge, Wired, MIT Technology Review, VentureBeat, The Guardian, Tech Xplore, and ??? for daily open discovery; Reuters/AP/FT/Bloomberg/WSJ/The Information/Axios/NIST/CAISI stay configured for triggered verification/backchecks.
- **Models**: OpenAI, Anthropic, Google DeepMind, Mistral, Meta AI, DeepSeek, Qwen, Artificial Analysis, LMArena, OpenRouter.
- **Projects**: GitHub Trending, GitHub topic/query search, Hugging Face Spaces/Models, Show HN, with Product Hunt kept as an opt-in enrichment source.
- **Skills**: `SKILL.md`, `CLAUDE.md`, MCP servers, Cursor rules, hooks.
- **Articles**: Hugging Face Papers, OpenReview, ACL, NeurIPS, ICML, ICLR, Papers with Code, filtered arXiv, HN discovery only.
- **Courses**: concrete course/module URLs only. The current live sources are Hugging Face LLM Course and Microsoft Learn Generative AI Fundamentals; DeepLearning.AI, OpenAI Academy, and fast.ai are configured but disabled until catalog parsers select real course entries.

Useful command:

```bash
npm run ingest:live -- --columns=news,models,projects,skills,articles,courses --limit=6 --eval-concurrency=4 --evaluation-multiplier=4 --strict-source-health=true
```

Scoped command:

```bash
npm run ingest:live -- --columns=projects,skills
```

Debug a column without writing the live snapshot:

```bash
npm run ingest:live -- --columns=skills --limit=1 --dry-run=true
```

The script fetches only the requested column sources, filters candidates with that column's include/exclude policy, evaluates each item, writes SQLite records, and regenerates `src/lib/content/live.generated.ts`. It publishes only validated `eval-v*` LLM results. Deterministic fallback items are logged and skipped.

Every ingestion run writes `.tmp/ingest-report.json` with per-source health, per-column publication counts, skipped items, and source diversity. Public-release checks should add `--strict-source-health=true` so a thin snapshot fails instead of silently publishing. Current public-demo floors are: News >= 3, Models >= 3, Projects >= 4, Skills >= 3, Articles >= 3, Courses >= 2, with at least two source names per column. A checked-in summary of the latest public run lives at [`docs/live-ingest-report.md`](./docs/live-ingest-report.md).

Deep Dive is deliberately separate from standard detail pages. The current public snapshot exposes Card + BriefDetail/standard detail. Items that deserve long-form analysis but do not meet the 1500+ Chinese-character DeepDive quality bar are marked `needed_not_generated` instead of pretending to be deep analysis.

## Quality Gates

```bash
npm run typecheck
npm run lint
npm run validate
npm test
npm run build
```

CI runs the quality workflow in `.github/workflows/quality.yml`.

## Architecture

```text
src/
  AppRouter.tsx              # Home / News / Models / Projects / Skills / Articles / Courses
  components/                # Cards, layout, personal signal panel
  pages/                     # Home, directory pages, detail pages, admin pages
  lib/
    content/                 # ContentItem types, live snapshot, queries
    ai/evaluation/           # LLM evaluator, schema, prompt, cache
    ingestion/               # Column source policy, RSS, GitHub, HF, papers, courses
    media/                   # approved-media helpers and placeholders
    personal/                # local personal signals
    storage/                 # SQLite migrations and repositories
scripts/                     # live ingest, db scripts, quality gates
tests/                       # schema, ingestion, route, and UI smoke tests
```

## Image Policy

AI-brief does not automatically generate images. The evaluator emits an `image_plan` for editors. Source images from feeds can be attached as approved thumbnails. If an item has no approved image, the UI uses a CSS placeholder.

## License

[MIT](./LICENSE) © Kevin Wang.
