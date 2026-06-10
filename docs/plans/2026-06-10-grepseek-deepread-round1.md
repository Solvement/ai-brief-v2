# Plan: GrepSeek 深读第 1 轮重写 (DEEPREAD-2605.29307-R1)

> 触发：本次会重写 `paper.mdx`、`career.mdx`、`metadata.json` 与 AutoSci primitive，超过 100 行，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：把 GrepSeek 作为 AI-Brief 学术栏的高质量深读资产，服务“Information → Judgment → Action”：先给判断，再给可迁移的训练/检索/执行层方法。
- **小方向**：
  - 从 arXiv 全文和源码仓库重读，不只依赖摘要、旧稿或 README。
  - 人读 tab 保持 `paper` / `career` 两栏，结构仿 `2606.02060-drift-agent-error-localization`。
  - 数字、实验结论、工程细节必须能追到论文全文或源码；表格抽不准时显式标“以原文 Table 为准”。
  - AutoSci primitive 只写入 `data/autosci/primitives/2605.29307.yaml`，不进入人读 tab。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 重写 `content/papers/2605.29307-grepseek-dci-search-agent/{paper.mdx,career.mdx,metadata.json}`。
  - 重写 `data/autosci/primitives/2605.29307.yaml`。
  - 必要时更新 `data/papers/ledger.jsonl` 中该 arXiv 的状态/notes，保持 `deep_read`。
- 非目标：
  - 不改上游 SPEC / 范式文档 / 校验 schema。
  - 不发布、不 commit、不 push。
  - 不训练或复现实验；只做全文与源码层面的忠实深读。
- 影响范围（模块/数据/路由/用户）：
  - 学术内容数据：`content/papers/...`。
  - AI-only primitive：`data/autosci/primitives/...`。
  - 账本：`data/papers/ledger.jsonl` 单条记录。
- 验收标准（可观察）：
  - 文件结构与金样一致：一句话、问题、术语、核心方法、Mermaid、创新点表、实验证据、限制风险、先读什么；Career 含 FDE/AI 工程师价值、技能、系统设计、作品集、可造表、简历句、学习清单。
  - `metadata.json` 含 8 维 scores、`one_sentence_judgment`、`human_tabs:["paper","career"]`、`source_rankings`、tags、`status:"deep_read"`。
  - `node scripts/columns/papers/build-index.mjs` 与 `node scripts/validate-papers-deepread.mjs` 通过；尽量跑 `npm run verify`。

## 3. 方案（怎么做）
- 改动点：
  - `content/papers/2605.29307-grepseek-dci-search-agent/paper.mdx`
  - `content/papers/2605.29307-grepseek-dci-search-agent/career.mdx`
  - `content/papers/2605.29307-grepseek-dci-search-agent/metadata.json`
  - `data/autosci/primitives/2605.29307.yaml`
  - `data/papers/ledger.jsonl` 中 `2605.29307` 单行（如 notes/scores 需同步）
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/columns/papers/build-index.mjs`
  - `node scripts/validate-papers-deepread.mjs`
  - `npm run verify`（若因非本次问题失败，记录失败原因）
- 内容门（独立 agent + rubric）：
  - 本轮不自审放行；`metadata.cold_audit.status` 保持 `needs_human`，交由后续冷审门处理。
- 成功指标：
  - 全文与源码要点都被覆盖：训练数据合成、SFT/GRPO、DCI 执行引擎、实验/消融/效率、源码真实结构。
  - 自报/实测分开，弱点不遮掩。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - `curl`/arXiv HTML/PDF 获取全文；必要时用 `scripts/columns/papers/sources.mjs` 抽取 PDF 文本。
  - `git clone https://github.com/alirezasalemi7/grepseek` 到临时目录并用 `rg`/文件读取检查源码。
  - Node 校验脚本。
- 是否新增依赖：不新增。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控完成全文阅读、源码阅读与写作；不引 LangGraph/CrewAI/AutoGen。
- 高风险内容不自审放行：通过 `cold_audit.needs_human` 交给独立冷审流程。
- 不使用子 agent；本环境未提供可直接复用的独立审稿 agent，且本轮用户要求只落盘第 1 轮稿。

## 7. 切片（每片=可运行交付）
- 片 1：资料获取与证据摘录：arXiv 全文、HF 信息、GitHub 源码结构。
- 片 2：重写四个目标文件与账本单行。
- 片 3：build-index + validate + verify，修复结构/编码问题。
- 每片的“可运行、Kevin 能看到”：目标目录文件可被本地索引与校验脚本识别。

## 8. 风险 / 回退
- 风险点：
  - arXiv HTML/PDF 表格抽取可能丢数字；逐格结果不强行补。
  - 旧稿已存在，重写可能覆盖已有表达；按用户“从头写”授权处理。
  - `npm run verify` 可能因既有 unrelated 内容/网络/环境失败。
- 回退方式：
  - git 中保留旧版本；本次只覆盖目标文件，不做全局重构。
