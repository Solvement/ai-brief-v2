# AGENTS.md

## Product

This repository is for AI-brief, a Chinese-first AI intelligence product that turns AI news, model updates, tools, projects, papers, articles, and guides into readable, actionable briefings.

The product principle is:

Information -> Judgment -> Action.

AI Brief is a daily-updated intelligence website, not a static encyclopedia.
Every daily run should prefer a small number of high-signal items over broad coverage.
Daily freshness matters, but quality rules still apply:

- News and Projects are expected to refresh daily.
- Projects have a one-click dev refresh through the Projects page and `npm run ingest`.
- Articles have a one-click dev refresh through the Articles page and `npm run refresh:articles`.
- Home should eventually surface today's recommended mix across news, models, articles, and projects.
- Models and Articles should be checked regularly, but only updated when there is a meaningful release, paper, benchmark, or high-signal source.
- Any academic paper included in Articles must receive a full deep dive; shallow paper excerpts should not be added.
- Articles should prefer recent high-signal AI papers from big labs, well-known universities, top conferences, or clear AI-engineer relevance. Do not fill the feed with old classics unless they are explicitly needed as archive/background.
- Model "latest" claims must be verified against official sources on the day they are edited.

## Multi-Agent Research Pipeline Contract

Use this canonical information research pipeline across News, Models, Projects, Articles, and AI Job Research Radar:

```text
discover -> evidence -> rank -> review -> verify -> publish -> archive
```

The role split is logical in the current MVP, even when the implementation is still a Node script or curated JSON edit:

- `Discoverer`: finds candidate sources and records source, query label, candidate count, matched topics, freshness, hotness, and obvious rejection signals.
- `Evidence Collector`: captures source URLs, official/third-party status, paper/repo/model metadata, and evidence needed to separate fact from interpretation.
- `Ranker`: applies section-specific scoring for impact, readability, actionability, confidence, AI-engineer learning value, and "why now".
- `Teacher Reviewer`: turns selected items into professor-style Chinese explanations with what to learn, what is good, what is weak, transferable patterns, and future-work applications.
- `Verifier`: checks schemas, source coverage, text encoding, hallucination risk, executable verification tasks, and same-day official-source checks for model "latest" claims.
- `Publisher`: writes the validated active dataset for the user-facing surface, keeping the daily set small and decision-ready.
- `Archivist`: preserves non-active or previous items for reuse without bloating the daily feed.

Observability trace is mandatory for discovery and triage. A future agent must be able to debug why an AHE-like emerging term, paper, repo, or model update was found, ranked, rejected, or missed. Discovery/triage outputs should preserve query expansion terms, source adapter results, candidate counts, freshness/hotness signals, ranking reasons, and rejection reasons. Paper Radar runs should also preserve lightweight stage telemetry, model-call/token usage when available, and a reflection block that records what worked, what to watch, and what to adjust next run.

Current MVP boundary: keep the system on React, TypeScript, Vite, Node scripts, structured JSON, and validation gates. Kafka, Kubernetes, Prometheus, distributed queues, databases, and full agent orchestration platforms are future possibilities only; do not treat them as current dependencies or document them as implemented.

The shared local implementation for this contract lives in `scripts/lib/agentic-pipeline.mjs`. It provides the common agent-flow roles, quality gate shape, optional trace/reflection storage, JSON memory writer, and `public/data/pipeline-status.json` publisher. It is a lightweight Orchestrator contract, not a separate runtime service.

Every major feature should help users answer:

1. What happened?
2. Why does it matter?
3. Who is affected?
4. Should I read, try, save, ignore, or monitor it?
5. What can I do next?
6. How do I verify success?

## Current Working Surface

- `Home`: navigation hub for the main product sections.
- `Projects`: GitHub Trending daily / weekly / monthly repository briefings.
- `Models`: company-level model and product-capability evolution archives.
- `Articles`: academic paper and long-form article deep-reading workbench.
- `AI Job Research Radar`: standalone CLI/data pipeline for AI engineer job-prep paper discovery, triage, and 1-2 paper reviews. It writes to `data/papers/` and must not be coupled to News or Projects. Its reviews should read like a professor guiding a student: what to learn, what is good, what is weak, and how to transfer the idea into future work.
- `Repo detail`: README quick read, key concepts, architecture flow, novelty, ecosystem, limitations, try-it steps, and scoring.
- `Ingest`: GitHub Trending HTML + GitHub README + DeepSeek analysis into `public/data/trending.json`.

## Core Navigation

Use this navigation structure:

- Home
- News
- Models
- Projects
- Skills
- Articles

Home, Projects, Models, and Articles are implemented right now. News and Skills are placeholders. Courses has been removed from product scope. Future sections should be added incrementally without reviving removed legacy code.

## Long-Term Maintenance Docs

Keep these documents current when the project changes:

- `docs/architecture.md`: system structure, agent flow, and pipeline.
- `docs/repo_map.md`: repository map and module responsibilities.
- `docs/current_problems.md`: current blockers, weaknesses, and known risks.
- `docs/goals.md`: product direction and long-term target state.

When changing routes, directories, data contracts, ingestion, ranking, crawler behavior, or product goals, update the relevant document in the same task.

## Content Tags

Use these as content tags:

- Agent
- AI Coding
- Agent Harness
- MCP
- Workflow
- Prompt
- RAG
- A2A
- Memory
- Multimodal
- Local AI
- Business
- Research
- Safety
- China
- Open Source

## Content Types

Supported content types:

- news
- model
- tool
- project
- integration
- article
- paper
- guide

## Card Philosophy

Large cards should help users decide within 5 seconds whether to open the item.

Every content card should include:

- title
- one_sentence_takeaway
- why_it_matters
- content_type
- target_audience
- reading_time
- action_label
- impact_score
- readability_score
- actionability_score
- confidence_score
- source_name
- source_url
- published_at

For learner-facing cards, make the decision signals visible, not hidden in hover or detail pages:

- what this is
- why it matters now
- who it is for
- reading / trying time
- recommended action

## Detail Page Philosophy

Detail pages should not be long summaries only. They must include:

- TL;DR
- Background
- Key facts
- Impact by audience
- Opportunities
- Risks
- How to use
- Checklist / prompt / workflow
- Related items

For academic paper deep dives, "verification" must be executable. Prefer concrete self-test tasks with pass criteria, common mistakes, and answer key points over abstract goals like "understand Q/K/V".

Projects and Models need the same learning closure: deep dives should show how to verify the user understood the project/model, even when the current data only supports a derived fallback.

## Project Deep-Dive Priority

Project deep dives should primarily target AI engineer learning value:

- prioritize agent systems, RAG, MCP, A2A, memory, AI coding, evaluation, tool use, workflow automation, multimodal agents, and other AIGC engineering systems;
- keep generic skills/course/tutorial/awesome-list/cookbook repositories as light-read unless they contain substantial reusable agent-system engineering;
- keep finance/fintech/trading/crypto/accounting/payment repositories as light-read unless the AI architecture is clearly reusable outside finance;
- do not deep dive a project just because it is popular on GitHub Trending.

The user is preparing for AI engineer applications in 2027, so project and paper choices should bias toward portfolio, interview, and production-system learning value.

## AI Evaluation Rules

Every imported item should be evaluated by AI using:

- readability_score
- impact_score
- actionability_score
- confidence_score
- difficulty
- recommended_action
- target_audience
- risks
- next_steps

Use different evaluation rubrics for news, models, tools, integrations, articles, papers, and guides.

## Data Contracts

- GitHub Trending data lives at `public/data/trending.json`.
- Curated model archive data lives at `public/data/models.json`.
- Curated academic article active feed lives at `public/data/articles.json`; it should contain only the daily quality-first top 5 papers.
- Curated academic article archive lives at `public/data/articles-archive.json`; it preserves previous or non-top-5 papers for future idea/architecture reuse.
- Shared pipeline status lives at `public/data/pipeline-status.json`; Home uses it to display the latest Projects / Articles / Paper Radar run status, including trace/reflection summaries when a surface provides them.
- Shared agent memory lives at `data/agent-memory/*.json`; it stores recent runs, selected items, archived items, quality gates, optional trace/reflection objects, and reusable patterns for each surface.
- `scripts/refresh-articles.mjs` maintains the current curated recent AI-engineer paper batch, scores paper quality before template selection, writes archive data, and is exposed in dev via the Articles page refresh button.
- AI Job Research Radar data lives at `data/papers/`:
  - `candidates-YYYY-MM-DD.json` from `npm run papers:discover`;
  - `triage-YYYY-MM-DD.json` from `npm run papers:triage`;
  - `reviewed/*.json` and `reviews-YYYY-MM-DD.json` from `npm run papers:review`;
  - `daily-YYYY-MM-DD.json` from `npm run papers:daily`.
- The latest paper radar daily digest is also published to `public/data/paper-radar.json` for the Articles page. This is a visibility bridge, not an automatic promotion into `public/data/articles.json`; active Articles still require a full deep dive.
- Paper radar triage should preserve freshness and hotness signals; paper radar reviews should include professor lens, what to learn, good ideas, bad ideas or limits, transferable patterns, future work applications, reading questions, and learning tasks.
- Paper radar daily outputs should include `run_trace` and `reflection`. `run_trace` is for debugging source coverage, stage timing, model usage, and candidate/review counts. `reflection` is for self-correction: what worked, watch items, non-negotiable self-corrections, and next-run adjustments.
- Paper radar discovery should explicitly search for emerging AI-engineer concepts that may not trend broadly yet, including agent harnesses, observability, execution traces, Terminal-Bench, self-improving coding agents, and coding-agent evaluation.
- Paper deep-reading objects should include `qualityDecision`, `templateDecision`, prerequisite terms, architecture walkthroughs, experiment-reading templates, and executable verification tasks.
- Keep all public data objects explicitly typed in `src/types.ts`.
- Keep validation scripts green for any changed data contract.
- `npm run pipeline:sync` may be used to rebuild `public/data/pipeline-status.json` from existing public data without re-crawling or overwriting Projects content.

## Engineering Rules

- Prefer TypeScript.
- Keep code modular and readable.
- Avoid over-engineering before MVP.
- Do not add large dependencies unless necessary.
- All data objects should have explicit types.
- Every feature must include basic tests or validation scripts where practical.
- Do not silently ignore errors.
- After editing public, paper-radar, or agent-memory data with Chinese text, audit for mojibake before finishing. `npm run validate` includes `scripts/validate-text-encoding.mjs` and must fail if generated data or key source files contain replacement characters, suspicious repeated question marks, or common UTF-8 mojibake sequences.
- Use model routing instead of one catch-all model where available: `PROJECT_LIGHT_MODEL=deepseek-v4-flash`, `PROJECT_DEEP_MODEL=deepseek-v4-pro`, `PAPERS_TRIAGE_MODEL=deepseek-v4-flash`, `PAPERS_REVIEW_MODEL=deepseek-v4-pro`, `MODEL_ANALYSIS_MODEL=deepseek-v4-pro`, and `VERIFY_MODEL=deepseek-v4-flash`.
- Add empty states, loading states, and error states for user-facing pages.
- Do not hard-code mock data directly in UI components. Put mock data in fixtures or seed files.
- Keep components small and composable.
- Do not reintroduce removed legacy AI-brief v2 modules unless there is a concrete migration plan.

## Done Means

A task is done only when:

- The feature works locally.
- Type check passes.
- Lint passes.
- Relevant tests or validation scripts pass.
- Production build passes.
- The implementation matches the product model above.
- The final response includes changed files, how to test, and known limitations.
