# AI-Brief — project instructions for Claude

## What this project is (goal)
AI-Brief is Kevin's personal AI-intelligence site, modeled on **机器之心 (a full AI feed)**, and the **L0 learning substrate** for his future learning agent (north-star: **L0 corpus → L1 self-evolve → L2 tutor → L3 research**; both Kevin and the AI learn from it). Product spine: `Information → Judgment → Action`. The moat is **解读 quality (judgment), not aggregation speed**. Canonical product detail: `SPEC.md` (see §0 for the current 2026-06-03 direction), `CONTEXT.md`.

## Architecture (4 active columns)
- **文章** — source HF Daily Papers (top by upvotes) → 机器之心-style paper 解读.
- **项目** — GitHub Trending (daily/weekly/monthly real per-window lists, deduped) → tiered triage/analysis.
- **模型** — HF (open) + vendor changelogs (closed) → model cards / version-update diffs.
- **AI 新闻** — official blogs RSS/HTML + Hacker News API + tech-press RSS + Reddit (X unscrapable). Broad, ~20/day cap, analysis optional.
Podcast = later.

Each column's analysis paradigm is a **canonical Kevin-authored prompt** in `docs/paradigms/{papers,projects,models}.md`. Shared house rules: Tier system; gloss key English terms in Chinese on first use; **no fabrication** (mark "数据不足 / 官方未披露" when unknown); **自报 vs 实测 / 已核实 vs 自称**; deep tier marked `[需人工确认]`; explain mechanism with an analogy; never a "翻译机" (项目 Tier2/3 value = 成熟度判断 + 横向对比). Papers paradigm uses **density-zoning** (看点 no numbers, method via analogy, numbers concentrated in results/ablation, sources as **footnotes not inline**).

## Analysis engine & quality
- Deep tiers authored by a **strong model (codex GPT-5.5 `high`)** reading the FULL source (paper full-text via arXiv HTML; repo source via clone) → concrete (real config/code/numbers), not framework sketches.
- Quality gate (early stage = high coverage): at-birth reviewer **+ an independent COLD audit** (a fresh agent with no generation context, sees artifact + source + rubric). Generator ≠ critic.

## Run model
**Local subscription** (Claude Code / codex), updated at **boot time** (Windows Task Scheduler), NOT cloud per-token API — Kevin only reads at the computer, so "update while off" is a pseudo-need. Cheap layers (discover / light / news aggregation) run local DeepSeek.

## Division of labor
Claude = **frontend + architecture + review + router/PM**. Codex = **backend engineering** (and Codex spawns its OWN sub-agents). For sizeable work, **decompose to sub-agents, don't single-agent it**; isolate workspace (worktrees) when concurrent. **Large batch / audit / multi-angle / quality-gate → use a dynamic workflow** (below). Small one-off bugs Claude may fix directly. Frontend visual = **light theme + blue accent** (per Kevin's approved GPT mockups); Kevin judges by the rendered frontend, so verify visually (`/browse`) before claiming done. Frontend designs Claude is unsure about → write a GPT image-gen prompt (content across states, no colors) for Kevin to generate mockups.

## Dynamic workflows (Claude Code) — when & how to use

A **dynamic workflow** is a JavaScript script Claude writes that orchestrates many [subagents] at scale; a runtime runs it in the background while the session stays responsive. The plan/loop/branching and intermediate results live in the **script**, not Claude's context window — so Claude's context only holds the final answer. (Research preview; requires Claude Code v2.1.154+; enable in `/config` → "Dynamic workflows".) Source: https://code.claude.com/docs/en/workflows

### USE a dynamic workflow when (official criteria)
- The task needs **more agents than one conversation can coordinate** (dozens–hundreds), OR
- You want the orchestration **codified as a rerunnable script**, OR
- You want a **repeatable quality pattern**, not just more agents: independent agents **adversarially review each other's findings** before reporting, or draft a plan from **several independent angles** and weigh them — more trustworthy than a single pass.

Official example fits: **codebase-wide bug sweep / security audit**, **large migration (e.g. 500+ files)**, a **research question whose sources must be cross-checked against each other**, a **hard plan worth drafting from several angles before committing**, and **"critical work you need checked twice"** where a wrong answer is costly.

### On THIS project, that means: use a workflow for
- **Repo-wide audits/sweeps** (e.g. the dead-code / cleanup audit, a security pass, "find every X across the codebase").
- **Batch generation/regeneration** across many items (e.g. regenerating all deep-dives, the deep-high backfill across ~all repos, a schema migration touching many files).
- **Cross-checked research** (e.g. `/deep-research <question>` for grounding a decision against many sources).
- **The double-review / cold-audit quality gate** (independent + adversarial review is literally what workflows do well) — see memory `quality-gate-double-review`, `multi-agent-doctrine`.
- **A hard plan from several angles** before committing to a paradigm change.

### Do NOT use a workflow when
- All agents must **share the same context**, or there are **many dependencies between agents** (multi-agent is a bad fit — do it inline or with a single agent).
- The task is **small / single-context** (overhead + token cost not worth it).
- You need **mid-run user input** (workflows take no input mid-run; only agent permission prompts can pause — for sign-off between stages, run each stage as its own workflow).

### How to invoke
- Include the keyword **`ultracode`** in the prompt (e.g. `ultracode: audit every API route for missing auth`), or just say **"use a workflow" / "run a workflow"**. (Before v2.1.160 the trigger word was `workflow`.)
- `/effort ultracode` → let Claude **auto-decide** per task for the whole session (xhigh effort + auto-orchestration; resets next session; drop back with `/effort high`).
- Bundled: **`/deep-research <question>`**. Saved workflows run as `/<name>` (save a good run via `/workflows` → `s` to `.claude/workflows/` (repo) or `~/.claude/workflows/` (personal)).
- Manage/watch runs: `/workflows`. Resumable within the same session.

### Limits & cost (be deliberate)
- **16 concurrent agents, 1,000 total per run.** Many agents = meaningfully more tokens, counts toward plan usage/rate limits.
- **Gauge spend first: run on a small slice** (one dir / a narrow question) before the whole repo; `/workflows` shows per-agent token use and you can stop anytime without losing completed work.
- **Model-tier for cost:** route stages that don't need the strongest model to a smaller one; reserve Opus for orchestration.

### Project routing note (Claude workflow vs codex)
Dynamic workflows use **Claude's subagents (this Claude Code subscription)**. Heavy *backend engineering implementation* on this project is still routed to **codex** (see memory `execution-division-of-labor`). Reach for a Claude dynamic workflow for **audits / cross-checked research / multi-angle review / quality gates / Claude-side batch work**; keep codex for the backend builds.


# 项目宪法 / CLAUDE.md

## 角色边界
- Claude Code = lead：架构、总路由、前端、审核、任务拆解与编排。
- Codex CLI = 执行者：只按 /specs 下的任务规格实现，产出 diff，不扩大范围。
- 我（人）= 验收者：schema 变更、首次上线、删除性操作必须经我确认。

## 不可违反的红线
- 每日流水线里禁止放开放式 agent；它必须是确定性脚本。
- 未通过验收门（build/测试/Lighthouse/视觉diff/内容lint 全绿）禁止 deploy。
- 数据库 schema 变更、生产数据删除、权限/密钥改动 → 停下来问我。
- 不向 git 或日志写入任何密钥；Vercel/API key 走环境变量。

## 唯一真相 & 流程
- git 为唯一真相，一任务一分支；Claude Code review Codex 的 diff 后才 merge。
- 大任务用 workflow / ultracode 并行；/goal 的目标 = 验收门全绿。
- 每完成一个里程碑，写一条变更摘要到 /memory/changelog.md（供 AutoSci 取用）。

## 数据优先
- 分析结果一律写结构化记录到数据库，不写死在页面里；网站从库渲染。
- 每条记录必带 provenance / version / embedding / quality_signals。
- 内容质量门规则见 /specs/quality-gate.md，不过门不入库不发布。

## 验收门（DONE 的机器定义）
- pnpm build 通过、e2e 通过、Lighthouse 性能&可访问性 > 90、视觉回归在容差内、内容 lint 通过。
- 任一不过：保留上一版 + 告警，不部署。