# Page Architecture

This document defines the current AI-brief MVP route system. The product keeps the Rundown-inspired density and briefing rhythm, but the primary navigation has been simplified around the real source columns.

## Current Routes

```txt
/
/news
/models
/projects
/projects/[slug]
/skills
/skills/[slug]
/articles
/articles/[slug]
/courses
/courses/[slug]
/content/[slug]   # generic detail fallback
/admin/content
/admin/media
```

Legacy aliases remain for backward compatibility:

```txt
/briefs     -> /
/tools      -> /projects
/playbooks  -> /projects
/learn      -> /courses
```

Subscription routes, login routes, and paid membership routes are intentionally excluded.

## Home

Home is a daily summary of other columns. It never fetches content directly.

Required modules:

- Hero decision entry.
- Today summary card.
- Today / must-read items.
- News.
- Models.
- Projects.
- Skills.
- Articles.
- Courses.

Home should show real published content from `src/lib/content/live.generated.ts`; seed data is only for tests.

## News

`/news` is a story/reporting surface. It does not show score meters or action score badges.

Cards emphasize:

- source
- title
- story takeaway
- published date
- tags

Details emphasize:

- story summary
- source facts
- timeline / what changed
- cause and affected parties
- future watch points

## Models

`/models` is the model radar.

Details emphasize:

- capability change
- cost / speed / context / tool-use notes
- switching advice
- test prompts and validation methods

## Projects

`/projects` covers GitHub-first tools and open-source projects, with Hugging Face and Show HN as secondary discovery.

Details emphasize:

- problem solved
- architecture or workflow
- innovation
- installability
- toolbox verdict
- test plan

## Skills

`/skills` covers SKILL.md, CLAUDE.md, MCP servers, Cursor rules, hooks, and agent behavior packs.

Details emphasize:

- install verdict
- supported tools
- use cases
- not-for cases
- skill inventory
- best and weak rules
- risks
- quick validation

## Articles

`/articles` covers high-quality articles, research posts, and papers.

Details emphasize:

- core thesis or motivation
- solution / design
- evidence or evaluation
- strengths and weaknesses
- practical translation
- learning takeaways

## Courses

`/courses` is weekly and must use real course/module entries, not source homepages.

Details emphasize:

- who it is for
- what you can build or explain after learning
- time cost
- project output
- whether it is worth learning now

## Admin

`/admin/media` handles approved-media review. Public pages only display approved source images or CSS placeholders.

`/admin/content` is the MVP content review surface.
