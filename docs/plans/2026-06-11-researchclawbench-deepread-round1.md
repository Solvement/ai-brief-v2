# Plan: ResearchClawBench 深读第 1 轮 (PAPER-2606.07591)

> 触发：重写 `paper.mdx` / `career.mdx` / `metadata.json` / AutoSci primitive，总改动 >100 行。按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：按 canonical 论文范式把 ResearchClawBench 写成 AI-Brief 可收录的深读资产，核心沉淀“隐藏目标论文 + 专家加权 rubric + 50=复现线”的开放式科研 agent 评测范式，并诚实校准当前自主科研 agent 的真实能力边界。
- **小方向**：
  - 读 arXiv v2 全文（HTML/PDF/TeX 至少一种完整来源）与 HF 页面，数字只取全文或可核验页面。
  - clone 并实读 `InternScience/ResearchClawBench` 仓库源码/README/数据结构，区分 README/项目自称与源码实读。
  - 重写 `content/papers/2606.07591-researchclawbench-autonomous-research/{paper.mdx,career.mdx,metadata.json}`。
  - 重写 `data/autosci/primitives/2606.07591.yaml`，包含 KG-2 `core_concepts` 与 `discovery_trace`。
  - metadata 保持 `status:"deep_read"`，`cold_audit.status:"needs_human"`，不越过冷审门。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 全中文人读解读，保留必要英文术语、数字、代码名。
  - `paper.mdx` 按 `docs/paradigms/papers.md`：一句话、问题、立场、术语、核心方法、Mermaid、创新点、实验数字、别被带偏、限制、先读、技术细节、后续演化。
  - `career.mdx` 面向应用型 AI 工程师/FDE：价值、技能、系统设计心法、作品集、可造表、简历句、学习清单。
  - AutoSci primitive 面向 L1/L3：可复用评测模式、模块映射、小实验、风险。
- 非目标：
  - 不发布、不提交、不改论文范式。
  - 不新增依赖，不改前端路由、schema 或管线逻辑。
  - 不把 ResearchClawBench 写成“解决自主科研”的方法论文；它主要是 benchmark。
- 影响范围（模块/数据/路由/用户）：
  - 内容资产：目标 paper 目录与 `data/autosci/primitives/2606.07591.yaml`。
  - 账本若需同步，仅更新该 arXiv 记录的 notes/status，不改字段形状。
  - `public/data/papers-index.json` 可由 build-index 刷新，但冷审门仍应阻止未审稿上线。
- 验收标准（可观察）：
  - 所有关键数字能回指 arXiv v2/HF/源码或明确标“自报/数据不足”。
  - Mermaid 围栏配平，JSON/YAML 可解析。
  - `node scripts/validate-papers-deepread.mjs` 通过；可行时跑 `npm run verify`。

## 3. 方案（怎么做）
- 改动点：
  - `content/papers/2606.07591-researchclawbench-autonomous-research/paper.mdx`：从头重写为 canonical 结构，补 v2 作者/版本、源码实读、数据集/任务文件证据。
  - `content/papers/2606.07591-researchclawbench-autonomous-research/career.mdx`：重写职业价值与可造项目，避免直接给部署命令。
  - `content/papers/2606.07591-researchclawbench-autonomous-research/metadata.json`：修正作者全量/日期/v2、source_rankings、scores、tags、cold_audit。
  - `data/autosci/primitives/2606.07591.yaml`：重写原语与 KG-2 字段，复用概念词表中“自进化 agent”等既有名。
  - `data/papers/ledger.jsonl`：如内容显著变化，同步 notes。
- 数据契约/schema 变化：无。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/columns/papers/build-index.mjs`
  - `node scripts/validate-papers-deepread.mjs`
  - `npm run ops:baseline:diff`
  - 可行时 `npm run verify`
- 内容门（独立 agent + rubric）：
  - 本轮作者稿不自审，metadata 标 `needs_human`；后续由独立冷审 agent 对照全文/源码开卷核查。
- 成功指标（真正证明“做对了”的 holdout/查询）：
  - 读者能复述：RCBench 怎么出题、怎么判分、为什么 50 是复现线、当前最好系统差在哪里、源码仓库实际开放了什么。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - `web.open/search` 核验 arXiv/HF/GitHub 页面。
  - PowerShell + `git clone`/`rg`/`Get-Content` 读本地 TeX/PDF/源码。
  - `npm run kg:research` 做 Mind Palace Recall/Contest。
  - `apply_patch` 落盘编辑。
- 是否新增依赖：否。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控完成作者稿；不引 LangGraph/CrewAI/AutoGen。
- 独立冷审本轮不由当前 agent 执行，交由后续 cold-audit 流水线或独立 agent。
- 子 agent 派发表：无即时派发；但交付态标记 `cold_audit.status=needs_human`。

### Mind Palace Recall / Contest / Synthesis / Evolution actions
- **Recall**：召回 `ai-scientist-v2`、`memoryagentbench`、`self-evolving-agents-survey`、`metagpt` 等，相关性集中在科研 agent、评测、角色化流程、自进化。
- **Contest**：RCBench 与 AI-Scientist-v2/MetaGPT 类“建造科研 agent”不同，它不提供新 agent 架构，而提供开放式产出的评测尺；与 MemoryAgentBench 类窄域 benchmark 相比，它覆盖端到端科研，但样本更少、终点评分更粗。
- **Synthesis**：正文应把它定位成 L3 研究 agent 的“现实校准器/考卷”，可迁移到 AI-Brief 冷审门的 hidden-reference weighted-rubric 设计；不应夸成“解决自主科研”。
- **Evolution actions**：
  - delete：删掉“报告写得漂亮=科研能力强”的隐含假设。
  - replace：用“隐藏目标 + 加权可验证子项 + 复现线”替代整体印象打分。
  - optimize：本站深读冷审可从整体审稿优化为 claim/rubric 逐项核。
  - add：为开放式深读/研究报告建立小规模 hidden-rubric 回归集。

## 7. 切片（每片=可运行交付）
- 片 1：全文/源码证据包就绪，确认旧稿哪些数字需要修正。
- 片 2：四个目标文件重写落盘。
- 片 3：build-index + validate/verify，修到机器门可过。
- 每片的“可运行、Kevin 能看到”是什么：最终在目标目录看到四个内容资产，索引可重新生成但未过冷审不发布。

## 8. 风险 / 回退
- 风险点：
  - arXiv HTML/PDF/TeX 表格抽取可能丢数字；逐格表值若不能核全，标“以原文表为准”。
  - GitHub 仓库可能只有数据/评测壳，不等于完整论文实验流水线；需写清“源码实读”范围。
  - HF upvotes/GitHub stars 是动态数，只能标核验日或不写入关键结论。
- 回退方式（保留上一版）：
  - 本次修改在 git diff 中可见；若验证失败，可只回退目标四文件到修改前版本，不动其他任务资产。
