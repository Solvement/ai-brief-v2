# goals.md

Last updated: 2026-05-15

## Purpose

This document defines what AI Brief should become. Keep it strategic and stable. Use `current_problems.md` for what is broken right now.

## Product North Star

AI Brief should become a Chinese-first AI intelligence and learning system that turns noisy AI information into:

```text
Information -> Judgment -> Action
```

The product should help a student, builder, or AI PM answer:

1. What happened?
2. Why does it matter?
3. Who is affected?
4. Should I read, try, save, ignore, or monitor it?
5. What can I do next?
6. How do I verify success?

## Long-Term Identity

AI Brief should become:

- an AI PM portfolio project;
- a scalable AI brief system;
- a multi-agent news and research analysis system;
- a learning workbench for models, papers, tools, projects, skills, and articles.

## Target User

Primary:

- Chinese-speaking AI student learning models, agents, RAG, AI coding, and AI product thinking.

Secondary:

- AI PM building a portfolio.
- Indie hacker tracking AI tools and projects.
- Developer deciding what to try next.
- Research reader trying to understand papers by version and impact.

## Desired Product Surfaces

### Home

Goal:

- clean navigation and high-level orientation;
- no overloaded feed;
- show active sections and what each section is for.

### News

Goal:

- AI news event analysis;
- deduplicate same event across sources;
- explain what happened, why it matters, affected audience, risks, and next actions.

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

Current direction is correct. Continue expanding major companies and representative models, not every minor variant.

### Projects

Goal:

- GitHub Trending is the first project source;
- eventually add curated AI projects beyond trending;
- cards should let users decide within 5 seconds whether to open;
- detail pages should teach architecture, concepts, ecosystem, limitations, and try-it workflow.

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

- academic paper and long-form article version analysis;
- show v1/v2/v3 changes and why they matter;
- separate facts, interpretation, and professor lens;
- teach students how to verify they understood the paper.

Current Articles MVP covers this direction with Transformer, RAG, LoRA, and DPO.

Future direction:

- add paper families:
  - Transformer lineage;
  - RLHF / DPO / preference optimization;
  - RAG / retrieval / memory;
  - agents / tool use;
  - diffusion / multimodal;
  - efficient fine-tuning.

## System Goals

### Scalable AI Brief System

The system should eventually support:

- multiple source adapters;
- deduplication;
- ranking;
- AI evaluation;
- provenance;
- validation;
- UI presentation;
- feedback loop.

Target pipeline:

```text
crawler
  -> normalizer
  -> duplicate detector
  -> evaluator / ranker
  -> deep analysis agent
  -> validation
  -> storage
  -> frontend
```

### Multi-Agent News Analysis

Desired future agent roles:

- crawler agent: fetches sources and extracts raw items;
- dedupe agent: clusters same event across sources;
- ranking agent: estimates impact, actionability, confidence;
- analyst agent: writes structured brief;
- critic agent: checks hallucination and source coverage;
- editor agent: compresses to Chinese-first readable output.

Do not create this full system prematurely. Start by extracting clean modules from the existing ingestion script.

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

## Near-Term Goals

1. Keep Projects, Models, and Articles stable.
2. Update README/AGENTS to reflect actual implemented sections.
3. Add provenance display to model and article claims.
4. Improve project ranking stability.
5. Split ingestion into crawler, ranking, and analysis modules.
6. Add Skills as the next structured learning section.

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
