> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 011: Rundown-inspired design system

## Goal

Turn the current one-page prototype direction into a mature AI media/product design system inspired by the structure of mature AI briefing products, without copying external brands or assets.

## Context

Run this before Task 002. AI-brief should not keep expanding as a single-page demo. It needs a page system, visual system, card standards, and image strategy.

## Acceptance Criteria

- `docs/design-reference-rundown-inspired.md` exists.
- `docs/page-architecture.md` exists.
- `docs/visual-system.md` exists.
- `docs/media-image-generation.md` exists.
- The docs explicitly exclude subscription, login, paid membership, and reader-count proof from this phase.
- The docs preserve AI-brief navigation and product model.
- The docs state that Rundown.ai assets, logos, images, and copy must not be copied.

## Do Not Do

- Do not implement routes yet.
- Do not add subscription UI.
- Do not add dependencies.
- Do not copy external brand assets.

## Commands To Run

- `npm run validate`
- `npm run lint`
- `npm run typecheck`
