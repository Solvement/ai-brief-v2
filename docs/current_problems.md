# current_problems.md

Last updated: 2026-05-24

## Purpose

This document tells future agents where the project is currently weak or stuck. Keep it factual. Do not use it as a wish list; use `goals.md` for desired direction.

## Current Status Summary

AI Brief is now a working local MVP with:

- Home navigation hub plus Agentic Pipeline status panel;
- Projects / GitHub Trending deep dives;
- Models / company model evolution archive;
- Articles / academic paper deep-reading workbench;
- validation scripts for current JSON data;
- Vite dev server and build pipeline;
- one-click dev refresh for Projects and curated Articles batches;
- standalone AI Job Research Radar CLI/data pipeline.
- shared local agentic pipeline helper in `scripts/lib/agentic-pipeline.mjs`;
- shared JSON memory in `data/agent-memory/`;
- shared public pipeline status in `public/data/pipeline-status.json`.

The system is still mostly file-based and manually curated outside the GitHub Trending pipeline.

The new documentation contract describes a logical multi-agent research pipeline:

```text
discover -> evidence -> rank -> review -> verify -> publish -> archive
```

That contract is not yet a separate orchestration platform. It is implemented through current scripts, curated JSON, `scripts/lib/agentic-pipeline.mjs`, validation gates, and manual official-source checks where needed.

Important product constraint:

- AI Brief is intended to be a daily-updated site.
- The current app can display daily data, Projects has a GitHub Trending ingestion loop, and Articles has a curated refresh script.
- News is not implemented yet, Models are still manually curated, and Articles discovery is not yet fully automatic.
- Discovery and triage observability trace is required for future source/ranking work. Paper Radar now exposes run trace and reflection; Projects / Articles still expose lighter quality-gate and memory records rather than full candidate lifecycle traces.

Recent Articles improvement:

- Articles now include prerequisite terms, architecture walkthroughs, experiment-reading templates, and executable self-check tasks.
- Articles now include a recent AI-engineer batch focused on agents, memory, RAG/tool-use, coding-agent evaluation, and high-signal 2025-2026 papers.
- The next risk is content quality consistency across future papers, not only UI structure.

Recent cross-section UX improvement:

- Projects cards now expose decision signals and score meanings.
- Project detail now has a reader-first brief, lightweight workflow sketch, and compact derived verification prompts.
- Models cards now show representative releases and recommended starting point.
- Models detail now has benchmark plain-language notes, previous-release deltas, and derived verification prompts.
- Articles detail now opens with a plain-language reader brief and keeps the main path to essential terms, method flow, evidence, and self-test.

Recent data quality fix:

- A Windows PowerShell here-string write corrupted newly added Chinese model/article data into repeated question marks.
- The corrupted OpenAI GPT-5.5 and new article entries were repaired.
- `scripts/validate-text-encoding.mjs` is now part of `npm run validate` to catch replacement characters and suspicious repeated question marks in public JSON, paper radar data, source UI files, and agent-memory JSON.

Recent agentic-structure improvement:

- `scripts/lib/agentic-pipeline.mjs` now provides a shared local agent-flow / quality-gate / memory contract.
- Projects, Articles, and Paper Radar write or can sync per-surface memory under `data/agent-memory/`.
- Home reads `public/data/pipeline-status.json` to show the latest pipeline status.
- Paper Radar daily output now includes `run_trace` and `reflection`: stage timing, candidate/review counts, model telemetry when available, review-depth signal, watch items, and next-run adjustments.

## Current Problems

### 1. Daily Update Pipeline Is Not End-To-End

Current state:

- `npm run dev` can refresh stale GitHub Trending data through `scripts/maybe-ingest.mjs`.
- News has no crawler, clustering, or story-style daily brief pipeline.
- Models require manual research and manual JSON edits.
- Articles can be refreshed with `scripts/refresh-articles.mjs`, but candidate discovery for the public Articles UI is still curated rather than fully automatic.
- AI Job Research Radar now publishes a visible daily digest to `public/data/paper-radar.json`, but it does not automatically promote papers into the curated Articles deep-dive feed.
- Home does not yet present a daily recommended mix; it only shows pipeline status.
- Projects, Articles, and Paper Radar now share a local agent-flow / quality-gate / memory contract, but News, Models, and the future Home daily brief do not yet share one automated `discover -> evidence -> rank -> review -> verify -> publish -> archive` implementation.
- Paper Radar has trace/reflection, but Projects and Articles do not yet have comparable per-candidate lifecycle trace from discovery to archive.

Symptoms:

- The product can become stale even if the UI works.
- "Latest model" claims require manual official-source verification.
- Strong papers may still be missed unless the curated batch is maintained or replaced by source adapters.
- Daily Home recommendations are not yet generated.
- Articles still have a promotion gap between the curated seed/live refresh data in `public/data/articles.json` and the AI Job Research Radar output in `data/papers/`.

What future agents should do:

- Add a daily source scan concept before adding many new sources.
- Build News as the first real daily editorial pipeline.
- Add stale-date checks for `models.json` and `articles.json`.
- Keep paper inclusion strict: full deep dive or no Articles entry.
- Add a small Home daily brief once News data exists.

### 2. Ranking Is Not Stable Enough

Current state:

- Project ranking uses `worthDeepDive` generated by DeepSeek inside `scripts/ingest.mjs`.
- `scripts/lib/project-ranking.mjs` now applies AI-engineer focus adjustment after the LLM score: agent/RAG/MCP/A2A/memory/AI-coding/eval projects are boosted, while generic skill/course/tutorial/awesome-list/cookbook and finance/fintech/crypto projects are capped to light-read unless architecture is clearly reusable.
- Deep-dive index selection is now a small ranking module instead of inline logic in the ingest orchestrator.
- Deep-dive selection depends on prompt quality, model behavior, threshold, and cap.
- There is now a narrow deterministic project ranking module, though shared section-wide ranking and structured score reasons still do not exist.

Symptoms:

- Similar repos may receive inconsistent scores across runs.
- `worthDeepDive` reasoning is not stored as a structured explanation.
- It is hard to debug why one repo was selected and another was not.
- `data/agent-memory/projects.json` records selected/archive items at the run level, but repo-level ranking reasons are still not first-class fields in `trending.json`.

What future agents should do:

- Extend the ranking rubric module with structured reasons and tests.
- Store score reasons in `trending.json`.
- Add validation for score dimensions.
- Consider a second-pass reranker before deep dives.

### 3. Agent Hallucination Risk

Current state:

- DeepSeek is prompted to base project analysis on README content.
- The prompt says "do not invent", but there is no source-grounding checker.
- Model/model and article archives are manually curated, but still rely on human/agent summary.

Symptoms:

- Project deep dives may infer architecture details that README does not prove.
- Model benchmark notes may become stale if official pages change.
- Article architecture and method explanations may still over-interpret paper intent if source evidence is not shown close to the claim.

What future agents should do:

- Store source snippets or evidence fields for all AI-generated claims.
- Add "confidence" and "source coverage" checks.
- Add a provenance panel in detail pages.
- For papers/models, distinguish official facts from interpretation.
- For paper deep dives, keep "original paper" and "modern extension" boundaries visible so students do not confuse later ecosystem knowledge with the paper's own contribution.

### 3a. Analysis Readability Can Still Regress

Current state:

- Projects and Articles now have reader-first default panels.
- Project prompts now require judgment and mental model before implementation details.
- Existing generated data still contains some dense passages, so the frontend uses compact excerpts in the default path.

Symptoms:

- A future ingest run can still produce analysis that is technically valid but hard to read if prompts or reviewers drift.
- Rich tabs can still become too card-heavy if every field is visualized.

What future agents should do:

- Keep default detail pages closer to a clear GPT answer than a dashboard.
- Visualize only architecture, workflow, data flow, and concrete examples.
- Prefer short paragraphs and compact lists for judgment, risks, ecosystem, and next actions.

### 4. Derived Verification Is A Stopgap

Current state:

- Articles have structured verification tasks in `articles.json`.
- Projects and Models now show verification prompts, but most of that UI is derived from existing fields instead of grounded in dedicated source data.

Symptoms:

- Project verification may be generic when `tryIt` is vague.
- Model verification may be generic when `experiments` are broad.
- Pass criteria are not yet source-grounded for generated project/model data.

What future agents should do:

- Add first-class verification tasks to generated project deep dives.
- Add first-class verification tasks to model release data.
- Include expected result, pass criteria, common mistakes, and fallback when a task cannot be run locally.

### 5. Crawler Is Fragile

Current state:

- GitHub Trending parsing uses HTML regex in `scripts/lib/github-trending.mjs`.
- README fetching uses the GitHub API through `scripts/lib/github-trending.mjs`.
- A narrow GitHub source adapter exists, but broader crawler/source-adapter structure does not.

Symptoms:

- GitHub markup changes can break parsing.
- Rate limits can affect README fetches when `GITHUB_TOKEN` is missing.
- There is no structured retry/backoff per source type beyond model-call retries.

What future agents should do:

- Add parser snapshot tests for `scripts/lib/github-trending.mjs`.
- Add source adapters:
  - GitHub Trending;
  - GitHub repository metadata;
  - arXiv;
  - model release pages;
  - news sources.
- Add snapshot tests for parser behavior.

### 6. Duplicate Detection Is Minimal

Current state:

- GitHub Trending daily / weekly / monthly can contain overlapping repos.
- `findRepo()` searches across windows, but data itself still repeats by board.
- Future news/article ingestion has no duplicate model yet.

Symptoms:

- Same project can appear in multiple boards.
- A future news crawler may ingest the same release from multiple sources.
- There is no canonical content identity layer.

What future agents should do:

- Add normalized IDs and canonical URLs.
- Track source duplicates separately from content duplicates.
- Add a merge strategy:
  - same project;
  - same model release;
  - same paper;
  - same news event.

### 7. Embedding / Semantic Recall Does Not Exist Yet

Current state:

- There is no embedding index.
- There is no semantic search.
- Data is loaded directly from static JSON.

Symptoms:

- Users cannot ask "show me all RAG-related items across papers/projects/models".
- Related items are not generated from semantic similarity.
- No cross-section discovery exists.

What future agents should do:

- Add an embedding pipeline only after content schemas stabilize.
- Start with local JSONL export before adding a database.
- Add cross-content related item generation:
  - model -> paper;
  - paper -> project;
  - project -> skill.

### 8. Curated Data Can Become Stale

Current state:

- `models.json` and `articles.json` are manually curated.
- They use official sources but are not auto-refreshed.
- Current date is important for "latest" model claims.

Symptoms:

- Model pages may show outdated "latest" releases.
- Benchmark numbers may drift as vendors update pages.
- Academic articles may have new arXiv versions not reflected in `articles.json`.
- Model "latest" claims can become wrong unless every edit is verified against official sources on the same day.

What future agents should do:

- Add `updatedAt` checks and stale badges.
- Add a source verification script.
- For any "latest" claim, browse official sources before editing.
- Record the official verification date when a model release or product capability is described as latest.
- Keep benchmark source type visible: official, third-party, derived.
- Make daily freshness visible in the UI so the user knows which section was refreshed today and which section is an archive item.

### 9. Articles Feed And Paper Radar Need A Promotion Step

Current state:

- `public/data/articles.json` is the public active five-paper feed maintained by `scripts/refresh-articles.mjs`.
- `public/data/articles-archive.json` preserves previous or non-top-5 deep dives.
- `data/papers/` is the AI Job Research Radar output for job-prep discovery, triage, review, and daily digests.
- `public/data/paper-radar.json` now exposes the latest radar digest in the Articles UI.
- There is still no import bridge that promotes radar findings into the public Articles active/archive workflow.

Symptoms:

- A strong live radar paper may not appear in Articles unless the curated refresh script or a human/agent edit adds it.
- Article seed quality can stay high but miss emerging research vocabulary.
- Radar reviews can be professor-style and useful, but only the daily digest is visible; full radar reviews are not yet rendered as Articles deep dives.

What future agents should do:

- Design a narrow promotion step from radar triage/review into Articles candidates before changing UI behavior.
- Preserve strict quality gates: active Articles still need full deep dives, `qualityDecision`, `templateDecision`, evidence, and executable verification tasks.
- Keep the active feed capped to 5 and archive everything else.

### 10. Paper Radar Source Adapters Need Maintenance

Current state:

- `scripts/papers-radar.mjs` uses lightweight adapters for Hugging Face Daily Papers, Papers with Code trending, arXiv filtered search, OpenReview selected venues, ACL Anthology selected events, CVF Open Access selected events, and company research pages.
- It writes to `data/papers/` and avoids the existing News/Projects pipeline.
- AHE-like emerging terms depend on query expansion and traceable discovery coverage.

Symptoms:

- HTML pages can change.
- Public sources such as arXiv can rate-limit or time out during daily runs.
- OpenReview venue IDs must be updated over time.
- Company research pages can return 403, be dynamic, or produce weak candidate extraction.
- Query expansion can miss AHE-like new terms such as agent harness, execution trace, trajectory, rollback, harness safety, and related phrases if they are not first-class search targets.
- The radar is job-prep focused, not a complete paper database.
- The resume cache can protect daily output quality, but it can also make a fallback run less fresh than a fully successful live run.
- Without observability trace, it is hard to tell whether a paper was absent from sources, filtered out, ranked low, or rejected by model triage.

What future agents should do:

- Keep source lists small and high-signal.
- Add snapshot tests for adapters before expanding sources.
- Add source-specific extractors only when generic extraction becomes too noisy.
- Keep query expansion terms and source hit counts visible in candidates/triage JSON.
- Keep review volume capped to 1-2 papers per run.
- Keep daily output explicit about freshness and hotness signals so cached candidates are not mistaken for brand-new discoveries.

### 11. Frontend Is Growing In One CSS File

Current state:

- `src/styles.css` contains all page styles.
- Models and Articles both use complex workbench layouts.

Symptoms:

- CSS file is getting large.
- Page-specific classes can accumulate without cleanup.
- Future UI changes may accidentally affect other pages.

What future agents should do:

- Keep CSS class names page-scoped.
- Consider splitting CSS by page once the MVP stabilizes.
- Do not introduce a large design dependency unless clearly needed.

### 12. README And AGENTS Can Drift

Current state:

- Product surfaces evolved quickly: Projects, Models, and Articles are implemented.
- README/AGENTS may lag behind new features.

Symptoms:

- Future agents may follow stale "only Home and Models are implemented" statements if not updated.
- Project memory becomes inconsistent.

What future agents should do:

- Treat these long-term docs as canonical current context.
- Update AGENTS.md when the active product surfaces change.
- Update README when user-facing setup or features change.

## Not Problems Yet

These are expected MVP limitations, not current blockers:

- No database.
- No authentication.
- No production deployment.
- No automatic model/news ingestion beyond the current GitHub Trending path.
- Article UI refresh is one-click curated; AI Job Research Radar has automatic discovery but is not connected to Articles UI.
- No physical `agents/` directory yet. The current Orchestrator is a lightweight helper in `scripts/lib/agentic-pipeline.mjs`.
- No Kafka, Kubernetes, Prometheus, queue system, or database dependency in the current MVP.

Do not add these prematurely unless the user asks or the current feature requires them.

## Immediate Next Fix Candidates

1. Define the daily update contract for News, Projects, Models, Articles, and Home.
2. Build News as the first daily editorial pipeline.
3. Add "refreshed today / archive item" freshness indicators.
4. Add article source adapters for arXiv, OpenReview, company research blogs, and top-conference accepted papers.
5. Add tests and structured reason fields for the new GitHub source adapter and project ranking module.
6. Add source evidence/provenance display to Models and Articles.
