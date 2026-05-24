# AI Brief Context

AI Brief is a Chinese-first AI intelligence and learning product. Its domain language is organized around turning AI information into judgment and action without flattening different content types into one generic format.

## Language

**Daily Brief**:
A Home-page recommendation surface that mixes today's most important news, model updates, articles, and projects into one concise briefing.
_Avoid_: Treating Home as a full content archive, treating Daily Brief as a replacement for section-specific pages, or making News dominant by default.

**Curated Daily Brief**:
A manually selected **Daily Brief** used to define the editorial standard before automation.
_Avoid_: Fully automatic cross-section ranking before section-specific rubrics and deduplication are stable.

**Brief Item**:
An item selected into the **Daily Brief** because it is worth attention today.
_Avoid_: Using Brief Item as the shared data model for all sections.

**Section**:
A dedicated content area with its own evaluation rubric, data shape, and deep-dive emphasis.
_Avoid_: Forcing News, Projects, Models, and Articles into one universal schema.

**News Analysis**:
A news-focused section output that combines event overview and judgment about significance, affected audience, risks, and next actions.
_Avoid_: Treating News as a project-style technical deep dive.

**Signal**:
A high-value information signal worth briefing because it can change the user's understanding, judgment, learning direction, career view, or action in AI and technology.
_Avoid_: Restricting News to traditional news articles or same-day events only.

**Signal Brief**:
A story-like News-section briefing that summarizes the core content of a **Signal** and expands the user's understanding of AI, technology, international markets, policy, and future direction.
_Avoid_: Dry bullet-only analysis, generic summaries, source dumps without a story arc, or forcing every signal into a learning task/action checklist.

**Signal Image**:
A generated or sourced visual that helps a **Signal Brief** become easier to understand, remember, or emotionally locate.
_Avoid_: Decorative stock imagery that does not clarify the story or learning point.

**Signal Brief Structure**:
The preferred narrative structure for News: scene, core summary, context, interpretation, widened perspective, uncertainty, and optional visual direction.
_Avoid_: Rigid action-plan formatting for every signal.

**Passive Signal Feed**:
An automatically discovered News feed that surfaces high-quality technology and AI signals without requiring the user to know which sources to follow.
_Avoid_: A manually maintained watchlist as the primary discovery mechanism.

**News Feed**:
A bounded News-section feed of roughly 10 high-quality **Signal Briefs** per edition.
_Avoid_: Infinite news feeds, high-volume aggregation, or optimizing for quantity.

**Project Light Read**:
A compact project abstract with enough information density to decide whether a project deserves a deep dive.
_Avoid_: Thin README paraphrase, marketing summary, generic "this is interesting" copy.

**Project Abstract**:
A high-density project summary that helps the user decide whether the project deserves a technical deep dive.
_Avoid_: Low-information summary that only repeats the repository description.

**Project Deep Dive**:
A technical project analysis focused on design intent, method implementation, professor-style learning value, executable usage, and concrete examples.
_Avoid_: Only summarizing the README, skipping implementation method, skipping how to run or use it.

**Project Technical Deep Dive**:
A detailed project analysis focused on architecture, design thinking, implementation method, comparable projects, limitations, professor-style learning value, and concrete usage examples.
_Avoid_: Treating deep dive as a longer abstract.

**Model Analysis**:
A company/model-section analysis that explains each model version, architecture, training or post-training direction, benchmark evidence, limitations, and relation to adjacent versions.
_Avoid_: Only listing benchmark numbers, ignoring architecture and design evolution.

**Architecture Analysis**:
A model or project explanation that makes the design structure, data flow, routing, modules, and trade-offs understandable to a student.
_Avoid_: High-level slogans such as "uses MoE" without explaining expert routing, active parameters, training/inference implications, and why the design changed.

**Open Model Architecture Analysis**:
An architecture explanation for open or technically disclosed models that covers components, data flow, training stages, inference cost, generation-to-generation changes, design motivation, and student learning value.
_Avoid_: Naming components such as MoE, MLA, MTP, routing, experts, or distillation without explaining what they do and why they changed.

**Closed Model Architecture Analysis**:
An architecture explanation for closed models based only on official public signals, benchmark behavior, API/product surfaces, and clearly labeled inference.
_Avoid_: Inventing hidden architecture details or presenting speculation as fact.

**Academic Article Analysis**:
A paper/article section analysis that answers the paper's own research question, explains method and evidence deeply, tracks version changes, and teaches how to verify understanding.
_Avoid_: Shallow abstract summary, one-line version notes, unanswered self-posed questions.

**Academic Paper Deep Reading**:
A paper-section experience that deeply explains the paper question, prior work, core idea, method, math or algorithm, experiment logic, results, limitations, version notes, professor lens, and verification exercises.
_Avoid_: Treating version history as the main analysis, presenting the paper as a single long scrolling summary, or using expert jargon without explanation.

**Paper Reading Workbench**:
A multi-view, card-based, visual reading interface for **Academic Paper Deep Reading**.
_Avoid_: A single page that requires scrolling through a long stack of text.

**Plain-Language Paper Explanation**:
An explanation style that makes a paper's idea, architecture, design choices, and optimization logic understandable to a beginner without removing the real technical content.
_Avoid_: Oversimplifying into slogans or hiding important mechanisms behind vague analogies.

**Paper Verification Task**:
A concrete self-test inside an **Academic Paper Deep Reading** that asks the student to restate, draw, calculate, or transfer the idea, and includes pass criteria, common mistakes, and answer key points.
_Avoid_: Abstract checklists that say "understand X" without telling the student what to do or how to know they passed.

**Learner Decision Card**:
A card format that lets a beginner decide within 5 seconds whether to open the item by showing what it is, why it matters, who it is for, time/effort, and recommended action.
_Avoid_: Cards dominated by title, tags, stars, or unexplained scores.

**Deep Dive Verification Loop**:
A detail-page pattern that connects explanation to proof of understanding: read the plain-language explanation, inspect architecture/evidence, then complete a concrete verification task.
_Avoid_: Hiding validation inside a later tab or only showing generic "next steps".

**Course**:
Deprecated product surface; this project no longer plans to maintain a Courses section.
_Avoid_: Adding new Course navigation, data contracts, or roadmap work unless the user reverses this decision.

## Relationships

- A **Daily Brief** contains one or more **Brief Items**.
- A **Curated Daily Brief** should come before an automated **Daily Brief** so the product can learn what "worth recommending today" means.
- A **Brief Item** points into exactly one **Section**.
- A **Daily Brief** should be a true cross-section recommendation surface; News, Projects, Models, or Articles can dominate on a given day if they are the highest-value items.
- A **Section** owns its own evaluation rubric and detail-page structure.
- The News **Section** is built from **Signals**, not only traditional news articles.
- A **Signal Brief** should read like a clear story with analysis embedded, not like a dry memo.
- A **Signal Brief** primarily widens perspective and improves judgment; it does not need to force "what to learn" or "what to do next" on every item.
- A **Signal Brief Structure** should be used as a default narrative shape, but sections can be merged or shortened when the signal is small.
- A **Passive Signal Feed** should discover broadly, then filter aggressively for quality, relevance, and credibility.
- A **News Feed** should stay small, around 10 items, so the user can actually read and absorb it.
- Home should only recommend a few items from the wider **News Feed** and other sections.
- A **Signal Image** supports the story and should make the briefing more concrete or memorable.
- A **Project Light Read** can lead to a **Project Deep Dive**.
- A **Project Abstract** must explain the problem, method, distinctive angle, current relevance, and who should continue to a **Project Technical Deep Dive**.
- A **Project Deep Dive** must include design intent, method implementation, professor-style learning value, and executable usage.
- A **Project Technical Deep Dive** must cover architecture, key modules, data flow, comparable projects, limitations, professor-style learning value, and concrete execution or usage cases.
- A **Model Analysis** must include **Architecture Analysis** when enough public information exists.
- An **Open Model Architecture Analysis** should be much deeper than a closed-model analysis because public technical details can support real component-level explanation.
- A **Closed Model Architecture Analysis** must explicitly separate known facts from inference and unknowns.
- An **Academic Article Analysis** must answer the paper's research question rather than only summarize its abstract.
- An **Academic Paper Deep Reading** should prioritize the paper's idea, architecture, design choices, and optimization logic; version history is optional and secondary.
- A **Paper Reading Workbench** should use multiple views, cards, visual maps, and compact panels instead of one long article page.
- A **Plain-Language Paper Explanation** should use beginner-friendly language while still explaining the actual mechanism.
- A **Paper Verification Task** closes the teaching loop: the student should be able to perform an observable task and compare against pass criteria or answer key points.
- A **Learner Decision Card** should be used across News, Models, Projects, and Articles when the item is meant to be opened from a feed or index.
- A **Deep Dive Verification Loop** should exist for project, model, and article detail pages, even if Projects/Models initially use derived fallback tasks until the ingestion data contract catches up.
- **Course** is out of scope for the product unless explicitly reintroduced.

## Example dialogue

> **Dev:** "Should we create one `BriefItem` TypeScript interface for News, Projects, Models, and Articles?"
> **Domain expert:** "No. `Brief Item` means a Home Daily Brief recommendation. The underlying sections stay separate because News, Projects, Models, and Articles need different evaluation rubrics and deep-dive structures."

> **Dev:** "For a GitHub project, is the card allowed to be a short README summary?"
> **Domain expert:** "No. The **Project Light Read** must be dense enough for me to decide whether it deserves a **Project Deep Dive**."

> **Dev:** "For DeepSeek, can we just say it uses MoE?"
> **Domain expert:** "No. The **Architecture Analysis** needs to explain MoE routing, active parameters, why the architecture changed, and what students should learn from it."

> **Dev:** "Should News only ingest hard news articles?"
> **Domain expert:** "No. News is a **Signal** surface. A Bloomberg CFO interview, a trade-policy agreement, a Karpathy podcast, a Cat Wu talk, or a high-signal tweet can all become a **Signal Brief** if it changes what I should understand or do."

## Flagged ambiguities

- "Brief Item" was ambiguous between a universal content model and a Home recommendation item. Resolved: it means a **Daily Brief** item only; section data models remain separate.
- "Home recommendation mix" was ambiguous. Resolved: Home should be a cross-section recommendation surface, not News-led by default.
- "News" sounded like traditional news events only. Resolved: internally this section briefs **Signals**, which can include news, interviews, policy, podcasts, talks, tweets, papers, or company releases.
- "News analysis" sounded too dry, then too action-oriented. Resolved: a **Signal Brief** should be story-like and focused on core summary, analysis, widened perspective, international market/technology awareness, and future-direction judgment; action or learning steps are optional.
- "News sources" sounded like the user would maintain a watchlist. Resolved: News should become a **Passive Signal Feed** that automatically discovers high-quality technology and AI content, while still allowing user interests to influence ranking.
- "News volume" was undefined. Resolved: the **News Feed** should be a small, bounded set of about 10 Signal Briefs, with only a few promoted to Home.
- "Project light/deep" was too vague. Resolved: light output should be a **Project Abstract**, and deep output should be a **Project Technical Deep Dive**.
- "Model architecture analysis" was too shallow. Resolved: use separate standards for **Open Model Architecture Analysis** and **Closed Model Architecture Analysis**.
- "Articles analysis" was too shallow and treated as abstract summary. Resolved: **Academic Article Analysis** must answer the paper's own question, explain method/evidence, and support verification.
- "Article version analysis" was too dominant. Resolved: Articles should become **Academic Paper Deep Reading**, with version notes optional and secondary inside a **Paper Reading Workbench**.
- "Paper explanations" risked becoming too academic. Resolved: use **Plain-Language Paper Explanation**: beginner-friendly language, real technical mechanisms, no empty slogans.
- "Verification" risked being a vague checklist. Resolved: use **Paper Verification Task** with concrete tasks, pass criteria, common mistakes, and answer key points.
- "Courses" was still present in navigation/goals. Resolved: **Course** is deprecated and should be removed from product direction.
- "Daily Brief" automation timing was ambiguous. Resolved: start with a **Curated Daily Brief** and reserve automation for later ranking/agent work.
