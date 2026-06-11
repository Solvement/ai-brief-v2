# Plan: SWE-Explore 深读第 1 轮 (PAPER-2606.07297)

> 触发：本次会新增/重写 `paper.mdx`、`career.mdx`、`metadata.json`、AutoSci primitive，并更新任务态势，超过 100 行，按 RULES #11 先写 plan。
> 完成后需独立冷审，作者稿只把 `cold_audit.status` 置为 `needs_human`。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：把 SWE-Explore 写成 AI-Brief 可进入知识库的论文深读资产，重点沉淀“代码 agent 的仓库探索能力应被单独评估，而不是被 issue resolved 掩盖”的评测范式。
- **小方向**：
  - 读 arXiv HTML/PDF 全文、HF paper 页面、官方 GitHub 仓库 `Qiushao-E/SWE-Explore-Bench` 源码/数据。
  - 从头写 `content/papers/2606.07297-swe-explore-repo-exploration/paper.mdx`、`career.mdx`、`metadata.json`。
  - 写 `data/autosci/primitives/2606.07297.yaml`，包含 KG-2 要求的 `core_concepts` 与 `discovery_trace`。
  - 区分论文自报、HF/GitHub 动态核验、仓库实读；所有实验数字集中在实验节。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 完全按 `docs/paradigms/papers.md` canonical 骨架输出 Paper/Career/metadata/AutoSci。
  - 用中文解释 repository exploration、line budget、coverage/ranking/context-efficiency 等机制，首次术语给大白话解释。
  - 明确限制：ground truth 来自成功 agent 轨迹，不等于唯一真实修复路径；line-level 预算评估不能替代最终修复。
- 非目标：
  - 不改论文范式、SPEC、前端路由或发布门。
  - 不跑论文全量 benchmark 复现；只做全文/源码实读与内容生产。
  - 不把作者自报结果写成第三方实测。
- 影响范围（模块/数据/路由/用户）：
  - 新增一篇论文深读内容目录。
  - 新增一条 AutoSci primitive。
  - 更新 `task-board.md` 本任务态势。
  - 运行索引/校验脚本会更新公开论文索引产物（若脚本有生成变更）。
- 验收标准（可观察）：
  - 四个目标文件存在，UTF-8 中文无乱码。
  - `paper.mdx` 有 Mermaid 架构图、脚注来源、实验数字集中、自报/实测标注、技术细节选读。
  - `metadata.json` 含 8 维 scores、`human_tabs:["paper","career"]`、`status:"deep_read"`、`cold_audit.status:"needs_human"`。
  - `node scripts/validate-papers-deepread.mjs` 与 `npm run verify` 通过，若失败需修到通过或明确阻塞。

## 3. 方案（怎么做）
- 改动点：
  - `content/papers/2606.07297-swe-explore-repo-exploration/paper.mdx`：按 canonical 从头写论文解读。
  - `content/papers/2606.07297-swe-explore-repo-exploration/career.mdx`：写应用型 AI 工程师/FDE 迁移价值。
  - `content/papers/2606.07297-swe-explore-repo-exploration/metadata.json`：写索引元数据，冷审待人。
  - `data/autosci/primitives/2606.07297.yaml`：写 AI-only 原语。
  - `task-board.md`：新增/更新 PAPER-2606.07297 任务态势。
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/columns/papers/build-index.mjs`
  - `node scripts/validate-papers-deepread.mjs`
  - `npm run verify`
- 内容门（独立 agent + rubric）：
  - 本轮作者稿完成后保持 `cold_audit.status="needs_human"`，不自审放行。
  - 后续由独立冷审按 canonical 检查忠实性、可教性、数字与来源对账。
- 成功指标（真正证明“做对了”的 holdout/查询）：
  - 读者能从 Paper 栏清楚复述：SWE-Explore 的输入/输出、ground truth 怎么来、三类评估维度、主要实验结论、为什么 line-level/ranking 仍是难点。
  - Career 栏能转成一个可做作品：repository exploration evaluator / context budget optimizer / issue-to-code-region localizer。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - Web：核验 arXiv、HF 页面、必要的前向脉络。
  - Shell：下载/抽取论文全文、clone GitHub 仓库、读取源码/数据、跑校验。
  - `npm run kg:research -- "SWE-Explore coding agents repository exploration benchmark"`：Mind Palace 背景召回，仅作定位，不当本文事实来源。
  - `apply_patch`：写入/修改仓库文件。
- 是否新增依赖：不新增。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控够不够：作者稿由 Codex 单主控完成；冷审另起独立 agent，不在本轮自审。
- 不上 LangGraph/CrewAI/AutoGen。
- 子 agent 派发表：
  - 本轮不派审稿子 agent；按规则只把作者稿置为 `needs_human`，等待独立冷审。
- 是否用 dynamic workflow：否，本次是单篇深读作者稿。

## 7. 切片（每片=可运行交付）
- 片 1：计划与资料收集，完成全文/源码实读笔记。
- 片 2：写四个目标文件与 task-board。
- 片 3：跑 build-index、validate、verify，按错误修复。
- 每片的“可运行、Kevin 能看到”是什么：最终在本地内容目录和索引中可看到该论文深读，但因冷审门不会自动发布为 ready。

## 8. 风险 / 回退
- 风险点：
  - PDF/HTML 表格抽取可能丢数字；表格数字必须以原文表为准，不臆造。
  - GitHub README 自称与源码实际结构可能不一致；需分开标注。
  - 后续演化若缺可核验前向文献，降级为低置信或写“数据不足”。
- 回退方式（保留上一版）：
  - 该目录为新产物，若校验无法通过可移除新目录和 primitive；不触碰既有论文内容。
