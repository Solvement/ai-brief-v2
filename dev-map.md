# AI Brief · dev-map（开发导航）

不是百科，是**从哪进门**的索引。谁改地貌谁更新这里。配套：[SPEC.md](./SPEC.md)、[RULES.md](./RULES.md)。

## 一句话技术栈

本地优先 MVP：Vite + React + TypeScript（前端） + Node 脚本（管线） + 静态 JSON 数据契约。无后端服务；后端评估管线使用本地 SQLite（`data/ai-brief.db`）作为发布前中间层。

## 前端（Claude 的活）

```
src/
├── App.tsx          # 极简 hash 路由（#/projects、#/repo/:owner/:name、#/models、#/articles…）
├── main.tsx         # 入口
├── types.ts         # 数据契约。改 JSON 形状前先改这里
├── styles.css        # 单文件全站样式。★B 魂在 :root 调色板 + 文件末尾 "B Focus Console 覆盖块"
├── lib/data.ts      # 从 public/data/*.json 加载（带内存缓存）
├── components/      # RepoCard / SiteHeader / Markdown
└── pages/           # Home / Projects / Detail / Models / Articles
```

视觉改动落点：调色板/基调 → `styles.css` 的 `:root` 和末尾 B 覆盖块；某版块布局 → 对应 `pages/*.tsx` + 末尾覆盖块里该版块的类。

## 后端 / 管线（Codex 的活）

```
scripts/
├── ingest.mjs               # GitHub Trending → README → DeepSeek → trending.json
├── papers-radar.mjs         # AI Job Research Radar：discover/triage/review/daily/run
├── columns/papers/          # papers-radar 单一学术引擎；publish 产出 public/data/articles.json
├── kg/                      # Mind Palace / KG：build-brief-graph、integrate-kg、embed、concept-vocab
├── lib/{agentic-pipeline, github-trending, project-ranking, project-prompts}.mjs
├── validate-*.mjs           # 各数据契约 + 文本编码校验
└── lint.mjs
```

## 数据契约

```
public/data/   trending / models / articles / articles-archive / paper-radar / pipeline-status / news-health .json
data/          agent-memory/*.json、papers/*、knowledge-graph/*  （本地生成，不直接服务前端）
```

KG-2 / Mind Palace 入口（2026-06-10）：`npm run kg:build` = brief graph → facet integrate → concept vocab → local embeddings。v2 schema 门在 `scripts/validate-mind-palace.mjs`；概念词表生成在 `scripts/kg/concept-vocab.mjs`，输出 `data/knowledge-graph/concept-vocab.json`；facet 集成在 `scripts/kg/integrate-kg.mjs`，paper facet 按 `node_id` / `slug` / `arxiv_id` / `content/papers/<dir>` 合并或创建 paper 节点。

KG-3 / relation engine（2026-06-11）：`scripts/kg/relation-engine.mjs` 统一 typed 边规则：`same_use_case` 映射到 taxonomy 内 `complements`，`references` / `same_track` / `shares_tag` / `shares_concept` 标为 `layer:"mechanical"` + `hidden:true`，typed 边自动补 `use` 动作。`build-brief-graph.mjs` 与 `integrate-kg.mjs` 都在写图前调用同一 normalization；deterministic CI 路径用 facet 明示证据 + lexical/shared-core candidate top-K，不调用 LLM。DONE 机检为 `node scripts/eval-relation-engine.mjs`。

Mind Palace agent 使用层（2026-06-11）：复杂 agent / 记忆 / 预测 / 自进化 / 架构任务前先读 `docs/workflow/mind-palace-operating-contract.md`，再跑 `npm run kg:research -- "<问题>"`。实现落点是 `scripts/kg/research-loop.mjs`：hybrid(vector+BM25+RRF) 召回 → contest table → role coverage → gaps；**Synthesis/Evolution actions 由消费输出的 agent 产出，脚本不代写**（战略七层形态只在战略/预测类查询作为 hint 附带）。测试 `scripts/kg/research-loop.test.mjs`。它是 agent 自用的第二大脑入口，不是前端展示入口。

Self-evolution Loop C（2026-06-11）：消费侧 scaffold 在 `scripts/kg/self-evo.mjs`，入口队列 `data/knowledge-graph/self-evo-queue.jsonl`，导出 `validateCandidate` / `judgeCandidate` / `applyCandidate`；红线与不确定候选写 `self-evo-review.jsonl`，非红线 stronger 候选必须过 `npm run verify`（dry-run 用确定性桩）后才写 `self-evo-applied.jsonl`。测试 `scripts/kg/self-evo.test.mjs`。

## 验证

`npm run verify` = `lint && test && build`（`test` 已含 `validate`）。改数据形状 → 先改 `types.ts` + 对应 `validate-*`。

### Harness 观测/门禁工具 `scripts/ops/`（CMU 四块拼图补全，2026-06-11）
- `ops:harness` (`check-harness.mjs`)：workflow.yaml stage 完整性 + rollback 目标存在 + role 在 agents README + RULES/workflow/agents 跨文件引用不悬空 + task-board `交付结论` 证据门。硬错误 exit 1，软告警 exit 0；**已接进 `validate`**（即 `npm run verify` 会跑）。
- `ops:baseline` / `ops:baseline:diff` (`verify-baseline.mjs`)：大改前存 validate 套件基线，改后 diff 出**新增失败**的 validator（基线落 `.agent/verify-baseline.json`，gitignored）。自证"这不是我引入的"。
- `ops:tokens` (`token-usage-by-model.mjs`)：扫 `~/.claude/projects/**/*.jsonl` 按模型/天/会话聚合 token（含 avg/call），比模型耗用、定位烧 token 的会话。注意是 RAW token，订阅额度的模型权重倍率需用 `/usage` 前后实验测。

## Backend eval foundation (2026-05-29)

- `scripts/lib/db.mjs` owns the local SQLite schema/access layer for `candidates`, `evidence`, `evals`, `analyses`, `qa_verdicts`, and `runs`. Driver choice on this Windows machine: Node `v24.13.1`, so Chunk 1 uses built-in `node:sqlite`; no `better-sqlite3` dependency was added.
- `scripts/lib/llm.mjs` is the shared DeepSeek chat/JSON client used by `ingest.mjs` with the same flags, retry behavior, timeout, and JSON repair pass.
- `scripts/lib/pipeline-kernel.mjs` defines the formal ColumnModule runner for `discover -> evidence -> evaluate -> select -> analyze -> qaGate -> publish -> archive`. `scripts/lib/agentic-pipeline.mjs` keeps its old exports and re-exports the kernel helpers.
- `scripts/lib/qa-base.mjs` provides deterministic structural QA checks plus an opt-in LLM groundedness judge harness guarded by `AI_BRIEF_LLM_JUDGE=1`.

## "改某功能去哪"

- 项目栏内容/排序 → `ingest.mjs` + `lib/project-*`
- 项目栏 v2 管线（2026-06-11）→ `scripts/columns/projects/sources.mjs` 多源发现（GitHub Trending 三窗 + HN Algolia + GitHub Search 90d 增速补盲 + 可选 HF linked repo），`scripts/columns/projects/ledger.mjs` 统一 repo ledger（`data/projects/ledger.jsonl`，full_name 主键，`analyzed/deep_dived` 只跳过重复分析，当前 trending 仍复用展示），`scripts/columns/projects/project-ranking.mjs` 确定性 signal_score 分项与 deep/standard/light gate（public 仍用 `final_depth=analysis` 表示 standard，并加 `depth_band/analysis_depth`；AI 品类入榜不再降到 `list_only`），`scripts/columns/projects/evaluate.mjs` 负责 `project_type`（含 `agent_skill`）分类和 light 结果规范化，`scripts/columns/projects/project-facet.mjs` 项目 deep/standard Mind Palace 字段 precheck 与 `data/knowledge-graph/project-ingest-queue.jsonl` 入图队列。
- 项目栏展示复用（2026-06-11）→ ledger done 状态只防重复分析，不防展示：`filterNewProjectCandidates` 返回 `accepted` + `reuse`，`reuse` 标 `alreadyAnalyzed:true` 并由 `sources.mjs` 复用 ledger `analysis_file` / 上一版 `trending.json` / fallback light；`index.mjs::analyze` 对 reuse 返回 `reuse-cache` 不调 LLM。公开项目卡新增 `highlight?: string`（轻卡亮点/火点），`validate-trending` 对 present 字段校验非空。
- 模型栏 → `public/data/models.json`（当前手工策展）
- 文章/学术 → `papers-radar.mjs` + `columns/papers/`。papers-radar 是单一学术引擎；Articles surface 由 papers column publish 产出 `public/data/articles.json`；`refresh`-`articles` 已退役。
- 论文详情页发布门 → `app/papers/[slug]/page.tsx`。页面级路由也必须遵守 `cold_audit.status`：仅 legacy/`grandfathered`/`ready_to_publish` 可渲染，`needs_human`/`hold`/`audit_error` 不能靠直达 URL 上线。
- 任何视觉 → `styles.css`（:root + 末尾 B 覆盖块）+ 对应 page

## 旧 harness 去哪了

从零重建时，旧 `.ai/.jarvis/.omc/.superpowers` 移到了 gitignore 的 `_harness-archive-20260529/`（未销毁）；旧 SPEC/CONTEXT/docs 在 git 历史里。
