---
content: "hermes-desktop"
kind: "evidence-pack"
title: "hermes-desktop — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "为命令行AI代理 Hermes Agent 提供一键安装、配置和多功能桌面交互界面的 Electron 应用"
    internal_logic: "### 总览\n\nHermes Desktop 是一个 Electron 桌面应用，用于安装、配置并和 Hermes Agent 聊天。它不包含代理核心逻辑，而是作为前端壳层，通过 HTTP SSE 与本地或远程的 Hermes Agent 后端通信。整体设计遵循**胖客户端、瘦服务器**模式，将用户交互、会话管理、工具配置和消息网关等复杂功能都放在客户端实现。\n\n### 代理循环 (Agent Loop)\n\n代理循环本身运行在 Hermes Agent 后端，桌面应用不实现规划或执行逻辑。客户端通过向 `http://127.0.0.1:8642` （本地模式）或远程 URL 发送聊天请求，接收 SSE 流式响应，再渲染到界面上。因此，代理的推理、工具调用、自我改进等核心行为完全依赖于上游项目。\n\n#### 工具接口 (Tool Interface)\n\n桌面应用**管理工具的启用/禁用**，但不执行工具。界面中提供 14 类工具集（网页、浏览器、终端、文件、代码执行等）的开关，配置通过 Hermes Agent 的配置文件持久化。聊天时，工具调用的进度通过**实时流解析**渲染为 UI 指示器，让用户感知代理正在执行的操作。\n\n#### 状态与记忆 (State/Memory)\n\n- **会话状态**：使用 **better-sqlite3** 本地存储会话历史，并启用 **FTS5** 全文搜索，支持按日期分组浏览、恢复历史对话。\n- **用户记忆**：界面提供记忆条目查看、编辑、容量跟踪，并内置 6 个记忆后端（Honcho、Hindsight、Mem0 等）的发现和配置，记忆数据的实际存储和检索由后端和记忆服务商处理。\n- **配置文件**：在 `~/.hermes` 目录下管理多配置文件，通过 `Profiles` 功能实现环境隔离。\n\n#### 规划器 (Planner)\n\n未在 README 中说明任何显式规划机制。代理的任务规划能力可能作为后端的一个工具集（task planning）提供，桌面应用仅提供 UI 开关。\n\n#### 沙盒与安全边界 (Sandbox/Safety)\n\n未在 README 中提及沙盒或安全机制。应用本身是一个 Electron 容器，安全边界取决于底层操作系统和 Hermes Agent 的执行环境。源码审查可能发现沙盒策略，但基于 README 信息无法确认。\n\n### 架构拆解\n\n#### 多进程架构\n\n- **主进程**：管理 Hermes 安装生命周期、代理进程启停、本地后端连接、IPC 处理、系统托盘和自动更新。\n- **渲染进程**：React 19 界面，通过 IPC 与主进程通信，负责聊天 UI、设置页面、配置管理等。\n- **预加载脚本**：暴露安全的 API 桥接，进行 SSE 解析和令牌用量跟踪。\n\n#### 关键模块\n\n- **安装向导**：首次运行时检测环境，引导用户选择本地或远程模式，处理依赖安装（Git、uv、Python 3.11+）。\n- **会话管理**：SQLite 数据库存储所有对话，提供搜索和恢复功能。\n- **配置文件管理**：支持多配置文件，每个文件有独立的 Hermes 环境。\n- **供应商抽象层**：统一管理 11 个 LLM 供应商的配置和 API 密钥。\n- **计划任务引擎**：基于 cron 的任务构建器，支持 15 种交付目标。\n- **消息网关**：配置和切换 16 个消息平台集成，实现多平台代理交互。\n\n#### 开发与测试\n\n项目使用 Vite 7 + electron-vite 构建，配置了 ESLint、TypeScript 严格模式。测试用例覆盖 SSE 解析器、IPC 处理、安装器工具等，使用 Vitest 运行。"
    failure_mode: "项目重度依赖上游 Hermes Agent，若其 API 或配置方式变更，桌面应用可能无法工作。"
    source_pointer: "https://github.com/fathah/hermes-desktop"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/MIT/v0.5.5"
experiments: []
claims:
  - "[[claims/hermes-desktop-main-claim]]"
artifacts:
  - "[[artifacts/hermes-desktop-repo]]"
metrics:
  - "stars=9810"
  - "forks=1172"
  - "open_issues=248"
  - "latest_release=v0.5.5"
  - "pushed_at=2026-06-03T14:07:34Z"
baselines: []
failure_modes:
  - "项目重度依赖上游 Hermes Agent，若其 API 或配置方式变更，桌面应用可能无法工作。"
  - "Windows 安装包未签名，Fedora RPM 无 GPG 签名，可能触发安全软件警告，影响分发。"
  - "处于早期阶段（v0.5.5），功能可能不稳定，公开 issues 248 个，表明存在较多未解决问题。"
  - "沙盒与安全边界未在文档中说明，存在潜在的本地运行风险。"
missing_details: []
source_pointers:
  - "https://github.com/fathah/hermes-desktop"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/hermes-desktop-main-claim]],官方 artifact 落库为 [[artifacts/hermes-desktop-repo]]。See [[content/hermes-desktop]]。
