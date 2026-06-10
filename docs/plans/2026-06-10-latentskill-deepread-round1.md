# Plan: LatentSkill 论文深读从头写 (PAPER-2606.06087)

> 触发：本次会新增/重写 `paper.mdx`、`career.mdx`、`metadata.json`、AutoSci primitive，并更新任务态势，超过 100 行，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：把 LatentSkill 写成可进入 AI-Brief 知识库的可信深读资产，帮助 Kevin 判断“把 agent textual skill 从 prompt/context 搬进 LoRA weight space”这条路线是否有工程迁移价值。
- **小方向**：
  - 读完 arXiv HTML/PDF/TeX 全文、HF 页面和 `yuaofan0-oss/LatentSkill` 源码，不只看摘要。
  - 按 `docs/paradigms/papers.md` canonical 结构写 `paper.mdx`，数字集中在实验节，自报/实读分开。
  - 写 `career.mdx`，只谈应用型 AI 工程师/FDE/AI-app builder 能学什么、造什么、怎么讲。
  - 写 `metadata.json` 与 `data/autosci/primitives/2606.06087.yaml`，其中冷审状态保持 `needs_human`。
  - 更新 `task-board.md` 记录本轮交付态势；不改上游范式或 SPEC。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：产出 `content/papers/2606.06087-latentskill-weight-space-skills/` 下三个人读/索引文件和 AutoSci 原语。
- 非目标：不修改论文范式、前端渲染、索引 schema、每日管线；不声称已过独立冷审。
- 影响范围（模块/数据/路由/用户）：仅新增论文内容数据、AutoSci primitive、任务态势；不改路由和公共 schema。
- 验收标准（可观察）：Markdown/JSON/YAML 结构符合样板与 canonical；实验数字可回溯到原文或仓库；`build-index`、`validate-papers-deepread`、`npm run verify` 通过或明确说明阻塞。

## 3. 方案（怎么做）
- 改动点：
  - `content/papers/2606.06087-latentskill-weight-space-skills/paper.mdx`
  - `content/papers/2606.06087-latentskill-weight-space-skills/career.mdx`
  - `content/papers/2606.06087-latentskill-weight-space-skills/metadata.json`
  - `data/autosci/primitives/2606.06087.yaml`
  - `task-board.md`
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：`node scripts/columns/papers/build-index.mjs`、`node scripts/validate-papers-deepread.mjs`、`npm run verify`。
- 内容门（独立 agent + rubric）：本轮 metadata 写 `cold_audit.status="needs_human"`，不自审、不自动发布。
- 成功指标：正文所有关键数字来自论文全文或仓库实读；未知处标“原文未披露 / 数据不足 / 以原文表为准”；Mermaid 围栏配平。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：web 读取 arXiv/HF；PowerShell 下载 HTML/PDF/TeX、clone GitHub、运行校验；`apply_patch` 落文件。
- 是否新增依赖：不新增。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控够不够：够。当前任务是单篇内容生成与本地校验；独立冷审按仓库门禁留给后续 agent。
- 子 agent：本轮不派发；metadata 明确 `needs_human`，避免自审。
- dynamic workflow：否。

## 7. 切片（每片=可运行交付）
- 片 1：取源并读全文/源码，列事实账本。
- 片 2：写四个目标产物，脚注和数字对账。
- 片 3：更新 task-board，跑内容与项目门禁。

## 8. 风险 / 回退
- 风险点：arXiv HTML 表格抽取可能错位；仓库代码可能未完全开源训练/权重；论文刚发布，后续演化资料有限。
- 回退方式（保留上一版）：目标目录目前不存在；如校验失败，逐项修 Markdown/JSON/YAML，不触碰上游范式。
