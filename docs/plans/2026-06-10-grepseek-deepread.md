# Plan: GrepSeek 论文深读 (PAPER-2605.29307)

> 触发：本次将新增一篇论文深读的 `paper.mdx`、`career.mdx`、`metadata.json` 与 AutoSci primitive，总改动超过 100 行，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：把 GrepSeek 作为一篇可进入 AI-Brief 学术知识库的深读资产交付，帮助 Kevin 理解 direct corpus interaction search agent 对 agent/RAG 工程的可迁移价值。
- **小方向**：
  - 按 `docs/paradigms/papers.md` canonical 结构写 `paper.mdx`，包括立场、术语、方法、Mermaid 架构、真实实验数字、限制、技术细节、后续演化。
  - 写 `career.mdx`，聚焦应用型 AI 工程师 / FDE 能学什么、能造什么、如何诚实写进简历。
  - 写 `metadata.json`，包含 8 维 scores、`human_tabs:["paper","career"]`、`source_rankings`、tags、`status:"deep_read"`、冷审状态。
  - 写 `data/autosci/primitives/2605.29307.yaml`，包含可复用原语、core_concepts 与 discovery_trace，不把 AI-only 内容混入人读 tab。
  - 全程区分论文/README 自报与仓库源码实读；不编造数字，未披露则标数据不足。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 读 arXiv 全文（HTML/PDF）与 HuggingFace 页面。
  - clone 并阅读 `https://github.com/alirezasalemi7/grepseek` 源码与 README。
  - 产物全部中文，代码、数字、专有名词与英文术语保留。
- 非目标：
  - 不修改 canonical 范式。
  - 不改前端渲染、路由、schema 或每日管线。
  - 不发布、不 commit、不 push。
- 影响范围（模块/数据/路由/用户）：
  - 新增 `content/papers/2605.29307-grepseek-dci-search-agent/`。
  - 新增 `data/autosci/primitives/2605.29307.yaml`。
  - 更新 `task-board.md` 记录本次任务态势与交付结论。
- 验收标准（可观察）：
  - Markdown/JSON/YAML 可被仓库校验脚本读取。
  - `node scripts/columns/papers/build-index.mjs` 成功。
  - `node scripts/validate-papers-deepread.mjs` 成功。
  - `npm run verify` 成功；若失败，必须说明失败项，不能声称完成。

## 3. 方案（怎么做）
- 改动点：
  - `content/papers/2605.29307-grepseek-dci-search-agent/paper.mdx`：按 canonical paper 骨架新增深读。
  - `content/papers/2605.29307-grepseek-dci-search-agent/career.mdx`：按 career 骨架新增职业/成长解读。
  - `content/papers/2605.29307-grepseek-dci-search-agent/metadata.json`：新增索引元数据。
  - `data/autosci/primitives/2605.29307.yaml`：新增 AI-only 原语。
  - `task-board.md`：新增/回填本次 PAPER-2605.29307 任务态势。
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/columns/papers/build-index.mjs`
  - `node scripts/validate-papers-deepread.mjs`
  - `npm run verify`
- 内容门（独立 agent + rubric）：
  - 按 RULES #12 本应由独立 reviewer 冷审；当前 Codex 会话没有可调用独立子 agent，metadata 先标 `cold_audit.status="needs_human"`，不自审放行。
- 成功指标：
  - 关键实验数字均可追溯到论文全文表/图/正文。
  - 源码相关描述来自 clone 后 README/文件结构/训练脚本，不把 README 自称当第三方实测。
  - `discovery_trace` 若原文没有解法发现叙事则标 `数据不足`。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - PowerShell + `rg`/`Get-Content` 读仓库文档与源码。
  - `git clone` 拉取 GrepSeek 仓库到临时研究目录。
  - Web/arXiv/HF 下载 HTML/PDF/元信息。
  - Node 校验脚本与 `npm run verify`。
- 是否新增依赖：否。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控：内容生成与文件落盘由 Codex 当前会话完成。
- 子 agent：当前未启用独立子 agent；冷审状态不伪造，通过 metadata 标 `needs_human`。
- 不上 LangGraph/CrewAI/AutoGen：这是一次单篇内容资产生成，不需要运行时编排。

## 7. 切片（每片=可运行交付）
- 片 1：读规则、范式、样板，落 plan。
- 片 2：获取论文全文、HF 信息、源码，整理可引用事实表。
- 片 3：写四个目标文件。
- 片 4：跑 build-index、deepread validate、verify，修到机器门通过或如实报告阻塞。
- 每片的可运行、Kevin 能看到：最终内容目录可被现有 Articles/Papers 索引脚本消费。

## 8. 风险 / 回退
- 风险点：
  - arXiv HTML 或 PDF 抽取表格数字不完整；逐格表值无法确认时标「以原文表为准」。
  - GrepSeek 仓库可能只有训练/数据脚本，无法证明论文指标可由当前代码一键复现；源码结论只写到实读范围。
  - 后续演化需要独立核实，若无可靠前向工作则标低置信或数据不足。
- 回退方式：
  - 新增内容文件可整体删除，不影响现有路由和数据契约。
