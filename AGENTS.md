# AGENTS.md

## Product

This repository is currently the cleaned GH Trending Deep Dive foundation for AI-brief.

The app turns GitHub Trending daily / weekly / monthly repositories into Chinese briefings for AI builders and researchers. The working product surface is intentionally narrow:

- Home: three trending boards.
- Repo detail: README quick read, key concepts, architecture flow, novelty, ecosystem, limitations, try-it steps, and scoring.
- Ingest: GitHub Trending HTML + GitHub README + DeepSeek analysis into `public/data/trending.json`.

Future upper-layer AI-brief work should build on this running base instead of reviving the removed legacy multi-column code.

## Product Principle

Information -> Judgment -> Action.

Every major feature should help users answer:

1. What is this repository?
2. Why is it trending now?
3. Why does it matter for AI work?
4. Should I read, try, save, ignore, or monitor it?
5. What can I do next?
6. How do I verify success?

## Current Data Contract

Current public data lives at `public/data/trending.json`.

Core object families:

- `TrendingData`
- `Board`
- `AnalyzedRepo`
- `DeepDive`

Keep all data objects explicitly typed in `src/types.ts`.

## Engineering Rules

- Prefer TypeScript.
- Keep the current runtime closure small.
- Do not reintroduce removed legacy AI-brief v2 modules unless there is a concrete migration plan.
- Do not hard-code mock data directly in UI components.
- Keep generated build output ignored.
- Keep `public/data/trending.json` valid so the app can run without an immediate API call.
- Do not silently ignore ingestion, fetch, or JSON parsing errors.
- Avoid large dependencies unless they are needed for the current product surface.

## Done Means

A task is done only when:

- The feature works locally.
- Type check passes.
- Lint passes.
- Validation passes where practical.
- Production build passes.
- The final response includes changed files, how to test, and known limitations.
