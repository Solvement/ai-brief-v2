# Models DeepSeek Design

## Goal

Add the first `Models` column for AI-brief as a curated, Chinese-first learning archive. The first company page is DeepSeek. It teaches model generations, the relationship between adjacent releases, and major product/API updates that matter to AI students.

## Product Positioning

`Models` is not a daily model-news feed and does not require long-term automated maintenance. It is a company-organized archive of important model and capability milestones.

The page should help a student answer:

1. What is this model generation?
2. What did it change from the previous generation?
3. Why would the lab make that change?
4. How did the lab solve the technical/product problem?
5. What should I learn or test from it?
6. Which official source can I verify?

## Scope

First implementation includes:

- A `#/models` index page.
- A `#/models/deepseek` company page.
- Static typed data in `public/data/models.json`.
- DeepSeek model series and release nodes:
  - DeepSeek-R1.
  - DeepSeek-R1-0528.
  - DeepSeek-V3.1.
  - DeepSeek-V3.2-Exp.
  - DeepSeek-V3.2.
  - DeepSeek-V4 Preview.
- DeepSeek major update nodes for official API/product milestones that support the learning story.
- A validation script to keep the static data usable.

Out of scope for this pass:

- Automated model-news ingestion.
- Full OpenAI/Anthropic/Google model archives.
- Search, filtering, or account-level personalization.

## Data Shape

Each company has:

- identity fields: `id`, `name`, `shortName`, `country`, `updatedAt`.
- card fields: `oneSentenceTakeaway`, `whyItMatters`, `targetAudience`, scores, source fields.
- `series`: one or more model series, each with releases.
- `updates`: non-model events such as API or product capability releases.
- `learningPath`: teacher-style study guidance.

Each release includes:

- its own introduction.
- key changes.
- why those changes happened.
- how the release solved the problem.
- tradeoffs.
- student learning points.
- experiments.
- official sources.
- optional `nextRelation` describing the link to the next release.

## UI

The `Models` index is a compact company list. The DeepSeek company page is the main learning surface:

- hero summary.
- judgment metrics.
- teacher learning path.
- model series sections.
- release cards with adjacent-generation relation blocks.
- major updates.
- official sources.

The visual style follows the current GH Trending app: dense cards, restrained typography, no new large dependencies.

## Validation

`npm run validate` should validate both `trending.json` and `models.json`.

Model validation checks:

- required strings and arrays.
- ISO dates.
- card scores in 0-100.
- releases have official sources.
- `nextRelation.toReleaseId` points to an existing release in the same series.

## Known Limitations

- The first page is manually curated from official DeepSeek sources.
- Source freshness depends on manual edits.
- Other companies will be added later using the same schema.
