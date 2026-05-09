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

## Core navigation
Use this navigation structure:
- Home
- News
- Models
- Projects
- Skills
- Articles
- Courses

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

## Content types
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

## Card philosophy
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

## Detail page philosophy
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

## AI evaluation rules
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

## Engineering rules
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

## Done means
A task is done only when:
- The feature works locally.
- Type check passes.
- Lint passes.
- Relevant tests or validation scripts pass.
- The implementation matches the product model above.
- The final response includes changed files, how to test, and known limitations.
