# Academic Chunk 3: Papers Single-Engine + Flexible Articles Contract — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Backend tasks (1–8) are Codex's lane (RULES §2); Task 9 (frontend) is Claude's lane and is gated on Kevin's GPT-image-2 mockups.

**Goal:** Make `papers-radar` the single academic engine on the pipeline kernel, producing a new *flexible, section-mirroring* `articles.json` contract (per the 2026-05-30 content-analysis redesign), and retire the hardcoded `refresh-articles` seeds.

**Architecture:** Port `papers-radar.mjs` onto the existing `columns/<id>/{sources,evaluate,prompts,qa,index}.mjs` + `pipeline-kernel` pattern already used by Projects (Chunk 2). `evaluate()` = 汇聚×赛道×idea triage (coverage of the existing deterministic + cheap-model triage). `analyze()` = professor-voice analysis that **mirrors the paper's own sections** (translate+summarize each + locate load-bearing + lay out evidence/limits as facts; never renders a good/bad verdict). `publish()` writes the new `articles.json` and keeps `paper-radar.json`. Frontend (`Articles.tsx`) adapts to the new contract separately.

**Tech Stack:** Node 24 ESM, `node:sqlite` (`scripts/lib/db.mjs`), `node:test`, DeepSeek client (`scripts/lib/llm.mjs`), Vite/React/TS frontend. Gate: `npm run verify` (= `lint && test && build`; `test` includes `validate`).

**Spec:** `docs/superpowers/specs/2026-05-30-content-analysis-model-redesign.md` (§2 philosophy, §4.1 academic, §6 contract).

---

## Scope

This plan = **academic backend** only (papers single-engine + new contract + retire refresh-articles). Out of scope, each its own later plan: Models (Chunk 4), Projects analysis upgrade + Understand-Anything, knowledge-graph/embeddings/净化池, Podcast. Frontend `Articles.tsx` rework (Task 9) is Claude's lane and waits on Kevin's mockups; the **types are defined here (Task 1)** so backend and frontend share one contract.

## File Structure

- `src/types.ts` — **modify**: replace heavy `AcademicArticle`/`ArticlesData` with the new flexible `AcademicPaperAnalysis`/`ArticlesData`. (Keep `PaperRadar*` types as-is.)
- `scripts/validate-articles.mjs` — **rewrite**: validate the new shape.
- `scripts/columns/papers/sources.mjs` — **create**: `discover` + `collectEvidence` (port discovery from `papers-radar.mjs`).
- `scripts/columns/papers/evaluate.mjs` — **create**: `evaluate` (汇聚×赛道×idea triage) + `select`.
- `scripts/columns/papers/prompts.mjs` — **create**: section-mirroring analysis prompts (light/deep).
- `scripts/columns/papers/analyze.mjs` — **create**: `analyze` → normalized `AcademicPaperAnalysis`.
- `scripts/columns/papers/qa.mjs` — **create**: `qaGate` (structural + groundedness harness via `qa-base`).
- `scripts/columns/papers/index.mjs` — **create**: the `ColumnModule` (id `papers`) + `publish`/`archive`.
- `scripts/run.mjs` — **modify**: register `papers` in `MODULES`.
- `scripts/refresh-articles.mjs` — **delete** (and its `refresh:articles` script).
- `package.json` — **modify**: drop `refresh:articles`; add `papers` run wiring if needed.
- `dev-map.md` — **modify**: reflect papers single-engine + retired refresh-articles.
- Tests: `scripts/__tests__/papers-evaluate.test.mjs`, `papers-analyze.test.mjs`, `papers-qa.test.mjs`.
- Fixtures: `scripts/__tests__/fixtures/papers-harness-survey.json` (the harness-survey paper as a deterministic test input).

---

## Task 1: Define the new academic contract in `src/types.ts`

**Files:**
- Modify: `src/types.ts` (replace the `AcademicArticle` block, ~lines 299–598; keep `PaperRadar*`).

- [ ] **Step 1: Replace the heavy article types with the flexible contract**

```ts
// ---- Academic analysis (2026-05-30 redesign): mirrors the paper's own sections ----
export interface PaperAnalysisSection {
  /** The paper's own section, heading translated to plain Chinese (顺着论文版块走). */
  heading: string;
  /** Plain-language translate + summarize of that section. */
  summary: string;
  /** Optional: locates the load-bearing claim/assumption — LOCATE only, no verdict. */
  loadBearing?: string;
  /** Optional: objective facts about evidence strength / scope — facts, no verdict. */
  evidence?: string;
  /** Optional deep-tier material folded behind a 线头. */
  fold?: string;
}

export interface AcademicPaperLimits {
  /** What the paper itself states as limitations / future work (faithful). */
  paperStated: string;
  /** AI's objective notes on evidence strength / sampling scope (facts, not a verdict). */
  evidenceNotes: string;
}

export interface AcademicPaperSelection {
  /** Independent trusted sources that converged on this paper (汇聚). */
  convergence: string[];
  /** Matched focus tracks (赛道) — kept broad. */
  track: string[];
  /** One-line idea-quality signal from triage (a fact, not a verdict). */
  ideaSignal: string;
}

export interface AcademicPaperAnalysis {
  id: string;
  title: string;
  authors: string;            // may be "双盲匿名"
  venue: string;
  sourceName: string;
  sourceUrl: string;
  arxivId?: string;
  publishedAt?: string;
  verifiedAt: string;         // RULES §6
  tier: "light" | "deep";
  /** 定调 — one framing judgment line (framing, NOT good/bad). */
  leadJudgment: string;
  /** Mirrors the paper's own sections, in order. */
  sections: PaperAnalysisSection[];
  limitsAndFuture: AcademicPaperLimits;
  selection: AcademicPaperSelection;
  provenance: { sourceUrl: string; evidenceKind: string };
}

export interface ArticlesData {
  generatedAt: string;
  pipelineRun?: AgentPipelineRunRef;
  agentFlow?: AgentPipelineFlowStep[];
  qualityGate?: AgentQualityGate;
  papers: AcademicPaperAnalysis[];
}
```

- [ ] **Step 2: Remove now-dead types**

Delete `ArticleVersion`, `ArticleChart*`, `ArticleAnalysis`, `ArticlePlainLanguage`, `Article*`, `Benchmark*`, `PaperType`, `ArticleTemplate*`, `ArticleQualityDecision`, `AcademicArticle`, `ArticlesArchiveData` (the entire old academic block). Keep everything `Model*`, `Trending*`, `PaperRadar*`, `AgentPipeline*`.

- [ ] **Step 3: Typecheck — expect frontend errors (handled in Task 9)**

Run: `npm run typecheck`
Expected: errors only in `src/pages/Articles.tsx` (consumes old shape). These are fixed in Task 9. Backend + other pages compile.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): flexible section-mirroring academic contract (replaces AcademicArticle)"
```

---

## Task 2: Rewrite `validate-articles.mjs` for the new shape + fixture

**Files:**
- Rewrite: `scripts/validate-articles.mjs`
- Create: `scripts/__tests__/fixtures/papers-harness-survey.json`

- [ ] **Step 1: Write the harness-survey fixture** (deterministic input for later analyze tests; real provenance, no fabricated numbers)

```json
{
  "id": "agent-harness-engineering-survey",
  "title": "Agent Harness Engineering: A Survey",
  "authors": "双盲匿名 (TMLR under review)",
  "venue": "TMLR · 在审",
  "sourceName": "OpenReview",
  "sourceUrl": "https://openreview.net/pdf?id=3hXEPbG0dh",
  "arxivId": null,
  "evidence": { "kind": "paper-text", "sections": ["Abstract","Introduction","Taxonomy (ETCLOVG)","Cross-Layer Synthesis","Open Problems","Conclusion"] }
}
```

- [ ] **Step 2: Write the validator** (structural contract enforcement; runs in `npm run validate`)

```js
import { readFile } from "node:fs/promises";

const FILE = new URL("../public/data/articles.json", import.meta.url);
const REPLACEMENT = /�/;            // mojibake guard (RULES §9)
const PLACEHOLDER = /\[占位\]|TODO|TBD/;

function fail(msg) { console.error(`articles.json validation failed: ${msg}`); process.exit(1); }

const data = JSON.parse(await readFile(FILE, "utf8"));
if (!data || typeof data.generatedAt !== "string") fail("missing generatedAt");
if (!Array.isArray(data.papers)) fail("papers must be an array");

for (const [i, p] of data.papers.entries()) {
  const where = `papers[${i}] (${p?.id ?? "?"})`;
  for (const f of ["id","title","authors","venue","sourceName","sourceUrl","verifiedAt","leadJudgment"]) {
    if (typeof p?.[f] !== "string" || !p[f]) fail(`${where}: missing ${f}`);
  }
  if (!["light","deep"].includes(p.tier)) fail(`${where}: tier must be light|deep`);
  if (!Array.isArray(p.sections) || p.sections.length === 0) fail(`${where}: sections empty`);
  for (const [j, s] of p.sections.entries()) {
    if (typeof s?.heading !== "string" || !s.heading) fail(`${where}.sections[${j}]: missing heading`);
    if (typeof s?.summary !== "string" || !s.summary) fail(`${where}.sections[${j}]: missing summary`);
  }
  if (typeof p?.limitsAndFuture?.paperStated !== "string") fail(`${where}: limitsAndFuture.paperStated`);
  if (typeof p?.limitsAndFuture?.evidenceNotes !== "string") fail(`${where}: limitsAndFuture.evidenceNotes`);
  if (!p?.provenance?.sourceUrl) fail(`${where}: provenance.sourceUrl`);
  const blob = JSON.stringify(p);
  if (REPLACEMENT.test(blob)) fail(`${where}: mojibake (U+FFFD)`);
  if (PLACEHOLDER.test(blob)) fail(`${where}: placeholder text`);
}
console.log(`articles.json validation passed (${data.papers.length} papers)`);
```

- [ ] **Step 3: Run against current (old) articles.json — expect FAIL**

Run: `node scripts/validate-articles.mjs`
Expected: FAIL (old file has no `leadJudgment`/`sections`). This proves the validator is live; it goes green once Task 7 republishes.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-articles.mjs scripts/__tests__/fixtures/papers-harness-survey.json
git commit -m "feat(validate): articles.json validator for new section-mirroring shape"
```

---

## Task 3: Scaffold `columns/papers/` — `discover` + `collectEvidence`

**Files:**
- Create: `scripts/columns/papers/sources.mjs`
- Reference: `scripts/papers-radar.mjs` (discovery fns lines ~508–875: HF Daily, PapersWithCode, arXiv filtered, OpenReview, ACL, CVF, company blogs; `mergeCandidates`).

- [ ] **Step 1:** Move the 7-source discovery + `mergeCandidates` into `sources.mjs` as `export async function discover(ctx)`, returning kernel candidates `{ id, column:"papers", source, raw, dedupeKey, discoveredAt }` (preserve dedupe-by-arXiv-id behavior). Network stays out of the default gate (SPEC §9) — guard with `ctx.options.noLlm/dryRun` for offline.
- [ ] **Step 2:** `export async function collectEvidence(candidate, ctx)` → fetch abstract/paper-text (port `enrichArxivCandidates`), return `{ kind:"paper-text", content, sections? }`; persist via `ctx.options.db.upsertEvidence`.
- [ ] **Step 3:** Smoke test offline: `node -e "import('./scripts/columns/papers/sources.mjs').then(m=>m.discover({options:{dryRun:true}})).then(r=>console.log(Array.isArray(r)))"` → `true`.
- [ ] **Step 4: Commit** `git add scripts/columns/papers/sources.mjs && git commit -m "feat(papers): discover + collectEvidence on kernel"`

---

## Task 4: `evaluate()` — 汇聚 × 赛道 × idea 质量 triage (+ behavioral tests)

**Files:**
- Create: `scripts/columns/papers/evaluate.mjs`
- Test: `scripts/__tests__/papers-evaluate.test.mjs`
- Reference: `papers-radar.mjs` `deterministicTriage` (~1048), `decisionFor` (~994), `cheapModelTriage` (~1144), `selectDiverseTop` (~1019).

- [ ] **Step 1: Write the failing behavioral test** (encodes the ruler: multi-source convergence selects; single non-顶会/官方 source does not auto-enter)

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../columns/papers/evaluate.mjs";

const ctx = { options: { noLlm: true } };

test("convergence: >=2 independent trusted sources -> select", async () => {
  const cand = { id: "p1", source: "arxiv", raw: { title: "Agent harness eval", mentions: ["HF Daily","PapersWithCode"], track: ["agent","eval"] } };
  const r = await evaluate(cand, { content: "..." }, ctx);
  assert.equal(r.mode, "rank");
  assert.equal(r.decision, "select");
  assert.ok(r.signals.includes("convergence:2"));
});

test("single 订阅号/推荐 source -> not auto-selected", async () => {
  const cand = { id: "p2", source: "blog", raw: { title: "cool idea", mentions: ["one-newsletter"], track: ["agent"] } };
  const r = await evaluate(cand, { content: "..." }, ctx);
  assert.notEqual(r.decision, "select");
});

test("off-track single source -> archive", async () => {
  const cand = { id: "p3", source: "arxiv", raw: { title: "unrelated", mentions: ["arxiv"], track: [] } };
  const r = await evaluate(cand, { content: "..." }, ctx);
  assert.equal(r.decision, "archive");
});
```

- [ ] **Step 2: Run — expect FAIL** `node --test scripts/__tests__/papers-evaluate.test.mjs` → FAIL (no module).
- [ ] **Step 3: Implement `evaluate`** porting `deterministicTriage`/`decisionFor` into the kernel `EvalResult` shape: `{ candidateId, decision:"select"|"archive", mode:"rank", score, reason, signals:["convergence:N","track:...","idea:..."], provenance, selection:{convergence,track,ideaSignal} }`. Convergence = count of independent trusted `mentions`; single-source requires 顶会/官方 to pass. Cheap-model adjust only when `!noLlm`. Persist via `db.upsertEval` + a `tier:"light"` analysis row (mirror Projects). Add `export function select(evals, ctx)` = `defaultSelect` keeping `decision==="select"`.
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git add scripts/columns/papers/evaluate.mjs scripts/__tests__/papers-evaluate.test.mjs && git commit -m "feat(papers): 汇聚×赛道×idea evaluate with behavioral tests"`

---

## Task 5: `analyze()` — section-mirroring professor analysis (+ normalize tests)

**Files:**
- Create: `scripts/columns/papers/prompts.mjs`, `scripts/columns/papers/analyze.mjs`
- Test: `scripts/__tests__/papers-analyze.test.mjs`

- [ ] **Step 1: Write prompts** (`prompts.mjs`). System prompt encodes the discipline: 资深教授嗓音；顺着论文自己的版块走，每块翻译+总结成大白话；可定位承重主张、把证据强弱/边界当事实摆出；**绝不输出好/坏判决、不打分、不加"想一想"机关；闭门造数据违规**。Output JSON matching `AcademicPaperAnalysis` (minus server-filled fields). Light = sections summaries only; deep = + `loadBearing`/`evidence`/`fold`.
- [ ] **Step 2: Write the failing normalize test** (transform/guard logic is deterministic and testable without the LLM)

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAnalysis } from "../columns/papers/analyze.mjs";

const raw = {
  leadJudgment: "可靠性的瓶颈是 harness，不是模型。",
  sections: [{ heading: "它赌的那句话", summary: "harness 决定上限。", loadBearing: "归因推论是承重墙" }],
  limitsAndFuture: { paperStated: "可观测/治理研究薄", evidenceNotes: "综述无实验，靠3个引用" }
};
const cand = { id: "h", raw: { title: "Agent Harness Engineering: A Survey", authors: "双盲匿名", venue: "TMLR · 在审", sourceUrl: "https://openreview.net/pdf?id=3hXEPbG0dh", sourceName: "OpenReview" } };

test("normalize fills server fields + tier + provenance, strips verdicts", () => {
  const out = normalizeAnalysis(raw, { candidate: cand, tier: "deep", evidence: { kind: "paper-text" }, now: () => "2026-05-30T00:00:00Z" });
  assert.equal(out.tier, "deep");
  assert.equal(out.verifiedAt, "2026-05-30T00:00:00Z");
  assert.equal(out.provenance.sourceUrl, cand.raw.sourceUrl);
  assert.ok(out.sections.length >= 1 && out.sections[0].heading && out.sections[0].summary);
  assert.equal(out.title, cand.raw.title);
});

test("offline fallback yields a valid shape from evidence only", () => {
  const out = normalizeAnalysis(null, { candidate: cand, tier: "light", evidence: { kind: "paper-text", content: "abstract..." }, now: () => "2026-05-30T00:00:00Z" });
  assert.ok(out.leadJudgment && out.sections.length >= 1);
  assert.equal(out.tier, "light");
});
```

- [ ] **Step 3: Run — expect FAIL.**
- [ ] **Step 4: Implement `analyze` + `normalizeAnalysis`.** `analyze(item, evidence, ctx)`: if `!offline`, call `chatJson({ system: analysisSystem(tier), user: analysisUser(candidate, evidence) })`; else `null`. Pass through `normalizeAnalysis(payload, {candidate, tier, evidence, now})` which: fills `id/title/authors/venue/sourceName/sourceUrl/arxivId/publishedAt` from candidate, sets `verifiedAt=now`, `provenance`, clamps/cleans strings, drops empty sections, guarantees ≥1 section (offline fallback builds a single "摘要" section from evidence). Persist `tier:"deep"` analysis via `db.insertAnalysis`.
- [ ] **Step 5: Run — expect PASS.**
- [ ] **Step 6: Commit** `git add scripts/columns/papers/prompts.mjs scripts/columns/papers/analyze.mjs scripts/__tests__/papers-analyze.test.mjs && git commit -m "feat(papers): section-mirroring analyze + normalize tests"`

---

## Task 6: `qaGate()` — structural + groundedness

**Files:**
- Create: `scripts/columns/papers/qa.mjs`
- Test: `scripts/__tests__/papers-qa.test.mjs`
- Reuse: `scripts/lib/qa-base.mjs` (structural checks + LLM-judge harness behind `AI_BRIEF_LLM_JUDGE=1`).

- [ ] **Step 1: Failing test** — a payload with a `[占位]` string or missing `verifiedAt` → `verdict:"fail"`; a clean payload → `verdict:"pass"`. (Use `node:test`.)
- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement `qaGate(analysis, evidence, ctx)`** via `qa-base` structural checks (required fields present, no placeholder/mojibake, `provenance` + `verifiedAt` present, arrays are arrays) + optional groundedness when `AI_BRIEF_LLM_JUDGE=1`. Persist via `db.upsertQaVerdict`. `fail` blocks publish.
- [ ] **Step 4: Run — PASS.**
- [ ] **Step 5: Commit** `git add scripts/columns/papers/qa.mjs scripts/__tests__/papers-qa.test.mjs && git commit -m "feat(papers): qaGate structural + groundedness"`

---

## Task 7: `index.mjs` (ColumnModule) + `publish` + register in `run.mjs`

**Files:**
- Create: `scripts/columns/papers/index.mjs`
- Modify: `scripts/run.mjs` (add `papers` to `MODULES`)
- Reference: `papers-radar.mjs` `publishRadarForFrontend` (~1959) for the unchanged `paper-radar.json`.

- [ ] **Step 1:** Assemble `papersColumnModule = { id:"papers", discover, collectEvidence, evaluate, select, analyze, qaGate, publish, archive }` (mirror `columns/projects/index.mjs` structure).
- [ ] **Step 2: `publish`** — query DB for current papers' analyses, drop any whose QA `verdict==="fail"`, emit `public/data/articles.json` in the new `ArticlesData` shape, AND keep emitting `public/data/paper-radar.json` (port `publishRadarForFrontend`). Include `agentFlow`/`qualityGate`/`pipelineRun` like Projects.
- [ ] **Step 3:** Register `papers: papersColumnModule` in `run.mjs` `MODULES`.
- [ ] **Step 4: Generate a real `articles.json` offline** from the fixture so the validator can pass deterministically: `node scripts/run.mjs papers all --dry-run` (offline fallback analysis), then `node scripts/validate-articles.mjs` → PASS.
- [ ] **Step 5: Commit** `git add scripts/columns/papers/index.mjs scripts/run.mjs public/data/articles.json public/data/paper-radar.json && git commit -m "feat(papers): publish new articles.json + paper-radar via kernel"`

---

## Task 8: Retire `refresh-articles` hardcode

**Files:**
- Delete: `scripts/refresh-articles.mjs`
- Modify: `package.json` (remove `refresh:articles`), `dev-map.md`

- [ ] **Step 1:** `git rm scripts/refresh-articles.mjs`.
- [ ] **Step 2:** Remove the `refresh:articles` script from `package.json`. Grep for other references: `node scripts/lint.mjs` and `rg refresh-articles` → none remain.
- [ ] **Step 3:** Update `dev-map.md`: papers-radar = single academic engine; Articles surface ← papers `publish`; refresh-articles retired.
- [ ] **Step 4: Commit** `git add -A && git commit -m "chore: retire refresh-articles hardcoded seeds (papers is single engine)"`

---

## Task 9: Frontend contract adaptation — `Articles.tsx` (Claude's lane, gated on mockups)

**Files:**
- Modify: `src/pages/Articles.tsx`, `src/lib/data.ts` (loader already returns `ArticlesData`).

> **Do NOT implement until Kevin returns the GPT-image-2 deep-reading mockup.** Then Claude implements the deep-reading view against the Task-1 contract: lead judgment → section list (heading + summary, optional loadBearing/evidence callouts) → foldable `fold` 线头 → `limitsAndFuture` → metadata strip with `verifiedAt`/source. Keep the existing `PaperRadarPanel` (consumes `paper-radar.json`, unchanged). Match B Focus Console palette (`--canvas #0d0e12`, `--accent #e8ad5e`). Verify visually (browse) for moderate density / no fatigue.

- [ ] After implementing: `npm run verify` green; spot-check `#/articles` and `#/articles/agent-harness-engineering-survey`.

---

## Task 10: Full gate + branch wrap

- [ ] **Step 1:** `npm run verify` → lint + tests + validate + build all green.
- [ ] **Step 2:** Confirm `data/ai-brief.db` is gitignored and `public/data/articles.json` + `paper-radar.json` are committed.
- [ ] **Step 3: Commit** any remaining `git add -A && git commit -m "test: academic chunk 3 green"`.

---

## Self-Review

- **Spec coverage:** §4.1 academic ruler → Tasks 4 (汇聚×赛道×idea), 5 (section-mirroring + locate-not-verdict), 6 (QA + verifiedAt). §6 contract → Task 1/2. articles-radar-single-engine → Tasks 7/8. Frontend/visual acceptance → Task 9 (mockup-gated). Self-evolution/graph/pool → **intentionally out of scope** (separate plan).
- **Placeholder scan:** load-bearing items (contract, validator, evaluate ruler tests, normalize tests) have full code; porting steps name exact source functions/line ranges in `papers-radar.mjs` (not "implement later").
- **Type consistency:** `AcademicPaperAnalysis` fields in Task 1 match the validator (Task 2), normalize output (Task 5), and publish (Task 7): `leadJudgment`, `sections[].{heading,summary,loadBearing?,evidence?,fold?}`, `limitsAndFuture.{paperStated,evidenceNotes}`, `selection.{convergence,track,ideaSignal}`, `tier`, `verifiedAt`, `provenance`.

## Execution

Backend Tasks 1–8,10 → **Codex** (per task, calibrated reasoning, not auto-xhigh), Claude reviews between tasks. Task 9 → **Claude**, after Kevin's mockup. Each task ends green on its scoped check; full `npm run verify` at Task 10.
