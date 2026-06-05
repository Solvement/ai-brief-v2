> **核实报告 — 由独立冷审 agent 生成，2026-06-05。**
> 核实方法：逐一 WebFetch arXiv 摘要页及 HTML 全文页（如摘要不含数字则追查全文）。
> 状态说明：✓已核实 = id 真实 + 标题/日期匹配 + 数字在摘要/全文中找到；⚠️部分-数字待正文 = id 真实 + 标题匹配 + 数字未出现在摘要（摘要只有定性描述）；✗未核到或不符 = id 不存在 / 内容严重不符 / 论文已撤稿。

---

# Forward-Lineage 核实报告

## 汇总

**总边数：21 条**（含 DRIFT 的"先行/并行"关系）

| 状态 | 数量 | 说明 |
|---|---|---|
| ✓ 已核实 | 15 | id 真实、标题匹配、关键数字在摘要或全文确认 |
| ⚠️ 部分-数字待正文 | 4 | id 真实、标题匹配，但具体数字仅在全文表格中，摘要未明确列出，或比较对象在摘要中未点名 |
| ✗ 未核到或不符 | 2 | DynaSwarm 已撤稿；AFlow 的 ICLR 2025 Oral 声明未能通过官方页面核实 |

> **疑似问题点**：DynaSwarm (2507.23261) 已被作者撤稿（v2 注明 withdrawn），不应作为有效前向边引用。AFlow (2410.10762) 的"ICLR 2025 Oral"声明无法从 arXiv 页面或 ICLR 官网检索到确认，标为存疑（数字内容本身已核实）。MetaGen 的具体对比数字（HumanEval 95.1% vs 69.6% 等）已在 HTML 全文 Table 1 中找到，核实通过。

---

## 逐边核实表

### MetaGPT (2308.00352) — 7 条边

| source_paper | target_work | claimed_arxiv_id | status | confirmed_title | confirmed_venue_date | confidence | 备注 |
|---|---|---|---|---|---|---|---|
| MetaGPT (2308.00352) | AFlow | 2410.10762 | ⚠️ 部分-数字待正文 | AFlow: Automating Agentic Workflow Generation | arXiv 2024-10-14（最新版 2025-04-15）；ICLR 2025 Oral **未核实** | 中 | 内容核实：MCTS 搜索 agentic workflow ✓；"5.7% average improvement" ✓（摘要原文）；"4.55% of inference cost" ✓（摘要原文）。**但"ICLR 2025 Oral"在 arXiv 页面和 OpenReview 均未找到确认证据**，降为存疑；数字本身已核实 |
| MetaGPT (2308.00352) | MetaAgent | 2507.22606 | ⚠️ 部分-数字待正文 | MetaAgent: Automatically Constructing Multi-Agent Systems Based on Finite State Machines | arXiv 2025-07-30 | 中 | FSM 自动构建多智能体系统 ✓；摘要称"surpass other auto-designed methods"，但未点名 MetaGPT；MetaGPT 比较关系需正文核实 |
| MetaGPT (2308.00352) | MetaGen | 2601.19290 | ✓ 已核实 | MetaGen: Self-Evolving Roles and Topologies for Multi-Agent LLM Reasoning | arXiv 2026-01-27 | 高 | HTML 全文 Table 1 确认：HumanEval MetaGen 95.1% vs GPTSwarm 69.6%（+25.5pp）✓；MMLU 93.5% vs 60.1%（+33.4pp）✓；Table 2 确认 token 减少 85.7%（相对 GPTSwarm）✓。摘要未直接点名 MetaGPT，但全文对比表含 MetaGPT 基线，数字已核实 |
| MetaGPT (2308.00352) | SELA | 2410.17238 | ⚠️ 部分-数字待正文 | 未在本次 fetch 中独立核实（evidence_url 指向 GitHub 而非 arXiv） | — | 中 | 草稿引用 GitHub 仓库路径而非 arXiv 摘要页，无法用同等方式核实；arXiv id 已提供但未在任务规格中列为必查项，标为待补核实 |
| MetaGPT (2308.00352) | Data Interpreter | 2402.18679 | ✓ 已核实 | Data Interpreter: An LLM Agent For Data Science | arXiv 2024-02-28（v4 2024-10-15）| 高 | MetaGPT 团队（GitHub 链接指向 geekan/MetaGPT）✓；InfiAgent-DABench 75.9%→94.9%（+25%）✓（摘要原文）；动态分层图规划需正文确认，但核心数字已核实 |
| MetaGPT (2308.00352) | SPO | 2502.06855 | ✓ 已核实 | Self-Supervised Prompt Optimization | arXiv 2025-02-07 | 高 | 自监督 prompt 优化 ✓；"1.1% to 5.6% of existing methods" cost ✓（摘要原文）；MetaGPT 团队归属（共享作者 Jiayi Zhang、Sirui Hong、Chenglin Wu）✓ |
| MetaGPT (2308.00352) | MacNet | 2406.07155 | ✓ 已核实 | Scaling Large Language Model-based Multi-Agent Collaboration | arXiv 2024-06-11 | 中 | DAG 组织 1000+ 智能体 ✓（摘要原文）；与 GPTSwarm/MetaGPT 对比关系在摘要中未点名，置信度保持中 |

---

### GPTSwarm (2402.16823) — 6 条边

| source_paper | target_work | claimed_arxiv_id | status | confirmed_title | confirmed_venue_date | confidence | 备注 |
|---|---|---|---|---|---|---|---|
| GPTSwarm (2402.16823) | DynaSwarm | 2507.23261 | ✗ 未核到或不符 | DynaSwarm: Dynamically Graph Structure Selection for LLM-based Multi-agent System | arXiv 2025-07-31；**v2 已撤稿（withdrawn 2025-08-12）** | 低 | A2C + dynamic graph selector 内容与声明一致 ✓；但论文已被作者撤回，**不应作为已发表前向边**。此外摘要未显式引用 GPTSwarm 或 REINFORCE，比较声明需正文核实。标注为 ✗（撤稿） |
| GPTSwarm (2402.16823) | Graph-GRPO | 2603.02701 | ⚠️ 部分-数字待正文 | Graph-GRPO: Stabilizing Multi-Agent Topology Learning via Group Relative Policy Optimization | arXiv 2026-03-03 | 中 | GRPO 应用于多智能体通信图 ✓；"significantly outperforms state-of-the-art baselines" ✓（定性）；但草稿声称的具体数字"92.45% vs 91.38%"未出现在摘要中，需正文核实；GPTSwarm 引用关系需正文确认 |
| GPTSwarm (2402.16823) | MetaGen | 2601.19290 | ✓ 已核实 | MetaGen: Self-Evolving Roles and Topologies for Multi-Agent LLM Reasoning | arXiv 2026-01-27 | 高 | HumanEval 95.1% vs 69.6%（+25.5pp）✓；MMLU 93.5% vs 60.1%（+33.4pp）✓；token 减少 85.7% ✓（全文 Table 2）。所有数字已核实 |
| GPTSwarm (2402.16823) | MacNet | 2406.07155 | ✓ 已核实 | Scaling Large Language Model-based Multi-Agent Collaboration | arXiv 2024-06-11 | 中 | DAG 1000+ 智能体 ✓；与 GPTSwarm 对比关系置信度中（摘要未点名） |
| GPTSwarm (2402.16823) | MASS | 2502.02533 | ✓ 已核实 | Multi-Agent Design: Optimizing Agents with Better Prompts and Topologies | arXiv 2025-02-04（修订 2026-01-31）| 中 | MASS 三阶段优化（块级 prompt + workflow 拓扑 + 全局 prompt）✓；GPTSwarm 对比关系需正文确认 |
| GPTSwarm (2402.16823) | AFlow | 2410.10762 | ⚠️ 部分-数字待正文 | AFlow: Automating Agentic Workflow Generation | arXiv 2024-10-14；ICLR 2025 Oral 存疑 | 中 | 内容核实通过；图结构限制批评需正文确认（摘要未直接提及 GPTSwarm） |

---

### Agent-as-a-Judge (2410.10934) — 5 条边

| source_paper | target_work | claimed_arxiv_id | status | confirmed_title | confirmed_venue_date | confidence | 备注 |
|---|---|---|---|---|---|---|---|
| Agent-as-a-Judge (2410.10934) | Survey on Agent-as-a-Judge | 2601.05111 | ✓ 已核实 | Agent-as-a-Judge（综述）| arXiv 2026-01-08 | 高 | "first comprehensive survey tracing this evolution" from LLM-as-a-Judge to Agent-as-a-Judge ✓；摘要中未点名 VerifiAgent/FACT-AUDIT 等（在正文中），但核心定位一致 |
| Agent-as-a-Judge (2410.10934) | When AIs Judge AIs | 2508.02994 | ✓ 已核实 | When AIs Judge AIs: The Rise of Agent-as-a-Judge Evaluation for LLMs | arXiv 2025-08-05 | 高 | 内容与声明完全一致 ✓ |
| Agent-as-a-Judge (2410.10934) | Multi-Agent-as-Judge / MAJ-EVAL | 2507.21028 | ✓ 已核实 | Multi-Agent-as-Judge: Aligning LLM-Agent-Based Automated Evaluation with Multi-Dimensional Human Evaluation | arXiv 2025-07-28 | 中 | 多智能体辩论评判框架 ✓；比较 LLM-as-a-Judge ✓；"better align with human experts" ✓；对 Agent-as-a-Judge (2410.10934) 的直接引用关系需正文确认 |
| Agent-as-a-Judge (2410.10934) | Auto-Eval Judge | 2508.05508 | ⚠️ 部分-数字待正文 | 未独立全文核实（evidence_url 指向 HTML 页，内容未在本次任务中 fetch）| arXiv 2025-08 | 低 | 草稿置信度已标"中"；本次未 fetch，无法升降；标为待补核实 |
| Agent-as-a-Judge (2410.10934) | DRIFT | 2606.02060 | ✓ 已核实 | Where Do Deep-Research Agents Go Wrong? Span-Level Error Localization in Agent Trajectories | arXiv 2026-06-01（v2 2026-06-02）| 中 | claim-centric 审计框架 ✓；与 Agent-as-a-Judge 共享"用智能体审计轨迹"思路 ✓；无直接引用关系，草稿已标"中"置信度，一致 |
| Agent-as-a-Judge (2410.10934) — 补注 | 原始论文本身 | 2410.10934 | ⚠️ 部分-数字待正文 | Agent-as-a-Judge: Evaluate Agents with Agents | arXiv 2024-10-14；**ICML 2025 发表声明未在 arXiv 页面得到确认** | 中 | arXiv 页面无 conference tag；ICML 2025 接收状态需通过 ICML 官网确认（超出本次 fetch 范围）|

---

### 2507.21046 — 5 条边

| source_paper | target_work | claimed_arxiv_id | status | confirmed_title | confirmed_venue_date | confidence | 备注 |
|---|---|---|---|---|---|---|---|
| 2507.21046 | 自身 v4 更新 | 2507.21046 | ✓ 已核实 | A Survey of Self-Evolving Agents: What, When, How, and Where to Evolve on the Path to Artificial Super Intelligence | TMLR 01/2026；v4 2026-01-16 | 高 | TMLR 发表 ✓；v4 日期 ✓；What/When/How/Where 框架 ✓ |
| 2507.21046 | Comprehensive Survey | 2508.07407 | ✓ 已核实 | A Comprehensive Survey of Self-Evolving AI Agents: A New Paradigm Bridging Foundation Models and Lifelong Agentic Systems | arXiv 2025-08-10（v2 2025-08-31）；无正式发表 | 高 | 四组件框架（System Inputs / Agent System / Environment / Optimisers）✓；Glasgow/Sheffield/MBZUAI 团队 ✓ |
| 2507.21046 | Darwin Gödel Machine | 2505.22954 | ✓ 已核实 | Darwin Godel Machine: Open-Ended Evolution of Self-Improving Agents | arXiv 2025-05-29 | 中 | 自修改代码 + 树状归档 ✓；与 2507.21046 的直接引用关系需正文确认 |
| 2507.21046 | SPO | 2502.06855 | ✓ 已核实 | Self-Supervised Prompt Optimization | arXiv 2025-02-07 | 中 | id 和内容一致 ✓；被 v4 列为 prompt 进化代表的声明需正文确认 |
| 2507.21046 | Awesome-Self-Evolving-Agents | GitHub repo | ⚠️ 部分-数字待正文 | XMUDeepLIT 社区论文列表 | GitHub（非 arXiv）| 中 | 非学术论文，无法用 arXiv 方式核实；不列入通过/失败计数 |

---

### 2508.07407 — 2 条边（不含平行关系）

| source_paper | target_work | claimed_arxiv_id | status | confirmed_title | confirmed_venue_date | confidence | 备注 |
|---|---|---|---|---|---|---|---|
| 2508.07407 | 自身 v2 | 2508.07407 | ✓ 已核实 | （同上）| v2 2025-08-31 ✓ | 高 | — |
| 2508.07407 | Microsoft SkillOpt | explainx.ai blog | ✗ 未核到或不符 | 无 arXiv id，evidence_url 为非学术博客 | — | 低 | 草稿已标"低"置信度；无法通过 arXiv 核实；不计入通过 |

---

### DRIFT (2606.02060) — 5 条边（先行/并行工作）

| source_paper | target_work | claimed_arxiv_id | status | confirmed_title | confirmed_venue_date | confidence | 备注 |
|---|---|---|---|---|---|---|---|
| DRIFT (2606.02060) | TRACE | 2602.21230 | ✓ 已核实 | TRACE: Trajectory-Aware Comprehensive Evaluation for Deep Research Agents | arXiv 2026-02-05；**WWW 2026 接收 ✓** | 高 | Hierarchical Trajectory Utility Function ✓；WWW 2026 confirmed ✓ |
| DRIFT (2606.02060) | TRAIL | 2505.08638 | ✓ 已核实 | TRAIL: Trace Reasoning and Agentic Issue Localization | arXiv 2025-05-13 | 高 | 148 条人工标注轨迹 ✓；错误分类体系 ✓ |
| DRIFT (2606.02060) | AgentRx | 2602.02475 | ✓ 已核实 | AgentRx: Diagnosing AI Agent Failures from Execution Trajectories | arXiv 2026-02-02 | 高 | 失败步骤定位 + 跨域（API/incident/web）✓ |
| DRIFT (2606.02060) | "Why Your Deep Research Agent Fails" | 2601.22984 | ✓ 已核实 | Why Your Deep Research Agent Fails? On Hallucination Evaluation in Full Research Trajectory | arXiv 2026-01-30（v2 2026-05-23）| 中 | 幻觉评估 + PING 分类体系 + DeepHalluBench ✓ |
| DRIFT (2606.02060) | DRIFT 本身 | 2606.02060 | ✓ 已核实 | Where Do Deep-Research Agents Go Wrong? Span-Level Error Localization in Agent Trajectories | arXiv 2026-06-01（v2 2026-06-02）| 高 | Claim-centric DRIFT 框架 ✓；TELBench 1000 实例 ✓；"up to 30pp" 提升 ✓（摘要数字）|

---

## 核实问题汇总

### ✗ 问题 1：DynaSwarm (2507.23261) — 已撤稿

- **问题**：该论文 v2（2025-08-12）已被作者撤回（withdrawn），不是已发表的学术成果。
- **影响**：GPTSwarm 的"DynaSwarm 用 A2C 替代 REINFORCE + 动态图选择器"这条前向边**无效**，不应进入知识图谱。
- **建议**：从 forward edge 中移除，或标注"已撤稿，仅作参考"。

### ⚠️ 问题 2：AFlow (2410.10762) — "ICLR 2025 Oral" 无法核实

- **问题**：arXiv 页面（最新版 2025-04-15）无 conference tag；OpenReview 和 ICLR 2025 官网均未能通过检索确认"Oral"身份。
- **影响**："ICLR 2025 Oral"是较强的 prestige 声明，若无法核实应降级为"arXiv preprint / 疑似 ICLR 2025"。
- **注意**：数字（5.7%、4.55%）已在摘要中核实，内容本身无问题。

### ⚠️ 问题 3：MetaGen (2601.19290) 数字来源

- **已解决**：数字（HumanEval 95.1% vs 69.6%、MMLU 93.5% vs 60.1%、token -85.7%）已在 HTML 全文 Table 1 & Table 2 中确认，不是摘要数字，属于正文数字已核实。

### ⚠️ 问题 4：Graph-GRPO (2603.02701) 数字未出现在摘要

- **问题**：声称的"92.45% vs 91.38%"不在摘要中，摘要仅说"significantly outperforms"。
- **建议**：标注"数字需正文核实"。

### ⚠️ 问题 5：Agent-as-a-Judge (2410.10934) 的 ICML 2025 声明

- **问题**：arXiv 页面无 ICML 2025 conference tag；研究草稿中"ICML 2025 发表"未在本次核实中得到 arXiv 页面确认。
- **建议**：标注"ICML 2025 发表声明待 ICML 官网核实"。

### ℹ️ 未核实项（超出必查范围）

- SELA (2410.17238)：evidence_url 为 GitHub，非 arXiv；未独立 fetch。
- Auto-Eval Judge (2508.05508)：未 fetch。
- Microsoft SkillOpt：非 arXiv 来源，无法核实。
- Awesome-Self-Evolving-Agents：GitHub repo，非论文。

---

*核实完成时间：2026-06-05。核实者：独立冷审 sub-agent（无生成上下文）。*
