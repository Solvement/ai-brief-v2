---
content: "hermes-agent"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "hermes-agent — 深度拆解"
tier_template:
  tier: 2
  bucket: "真·新项目"
  tag: "[Tier 2｜真·新项目]"
  one_sentence_positioning: "一个支持自我学习、跨平台运行的 AI 助手，提供技能创建、记忆管理和多模型接入。"
  what_it_does: "提供命令行和消息平台（Telegram/Discord/Slack 等）的 AI 代理，具备从对话中自动学习、创建技能、跨会话记忆的能力，并可部署于多种环境。"
  metadata:
    language: "Python"
    total_stars: "179370"
    stars_in_period: "1735"
    author: "NousResearch"
  labels:
    - "agent"
    - "工具"
    - "数据"
    - "infra"
  pain_point: "其他 AI 代理缺乏持久学习和自我改进能力，无法从对话经验中自动积累知识；部署和配置复杂，难以在多个平台间保持一致性。"
  core_capabilities:
    - "内置学习闭环：自动从复杂任务中创建技能，技能在使用中自我改进，并通过定期提醒将知识持久化到记忆。（来源：README Closed learning loop）"
    - "多平台统一访问：通过单一网关同时支持 Telegram、Discord、Slack、WhatsApp、Signal 和 CLI，支持语音转录和跨平台对话连续性。（来源：README Lives where you do）"
    - "灵活的工具和执行后端：内置 40+ 工具（来源：README Tools & Toolsets），支持通过 MCP 扩展（来源：README MCP Integration），可运行于本地、Docker、SSH、远程容器等多种终端后端，甚至支持无服务器休眠。（来源：README Runs anywhere）"
  how_to_run:
    install_command: "curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash"
    minimal_example: "hermes"
  maturity_signals:
    star_velocity: "单日 1,735 stars（2026-06-04）"
    recent_commit: "最近提交于 2026-06-04"
    releases: "有发布标签 v2026.5.29.2，表明定期发布"
    issue_activity: "open issues 数量 17,322，活跃度较高"
  comparison: "相较于 AutoGPT 和 LangChain agents 等需要手动编写技能、记忆管理较为有限的框架，Hermes Agent 自称是唯一内置闭环学习循环、自动技能创建和改进的 agent（来源：README 开头宣传）。与 OpenClaw 相比，提供了迁移工具（来源：README Migrating from OpenClaw），并增加更多平台支持和技能生态系统。"
  trajectory_note: "出现在 GitHub trending daily 榜单，短期关注度极高，可能因 Nous Research 品牌效应和新仓库发布；长期价值取决于持续维护和社区贡献。"
  manual_confirmation: false
  how_it_works_with_analogy: ""
  essential_design_difference: ""
  practitioner_meaning: ""
  cross_links: []
  prose_body: ""
reasoning_trace:
  paper_type_decision: "基于 README 描述的自我改进 agent 和多工具、多平台特性，判定为 agent_framework，因为它提供了完整的 agent 运行框架而非单一应用。"
  central_contribution: "提供首个声称内置闭环学习循环的开源 AI 代理框架，自动从对话中创建和改进技能，并通过持久化记忆跨越会话。"
  inspected:
    - "README"
    - "元数据（stars, forks, language, topics）"
    - "顶层目录结构"
    - "关键文件列表"
    - "package 文件存在性"
  top_claims:
    - "README 声称是唯一具有内置学习循环的 agent"
    - "README 声称支持 300+ 模型和一键切换"
    - "README 声称有 40+ 内置工具"
    - "README 声称支持 6 种终端后端和跨平台消息"
  evidence_needed:
    - "agent loop 具体代码以验证学习循环"
    - "技能创建和改进的实际测试"
    - "安全机制实现的审计"
    - "第三方依赖可用性及降级方案"
  main_threats:
    - "README 营销语言可能夸大能力"
    - "复杂依赖链可能导致稳定性问题"
    - "开放 issue 数量庞大，可能缺乏有效维护"
  transfer_decision: "可复用其技能系统和记忆管理设计，但需去依赖化和增加安全审查。"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 5
  main_risk: "过度依赖第三方服务和未经验证的学习闭环能力"
next_actions:
  - "clone-and-run"
  - "deep_dive"
unknowns:
  - "agent loop 的具体实现（轮次逻辑、工具调用流程）"
  - "planner 机制（如何分解任务、生成子代理）"
  - "命令审批的粒度和具体规则"
  - "技能创建的触发条件（如何判定“复杂任务”）"
  - "技能自我改进的具体算法"
  - "容器隔离的实现细节和默认安全边界"
  - "批处理轨迹生成和压缩器的性能数据"
  - "与 agentskills.io 标准的具体兼容程度"
builder_reuse:
  pattern: "Skill-learning loop with agent-curated memory 和 Subagent delegation pattern"
  copy: "技能目录结构（`~/.hermes/skills/`），技能加载和自改进框架，MCP 集成方式，多平台 gateway 统一入口。"
  skip: "具体的 planner 实现（未说明），强依赖 Nous Portal 的工具网关（可替换），未公开的容器隔离细节。"
  why_it_matters: "提供了一个生产级 agent 必须的长期记忆和自适应范式，可复用到其他需要持续学习的 AI 助手。"
dependency_platform_risk:
  dependency: "众多第三方平台：模型提供商（Nous Portal、OpenRouter、NVIDIA NIM 等），工具网关（Firecrawl、FAL、Browser Use），后端平台（Daytona、Modal），消息平台（Telegram、Discord 等）。"
  what_if_change: "若模型提供商更改 API 或价格策略，模型切换功能受影响；若工具网关关闭或更改接口，相关工具失效；若后端平台停止服务，对应部署架构失效；消息平台 API 变动可能导致某些渠道中断。"
  exposure: "high"
  mitigation_or_unknown: "README 声称可以使用自己的 API 端点和工具，降低了部分依赖；消息 gateway 可自行配置。但许多特色功能（如无缝模型切换、Tool Gateway 一键登录）强依赖第三方服务。"
claim_ledger:
  - claim: "README 声称是唯一具有内置学习循环的 agent"
    plain_english: "他们强调自己的 agent 是市场上唯一能自我学习改进的。"
    source: "README 第一段"
    attribution: "自称"
    evidence_strength: "low"
    supports: "宣传卖点"
    does_not_support: "无独立测试数据证明唯一性"
    threat: "可能只是营销措辞，实际存在其他类似学习能力的 agent"
  - claim: "README 声称支持 300+ 模型（通过 Nous Portal）"
    plain_english: "他们声称可以通过 Portal 访问 300 多种模型。"
    source: "README Skip the API-key collection — 300+ models"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "Portal 可能聚合多个 API 提供商"
    does_not_support: "未列出具体模型列表及质量"
    threat: "Portal 关闭或模型下架会影响功能"
  - claim: "README 声称内置 40+ 工具"
    plain_english: "他们说自带 40 多种工具。"
    source: "README Tools & Toolsets row"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "代码库中应有对应实现"
    does_not_support: "未说明工具质量和可靠性"
    threat: "工具实现可能不完善，需代码审查"
  - claim: "README 声称支持 6 种终端后端（local, Docker, SSH, Singularity, Modal, Daytona）"
    plain_english: "他们声称可以在 6 种不同的环境运行。"
    source: "README Runs anywhere row"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "项层目录有对应的实现文件"
    does_not_support: "各后端的管理和故障处理未说明"
    threat: "某些后端（如 Modal）可能因平台变更而不可用"
artifact_audit:
  official_repo: "https://github.com/NousResearch/hermes-agent"
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
  reproducibility_status: "partial"
---

## [Tier 2｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

一个支持自我学习、跨平台运行的 AI 助手，提供技能创建、记忆管理和多模型接入。

（来源：README/artifactAudit）

## 干什么

提供命令行和消息平台（Telegram/Discord/Slack 等）的 AI 代理，具备从对话中自动学习、创建技能、跨会话记忆的能力，并可部署于多种环境。

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 179370 |
| stars_in_period | 1735 |
| author | NousResearch |

## 标签

- agent（来源：数据不足）
- 工具（来源：数据不足）
- 数据（来源：数据不足）
- infra（来源：数据不足）

## 解决什么痛点

其他 AI 代理缺乏持久学习和自我改进能力，无法从对话经验中自动积累知识；部署和配置复杂，难以在多个平台间保持一致性。

（来源：README/artifactAudit）

## 核心能力

- 内置学习闭环：自动从复杂任务中创建技能，技能在使用中自我改进，并通过定期提醒将知识持久化到记忆。（来源：README Closed learning loop）
- 多平台统一访问：通过单一网关同时支持 Telegram、Discord、Slack、WhatsApp、Signal 和 CLI，支持语音转录和跨平台对话连续性。（来源：README Lives where you do）
- 灵活的工具和执行后端：内置 40+ 工具（来源：README Tools & Toolsets），支持通过 MCP 扩展（来源：README MCP Integration），可运行于本地、Docker、SSH、远程容器等多种终端后端，甚至支持无服务器休眠。（来源：README Runs anywhere）

## 怎么跑起来

- 安装命令：curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash（来源：README/artifactAudit）
- 最小可运行示例：hermes（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| star_velocity | 单日 1,735 stars（2026-06-04） |
| recent_commit | 最近提交于 2026-06-04 |
| releases | 有发布标签 v2026.5.29.2，表明定期发布 |
| issue_activity | open issues 数量 17,322，活跃度较高 |

## 和同类的区别

相较于 AutoGPT 和 LangChain agents 等需要手动编写技能、记忆管理较为有限的框架，Hermes Agent 自称是唯一内置闭环学习循环、自动技能创建和改进的 agent（来源：README 开头宣传）。与 OpenClaw 相比，提供了迁移工具（来源：README Migrating from OpenClaw），并增加更多平台支持和技能生态系统。

## 轨迹备注

出现在 GitHub trending daily 榜单，短期关注度极高，原因需确认： Nous Research 品牌效应和新仓库发布；长期价值取决于持续维护和社区贡献。

（来源：README/artifactAudit）

可复用范式落库:[[concepts/agent-skills]]、[[concepts/closed-learning-loop]]。另见 [[content/hermes-agent]]、[[claims/hermes-agent-main-claim]]。
