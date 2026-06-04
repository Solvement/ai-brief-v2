---
content: "compound-engineering-plugin"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "compound-engineering-plugin — 深度拆解"
tier_template:
  tier: 2
  bucket: "真·新项目"
  tag: "[Tier 2｜真·新项目]"
  one_sentence_positioning: "给 Claude Code、Cursor 等 AI 编程助手装上「复利工程」流程，把需求、计划、审查和知识积累串成一个越用越顺的循环。"
  what_it_does: "提供一套 skills 和 agents，实现 brainstorming → planning → execution → review → compounding 的工程循环，并通过 Bun/TypeScript 安装器适配 10 余种 AI 编码平台。"
  metadata:
    language: "TypeScript"
    total_stars: "19715"
    stars_in_period: "2116"
    author: "EveryInc"
  labels:
    - "agent/framework"
    - "tools"
    - "workflow"
    - "developer-tools"
  pain_point: "传统开发中每次改动都会积累技术债——特性增加复杂度，bug 修复留下局部知识，下次改动时需要重新发现上下文，代码库越大越难驾驭；而AI 辅助编码通常缺少结构化的「学习闭环」，无法自动将经验转化为可复用的资产。（来源：README Philosophy）"
  core_capabilities:
    - "结构化工作流循环：通过 /ce-brainstorm、/ce-plan、/ce-work、/ce-code-review、/ce-compound 串联从需求到知识沉淀的全过程。"
    - "跨平台 Skill/Agent 部署：同一套 Skill 和 Agent 定义可通过 Bun 安装器适配 Claude Code、Cursor、Codex、Copilot CLI、Factory Droid、Qwen Code、OpenCode 等 10 余种环境。"
    - "多 Agent 协作式代码审查：/ce-code-review 能派生出多个 Agent 并行检查代码，获取模式而非仅定位 bug。"
  how_to_run:
    install_command: "# Claude Code 示例（先添加市场，再安装插件） /plugin marketplace add EveryInc/compound-engineering-plugin /plugin install compound-engineering"
    minimal_example: "# 安装后运行 /ce-setup # 一个典型的工作流循环 /ce-brainstorm \"make background job retries safer\" /ce-plan docs/brainstorms/background-job-retry-safety-requirements.md /ce-work /ce-code-review /ce-compound"
  maturity_signals:
    star_velocity: "过去一周获得 2116 颗星（来源：GitHub trending 数据）"
    recent_commit: "最近的提交在 2026-06-03（来源：artifactAudit.pushed_at）"
    releases: "最新发布版本 v3.10.0，发布于 2026-06-03（来源：artifactAudit.latest_release_tag_name）"
    issue_activity: "89 个开放 issue（来源：artifactAudit.open_issues_count）"
  comparison: "与直接使用 Claude Code 原生的 agent 循环相比，本插件提供预定义的工作流和知识累积机制，但 README 未提供与其他同类插件（如 Homebrew 的 AI 工作流工具）的具体对比数据。"
  trajectory_note: "本周登上 GitHub trending 周榜，属快速崛起的新项目。"
  manual_confirmation: false
  how_it_works_with_analogy: ""
  essential_design_difference: ""
  practitioner_meaning: ""
  cross_links: []
  prose_body: ""
reasoning_trace:
  paper_type_decision: "agent_framework：项目定义了一个从需求到知识累计的闭环工作流，并提供可派生子 Agent 的 tool interface，符合 agent framework 特征。"
  central_contribution: "将复利工程理念固化为可跨平台部署的 Agent 工作流插件，用文件系统实现 Agent 的跨会话记忆。"
  inspected:
    - "README.md"
    - "package.json"
    - "src/ 目录存在性"
    - "plugins/ 目录存在性"
    - "tests/ 目录存在性"
    - "topics"
    - "license"
    - "CI badge"
  top_claims:
    - "README 自称搭载 37 个 skills 和 51 个 agents。"
    - "README 声称支持 10+ 个 AI 编码平台（列表中列出的有 Claude Code, Cursor, Codex, Copilot CLI, Factory Droid, Qwen Code, OpenCode, Pi, Gemini CLI, Kiro CLI 等）。"
    - "README 宣称复利工程工作流能显著降低后续改动难度，80% 时间花在计划和审查上。"
  evidence_needed:
    - "完整的 Skill/Agent 列表及其功能描述（plugins/compound-engineering/README.md）以验证数量与能力。"
    - "执行环境的安全沙箱实现（代码中是否有权限检查、容器化调用）。"
    - "知识库存储与检索的具体代码逻辑。"
  main_threats:
    - "未公开的 Agent 交互细节可能隐藏错误执行或死锁风险。"
    - "平台依赖可能导致项目未来维护成本爆炸。"
  transfer_decision: "可迁移的核心抽象是「文档阶梯工作流」和「多平台适配器模式」；不可迁移的是与特定平台 API 的胶水代码。"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 4
  maturity: 4
  main_risk: "高度依赖外部 AI 编码平台 API，若接口变更则工作流可能中断。"
next_actions:
  - "clone-and-run"
  - "read-docs"
  - "extract-pattern(agent-delegation-tree)"
unknowns:
  - "37 个 Skill 和 51 个 Agent 的完整清单及具体定义——README 仅提到数量，未列出明细，文档链接 plugins/compound-engineering/README.md 未检查。"
  - "Agent 间通信机制：子 Agent 如何接收任务、返回结果，是否有并发控制。"
  - "沙箱执行环境：Agent 是否有权限访问文件系统、网络，是否在隔离容器中运行。"
  - "人类审批 / 权限控制：在 /ce-work 或 /ce-code-review 中，Agent 的代码修改或审查是否会有人工确认步骤。"
  - "/ce-compound 的知识存储格式与检索方式：生成的文档是纯文本还是结构化数据，未来 Agent 如何找到相关知识点。"
  - "规划器 /ce-plan 的输出格式：生成的实现计划的具体结构。"
  - "多 Agent 审查的 parallel degree 与 fallback 策略。"
builder_reuse:
  pattern: "Plugin-based Agent Workflow Orchestration Pattern（基于插件的 Agent 工作流编排模式）"
  copy: "1. 通过 slash command 暴露工具入口，并用文件作为工作流各阶段之间的交接契约（Input Artifact → Output Artifact）。 2. 多平台适配层：一个 Node/Bun 脚本将同一套 Skill/Agent 定义转换为不同宿主格式，且对缺失原语的平台注入 polyfill。"
  skip: "沙箱与权限模型的具体实现细节、Agent 间通信协议、知识库的检索与去重逻辑，README 均未披露，不宜直接复用。"
  why_it_matters: "这套模式让 Agent 工作流可以一次编写、处处运行，同时通过文档积累使 Agent 具备跨会话的 memory，这是从「一次性助手」到「持续积累的工程伙伴」的关键跨越。"
dependency_platform_risk:
  dependency: "Claude Code, Cursor, Codex, Copilot CLI, Factory Droid, Qwen Code, OpenCode, Pi, Gemini CLI, Kiro CLI 等多个第三方 AI 编程平台。"
  what_if_change: "若任一平台更改插件 API、废弃 slash command 机制或修改 Agent 派生方式，对应的安装分支将失效，部分 Skill 可能无法运行；若多个平台同时变动，维护成本将剧增。"
  exposure: "high"
  mitigation_or_unknown: "项目通过统一的 Bun 安装器和平台适配层降低了耦合度，但核心依赖仍无法摆脱各平台的自有契约。README 未提供该风险的管理策略。"
claim_ledger:
  - claim: "ships 37 skills and 51 agents"
    plain_english: "包含 37 个技能和 51 个代理"
    source: "README Getting Started 段落"
    attribution: "自称"
    evidence_strength: "low"
    supports: "功能丰富度宣言"
    does_not_support: "只有总数字，未列出任何单个 skill/agent 的定义，无法核实。"
    threat: "可能存在未实现或不可用的条目，用户期望管理风险。"
  - claim: "supports 10+ platforms"
    plain_english: "支持 10 多个 AI 编码平台"
    source: "README Install 部分列出了 Claude Code, Cursor, Codex, Copilot CLI/VS Code, Factory Droid, Qwen Code, OpenCode, Pi, Gemini CLI, Kiro CLI（共 10 个）"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "跨平台能力"
    does_not_support: "实际安装成功的平台数量未经第三方验证"
    threat: "某个平台的安装脚本可能已失效或无法工作。"
  - claim: "compound engineering makes each subsequent change easier"
    plain_english: "复利工程让后续改动更简单"
    source: "README Philosophy"
    attribution: "自称"
    evidence_strength: "none"
    supports: "理论主张"
    does_not_support: "没有提供任何测量数据（如变更交付时间前后对比）"
    threat: "纯属营销口号，无实证。"
render_warnings:
  - "faithfulness.unknown_assertion line 67 term \"compound-engineering\": 可复用范式落库:[[concepts/compound-engineering-loop]]。另见 [[content/compound-engineering-plugin]]、[[claims/compound-engineering-plugin-main-claim]]。"
artifact_audit:
  official_repo: "https://github.com/EveryInc/compound-engineering-plugin"
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

## [Tier 2｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

给 Claude Code、Cursor 等 AI 编程助手装上「复利工程」流程，把需求、计划、审查和知识积累串成一个越用越顺的循环。

（来源：README/artifactAudit）

## 干什么

提供一套 skills 和 agents，实现 brainstorming → planning → execution → review → compounding 的工程循环，并通过 Bun/TypeScript 安装器适配 10 余种 AI 编码平台。

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | TypeScript |
| total_stars | 19715 |
| stars_in_period | 2116 |
| author | EveryInc |

## 标签

- agent/framework（来源：数据不足）
- tools（来源：数据不足）
- workflow（来源：数据不足）
- developer-tools（来源：数据不足）

## 解决什么痛点

传统开发中每次改动都会积累技术债——特性增加复杂度，bug 修复留下局部知识，下次改动时需要重新发现上下文，代码库越大越难驾驭；而AI 辅助编码通常缺少结构化的「学习闭环」，无法自动将经验转化为可复用的资产。（来源：README Philosophy）

## 核心能力

- 结构化工作流循环：通过 /ce-brainstorm、/ce-plan、/ce-work、/ce-code-review、/ce-compound 串联从需求到知识沉淀的全过程。（来源：数据不足）
- 跨平台 Skill/Agent 部署：同一套 Skill 和 Agent 定义可通过 Bun 安装器适配 Claude Code、Cursor、Codex、Copilot CLI、Factory Droid、Qwen Code、OpenCode 等 10 余种环境。（来源：数据不足）
- 多 Agent 协作式代码审查：/ce-code-review 能派生出多个 Agent 并行检查代码，获取模式而非仅定位 bug。（来源：数据不足）

## 怎么跑起来

- 安装命令：# Claude Code 示例（先添加市场，再安装插件） /plugin marketplace add EveryInc/compound-engineering-plugin /plugin install compound-engineering（来源：README/artifactAudit）
- 最小可运行示例：# 安装后运行 /ce-setup # 一个典型的工作流循环 /ce-brainstorm "make background job retries safer" /ce-plan docs/brainstorms/background-job-retry-safety-requirements.md /ce-work /ce-code-review /ce-compound（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| star_velocity | 过去一周获得 2116 颗星（来源：GitHub trending 数据） |
| recent_commit | 最近的提交在 2026-06-03（来源：artifactAudit.pushed_at） |
| releases | 最新发布版本 v3.10.0，发布于 2026-06-03（来源：artifactAudit.latest_release_tag_name） |
| issue_activity | 89 个开放 issue（来源：artifactAudit.open_issues_count） |

## 和同类的区别

与直接使用 Claude Code 原生的 agent 循环相比，本插件提供预定义的工作流和知识累积机制，但 README 未提供与其他同类插件（如 Homebrew 的 AI 工作流工具）的具体对比数据。

（来源：README/artifactAudit）

## 轨迹备注

本周登上 GitHub trending 周榜，属快速崛起的新项目。

（来源：README/artifactAudit）

可复用范式落库:[[concepts/compound-engineering-loop]]。另见 [[content/compound-engineering-plugin]]、[[claims/compound-engineering-plugin-main-claim]]。
