# AI-brief Product Model

AI-brief is a Chinese-first AI intelligence product. It is not a generic news feed. The product turns AI information into a decision workflow:

Information -> Judgment -> Action

Every public feature should help users answer:

1. What happened?
2. Why does it matter?
3. Who is affected?
4. Should I read, try, save, ignore, or monitor it?
5. What can I do next?
6. How do I verify success?

## Primary Audience

The MVP should serve Chinese AI practitioners: builders, PMs, operators, creators, founders, and researchers who can act on AI updates.

The product should not drift into:

- A generic AI blog.
- A course directory.
- A raw model leaderboard.
- A tool listing with no judgment.

## Core Navigation

- Home: daily decision brief that aggregates all other columns. Home does not ingest content directly.
- News: factual story layer. News cards and News details do not expose score UI.
- Models: model radar, benchmarks, cost, speed, capability changes.
- Projects: GitHub-first tools and open-source projects, plus Hugging Face and Show HN discovery.
- Skills: SKILL.md, CLAUDE.md, MCP servers, Cursor rules, hooks, and agent behavior packs.
- Articles: high-quality articles, research posts, papers, and technical analysis.
- Courses: trusted learning items, updated weekly only when a real course/module is available.

Briefs, Tools, Playbooks, and Learn are legacy aliases or future expansion surfaces. They are not primary navigation in the current MVP. Subscription, login, reader-count proof, and paid membership surfaces are intentionally out of scope until a dedicated growth task exists.

## Content Tags

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

- news
- model
- tool
- project
- integration
- article
- paper
- guide
- course

## Content Item Contract

Every imported item must become an evaluated content object with:

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

Every evaluated item must also include:

- difficulty
- recommended_action
- risks
- next_steps

## Detail Page Contract

Detail pages must not be long summaries only. They must include:

- TL;DR
- Background
- Key facts
- Impact by audience
- Opportunities
- Risks
- How to use
- Checklist / prompt / workflow
- Related items

## Quality Bar

A content item is good only when it helps the user make a decision. A Playbook is good only when it can be executed and verified.
