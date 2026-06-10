# Plan: KG-2 pilot backend gate (KG-2-pilot-backend-gate)

> 触发：schema / 数据契约变更 + 预计 >100 行脚本改动。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：让 KG-2 schema v2 的核心概念门真正进入后端构建链，保证新增 paper/project 关联不是散文关系，而是可机器校验的知识边。
- **小方向**：
  - 新增 `kg:vocab`，从 facet `core_concepts[].name` 聚合出 `data/knowledge-graph/concept-vocab.json`，并对近重名只 warning 不阻断。
  - 扩展 `validate-mind-palace.mjs`，旧 9 个 facet 无 v2 字段继续 PASS；`schema: v2` facet 的新边必须过 evidence / negative_rationale / confidence / concept role 门。
  - 扩展 `integrate-kg.mjs`，paper facet 能按 `node_id` / `slug` / `arxiv_id` / `source: content/papers/...` 合并或创建 paper 节点，保持现有 9 个 faceted nodes 不破坏。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 实现用户列出的三件事。
  - `npm run kg:build` 链在 integrate 后运行 vocab，再 embed。
  - 临时 bad fixture 验证三类 reject 后删除。
- 非目标：
  - 不新增/修改正式 pilot facet 内容。
  - 不改 KG-2 方案文档、深读范式、前端页面和 embed 文本字段。
  - 不引入新依赖。
- 影响范围（模块/数据/路由/用户）：
  - `scripts/kg/concept-vocab.mjs`
  - `scripts/validate-mind-palace.mjs`
  - `scripts/kg/integrate-kg.mjs`
  - `package.json`
  - `data/knowledge-graph/concept-vocab.json`
  - `dev-map.md` / `task-board.md`
- 验收标准（可观察）：
  - `node scripts/validate-mind-palace.mjs` 现有 9 facet PASS。
  - 临时 bad fixture 对 `discovery_trace` 无 `source_span`、`same_problem` 边、非法 `implements` concept 全部 reject。
  - `npm run kg:build` PASS，并生成/更新 concept vocab。

## 3. 方案（怎么做）
- 改动点：
  - 新建 vocab 脚本：扫描 `data/knowledge-graph/facets/*.yaml`，过滤 `status: reject`，计数概念和 slug，排序写 JSON。
  - validator：把 v1 结构门保留为 baseline；新增 v2 可选字段门；按文件 `schema: v2` 判断新边硬门；跨类型边用两端 facet 的 `core_concepts` role 校验。
  - integrate：建立 facet slug/arxiv/source 索引，resolver 找不到时为 `kind: paper` facet 创建 `paper:<arxiv_id>` 或 `content/<slug>` 节点，设置 `/articles` 链接。
  - package：加 `kg:vocab`，`kg:build` 改为 build -> integrate -> vocab -> embed。
- 数据契约/schema 变化：
  - 已由 KG-2 plan §3.1 定稿；本任务只落地 validator / generated vocab，不改上游 schema。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/validate-mind-palace.mjs`
  - 临时 bad fixture 三类 reject 手测
  - `npm run kg:build`
  - `npm run verify`
- 内容门（独立 agent + rubric）：
  - 本次是后端门实现；完成后按仓库规则需要独立审查高风险 schema gate，rubric 对照本 plan 小方向与用户验收。
- 成功指标：
  - 旧 9 facet grandfather PASS。
  - v2 bad fixture 确认 rejects。
  - `graph.summary.facetedNodes` 不因现有 9 facet 回退。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - PowerShell 读取与运行 Node/npm。
  - `apply_patch` 做文件编辑。
  - `codegraph_explore` 读既有 KG 代码结构。
- 是否新增依赖：
  - 不新增依赖，沿用已有 `yaml`。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控开发足够；独立审查在开发完成后按规则执行或交由 Kevin/外部 agent。
- 不上 LangGraph/CrewAI/AutoGen。
- 本次不派生批量生成子 agent；风险收口靠 deterministic validator + bad fixture + build/verify。

## 7. 切片（每片=可运行交付）
- 片 1：实现 vocab 脚本和 npm 链，能生成 vocab。
- 片 2：实现 validator v2 gate，旧 facet PASS，bad fixture reject。
- 片 3：实现 paper facet integrate，`kg:build` PASS，确认 faceted nodes 不回退。
- 每片的可运行结果：对应脚本命令可本地跑通。

## 8. 风险 / 回退
- 风险点：
  - graph 里 paper 节点 ID/slug 来源多样，resolver 误建重复节点。
  - 旧 facet 没有 `core_concepts`，validator 不能误伤。
  - `kg:build` 会更新 generated JSON，需要区分代码变更和生成物。
- 回退方式：
  - 脚本改动可单文件 revert；生成的 `concept-vocab.json` 可由 `npm run kg:vocab` 再生。
