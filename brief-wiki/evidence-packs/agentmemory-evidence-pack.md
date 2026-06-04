---
content: "agentmemory"
kind: "evidence-pack"
title: "agentmemory — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Agentmemory 是一个为 AI 编程代理（AI coding agent）提供持久记忆的服务器，基于 iii 引擎，通过 MCP（Model Context Protocol，模型上下文协议，一种让 AI 模型与外部工具通信的标准协议）或 HTTP 接入任何代理，使它们能记住项目上下文、决策和偏好，跨会话复用，避免重复解释。"
    internal_logic: "### 代理循环（Agent Loop）\n\nAgentmemory 本身**不是**一个代理，而是为外部 AI 编程代理提供记忆服务的后端。其代理循环完全由接入的代理（如 Claude Code、Cursor 等）自身管理。Agentmemory 在代理需要回忆历史信息时被调用（通过 MCP 工具或 HTTP API），将相关记忆片段注入代理的上下文窗口，从而影响代理的下一步决策。\n\n### 工具接口（Tool Interface）\n\n**MCP 服务器**：核心对外接口是一个 MCP 服务器，运行在 `:3111` 端口，暴露 **53 个 MCP 工具**。这些工具涵盖了记忆的存储、检索、更新、删除、摘要生成等操作。任何支持 MCP 的代理都可以通过配置接入，无需修改代理源码。\n\n**Hooks 系统**：提供了 **12 个自动钩子**，在代理生命周期内自动触发（如会话开始、消息发送前/后），用于异步捕获代理行为和注入记忆。\n\n**Skills 集成**：可通过 `npx skills add` 安装 8 个原生 skills，让代理“知道”何时该调用记忆工具。\n\n**REST API**：对于不支持 MCP 的代理（如 Aider），提供 REST API 直接调用。\n\n### 状态/记忆（State/Memory）\n\n**持久化存储**：默认使用嵌入式数据库（无外部依赖，根据 README“0 external DBs”推测为 SQLite），将代理会话中捕获的代码、决策、推理等信息存储为结构化记忆。\n\n**混合搜索**：采用 BM25（基于词频的全文搜索）与向量检索结合的混合搜索，在基准测试中取得高精度。\n\n**自动捕获**：代理执行任务时，Agentmemory 自动监听工具调用、文件变更、终端输出等，提取关键信息存入记忆，无需手动记录。\n\n**生命周期与置信度**：记忆条目带有置信度评分和生命周期管理，防止过时信息污染上下文。其设计扩展了 Karpathy 的 LLM Wiki 模式，加入了知识图谱（knowledge graph）。\n\n**多代理隔离**：通过 `AGENT_ID` 环境变量实现多代理间的记忆隔离，可选的 `AGENTMEMORY_AGENT_SCOPE=isolated` 提供更严格的过滤。\n\n### 规划器（Planner）\n\nAgentmemory 不包含显式规划器。它通过“记忆注入”影响代理的内部规划：当代理需要生成计划时，Agentmemory 提供历史相关记忆，帮助代理做出更准确的决策。这种机制可视为“记忆增强的规划”。\n\n### 沙箱（Sandbox）\n\nREADME 中提到“coding-agent-life-v1 (in-house corpus, sandbox-reproducible)”，表明项目提供了**可复现的沙箱环境**用于基准测试，但并未详细说明沙箱实现。推测可能是 Docker 容器或隔离的测试环境，用于模拟代理编程任务。\n\n### 安全边界（Safety）\n\n**代理隔离**：通过 `AGENT_ID` 隔离不同代理的记忆，避免数据混淆。\n\n**最小权限**：Agentmemory 作为 MCP 服务器运行时，仅与代理通信，不主动访问外部系统。\n\n**数据存储本地化**：所有记忆存储在本地文件系统中，无云端上传，减少数据泄露风险。\n\n**无外部数据库**：零外部依赖降低了攻击面。\n\nREADME 未提及更多安全措施（如加密、访问控制），安全部分可能尚在完善中。"
    failure_mode: "依赖 iii 引擎（github.com/iii-hq/iii），该引擎的成熟度和维护性未在 README 中说明，存在 bus factor 风险。"
    source_pointer: "https://github.com/rohitg00/agentmemory"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/true/Apache-2.0/v0.9.25"
experiments: []
claims:
  - "[[claims/agentmemory-main-claim]]"
artifacts:
  - "[[artifacts/agentmemory-repo]]"
metrics:
  - "stars=20791"
  - "forks=1712"
  - "open_issues=210"
  - "latest_release=v0.9.25"
  - "pushed_at=2026-06-02T23:35:02Z"
baselines: []
failure_modes:
  - "依赖 iii 引擎（github.com/iii-hq/iii），该引擎的成熟度和维护性未在 README 中说明，存在 bus factor 风险。"
  - "项目仍处于早期版本（v0.9.x），API 可能不稳定，频繁更新可能导致集成代码需要调整。"
  - "性能基准基于自定义语料和公共数据集，但在真实大型项目上的表现未经验证。"
  - "仅以 npm 形式发布，对非 Node.js 生态的代理集成不便（需额外适配）。"
  - "安全特性（如加密、认证）在 README 中未详述，生产环境部署需谨慎评估。"
missing_details: []
source_pointers:
  - "https://github.com/rohitg00/agentmemory"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/agentmemory-main-claim]],官方 artifact 落库为 [[artifacts/agentmemory-repo]]。See [[content/agentmemory]]。
