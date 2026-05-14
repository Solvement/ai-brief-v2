# AGENTS.md

## Product

This repository is for AI-brief, a Chinese-first AI intelligence product that turns AI news, model updates, tools, projects, papers, articles, guides, and courses into readable, actionable briefings.

The product principle is:

Information -> Judgment -> Action.

Every major feature should help users answer:

1. What happened?
2. Why does it matter?
3. Who is affected?
4. Should I read, try, save, ignore, or monitor it?
5. What can I do next?
6. How do I verify success?

## Current Working Surface

- `Home`: GitHub Trending daily / weekly / monthly repository briefings.
- `Models`: company-level model and product-capability evolution archives. The first implemented company is DeepSeek.
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
- Courses

Only Home and Models are implemented right now. Future sections should be added incrementally without reviving removed legacy code.

## Content Tags

Use these as content tags:

- Agent
- AI Coding
- MCP
- Workflow
- Prompt
- RAG
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
- course

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

Use different evaluation rubrics for news, models, tools, integrations, articles, papers, guides, and courses.

## Data Contracts

- GitHub Trending data lives at `public/data/trending.json`.
- Curated model archive data lives at `public/data/models.json`.
- Keep all public data objects explicitly typed in `src/types.ts`.
- Keep validation scripts green for any changed data contract.

## Engineering Rules

- Prefer TypeScript.
- Keep code modular and readable.
- Avoid over-engineering before MVP.
- Do not add large dependencies unless necessary.
- All data objects should have explicit types.
- Every feature must include basic tests or validation scripts where practical.
- Do not silently ignore errors.
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
