---
content: "hermes-agent"
kind: "evidence-pack"
title: "hermes-agent — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个支持自我学习、跨平台运行的 AI 助手，提供技能创建、记忆管理和多模型接入。"
    internal_logic: "### Agent Loop\nREADME 声称架构文档描述了 agent loop 和关键类（来源：README 文档表格 Architecture 行）。具体实现细节未在 README 中说明。\n\n### Tool Interface\nHermes 拥有超过 40 个工具（来源：README Tools & Toolsets），支持 toolset 系统并通过 MCP 集成扩展（来源：README MCP Integration）。工具可以通过 CLI 配置启用（`hermes tools`）。此外，终端后端提供本地、Docker、SSH、Singularity、Modal、Daytona 六种后端，实现运行环境隔离（来源：README Runs anywhere 部分）。\n\n示例：`hermes tools` 交互配置，`hermes config set` 设置项。\n\n### State / Memory\n仅有的 agent 包含内置学习循环：agent 从经验创建技能，在使用中改进技能，自我提醒持久化知识，搜索过去对话，建立用户模型（来源：README 开头描述）。具体机制：采用 FTS5 会话搜索和 LLM 摘要实现跨会话回忆，使用 Honcho 进行辩证用户建模（来源：README Closed learning loop 行）。技能存储在 `~/.hermes/skills/`，兼容 agentskills.io 标准（来源：README Skills System）。\n\n`/compress` 命令压缩上下文，`/usage` 查看用量。\n\n### Planner / Subagent Delegation\n可以生成独立的子代理进行并行工作流，并允许 Python 脚本通过 RPC 调用工具，将多步流程压缩为零上下文成本（来源：README Delegates and parallelizes 行）。具体 planner 机制未在 README 中说明。\n\n### Sandbox / Security\n安全措施包括命令审批、DM 配对、容器隔离（来源：README Security 文档行）。终端后端如 Docker、Daytona 等提供隔离环境。细节未在 README 中说明。\n\n### Research Tools\n提供批处理轨迹生成和轨迹压缩器，用于训练下一代工具调用模型（来源：README Research-ready 行）。\n\n### 主要命令速查\n`hermes` 启动交互，`hermes gateway start` 启动消息网关，`/model` 切换模型，`/skills` 浏览技能。\n\n### 安装与配置\n一键安装脚本处理 uv、Python 3.11、Node.js、ripgrep、ffmpeg 和 portable Git Bash（来源：README Quick Install）。`hermes setup --portal` 通过 OAuth 登录 Nous Portal，统一管理工具网关（来源：README Skip the API-key collection）。"
    failure_mode: "高度依赖多项第三方服务，任何一方变更都可能导致部分功能失效。"
    source_pointer: "https://github.com/nousresearch/hermes-agent"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/MIT/v2026.5.29.2"
experiments: []
claims:
  - "[[claims/hermes-agent-main-claim]]"
artifacts:
  - "[[artifacts/hermes-agent-repo]]"
metrics:
  - "stars=179370"
  - "forks=30726"
  - "open_issues=17322"
  - "latest_release=v2026.5.29.2"
  - "pushed_at=2026-06-04T03:15:28Z"
baselines: []
failure_modes:
  - "高度依赖多项第三方服务，任何一方变更都可能导致部分功能失效。"
  - "技能自动生成可能引入不安全行为，尽管有容器隔离，但细节不明。"
  - "CLI 工具执行可能带来主机安全风险，尤其在非隔离后端（如本地）运行时。"
  - "庞大的代码库和 17k+ open issues 暗示维护挑战，可能存在未解决的 bug。"
  - "README 中自我宣称“唯一”等营销语言可能夸大实际能力，学习闭环效果未经独立验证。"
missing_details: []
source_pointers:
  - "https://github.com/nousresearch/hermes-agent"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/hermes-agent-main-claim]],官方 artifact 落库为 [[artifacts/hermes-agent-repo]]。See [[content/hermes-agent]]。
