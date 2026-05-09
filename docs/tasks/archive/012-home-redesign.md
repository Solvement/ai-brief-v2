> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 012: Home redesign

## Goal

Redesign Home from a single-page demo into the front door for a multi-page AI intelligence product.

## Required Modules

- Hero decision entry.
- Today's Brief feature card.
- Latest Developments.
- Try Today.
- Model Radar.
- Playbook of the Day.
- Tools Preview.
- Learn CTA.

## Explicitly Out Of Scope

- Email subscription form.
- Subscribe CTA.
- Login CTA.
- Reader-count social proof.

## Acceptance Criteria

- Home does not try to contain the full product.
- Home links into Briefs, Tools, Playbooks, Models, and Learn.
- Uses content/query layer, not hard-coded data.
- Every module has loading, empty, and error states where relevant.
- Mobile layout is single-column and has no horizontal overflow.
- Typecheck, lint, tests, and build pass.

## Do Not Do

- Do not implement issue detail pages.
- Do not implement media generation.
- Do not add new data models unless required by existing query gaps.
