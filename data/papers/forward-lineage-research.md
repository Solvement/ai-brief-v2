> **研究草稿 — 待人工审核，未发布。** 所有声明均附来源；无来源处标注"数据不足/未确认"。置信度高=已核实（多源交叉/全文）；中=部分核实（摘要/间接引用）；低=推测/单源。
> 
> 生成日期：2026-06-05。覆盖时间窗：2024-01 至 2026-06。

---

# Forward-Lineage Research: 六篇 Agent 论文的方法后续

## 1. MetaGPT (2308.00352) — SOP 驱动多智能体 + 共享消息池

### Forward-Edge Table

| target_work | edge_type | what_changed | evidence_url | confidence |
|---|---|---|---|---|
| **AFlow** (2410.10762, ICLR 2025 Oral) | optimized_by | 用 Monte Carlo Tree Search 自动搜索+优化 agentic workflow，取代 MetaGPT 的手工 SOP；在 HumanEval 上比人工设计 workflow 提升 5.7% 均值，并超越 MetaGPT 等手工框架；GPTSwarm 因图结构限制难以表达条件状态，AFlow 通过代码表示的 workflow 空间解决这一问题 | https://arxiv.org/abs/2410.10762 | 高 |
| **MetaAgent** (2507.22606, Jul 2025) | optimized_by | 指出 MetaGPT 固定线性 SOP 结构无法回溯；用有限状态机（FSM）自动构建多智能体系统，声称在软件开发任务上超越 MetaGPT 等手工设计框架 | https://arxiv.org/html/2507.22606v1 | 中 |
| **MetaGen** (2601.19290, Jan 2026) | optimized_by | 直接引用 MetaGPT；核心批评：MetaGPT 角色和拓扑均固定，MetaGen 在推理时自适应角色+拓扑，无需训练；在代码生成和多步推理基准上超越 MetaGPT 和 GPTSwarm 等强基线 | https://arxiv.org/abs/2601.19290 | 高 |
| **SELA** (2410.17238, Oct 2024, MetaGPT团队) | extended_by | 同一团队延伸 MetaGPT；将 MCTS 引入 AutoML pipeline 配置搜索，MetaGPT 框架直接承载 | https://github.com/FoundationAgents/MetaGPT/tree/main/metagpt/ext/sela | 高 |
| **Data Interpreter** (2402.18679, Feb 2024, MetaGPT团队) | extended_by | 同一团队延伸，将 MetaGPT 架构应用于数据科学任务；动态分层图结构规划 + 工具动态集成 + 经验记录；在 InfiAgent-DABench 上提升 25%（75.9%→94.9%） | https://arxiv.org/abs/2402.18679 | 高 |
| **SPO** (2502.06855, Feb 2025, MetaGPT团队) | extended_by | 同一团队延伸；自监督 Prompt 优化，不依赖外部标注；成本仅为现有方法 1.1%–5.6%，性能持平或更优 | https://arxiv.org/abs/2502.06855 | 高 |
| **MacNet** (2406.07155, Jun 2024, ChatDev团队) | extended_by | 不直接继承 MetaGPT，但在同一赛道：将链式拓扑推广为有向无环图，支持 1000+ 智能体协作；与 MetaGPT 并列为该赛道重要基线 | https://arxiv.org/abs/2406.07155 | 中 |

### 这方法后来怎样了

MetaGPT 的核心贡献——手工编写 SOP 驱动多智能体流水线——在 2024–2025 年快速转向**自动化工作流搜索/优化**范式。同一团队于 2024 年 10 月推出 AFlow（ICLR 2025 Oral），用 MCTS 在代码表示的 workflow 空间中搜索最优流程，平均超越人工设计方法 5.7%；手工 SOP 被视为"人力成本高、泛化弱"的次优方案。第三方工作（MetaGen 2601.19290）在 2026 年 1 月直接用实验数字说明 MetaGPT 的固定角色/拓扑设计在 HumanEval 上低于动态方法 25+ 个百分点。MetaGPT 目前仍是软件开发多智能体任务的**标准基线**，但不再被视为 SOTA 方法。

---

## 2. GPTSwarm (2402.16823) — 智能体为可优化计算图，节点+边 REINFORCE 优化

### Forward-Edge Table

| target_work | edge_type | what_changed | evidence_url | confidence |
|---|---|---|---|---|
| **DynaSwarm** (2507.23261, Jul 2025) | optimized_by | 直接引用 GPTSwarm；指出 REINFORCE 方差大、不稳定；用 Advantage Actor-Critic (A2C) 替代；增加 graph selector 按输入动态选择图结构（GPTSwarm 固定单一图）；多 LLM 骨干上超越 GPTSwarm | https://arxiv.org/html/2507.23261v1 | 高 |
| **Graph-GRPO** (2603.02701, Mar 2026) | optimized_by | 引用 GPTSwarm；在 REINFORCE 类方法基础上用 Group Relative Policy Optimization 采样一组多样通信图，计算边的相对优势，消除任务难度噪声；6 个基准上超越 EIB-LEARNER（最强基线），平均 92.45% vs 91.38%；训练更稳定 | https://arxiv.org/abs/2603.02701 | 高 |
| **MetaGen** (2601.19290, Jan 2026) | optimized_by | 直接在实验表中对比 GPTSwarm；MetaGen 在 HumanEval 上 95.1% vs GPTSwarm 69.6%（+25.5%），MMLU 上 93.5% vs 60.1%（+33.4%）；推理 token 减少 85.7% | https://arxiv.org/html/2601.19290v1 | 高 |
| **MacNet** (2406.07155, Jun 2024) | extended_by | 与 GPTSwarm 同期探索图拓扑；MacNet 对比了 GPTSwarm 作为基线；方向互补（GPTSwarm 优化边权，MacNet 研究大规模 DAG 拓扑缩放） | https://arxiv.org/abs/2406.07155 | 中 |
| **MASS / Multi-Agent Design** (2502.02533, Feb 2025) | optimized_by | 三阶段优化（块级 prompt + workflow 拓扑 + 全局 prompt），声称"大幅超越现有方案"；GPTSwarm 使用策略梯度优化节点连接，MASS 同时优化 prompt 和拓扑 | https://arxiv.org/abs/2502.02533 | 中 |
| **AFlow** (2410.10762, ICLR 2025 Oral) | optimized_by | 间接关系：AFlow 指出 GPTSwarm 因图结构限制难以表达条件状态；AFlow 用代码表示 workflow 空间规避此限制 | https://arxiv.org/abs/2410.10762 | 中 |

### 这方法后来怎样了

GPTSwarm 的核心创新——用 REINFORCE 优化智能体计算图的边连接——已被后续研究明确识别为瓶颈：**高方差、不稳定、难以泛化至不同输入**。2025–2026 年出现两条改进路线：一是算法层面，用 A2C（DynaSwarm）或 GRPO（Graph-GRPO）替代 REINFORCE 以稳定训练；二是范式层面，彻底放弃静态优化图，转向推理时动态生成角色+拓扑（MetaGen），在标准基准上取得 25–33 个百分点的大幅领先。GPTSwarm 目前仍是多智能体图拓扑优化赛道的**重要基线**，但核心 REINFORCE 优化方案已被更稳定方法取代。

---

## 3. Agent-as-a-Judge (2410.10934) — 模块化智能体评估智能体轨迹

### Forward-Edge Table

| target_work | edge_type | what_changed | evidence_url | confidence |
|---|---|---|---|---|
| **A Survey on Agent-as-a-Judge** (2601.05111, Jan 2026) | extended_by | 以原始论文为基础定义整个"Agent-as-a-Judge"概念演化史；梳理了从单模型评判到动态多智能体辩论框架的演化路径，覆盖 VerifiAgent、FACT-AUDIT、CompassVerifier、xVerify 等后续工作 | https://arxiv.org/html/2601.05111v1 | 高 |
| **When AIs Judge AIs** (2508.02994, Aug 2025) | extended_by | 综述性扩展：梳理 agent 评判范式的演化，从单一模型到多智能体辩论框架；分析偏差、鲁棒性与元评估挑战 | https://arxiv.org/abs/2508.02994 | 高 |
| **Multi-Agent-as-Judge / MAJ-EVAL** (2507.21028, Jul 2025) | optimized_by | 扩展为多智能体评判：自动从相关文本构建多维度评估者角色；声称比 LLM-as-a-Judge 和单一 Agent-as-a-Judge 更接近人类专家评分 | https://arxiv.org/abs/2507.21028 | 中 |
| **Auto-Eval Judge** (2508.05508, Aug 2025) | optimized_by | 声称是更通用的任务完成评估智能体框架，基于 Agent-as-a-Judge 思路泛化到更广任务类型 | https://arxiv.org/html/2508.05508v1 | 中 |
| **DRIFT** (2606.02060, Jun 2026) | extended_by | 未直接引用 Agent-as-a-Judge，但共享"用智能体审计智能体轨迹"的核心思路；DRIFT 专注深度研究轨迹的声明级错误定位（claim-centric），粒度更细 | https://arxiv.org/html/2606.02060v1 | 中 |

### 这方法后来怎样了

Agent-as-a-Judge（ICML 2025 发表）确立了"用智能体评估智能体"的新范式，**已成为 2025–2026 年 agentic 评估的标准框架术语**。后续工作沿两个方向延伸：一是多智能体化（Multi-Agent-as-Judge，引入多维评估专家角色，对齐人类评分），二是领域化扩展（代码、事实核查、数学等）。截至 2026-06，有两篇专门综述（2601.05111、2508.02994）以其为中心梳理整个评估演化史，说明其**已成为该赛道的奠基性参考点**，而非被替代。

---

## 4. A Survey of Self-Evolving Agents (2507.21046) — What/When/How/Where 分类体系

### Forward-Edge Table

| target_work | edge_type | what_changed | evidence_url | confidence |
|---|---|---|---|---|
| **自身多版本迭代** (v1→v4, Jul 2025→Jan 2026) | extended_by | 同一论文持续更新，v4 于 2026-01-16 发布，最终发表于 Transactions on Machine Learning Research (TMLR 01/2026) | https://arxiv.org/abs/2507.21046 | 高 |
| **A Comprehensive Survey of Self-Evolving AI Agents** (2508.07407, Aug 2025) | extended_by | 一个月后出现的平行综述，来自不同机构（Glasgow/Sheffield/MBZUAI）；四组件优化环视角（system input → agent system → environment → optimizer）与 2507.21046 的 What/When/How/Where 框架互补；两者均为正在成熟领域的独立定义尝试 | https://arxiv.org/abs/2508.07407 | 高 |
| **Darwin Gödel Machine** (2505.22954, May 2025) | extended_by | 实现了 2507.21046 所归纳的"整体自进化"——系统修改自身代码以成为更好的编程智能体；树状归档结构，新代码只有实证超越祖先才被录入 | https://arxiv.org/abs/2505.22954 | 中 |
| **SPO** (2502.06855, Feb 2025) | extended_by | 被 2507.21046 v4 列为 prompt 进化的代表实现（MetaGPT 团队，TMLR 数据库引用） | https://arxiv.org/abs/2502.06855 | 中 |
| **Awesome-Self-Evolving-Agents 仓库** | extended_by | XMUDeepLIT 维护的社区论文列表，以 2507.21046 为核心组织框架，持续更新 | https://github.com/XMUDeepLIT/Awesome-Self-Evolving-Agents | 中 |

### 这方法后来怎样了

2507.21046 作为**第一篇系统综述**自进化智能体领域，于 2026 年 1 月以 v4 定稿发表在 TMLR。由于是综述而非新方法，"forward lineage"体现为：(1) 学界接受其 What/When/How/Where 四维分类框架为该领域标准术语；(2) 一个月内出现平行综述 2508.07407 采用不同切入角度（四组件环），两者并列为该领域两篇主要综述；(3) 被引 agent 系统研究普遍参照此框架定位自身贡献位置。该综述目前仍是 **still_standard_baseline（分类参考框架）**，无替代迹象。

---

## 5. Comprehensive Self-Evolving Agents Survey (2508.07407) — 四组件优化环

### Forward-Edge Table

| target_work | edge_type | what_changed | evidence_url | confidence |
|---|---|---|---|---|
| **自身 v2 更新** (Aug 31, 2025) | extended_by | v2 于 2025-08-31 发布，扩充覆盖范围 | https://arxiv.org/abs/2508.07407 | 高 |
| **与 2507.21046 的关系** | extended_by | 两者平行互补：2508.07407 用四组件环（系统输入→智能体系统→环境→优化器）作为统一抽象，视角更系统工程化；2507.21046 更聚焦演化维度的 taxonomy | https://arxiv.org/abs/2507.21046 | 高 |
| **Microsoft SkillOpt** (2025-2026) | extended_by | 实现了四组件环中的 skill 进化路径（技能自优化智能体）；与 2508.07407 框架契合度高 | https://explainx.ai/blog/microsoft-skillopt-self-evolving-agent-skills-optimization-2026 | 低 |

### 这方法后来怎样了

2508.07407 是 preprint，截至本文（2026-06）尚无正式发表信息，仍在 arXiv 阶段（v2 止于 2025-08-31）。其四组件优化环是一个统一描述框架，被后续工作隐式参照（如各种 self-evolving 系统均可套入"input→agent→env→optimizer"循环），但尚未形成与 2507.21046 TMLR 版本同等级别的引用积累。**数据不足/未确认**：目前未发现明确引用 2508.07407 并声称改进其框架的 2025-2026 论文。

---

## 6. DRIFT (2606.02060) — 深度研究智能体轨迹的 Span 级错误定位

### Forward-Edge Table

| target_work | edge_type | what_changed | evidence_url | confidence |
|---|---|---|---|---|
| **TRACE** (2602.21230, WWW 2026) | still_standard_baseline | DRIFT 的先行工作之一；TRACE 提出轨迹效用函数评估过程效率+证据基础，与 DRIFT 的声明级审计互补；TRACE 更关注整体效用打分，DRIFT 更聚焦于具体 span 的错误归因 | https://arxiv.org/abs/2602.21230 | 高 |
| **TRAIL** (2505.08638, 2025) | still_standard_baseline | DRIFT 引用的先行工作；148 条人工标注轨迹 + 错误分类体系；DRIFT 在更长、更嘈杂的深度研究轨迹上扩展了类似方法 | https://arxiv.org/pdf/2505.08638 | 高 |
| **AgentRx** (2602.02475, 2026) | still_standard_baseline | DRIFT 引用；给定领域策略+工具模式+失败轨迹，输出关键失败步骤和失败类别；与 DRIFT 专注于深度研究声明链有所不同 | https://arxiv.org/abs/2602.02475 | 高 |
| **"Why Your Deep Research Agent Fails"** (2601.22984, 2026) | extended_by | 平行工作，关注深度研究全轨迹的幻觉评估；与 DRIFT 形成互补（幻觉来源 vs 声明传播链错误） | https://arxiv.org/html/2601.22984v1 | 中 |
| **DRIFT 本身 (v1, Jun 2026)** | still_sota（细分赛道） | DRIFT 是首个专门针对深度研究轨迹（longer + noisier，区别于编码/数学轨迹）的声明级多智能体审计框架；声明与 TRACE/TRAIL/AgentRx 互补而非替代 | https://arxiv.org/html/2606.02060v1 | 高 |

### 这方法后来怎样了

DRIFT 于 2026-06-01 发布，是极新的工作（v1 唯一版本），**尚无明确的 forward edge**（即尚无发表的论文引用并扩展 DRIFT）。其所在领域——深度研究智能体轨迹评估——是 2025–2026 年快速成长的子赛道，TRACE（WWW 2026）、TRAIL（2025）、AgentRx（2026）等是先行/并行工作，而非后续。DRIFT 的核心创新（声明级审计而非 span 独立打分，声明传播链追踪）在该赛道目前仍是 **still_sota**（细分：深度研究轨迹的 claim-centric 审计），但由于论文刚发布，真正的前向传播尚未发生。

---

## 汇总：确认最强的 Forward Edge

| paper | 最强 forward edge | 置信度 |
|---|---|---|
| MetaGPT (2308.00352) | AFlow (2410.10762) 自动 MCTS 搜索取代手工 SOP，同团队出品，ICLR 2025 Oral | 高 |
| MetaGPT (2308.00352) | MetaGen (2601.19290) 在 HumanEval 上超出 MetaGPT 25+ pp，直接实验对比 | 高 |
| GPTSwarm (2402.16823) | MetaGen (2601.19290) 超出 GPTSwarm 25.5pp(HumanEval)/33.4pp(MMLU)，token 减少 85.7% | 高 |
| GPTSwarm (2402.16823) | Graph-GRPO (2603.02701) 用 GRPO 替代 REINFORCE，稳定拓扑学习 | 高 |
| GPTSwarm (2402.16823) | DynaSwarm (2507.23261) 用 A2C 替代 REINFORCE + 动态图选择器 | 高 |
| Agent-as-a-Judge (2410.10934) | 两篇专门综述（2601.05111, 2508.02994）以其为中心定义整个"Agent 评判"赛道 | 高 |
| 2507.21046 | 发表于 TMLR (Jan 2026)，成为领域标准分类框架 | 高 |
| DRIFT (2606.02060) | 2026-06 新作，无已发表的 forward edge，自身是 still_sota | 高 |
