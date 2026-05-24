# Agentic AI Brief Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade AI-Brief from a content display site into a traceable, quality-first, agentic research pipeline for AI engineer learning.

**Architecture:** Keep the current static React + JSON architecture, but make the content pipeline more agentic: discovery trace, quality decision, evidence collection, professor review, verification, publishing, and archive. Do not add queues, databases, Kafka, or Kubernetes in this phase; the right MVP is structured JSON, validation gates, and observable local scripts.

**Tech Stack:** React, TypeScript, Vite, Node.js scripts, JSON data contracts, DeepSeek model routing, local validation scripts.

---

## Phase Roadmap

### Phase 1: Paper Radar Discovery Quality and Observability

**Objective:** Make AHE-like papers discoverable, explainable, and debuggable.

**Files:**
- Modify: `scripts/papers-radar.mjs`
- Modify: `scripts/validate-papers-radar.mjs`
- Data output: `data/papers/candidates-YYYY-MM-DD.json`
- Data output: `data/papers/triage-YYYY-MM-DD.json`

**Required behavior:**
- Discovery should preserve source traces: source, query label, candidate count, matched topics, freshness, hotness, and rejection reason.
- Triage should explain why a paper was selected or rejected.
- AHE-like concepts must be first-class search targets: agent harness, observability, execution trace, trajectory, rollback, harness safety, Terminal-Bench, self-improving coding agents.
- Selection remains small: top 10 triage, daily output 1 must-read + 3 skim.

**Validation:**
- Run `node --no-warnings scripts/papers-radar.mjs discover --date=2026-05-20 --limit=160`
- Run `node --no-warnings scripts/papers-radar.mjs triage --date=2026-05-20 --no-model`
- Confirm `Agentic Harness Engineering` appears in `data/papers/triage-2026-05-20.json` top results when available from arXiv.
- Run `npm run validate`.

### Phase 2: Professor Review Schema

**Objective:** Make paper reviews teach transferable engineering judgment, not just summarize papers.

**Files:**
- Modify: `scripts/papers-radar.mjs`
- Modify: `scripts/validate-papers-radar.mjs`
- Data output: `data/papers/reviewed/*.json`
- Data output: `data/papers/daily-YYYY-MM-DD.json`

**Required behavior:**
- Review output must include:
  - what to learn;
  - good ideas worth stealing;
  - bad ideas, limits, and failure modes;
  - transferable patterns;
  - future work applications;
  - architecture takeaway;
  - reading questions;
  - learning tasks with pass criteria.
- Reviews must be cache-safe and never re-review the same paper version unless forced.
- Dry-run text must be valid UTF-8 Chinese, not mojibake.

**Validation:**
- Run `node --no-warnings scripts/papers-radar.mjs review --date=2026-05-20 --review-limit=1 --dry-run --force`
- Run `node --no-warnings scripts/papers-radar.mjs daily --date=2026-05-20`
- Run `npm run validate`.

### Phase 3: Articles Active Feed and Archive Contract

**Objective:** Keep Articles daily feed quality-first, with only five active papers and a reusable archive.

**Files:**
- Modify: `src/types.ts`
- Modify: `scripts/refresh-articles.mjs`
- Modify: `scripts/validate-articles.mjs`
- Data output: `public/data/articles.json`
- Data output: `public/data/articles-archive.json`

**Required behavior:**
- `articles.json` contains only active top 5 papers.
- `articles-archive.json` preserves previous and lower-priority papers for future architecture reuse.
- Paper selection happens before template choice.
- Every paper has `qualityDecision` and `templateDecision`.
- Specialized templates are used only when the data supports them; otherwise the item falls back to `system_method` with `fallbackReason`.

**Validation:**
- Run `npm run refresh:articles`
- Run `npm run validate`
- Confirm no replacement characters, repeated question marks, `undefined`, `NaN`, or `null` appear in public data.

### Phase 4: Article Deep Dive System Lens UI

**Objective:** Turn paper deep dives into a visual reading workbench with system architecture, evidence, critique, application, and verification.

**Files:**
- Modify: `src/pages/Articles.tsx`
- Modify: `src/styles.css`

**Required behavior:**
- Top of every detail page keeps Paper Question.
- Add a compact reading route rather than a large Deep Dive Loop block.
- Benchmark/evaluation papers render Claim Map, Experiment Matrix, Critical Review, Application, and Interview Card.
- Agent/system papers should emphasize:
  - input;
  - agent roles;
  - orchestrator or control loop;
  - tool/data/memory interfaces;
  - feedback loop;
  - evaluation;
  - transferable design pattern.
- Reduce card clutter: use narrative explanation blocks for long reasoning.
- Fix badge clipping for Block / Step labels.

**Validation:**
- Run `npm run typecheck`
- Run `npm run build`
- Use in-app browser at `http://127.0.0.1:5180/#/articles`
- Open at least one benchmark paper and one system/agent paper.
- Check desktop and narrow viewport for overlapping text.

### Phase 5: Project-Wide Agentic Pipeline Documentation

**Objective:** Keep the long-term maintenance docs aligned with the new agentic pipeline.

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/repo_map.md`
- Modify: `docs/current_problems.md`
- Modify: `docs/goals.md`
- Modify: `AGENTS.md`

**Required behavior:**
- Document the product pipeline as:
  `discover -> evidence -> rank -> review -> verify -> publish -> archive`.
- Record known limitations:
  - company source pages may block scraping;
  - ranking can miss emerging terms if query expansion is weak;
  - static curated article seed still needs a stronger live import bridge;
  - model/latest claims must be source-verified.
- State that observability trace is mandatory for discovery and triage decisions.

**Validation:**
- Run `npm run validate`
- Confirm docs mention AI Job Research Radar, active five-paper Articles feed, archive, and professor-style review expectations.

### Phase 6: Full QA and Browser Review

**Objective:** Prove the upgrade works locally.

**Files:**
- No code ownership; this is integration and QA.

**Commands:**
- `npm run refresh:articles`
- `npm run papers:discover -- --date=2026-05-20 --limit=160`
- `npm run papers:triage -- --date=2026-05-20 --no-model`
- `npm run validate`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Start dev server if needed: `npm run dev -- --port 5180`

**Browser checks:**
- `http://127.0.0.1:5180/#/articles`
- `http://127.0.0.1:5180/#/articles/swe-bench-illusion`
- `http://127.0.0.1:5180/#/projects`
- `http://127.0.0.1:5180/#/models`

**Pass criteria:**
- Pages load without blank views.
- Chinese text is readable.
- No visible `�`, `undefined`, `NaN`, or accidental `null`.
- Article cards explain why each paper was selected.
- Paper detail pages clearly answer: what to learn, what is good, what is weak, and how to transfer the idea.

---

## Parallel Agent Split

### Agent A: Paper Radar Observability

**Ownership:** `scripts/papers-radar.mjs`, `scripts/validate-papers-radar.mjs`, `data/papers/candidates-2026-05-20.json`, `data/papers/triage-2026-05-20.json`.

**Goal:** Improve discovery traces and quality scoring so AHE-like papers are found and explainable.

**Do not edit:** `src/pages/Articles.tsx`, `src/styles.css`, `src/types.ts`, public article data.

### Agent B: Articles Deep Dive UI

**Ownership:** `src/pages/Articles.tsx`, `src/styles.css`.

**Goal:** Turn the Articles detail page into a system-lens reading workbench, with fewer small cards and stronger narrative blocks.

**Do not edit:** `scripts/papers-radar.mjs`, `scripts/refresh-articles.mjs`, `src/types.ts`.

### Agent C: Validation and Encoding

**Ownership:** `scripts/validate-articles.mjs`, `scripts/validate-papers-radar.mjs`, `scripts/validate-text-encoding.mjs`.

**Goal:** Make validation catch shallow review output, missing trace fields, missing professor fields, and mojibake.

**Do not edit:** UI files or data generation scripts except validation scripts.

### Agent D: Documentation Contract

**Ownership:** `docs/architecture.md`, `docs/repo_map.md`, `docs/current_problems.md`, `docs/goals.md`, `AGENTS.md`.

**Goal:** Update docs to describe the new multi-agent research pipeline, observability trace, active/archive article policy, and daily quality standards.

**Do not edit:** scripts, UI files, or public data.

---

## Integration Order

1. Merge Agent A first because it defines discovery outputs.
2. Merge Agent C second because validators should enforce the new data contract.
3. Merge Agent B third because UI should consume already-valid data.
4. Merge Agent D last so docs describe the integrated behavior.
5. Run Phase 6 QA after all changes are integrated.

## Self-Review

- Spec coverage: The plan covers image-inspired multi-agent architecture, discovery trace, professor review, active five-paper Articles feed, archive memory, UI system lens, validation, documentation, and browser QA.
- Placeholder scan: No task uses TBD/TODO/fill-later wording.
- Type consistency: Shared type changes remain centralized in Phase 3 and should not be edited by UI or radar agents unless explicitly reassigned.
