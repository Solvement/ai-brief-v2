# AI-brief Implementation Plan

## Current Repo Snapshot

The repository currently contains a Vite + React + TypeScript prototype for the AI-brief interface. It has:

- `AGENTS.md` with product and engineering rules.
- Typed content fixtures in `src/fixtures/content.ts`.
- Reusable React components in `src/components/`.
- Lightweight validation scripts:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run validate`
  - `npm run build`

This is not yet the complete product. Treat it as a visual and structural seed.

## Execution Strategy

Do not ask Codex to build the full product in one pass. Work through small tasks, each with clear acceptance criteria and checks.

Order:

1. Project audit and plan.
2. Content model and query layer.
3. Rundown-inspired page architecture and visual/media specs.
4. Reusable content cards.
5. Home page as a daily decision entry, not a single-page product.
6. Brief issue pages, directory pages, and detail pages.
7. Schema-first AI evaluation engine.
8. Playbook generator.
9. Ingestion MVP.
10. Admin review and publishing flow.
11. Quality gates and CI.

Subscription, login, paid membership, and reader-count proof are not part of the current MVP sequence.

## Target Directory Direction

The current Vite structure is acceptable for MVP prototyping. As product complexity grows, move toward:

```txt
src/
  components/
  fixtures/
  lib/
    content/
    ai/
    ingestion/
  pages or app/
tests/
docs/
```

If migrating to Next.js, do it as a dedicated task, not as part of feature work.

## Data Model Direction

The next major task should introduce:

- `ContentItem`
- type-specific extensions
- query functions
- seed data covering all main sections
- validation tests

Future storage should be database-ready, but do not add a database before the model is stable.

## AI Evaluation Direction

Build schema-first:

1. Define `EvaluationResult`.
2. Define legal enums and score ranges.
3. Write rubrics per content type.
4. Validate every AI output.
5. Add mock tests.
6. Keep analysis, scoring fixtures, and media generation local by default. External AI APIs are optional future integrations, not MVP requirements.

## Playbook Direction

Playbooks must include:

- outcome
- suitable_for
- prerequisites
- tools_needed
- estimated_time_minutes
- steps with expected_result
- prompts
- checklist
- validation_methods
- risks
- fallback_options

If source content is not actionable, return an explanation instead of forcing a weak guide.

## Ingestion Direction

Start small:

- RSS import.
- Manual URL import.
- Manual JSON import.

Do not auto-publish. Imported content should move through review.

## Review Flow Direction

Use this state flow:

collected -> draft -> ai_evaluated -> needs_review -> published -> archived

Public pages should only show published content once the review flow exists.

## Checks

Each task should run the relevant subset of:

```bash
npm run typecheck
npm run lint
npm run validate
npm run build
```

Add test commands once tests exist.
