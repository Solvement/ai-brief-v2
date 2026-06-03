# Projects Radar Codex Report

## 1. New Flow

Implemented projects-only pipeline:

discover -> enrichment(evidence_signals) -> deterministic ranking -> deterministic depth decision -> tier analysis -> reviewer -> publish.

- `evaluate` no longer calls an LLM and no longer accepts an LLM verdict for depth.
- `list_only` stays deterministic/no LLM.
- `light` is selected for `PROJECT_LIGHT_MODEL` generation in the analyze stage.
- `analysis` and `deep` go through analyst LLM, then a separate reviewer LLM.
- Reviewer returns `pass | revise | downgrade`; revise gets one analyst retry, unresolved revise downgrades.
- Deep has no numeric cap. Every repo with `ranking_score >= 75` and no hard gate becomes `deep`.

## 2. Ranking Rubric

Implemented in `scripts/columns/projects/project-ranking.mjs`:

- `ai_relevance` 0-20
- `evidence_sufficiency` 0-20
- `architecture_value` 0-20
- `usability` 0-15
- `novelty` 0-15
- `trend_signal` 0-10

Tier mapping:

- `0-39 -> list_only`
- `40-59 -> light`
- `60-74 -> analysis`
- `75+ -> deep_candidate`

Hard gates cap `max_allowed_depth <= light`: README fetch failed, README empty/missing, slogan-only README, no docs/examples/install/demo, metadata-only evidence, no explicit AI relevance, awesome/course/tutorial/resource list, plain UI wrapper without agent/infra/workflow, cannot design a practical test plan.

## 3. Worked Examples

`tinyhumansai/openhuman`: enriched README/tree with agents, memory, docs, examples, tests, install, CLI, package files. Ranking reaches at least `analysis`; if score is 75+ and no hard gates fire, final depth is `deep`.

`anthropics/financial-services`: finance terms do not hard-cap because evidence includes agents, skills, commands, MCP connectors, vertical workflows, docs/examples/tests/install. Ranking reaches at least `analysis`.

`fixtures/readme-fetch-failed`: `readme_fetch_failed=true`, `readme_empty=false`, `needs_enrichment=true`, final depth is `needs_enrichment`; it is not treated as an empty README.

## 4. Files Changed

- `scripts/columns/projects/sources.mjs`
- `scripts/columns/projects/project-ranking.mjs`
- `scripts/columns/projects/evaluate.mjs`
- `scripts/columns/projects/index.mjs`
- `scripts/columns/projects/daily.mjs`
- `scripts/columns/projects/deepdive.mjs`
- `scripts/columns/projects/deepdive-prompts.mjs`
- `scripts/columns/projects/review.mjs`
- `scripts/columns/projects/brief-pipeline.mjs`
- `scripts/__tests__/project-ranking.test.mjs`
- `scripts/__tests__/projects-evaluate.test.mjs`
- `scripts/__tests__/fixtures/project-radar-regression-fixtures.mjs`

## 5. Tests And Fixtures

Regression fixtures are deterministic `evidence_signals` mocks:

- `tinyhumansai/openhuman`
- `anthropics/financial-services`
- `fixtures/empty-readme`
- `fixtures/slogan-only`
- `fixtures/high-star-only`
- `fixtures/readme-fetch-failed`

Cheap regression command for PM:

```bash
node --test scripts/__tests__/project-ranking.test.mjs scripts/__tests__/projects-evaluate.test.mjs
```

## 6. Daily Radar

Cheap offline shape run first:

```bash
npm run projects:daily -- --dry-run --cap 3 --radar-limit 3
```

Full daily radar after regression passes:

```bash
npm run projects:daily -- --limit 30 --radar-limit 30
```

`--cap` is now a debug candidate cap before ranking. It is not a deep quota.

## 7. One Project Deep Dive

Cheap offline shape:

```bash
node --no-warnings scripts/columns/projects/deepdive.mjs owner/name --offline
```

Paid/on-demand analyst + reviewer:

```bash
node --no-warnings scripts/columns/projects/deepdive.mjs owner/name
```

Reviewer model is configurable with `PROJECT_REVIEW_MODEL`; it falls back to `PROJECT_DEEP_MODEL`.

## PM Verification

Before any paid run, verify:

1. `node --test scripts/__tests__/project-ranking.test.mjs scripts/__tests__/projects-evaluate.test.mjs`
2. `npm run projects:daily -- --dry-run --cap 3 --radar-limit 3`
3. Inspect `public/data/trending.json` for `radar.repos[*]` and board cards carrying the new fields.

Frontend card fields to render or preserve:

`final_depth`, `ranking_score`, `max_allowed_depth`, `recommended_action`, `needs_enrichment`, `ranking_reasons`, `rejection_reasons`, `review_verdict`, `review_issues`, `evidence_summary`, `depth_decision`, `briefSlug` / `brief_slug`.
