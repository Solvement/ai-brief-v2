# Plan: Mind Palace 知识检索框升级

> 触发：前端检索体验会超过 100 行改动，按 RULES 先立 plan。当前纽约时间仍是 2026-06-10，本计划不把 6/11 当作业务日期。

## 1. 大方向 / 小方向
- **大方向**：先把现有 Mind Palace 检索框做成可用的知识检索入口，让用户能从本地精读知识库里找“方法、架构、证据、迁移价值”，不是只搜节点名。
- **小方向**：
  - 搜索范围覆盖 title / tag / core_concepts / facets / self_evo_use / discovery_trace。
  - 输出 ranked 结果列表，展示命中理由、方法摘要、结果/迁移摘要、节点类型和分数。
  - 点击结果能聚焦图节点，并打开右侧详情。
  - 不做聊天、不做多智能体科研 agent；AutoSci 放到后续演进。

## 2. 需求
- 目标：`/mind-palace` 当前搜索框从“高亮节点”升级为“知识结果面板”。
- 非目标：不新增 API、不新增依赖、不做 LLM 回答、不改 KG schema。
- 影响范围：`src/components/KnowledgeGraph.tsx` 和相关样式。
- 验收：搜索“战略 agent”“预测”“记忆”“benchmark”能返回相关论文/项目，并展示可读摘要。

## 3. 方案
- 在前端对已加载 graph 节点构造 lexical search index。
- 用字段权重排序：标题/核心概念 > problem/method/transfer/self_evo_use > tag/result/weakness。
- 保留现有图节点高亮，但新增结果面板，避免只靠图形找信息。

## 4. eval
- 结构门：`npm run lint:eslint`、`npm run validate`、`npm run build`。
- 成功指标：四个 holdout query 至少返回 1 个带 facet 的相关节点。

## 5. tool
- 使用本地代码、现有 graph JSON；不加依赖。

## 6. 编排
- 单主控足够。不启用 AutoSci / LangGraph / 多 agent。

## 7. 切片
- 片 1：前端 lexical ranked search + 结果面板。
- 片 2：验证与任务板/dev-map 更新。

## 8. 风险 / 回退
- 风险：结果面板挤压图视图；通过紧凑布局和结果上限控制。
- 回退：单文件前端改动可直接回退。
