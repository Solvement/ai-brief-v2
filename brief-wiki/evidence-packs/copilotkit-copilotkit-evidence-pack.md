---
content: "copilotkit-copilotkit"
kind: "evidence-pack"
title: "CopilotKit — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "CopilotKit 是用一个协议（AG-UI）打通所有前端框架的 Agent 界面层。"
    internal_logic: "### Agent Loop & Interaction Cycle\nCopilotKit 连接 UI、Agent 和工具，形成一个单一的交互循环。\n![CopilotKit Diagram](https://github.com/user-attachments/assets/6f175d86-bd22-4c26-a13a-6013654ed542)\n\n- 用户输入触发 Agent 运行。\n- Agent 可以调用工具，工具可以返回 UI 组件（如按钮、卡片）。\n- Agent 可以暂停并请求用户输入（Human-in-the-Loop）。\n- Agent 和 UI 共享一个同步状态（Shared State），实时更新。\n\n#### useAgent Hook：直接操作 Agent 状态\n```ts\nconst { agent } = useAgent({ agentId: \"my_agent\" });\n\nreturn <div>\n  <h1>{agent.state.city}</h1>\n  <button onClick={() => agent.setState({ city: \"NYC\" })}>\n    Set City\n  </button>\n</div>\n```\n\n### Tool Interface: Backend Tool Rendering\nAgent 调用的工具可以在前端渲染组件。例如，一个天气查询工具可以直接返回一个天气卡片。\n\n#### Generative UI 三种模式\n- **Static (AG-UI Protocol)**: 预先定义好的 UI 组件，Agent 通过 AG-UI 协议发送 UI 描述。\n- **Declarative (A2UI)**: 基于声明式 JSON 描述 UI。\n- **Open-Ended (MCP Apps & Open JSON)**: 完全开放的生成，Agent 可以输出任意 UI。\n\n### Shared State & Memory\nAgent 和 UI 共享一个状态层，通过 `agent.state` 和 `agent.setState()` 读写。此状态在会话期间持久化，但 README 未说明持久化存储后端。\n\n### Planner / Agent Backend\nCopilotKit 不限定后端 Agent 框架，可与 LangChain、Mastra、CrewAI、PydanticAI 等集成。通过 AG-UI 协议统一前端。\n\n### Sandbox & Safety\nREADME 未说明执行隔离或安全边界。"
    failure_mode: "AG-UI 协议尚未成为行业标准，若推广不力可能削弱跨平台优势。"
    source_pointer: "https://github.com/copilotkit/copilotkit"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/true/MIT/v1.59.5"
experiments: []
claims:
  - "[[claims/copilotkit-copilotkit-main-claim]]"
artifacts:
  - "[[artifacts/copilotkit-copilotkit-repo]]"
metrics:
  - "stars=34669"
  - "forks=4334"
  - "open_issues=555"
  - "latest_release=v1.59.5"
  - "pushed_at=2026-06-11T12:43:08Z"
baselines: []
failure_modes:
  - "AG-UI 协议尚未成为行业标准，若推广不力可能削弱跨平台优势。"
  - "自学习功能处于早期访问，稳定性未知，且可能依赖 CopilotKit 云服务。"
  - "对第三方平台（Slack、Teams）的依赖使其受限于外部 API 变更。"
  - "未发现测试代码，代码质量和可靠性未经验证。"
missing_details: []
source_pointers:
  - "https://github.com/copilotkit/copilotkit"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/copilotkit-copilotkit-main-claim]],官方 artifact 落库为 [[artifacts/copilotkit-copilotkit-repo]]。See [[content/copilotkit-copilotkit]]。
