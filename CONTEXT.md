# AI Brief Context

AI Brief is a Chinese-first AI intelligence and learning product. Its domain language is organized around turning AI information into judgment and action without flattening different content types into one generic format.

## Language

**Daily Brief**:
A Home-page recommendation surface that mixes today's most important news, model updates, articles, and projects into one concise briefing.
_Avoid_: Treating Home as a full content archive, treating Daily Brief as a replacement for section-specific pages.

**Brief Item**:
An item selected into the **Daily Brief** because it is worth attention today.
_Avoid_: Using Brief Item as the shared data model for all sections.

**Section**:
A dedicated content area with its own evaluation rubric, data shape, and deep-dive emphasis.
_Avoid_: Forcing News, Projects, Models, and Articles into one universal schema.

**News Analysis**:
A news-focused section output that combines event overview and judgment about significance, affected audience, risks, and next actions.
_Avoid_: Treating News as a project-style technical deep dive.

**Project Light Read**:
A compact project abstract with enough information density to decide whether a project deserves a deep dive.
_Avoid_: Thin README paraphrase, marketing summary, generic "this is interesting" copy.

**Project Deep Dive**:
A technical project analysis focused on design intent, method implementation, professor-style learning value, executable usage, and concrete examples.
_Avoid_: Only summarizing the README, skipping implementation method, skipping how to run or use it.

**Model Analysis**:
A company/model-section analysis that explains each model version, architecture, training or post-training direction, benchmark evidence, limitations, and relation to adjacent versions.
_Avoid_: Only listing benchmark numbers, ignoring architecture and design evolution.

**Architecture Analysis**:
A model or project explanation that makes the design structure, data flow, routing, modules, and trade-offs understandable to a student.
_Avoid_: High-level slogans such as "uses MoE" without explaining expert routing, active parameters, training/inference implications, and why the design changed.

**Academic Article Analysis**:
A paper/article section analysis that answers the paper's own research question, explains method and evidence deeply, tracks version changes, and teaches how to verify understanding.
_Avoid_: Shallow abstract summary, one-line version notes, unanswered self-posed questions.

**Course**:
Deprecated product surface; this project no longer plans to maintain a Courses section.
_Avoid_: Adding new Course navigation, data contracts, or roadmap work unless the user reverses this decision.

## Relationships

- A **Daily Brief** contains one or more **Brief Items**.
- A **Brief Item** points into exactly one **Section**.
- A **Section** owns its own evaluation rubric and detail-page structure.
- A **Project Light Read** can lead to a **Project Deep Dive**.
- A **Project Deep Dive** must include design intent, method implementation, professor-style learning value, and executable usage.
- A **Model Analysis** must include **Architecture Analysis** when enough public information exists.
- An **Academic Article Analysis** must answer the paper's research question rather than only summarize its abstract.
- **Course** is out of scope for the product unless explicitly reintroduced.

## Example dialogue

> **Dev:** "Should we create one `BriefItem` TypeScript interface for News, Projects, Models, and Articles?"
> **Domain expert:** "No. `Brief Item` means a Home Daily Brief recommendation. The underlying sections stay separate because News, Projects, Models, and Articles need different evaluation rubrics and deep-dive structures."

> **Dev:** "For a GitHub project, is the card allowed to be a short README summary?"
> **Domain expert:** "No. The **Project Light Read** must be dense enough for me to decide whether it deserves a **Project Deep Dive**."

> **Dev:** "For DeepSeek, can we just say it uses MoE?"
> **Domain expert:** "No. The **Architecture Analysis** needs to explain MoE routing, active parameters, why the architecture changed, and what students should learn from it."

## Flagged ambiguities

- "Brief Item" was ambiguous between a universal content model and a Home recommendation item. Resolved: it means a **Daily Brief** item only; section data models remain separate.
- "Articles analysis" was too shallow and treated as abstract summary. Resolved: **Academic Article Analysis** must answer the paper's own question, explain method/evidence, and support verification.
- "Courses" was still present in navigation/goals. Resolved: **Course** is deprecated and should be removed from product direction.
