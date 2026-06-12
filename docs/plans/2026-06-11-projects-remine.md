# Plan: Projects Remine + Relation Engine Deepening (PROJECTS-REMINE-2026-06-11)

> Trigger: specs/2026-06-11-projects-remine.md requests batch regeneration of project content and KG relation mining. This is >100 lines and touches public data / KG contracts, so it requires a plan before edits.

## 1. Big Direction / Small Direction
- **Big direction**: make project deep-dives and Mind Palace relations a single coherent knowledge substrate: no old/new duplicate project entries, every serious project has RuView-style light_spine + facet, and graph edges are mined from thick evidence instead of shallow labels.
- **Small direction**:
  - Remove duplicate old project deep-dives only after matching them to owner-prefixed replacements.
  - Regenerate valid spine-missing project deep-dives into `meta.light_spine`, without keeping legacy body variants.
  - Add deep-dives for trending projects above the depth gate that lack `briefSlug`, and do not add deep-dives below the gate.
  - Rewrite all project `light` copy so it matches the actual depth decision and removes score/template machine language.
  - Cover every `light_spine` project with Mind Palace facets in `public/data/brief/facets.json` using the existing project facet schema.
  - Fill missing paper facets, then widen relation candidates and rebuild typed graph edges with evidence + use, preserving NO_EDGE as default.
  - Assign track labels to remaining isolated nodes and report label cardinality.

## 2. Requirements
- Goals:
  - Implement the spec in `specs/2026-06-11-projects-remine.md`.
  - Keep progress in `logs/remine-progress.md` and final report in `logs/remine-summary.md`.
  - Use data-side validation only; do not run Next build or full verify.
- Non-goals:
  - No edits under `src/` or `app/`.
  - No product/spec changes.
  - No new DB/auth/heavy runtime dependencies.
- Impact range:
  - `public/data/brief/deep-dives.json`, `public/data/trending.json`, `public/data/brief/facets.json`, KG graph artifacts, relation candidate/judge outputs, logs, and possibly narrowly scoped KG scripts if needed.
  - `task-board.md` only for task status; `dev-map.md` only if scripts/data contracts materially change.
- Acceptance:
  - Data has no duplicate old ownerless deep-dive where an owner-prefixed replacement exists.
  - All retained deep-dives intended for project details have `meta.light_spine`.
  - All deep/standard project nodes with spine have facets keyed by frontend matching convention.
  - `node scripts/eval-relation-engine.mjs` passes, recall bench does not regress, and content/schema checks pass without `next build`.

## 3. Approach
- Changes:
  - First inventory current JSON to produce explicit worklists and avoid blind rewrites.
  - Use existing project/paper facet schema and relation taxonomy; prefer generated deterministic scripts for mechanical rewrites, with manual content edits only where needed.
  - Build final JSON changes with a single writer pass per aggregate file to avoid concurrent stomping.
  - Keep deletion and regeneration lists in summary.
- Schema changes:
  - Avoid schema expansion where possible. If isolated-node `track` already exists in graph node shape, fill it; otherwise report as blocked instead of silently inventing a public contract.

## 4. Eval
- Structure gates:
  - JSON parse checks for changed aggregate files.
  - Existing project/paper/KG validation scripts discovered in `package.json`.
  - `node scripts/eval-relation-engine.mjs`.
  - Retrieval recall bench used by current KG flow.
- Content gates:
  - Self-check against `docs/paradigms/projects.md` and `docs/paradigms/relation-taxonomy.md`.
  - Independent cold review is required before final signoff; this Codex run will not self-certify high-risk content as final-reviewed.
- Success metrics:
  - Edge count and typed edge distribution higher than previous 29 real edges without category-level fake links.
  - Facet coverage counts and isolated track label histogram reported.

## 5. Tools
- Tools/scripts:
  - Node scripts for inventory, JSON transforms, candidate dumps, relation eval, and schema validation.
  - `npm run kg:research` was used for Recall / Contest context per Mind Palace contract.
  - Git status/diff checks to keep `src/` and `app/` untouched.
- New dependencies:
  - None planned.

## 6. Orchestration
- Single Codex writer for aggregate JSON files.
- No LangGraph/CrewAI/AutoGen; existing scripts + local analysis are sufficient.
- Sub-agent role note: independent review is required after implementation, but this environment has no separate reviewer tool currently exposed; record this as a required downstream gate, not self-review.
- Dynamic workflow: yes in spirit for batch inventory -> transform -> validate -> report; all aggregate writes remain single-writer.

## 7. Slices
- Slice 1: inventory + duplicate deletion + progress log.
- Slice 2: project spine/light/facet regeneration + trending backfill + data checks.
- Slice 3: paper facets + relation candidates/judgment/rebuild + eval.
- Slice 4: isolated track labels + summary + task-board closeout evidence.

## 8. Risks / Rollback
- Risks:
  - Network/source availability for repo reads may be incomplete; unknown facts must be marked official-unpublished/data-insufficient.
  - Large hand-authored content can drift from schema; mitigate with JSON checks and existing validators.
  - Relation edge inflation can create fake category-level edges; mitigate with evidence literal membership and NO_EDGE default.
- Rollback:
  - Use git diff to inspect changed aggregate files; each changed JSON can be restored from git if a gate fails, without touching `src/` or `app/`.
