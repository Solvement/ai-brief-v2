# goals.md

Last updated: 2026-05-24

## Purpose

This document defines what AI Brief should become. Keep it strategic and stable. Use `current_problems.md` for what is broken right now.

## Product North Star

AI Brief should become a Chinese-first AI intelligence and learning system that turns noisy AI information into:

```text
Information -> Judgment -> Action
```

It should operate as a daily-updated site. The user should be able to open it each day and receive a small, high-quality brief of what changed in AI, what is worth learning, and what deserves deeper reading.

The product should help a student, builder, or AI PM answer:

1. What happened?
2. Why does it matter?
3. Who is affected?
4. Should I read, try, save, ignore, or monitor it?
5. What can I do next?
6. How do I verify success?

Default analysis should read like a clear GPT answer, not a visual dashboard. Start with judgment and a mental model, keep paragraphs short, and reserve visualization for architecture, workflow, data flow, and concrete examples.

## Long-Term Identity

AI Brief should become:

- an AI PM portfolio project;
- a scalable AI brief system;
- a multi-agent news and research analysis system;
- a learning workbench for models, papers, tools, projects, skills, and articles.

## Target User

Primary:

- Chinese-speaking AI student learning models, agents, RAG, AI coding, and AI product thinking.
- Student preparing for AI engineer applications in 2027, using this product as both learning system and portfolio foundation.

Secondary:

- AI PM building a portfolio.
- Indie hacker tracking AI tools and projects.
- Developer deciding what to try next.
- Research reader trying to understand papers by idea, architecture, evidence, and impact.

## Desired Product Surfaces

### Home

Goal:

- daily brief entry point;
- show a small recommended mix from News, Models, Projects, and Articles;
- keep navigation and high-level orientation clear;
- avoid an overloaded infinite feed.
- show pipeline health and memory status from `public/data/pipeline-status.json` so the user can see whether Projects, Articles, and Paper Radar actually refreshed and passed quality gates.

### News

Goal:

- AI news event analysis;
- deduplicate same event across sources;
- explain what happened, why it matters, affected audience, risks, and next actions.
- publish a small daily set, roughly 10 strong items in the News section and a few top picks on Home.

Future data flow:

```text
source crawl -> event clustering -> AI evaluation -> brief cards -> detail pages
```

### Models

Goal:

- company-level model evolution archive;
- each model generation has its own analysis;
- adjacent generations show inheritance, changes, motivation, and solved problems;
- benchmark charts are clear and visually comparable;
- product/API/tooling updates are linked to model capability changes.
- checked as part of the daily editorial loop, but updated only for meaningful releases, official documentation changes, benchmark shifts, or major product capability changes.

Current direction is correct. Continue expanding major companies and representative models, not every minor variant.

### Projects

Goal:

- GitHub Trending is the first project source;
- eventually add curated AI projects beyond trending;
- deep-dive priority should favor agent, RAG, MCP, A2A, memory, AI coding, tool-use, evaluation, workflow automation, and other AIGC engineering systems;
- generic skills/course/tutorial/awesome-list/cookbook and finance/fintech/crypto projects should usually stay light-read unless they teach reusable AI architecture;
- cards should let users decide within 5 seconds whether to open;
- detail pages should first make the project readable: judgment, solved problem, core mechanism, transferable pattern, and verification action. Architecture/workflow can be visualized; ecosystem, limitations, and judgment should stay mostly prose/list based.

Future direction:

- add project collections by tag;
- add reproducibility checks;
- add "try locally" difficulty.

### Skills

Goal:

- learning paths for practical AI skills:
  - Agent;
  - AI Coding;
  - MCP;
  - Workflow;
  - Prompt;
  - RAG;
  - Multimodal;
  - Local AI.

Each skill should include:

- concept map;
- examples;
- checklist;
- practice task;
- verification criteria.

### Articles

Goal:

- academic paper and long-form article deep reading;
- default feed should be quality-first and limited to 5 active papers per daily run;
- selection comes before templates: first judge whether a paper is worth reading, then choose the best interpretation template for that paper;
- good selection signals include recent/high-signal AI papers from big labs, well-known universities, top conferences, strong AI-engineer relevance, architecture value, evaluation quality, practicality, novelty, and transfer potential;
- topics should bias toward agents, RAG, memory, MCP/A2A-adjacent protocols, AI coding, tool-use, evaluation, multimodal/AIGC systems, and production AI engineering;
- explain the paper's central question in beginner-friendly Chinese;
- open the detail page with a reader-first explanation before exposing the full workbench;
- show prerequisite terms, idea, architecture, method flow, evidence, limitations, and professor lens as separate views;
- choose the analysis template by `paper_type` only after the paper passes quality selection, because benchmark/evaluation papers need claim/evidence/experiment/反方/落地 translation more than a normal method-summary flow;
- separate original paper content from later ecosystem extensions;
- keep version changes as an optional lens when they reveal method, evidence, or framing changes;
- teach students how to verify they understood the paper through concrete self-tests with pass criteria, common mistakes, and answer key points.
- daily paper discovery, but strict inclusion: if a paper is added, it must receive a complete deep dive.
- previous or non-top-5 papers should be saved in archive so their ideas and architecture notes remain reusable without bloating the daily feed.
- one-click curated refresh is acceptable for the MVP, but the long-term goal is automatic candidate discovery plus strict human/agent quality gating.

Current Articles MVP covers this direction with a recent AI-engineer batch such as LongMemEval-V2, Debug2Fix, SciAgentGym, MemoryArena, Agent Lightning, SWE-Bench Illusion, Mem0, and BrowseComp, while older classics such as Transformer, RAG, LoRA, DPO, ReAct, Generative Agents, SWE-agent, Latent Diffusion Models, and TheAgentCompany remain as archive/background material.
SWE-Bench Illusion now acts as the benchmark/evaluation reference template: the page must teach what the paper questions, how each diagnostic experiment works, what evidence supports or weakens the claims, and how to transfer the evaluation idea into the user's own coding-agent or AI system evaluation.

Future direction:

- add paper families:
  - Transformer lineage;
  - RLHF / DPO / preference optimization;
  - RAG / retrieval / memory;
  - agents / tool use;
  - diffusion / multimodal;
  - efficient fine-tuning.

### AI Job Research Radar

Goal:

- help the user prepare for AI engineer applications and interviews;
- automatically discover a small set of high-value AI papers without crawling all arXiv;
- triage by role relevance, architecture value, practicality, novelty, evaluation quality, interview value, and build potential;
- review only 1-2 papers per run with a Pro-class model;
- treat newness and hotness as quality signals, while still filtering for durable AI-engineer learning value;
- produce professor-style reviews that teach what to learn, what is good, what is weak, and which design patterns can be transferred into future work;
- produce a daily job-prep digest with one must-read paper, three skim papers, one professor lesson, one good idea to steal, one bad idea or risk, one transferable pattern, one future work application, one architecture takeaway, one interview talking point, and one project idea;
- publish the latest digest to `public/data/paper-radar.json` so Articles can show the research pipeline without weakening the full-deep-dive requirement.

This surface should remain independent from News and Projects. The Articles UI may show the latest radar digest, but radar papers should only enter the active Articles feed after a full deep dive is generated and validated.

## System Goals

### Scalable AI Brief System

The system should standardize on this information research pipeline:

```text
discover -> evidence -> rank -> review -> verify -> publish -> archive
```

Every stage should have a clear logical owner:

- `Discoverer`: source scan, query expansion, candidate discovery, and freshness/hotness signals.
- `Evidence Collector`: source URLs, official/third-party status, metadata, and source coverage.
- `Ranker`: impact, confidence, actionability, readability, AI-engineer learning value, and "why now" scoring.
- `Teacher Reviewer`: professor-style explanation that teaches what to learn, good ideas, weak points, transferable patterns, and future-work applications.
- `Verifier`: schema checks, text encoding, source grounding, executable verification tasks, and same-day official verification for model "latest" claims.
- `Publisher`: small active feeds for user-facing pages.
- `Archivist`: durable archives for older, non-top-5, or background items.

Current MVP implementation should keep this lightweight: `scripts/lib/agentic-pipeline.mjs` is the shared local Orchestrator contract for agent flow, quality gates, optional trace/reflection records, JSON memory, and `public/data/pipeline-status.json`. It should remain file-based until the local JSON pipeline becomes insufficient.

The system should eventually support:

- multiple source adapters;
- deduplication;
- ranking;
- AI evaluation;
- provenance;
- validation;
- UI presentation;
- feedback loop.
- shared run memory.
- reflection: what worked, what to watch, and how the next run should adjust.

Target pipeline:

```text
discover source candidates
  -> collect evidence and normalize metadata
  -> dedupe same event / repo / paper / model update
  -> rank with section-specific rubrics
  -> review selected items into learning-ready analysis
  -> verify schemas, sources, encoding, and executable tasks
  -> publish small active feeds
  -> archive non-active items
```

Discovery and triage must be observable. Candidate files should show source adapter, query label, query expansion terms, candidate counts, matched topics, freshness/hotness signals, selection reasons, and rejection reasons so future agents can debug missed AHE-like concepts rather than guessing.

### Multi-Agent News Analysis

Desired future agent roles:

- Discoverer: fetches sources and extracts raw candidates;
- Evidence Collector: normalizes metadata and source coverage;
- Ranker: clusters same event and estimates impact, actionability, freshness, confidence, and learner value;
- Teacher Reviewer: writes structured Chinese-first briefings with useful judgment;
- Verifier: checks hallucination risk, source coverage, schema validity, and freshness claims;
- Publisher: compresses validated items into active News/Home feeds;
- Archivist: keeps non-active but reusable events available for later context.

Do not create this full system prematurely. Start by extracting clean modules from the existing ingestion script.

### MVP Infrastructure Boundary

The current target remains static React + TypeScript + Vite, Node scripts, JSON contracts, DeepSeek model routing, and validation gates. Future infrastructure such as Kafka, Kubernetes, Prometheus, distributed queues, databases, or a separate agent orchestration service should be evaluated only after the local JSON pipeline can no longer support the product need.

### AI PM Portfolio

The project should demonstrate:

- product judgment;
- information architecture;
- AI evaluation design;
- data pipeline thinking;
- frontend execution;
- validation discipline;
- explainable ranking;
- real user learning value.

Portfolio-worthy milestones:

1. Working multi-section MVP.
2. Clear content data contracts.
3. Source-grounded analysis with provenance.
4. Ranking and evaluation rubric.
5. Multi-agent ingestion pipeline.
6. Search / related-item discovery.
7. Deployed demo with stable daily update.

## Daily Update Bar

Daily update does not mean adding everything.

The daily site should prefer:

- fewer items with stronger judgment;
- clear provenance and dates;
- visible "why now" reasoning;
- section-specific evaluation rubrics;
- no shallow paper entries;
- no stale "latest model" claims.

## Quality Bar

Every major feature should have:

- explicit data type in `src/types.ts`;
- static or generated data outside UI components;
- validation script where practical;
- loading, empty, and error states;
- local browser QA;
- build passing.

## Content Quality Bar

Cards should answer in 5 seconds:

- what is this;
- why should I care;
- who is this for;
- how much time/effort is needed;
- should I open it;
- what action can I take.

Detail pages should include:

- TL;DR;
- background;
- key facts;
- impact by audience;
- opportunities;
- risks;
- how to use;
- checklist / prompt / workflow;
- related items.
- executable verification tasks where the user can tell whether they understood or successfully tried the item.

## Near-Term Goals

1. Keep Projects, Models, and Articles stable.
2. Update README/AGENTS to reflect actual implemented sections.
3. Add provenance display to model and article claims.
4. Improve project ranking stability.
5. Add automatic article candidate discovery from arXiv, OpenReview, company research pages, and top-conference accepted papers.
6. Keep AI Job Research Radar source adapters reliable and narrow.
7. Continue splitting ingestion into crawler, ranking, prompt, and analysis modules where the interface earns its keep.
8. Add Skills as the next structured learning section.

## Non-Goals For Now

Avoid these until the MVP needs them:

- full backend rewrite;
- large dependency-heavy framework migration;
- database before data contracts stabilize;
- authentication;
- enterprise admin workflows;
- over-generalized agent platform.

## Maintenance Rule

Update this document when the user's strategic direction changes.

If the user says "I want this to become..." or "the goal is...", reflect that here.
