# AI Brief SPEC

Status: Draft for Kevin review

## Project Portrait

AI Brief is a Chinese-first AI intelligence and learning product. Its core principle is:

```text
Information -> Judgment -> Action
```

The current repository is a local-first MVP built with Vite, React, TypeScript, Node scripts, and static JSON data contracts. It turns AI projects, model updates, papers, articles, and related research signals into readable, actionable briefings.

AI Brief is intended to become a daily-updated intelligence site and learning workbench. It should prefer a small number of high-signal items over broad coverage, and it should help the user understand what changed in AI, why it matters, whether to read/try/save/ignore/monitor it, and how to verify understanding.

This draft SPEC is not accepted yet. It consolidates existing project materials into one review surface for Kevin.

## Problem

Most AI feeds optimize for volume. AI Brief exists because Kevin needs an intelligence and learning system that optimizes for judgment:

- what happened;
- why it matters;
- who is affected;
- whether to read, try, save, ignore, or monitor;
- what to do next;
- how to verify success or understanding.

The current project already has useful product docs, scripts, data contracts, and AI workflow notes, but it did not have one reviewed root SPEC that anchors goals, non-goals, acceptance criteria, verification expectations, and human/AI responsibility.

Current documented weaknesses include:

- Home is still closer to a navigation hub than a true daily selected mix.
- News is not yet implemented as a real small-batch signal pipeline.
- Models require same-day official-source verification for "latest" claims.
- Project ranking needs more structured reasons and stability.
- Paper Radar and Articles still need a narrow promotion step.
- Project, model, and article claims need better provenance display.
- GitHub Trending parsing needs snapshot tests.
- The frontend CSS is still concentrated in one large file.

## Goals

The current supported goals are:

1. Maintain AI Brief as a Chinese-first AI intelligence and learning system.
2. Use the principle `Information -> Judgment -> Action` as the product spine.
3. Keep the current MVP lightweight: React, TypeScript, Vite, Node scripts, structured JSON, model routing, and validation gates.
4. Help the user answer:
   - What happened?
   - Why does it matter?
   - Who is affected?
   - Should I read, try, save, ignore, or monitor it?
   - What can I do next?
   - How do I verify success?
5. Keep Projects, Models, Articles, and AI Job Research Radar stable while improving daily update quality.
6. Build toward a small, high-quality daily brief rather than an infinite feed.
7. Preserve section-specific rubrics and data contracts instead of forcing News, Projects, Models, Articles, and Papers into one generic format.
8. Make discovery, ranking, review, verification, publishing, and archive decisions inspectable enough that future agents can debug misses and overclaims.

Near-term goals from existing docs include:

- improve Home into a cross-section daily brief entry point;
- build News as a real signal pipeline;
- add provenance display to model and article claims;
- improve project ranking stability;
- add article source adapters for high-signal papers;
- keep AI Job Research Radar narrow and reliable;
- continue splitting ingestion into source, ranking, prompt, and analysis modules only where interfaces earn their keep;
- add Skills as a structured learning section when ready.

## Non-Goals

The current project should not prematurely add:

- full backend rewrite;
- database before data contracts stabilize;
- authentication;
- enterprise admin workflows;
- Kafka, Kubernetes, Prometheus, distributed queues, or a full external orchestration platform;
- large dependency-heavy framework migration;
- over-generalized agent platform;
- shallow paper entries in Articles;
- model "latest" claims without same-day official-source verification;
- Course navigation or Courses product scope unless Kevin explicitly reverses the current decision.

This SPEC draft also does not accept any future GitHub release, deployment, social promotion, risk tradeoff, or final product scope. Those remain Kevin-owned decisions.

## Current Surfaces

Implemented or partially implemented surfaces:

- `Home`: navigation hub plus pipeline status panel; target is a small cross-section daily brief.
- `Projects`: GitHub Trending daily/weekly/monthly project briefings and project detail pages.
- `Models`: curated company-level model and product-capability evolution archive.
- `Articles`: academic paper and article deep-reading workbench with active and archived paper data.
- `AI Job Research Radar`: standalone CLI/data pipeline for AI engineer job-prep paper discovery, triage, review, and daily digest.
- `Repo detail`: project README quick read, key concepts, architecture flow, novelty, ecosystem, limitations, try-it steps, and scoring.
- `Ingest`: GitHub Trending HTML plus GitHub README plus DeepSeek analysis into structured project data.

Placeholder or not-yet-real surfaces:

- `News`: planned signal/news section, not a real pipeline yet.
- `Skills`: planned structured learning section, not implemented yet.

Deprecated or out of scope unless Kevin reverses it:

- `Courses`.

Current routes documented by the project include:

```text
#/
#/projects
#/repo/:owner/:name
#/models
#/models/:companyId
#/articles
#/articles/:paperId
#/news
#/skills
```

## Data / Pipeline Surfaces

The canonical product pipeline is:

```text
discover -> evidence -> rank -> review -> verify -> publish -> archive
```

The current implementation is intentionally file-based and local:

- `src/`: frontend routes, components, data loaders, and typed contracts.
- `public/data/`: active frontend JSON data.
- `data/`: local generated research outputs and agent-memory JSON.
- `scripts/`: ingestion, article refresh, paper radar, validation, and pipeline utilities.
- `scripts/lib/agentic-pipeline.mjs`: shared local pipeline contract, not a separate runtime service.

Important public data contracts include:

- `public/data/trending.json`
- `public/data/models.json`
- `public/data/articles.json`
- `public/data/articles-archive.json`
- `public/data/paper-radar.json`
- `public/data/pipeline-status.json`

Important generated/local data includes:

- `data/agent-memory/*.json`
- `data/papers/*.json`
- `data/papers/reviewed/*.json`

Logical pipeline roles are:

- `Discoverer`: finds candidate sources and preserves source/query/freshness signals.
- `Evidence Collector`: captures URLs, metadata, official/third-party status, and source coverage.
- `Ranker`: applies section-specific rubrics and records selection/rejection reasons.
- `Teacher Reviewer`: turns selected items into Chinese learning-oriented analysis.
- `Verifier`: checks schemas, source grounding, encoding, hallucination risk, and executable verification tasks.
- `Publisher`: writes the active user-facing JSON feed after validation.
- `Archivist`: preserves non-active or previous items without bloating daily surfaces.

Current scripts already provide real feedback candidates, but they are not yet an accepted unified verify gate.

## Human / AI Responsibility Split

Kevin owns:

- product direction and tradeoffs;
- active scope and non-goals;
- final acceptance of this SPEC;
- risk acceptance;
- gate weakening;
- external publishing or delivery;
- final go/no-go on merges or releases;
- decisions about whether v2 remains the active base versus any v3-clean influence.

AI may:

- draft product and harness artifacts from existing evidence;
- ask clarifying questions;
- implement approved changes inside explicit boundaries;
- run local checks;
- propose source, ranking, validation, and documentation improvements;
- expose uncertainty instead of silently deciding.

AI must not:

- invent product goals;
- treat private or tool memory as project authority;
- claim final acceptance;
- weaken verification gates;
- publish externally without approval;
- present generated analysis or model "latest" claims as verified unless same-day official evidence supports them.

The `.ai` collaboration model currently treats Kevin as source of truth, Claude as PM/reviewer, and Codex as executor. That workflow is useful meta-infrastructure, but it is not product code and does not replace Kevin's final judgment.

## Acceptance Criteria

A change to AI Brief should be considered done only when the relevant subset of these criteria is met:

- The implementation matches the product principle `Information -> Judgment -> Action`.
- The changed surface remains consistent with the current active scope and non-goals.
- Public data object shape stays reflected in `src/types.ts` and validation scripts.
- Chinese text does not contain mojibake or suspicious encoding damage.
- Generated or curated claims have appropriate source grounding.
- Model "latest" claims are verified against official sources on the same day they are edited.
- Section-specific rubrics remain distinct for News, Projects, Models, Articles, and Paper Radar.
- If data contracts, routes, ingestion, ranking, crawler behavior, or product goals change, the relevant long-term docs are updated.
- For code or data changes, relevant checks pass before completion.
- The final task summary includes changed files, how to test, and known limitations.

Draft product-level acceptance for this SPEC itself:

- Kevin has reviewed and revised the project portrait.
- Kevin has confirmed active surfaces and non-goals.
- Kevin has confirmed which checks define default verification.
- Kevin has answered or intentionally deferred the open questions below.
- This SPEC is explicitly marked accepted only after human signoff.

## Verification Expectations

Existing candidate checks from `package.json`:

```bash
npm run typecheck
npm run lint
npm run validate
npm run test
npm run build
```

Observed script meanings:

- `typecheck`: TypeScript no-emit compile check.
- `lint`: project-specific lightweight lint script.
- `validate`: text encoding, trending, models, model workbench, articles, paper radar, and pipeline status validation.
- `test`: Node tests plus validation in the current `package.json`.
- `build`: typecheck plus Vite build.

Candidate unified verify command for Kevin review:

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Stricter candidate if Kevin wants `validate` to appear explicitly:

```bash
npm run typecheck && npm run lint && npm run validate && npm run test && npm run build
```

Open verification decision:

- `test` already includes `validate`, so Kevin should decide whether default verify should call both `validate` and `test` or rely on `test` plus `build`.
- Any check that depends on API keys, network, live crawling, or rate limits should be classified before becoming a default blocker.

This section is a draft expectation only. It does not create an accepted verify gate or modify `package.json`.

## Open Questions For Kevin

1. Is AI-Brief v2 still the active implementation base, or should any AI-Brief-v3-clean decisions affect this SPEC now?
2. Is the current north star still "Chinese-first AI intelligence and learning system" with `Information -> Judgment -> Action`?
3. Which surfaces are active for the next phase: Home, Projects, Models, Articles, AI Job Research Radar, News, Skills?
4. Should News or Home daily brief be the first product expansion after this SPEC?
5. Are Courses permanently out of scope, or only out of scope for the current MVP?
6. Which verification command should block completion by default?
7. Should default verify duplicate `validate` if `test` already runs it?
8. Are any current checks too slow, flaky, API-key-dependent, or network-dependent for default verification?
9. What evidence is enough to say "model latest claim verified today"?
10. Should `.ai/sessions` remain the primary task-history system, or should AI Brief add a Jarvis-style `task-board.md` later?
11. Which facts in `.omc/project-memory.json` should be promoted into repository docs, and which are stale/tool-local?
12. Should `docs/repo_map.md` remain the main project map, or should a thin root `dev-map.md` point to it later?
13. What is the smallest next write after this SPEC draft if Kevin accepts the direction?

## SPEC Readiness Check

- [x] Project portrait is explicit.
- [x] Problem statement is explicit.
- [x] Goals are separated from non-goals.
- [x] Current surfaces are listed.
- [x] Data and pipeline surfaces are listed.
- [x] Human/AI responsibility split is explicit.
- [x] Verification candidates are grounded in existing scripts.
- [x] Open questions preserve uncertain decisions for Kevin.
- [ ] Kevin has reviewed and accepted the project portrait.
- [ ] Kevin has confirmed active scope and non-goals.
- [ ] Kevin has confirmed acceptance criteria.
- [ ] Kevin has selected the default verification gate.
- [ ] Kevin has decided how `.ai`, `.omc`, and future project knowledge should relate.
- [ ] This SPEC has been explicitly accepted by Kevin.
