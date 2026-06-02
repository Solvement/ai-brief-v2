---
content: "ai-scientist-v2"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "AI-Scientist-v2 — 深度拆解"
reasoning_trace:
  paper_type_decision: "agent_framework，因为这明确了 agent loop、tool interface、state management 等组件，且系统由多个 agent 协作完成科学发现。"
  central_contribution: "通过 agentic best-first tree search 实现了从话题到 workshop 论文的端到端自主科研，无需人类提供模板。"
  inspected:
    - "README (全文，包括安装、用法、FAQ)"
    - "artifactAudit (top_level_entries, has_src, has_tests, license 等)"
    - "bfts_config.yaml (由 README 描述)"
    - "docs/ 目录 (仅判断存在)"
  top_claims:
    - "生成首篇完全由 AI 撰写并被同行评审接受的 workshop 论文"
    - "系统能自主提出假设、运行实验、分析数据、撰写论文"
    - "移除对人类模板依赖，可跨 ML 领域泛化"
    - "树搜索结合 experiment manager 可逐步优化实验方向"
    - "需在沙箱中执行以保证安全"
  evidence_needed:
    - "论文被接收的会议程序或接收通知 (README 链接到 ICLR2025 Workshop 实验 repo，但未直接验证)"
    - "跨领域泛化的具体实例和成功率统计"
    - "安全沙箱的实际防护效果测试结果"
  main_threats:
    - "论文接收可能是 cherry-picked 的结果，不代表普遍成功率"
    - "系统泛化性仅在有限领域验证，可能过拟合于示例任务"
    - "代码执行风险未提供自动化缓解，完全依赖用户"
  transfer_decision: "复用 agentic tree search loop 与 experiment manager 的模式，但不宜直接采纳其代码执行接口，需改进安全性。"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 3
  maturity: 3
  main_risk: "代码执行无内置严格沙箱，真实部署风险高"
next_actions:
  - "clone-and-run (在 Docker 沙箱内)"
  - "read-docs (论文与博客)"
  - "extract-pattern(agentic tree search loop)"
claim_ledger:
  - claim: "已生成第一篇完全由 AI 撰写并被同行评审接受的 workshop 论文。"
    plain_english: "系统产出的论文通过了正式学术会议（ICLR Workshop）的同行评审并被接受发表。"
    source: "README 首段 & 指向 ICLR2025 Workshop 实验的链接。"
    evidence_strength: "medium"
    supports: "提供了外部链接可查看实验记录和论文副本。"
    does_not_support: "未提供直接的会议接收通知或评审意见。"
    threat: "可能只是被 workshop 接收而非主会，且可能在其他任务上成功率低。"
  - claim: "系统能自主生成假设、运行实验、分析数据、撰写科学论文。"
    plain_english: "端到端自动化，从研究想法到完整论文全流程不需要人工干预。"
    source: "README 描述核心功能。"
    evidence_strength: "medium"
    supports: "代码库提供了 ideation 和实验 pipeline 的脚本，行为与描述一致。"
    does_not_support: "没有展示生成论文的具体内容或质量评估。"
    threat: "运行时仍可能因代码错误或实验失败而中断，并非完全无人值守。"
  - claim: "相比 v1，移除了对人类作者模板的依赖，可跨 ML 领域泛化。"
    plain_english: "不再需要预先定义实验结构，能处理更广泛的机器学习研究主题。"
    source: "README 比较 v1 与 v2 部分。"
    evidence_strength: "low"
    supports: "README 提到 v2 采用模板自由方式，且树搜索支持探索。"
    does_not_support: "没有提供在不同领域（如不同 ML 任务）上的性能对比或示例。"
    threat: "泛化性可能仅在几个类似任务上被测试，读者无法验证。"
  - claim: "使用 Claude 3.5 Sonnet 实验阶段成本约 $15-$20，写作阶段约 $5。"
    plain_english: "一次完整运行的总 API 费用大约 20-25 美元。"
    source: "README FAQ 中'What is the estimated cost per experiment?'。"
    evidence_strength: "medium"
    supports: "给出具体数字和模型，且声明取决于模型。"
    does_not_support: "没有列出实际测试的用量和账单截图。"
    threat: "实际费用可能因任务复杂度、API 价格变动而偏离。"
artifact_audit:
  official_repo: "https://github.com/SakanaAI/AI-Scientist-v2"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "NOASSERTION"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## 大白话定位

**全自主科研智能体系统，通过最优优先树搜索逐步探索假设空间，自动运行实验并生成科学论文，已产出被同行评审接受的 workshop 论文。**

> 一句话:从想法到论文，一个 end-to-end agent 全包了。

## 为什么火

- 展示了 LLM 智能体在开放科学发现中的前沿应用，已产生被同行评审接受的成果。
- 采用 agentic best-first tree search 架构替代固定模板，具备跨任务泛化能力。
- 来自知名 AI 研究机构 SakanaAI，有 v1 背景，社区关注度高。
- README 详实，提供可运行的命令与配置，降低了上手门槛。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README | available | 根目录 README.md，包含安装、使用、FAQ 等完整说明。 |
| LICENSE | available | 根目录 LICENSE 文件，但为自定义许可 (AI Scientist Source Code License)，非标准 SPDX 标识， artifactAudit 显示 NOASSERTION。 |
| 源码结构 | partial | 主代码位于 ai_scientist/ 目录，但缺少标准 src/ 布局，也无 tests 目录。 |
| tests | not_found | 仓库无 tests 目录，artifactAudit 中 has_tests 为 false。 |
| docs | available | 存在 docs/ 目录，但内容仅 logo 图片。 |
| examples/CI | not_found | artifactAudit 中 has_examples 与 has_ci 均为 false。 |
| 配置文件 | available | bfts_config.yaml 配置树搜索参数，requirements.txt 列出依赖。 |
| 运行入口 | available | launch_scientist_bfts.py 为实验主入口，perform_ideation_temp_free.py 为 ideation 入口。 |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### 系统概览
AI Scientist-v2 是一个端到端的自主科研 agent 框架，包含 **ideation（想法生成）**、**experimentation（实验探索）**、**writeup（论文撰写）**与 **review（自我评审）**四个阶段。整体由 **agentic best-first tree search (BFTS)** 驱动，一个 **experiment manager agent** 决定搜索方向。

### Agent Loop（树搜索循环）
核心循环是 **最优优先树搜索**：
- **初始化**：根据 JSON 格式的研究想法创建根节点。
- **选择**：实验管理器 agent 评估当前所有叶子节点，选择最有希望的节点进行扩展（best-first）。
- **扩展**：对选中节点生成代码变体并运行实验，产出新节点。
- **停止**：达到 `steps` 上限或探索预算耗尽后停止。
- **并行**：通过 `num_workers` 参数控制并发探索路径，每个路径独立执行。

### Tool Interface（工具接口）
agent 通过以下工具与环境交互：
- **代码执行工具**：在本地 GPU 环境中运行由 LLM 生成的 Python 实验代码。
- **文献搜索工具**：通过 Semantic Scholar API 进行新颖性检查和引用收集，依赖 `S2_API_KEY`。
- **模型 API 调用**：支持 OpenAI、Gemini、Claude (via Bedrock) 等模型，作为 LLM 后端。
- **文件系统**：实验日志、模型权重、图表输出均通过文件系统管理。

### State / Memory（状态与记忆）
- **搜索树**：所有实验节点组成一棵树，每个节点包含实验代码、运行结果、评分等。树的状态持久化于实验日志目录。
- **上下文窗口**：LLM 调用时会将当前节点的历史路径与结果注入 prompt，形成短期记忆。
- **外部知识**：通过 Semantic Scholar 检索到的文献被写入论文草稿，属于外部记忆。

### Planner（规划器）
- **Ideation Agent**：根据用户提供的主题描述 Markdown，通过反复生成与反思（reflection）产生结构化研究想法列表。
- **Experiment Manager**：在树搜索中扮演 planner + critic 角色，决定扩展哪个节点、如何修改代码、何时停止并进入写稿阶段。

### Sandbox（沙盒）
README 明确警告：“This codebase will execute LLM-written code”，推荐在 **Docker 容器** 等受控环境中运行。系统本身未内建沙盒机制，依赖外部隔离。

### 安全边界
- **代码执行风险**：LLM 可能生成危险代码（如删除文件、访问网络），README 强调用户自行承担风险。
- **模型调用成本**：API 调用累积费用，需监控。
- **内容责任**：生成的论文可能包含不实信息，许可证要求强制披露 AI 参与。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 如何设计基于树搜索的 agent loop、如何将 LLM 与实验代码动态集成、如何处理自主系统产生的风险。 |
| 迁移到 AI-Brief | 可借鉴其 agent 规划和工具抽象模式，用于构建自动执行多步任务的 AI 助手。 |
| 迁移到 BriefMem | 可学习其树搜索中的状态记忆设计，用于长步骤推理任务的记忆管理。 |
| 简历故事 | 深入研究并复现该框架，可展示对 agentic 系统架构与科学自动化的理解，适合高级 AI 工程师面试。 |

## 风险

- 执行不可信 LLM 代码可能导致环境受损或数据泄露，必须严格沙箱化。
- 实验成功率依赖底层模型能力，Claude 3.5 Sonnet 成功率较高，其他模型可能失败率高。
- 成本不低：一次完整运行约 $20-25（实验+写作），规模应用费用可观。
- 论文质量难以保证，可能产生看似合理但错误的结论，需人工审查。

## Memory card

```text
problem_pattern:        开放域科学假设的自动探索与验证，需要系统性地生成、实验、评估并论文化。
architecture_pattern:   将科学发现过程建模为 agentic best-first tree search，每个节点是一次独立实验，由 experiment manager 引导搜索方向。
reusable_pattern:       基于树的 agentic 探索框架可复用至任何需要逐步实验、动态调整策略的领域（如超参数搜索、药物设计）。
risk_pattern:           自主执行 LLM 生成代码的安全与可靠性风险，以及 search budget 与成本的平衡。
similar_projects:       AI Scientist v1、AIDE (WecoAI/aideml)、AutoML 系统中的实验搜索模块。
```

可复用范式落库:[[concepts/agentic-tree-search]]、[[concepts/experiment-manager-agent]]。另见 [[content/ai-scientist-v2]]、[[claims/ai-scientist-v2-main-claim]]。
