# Codex Work-Order · BriefMem Phase 2a — Additive Foundation

> **Role of this doc:** implementation brief handed to Codex (the architect/builder).
> **PM/router:** Opus 4.8 (Claude). **Reviewer:** separate review pass after build.
> **Scope discipline:** Phase 2a is **purely additive**. Do NOT delete or modify any
> existing file under `scripts/columns/`, `scripts/lib/`, `data/agent-memory/`,
> `scripts/papers-radar.mjs`, or the validate-*/sync scripts. The old pipeline must
> keep working and `npm run verify` must still pass unchanged. The delete + rewire
> is a separate later work-order (Phase 2b), explicitly out of scope here.

## Goal

Stand up the AutoSci-faithful typed memory engine ("BriefMem") as a new, self-contained
subsystem under `scripts/brief/` + `brief-wiki/`, driven by the schema contract that
already exists at `scripts/brief/schema/{entities,edges,xref,conventions}.yaml`.

Reference architecture (READ-ONLY, do not depend on or import): `../AutoSci-main`,
specifically `runtime/loader.py`, `tools/lint.py`, `tools/research_wiki.py`. Port the
*ideas* to Node/ESM; do not copy Python.

## Authoritative inputs (already written — do not edit, treat as the contract)

- `scripts/brief/schema/entities.yaml` — entity node contract
- `scripts/brief/schema/edges.yaml` — typed edge contract
- `scripts/brief/schema/xref.yaml` — bidirectional link rules
- `scripts/brief/schema/conventions.yaml` — slug/path/log/ownership/derived constants
- `docs/superpowers/specs/2026-06-01-briefmem-rearch-spec.md` — full design + §3 field intent

## Deliverables (steps)

### Step 1 — Dependency + loader
- Add `yaml` to `package.json` dependencies (npm i yaml). Justify in commit msg: schema-contract parsing.
- `scripts/brief/loader.mjs` — port of `runtime/loader.py`. Reads the 4 schema YAMLs once,
  exposes: `ENTITIES`, `ENTITY_DIRS`, `REQUIRED_FIELDS`, `FIELD_DEFAULTS`, `VALID_VALUES`,
  `LIFECYCLE`, `EDGES`, `VALID_EDGE_TYPES`, `edgeIsSymmetric`, `edgeRequiresConfidence`,
  `XREF`, `CONVENTIONS`, `slugRule`, `validateEdgeAttributes`. Single source of truth for
  both wiki.mjs and lint.mjs. Pure functions; no side effects on import beyond reading YAML.

### Step 2 — Body templates
- `scripts/brief/templates/{content,source-pack,evidence-pack,deep-dive,concept,method,system-component,claim,evidence,artifact,design-principle,taste}.md.tmpl`
- Each = `---\n{{ frontmatter }}\n---\n` + the H2 body sections the entity needs, including
  the reverse-link target sections named in xref.yaml (e.g. content needs
  `## Methods / ## Concepts / ## Components / ## Claims / ## Evidence / ## Artifacts / ## Principles`).
  deep-dive body sections: `Technical reading / Terminology / Architecture / Mechanisms /
  Highlights / Defects / AI after-analysis` (the structured ledgers live in frontmatter).

### Step 3 — Wiki engine
- `scripts/brief/wiki.mjs` — port the relevant subset of `tools/research_wiki.py`. CLI + importable API:
  - `init <wiki-root>` — scaffold `brief-wiki/` dirs (one per entity), `index.md`, `log.md`,
    `graph/{edges.jsonl,context-brief.md,gap-map.md}`, and seed the `taste/me.md` singleton
    from the UserTaste seed values in the rearch spec §3.2.
  - `slug "<title>"` — kebab per slug_rule.
  - `read-meta <path> [field]` / `set-meta <path> <field> <value> [--append]` — frontmatter I/O.
  - `add-edge <wiki-root> --from --to --type [--confidence] [--evidence]` — append to
    edges.jsonl; reject missing confidence/evidence for edges that require it; reject unknown
    types and bad endpoints (per edges.yaml); symmetric edges stored once with sorted endpoints.
  - `write-reverse <wiki-root> --rule ...` (or fold into a higher-level create helper) — apply
    the matching xref.yaml reverse update in the same call. Forward write MUST be able to emit
    its reverse (the bidirectional invariant).
  - `log <wiki-root> "<message>"` — append-only log line per log_grammar.
  - `rebuild-context-brief <wiki-root>` — derive `graph/context-brief.md` (compact summary of
    current memory: counts, top tracks, recent deep-dives).
  - `rebuild-gap-map <wiki-root>` — port of `rebuild_open_questions`: collect `open_questions`
    from concepts + deep-dive `## Open questions`/defects into `graph/gap-map.md`.
- `graph/` is tool-only; `log.md` append-only (enforce in code, mirror conventions.yaml::ownership).

### Step 4 — Deterministic lint (BriefGuard layer A)
- `scripts/brief/lint.mjs` — port `tools/lint.py` checks, schema-driven:
  broken `[[slug]]`, orphan pages, missing required fields, enum/range violations,
  `required_when`, **xref reverse-link asymmetry**, edge from/to node existence, edge type
  validity, edge confidence/evidence presence. Plus BriefMem-specific guard rules from
  rearch spec §5A: discovery-source-as-primary, referenced-repo-as-official, reachable≠reproducible,
  number-without-source_pointer, missing_source + high evidence_strength, "not specified in
  fetched text" placeholder, deep-dive missing artifact_audit, deep-dive without structured memory.
  Flags: 🔴 / 🟡 / 🔵. Support `--json` and `--fix` (deterministic fixes only: reverse-link
  completion, default-fill). Idempotent.

### Step 5 — Frontend build/compile
- `scripts/brief/build.mjs` — compile `brief-wiki/` → `public/data/*.json` (parse frontmatter +
  body + graph into the JSON shapes the React pages consume). Write to a NEW namespace
  (e.g. `public/data/brief/*.json`) so it does NOT collide with the existing
  `public/data/{articles,paper-radar,...}.json` that the live site still uses. Frontend wiring
  is a later phase — this step only produces the JSON.

### Step 6 — Tests + wiring
- `scripts/__tests__/brief-loader.test.mjs`, `brief-wiki.test.mjs`, `brief-lint.test.mjs`:
  schema round-trip, bidirectional-edge invariant, lint catches each violation class, slug rules,
  lifecycle transition validity. Use `node --test`, matching existing test style.
- Add npm scripts: `brief:init`, `brief:lint`, `brief:build`. Do NOT alter existing `verify`/`test`
  in a way that could break them; you MAY add the brief tests to the `test` glob (they already
  match `scripts/__tests__/*.test.mjs`) — ensure they pass.

## Done criteria
- `npm run verify` passes (old pipeline untouched + new brief tests green).
- `npm run brief:init` scaffolds a valid `brief-wiki/` that `npm run brief:lint` reports clean.
- A hand-authored sample paper entity (content + source-pack + evidence-pack + deep-dive +
  one concept + one method, fully cross-linked) passes lint with zero 🔴.
- No file outside `scripts/brief/`, `brief-wiki/`, `scripts/__tests__/brief-*`, `package.json`
  is modified.

## Out of scope (later work-orders)
- Deleting `data/agent-memory/*.json` and rewiring `scripts/columns/papers/*` to write BriefMem (Phase 2b/6).
- Collectors for projects/models/podcasts/blogs (papers-first).
- Frontend pages (Phase 8).
- LLM reviewer layer B of BriefGuard (Phase 4).
