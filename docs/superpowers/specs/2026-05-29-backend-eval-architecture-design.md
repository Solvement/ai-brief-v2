# AI Brief · Backend Eval Architecture — Design Spec

Date: 2026-05-29 · Owner decision: Kevin (delegated impl autonomy) · Backend impl: Codex (RULES §2) · Frontend: Claude

This spec governs a backend re-architecture of AI Brief's content pipelines. It is the source of truth Codex implements against, chunk by chunk, each behind `npm run verify`.

## 1. Goal

Cure three pains at once:
1. **Selection quality** — picks don't match each column's "好" (SPEC §3).
2. **Architecture mess** — three pipelines diverged (one real, one was hardcoded, one manual); eval logic scattered.
3. **Generation trust** — generated analysis can be shallow / fabricated / placeholdered.

Acceptance (Kevin): the **final frontend page** — attractive, not visually fatiguing, moderate info density, analysis on-point. Backend serves "分析到位".

## 2. Architecture — Approach A: kernel + per-column eval modules

A shared **pipeline kernel** runs a fixed funnel; each **column module** plugs in its own logic.

```
ColumnModule {
  id                              // "projects" | "papers" | "models" | (future) "podcast"
  discover(ctx)        → candidate[]   // fetch WIDE from sources; dedupe only, no shallow pre-filter
  collectEvidence(c)   → evidence      // README / abstract / official text / (future) transcript
  evaluate(c, ev)      → EvalResult     // ★ SELECTION eval — encodes this column's SPEC §3 ruler
  analyze(selected,ev) → analysis       // LLM, per-column depth & shape
  qaGate(analysis,ev)  → QAResult       // ★ QA eval — output quality contract
}
```

**Kernel owns** (write once, all columns share): concurrency, caching, retry, the LLM client, run memory, `pipeline-status.json`, and the uniform validate/encoding gate. **Modules own only column-specific judgment.**

### Funnel (industry-standard discovery → triage → deep)

```
discover WIDE → collectEvidence → evaluate (cheap model triage)
  → ALL candidates → light档 (nothing lost)
  → top-N over threshold → deep档
  → analyze (expensive model, deep档 only)
  → qaGate → publish (DB → public/data/<col>.json) → archive
```

Cheap model triages everything; expensive model only deep-dives top-N (institutionalize ingest's light=flash / deep=pro split into the kernel).

## 3. Two evals (explicit in the interface)

### evaluate() — SELECTION, two modes
`EvalResult { decision, score?, reason, signals[], provenance, mode }`
- **rank mode** (projects / papers / podcast): score + select top-N ≥ threshold.
- **coverage mode** (models): `decision: "keep-all"` — judges completeness & faithfulness, never filters (闭源不许筛, SPEC §3).

### qaGate() — QA contract every output passes before publish
- **Structural (deterministic, always):** required fields present; no placeholder (`[占位]`/TODO); no mojibake (RULES §9); arrays are arrays; provenance present per claim; model "latest" claims carry `verifiedAt`.
- **Groundedness (LLM-as-judge, optional per item):** feed (evidence + generated analysis) to a cheap judge model → "is each claim supported by evidence? any fabrication?" → score + flags. `fail` blocks publish; `warn` annotates. This makes trust measurable & gated (pain #3).

## 4. Per-column rulers

### Projects (rank mode)
- discover: GitHub Trending daily/weekly/monthly, dedupe only.
- evidence: README (+ description, language, stars/gained).
- evaluate: cheap-model light read → `worthDeepDive` + tags + tldr + **intent class (理解型/教学型/工具型)**. **Keyword signals become scoring FEATURES, not a hard cap** — a repo with "finance" + strong agent-infra signals must NOT be auto-capped (current bug). 
- analyze (deep): per intent — 理解型: 应用价值+怎么做到; 教学型: 怎么跟着学/看啥跳啥; 工具型: 怎么用+扩展用法.
- "好" = AI-engineer learning value (agents/RAG/MCP/A2A/memory/eval/AI coding/AIGC eng).

### Papers (rank mode, provenance-critical) — also feeds the Articles surface
- discover: the **7 sources** (HF Daily, PapersWithCode trending, arXiv filtered queries, OpenReview, ACL Anthology, CVF OpenAccess, company research blogs). **This resolves SPEC §10.3 open source-list.**
- evaluate = **汇聚 × 赛道 × idea质量**: aggregation (≥2 independent trusted sources → strong; single source must be 顶会/官方); track (FOCUS_TOPICS: agent/RAG/memory/eval/AI coding/AIGC eng); idea-quality (cheap-model triage). Single 订阅号/推荐 never auto-enters.
- analyze (deep): core idea/architecture + 为什么是进展 + 可迁移到哪 + 术语用例子大白话.
- Retire `refresh-articles.mjs` hardcoded seeds; Articles surface consumes papers output (see memory: articles-radar-single-engine).

### Models (coverage mode — NO selection) — first real Models pipeline
- discover: watch official sources per model org (release notes / blog / model cards).
- evidence: official update text.
- evaluate: `keep-all`; judge completeness via **diff vs last snapshot** + faithfulness.
- analyze: 闭源 = faithful translate+organize official 原文 (take ALL, no filter); 开源 = official update + 架构/怎么做到/为什么/意义/缺点/下一步 (deep, official-sourced).
- QA: "最新" claims **dated-verified** (RULES §6) else flagged 推断.

## 5. Data layer — HYBRID (reverses SPEC §6 non-goal; Kevin拍板)

Real **SQLite** `data/ai-brief.db`; frontend stays **static** (a `publish` step queries DB → writes `public/data/<col>.json`, contracts ~unchanged).

Tables: `candidates(id,column,source,raw,dedupe_key,discovered_at)`, `evidence(candidate_id,kind,content,fetched_at)`, `evals(candidate_id,decision,mode,score,signals,reason,evaluated_at)`, `analyses(candidate_id,tier,payload,model,generated_at)`, `qa_verdicts(analysis_id,structural_pass,grounded_score,flags,verdict)`, `runs(id,column,stage,status,metrics,ran_at)`.

**SQLite driver decision (Codex):** env is Windows + Node 20. `node:sqlite` needs Node ≥22. Prefer either (a) bump dev/runtime to Node 22 LTS and use built-in `node:sqlite`, or (b) `better-sqlite3` if its Windows native build is reliable here. Codex picks the one that builds cleanly and keeps `npm run verify` green; record the choice in dev-map.

## 6. File layout

```
scripts/
  lib/  pipeline-kernel.mjs   llm.mjs   qa-base.mjs   db.mjs
  columns/{projects,papers,models}/{sources,evaluate,prompts,qa}.mjs
  run.mjs                 # CLI: run <column> [discover|triage|deep|publish|all]
data/ai-brief.db
public/data/*.json        # build artifacts from DB
```

## 7. Migration (incremental; each chunk passes `npm run verify`)

- **Chunk 1 — foundation (no behavior change):** add `db.mjs` (SQLite schema+access), extract DeepSeek client from `ingest.mjs` into `lib/llm.mjs` (ingest imports it; identical behavior), formalize `pipeline-kernel.mjs` module interface, add `qa-base.mjs` (structural QA + LLM-judge harness). Unit tests for db + qa-base. Existing pipelines untouched and still pass.
- **Chunk 2 — Projects → module:** port ingest into `columns/projects/*` on the kernel; `publish` emits the same `trending.json`. Behavioral tests for `evaluate` (incl. the finance-not-capped case).
- **Chunk 3 — Papers → module + retire articles:** port papers-radar; retire `refresh-articles` hardcode; Articles surface ← papers output. Tests for 汇聚×赛道×idea质量.
- **Chunk 4 — Models coverage pipeline:** first real Models module; dated-verify QA.
- **Chunk 5 — (future) Podcast module.**

## 8. Testing

Each `evaluate()` and `qaGate()` gets **behavioral** unit tests (input → expected decision), not just shape validators. Kernel tested for select/concurrency/cache. Network `discover` stays excluded from the default gate (SPEC §9); live runs are manual/CI.

## 9. SPEC amendment needed (Kevin signoff)

SPEC §6 currently lists "后端重写、数据库" as non-goals. This design introduces a SQLite data layer (frontend stays static). SPEC §6 must be amended to permit a local SQLite data layer while keeping static frontend delivery. Draft for Kevin's signoff when convenient.
