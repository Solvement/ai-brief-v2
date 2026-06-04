---
content: "ui-tars-desktop"
kind: "evidence-pack"
title: "UI-TARS-desktop — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个开源的多模态 AI Agent 栈，让 AI 直接操控你的电脑、浏览器和终端，像人类一样完成订票、填表等复杂 UI 任务"
    internal_logic: "### Agent Loop 与事件驱动\n\nAgent TARS 的回路基于 **Event Stream** 协议，每一步动作（思考、工具调用、截图、结果）都被序列化为事件。这使得整个 loop 可观测、可中断、可重放。用户通过 CLI 或 Web UI 发起任务后，Agent 进入「感知 → 推理 → 行动」循环，**多模态 LLM** 接收屏幕截图/元素信息，输出下一步操作指令（例如点击坐标、输入文本），然后由运行时执行，并将执行结果重新反馈给模型。该事件流不仅驱动 Agent 行为，还直接驱动前端 UI 的实时更新，实现了执行与展示的分离。\n\n#### 混合感知与行动\n\n浏览器操作支持三种策略：**Visual Grounding**（基于屏幕截图让模型理解界面）、**DOM**（解析页面元素树提供结构化信息）、以及二者的混合。这解决了纯视觉方案在复杂网页中定位不准的问题，同时利用 DOM 信息提高效率。Agent 可以根据任务难度动态选择最合适的感知模式。\n\n### Tool Interface：MCP 作为统一工具层\n\n整个 Agent 内核构建在 **MCP（Model Context Protocol）** 之上，所有工具（浏览器操作、命令行执行、文件读写、第三方 API）都被抽象为 MCP Server。用户可以通过配置挂载额外的 MCP 服务，例如搜索引擎、机票 API，无缝扩展 Agent 能力。工具调用同样通过事件流通知，调用结果以结构化的方式流式返回，并带有计时统计。\n\n#### 沙箱：AIO Agent Sandbox\n\n为了实现安全的工具执行，Agent TARS 集成了 **AIO agent Sandbox**，这是一个独立的、一体化的执行环境。Shell 命令、文件操作等危险操作会被隔离运行，防止对宿主系统造成破坏。沙箱的引入使得 Agent 能够执行任意、多步的工具链，而不会触发系统的安全告警或污染用户环境。\n\n### State / Memory 管理\n\n项目主要通过 **Context Engineering**（上下文工程）来管理状态和记忆，它会动态压缩和重组历史交互，将关键的截图、DOM 快照、用户指令和工具结果保留在模型上下文中。与传统的对话记忆不同，这种工程化上下文专门为 GUI Agent 设计，确保在长长的操作序列中模型不会丢失目标。\n\n#### Planner 实现\n\n未在 README/artifact 中说明明确的规划器模块。从行为上看，多模态 LLM 本身扮演了规划器角色，根据当前屏幕状态和历史事件流决定下一步动作，属于「反应式规划」，而没有预先规划整个任务树。未来版本可能加入分层规划（如将复杂任务拆解为子任务），但目前未提供证据。\n\n### 安全边界\n\n未在 README/artifact 中说明安全边界的具体策略。存在以下隐含担忧：GUI 操作可以访问用户屏幕上的任何内容，包括敏感信息；远程计算机和浏览器操作可能被滥用。项目提及沙箱隔离工具执行，但未说明数据隐私保护、操作权限限制、或对 AI 行为的审计机制。\n\n### 关键模块与架构\n\n仓库采用 **pnpm monorepo** 结构：\n\n- **apps/**：包含 UI-TARS Desktop 应用和 Agent TARS Web UI，使用 Electron？\n- **packages/**：存放可复用的核心逻辑，如 @agent-tars/cli、@agent-tars/sdk 等。\n- **infra/**：基础设施代码，可能包含 MCP 内核实现。\n- **multimodal/**：多模态模型相关逻辑。\n\nAgent TARS 本身是一个命令行工具，同时提供 Web UI 作为可选的图形化交互方式。UI-TARS Desktop 则是独立的桌面应用程序，直接运行在用户操作系统上，能够控制本地窗口和应用。"
    failure_mode: "安全边界未明确：Agent 能截取全屏截图、执行任意系统命令，虽提供沙箱但仅在工具执行层隔离，缺乏对模型操作行为的细粒度权限控制和审计日志"
    source_pointer: "https://github.com/bytedance/ui-tars-desktop"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/true/Apache-2.0/v0.3.0"
experiments: []
claims:
  - "[[claims/ui-tars-desktop-main-claim]]"
artifacts:
  - "[[artifacts/ui-tars-desktop-repo]]"
metrics:
  - "stars=35949"
  - "forks=3619"
  - "open_issues=401"
  - "latest_release=v0.3.0"
  - "pushed_at=2026-05-18T02:55:49Z"
baselines: []
failure_modes:
  - "安全边界未明确：Agent 能截取全屏截图、执行任意系统命令，虽提供沙箱但仅在工具执行层隔离，缺乏对模型操作行为的细粒度权限控制和审计日志"
  - "模型依赖性强：底层模型 UI-TARS 与 Seed-VL 为字节跳动专有，虽然开源但社区生态不如主流模型，切换其他 VLM 可能需要大量适配工作"
  - "生产环境成熟度存疑：当前最新版本 v0.3.0，开放 issue 超过 400 个，部分功能（如远程操作）可能尚不稳定，缺乏全面的测试覆盖和 CI/CD 证明"
  - "仅支持 Node.js 生态：整体项目基于 TypeScript/Node.js，虽然跨平台但限制了非 JS 栈的开发者和生产环境（如 Python 后端）的深度集成"
  - "远程操控风险：远程计算机和浏览器操作功能免费且零配置，但未说明身份认证机制，存在被恶意利用的风险"
missing_details: []
source_pointers:
  - "https://github.com/bytedance/ui-tars-desktop"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/ui-tars-desktop-main-claim]],官方 artifact 落库为 [[artifacts/ui-tars-desktop-repo]]。See [[content/ui-tars-desktop]]。
