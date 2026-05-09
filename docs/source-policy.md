# AI-brief Source Policy

AI-brief does not use a single blind ingestion queue. Home never fetches content directly. Every public column has its own source config, filters, cadence, and output goal.

Implementation: `src/lib/ingestion/column-source-policy.ts`.

## Shared Rules

- Home only aggregates selected items from other columns.
- Each column owns its source config, include keywords, exclude keywords, raw candidate limit, selected item limit, cadence, and output goal.
- Each source declares a `source_tier`:
  - `core_discovery`: daily concentrated discovery source.
  - `official_primary`: official confirmation source; used to verify facts, not to flood discovery.
  - `benchmark_data`: model benchmark, ranking, price, latency, or usage data.
  - `weekly_deep`: weekly source for content that needs deeper reading.
  - `triggered_news`: protected or high-friction news source used only for major-event backchecks.
  - `deep_enrichment`: supplemental source used only after a candidate is selected for deeper analysis.
- Source facts, AI-brief judgment, and action advice must remain separate.
- Discovery signals are not primary evidence. They can surface candidates, but the linked primary source must be checked before publication quality is trusted.
- Deterministic evaluator fallbacks are skipped for public publication.
- Filter matching must ignore source-name boilerplate. A source named "TechCrunch AI" must not make every TechCrunch story pass the News filter.
- Short keywords such as `AI` and `LLM` must match as tokens, not inside unrelated words.
- Sources that repeatedly return 403/404 during daily runs must be disabled, moved to `triggered_news` / `deep_enrichment`, or switched to a parser that can actually read them. A prestigious but broken source is not a production source.

## Deep Dive Contract

Discovery must be concentrated, but selected content must not lose depth.

If `depth_level = deep`, the evaluator must produce a real Deep Dive:

- at least 1500 Chinese characters across Deep Dive fields
- at least 3 core concepts
- at least 1 mechanism explanation
- at least 1 comparison or alternative
- at least 3 risks / uncertainties
- at least 1 practical test plan
- at least 2 validation methods
- at least 3 learning takeaways

If the candidate is worth deep work but the Deep Dive is not generated yet, the UI must show: "当前为标准详情，Deep Dive 尚未生成。"

## CLI Usage

Default run uses only enabled sources for each column:

```bash
npm run ingest:live -- --columns=news,models,projects --limit=5 --eval-concurrency=4 --evaluation-multiplier=1.5
```

Explicit tier backcheck for major events:

```bash
npm run ingest:live -- --columns=news --tiers=triggered_news,official_primary --limit=5
```

The second form is intentionally opt-in because protected/premium web pages can be slow, blocked, or noisy when blindly crawled.

Every run writes `.tmp/ingest-report.json` with per-source fetched/selected counts, per-column publication counts, and source diversity. Non-dry-run ingestion refuses to write if a requested column falls below the public-demo floor, and `--strict-source-health=true` makes the same gate fail dry-runs during release checks.

Current public-demo floors:

- News: at least 3 published items from at least 2 source names.
- Models: at least 3 published items from at least 2 source names.
- Projects: at least 4 published items from at least 2 source names.
- Skills/MCP/Hooks: at least 3 published items from at least 2 source names.
- Articles/Papers: at least 3 published items from at least 2 source names.
- Courses: at least 2 published items from at least 2 source names.

## Home

Ingests nothing.

Home is the decision surface: it summarizes News, Models, Projects, Skills/MCP/Hooks, Articles/Papers, and Courses into the daily view. It must not become its own source bucket.

## News

Goal: capture real AI stories, not ordinary technical blog posts.

Primary and high-signal sources:

- Reuters AI
- AP Artificial Intelligence
- Financial Times AI
- Bloomberg AI
- WSJ AI
- The Information AI
- Axios AI
- TechCrunch AI
- The Verge AI
- The Guardian AI
- Tech Xplore AI
- Wired AI
- MIT Technology Review AI
- VentureBeat AI
- NIST AI
- CAISI
- QbitAI

Default daily discovery is concentrated on open, parser-backed core sources. Reuters, AP, Financial Times, Bloomberg, WSJ, The Information, and Axios are configured as `triggered_news` sources for major-event backchecks instead of blind daily crawling. NIST and CAISI are configured as `official_primary` confirmation sources.

Discovery signal only, disabled for public publishing until a primary story URL is resolved:

- Google News AI RSS search

Include:

- AI company strategy
- regulation, policy, safety, lawsuits
- partnerships, funding, acquisitions
- compute, chips, infrastructure
- enterprise adoption

Exclude:

- ordinary tutorials
- how-to posts
- benchmark/code-only posts
- paper abstracts
- GitHub repositories
- courses/webinars

Detail output:

- story summary
- timeline
- cause
- outcome
- affected parties
- future watch points

## Models

Goal: track model capability changes and model-selection decisions.

Official sources:

- OpenAI News
- Anthropic News
- Google DeepMind Blog
- Mistral AI News
- Meta AI Blog
- DeepSeek
- Qwen Blog

Live-ingestion status:

- OpenAI News uses the official RSS feed. Linked OpenAI pages can return 403 to plain fetch, so the RSS summary is treated as the daily source text unless a later enrichment adapter is available.
- Anthropic News, Mistral AI News, and Meta AI Blog are configured as official HTML index sources because their previously assumed RSS URLs returned 404 in live checks.
- Google DeepMind Blog uses `https://deepmind.google/blog/rss.xml`, verified as a working RSS URL in the current smoke test.

Benchmark and usage sources:

- Artificial Analysis
- LMArena (configured but disabled in live ingestion until a source-specific extractor can preserve verifiable ranking provenance)
- OpenRouter Rankings

Include:

- new model release
- benchmark movement
- pricing/caching/batch pricing
- speed/latency changes
- context window changes
- tool-use/function-calling changes
- multimodal capability changes

Exclude:

- generic company news
- funding/hiring stories
- opinion-only pieces
- courses

Detail output:

- capability change
- cost/speed/context/tool-use
- switching advice
- test prompts

## Projects

Goal: find tools and open-source projects worth trying or studying.

Sources:

- GitHub Trending daily
- GitHub Trending weekly
- GitHub Trending monthly
- GitHub AI Topic Search
- Hugging Face Spaces
- Hugging Face Trending Models
- Product Hunt AI
- Show HN AI

Live-ingestion status:

- GitHub Trending, targeted GitHub repository search, Hugging Face Spaces, Hugging Face models, and Show HN are enabled.
- Product Hunt AI is configured but disabled by default because the public category page returns 403 to the current fetch path. It should only be re-enabled with an approved API/import path.

Include:

- agent tools
- AI coding tools
- RAG/tools/workflow projects
- MCP-related projects
- local AI tooling
- prompt/workflow products
- multimodal demos

Exclude:

- awesome lists
- paper lists
- newsletter repos
- job boards
- unrelated crypto projects

Detail output:

- problem
- architecture
- innovation
- installability
- toolbox verdict
- test plan

## Skills / MCP / Hooks

Goal: separately collect installable or extractable agent behavior packs.

Sources:

- GitHub SKILL.md Search
- GitHub CLAUDE.md Search
- GitHub MCP Server Search
- GitHub Cursor Rules Search
- GitHub Hooks Search

Include:

- `SKILL.md`
- `CLAUDE.md`
- MCP server
- Cursor rules
- hooks
- agent skills
- workflow rules
- prompt packs with operational structure

Exclude:

- generic AI SaaS pages
- plain prompt dumps
- unrelated dotfiles
- courses

Detail output:

- install verdict
- supported tools
- skill inventory
- best rules
- weak rules / risks
- quick validation

## Articles / Papers

Goal: capture high-quality technical articles, research posts, and papers. This column should not become latest-arXiv spam.

Primary article and research sources:

- Hugging Face Papers
- Hugging Face Blog
- Google Research Blog
- BAIR Blog
- OpenReview
- ACL Anthology
- NeurIPS Papers
- ICML Papers
- ICLR OpenReview
- Papers with Code
- Filtered arXiv AI

Live-ingestion status:

- Enabled now: Hugging Face Papers, Hugging Face Blog, Google Research Blog, BAIR Blog, and Filtered arXiv AI.
- Hacker News remains a discovery-only enrichment source; it must not become the primary published article source.
- Configured but disabled until parser support is reliable: OpenReview, ACL Anthology, NeurIPS Papers, ICML Papers, ICLR OpenReview, and Papers with Code. These index pages are valuable, but a generic web-index crawl can surface stale proceedings or meta pages, which is below AI-brief's quality bar.

Discovery only:

- Hacker News AI Discovery

Hacker News can surface candidate articles, but HN itself is not treated as the article's primary evidence.

Include:

- paper/research/evaluation
- benchmark, dataset, architecture
- agent and LLM method posts
- alignment/safety technical analysis

Exclude:

- low-effort news
- press-release-only pages
- generic startup launches
- HN discussion without primary source review

Detail output:

- motivation
- solution
- design
- evaluation
- results
- strengths
- weaknesses
- takeaways
- practical translation

## Courses

Cadence: weekly.

Goal: update only when trusted learning sources have meaningful new or relevant content.

Sources:

- Hugging Face LLM Course
- Microsoft Learn Generative AI Fundamentals
- DeepLearning.AI Courses, OpenAI Academy, and fast.ai remain configured as disabled trusted sources until their importers select concrete course/module URLs.

Include:

- hands-on AI courses
- project-based learning
- certificates or learning paths
- LLM/agent/RAG/machine-learning tracks

Exclude:

- generic course homepages without a concrete course/module URL
- event recaps
- marketing ebooks
- sales pages without learning outcomes
- unrelated courses

Detail output:

- who it is for
- what you can build
- time cost
- project output
- should I learn now
