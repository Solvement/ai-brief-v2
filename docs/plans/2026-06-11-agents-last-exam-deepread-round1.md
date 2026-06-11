# Plan: Agents' Last Exam 深读第 1 轮 (PAPER-2606.05405)

> 触发：本轮重写 `paper.mdx` / `career.mdx` / `metadata.json` / AutoSci primitive，预计 >100 行，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：按 canonical 论文范式，把 Agents' Last Exam 写成可进入 AI-Brief 的深读资产，核心判断落在“经济价值长程工作流评测 + 确定性自动验证 + 当前 agent 专业工作流能力缺口”。
- **小方向**：
  - 读 arXiv HTML/PDF 全文、HF 页面、项目官网与 `rdi-berkeley/agents-last-exam` 源码，不只看摘要。
  - 从头重写 `content/papers/2606.05405-agents-last-exam/{paper.mdx,career.mdx,metadata.json}`。
  - 重写 `data/autosci/primitives/2606.05405.yaml`，含 `core_concepts` 与 `discovery_trace: 数据不足`。
  - 区分论文自报、官网/README 自称、源码实读；数字集中到实验节。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 中文深读符合 `docs/paradigms/papers.md`：一句话、问题、立场、术语、方法、Mermaid、创新、实验、别被带偏、限制、先读、技术细节、后续演化。
  - `career.mdx` 面向应用型 AI 工程师/FDE，给技能、系统设计心法、作品集、可造项目、简历句、学习清单。
  - `metadata.json` 含 8 维 scores、`human_tabs:["paper","career"]`、source_rankings、tags、`status:"deep_read"`、`cold_audit.status:"needs_human"`。
  - AutoSci primitive 可被 YAML validator 解析，有可迁移设计原则。
- 非目标：
  - 不改论文范式、schema、路由、前端。
  - 不把 ALE 夸成已证明经济替代率；只报告作者自报评测结果与源码可见实现。
- 影响范围：
  - 内容资产：`content/papers/2606.05405-agents-last-exam/`。
  - AI-only 原语：`data/autosci/primitives/2606.05405.yaml`。
  - 索引：跑 `build-index.mjs` 更新 `public/data/papers-index.json`。
- 验收标准：
  - `node scripts/validate-papers-deepread.mjs` 通过。
  - `npm run verify` 通过或明确报告非本次引入的失败。

## 3. 方案（怎么做）
- 改动点：
  - 重写 `paper.mdx`：以 ALE 的 benchmark 设计、GCUA、三组件解耦、确定性评分、实验证据为主线。
  - 重写 `career.mdx`：把 ALE 转成 FDE 可学的“可验证任务设计/评测壳”方法。
  - 重写 `metadata.json`：补官方 URL、代码 URL、HF 热度、scores 与 tags。
  - 重写 `data/autosci/primitives/2606.05405.yaml`：沉淀 verifiable economic workflow benchmark 原语。
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门：`node scripts/validate-papers-deepread.mjs`、`npm run verify`。
- 内容门：本轮作为作者稿，`cold_audit.status="needs_human"`，不自审放行。
- 成功指标：正文数字均可回溯到论文/官网/源码；未披露处标“原文未明确 / 数据不足 / 以原文表为准”。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本：
  - Web：arXiv、HF、项目官网、GitHub 页面。
  - Shell：clone 源码、读取 PDF/HTML/TeX、跑验证脚本。
  - Mind Palace：`npm run kg:research -- "Agents' Last Exam ..."`。
- 是否新增依赖：不新增。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控执行作者稿；不启动新框架。
- 独立冷审不由本 agent 自审，metadata 保持 `needs_human`。
- 本轮不使用子 agent；原因：用户明确指定 codex 作者第 1 轮，且当前环境没有可调用独立冷审 agent 配额保证。

## 7. 切片（每片=可运行交付）
- 片 1：资料获取与源码实读，形成证据笔记。
- 片 2：重写四个目标文件。
- 片 3：build-index、validate、verify，修复格式/校验问题。

## 8. 风险 / 回退
- 风险点：
  - PDF/HTML 表格抽取可能丢细节；逐格数值以原文表为准。
  - 代码仓库可能只发布 benchmark harness 而非完整私有任务池；需区分源码可见与论文自报。
  - 现有未跟踪草稿可能来自其他流程；本轮重写目标文件但不碰无关未跟踪内容。
- 回退方式：
  - Git 未跟踪旧稿已先读；如需回退可从命令输出/工作树历史恢复，但本轮不使用 `git reset` 或破坏性命令。
