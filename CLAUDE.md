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

## Code intelligence (codegraph)
A local pre-indexed **code knowledge graph** (`@colbymchenry/codegraph`, MIT, 100% local SQLite at `.codegraph/codegraph.db`, no API keys) is installed globally and registered as an MCP server into Claude Code / Codex / etc. **Use it to navigate THIS codebase instead of blind grep** — symbol search, call graph, change-impact.
- **MCP (for agents):** the agent auto-starts it on boot (`codegraph serve --mcp`) — there is no daemon to run, just **restart the agent** to load the tools. Reach for it first for "who calls X / what breaks if I change X / where is symbol Y".
- **CLI (terminal, anytime):** `codegraph query <name>` · `callers <sym>` / `callees <sym>` · `impact <sym>` · `status` · `sync`.
- **Keep fresh:** run `codegraph sync` after sizeable edits (incremental reindex). The `.codegraph/` DB is git-ignored (local per machine) — **never commit it**.

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

## 自主执行 & 审核边界（Kevin 2026-06-07）
- **不等 Kevin 逐个回复**：连续推进任务，不在每个小修/小任务后停下等审核；非 🔴 的连续做完。
- 只在两种情况停下找 Kevin：① **产品方向决策**（红线 🔴：schema / 删除 / 密钥 / 上线策略；或范式·方向的选择）；② 工作推进到一个 **Kevin 能从产品（渲染前端 / live 站）亲自看到的结果**——到此交给他自审。
- 小 bug **连续修完**再汇报；汇报只讲**从产品角度解决了什么**（例「现在其它日期的论文数不再是 1 了」），**不讲**代码/技术 diff、**不附截图**——Kevin 自己去产品里查。
- 已上线的可继续迭代上线；多任务**不冲突就并行**跑（子 agent + codex），并发写用 git worktree 隔离。**文字生成相关由 Claude 做**，后端工程交 codex。

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

## 论文深读 & AutoSci 语料架构（2026-06-04 定，Kevin 决策）
- **论文来源只用 HuggingFace**：`hf papers ls --date/--week/--month --sort publishedAt`（trending 排序是全局的、忽略窗口，不可用）→ 本地按 upvotes 重排。`--limit` 上限 100。
- **策展管线确定性**：`scripts/columns/papers/{hf-source,ledger,curate}.mjs`。账本 `data/papers/ledger.jsonl`，arxiv_id 主键去重；`deep_read/analyzed/published` 状态的论文不再作为新候选。**只选高赞高收藏**，当日无高赞/全重复则当日空着，不硬凑。评分用 DeepSeek（便宜层）跑 8 维 rubric；**深读由强模型（Claude）读全文写**。
- **受众分离（核心）**：人读语料 `content/papers/{id}-{slug}/` = `paper.mdx` + `career.mdx` + `metadata.json`（Kevin 只读 Paper 理解 + Career 职业两 tab）。**AutoSci 自进化语料是 AI-only**，单独存 `data/autosci/primitives/{id}.{yaml,md}`，不进 Kevin 的 tab。
- **内容即语料**：用轻量 markdown（`.mdx` 文件名，**不上 true MDX 工具链**），架构图用 **Mermaid 源码块**（文本，AI 可读；前端懒加载渲染）。
- **调和"从库渲染"红线**：文件是人读产物，但 `metadata.json` + AutoSci primitives **聚合成索引**（`public/data/papers-index.json` 等）供列表/排序/去重/查询/前端渲染——不直接从散文渲染。
- **生成正确性门（lint）**：每篇产出的 markdown/JSON/YAML/Mermaid 必须过 lint 校验，不过门不入库不发布（接 `npm run validate`）。
- **项目→AutoSci（C）**：项目排名规则改为**月榜前 10（按 star）默认 deep-dive**；项目原语**按 project_type 选择性抽取**——skill / 教学类不抽或少抽，架构型（如 finance agent）抽底层架构。
- **eval/goal**：`scripts/eval-redesign.mjs` 是三栏改造的机器 DONE 定义，目标=全绿。

## Harness 治理（2026-06-09 Kevin 定，结构化调度全套）
本项目=长期每日更新知识库+自进化+研究 agent，按 CMU+腾讯《Harness 工程化》落**完整结构化调度**。Claude 与 Codex 同等。
- **底线**：[RULES.md](./RULES.md) §工作流红线（#11–17）——>100 行先写 plan、不自审、只三种停、可运行交付、子 agent 四件套。
- **角色**：[docs/agents/README.md](./docs/agents/README.md) = 7 角色契约 + 模型分层 + 硬边界 + §编排决策。
- **接力**：[docs/workflow/](./docs/workflow/)（人 .md + AI .yaml）。**态势/进度**：[task-board.md](./task-board.md)。**plan 模板**：`docs/plans/_TEMPLATE.md`。
- **编排决策（研究 CMU+腾讯/LangGraph/CrewAI/AutoGen 四家后定）**：① 开发期多 agent（建造/审计/研究）= Claude sub-agent + dynamic workflow + codex，**采纳 AutoGen reflection / CrewAI 角色+记忆 的模式，不引库**（我们 agent 是订阅 CLI 非 API model-client；harness 本身即运行时）；② **每日管线 = 真上 LangGraph (Python)**（管线=带条件门+有界循环的状态图，要 checkpoint/断点续跑/可观测/HITL；手搓 .mjs 是挂起/timeout/静默发布 bug 根源）。
- **手册全文**：`C:\Users\Ykw18\OneDrive\Desktop\Study\yanfeng\agent harness\notes\harness-engineering`（CMU+腾讯）。