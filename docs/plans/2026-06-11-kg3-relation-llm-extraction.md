# Plan: KG-3 relation LLM extraction path (KG3-REL-LLM)

> Trigger: >100 line backend/script change. Scope is bounded to KG relation extraction; locked eval, taxonomy, facet source YAML, frontend, deploy, commit and push stay untouched.

## 1. Direction
- Big direction: make Mind Palace typed relation reasoning mine prose-backed cross-document edges, while keeping deterministic CI/dry-run behavior stable.
- Small direction:
  - Add an opt-in `extractEdgesLLM(facets, { model })` path over existing facet candidates.
  - Keep `buildDeterministicFacetRelationEdges` and `node scripts/eval-relation-engine.mjs` working without model calls.
  - Require taxonomy type, quoted facet sentence evidence, and actionable `use` for every LLM edge; category-level overlap becomes `NO_EDGE`.
  - Cap work to `topK <= 5`, total candidates <= 80, one pair per model call, fail-soft on errors/timeouts.

## 2. Requirements
- Goals:
  - Extract richer relations from `self_evo_use` / `innovation` / `evidence` / related prose.
  - Write LLM-produced edges into `public/data/brief/graph.json` only when explicitly enabled for `npm run kg:build`.
  - Add node tests using a mock judge; no live model in tests.
- Non-goals:
  - No taxonomy/eval/facet YAML/frontend changes.
  - No new heavy dependency, DB, service, deployment, commit, or push.
  - No Fable and no unbounded/raw model invocation.
- Impact:
  - `scripts/kg/relation-engine.mjs`, `scripts/kg/integrate-kg.mjs`, tests, dev-map/task-board/report.
- Acceptance:
  - `node scripts/eval-relation-engine.mjs` remains green.
  - LLM-enabled build produces typed primary edges >= 50 when model is available.
  - Recall bench does not regress.
  - `npm run verify` green.

## 3. Design
- `relation-engine.mjs`:
  - Export candidate limiting helpers and `extractEdgesLLM`.
  - Build compact pair prompts from relevant prose fields.
  - Default judge shells out to `claude -p --model <model>` with a temp prompt file/stdin-style payload and timeout; caller can inject a mock judge.
  - Parse strict JSON and validate `NO_EDGE` or `{type, dominance?, evidence, use}`.
  - Evidence gate requires quoted evidence string to appear verbatim in one endpoint prose.
- `integrate-kg.mjs`:
  - Default remains deterministic.
  - Enable LLM path only with `KG_RELATION_LLM=1`; model defaults to `claude-sonnet-4-6`.
  - Dedupe and normalize LLM edges alongside existing relation-engine edges.
- Data contract/schema changes: none. Edge objects already support `type`, `evidence`, `use`, metadata.

## 4. Eval
- Structural gates:
  - `node --test scripts/kg/relation-engine.test.mjs`
  - `node scripts/eval-relation-engine.mjs`
  - `npm run kg:build`
  - `node scripts/kg/bench-retrieval.mjs hybrid`
  - `node scripts/kg/recall-eval.mjs`
  - `npm run verify`
  - `npm run ops:baseline:diff`
- Content gate:
  - Independent review needed after implementation because generator must not self-review high-risk KG relation assets.
- Success metrics:
  - Dry-run CI path unchanged enough to stay green.
  - LLM path edge count >= 50 typed primary edges with evidence/use.

## 5. Tools
- Tools/scripts:
  - PowerShell for read/test commands.
  - `apply_patch` for edits.
  - Existing Node/YAML/jsonrepair if useful; no new dependency.
  - Local `claude -p --model claude-sonnet-4-6` only behind explicit env gate.
- New dependencies: none.

## 6. Orchestration
- Single Codex implementation is enough for the backend change.
- Independent code/content review remains required after implementation; dispatch requirements:
  - Role: code review.
  - Eval: compare implementation against this plan and DONE criteria.
  - Model/effort: independent strong reviewer, medium/high depending availability.
  - Boundary: reviewer must not modify code or relax gates.
- No LangGraph/CrewAI/AutoGen runtime.

## 7. Slices
- Slice 1: Add LLM extraction API and mock tests.
- Slice 2: Wire opt-in build path and run deterministic gates.
- Slice 3: Run one explicit LLM build if local model is available, compare typed edge count/recall, write report.

## 8. Risks
- Model unavailable or rate-limited: fail-soft and report; deterministic build remains deliverable.
- Evidence quote mismatch from model: gate rejects, lowering yield but protecting graph quality.
- Candidate dedupe may hide new edges behind higher-priority existing pair edges: report distribution and known limit.
- Rollback: unset `KG_RELATION_LLM`; deterministic path is unchanged and idempotent.
