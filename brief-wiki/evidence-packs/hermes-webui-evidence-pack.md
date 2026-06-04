---
content: "hermes-webui"
kind: "evidence-pack"
title: "hermes-webui — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Hermes WebUI 是 Hermes Agent 的自托管 Web 界面，提供与 CLI 等价的三面板聊天-会话-工作区体验，无需额外配置即可使用现有 Agent 与模型。"
    internal_logic: "### 一句话判定\nHermes WebUI 是一个为 Hermes Agent 打造的自托管 Web 前端，实现了与 CLI 几乎 1:1 的特征对等，核心价值在于将具备持久记忆与自我学习能力的 Agent 体验无缝扩展到浏览器和移动端。\n\n### 解决的工程问题\n多数 AI 工具会话重置，缺乏对用户环境、项目规范和跨会话知识的长效记忆；同时，终端操作不便于随时随地访问，而现有 Web 界面或限于仪表板或需繁琐配置。Hermes WebUI 在解决这些问题的同时，保留了 Agent 的自主性和自进化能力，并避免绑定特定模型或云平台。\n\n### 为什么是现在\n自托管 AI Agent 从实验走向日常使用，用户需要更触手可及的界面以管理长期运行的代理进程；同时，对厂商锁定的担忧和对本地数据主权的要求上升，推动了对 agnostic 和 self-hosted 方案的需求。Hermes Agent 的成熟与社区增长（本项目已获 1.3 万星）使 WebUI 自然成为其“门面”。\n\n### 架构拆解\nHermes WebUI 是一个轻量级 Python 后端 + 原生 JavaScript 前端的组合体，无构建步骤、无框架、无打包器。后端主入口为 `server.py`，配合 `api/` 目录提供 REST 和 SSE 端点；前端位于 `static/`，采用三面板布局：左侧会话栏、中间聊天区、右侧工作区文件浏览器。模型、配置和代理状态通过底层 Hermes Agent 的直接调用或 CLI 桥接获得，会话数据复用 Hermes Agent 的 SQLite 存储。高级功能如 Gateway 支持的聊天和知识召回通过可选组件实现。\n\n- **Agent Loop**：循环由 Hermes Agent 本身实现，WebUI 仅负责展示和用户交互，包括流式 SSE 推送、工具调用卡片、子代理代理卡片等。\n- **Tool Interface**：工具调用由 Hermes Agent 输出，WebUI 将其渲染为可展开/折叠的卡片，显示工具名、参数和结果片段；对危险 shell 命令提供批准卡（允许一次/会话/始终/拒绝）。\n- **State / Memory**：用户画像、项目上下文、工作区文件状态和技能全部由 Hermes Agent 持久化，WebUI 通过 CLI 会话桥接从 SQLite 导入历史，保持状态一致。\n- **Planner**：规划完全交由 Hermes Agent 内部逻辑，WebUI 不做干预；子代理编排功能通过 Agent 之间的消息传递实现，不在 WebUI 层。\n- **Sandbox / 安全**：执行环境即宿主机，危险命令通过 UI 审批卡阻断；文件附件存储在工作区外默认位置，支持环境变量覆盖；访问控制通过 SSH 隧道或可选的密码保护。\n\n### 关键模块\n- **server.py / api/**：处理聊天消息、会话操作、工作区访问和配置读取的 HTTP/S SE 服务层。\n- **static/**：原生 JS 实现的三面板交互、SSE 客户端、语音输入（Web Speech API）、Mermaid 渲染、代码高亮等。\n- **bootstrap.py**：自动检测 Hermes Agent 并安装、创建 Python 环境、启动服务的一键引导脚本。\n- **ctl.sh**：守护进程管理脚本，封装 start/stop/status/logs 等命令，适合自托管 VM 场景。\n- **mcp_server.py**：可选的 MCP 服务器，提供标准化的代理通信接口（未在 README 详细说明）。\n- **docker-compose.yml / Dockerfile**：提供单容器和多容器部署方案。\n\n### 相似项目对比\nHermes 对比 OpenClaw、Claude Code、Codex CLI、OpenCode 的关键差异点在于：自动持久记忆（非仅项目级）、自学习技能（非市场/插件)、原生 Python 生态、自托管调度和 10+ 消息平台接入。Claude Code 无全自动跨会话记忆，OpenClaw 具有类似能力但技能系统依赖社区市场且稳定性不如 Hermes。整体上 Hermes 在自主性、可运行性和生态友好性上更优。\n\n### 部署与试用路径\n- **快速启动**：`git clone` 后运行 `python3 bootstrap.py`，脚本会检测并安装 Hermes Agent，启动服务并在浏览器打开；或使用 `./start.sh`。\n- **守护进程模式**：`./ctl.sh start` 后台运行，PID 写入 `~/.hermes/webui.pid`，日志在 `~/.hermes/webui.log`。\n- **Docker**：提供 `docker-compose.yml`，可单容器或三容器启动。\n- **远程访问**：通过 SSH 隧道或 Tailscale 等实现，README 有详细说明。\n\n### 风险与限制\n- **对 Hermes Agent 强依赖**：WebUI 自身不实现任何 Agent 逻辑，功能上限受 Hermes Agent 限制；若 Hermes Agent 缺少某项能力，WebUI 无法补足。\n- **平台限制**：官方引导脚本不支持原生 Windows，社区方案有路径和工具不匹配问题。\n- **安全问题**：作为 Web 界面，若直接暴露在公网而未经 SSH 隧道或密码保护，可能被未授权访问；危险命令审批依赖前端提示，无法完全杜绝误操作。\n- **版本同步**：WebUI 需跟上 Hermes Agent 的更新，若 Agent 接口变动可能导致 UI 部分功能异常。\n\n### 我能学到什么\n- 如何设计一个与 CLI 对等的 Agent Web UI，包括流式 SSE 渲染、上下文用量指示、工具调用卡片等交互模式。\n- 通过自托管守护进程管理（ctl.sh）实现生产级部署的模式。\n- MCP 服务器集成方法，可作为 Agent 间互操作的桥梁。\n- 持久会话和跨平台消息推送的架构思想，可迁移到其他 AI 应用。\n\n### 简历/项目亮点\n- \"主导设计并实现了 Hermes Agent 的全功能 Web 界面，采用无框架原生 JS 和 Python 后端，达到与 CLI 近 1:1 功能对等，社区获得 1.3 万星。\"\n- 可围绕以下点展开：如何通过 SSE 和轻量 API 实现与外部 Agent 进程的高效通信，如何处理工具调用卡片的复杂 UI 状态，会话管理的 SQLite 桥接技巧等。\n\n### 60 秒面试推销语\n\"Hermes WebUI 是一个自托管的 Agent Web 界面，它把具备记忆和自学习能力的 Hermes Agent 搬到了浏览器和手机上。我用 Python 和原生 JS 复刻了全部 CLI 功能，包括聊天、会话管理、工作区浏览和配置文件切换。项目只需一个引导脚本就能跑起来，无需额外配置。它在自托管 AI 领域对比 OpenClaw 等竞品有显著优势，尤其在技能自主生成和 Python 生态上。目前已获超 1.3 万星，成为同类最受欢迎的开源解决方案之一。\"\n\n### 是否能成为我的项目或 Playbook\n完全可以。这个项目是一个极好的 Agent UI 参考实现，可以 Fork 后定制主题、布局和集成方式；同时其会话管理、SSE 流式交互、工作区文件浏览等模块可抽象为可重用模式库，用作其他 Agent 前端的基础。"
    failure_mode: "功能完全依赖 Hermes Agent，WebUI 本身不实现 Agent 循环，若 Agent 进展缓慢或方向调整，WebUI 可能失去价值。"
    source_pointer: "https://github.com/nesquena/hermes-webui"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/MIT/v0.51.230"
experiments: []
claims:
  - "[[claims/hermes-webui-main-claim]]"
artifacts:
  - "[[artifacts/hermes-webui-repo]]"
metrics:
  - "stars=12938"
  - "forks=1579"
  - "open_issues=240"
  - "latest_release=v0.51.230"
  - "pushed_at=2026-06-03T05:48:40Z"
baselines: []
failure_modes:
  - "功能完全依赖 Hermes Agent，WebUI 本身不实现 Agent 循环，若 Agent 进展缓慢或方向调整，WebUI 可能失去价值。"
  - "官方不支持 Windows 引导，社区方案存在路径兼容和工具限制，可能影响部分用户群采用。"
  - "直接暴露 Web 接口有安全风险，依赖用户正确配置 SSH 隧道或密码，否则可能造成 Agent 误操作。"
  - "Hermes Agent 与 WebUI 版本可能脱节，维护成本高，需要持续跟随上游变更。"
missing_details: []
source_pointers:
  - "https://github.com/nesquena/hermes-webui"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/hermes-webui-main-claim]],官方 artifact 落库为 [[artifacts/hermes-webui-repo]]。See [[content/hermes-webui]]。
