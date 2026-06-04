---
content: "skills"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "skills — 深度拆解"
reasoning_trace:
  paper_type_decision: "该项目不是学术论文，而是实践技能集。在 triage 中被归类为 agent_framework，因为它直接扩展了编码代理的行为和能力。"
  central_contribution: "将成熟的软件工程实践系统化为可直接安装的代理技能，同时保持轻量和可改造性。"
  inspected:
    - "README.md (全文)"
    - "top_level_dirs (skills/, docs/, scripts/)"
    - "artifact audit data (stargazers, license, key files)"
  top_claims:
    - "技能通过盘问会话解决代理需求不对齐。"
    - "共享语言减少冗长并节省 token。"
    - "TDD 技能改善代码质量。"
    - "软件工程基础在 AI 辅助开发中至关重要。"
  evidence_needed:
    - "盘问技能的使用数据和效果验证（如减少返工次数）。"
    - "共享语言具体减少 token 消耗的量化数据。"
    - "TDD 技能在不同项目中的测试集案例。"
    - "架构改进技能在真实遗留系统上的影响评估。"
  main_threats:
    - "证据仅来自作者个人叙述，缺乏独立评测。"
    - "技能的效果依赖于代理底层能力（如 Claude Code、Codex），可能随模型更新而改变。"
  transfer_decision: "可复用：共享语言记忆模式、盘问对齐、交接文档。不可直接复用：特定于代理的实现细节（如 npx 安装命令）。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 4
  maturity: 5
  main_risk: "缺乏自动化测试和社区维护机制，长期可维护性不确定"
next_actions:
  - "clone-and-run"
  - "read-docs"
  - "extract-pattern(shared-language-memory)"
  - "extract-pattern(grilling-sessions)"
  - "write-deepdive"
claim_ledger:
  - claim: "The skills fix the common failure mode of misalignment between user and agent through grilling sessions."
    plain_english: "通过盘问会话，技能解决了用户和代理之间最常见的失败模式：需求不对齐。"
    source: "README: #1: The Agent Didn't Do What I Want"
    evidence_strength: "medium"
    supports: "详细描述了盘问作为对齐手段，并提供了具体命令 /grill-me 和 /grill-with-docs。"
    does_not_support: "未提供盘问如何减少不对齐的量化证据或对比实验。"
    threat: "主观经验，可能不适用于所有团队和项目类型。"
  - claim: "Shared language (CONTEXT.md) reduces agent verbosity and token usage while improving code consistency."
    plain_english: "共享语言（CONTEXT.md）减少代理的冗长和 token 使用，同时提高代码一致性。"
    source: "README: #2: The Agent Is Way Too Verbose"
    evidence_strength: "medium"
    supports: "给出了一个具体例子（materialization cascade）说明简洁性的好处，并提到 token 减少。"
    does_not_support: "没有定量数据证明 token 节省比例（仅定性描述'约75%'在 caveman 技能中，但不是针对共享语言）。"
    threat: "效果依赖于共享语言的质量和团队领域专家的一致性。"
  - claim: "The TDD skill significantly improves code quality by enforcing a red-green-refactor loop."
    plain_english: "TDD 技能通过强制执行红-绿-重构循环，显著改进代码质量。"
    source: "README: #3: The Code Doesn't Work"
    evidence_strength: "low"
    supports: "介绍了 TDD 技能的存在和其指导方针。"
    does_not_support: "无任何代码质量度量数据或案例研究。"
    threat: "代理可能无法正确实施 TDD，导致测试质量低下。"
  - claim: "Software engineering fundamentals matter more than ever in AI-powered development."
    plain_english: "在 AI 驱动的开发中，软件工程基础比以往更重要。"
    source: "README: Summary"
    evidence_strength: "medium"
    supports: "整个 README 以此为核心论点，并通过多个技能展现。"
    does_not_support: "论点本身是观点，缺乏引用或数据支持。"
    threat: "可能被误解为抵制 AI 辅助，而非合理融合。"
artifact_audit:
  official_repo: "https://github.com/mattpocock/skills"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## 大白话定位

**一套小型、可组合的编码代理技能集，用工程最佳实践解决代理开发中的对齐、沟通、反馈和架构退化问题。**

> 一句话:将软件工程纪律注入AI编码代理，让它们不再是‘氛围编码’。

## 为什么火

- 来自知名TypeScript开发者Matt Pocock的直接经验分享，信誉度高。
- 精准解决了AI编码代理的四大常见失败模式：需求不对齐、沟通冗长、代码不可用、架构退化。
- 提供可直接安装使用的技能，安装过程简单（一条命令），且兼容多种代理。
- 强调‘真实工程’而非‘氛围编码’，吸引注重代码质量的开发者。
- 集成了领域驱动设计（DDD）思想，通过共享语言减少token消耗和提升代码一致性。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README | available | README.md, 11466 字符，详细介绍动机、安装和所有技能。 |
| src | not_found | 仓库无传统 src 目录，技能以 Markdown 文件形式存放在 skills 目录中。 |
| tests | not_found | 根目录无 test/ 文件夹，无测试框架配置文件。 |
| license | available | LICENSE 文件存在，MIT 许可。 |
| docs | available | docs 目录存在，可能包含额外文档。 |
| config | partial | .claude-plugin 和 scripts 目录提供安装和集成配置，但无标准配置文件如 JSON/YAML。 |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### Agent Loop 集成
技能通过**斜杠命令**（如 `/grill-me`）注入代理的命令循环。代理识别命令后，加载对应的 `SKILL.md` 并执行其中的工作流指令。这相当于在现有代理的**工具调用层**增加了自定义行为，但技能本身不控制整体循环。

### Tool Interface（技能接口）
每个技能是一个 Markdown 文件，遵循约定：存放在 `skills/<category>/<name>/SKILL.md`。接口简洁：文件名即为命令名，文档内包含指令、参数和资源引用。安装器将技能注册到代理中，使其可被发现和调用。这种设计类似**声明式工具注册表**，无需额外代码。

### State / Memory 管理
技能利用文件系统建立**持久化记忆**：
- `CONTEXT.md`：保存共享语言和领域术语，作为**长期语义记忆**，减少后续对话的歧义和 token 消耗。
- `docs/adr/`：架构决策记录（ADR），记录重大设计决策的上下文，供代理回溯。
- **交接文档**（`/handoff`）：将当前会话压缩为结构化文档，允许其他代理接续工作，充当**会话状态快照**。
- **Triage 标签词汇表**：通过 `/setup-matt-pocock-skills` 配置，存储每个仓库的标签语义，维持一致的问题分类。

### Planner（规划阶段）
部分技能在代理生成计划前执行：
- `/grill-me` / `/grill-with-docs`：执行**需求盘问**，强制代理提问以澄清模糊点，类似规划前的**对齐检查**。
- `/to-prd` 和 `/to-issues`：将对话上下文合成为产品需求文档（PRD）或任务列表，直接生成**可执行的规划产物**。
- `/zoom-out`：要求代理解释代码时提供**系统级视角**，影响后续规划的理解基础。

### Sandbox 与安全边界
仓库不提供完整的沙箱环境，但通过以下方式构建安全边界：
- **Git 护栏**（`/git-guardrails-claude-code`）：配置钩子阻止危险命令（如 `push`, `reset --hard`），防止代理误操作。
- **可审查性**：所有技能为纯文本 Markdown，用户可自由审计和修改，降低黑箱风险。
- **无执行隔离**：技能直接操作本地环境，依赖用户的代理配置和系统权限，无额外沙箱。

### 关键模块
- **工程技能**：`diagnose` (系统化调试循环)、`tdd` (红-绿-重构)、`triage` (状态机分类)、`improve-codebase-architecture` (架构腐烂修复)、`prototype` (丢弃型原型)。
- **生产效率技能**：`caveman` (超压缩沟通，减少75% token)、`handoff` (会话交接)、`write-a-skill` (技能工厂)。
- **设置技能**：`setup-matt-pocock-skills` (项目初始化配置，统筹问题跟踪、标签、文档路径)。

### 类似项目比较
README 提及 GSD、BMAD、Spec-Kit 等方案，指出它们“拥有流程但剥夺控制权”。本技能集与之相反：**小型、可组合、可改造**，不强制流程，而是提供可插拔的纪律约束。类似理念可见于 Cursor Rules 和自定义命令，但本仓库提供了更系统的工程模式封装。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 如何将工程原则（TDD、DDD、反馈循环）编码为可重复的代理指令；使用共享语言和ADR建立代理可读的项目记忆；通过盘问模式提升需求质量。 |
| 迁移到 AI-Brief | 技能集的方法论可迁移到 AI-Brief 的工作流，如需求澄清模块、任务分解器、架构审查步骤。交接文档模式可用于跨会话的事后分析。 |
| 迁移到 BriefMem | Shared Language 和 ADR 的记忆管理模式可直接用于 BriefMem 的长程存储设计，尤其是领域术语表和决策记录。 |
| 简历故事 | 在 AI 辅助开发中引入软件工程纪律：通过自定义代理技能，将团队开发中的对齐、测试、架构管理自动化，显著提升代码质量和协作效率。 |

## 风险

- 技能文件无自动化测试，兼容性仅在作者环境中验证，不同代理行为可能不完全一致。
- 高度依赖作者的个人实践，社区贡献模式未明确，长期维护可持续性存疑。
- 部分技能（如架构改进）效果受代码库复杂度影响大，可能产生不可预期的修改。
- Git 护栏等安全措施仅通过钩子实现，无法防御代理绕过钩子的情况。

## Memory card

```text
problem_pattern:        AI编码代理常见失败模式：需求不对齐、冗余沟通、代码不可用、架构过快退化。
architecture_pattern:   通过声明式Markdown技能文件，将工程纪律注入代理的命令循环，形成可插拔的行为扩展层。
reusable_pattern:       共享语言记忆（CONTEXT.md+ADR）、盘问对齐、红-绿-重构代理测试、交接文档压缩。
risk_pattern:           依赖个人实践，缺乏自动化测试，社区贡献路径未建立。
similar_projects:       GSD, BMAD, Spec-Kit（README提及，但细节未说明）；Cursor Rules / 自定义命令。
```

可复用范式落库:[[concepts/grilling-session]]、[[concepts/shared-language-memory]]。另见 [[content/skills]]、[[claims/skills-main-claim]]。
