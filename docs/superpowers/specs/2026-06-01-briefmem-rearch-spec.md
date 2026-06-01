# AI Brief → 自进化内容研究 Agent · 重构架构规范

> 状态：**设计稿（Phase 1 审计 + 全量映射设计）**。本轮不改业务代码，等你确认后按阶段实施。
> 参照：AutoSci（`../AutoSci-main`，只读参照，不作依赖）。
> 日期：2026-06-01。

---

## 0. 一句话结论

AI Brief 现在已经有了 AutoSci 的 **SciFlow 骨架**（`pipeline-kernel.mjs` 的 discover→evidence→evaluate→select→analyze→qaGate→publish→archive），也有了 **per-run 结构化存储**（SQLite：candidates/evidence/evals/analyses/qa_verdicts/runs）。

它**缺的**正好是 AutoSci 最值钱的三件东西：

1. **typed wiki memory（长期可复用知识图谱）** —— 现在只存"某一轮某篇内容的产物"，不存跨内容沉淀的 Concept / Method / Claim / Artifact / DesignPrinciple。
2. **schema-governed writes + 双层 Guard** —— 现在 schema 硬编码在 `db.mjs`，QA 是 per-analysis 的，没有一个独立的"契约 YAML + 确定性 lint + reviewer"质量闸门。
3. **active memory + self-evolution** —— 没有 `context_brief` / `open_questions`（gap map），所以没有 memory-aware selection、gap-driven discovery、UserTaste 更新这套自进化回路。

所以这次重构：**保留 BriefFlow 骨架（pipeline-kernel 可复用），但记忆层彻底照搬 AutoSci 重建** —— 长出 BriefMem（typed wiki 记忆）+ BriefGuard（契约 YAML + 双层闸门）+ BriefEvolve（派生 active memory + 自进化回路），先在 papers 上跑通，再推广到 projects/podcasts/models。

### ⚠️ 方向裁定（2026-06-01 Kevin 拍板，覆盖本文初稿的"hybrid 保留"推荐）

1. **存储忠实照搬 AutoSci**：建一个 AutoSci 式的 typed 知识库（entity 文件 frontmatter+body + `graph/*.jsonl` 类型化边 + `schema/*.yaml` 契约 + loader + lint + append-only log），作为可复用、自进化的长期记忆。Kevin 判断 AutoSci 与本项目"相关性、目的性高度相似"，直接套结构。
2. **彻底删除旧记忆模型**：`data/agent-memory/*.json` 这套 per-run 记忆**整体废弃**，不再迁移、不再兼容。
3. **papers 先行**：先在 papers 上长出完整 BriefMem，跑通后复制到其他内容类型。
4. **schema 用 YAML**：忠实对标 AutoSci 的 `entities.yaml/edges.yaml/xref.yaml`。
5. **前端 deep dive 不变**：React 读由 wiki 编译出的 `public/data/*.json`。

---

## 1. AutoSci 架构审计结果

> 读的是 `main`（lean）分支快照；论文里的 SciMem/SciFlow/SciDAG/SciEvolve 模块在 `paper` 分支，本地快照没有，但**核心记忆架构在 main 上完整可见**。

### 1.1 它如何组织长期记忆？—— typed wiki memory

`wiki/` 是产品面，按实体类型分目录，每个实体一个 markdown 文件：

```
wiki/
├── index.md          # 全量目录（每个 entity kind 一个 YAML key，下面挂 - slug:）
├── log.md            # append-only 审计日志，语法 "## [{date}] {skill} | {details}"
├── papers/ concepts/ topics/ people/ ideas/ experiments/ methods/ foundations/ Summary/
└── graph/            # 派生层，只能经 tools/ 写
    ├── edges.jsonl          # 类型化语义边
    ├── citations.jsonl      # 文献引用边
    ├── context_brief.md     # 派生：当前研究语境摘要（active memory）
    └── open_questions.md    # 派生：Gap Map（所有 open question 汇总）
```

每个实体页 = **YAML frontmatter（结构化字段）+ markdown body（分节叙事）**。frontmatter 字段由 `runtime/schema/entities.yaml` 定义，body 分节由 `runtime/templates/{kind}.md.tmpl` 定义。

**关键设计：记忆不是只存 final 文本。** frontmatter 存可查询的类型化字段（importance/maturity/status/tags/链接列表），body 存人读的叙事，`graph/` 存可遍历的类型化关系。三层分离。

### 1.2 它如何组织当前任务状态？—— stage state via lifecycle enum

AutoSci 没有一个全局"任务状态机文件"，而是把状态**编码进实体的 enum 字段 + lifecycle 转移表**：

```yaml
ideas:
  status: { enum: [proposed, in_progress, tested, validated, failed] }
  lifecycle:
    transitions: { proposed: [in_progress], in_progress: [tested], tested: [validated, failed] }
experiments:
  status: { enum: [planned, running, completed, abandoned] }
  lifecycle:
    transitions: { planned: [running], running: [completed, abandoned] }
```

`research_wiki.py transition` 校验转移合法性。**状态是数据，不是脚本变量** —— 任何 skill 重新进入都能从 frontmatter 读出"这条 idea 走到哪一步了"。`.checkpoints/` 仅用于并行 ingest 的 handoff。

### 1.3 它有哪些 skill / command？

30+ slash command，按生命周期分相（Setup / Knowledge Base / Ideation & Experiments / Writing）。和 AI Brief 相关的核心：

| Skill | 职责 | 对 AI Brief 的启发 |
|---|---|---|
| `/ingest` | 一篇 paper → 全套 wiki 页 + 边 + 反向链接 | = BriefMem 写入主力（evidence-pack + memory-write） |
| `/discover` | 锚点/主题/会场/wiki-state 驱动的候选排序，**不入库** | = BriefDiscover + BriefRank（memory-aware） |
| `/check` | 全 wiki 扫描，分级修复报告 | = BriefGuard 的 reviewer 层 |
| `/daily-arxiv` | 定时拉取 + 按 wiki 兴趣排序 + 邮件摘要 | = BriefWeekly + scheduler |
| `/review` | 跨模型独立评审任意产物 | = BriefGuard 的二审 |
| `/ask` | 检索 + 综合 wiki，可把答案结晶回 wiki | = memory search + crystallize |

### 1.4 每个 skill 如何读写 memory？—— SKILL.md 的"Wiki Interaction"契约

每个 `SKILL.md` 都有一个**显式声明的 Reads / Writes / Graph edges created** 段（见 `/ingest` 第 32-68 行）。这不是注释，是**契约**：skill 作者和 agent 都按它行事。配套硬规则（CLAUDE.md "Hard Rules"）：

1. `raw/{papers,notes,web}` 用户拥有、只读；skill 只能 append 到 `raw/discovered/` `raw/tmp/`。
2. `wiki/graph/` 派生，只能经 `tools/research_wiki.py`（`add-edge`/`add-citation`/`rebuild-*`）写。
3. `wiki/log.md` append-only，永不原地重写。
4. **写前向链接必同时写反向链接**（双向不变量，规则在 `xref.yaml`）。
5. 用户拥有的 skill flag 不许 agent 擅自翻转。

### 1.5 它如何做 quality gate / trust guard？—— 双层

**A 层 · 确定性 lint（`tools/lint.py`）** —— 纯结构检查，schema 驱动，可 `--fix`：
- 断链 `[[slug]]`、孤儿页、缺必填字段、enum/range 越界、`required_when`（如 status=failed 必须有 failure_reason）、**xref 反向链接缺失**、graph 边的 from/to 节点存在性、边类型合法性、边必须带 confidence+evidence。
- 输出分级 🔴🔴/🟡/🔵，幂等。

**B 层 · reviewer（`/check` Step 6 + `/review` 跨模型）** —— 需要读内容的判断：近重复概念/方法检测、矛盾陈述、novelty 分数与论证强度是否匹配、SOTA 过期、高优先级 idea 卡在 proposed。

关键：**A 层是机器能判的形式/事实底线，B 层是要读内容的质量判断，报告里明确标注每条来源。**

### 1.6 它如何让系统自我进化？

- **派生 active memory**：每次 `/ingest` 后 `rebuild-context-brief` + `rebuild-open-questions`，把散落在各页 `## Open questions` / `## Open problems` 的 bullet 汇总成 `graph/open_questions.md`（Gap Map）。
- **gap-driven discovery**：`/discover` 可以 `--from wiki-state`，即读 Gap Map 反向找论文。
- **memory-aware ranking**：`/discover` 排序时对照已有 wiki（topic/concept/method）算相关度，而不是裸排。
- **dedup-as-evolution**：`/ingest` 写入前先 `find-similar-concept`，优先 merge 进已有页（extends），而非新建 —— 记忆是收敛的，不是膨胀的。
- **schema 即语言**：加新实体/字段/边只改 YAML，0 行 Python（`runtime/CLAUDE.md`）。系统的"本体论"可演化。

### 1.7 哪些可迁移到 AI Brief

| AutoSci 设计 | 迁移价值 | 落点 |
|---|---|---|
| typed wiki memory（frontmatter+body+graph 三层） | ⭐⭐⭐ 最核心 | BriefMem |
| schema-as-contract YAML（entities/edges/xref/conventions/writers） | ⭐⭐⭐ | BriefMem schema |
| 双向链接不变量 + 派生 graph | ⭐⭐⭐ | BriefGraph |
| 确定性 lint + reviewer 双层 guard | ⭐⭐⭐ | BriefGuard |
| 派生 active memory（context_brief / open_questions） | ⭐⭐⭐ | BriefEvolve |
| SKILL.md 的 Reads/Writes 显式契约 | ⭐⭐ | BriefSkills |
| dedup-before-create（merge/extends 决策） | ⭐⭐ | memory-aware selection |
| append-only log | ⭐⭐ | 审计 |
| lifecycle enum + transition 校验 | ⭐⭐ | ContentItem.status |
| 用户拥有 / 工具拥有 / append-only 的所有权分区 | ⭐ | 数据治理 |

### 1.8 哪些不适合直接照搬

- **Python + 文件系统 wiki**：AI Brief 是 Node/TS + Vite + SQLite + 静态前端。**照搬 markdown-wiki 会和现有 SQLite 管线打架。** → 取其"typed + 契约 + 派生图"的**思想**，落到 SQLite 表 + JSON 镜像，而不是建一堆 .md。
- **科研生命周期 skill（ideate/exp-run/rebuttal/paper-draft）**：AI Brief 不做实验、不写论文。砍掉。
- **arXiv/S2/OpenReview 之外的科研专用 fetcher**：AI Brief 要的是 GitHub/HF/RSS/podcast 多源，AutoSci 的 fetcher 只能部分复用思想。
- **30+ skill 的颗粒度**：对单用户每周一次的节奏太重。AI Brief 收敛到 ~12 个 BriefSkills + 1 个编排。
- **markdown frontmatter 作为唯一真相**：AI Brief 已用 SQLite 当真相、JSON 当前端镜像，应延续，不引入第三套真相。

---

## 2. AutoSci → AI Brief 映射方案

| AutoSci | AI Brief | 现状 | 差距 |
|---|---|---|---|
| SciMem（typed wiki） | **BriefMem** | 部分：SQLite 存 per-run 产物 | 缺跨内容的 typed 知识实体 |
| SciFlow（阶段流程） | **BriefFlow** | ✅ `pipeline-kernel.mjs` 已有 8 阶段 | 缺 source-pack / memory-write / weekly-select 阶段 |
| SciDAG（算子图） | **BriefDAG** | 部分：column module 的方法即算子 | 缺显式 DAG 描述 + 定点重跑（repair 单算子） |
| SciEvolve | **BriefEvolve** | ❌ 仅 `reusablePatterns` 雏形 | 缺 context_brief/gap map/UserTaste/taste-update |
| Trust Guard | **BriefGuard** | 部分：qaGate + validate-*.mjs | 缺 typed-memory 上的确定性 lint + reviewer 双层 |
| skills/slash | **BriefSkills** | 部分：npm scripts（papers:discover 等） | 升级为显式契约 skill |
| wiki memory | **BriefWiki/BriefGraph** | ❌ | 新建 typed 实体表 + 类型化边表 |
| active memory | active artifacts | ❌ | 新建 context_brief + gap map 派生 |

**核心映射决策（已按 Kevin 裁定更新）**：

- BriefMem 落点 = **AutoSci 式 `brief-wiki/` typed 记忆**（entity 文件 + `graph/` + schema YAML），**不再用 SQLite 当记忆真相**；前端读由 wiki 编译的 JSON。
- schema-as-contract = `scripts/brief/schema/*.yaml` + `loader.mjs`，对标 `runtime/loader.py`。
- 类型化边 = `brief-wiki/graph/edges.jsonl`（from/to/type/confidence/evidence），对标 AutoSci。
- active memory = 派生 `brief-wiki/graph/{context-brief.md, gap-map.md}` → 编译进前端 JSON。
- **旧 `data/agent-memory/*.json` 删除**；旧 SQLite per-run 表（db.mjs）保留给 BriefFlow 跑批的临时态，但**不再是长期记忆真相**。

---

## 3. 新 Memory Schema（BriefMem）

> **落地形态（AutoSci-faithful，已按 Kevin 裁定改）**：
> - 真相 = `brief-wiki/` 下每实体一个文件（YAML frontmatter + markdown body，对标 AutoSci `wiki/`）。
> - 类型化边 + 派生 active memory = `brief-wiki/graph/{edges.jsonl, context-brief.md, gap-map.md}`，只能经 `scripts/brief/wiki.mjs` 写。
> - 契约 = `scripts/brief/schema/{entities,edges,xref,conventions}.yaml` + `loader.mjs`（对标 `runtime/loader.py`）。
> - append-only `brief-wiki/log.md`。
> - 前端镜像 = build 步骤把 `brief-wiki/` 编译成 `public/data/*.json` 供 React 读。
> 所有"链接"字段存 slug/id，反向链接由写入器同步、由 lint 校验（双向不变量）。**旧 `data/agent-memory/*.json` 整体删除，不迁移。**

### 3.1 实体清单与关系

```
ContentItem ──(has)── SourcePack ──(feeds)── EvidencePack ──(feeds)── DeepDive
     │                                              │
     │ extracts                                     │ extracts
     ▼                                              ▼
  Concept / Method / SystemComponent / Claim / Evidence / Artifact / DesignPrinciple
     │
  (cross-content typed edges: duplicate/extends/contradicts/fills_gap/uses/...)

UserTaste（单例）── 影响 rank/select
```

### 3.2 字段定义（精简版，完整版进 entities.yaml）

**ContentItem**（统一 paper|project|model|podcast|blog|tool）
`id, type, title, source, url, authorsOrCreators[], date, discoveredAt, contentTrack, status(enum: discovered|shortlisted|source_packed|evidence_packed|deep_dived|archived|watchlisted), whyDiscovered, whySelected, whyRejected, relationToExistingMemory(enum: duplicate|extends_existing|contradicts_existing|fills_gap|creates_new_track), tags[]`
- lifecycle.transitions: `discovered→[shortlisted,archived,watchlisted]; shortlisted→[source_packed,archived]; source_packed→[evidence_packed]; evidence_packed→[deep_dived]; deep_dived→[archived]; watchlisted→[shortlisted,archived]`

**SourcePack** `contentId, fetchedMaterials{abs,pdf,html,appendix,repo,readme,docs,website,transcript,releaseNotes,benchmarkPage}, primarySources[], discoverySources[], sourceReliability, missingSources[], lastChecked`
- Guard 不变量：discoverySource 不得当 primarySource 用。

**EvidencePack**（deep dive 质量核心）`contentId, technicalObjects[], pipelineSteps[], experiments[], claims[], artifacts[], metrics[], baselines[], failureModes[], missingDetails[], sourcePointers[]`
- 每个 `technicalObject`：`name, type(component|method|model|dataset|benchmark|tool|API|memory|evaluator|planner|retriever|router|sandbox|schema), input, output, role, internalLogic, failureMode, sourcePointer`

**DeepDive** `contentId, originalTechnicalReading, architectureReconstruction, mechanisms[], technicalHighlights[], technicalDefects[], claimLedger[], evidenceMatrix[], artifactAudit, aiAfterAnalysis, qualityReport`

**Concept** `name, explanation, firstSeenIn(contentId), relatedContent[], relatedConcepts[], commonMisunderstandings[], examples[], openQuestions[]`

**Method/Mechanism** `name, problemSolved, naiveBaseline, howItWorks, input, output, tradeoff, evidenceStrength, usedByContent[], reusablePattern`

**SystemComponent** `name, role, input, output, internalLogic, failureModes[], seenIn[], replaceableBy[], designNotes`

**Claim** `text, contentId, sourcePointer, evidenceStrength, supports[], contradicts[], openChallenges[], status`

**Evidence** `contentId, experimentOrCase, dataset, baseline, metric, result, exactness, sampleSize, limitations, sourcePointer`

**Artifact** `contentId, artifactType, url, officialOrThirdParty, status, license, runnable, missingParts[], lastChecked`

**DesignPrinciple** `principle, derivedFrom[], examples[], counterExamples[], whenToUse, whenNotToUse, confidence`

**UserTaste**（单例）`likes[], dislikes[], preferredTracks[], skippedTracks[], preferredDepth, preferredOutputStyle, lastUpdated`
- 种子值（来自你的偏好）：likes = [系统架构, 技术机制, 技术高光, 设计取舍, 证据严谨, 可复用模式]；dislikes = [浅摘要, 职业包装, 通用 checklist, 未验证 ROI, 只说用了 RAG/LLM/Agent, 空泛概括]；preferredDepth = 每周主读1+备读1-2+观察3-5。

### 3.3 类型化边（BriefGraph，存 `edges` 表）

`{from, to, type, confidence(high|medium|low), evidence, createdAt}`
边类型：`duplicate_of, extends, contradicts, fills_gap, uses_method, realizes_concept, has_component, supports_claim, refutes_claim, evidences, derived_from, same_track_as`
- 与 AutoSci 一致：语义边必带 confidence+evidence；symmetric 边排序存一次；写前向必写反向（或在派生边表里双向投影）。

---

## 4. BriefFlow 工作流 + BriefSkills

> 复用 `pipeline-kernel.mjs`，把现有 8 阶段补成 12 阶段。每阶段一个 skill，每个 skill 一份显式 Reads/Writes 契约（仿 SKILL.md）。

| # | 阶段 | Skill | input | output | reads mem | writes mem | quality check | failure mode |
|---|---|---|---|---|---|---|---|---|
| 1 | discover | `/brief-discover` | sources, userTaste, gapMap | candidate ContentItem[] | UserTaste, gap-map, 已有 ContentItem(dedupe) | ContentItem(status=discovered) | 源可达、去重 | 源超时→跳过并记 |
| 2 | rank | `/brief-rank` | candidates | shortlist + relationToExistingMemory | Concept/Method/DesignPrinciple/gap-map | ContentItem.whySelected/whyRejected/relationTo... | 必须给 relationToExistingMemory | 全部低分→空周报 |
| 3 | source-pack | `/brief-source-pack` | shortlist | SourcePack | — | SourcePack | primary≠discovery、missing 标注 | 抓取失败→missingSources |
| 4 | evidence-pack | `/brief-evidence-pack` | SourcePack | EvidencePack | — | EvidencePack | 每个 technicalObject 有 in/out/sourcePointer | 文本不足→missingDetails |
| 5 | technical-reading | `/brief-technical-reading` | EvidencePack | DeepDive.originalTechnicalReading | — | DeepDive(部分) | 有 technicalObject、非普通摘要 | — |
| 6 | architecture | `/brief-architecture` | EvidencePack | DeepDive.architectureReconstruction | SystemComponent | DeepDive + SystemComponent | 组件有 in/out | 非系统论文→改 taxonomy/conceptual |
| 7 | mechanism | `/brief-mechanism` | EvidencePack | DeepDive.mechanisms | Method | DeepDive + Method | naiveBaseline+优势+代价齐 | — |
| 8 | critique | `/brief-critique` | EvidencePack+DeepDive | highlights/defects/claimLedger/evidenceMatrix | Claim/Evidence | DeepDive + Claim + Evidence | highlight 必须 paper-specific | — |
| 8b | artifact-audit | `/brief-artifact-audit` | SourcePack | DeepDive.artifactAudit | Artifact | DeepDive + Artifact | repo 可达≠可复现 | 链接断→标 broken |
| 9 | guard | `/brief-guard` | DeepDive + 全 mem | pass/warn/block + repairInstruction | 全部 | qualityReport | 见 §5 | block→不发布 |
| 10 | repair | `/brief-repair` | repairInstruction | 重跑失败算子 | 失败模块输入 | 覆盖失败模块输出 | 只修失败模块 | 二次 block→人工 |
| 11 | memory-write | `/brief-memory-write` | DeepDive | Concept/Method/Claim/Evidence/Artifact/DesignPrinciple + edges | dedup 目标 | 上述实体 + 双向边 + log | dedup-before-create、写反向边 | 冲突→记 contradicts |
| 12 | weekly-select | `/brief-weekly` | 全 mem | 主读1/备读1-2/观察3-5 | UserTaste, ContentItem, gap-map | weekly digest + 更新 watchlist | 量不超限 | — |

补充工具型 skill：`/brief-memory` (search/ask)、`/brief-evolve`（重建 context_brief + gap-map + taste-update + artifact-recheck）。

**编排**：`/brief-run`（= 现有 `papers-radar.mjs run` 升级），按 DAG 顺序跑，guard block 则触发 repair 再 guard。

---

## 5. BriefGuard 质量闸门

### A 层 · 确定性 lint（`scripts/brief/lint.mjs`，schema 驱动，对标 lint.py）

- ❌ discoverySource 当 primary evidence
- ❌ referenced repo 当 official repo
- ❌ repo reachable 自动判定 reproducible
- ❌ 数字无 sourcePointer
- ❌ missingSource + high evidenceStrength 共存
- ❌ 出现 "not specified in fetched text" 类占位
- ❌ unsupported ROI（有 ROI 数字无 sourcePointer/baseline）
- ❌ 空泛句（"用了 RAG 提升性能" 但无 mechanism/in-out/evidence/tradeoff）→ 低密度 warn
- ❌ DeepDive 无 artifactAudit
- ❌ DeepDive 只有 final 文本、未写 structured memory（无对应 EvidencePack/Concept/Method 实体）
- 通用结构：断链、缺必填、enum 越界、**反向边缺失**、边 from/to 节点存在性

### B 层 · reviewer（`/brief-guard` LLM + 可选跨模型）

- 技术带读有无 technicalObject？架构复原组件有无 in/out？机制讲清 naiveBaseline/优势/代价？高光是否 paper-specific？缺陷是否影响架构/复现/结论？evidenceMatrix 是否支撑 claimLedger？artifactAudit 是否诚实？有无可复用 DesignPrinciple 写入？

**输出**：`pass | warn | block`。block → 不发布 + 生成 `repairInstruction`（指明失败算子）+ 只修失败模块（`/brief-repair`），不全文重写。

---

## 6. 后端数据收集架构

```
schedulers (GitHub Actions cron, 复用 daily-arxiv 模式)
   │
collectors ──┬─ papers:  arXiv / OpenReview / ACL Anthology
             ├─ projects: GitHub trending / repo / README / docs
             ├─ models:   Hugging Face / model card / release notes / benchmark page
             ├─ podcasts: RSS / show notes / transcript (YouTube meta if available)
             └─ blogs:    engineering blog RSS / official docs
   │
parsers → source fetchers → evidence-pack builder → deep-dive generator
   │                                                      │
rankers (memory-aware) ── reads BriefMem ── guard/repair loop ── memory writers
   │
weekly selector → public/data/*.json (前端镜像)

Storage:
  SQLite (真相): content_items, source_packs, evidence_packs, deep_dives,
                 concepts, methods, system_components, claims, evidence,
                 artifacts, design_principles, user_taste, edges, runs, log
  JSON 镜像 (前端): public/data/{weekly,library,deep-dive,graph,watchlist,
                 artifacts,source-reliability,context-brief,gap-map}.json
  Vector index (可选, Phase 后期): 相似内容召回
```

延续现有 `scripts/lib/{db,llm,agentic-pipeline}.mjs`；新增 `scripts/brief/{schema,loader,lint,memory-write,evolve}.mjs`。

---

## 7. 前端页面结构

复用现有 React + Vite + 纯 CSS（Articles.tsx 模式，非 Detail.tsx）。

1. **Weekly Dashboard**（首页）：主读1 / 备读1-2 / 观察3-5，每条带 why。
2. **Content Library**：全 ContentItem 列表，按 type/track/status 筛。
3. **Deep Dive Page**：§7 的 11 段技术深读结构（Source&Materials → 技术带读 → 渐进术语 → 架构复原 → 机制 → 高光 → 缺陷 → Claim Ledger → Evidence Matrix → Artifact Audit → AI 后分析）。复用 iteration-2 已建的 verdict bar / claim ledger / evidence matrix / artifact audit / sticky TOC 组件。
4. **Memory Graph View**：content↔concept↔method↔claim↔artifact 关系图（对标 AutoSci serve.py 的 graph 视图）。
5. **Watchlist**：等代码/等 benchmark/等后续论文/找同方向。
6. **Artifact Status Tracker**：repo/data/eval/license/demo 状态 + lastChecked。
7. **Source Reliability Panel**：primary vs discovery 来源可靠度。
8. **Memory Search**：跨记忆检索（对标 `/ask`）。

Deep Dive 只做技术深读：**不要职业包装、面试故事、简历建议**（你的 dislikes，已写入 UserTaste 种子）。

---

## 8. 自我进化机制（BriefEvolve）

1. **memory-aware selection**：rank 阶段强制产出 `relationToExistingMemory` ∈ {duplicate, extends_existing, contradicts_existing, fills_gap, creates_new_track}。
2. **taste update**：`/brief-evolve` 读"读了/跳过/收藏/评价好坏"信号更新 UserTaste（前端埋点 → JSON → 回写）。
3. **design principle extraction**：memory-write 从 DeepDive 抽 DesignPrinciple（升级现有 `reusablePatterns`）。
4. **artifact recheck**：定时重扫 paper-only / release-on-hold 的 repo 是否更新（Artifact.lastChecked）。
5. **watchlist**：ContentItem.status=watchlisted 的维护。
6. **gap-driven discovery**：discover 读 `gap-map.json`（由各 DeepDive.openQuestions/Concept.openQuestions 派生）反向找内容。种子 open questions：agent memory 哪种架构更可靠 / MCP 工具成功率瓶颈 / LLM-as-Judge 校准 / benchmark audit 是否改 leaderboard / research agent 长期状态。
7. **weekly compression**：每周只输出少量，其余沉淀后台记忆。

---

## 9. 分阶段实施计划

> 不一次性大改。每个 Phase 独立可验证、可回滚。

- **Phase 1 · 审计 + 设计**（本文档）—— ✅ 本轮完成。
- **Phase 2 · Memory schema（AutoSci-faithful）**：
  - 删除旧记忆模型（见 §10 删除清单）。
  - 写 `scripts/brief/schema/{entities,edges,xref,conventions}.yaml` + `loader.mjs`（对标 runtime/loader.py）。
  - 建 `brief-wiki/` 骨架（papers 相关实体目录 + `graph/` + `log.md` + `index.md`）+ 每实体 body 模板。
  - 写 `scripts/brief/wiki.mjs`（对标 research_wiki.py：slug / set-meta / add-edge / log / rebuild-context-brief / rebuild-gap-map）。
  - 建 build 步骤：`brief-wiki/` → `public/data/*.json`。
  - 单测：schema 往返 + 双向边不变量 + lint。
- **Phase 3 · Evidence Pack 管线**：实现 source-pack + evidence-pack（technicalObject/pipeline/claim/evidence/artifact 抽取），先不追求 UI。
- **Phase 4 · BriefGuard**：A 层 lint（先做 missing-source-high-evidence block、低密度 warn、artifact-status checker）+ B 层 reviewer 接 qaGate。
- **Phase 5 · Deep Dive generator**：基于 EvidencePack 生成 11 段深读，禁止从原文直跳 final。
- **Phase 6 · Memory write**：抽 Concept/Method/DesignPrinciple + 双向边 + log；dedup-before-create。
- **Phase 7 · Weekly selector**：主读1/备读1-2/观察3-5 + context_brief/gap-map 派生。
- **Phase 8 · Frontend**：weekly dashboard / deep dive / memory graph / watchlist / artifact tracker。

依赖顺序：2→3→(4∥5)→6→7→8。

---

## 10. 本轮实际修改的文件

- **新增** `docs/superpowers/specs/2026-06-01-briefmem-rearch-spec.md`（本文档）。
- **未改动任何业务代码**（遵循"审计先行、分阶段、不一次性大改"）。

---

## 11. 如何运行 / 验证 / 未完成

**验证本轮**：阅读本文档；现有管线不受影响，`npm run verify` 应仍通过（未动代码）。

**决策点（2026-06-01 已拍板）**：
1. schema 契约 = **YAML**（忠实对标 AutoSci）。✅
2. 统一策略 = **papers 先行**，跑通再推广。✅
3. 长期记忆真相 = **AutoSci 式 `brief-wiki/` typed 记忆**（非 SQLite hybrid）；旧 `data/agent-memory/*.json` 删除。✅

**未完成**：Phase 2-8 全部实现；vector index；前端 7 个新页面；scheduler 接入；taste 埋点。

---

## 附：与现有资产的衔接（不要重造）

- BriefFlow ← `scripts/lib/pipeline-kernel.mjs`（已有 8 阶段，补 4 阶段即可）。
- BriefMem 真相 ← `scripts/lib/db.mjs`（已有 candidates/evidence/evals/analyses/qa_verdicts/runs，**这就是 ContentItem+SourcePack 雏形+EvidencePack 雏形+Eval+DeepDive 雏形+QA**，扩表即可）。
- BriefGuard A 层 ← `scripts/lint.mjs` + `scripts/validate-*.mjs`（已有 JSON 校验，升级为 typed-memory lint）。
- DesignPrinciple ← `data/agent-memory/*.json` 的 `reusablePatterns`（已有雏形）。
- Deep Dive 前端 ← iteration-2 已建的 verdict/claim-ledger/evidence-matrix/artifact-audit/falsification 组件（commit 334b4ad）。
