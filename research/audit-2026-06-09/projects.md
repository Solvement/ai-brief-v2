# 项目栏全链审计 — 2026-06-09

背景:模型栏漏 Anthropic Fable 5,根因两类系统病(①单源假设 ②历史规律硬编码成定义)。本报告按三病类体检项目栏全链脚本。

审计范围(实际脚本位置 `scripts/columns/projects/`):
- discover/enrich: `sources.mjs`(GitHub Trending 抓取 + api.github.com 富化 + 精英筛选 + HN/OSSInsight 跨站验证)
- rank/depth-gate: `project-ranking.mjs`(确定性分流/打分/深度门), `evaluate.mjs`
- analyze(Tier1 light): `prompts.mjs` + DeepSeek
- analyze(Tier2/3 deep): **`codex-deepdive.mjs` 的 `buildCodexAuthorPrompt` 是当前 live 路径**(codex GPT-5.5 high 读全仓);`deepdive-prompts.mjs`+`deepdive.mjs` 是旧 DeepSeek 深析路径(仍在但非 Tier3 主力)
- 落库: `brief-writer.mjs`, `autosci-primitives.mjs`
- canonical 范式: `docs/paradigms/projects.md`

---

## 病类 1:范式↔prompt 漂移(重点 — 已修)

### 1a. core_concepts 范式新标准件没接到 live 深读 prompt 【已修 — 真 bug】
- 范式(`docs/paradigms/projects.md:33`)今天把 **core_concepts** `{name, role:primary|supporting, evidence}` 列为 Tier 3 标准件,定位是「喂 Mind Palace 核心概念门 + paper↔project 判边的项目侧锚(KG-2)」。
- live Tier3 深读 prompt(`codex-deepdive.mjs:678-702`)的 schema **完全没有 core_concepts**。它只有:
  - `tier_template.key_claims_evidence`(= claim_ledger,含 supports/does_not_support/threat)✓ 范式另一个新标准件本来就在。
  - 顶层 `concepts[]`,但那是 **Mind Palace 概念卡形状**(`slug/explanation/tags/maturity/examples`),`brief-writer.mjs:80` 把它写成 concept .md 文件 + claim.supports 的 slug,**不是**范式要的承重锚 `{name, role, evidence}`。
- 证据:`Grep core_concepts scripts/columns/projects/**` → **零命中**。core_concepts 现仅存在于手写 KG facet YAML(`data/knowledge-graph/facets/*.yaml:57`)和范式文档,**每日项目深读不产出**。
- 后果(若不修):明天 6-10 跑出的每篇 Tier3 项目深读都没有 core_concepts → KG-2 的 paper↔project 判边失去项目侧锚 → 全语料回填(KG-2 切片③)拿不到项目侧承重概念,判边只能退回零边或靠人工补 facet。这与「明天用新配置跑」的目标直接冲突。
- **修法**(`codex-deepdive.mjs`):
  1. 在 prompt 的 `tier_template` schema 内加 `core_concepts: [{name, role, evidence}]`(line ~696)。
  2. Concreteness contract 加一条硬约束(line ~709):3-5 个承重概念、必须出现在真实 README/源码、evidence 逐字引原文+文件锚、用规范名(中文优先)做跨文件锚、营销词/buzzword 不算、找不到 3 个宁可少写不许凑。
  3. `brief-writer.mjs` `normalizeTierTemplate` 原本白名单字段会**丢弃** core_concepts;加 `normalizeCoreConcepts()` 保留 `{name, role, evidence}` 原始结构(空则返回 undefined,不污染非 Tier3 卡)。
- node --check: codex-deepdive OK / brief-writer OK;`codex-deepdive.test.mjs` 6/6 pass。

### 1b. 两条深析路径并存,schema 不一致(建议未动,非阻塞)
- `deepdive-prompts.mjs` 的 DeepSeek 路径 schema 有 `claim_ledger` + `concepts`,但**也没有 core_concepts**,且与 codex 路径字段名分叉(`comparison_table` vs `comparison.body_md` 等)。
- live Tier3 走 codex,所以 1a 的修复覆盖了真正出稿的路径。DeepSeek 路径若未来重新承担 Tier2 深析,需同步补 core_concepts。**建议**:长期把 schema 抽成单一共享常量(目前是两份内嵌副本,这正是「漂移」温床);本次为不扩大改动面,只修 live 路径。

### 1c. prompt 内嵌 vs 读范式文件
- 所有深读 prompt 都是**内嵌字符串**,不读 `docs/paradigms/projects.md`。范式一改,prompt 不会自动跟。这是结构性漂移源。
- 本次按「优先让脚本读范式文件;否则同步内嵌副本」中的**同步内嵌副本**处理(读范式文件需把 .md 解析成 schema,改动面大且范式文档是散文不是结构化 schema,不适合直接喂)。**建议**(未动):未来把 Tier3 schema 提成 `scripts/columns/projects/tier3-schema.mjs` 单一真相,prompt 与 validator 共用。

### 1d. Tier 分流关键词 vs 范式 — 一致 ✓
- 范式 §第一步资源类规则(`awesome-/-roadmap/-tutorial/books/100-days/interview` + `curated list/resources/roadmap/tutorial/cheat sheet` + 主语言 None/Markdown)。
- 代码 `project-ranking.mjs:34-35` `RESOURCE_NAME_RE`/`RESOURCE_DESC_RE` + `isResourceProject():527` 主语言 none/markdown 判定,**与范式一致**。无漂移。

---

## 病类 2:单源盲区

### 2a. 跨站验证信号 — 设计里有且已实装 ✓(好于模型栏)
- 项目栏**不是单源**。`sources.mjs` 的 `applyEliteSelection`/`collectExternalValidation`(line 341-393)已实装:
  - GitHub Trending(daily/weekly/monthly 三窗)
  - GitHub topic search(`SEARCH_TERMS`,默认 topicLimit=0 关着,可开)
  - **Hacker News**(`fetchHackerNewsRepoSignal:412`,阈值 50 分)
  - **OSSInsight trending**(`fetchOssInsightTrendingRepos:457`)
  - 精英门要求 `minSourceCount>=2`(`DEFAULT_ELITE_MIN_SOURCE_COUNT`),即必须≥2 个来源信号才入选。
- 结论:模型栏「单源」病在项目栏**结构上不存在**——多源 + 跨站验证是设计核心。这是项目栏比模型栏健壮的地方。

### 2b. trending 榜单覆盖假设 — 存在系统性盲区(建议未动,需 Kevin 决策)
- 真盲区:**新项目蹿红但还没进 github.com/trending 页**的,项目栏只能靠 topic search 兜,而 topic search 默认 `topicLimit=0`(`discover` 里 `if (topicLimit > 0)`,`sources.mjs:103`)→ **默认完全关闭**。所以当前等同「只信 trending 三榜 + 对已发现项的 HN/OSSInsight 验证」。
- 即 HN/OSSInsight 只用来**验证**已被 trending 发现的候选(`collectHackerNewsSignals` 遍历的是 `plausible` = 已过热度门的 trending 候选),**不用来发现** trending 没收的新项目。这正是 Fable 5 同类病:发现层仍是单入口(trending)。
- **建议**(🔴 涉及候选来源策略,留给 Kevin):① 把 OSSInsight trending / HN front-page 升为**发现源**(不止验证),与 trending 合并去重再进精英门;② 或开 `topicLimit`(如 5)让 agent/rag/mcp 等 topic search 补发现。本次未动(改发现源会改变每日候选构成,属方向决策)。

### 2c. enrich 字段假设 — 稳健 ✓
- `fetchArtifactAudit`(`sources.mjs:242`)用 repo metadata + git tree + releases/latest 三个 API,字段缺失统一 `not_found`,不脑补。README 抓取双分支(main/master)双文件名兜底。无硬假设问题。

---

## 病类 3:旧规律当定义

### 3a. 新项目形态(skill 包 / MCP server)会被旧规则误杀? — 局部风险
- **MCP server:安全 ✓**。`has_mcp`/`MCP_RE` 全链是加分信号(`scoreCanonicalProject`/`deepDiveEligibility` 的 `agent-infra` idea_type),不会误杀。
- **skill 包:有误杀风险**。`EXCLUDED_DEEP_IDENTITY_RE`(`project-ranking.mjs:36`)把 `skill|skills` 列入**深读排除名单**;`autosci-primitives.mjs:16-17` 的 `TEACHING_IDENTITY_RE`/`SKILL_PACK_RE` 也排 skill。这是「skill=教学/资源」的历史规律。
  - 缓解:`isExcludedDeepDiveIdentity` 只挡 deep_gate,且 `isAwesomeCourseTutorialList`(`:875`)有 `runnableInfra` 逃生门(有 mcp/cli/架构目录+install+tests 则不算资源类)。但 `EXCLUDED_DEEP_IDENTITY_RE` 本身**没有同款逃生门** → 一个名字带 "skills" 的**真 agent skill 运行时/框架**(如 claude skills 生态里的工具型仓)会被直接挡在 Tier3 外。
  - 这与 CLAUDE.md「新型项目形态 skill 包/MCP server 会不会被旧关键词误杀」点名一致。**建议**(未动,属阈值/语义调整,宜小样验证):给 `isExcludedDeepDiveIdentity` 加 `runnableInfra` 逃生门(与 `isAwesomeCourseTutorialList` 对齐),让带实质代码+架构目录的 skill 框架可进深读。本次未改因为会动深读候选集,应先小样跑确认不放进真资源类。

### 3b. 语言过滤 None/Markdown→资源类 — 合理但偏硬
- `isResourceProject`(`:527`)主语言 none/markdown 即判资源类。多数情况对(awesome-list 类),但**纯 prompt/agent 配置仓**(主语言可能是 Markdown,如某些 MCP/skill 定义仓、纯 YAML/MD 的 agent 定义)会被误判。低频,**建议**:观察明天产出,若有真项目被 Markdown 主语言误杀再收紧条件(如 markdown + 无架构目录 + 无 package 文件才算资源)。本次未动。

### 3c. BIG_TECH_ORG_RE / boost 词表 — 会过时但低危
- `BIG_TECH_ORG_RE`(`:37`)硬编码大厂 org 名单(给背书加分)。这是「白名单当定义」,新晋实验室(如新出的 AI lab org)不在表里则拿不到背书分。但背书只是加分轴非门,漏判只降分不误杀,危害远低于模型栏的 Opus|Sonnet|Haiku 硬编码。**建议**:周期性补名单;低优先。
- `BOOST_TERMS`/`CAP_TERMS`(`project-ranking.mjs` 的 lib 版)同理:热点词表会过时,但已被设计成 scoring feature 非 hard cap(`PROJECT_FOCUS_GUIDANCE` 明确「finance/course 等是 feature 不是 hard cap」)→ 这正是从 Fable 5 同类病里学到的正确做法,无需改。

---

## 修过的文件清单

| 文件 | 改动 | 为什么 | node --check |
|---|---|---|---|
| `scripts/columns/projects/codex-deepdive.mjs` | prompt schema 加 `tier_template.core_concepts[{name,role,evidence}]` + concreteness contract 加承重概念硬约束 | 病类1a:范式新标准件 core_concepts 没接到 live 深读,明天会全篇缺失,断 KG-2 判边项目侧锚 | OK + test 6/6 |
| `scripts/columns/projects/brief-writer.mjs` | `normalizeTierTemplate` 加 `core_concepts` 保留 + 新增 `normalizeCoreConcepts()` | 同上;writer 白名单原会丢弃 core_concepts,需保结构落库(空则 undefined 不污染非Tier3) | OK |

## 建议未动(留给 Kevin / 小样验证)
- 🔴 **2b 发现源单入口**:把 OSSInsight/HN 升为发现源、或开 topicLimit。改候选构成属方向决策。
- **3a skill 框架误杀**:给 `isExcludedDeepDiveIdentity` 加 runnableInfra 逃生门。需小样确认。
- **1b/1c schema 单一真相**:把 Tier3 schema 抽成共享常量,prompt+validator+writer 共用,根治内嵌副本漂移。
- **3b Markdown 主语言误判**:加架构目录/package 文件复合条件。
- **3c 大厂名单/热点词表**:周期性维护(低危,加分轴非门)。

## 明天 6-10 产品级验证法
1. **core_concepts 真出来了**(病类1a 主验证):6-10 跑完后,任取一篇当天新 Tier3 项目深读,在 brief-wiki 落库的 tier_template 里确认有 `core_concepts` 且每条 evidence 带源文逐字引用+文件锚。产品侧:KG-2 判边时项目节点应能给出 primary 概念,不再因「项目侧无承重概念」退回 NO_EDGE/人工补。
2. **没误杀**(病类3a/3b 观察):看 6-10 的项目候选/Tier 分布,确认没有当天明显的真 agent skill 框架 / MCP 仓掉进资源类被列为 list_only(对照 trending 三榜人工扫一眼是否有该上深读却没上的)。
3. **多源验证仍生效**(病类2a 回归):确认精英筛选日志 `elite selected N/M` 正常、入选项 sourceSignals≥2,没退化成纯 trending。
