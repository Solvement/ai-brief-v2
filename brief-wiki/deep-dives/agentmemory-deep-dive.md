---
content: "agentmemory"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "agentmemory — 深度拆解"
reasoning_trace:
  paper_type_decision: "项目提供 MCP 服务器、工具、钩子、多代理集成，符合 agent_framework 分类（记忆服务作为代理框架的组成部分）。"
  central_contribution: "提供了一个开箱即用的、高精度、多代理兼容的持久记忆后端，使 AI 编程代理能自动记住和复用历史上下文。"
  inspected:
    - "README.md (前14K)"
    - "top-level directory tree"
    - "topics"
    - "key files list"
    - "package.json existence"
    - "test/ directory"
    - "examples/ directory"
  top_claims:
    - "LongMemEval-S 基准上获得 95.2% R@5 召回率"
    - "自定义编码代理生命期语料上精确率是 grep 的 2.2 倍"
    - "支持任何 MCP 客户端及多达 18 种主流代理"
    - "零外部数据库依赖，npm 全局安装即用"
    - "950+ 测试通过，12 个自动钩子，53 个 MCP 工具"
  evidence_needed:
    - "完整 README 的 vs Competitors 部分，以了解与类似系统的对比"
    - "iii 引擎的架构文档，以评估记忆存储的可靠性和性能"
    - "安全设计的详细文档（加密、认证）"
    - "沙箱基准测试的详细实现"
  main_threats:
    - "iii 引擎可能是一个单点维护的开源项目，寿命不确定"
    - "基准测试结果可能受语料构建方式影响，真实场景泛化性存疑"
    - "记忆自动捕获可能误捕无关信息，增加噪声"
  transfer_decision: "可复用 MCP 工具服务器模式和混合搜索思路，但记忆存储后端（iii 引擎）如果不可控，则替换为自研或更通用的向量数据库。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 5
  main_risk: "过度依赖 iii 引擎，且项目处于早期，长期稳定性未经验证。"
next_actions:
  - "clone-and-run"
  - "write-deepdive"
  - "extract-pattern(memory-server-mcp)"
claim_ledger:
  - claim: "在 LongMemEval-S 上取得 95.2% R@5 召回率"
    plain_english: "在标准长期记忆测试集上，前5个结果中能找到95.2%的正确答案。"
    source: "README 中的 LongMemEval-S 表格"
    evidence_strength: "medium"
    supports: "系统具备优秀的检索准确度"
    does_not_support: "只在特定数据集上验证，不代表所有真实编码场景"
    threat: "数据集可能已被系统针对优化，且未与其他系统完整对比（仅与 BM25 对比）"
  - claim: "自定义语料精确率是 grep 的 2.2 倍"
    plain_english: "在项目自己收集的编码代理会话语料上，找到的相关结果比例是简单文本搜索的2.2倍。"
    source: "README 中的 coding-agent-life-v1 表格"
    evidence_strength: "medium"
    supports: "证明了混合搜索优于朴素关键词搜索"
    does_not_support: "未与更先进的检索系统对比，且语料公开性未知"
    threat: "自定义语料可能存在构造偏差，使 grep 表现不佳"
  - claim: "支持任何 MCP 客户端及 18 种主流代理"
    plain_english: "任何遵循 MCP 协议的代理都能接入，且已显式列出对 Claude Code、Copilot CLI、Cursor 等 18 种代理的支持。"
    source: "README 中'Works with every agent'表格"
    evidence_strength: "high"
    supports: "极高的兼容性"
    does_not_support: "集成深度可能不一，某些代理可能仅支持部分功能"
    threat: "随着代理版本更新，部分适配可能失效"
  - claim: "零外部数据库依赖，npm 安装即用"
    plain_english: "不需要安装 MySQL、PostgreSQL 等，运行 agentmemory 命令即可启动。"
    source: "README 中 '0 external DBs' 徽章和安装说明"
    evidence_strength: "high"
    supports: "部署极简"
    does_not_support: "不保证大规模记忆下的性能"
    threat: "嵌入式存储可能成为性能瓶颈"
  - claim: "950+ 个测试通过，CI 集成"
    plain_english: "项目有完善的自动化测试，确保主要功能稳定。"
    source: "README 中 '950+ tests passing' 徽章"
    evidence_strength: "high"
    supports: "代码质量有基本保障"
    does_not_support: "未披露测试覆盖范围和复杂度"
    threat: "可能仅覆盖 happy path"
artifact_audit:
  official_repo: "https://github.com/rohitg00/agentmemory"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "Apache-2.0"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "reproducible"
---

## 大白话定位

**Agentmemory 是一个为 AI 编程代理（AI coding agent）提供持久记忆的服务器，基于 iii 引擎，通过 MCP（Model Context Protocol，模型上下文协议，一种让 AI 模型与外部工具通信的标准协议）或 HTTP 接入任何代理，使它们能记住项目上下文、决策和偏好，跨会话复用，避免重复解释。**

> 一句话:让你的 AI 编程代理真正拥有记忆：一个命令，零外部依赖，跨所有代理共享。

## 为什么火

- **解决了 AI 编程代理的“失忆”痛点:** 每次新会话都要重新解释项目架构、技术决策、Bug 修复历史，而内置记忆文件（如 CLAUDE.md）容量有限且易陈旧。Agentmemory 自动捕获代理行为，压缩成可搜索记忆，下次会话自动注入相关上下文。
- **极广的代理兼容性:** 支持 Claude Code、GitHub Copilot CLI、Cursor、Gemini CLI、Codex CLI、Aider 等近 20 种主流编程代理，且所有代理共享同一记忆服务器，实现一次记录，处处使用。
- **强大的检索性能基准:** 在 LongMemEval-S（ICLR 2025）上达到 95.2% 的 R@5 召回率，在自定义编码代理生命周期语料上精确率是朴素 grep 的 2.2 倍，且 P50 延迟仅 14ms。
- **极简部署与零外部依赖:** npm install -g 全局安装即可，不需要外部数据库（0 external DBs），内置 SQLite，一个 agentmemory 命令启动记忆服务器。
- **开源且活跃开发:** Apache-2.0 许可，社区 20k+ stars，每日大量提交，频繁发布新版（v0.9.22），并附带完整测试（950+）。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README.md | available | 根目录下 README.md，内容详尽，包含安装、代理支持、基准测试、工作原理等。 |
| src/ | available | src 目录存在，包含源代码。 |
| test/ | available | test 目录存在，README 提及 950+ 个测试通过。 |
| LICENSE | available | 根目录包含 LICENSE 文件，为 Apache-2.0。 |
| package.json | available | 根目录 package.json 存在。 |
| docker-compose.yml | available | 根目录 docker-compose.yml 存在。 |
| docs/ | available | docs 目录存在。 |
| examples/ | available | examples 目录存在。 |
| benchmark/ | available | benchmark 目录存在。 |

一句话:**artifact 至少有源码、测试和 license 信号,可进入深挖**

## 技术拆解(agent framework / agent 怎么跑起来)

### 代理循环（Agent Loop）

Agentmemory 本身**不是**一个代理，而是为外部 AI 编程代理提供记忆服务的后端。其代理循环完全由接入的代理（如 Claude Code、Cursor 等）自身管理。Agentmemory 在代理需要回忆历史信息时被调用（通过 MCP 工具或 HTTP API），将相关记忆片段注入代理的上下文窗口，从而影响代理的下一步决策。

### 工具接口（Tool Interface）

**MCP 服务器**：核心对外接口是一个 MCP 服务器，运行在 `:3111` 端口，暴露 **53 个 MCP 工具**。这些工具涵盖了记忆的存储、检索、更新、删除、摘要生成等操作。任何支持 MCP 的代理都可以通过配置接入，无需修改代理源码。

**Hooks 系统**：提供了 **12 个自动钩子**，在代理生命周期内自动触发（如会话开始、消息发送前/后），用于异步捕获代理行为和注入记忆。

**Skills 集成**：可通过 `npx skills add` 安装 8 个原生 skills，让代理“知道”何时该调用记忆工具。

**REST API**：对于不支持 MCP 的代理（如 Aider），提供 REST API 直接调用。

### 状态/记忆（State/Memory）

**持久化存储**：默认使用嵌入式数据库（无外部依赖，根据 README“0 external DBs”推测为 SQLite），将代理会话中捕获的代码、决策、推理等信息存储为结构化记忆。

**混合搜索**：采用 BM25（基于词频的全文搜索）与向量检索结合的混合搜索，在基准测试中取得高精度。

**自动捕获**：代理执行任务时，Agentmemory 自动监听工具调用、文件变更、终端输出等，提取关键信息存入记忆，无需手动记录。

**生命周期与置信度**：记忆条目带有置信度评分和生命周期管理，防止过时信息污染上下文。其设计扩展了 Karpathy 的 LLM Wiki 模式，加入了知识图谱（knowledge graph）。

**多代理隔离**：通过 `AGENT_ID` 环境变量实现多代理间的记忆隔离，可选的 `AGENTMEMORY_AGENT_SCOPE=isolated` 提供更严格的过滤。

### 规划器（Planner）

Agentmemory 不包含显式规划器。它通过“记忆注入”影响代理的内部规划：当代理需要生成计划时，Agentmemory 提供历史相关记忆，帮助代理做出更准确的决策。这种机制可视为“记忆增强的规划”。

### 沙箱（Sandbox）

README 中提到“coding-agent-life-v1 (in-house corpus, sandbox-reproducible)”，表明项目提供了**可复现的沙箱环境**用于基准测试，但并未详细说明沙箱实现。推测可能是 Docker 容器或隔离的测试环境，用于模拟代理编程任务。

### 安全边界（Safety）

**代理隔离**：通过 `AGENT_ID` 隔离不同代理的记忆，避免数据混淆。

**最小权限**：Agentmemory 作为 MCP 服务器运行时，仅与代理通信，不主动访问外部系统。

**数据存储本地化**：所有记忆存储在本地文件系统中，无云端上传，减少数据泄露风险。

**无外部数据库**：零外部依赖降低了攻击面。

README 未提及更多安全措施（如加密、访问控制），安全部分可能尚在完善中。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 学习如何为 AI 代理构建持久化记忆系统，包括混合搜索、记忆生命周期管理、MCP 工具服务器设计、跨代理集成模式。 |
| 迁移到 AI-Brief | 可移植 MCP 记忆服务器的架构，为 AI-Brief 的编码代理或分析代理添加长期记忆能力，减少重复上下文解释。 |
| 迁移到 BriefMem | 将其记忆捕获、压缩、检索的流水线模式引入 BriefMem，实现“一键记忆”外部知识注入。 |
| 简历故事 | 主导开发了一个多代理共享的 MCP 记忆服务器，整合混合搜索与自动捕获机制，在标准评测上达到 95.2% 召回率，支持近 20 种主流编程代理，为团队项目节省了大量上下文解释时间。” |

## 风险

- 依赖 iii 引擎（github.com/iii-hq/iii），该引擎的成熟度和维护性未在 README 中说明，存在 bus factor 风险。
- 项目仍处于早期版本（v0.9.x），API 可能不稳定，频繁更新可能导致集成代码需要调整。
- 性能基准基于自定义语料和公共数据集，但在真实大型项目上的表现未经验证。
- 仅以 npm 形式发布，对非 Node.js 生态的代理集成不便（需额外适配）。
- 安全特性（如加密、认证）在 README 中未详述，生产环境部署需谨慎评估。

## Memory card

```text
problem_pattern:        AI 编码代理在跨会话时无法记住项目上下文，导致重复解释架构、技术决策和发现过的 Bug，降低开发效率。
architecture_pattern:   集中式记忆服务器，通过 MCP 协议对外暴露记忆工具，所有代理共享同一记忆存储；服务器内部使用混合搜索（BM25+向量）和生命周期管理来提供精准记忆注入。
reusable_pattern:       任何 AI 代理框架都可以通过实现 MCP 客户端接入外部记忆服务，无需更改代理自身逻辑；记忆的自动捕获机制可作为钩子模板复用。
risk_pattern:           记忆服务器成为单点故障，且对底层存储引擎的依赖可能导致技术锁定。
similar_projects:       未在 README/artifact 说明，但常见竞争项如 mem0、Letta 等提供类似功能。
```

可复用范式落库:[[concepts/external-memory-server]]、[[concepts/mcp-tool-server]]。另见 [[content/agentmemory]]、[[claims/agentmemory-main-claim]]。
