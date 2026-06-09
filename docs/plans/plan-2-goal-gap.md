# Plan 2 · Goal-Gap（北极星差距）

> 对照北极星 **L0 语料 → L1 自进化 → L2 tutor → L3 research**、脊柱 **Information → Judgment → Action**、护城河 **解读质量**。
> 子-agent 评级：解读护城河 = 论文 A · 原语 A− · 项目 C+ · 模型 B；前端 ~80%；后端可用 L0 底座 ~45-50%。
> 约定见 `./README.md`。标 🔴 的任务实现前先问 Kevin。

---

## F. 前端（兑现 SPEC §4 投递原则）

> 视觉已达标（浅色+蓝、杂志排版、Mermaid、sticky TOC、Lighthouse 95/97、a11y 95）。**最大缺口 = §4#2「渐进式披露/折叠线头」只在一个渲染器里实现，旗舰论文深读整篇平铺。**

### FE-1 · 论文深读加"预备好的折叠线头"  `[P0] Owner:Claude`
**问题**：`src/components/PaperDeepDive.tsx` + `MarkdownRich`(无折叠) 把 `paper.mdx` **整篇平铺**。SPEC §4#2/#4 要求主线只留判断+核心洞见+一例，更深（消融/数学/证明）折叠成"一拉即开"的线头。唯一实现了线头的是 `LightSpineDeepDive`（claim-card + `<details>`），论文栏=0。
**改动**：按标题约定或 metadata 把深层小节包进可折叠 `<details>`/disclosure（内容预备好、点开即现，非关键词甩锅）。复用 `LightSpineDeepDive` 的折叠原语。
**验收**：论文深读页深层小节默认折叠、点开展开；`LIVE-paper` 类页面主线长度明显缩短。
**依赖**：FE-4（最好用统一 section 原语）。

### FE-2 · Home 别再内联 ~738KB  `[P0] Owner:Claude`
**问题**：`app/page.tsx:12-19` `readJson("public/data/trending.json")`(738KB) 等全量传给 `HomePage`，而首页只渲染约 8 个名字。整包进 RSC/HTML 负载。
**改动**：在 `page.tsx` 侧只取所需切片（papers-index 摘要 + trending 前 8 + news 头条），或新建轻量 `home-index.json`。
**验收**：Home 首屏传输体积显著下降；Lighthouse Home perf ≥ 现状（95），LCP 不升。

### FE-3 · `TierTemplateDeepDive` 恢复判断栏+折叠  `[P1] Owner:Claude`
**问题**：`TierTemplateDeepDive`（最新、号称取代 `LightSpineDeepDive`）**丢了 sticky 判断栏与全部折叠**——相对前代是回退，违反 §4#1/#2。
**改动**：把判断栏（verdict rail/action pill）与可折叠 claim 卡补回。
**验收**：项目深读当前路径有顶部判断 + 可折叠段，与 light_spine 对齐。

### FE-4 · 收敛渲染器与深读模板  `[P1] Owner:Claude`
**问题**：3 个 markdown 渲染器（`Markdown`/`MarkdownRich`/`ProseMarkdown`）+ 4 条深读路径（Paper / LightSpine / TierTemplate / legacy Brief+Detail）。漂移源、增 bundle。
**改动**：收敛为 1 个 markdown 渲染器 + 1 个 section/disclosure 原语；各深读页复用之。
**验收**：仓库仅留 1 个 markdown 渲染组件；4 深读路径走同一 section 原语；build 通过、视觉无回退。

### FE-5 · a11y 95→100  `[P2] Owner:Claude`
**问题**：tab 用 `role="tab"` 但缺 `tablist`/`aria-controls`/`tabpanel` 关联（`PaperDeepDive`/`News`/`PapersPage`）；score-ring conic-gradient 对比待核。
**改动**：补全 ARIA tab 语义；核对对比度。
**验收**：Lighthouse a11y = 100（或 axe 无 serious 项）。

### FE-6 · 删残留路由/组件  `[P2] Owner:Claude`
**问题**：`/articles/[paperId]`(孤儿 `legacy/Articles`)、`SiteHeader`、`legacy/Home`、Projects 漏进生产的 dev ingest 覆盖层。
**改动**：删除（与 Plan 1 `CLEAN-2` 合并到同一分支执行）。
**验收**：build 通过、导航无死链。

---

## G. 后端 / L0 语料底座（北极星最远的一块）

> 采集→策展→强模型深读→双审这条判断流水线是真的、在轨；**缺的是"AI 能回头查询/复用语料"的检索底座。**

### COR-1 · 原语 embedding 索引 + `findRelated()`  `[P0] Owner:Codex 🔴需签字(新数据层)`
**问题**：`data/autosci/primitives/*` 结构良好（`core_pattern/components/transfers_to/risks`），但全仓 `embedding` 字段=0；其所有消费者（`build-knowledge-graph`/`eval-northstar-goal`/`validate`/`cold-audit`）只渲染或 lint，**无一做语义检索**。语料"只写不读"⇒ L1 无法查询/去重/对比既有想法。**这是北极星最大单点阻塞。**
**改动**：用本地嵌入模型（落在 DeepSeek 廉价层/本地）为每条原语+论文生成向量，存进索引（sqlite-vss / 本地向量文件）；提供 `findRelated(primitive|query, k)` 检索 API；deep-read/策展时调用做"是否已有近邻想法"。**新数据层先与 Kevin 对齐选型。**
**验收**：`node scripts/.../find-related.mjs "<query>"` 返回带相似度的近邻原语；新原语入库即生成向量。
**依赖**：DATA-1（provenance/version 一并落库）。

### COR-2 · KG build 接进每日 + `design_principles` 必填  `[P1] Owner:Codex`
**问题**：`scripts/kg/build-knowledge-graph.mjs` 不在 `package.json`/`daily.mjs`/`boot`；`public/data/knowledge-graph.json` 停在 **6-5**、索引已 **6-6**，持续 stale。其跨论文边 `shares_principle` 依赖的 `design_principles` 仅 14 条原语里 7 条有（两条最新的丢了）。
**改动**：把 KG build 接进 `npm run daily`；原语 lint 把 `design_principles` 设为必填。
**验收**：跑一次 daily 后 `knowledge-graph.json` 日期=当天；缺 `design_principles` 的原语 → lint fail。

### COR-3 · 修 projects→AutoSci 零产出  `[P1] Owner:Codex`
**问题**：`autosci-primitives.mjs` 被 `deepdive.mjs:173`/`codex-deepdive.mjs:238` 引用，但 `ls data/autosci/primitives | grep ^proj-` = **0**，而 sqlite `runs` 有 **259** 次项目跑。闸门（`finalDepth==="deep"` ∧ 架构型 ∧ project_type∈集合 ∧ 非教学）从没触发。C 规则"月榜前 10 deep-dive→原语"只搭一半。
**改动**：核对深读输出形状是否匹配 emitter 期望的 `deepDive.tier_template.*`；修闸门；加 run 级"本次抽取 N 条原语"计数，0 抽取可见。
**验收**：对一个架构型项目跑 deep-dive → 产出 ≥1 个 `proj-*` 原语；日志打印抽取数。

### COR-4 · 4 数据源裂解 → 收敛单一真相  `[P1] Owner:Codex 🔴需签字(数据迁移)`
**问题**：`data/ai-brief.db`(sqlite，论文 `runs` 冻结在 6-1，已迁文件流) + 文件语料(活) + `public/data/*.json`(服务) + Supabase(基本死，仅 `test-supabase.mjs` 碰)。四处真相、部分陈旧。
**改动(问 Kevin)**：定**文件语料为单一真相**，`public/data/*` 为派生索引；retire 停更的 sqlite 论文表与 vestigial Supabase（或明确各自唯一职责）。
**验收**：数据来源图（写一份 `docs/ops/data-sources.md`）只剩一个写入真相 + 派生索引；无组件读已废存储。

### COR-5 · 北极星 eval 断言底座  `[P1] Owner:Codex`
**问题**：`eval-northstar-goal.mjs` 只查 `paper.mdx/career.mdx/metadata.json/primitive.yaml` 是否存在，**从不断言 `embedding/provenance/quality_signals`**。于是"GOAL GREEN"可在底座缺失时为真。
**改动**：eval 增加底座断言（每条记录有 provenance/version/quality_signals；原语有 embedding）。
**验收**：缺底座字段时 `eval-northstar-goal` 报红。
**依赖**：DATA-1、COR-1。

### COR-6 · 服务索引增量化/分页  `[P2] Owner:Codex`
**问题**：`build-index.mjs` 每跑全量重建；`trending.json`(738KB)/`articles-archive.json`(506KB) 线性增长且整包发到浏览器。
**改动**：按日期分片/分页归档；索引增量更新而非全量重建。
**验收**：归档查询分页加载；单次首屏不再拉全量 archive。

---

## H. 内容 / 解读护城河

> 论文+原语已是 A 级真护城河；项目、模型偏薄，有轻微"翻译机"渗入。

### CON-1 · 写 `docs/paradigms/papers.md`  `[P0] Owner:Claude`
**问题**：`docs/paradigms/` 仅 `models.md`+`projects.md`；SPEC §0 与 CLAUDE.md 都把 `papers.md` 列为 canonical，却**不存在**。你最好的产出（A 级论文解读）目前靠"口口相传"，没成文⇒无法被强制。
**改动**：成文 papers 范式——密度分区（看点无数字/方法用类比/数字集中在结果·消融/来源走脚注）、反编造（"数据不足·官方未披露"、自报 vs 实测）、career 双 tab 规格。从现有最佳样本（MetaGPT/GPTSwarm 深读）反推规则。
**验收**：文件存在；与 BUG-3 的内容 lint 规则对齐（lint 可据此校验论文产出）。

### CON-2 · 项目 Tier2/3 强制真·横向对比  `[P0] Owner:Codex`
**问题**：项目范式硬规则="Tier2/3 价值 = 成熟度判断 + 横向对比，否则不合格"。实际退化成点名——agentmemory `similar_projects: 未在 README/artifact 说明,但常见竞争项如 mem0、Letta...`，**零差异点**。这是最接近"翻译机"的地方。
**改动**：deep-dive（clone 读源码的强模型）产出**对 1-2 个具名替代品的对比表**（差异点/成熟度/取舍）；缺则 gate-fail Tier2/3。
**验收**：新项目 Tier2/3 深读含对比表；无对比表 → 不入库（接 validate）。
**依赖**：DATA-2 风格的门。

### CON-3 · 模型卡换强模型 + 修版本漂移  `[P1] Owner:Codex`
**问题**：7 张模型卡全由廉价层 `DeepSeek:deepseek-v4-pro` 写⇒开源模型该有的"怎么做到/为什么"机制层缺失（只列 WHAT）。版本元数据陈旧：`models.json` 里 Claude `latestVersion:"Claude Opus 4.1"`、Gemini `"Gemini 2.0"`——违反"当天官方核验最新"。
**改动**：开源模型的机制分析路由到强模型；`latestVersion` 与官方 changelog 对齐并记录核验日期；"最新"声明当天经官方源核验，否则标"推断"。
**验收**：抽查一张开源卡含 HOW（架构/为什么）；Claude/Gemini 的 `latestVersion` 与当前官方一致且带核验日期。

### CON-4 · 项目自报数字打"自报/自称"标  `[P1] Owner:Codex`
**问题**：项目 README 自报指标被当事实直陈、未标（"在 LongMemEval-S 达 95.2% 召回率"）。家规"自报 vs 实测/已核实 vs 自称"只在模型栏落实。
**改动**：项目生成器对来自 README/artifact 的数字统一标 `自报`；仅独立来源可标 `已核实`。
**验收**：抽查项目卡，所有来自 README 的指标带"自报"标。

### CON-5 · 冷读核验前向引用 arXiv ID  `[P2] Owner:Codex`
**问题**：论文深读含未来日期 arXiv ID（如 `2601.19290`/`2603.02701`），目前带置信度标但未核验可解析。
**改动**：冷读阶段校验引用的 arXiv ID 能解析，否则标"推断/待核"。
**验收**：冷读报告列出无法解析的引用 ID 并降级标注。
