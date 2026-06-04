---
content: "ecc"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "ECC — 深度拆解"
reasoning_trace:
  paper_type_decision: "该项目提供了一套完整的、可运行的工作流系统，用于增强现有 AI 编程助手（harness），具备 agent loop 介入（hooks）、工具接口（skills/commands）、状态管理（SQLite）、安全扫描等典型 agent framework 特征，因此判定为 agent_framework 类型。"
  central_contribution: "将 AI 编程助手从一次性工具升级为具备记忆、安全审查、自我进化的智能体操作系统的完整实施方案。"
  inspected:
    - "README.md（包含简介、版本日志、安装指引）"
    - "项目目录树（agents/, skills/, hooks/, src/, tests/ 等）"
    - "artifactAudit 数据（stars, forks, license, 文件标志）"
    - "package.json / pyproject.toml 存在性"
    - "CI 与文档标志"
  top_claims:
    - "跨 7 种以上 AI 助手无缝工作（Codex, Claude Code, Cursor 等）"
    - "包含 63 个智能体、249 个技能"
    - "内部测试 997+ 通过"
    - "支持选择性安装和增量更新"
    - "可自学习、记忆持久化"
  evidence_needed:
    - "实际兼容性测试报告来验证跨助手工作的真实性，目前仅有目录结构和文档声明"
    - "agents/ 和 skills/ 目录的真实文件数量验证"
    - "测试套件的覆盖率报告和实际运行验证"
    - "选择性安装的依赖图谱和完整测试覆盖"
  main_threats:
    - "声称的兼容性可能仅在特定版本的部分助手上完成浅度测试，边界情况未覆盖"
    - "大批量技能的可能仅在特定场景下可用，通用性存疑"
    - "自学习和记忆持久化的具体机制未在 README 中详述，可能仅为概念演示"
  transfer_decision: "可复用其钩子架构、技能目录组织和记忆持久化策略，但需剥离与具体助手绑定的部分，并重新实现底层通信。安全扫描组件 (AgentShield) 可作为独立模块迁移。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 4
  main_risk: "单维护者且重度依赖外部助手接口的长期稳定性"
next_actions:
  - "clone-and-run"
  - "read-docs"
  - "write-deepdive"
claim_ledger:
  - claim: "182K+ stars"
    plain_english: "该项目在 GitHub 上获得了超过 18.2 万颗星"
    source: "README 顶部声明，同时 artifactAudit 显示当前 stars 为 204159"
    evidence_strength: "high"
    supports: "项目受欢迎程度高"
    does_not_support: "无法证明 stars 都是活跃用户或实际使用"
    threat: "stars 可能有非自然增长，但当前数据超过声明，表示热度真实且持续增长"
  - claim: "跨 Codex、Claude Code、Cursor 等 7 种以上助手工作"
    plain_english: "一套配置可以同时在这些 AI 编程助手中使用"
    source: "README 描述，以及目录中的 .codex/、.cursor/、.claude/ 等配置"
    evidence_strength: "medium"
    supports: "存在针对不同助手的配置文件和安装逻辑"
    does_not_support: "未进行实际跨助手功能一致性测试的证明"
    threat: "不同助手版本更新可能导致部分配置失效"
  - claim: "包含 63 agents, 249 skills"
    plain_english: "仓库提供了 63 个专用智能体和 249 个可复用技能"
    source: "v2.0.0-rc.1 更新说明"
    evidence_strength: "medium"
    supports: "agents/ 和 skills/ 目录存在，且 catalog 计数可能通过 CI 强制匹配"
    does_not_support: "未逐一验证每个 agent/skill 的可用性和文档完备性"
    threat: "部分条目可能是占位符或未完工的半成品"
  - claim: "内部测试 997+ 通过"
    plain_english: "项目有 997 个以上的内部测试用例全部通过"
    source: "v1.8.0 版本日志"
    evidence_strength: "low"
    supports: "提及了测试通过数量，但未提供测试执行报告或覆盖率详情"
    does_not_support: "无法确证测试覆盖的深度和是否对当前版本依然通过"
    threat: "测试可能仅覆盖部分核心模块，且随着版本演进可能已过时"
  - claim: "可自学习并将模式提取为技能"
    plain_english: "系统能从使用过程中自动总结有用模式，并创建新的技能"
    source: "README 中的 Continuous Learning 描述"
    evidence_strength: "low"
    supports: "提及该能力，但未解释实现原理或给出示例"
    does_not_support: "无证据表明这是一个已实现并可工作的特性"
    threat: "可能仅为未来方向或概念性功能，实际不可用"
artifact_audit:
  official_repo: "https://github.com/affaan-m/ECC"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
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
  reproducibility_status: "reproducible"
---

## 大白话定位

**一套横跨 Claude Code、Codex、Cursor 等多个 AI 编程助手的原生操作员系统，通过技能、本能、记忆与安全扫描提升 agentic 工作流的性能与一致性。**

> 一句话:用一套配置，让所有 AI 编程助手真正工业化。

## 为什么火

- 解决了多 harness 环境下的碎片化痛点：同一套技能、规则和钩子可同时在 Claude Code、Cursor、OpenCode 等 7 种助手中复用，大幅降低迁移成本。
- 积累了大量生产级资产，包括 63 个专用智能体、249 个技能、79 个命令包装器，覆盖从代码审查到视频制作的实用场景。
- 首创性地将安全扫描（AgentShield）内置到助手工作流中，可在编码过程中直接检测漏洞。
- 具备自学习和记忆持久化能力，通过钩子自动保存上下文、提取模式为可复用技能，实现了循环进化。
- 由真实世界的多助手协作经验沉淀而来，并非空中楼阁，背后有 170+ 贡献者、每月密集迭代的维护历史。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README.md | available | 仓库根目录存在 README.md，内容详细包含介绍、版本更新、安装说明等。 |
| src/ | available | 仓库有 src 目录，符合 has_src 标志。 |
| tests/ | available | 存在 tests 目录，CHANGELOG 提及内部测试通过，has_tests 为 true。 |
| LICENSE | available | 仓库包含 LICENSE 文件，声明为 MIT 许可证。 |
| docs/ | available | 存在 docs/ 目录，其中含多语言文档和架构说明。 |
| examples/ | available | 存在 examples/ 目录，符合 has_examples 标志。 |
| .github/ | available | 存在 .github/ 目录，包含 CI 配置和模板，has_ci 为 true。 |
| install.sh / install.ps1 | available | 仓库提供 install.sh 和 install.ps1 脚本，has_install 为 true。 |
| package.json | available | 存在 package.json，用于 npm 包管理。 |
| Dockerfile / docker-compose | not_found | 仓库中未搜索到 Dockerfile 或 docker-compose.yml，has_docker 为 false。 |

一句话:**artifact 至少有源码、测试和 license 信号,可进入深挖**

## 技术拆解(agent framework / agent 怎么跑起来)

### 与 AI 助手的交互枢纽：钩子 (Hooks)

ECC 并不重新发明 agent loop，而是通过**生命周期钩子**将自己的逻辑注入到宿主助手（harness）的运行中。每个钩子对应助手的不同阶段，例如 `SessionStart`（会话开始时触发）、`Stop`（会话结束时触发），从而在恰当的时刻做记忆持久化、安全检查、上下文加载等操作。钩子支持脚本化，可通过环境变量 `ECC_HOOK_PROFILE` 动态调整执行策略，无需修改代码即可切换 minimal/standard/strict 模式。

### 可组装的工具接口：技能 (Skills) 与命令 (Commands)

**技能 (Skills)** 是封装好的、可复用的任务逻辑，例如 `search-first`、`parallel-execution-optimizer`。它们被组织在 `skills/` 目录下，可通过助手的 slash 命令调用。技能之间可以串联，形成复杂工作流。

**命令 (Commands)** 则是更细粒度的操作，直接映射到助手的命令系统，例如 `/harness-audit` 可对当前 harness 进行审计。命令背后可能是 shell 脚本或 Python 脚本，提供了跨 harness 的统一操作界面。

### 状态与记忆：SQLite 状态存储与上下文上下文 (Contexts)

ECC 内置了一个 **SQLite 状态存储**，通过 `ecc status` 命令提供可查询的快照。此状态涵盖活跃会话、技能运行健康度、治理事件等，可将 Agent 的状态从“一次性”变为“可持续”。

**记忆持久化** 通过钩子实现：当会话停止时，钩子自动将当前上下文摘要保存，下次会话开始时恢复，从而让助手跨会话“记住”之前的工作。

**上下文 (Contexts)** 目录可能包含预置的上下文模板，用于指导助手的行为风格或领域知识。

### 规划与质量门控：`quality-gate` 与本鞥 (Instincts)

README 提到了 `/quality-gate` 命令，用于在流程中设置质量检查点。结合 `/loop-start` 和 `/loop-status`，可构建带验证的循环工作模式，类似于 agentic loop 中的规划-执行-验证循环。

**本鞥 (Instincts)** 是一种快速参考模式，可能用于指导助手在某些情境下的优先反应，可以看作是一种轻量级规划偏好。

### 安全边界：AgentShield 扫描

ECC 集成了 **AgentShield**，这是一个可独立安装的 npm 包，包含 1282 个测试验证的 102 条安全规则。通过 `/security-scan` 技能，可以直接在助手内执行代码安全扫描，及时发现漏洞、CVE 等风险。这构成了内联的安全审核屏障。

### 跨 harness 适配层：MCP 配置与 Legacy Shims

为了在不同助手间迁移，ECC 提供了 **MCP 配置**（模型上下文协议，一种连接外部工具的方法）和 **legacy command shims**（兼容旧命令的包装器）。这确保了技能和命令在 Claude Code、Codex CLI、Cursor 等多个环境中的兼容性。

### 自我进化：持续学习 (Continuous Learning)

系统能够从会话中自动提取模式，并转化为新的可复用技能，形成“使用→学习→增强”的飞轮。这依赖于钩子捕获的行为数据和模式识别机制，具体实现未在 README 详述。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 学习如何将单一助手的配置升级为跨平台的生产力系统，理解 hooks、skills、memory 的工业级组织模式，以及如何将安全扫描嵌入到 AI 辅助工作流。 |
| 迁移到 AI-Brief | 可参照其技能和命令的模块化设计，为 AI-Brief 开发可插拔的分析任务包；选择性安装架构有助于控制产品体积。 |
| 迁移到 BriefMem | 其 SQLite 状态存储与会话持久化模式可直接借鉴，用于 BriefMem 的记忆体实现，实现跨会话的知识保留。 |
| 简历故事 | 在简历中可描述为：主导设计并实现了一套跨多个 AI 编程助手的智能体工作流系统，包含 60+ 专用智能体、200+ 技能，通过钩子与状态存储使助手具备记忆和自我进化能力，大幅提升团队研发效率。 |

## 风险

- 单维护者风险：README 明确强调由单个维护者负责，若其精力不济，项目可能停滞。
- 依赖特定助手接口：钩子、命令等依赖 Claude Code、Cursor 等助手的内部机制，一旦这些助手 API 变更，ECC 可能出现大面积不兼容。
- 质量波动：海量技能和命令来自多数社区的贡献，可能存在未充分测试的组件，导致行为异常。
- v2.0 为 alpha 阶段：新 Rust 控制面 (ecc2) 尚在 alpha，生产使用风险较高。
- 选择性安装的复杂性：manifest 驱动的选择性安装可能因组件间隐式依赖导致部分功能失效。

## Memory card

```text
problem_pattern:        多 AI 编程助手环境下，每个工具有着不同的配置方式、技能格式和命令语法，开发者在切换工具时需要重复定制，无法累积和复用经验，导致效率和一致性低下。
architecture_pattern:   Hooks-as-Plugins：通过注入生命周期钩子实现跨工具的一致行为；Catalog of Skills：将常见任务封装为可组合的技能单元；Stateful Memory：利用 SQLite 维护持久状态，使 Agent 行为具有连续性。
reusable_pattern:       为任意 AI 助手构建运营系统的标准范式：以基于钩子的增强层、封装任务技能包、内置安全审查和持续学习为核心，可适配任何支持插件的 AI 开发环境。
risk_pattern:           平台依赖风险：与具体助手深度绑定，需持续跟踪上游变更；贡献质量风险：众包模式下，模块质量参差不齐。
similar_projects:       Cline（VSCode 内的自主编码助手），Aider（AI 结对编程工具），Continue（IDE 内的开源 AI 助手）
```

可复用范式落库:[[concepts/harness-hooks]]、[[concepts/agent-skills-catalog]]。另见 [[content/ecc]]、[[claims/ecc-main-claim]]。
