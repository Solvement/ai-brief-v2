# Live Ingest Report

Latest public-quality run: `2026-05-09T20:56:23.026Z`

Command used:

```bash
npm run ingest:live -- --columns=news,models,projects,skills,articles,courses --limit=6 --eval-concurrency=4 --evaluation-multiplier=4 --strict-source-health=true
```

## Result

- Evaluated candidates: 91
- Published live items after public cleanup: 48
- Skipped items: 7
- Warnings: 0

## Published By Column

| Column | Published | Source names |
| --- | ---: | --- |
| News | 10 | MIT Technology Review AI, 量子位 AI News, VentureBeat AI, The Guardian AI |
| Models | 6 | OpenAI News, Google DeepMind Blog, Meta AI Blog |
| Projects | 14 | GitHub Trending Daily, GitHub Trending Weekly, Hugging Face Trending Models, GitHub Trending Monthly, GitHub AI Topic Search, Hugging Face Spaces |
| Skills | 6 | GitHub MCP Server Search, GitHub CLAUDE.md Search, GitHub SKILL.md Search, GitHub Hooks Search |
| Articles | 10 | Hugging Face Papers, Filtered arXiv AI |
| Courses | 2 | Hugging Face LLM Course, Microsoft Learn Generative AI Fundamentals |

## Public Gate Behavior

- Deterministic fallback evaluations are not published.
- Items with fallback/editorial boilerplate are skipped.
- News items must contain an explicit AI relevance signal.
- Model items must contain a real model-update signal and must not be docs/settings/customer-story/advertising content.
- Projects, tools, integrations, papers, and articles need concrete examples before publication.
- Published items must have opportunity, risk, and action layers.
- Public cleanup removed two fallback-summary items and three LMArena items whose visible source URLs did not let readers verify the ranking claims.

## Current Depth

This snapshot contains Card + BriefDetail/standard detail. Items marked `deep_dive_status = needed_not_generated` are explicitly shown in the UI as worthy of deeper analysis but not yet generated as DeepDive. They are not labeled as deep content until they satisfy the 1500+ Chinese-character DeepDive quality bar.
