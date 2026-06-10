# Plan: SoCRATES 论文深读第 1 轮 (PAPER-2606.05563)

> 触发：本任务将新增一篇论文深读的 `paper.mdx`、`career.mdx`、`metadata.json` 与 AutoSci primitive，合计超过 100 行，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：把 SoCRATES 写成可进入 AI-Brief 知识库的忠实深读资产，服务 Kevin 对 agent / eval / social interaction benchmark 的判断与迁移。
- **小方向**：
  - 读 arXiv HTML/PDF 全文、HF paper page、项目页；确认代码仓库状态。
  - 按 `docs/paradigms/papers.md` canonical 结构从头写 `paper.mdx`，数字集中在实验节，来源走脚注。
  - 写 `career.mdx`，聚焦应用型 AI 工程师 / FDE 能学到的评测、仿真、LLM-as-judge 与作品集方向。
  - 写 `metadata.json` 与 `data/autosci/primitives/2606.05563.yaml`，标 `status:"deep_read"` 与 `cold_audit.status:"needs_human"`。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：产出 `content/papers/2606.05563-socrates-mediation-eval/` 下三个人读/索引文件，以及对应 AutoSci primitive。
- 非目标：不改论文范式、不发布、不伪造代码仓库、不补未披露数据集或 leaderboard 细节。
- 影响范围（模块/数据/路由/用户）：新增内容文件、AutoSci primitive、任务态势记录；不改前端路由、不改 schema。
- 验收标准（可观察）：Markdown/JSON/YAML 语法有效；真实数字来自原文/HF/项目页；`build-index`、`validate-papers-deepread`、`npm run verify` 通过或如实报告失败。

## 3. 方案（怎么做）
- 改动点：
  - `content/papers/2606.05563-socrates-mediation-eval/paper.mdx`
  - `content/papers/2606.05563-socrates-mediation-eval/career.mdx`
  - `content/papers/2606.05563-socrates-mediation-eval/metadata.json`
  - `data/autosci/primitives/2606.05563.yaml`
  - `task-board.md` 记录本轮交付状态
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：`node scripts/columns/papers/build-index.mjs`、`node scripts/validate-papers-deepread.mjs`、`npm run verify`。
- 内容门（独立 agent + rubric）：当前 Codex 会话无法真正替代独立冷审；metadata 固定 `cold_audit.status="needs_human"`，不自审放行。
- 成功指标：内容能在脚注中追溯 arXiv/HF/项目页；所有 benchmark 数字区分论文自报与公开页面自报；代码仓库未发布处显式标注。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：`web` 查 arXiv/HF/项目页与前向脉络；PowerShell 下载/搜索 HTML/PDF/TeX；仓库脚本做 build/validate/verify。
- 是否新增依赖：不新增。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控完成研究、写作和机器验证；不上 LangGraph/CrewAI/AutoGen。
- 独立冷审不在本会话内执行，按仓库现有深读门控写入 `needs_human`。
- 若后续要审：角色=内容冷审；eval=开卷逐条对 arXiv/HF/项目页核数字与结论；模型/effort=强模型 high。

## 7. 切片（每片=可运行交付）
- 片 1：拉取并抽取全文、项目页、HF 信息，形成证据笔记。
- 片 2：写四个产物文件。
- 片 3：跑 build/validate/verify，修复语法或结构问题。
- 每片的"可运行、Kevin 能看到"：最终目录可被本地索引脚本识别，冷审前不自动发布。

## 8. 风险 / 回退
- 风险点：arXiv HTML 表格可能抽取缺数学符号；项目页数字与论文表格需分清来源；代码/数据 Coming soon 不能写成可用。
- 回退方式：保留新增文件范围，若验证失败只针对新增文件修正；不改上游范式与 schema。
