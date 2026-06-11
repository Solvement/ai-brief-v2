# Plan: Retrospective Harness Optimization 深读第 1 轮 (PAPER-2606.05922)

> 触发：本次会新增一篇论文深读的 `paper.mdx`、`career.mdx`、`metadata.json` 与 AutoSci primitive，超过 100 行，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：按 canonical 论文范式把 Retrospective Harness Optimization 写成 AI-Brief 可收录的深读资产，重点沉淀“用同一模型回看多条 agent 轨迹并偏好选择更好 harness”的自进化 agent 工程价值。
- **小方向**：
  - 读 arXiv HTML/PDF 全文、HF 页面，并 clone `wbopan/retro-harness` 实读源码/README。
  - 新增 `content/papers/2606.05922-retrospective-harness-optimization/{paper.mdx,career.mdx,metadata.json}`。
  - 新增 `data/autosci/primitives/2606.05922.yaml`，复用既有 Mind Palace 概念词表，诚实标注 discovery_trace 是否数据不足。
  - 全文中区分论文自报、README/作者自称、源码实读；数字只来自原文或仓库可核实内容。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 生成全中文、脚注来源、Mermaid 架构、集中实验数字、限制风险与职业成长解读。
  - `metadata.json` 含 8 维 scores、`human_tabs:["paper","career"]`、`status:"deep_read"`、`cold_audit.status:"needs_human"`。
  - AutoSci primitive 含 `core_concepts`、`discovery_trace`、可迁移设计原则与风险。
- 非目标：
  - 不发布、不改 cold audit 结论、不修改 canonical 范式。
  - 不引入新依赖，不改前端/路由/schema。
- 影响范围（模块/数据/路由/用户）：
  - 只影响新增论文内容目录、AutoSci primitive、任务态势记录。
- 验收标准（可观察）：
  - 目标 4 个产物文件存在，Markdown/JSON/YAML 语法可解析。
  - `node scripts/columns/papers/build-index.mjs` 与 `node scripts/validate-papers-deepread.mjs` 可跑；最终尽量跑 `npm run verify`，若外部既有失败则记录。

## 3. 方案（怎么做）
- 改动点（file:line 级别尽量具体）：
  - 新增 `content/papers/2606.05922-retrospective-harness-optimization/paper.mdx`。
  - 新增 `content/papers/2606.05922-retrospective-harness-optimization/career.mdx`。
  - 新增 `content/papers/2606.05922-retrospective-harness-optimization/metadata.json`。
  - 新增 `data/autosci/primitives/2606.05922.yaml`。
  - 更新 `task-board.md` 增加本任务阶段与交付结论。
- 数据契约/schema 变化（有则标 🔴 需 Kevin 签字）：
  - 无 schema 变化。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - JSON/YAML 可解析。
  - `node scripts/columns/papers/build-index.mjs`。
  - `node scripts/validate-papers-deepread.mjs`。
  - `npm run verify`。
- 内容门（独立 agent + rubric）：
  - 本轮作者稿只标 `cold_audit.status="needs_human"`，后续需独立冷审，生成者不自审。
- 成功指标（真正证明“做对了”的 holdout/查询）：
  - paper/career/primitive 能回答：RHO 优化的对象是什么、训练信号从哪里来、有哪些实验数字、为什么不是 RLHF/微调、代码仓库实际释放到什么程度。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - Web/arXiv/HF 获取论文全文与页面。
  - `git clone` 官方仓库到临时目录并用 `rg` / 文件读取实读。
  - `npm run kg:research` 做 Mind Palace 背景召回，不把召回内容当本文事实。
  - Node 校验脚本与 `npm run verify`。
- 是否新增依赖（默认不加重资产，RULES/SPEC）：
  - 不新增依赖。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控够不够？需要拆角色吗（需求/方案/开发/审查/测试）？
  - 本轮由 Codex 作者完成研究与落盘；高风险内容不自审，metadata 保持 `needs_human`。
- **不上 langraph/CrewAI/AutoGen**，除非要发线上自主多 agent 产品——理由：本次是单篇内容资产生成，不是新增运行时。
- 若用子 agent，列派发表：无；受当前可用工具约束，不在本轮启动独立冷审。
- 是否用 dynamic workflow（批量生成/审计/多角度/质量门 → 是）：
  - 否，单篇。

## 7. 切片（每片=可运行交付）
- 片 1（先证小样）：读 canonical、样板、Mind Palace 召回、全文和源码。
- 片 2：写四个目标文件。
- 片 3：跑 build-index / validate / verify，修结构问题。
- 每片的“可运行、Kevin 能看到”是什么：
  - 文件就地落盘；校验脚本能识别该论文深读。

## 8. 风险 / 回退
- 风险点：
  - arXiv HTML/PDF 表格抽取可能丢数字，逐格无法确认时标“以原文表为准”。
  - 代码仓库可能只有 research scripts / README，未必可复现实验；必须区分 README 自称与源码实读。
  - 论文刚发布，后续演化可独立核实的信息可能不足。
- 回退方式（保留上一版）：
  - 这是新增目录；如发现事实硬伤，删除新增四文件或保持 `needs_human` 不发布。
