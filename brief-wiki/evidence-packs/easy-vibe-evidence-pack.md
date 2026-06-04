---
content: "easy-vibe"
kind: "evidence-pack"
title: "easy-vibe — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个面向零基础到高级开发者的 AI 编程教学课程，通过分阶段的互动教程、可视化演示和真实案例，教你用自然语言「说」出应用。"
    internal_logic: "这是一个以 **Next.js 构建的文档教学站点**，而非可执行的 agent 框架，因此技术拆解重点在于其教学内容覆盖的概念和工程实践。\n\n### Agent Loop（教学中的代理循环）\n项目中 Stage 3 高级部分教授 Claude Code 的使用，**Agent Loop 体现为 “用户请求 -> LLM 规划 -> 执行代码/工具 -> 观察反馈 -> 迭代” 的对话式工作流**。教程通过实例引导用户用自然语言启动循环，并利用 MCP 和 Skills 扩展执行能力。\n\n### Tool Interface（工具接口）\n通过 **MCP（Model Context Protocol，模型上下文协议）和 Skills（自定义能力）** 教授如何让 AI 接入外部工具。教程指导集成支付（Stripe）、数据库、API 等，但未在仓库中提供具体工具接口代码。工具调用逻辑隐含在 Claude Code 等 IDE 产品的内部实现中。\n\n### State/Memory（状态与记忆）\n教学内容强调**长线任务（long-running tasks）和跨会话上下文**，通过 Spec Coding（规范编码）提前定义项目结构和约束，以此维持 agent 的状态一致性。但教程不涉及自定义记忆模块的实现，而是依赖 Claude Code 等工具的内置记忆管理。\n\n### Planner（规划器）\n在高级阶段，**Spec Coding 充当规划器**：用户在编码前用自然语言撰写详细的技术规范，AI 根据规范分步生成代码并自行检查。教程通过多个跨平台项目（Android/iOS/Web）演示如何制定计划并交由 agent 执行。\n\n### Sandbox（沙箱与安全边界）\n未在 README 或文档中明确说明安全沙箱机制。教学假设用户使用成熟的 AI IDE（如 Cursor、Trae、Claude Code），这些工具自身提供代码执行的安全边界。教程不涉及自定义沙箱实现。\n\n### 整体架构亮点\n- **文档与交互分离**：主站为静态文档，交互组件通过前端组件化加载（如 RAG 游戏化演示、Git 原理动画）。\n- **多语言工程**：采用 docs-readme 目录存放各语言翻译，构建时渲染为独立页面。\n- **AI 友好设计**：添加 `llms.txt` 文件，让 AI agents 能快速理解仓库结构并定位教程内容，这本身是一种与 agent 协作的工程实践。"
    failure_mode: "作为教学项目，仓库本身不包含可复用的 agent 框架代码，直接拿来即用的工程价值有限。"
    source_pointer: "https://github.com/datawhalechina/easy-vibe"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/not_found/not_found"
experiments: []
claims:
  - "[[claims/easy-vibe-main-claim]]"
artifacts:
  - "[[artifacts/easy-vibe-repo]]"
metrics:
  - "stars=15799"
  - "forks=1498"
  - "open_issues=14"
  - "latest_release=not_found"
  - "pushed_at=2026-06-03T05:40:18Z"
baselines: []
failure_modes:
  - "作为教学项目，仓库本身不包含可复用的 agent 框架代码，直接拿来即用的工程价值有限。"
  - "高度依赖 Claude Code、Cursor 等外部工具，这些工具的更新可能使教程过时。"
  - "许可证为 CC BY-NC-SA 4.0，限制商业使用，若用于企业内部培训需注意授权。"
missing_details:
  - "license_spdx_id: not_found"
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
source_pointers:
  - "https://github.com/datawhalechina/easy-vibe"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/easy-vibe-main-claim]],官方 artifact 落库为 [[artifacts/easy-vibe-repo]]。See [[content/easy-vibe]]。
