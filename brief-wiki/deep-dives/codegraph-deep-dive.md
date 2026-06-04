---
content: "codegraph"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "codegraph — 深度拆解"
reasoning_trace:
  paper_type_decision: "agent_framework，因为该项目通过 MCP 服务器向多个 AI 编程 agent 提供代码探索工具，核心是工具接口和知识图谱，没有独立的 agent 循环或规划。"
  central_contribution: "一个预索引的代码知识图谱，通过 MCP 工具让 AI 编程助手用极低的 token 和调用次数获取代码结构信息，实现大幅效率提升和完全本地化。"
  inspected:
    - "README.md 全文（安装、基准测试、功能列表、自动同步细节）"
    - "顶层目录结构（.claude, .cursor, src, docs, __tests__ 等）"
    - "package.json 存在性"
    - "许可证文件存在性"
  top_claims:
    - "平均节省 16% 费用、47% tokens、22% 时间、58% 工具调用"
    - "支持 20+ 编程语言和 14 个 web 框架"
    - "完全本地运行，无 API 密钥、无数据离开机器"
    - "文件监视器 + 过时提醒保证索引始终新鲜"
    - "一行命令自动配置 Claude Code、Cursor 等 8 种 agent"
  evidence_needed:
    - "基准测试的原始数据和复现步骤（已给出详细方法和查询语句）"
    - "语言和框架支持的具体列表和解析器实现（在 Key Features 中列出，但解析细节在源码中）"
    - "本地存储的 Schema 和查询能力（未在 README 详述）"
    - "自动同步的可靠性测试（已描述机制，但未给出长时间运行的数据）"
    - "在其他 agent 上的实际效果（基准测试仅 Claude Code）"
  main_threats:
    - "基准测试可能过拟合于特定查询和模型版本，真实收益随 agent 升级或查询类型变化而波动。"
    - "代码解析器的覆盖率决定知识图谱的质量，对边缘语法的支持可能不足。"
    - "MCP 协议的接受度尚未成为唯一标准，若被替代则需大量改造。"
  transfer_decision: "重用其知识图谱的构建思路和 MCP 工具模式，但不会直接复用其静态解析器，因为我们的场景可能需要不同的语言解析或扩展。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 5
  main_risk: "上游 MCP 标准变化或 agent 生态分裂可能导致适配成本上升。"
next_actions:
  - "clone-and-run"
  - "read-docs"
  - "write-deepdive"
claim_ledger:
  - claim: "使用 CodeGraph 后，AI 助手平均节省 16% 费用、47% tokens、22% 时间、58% 工具调用。"
    plain_english: "在 7 个开源项目上测试，有 CodeGraph 比没有它整体更省。"
    source: "README.md 中的 Benchmarks 表格和详细 breakdown"
    evidence_strength: "high"
    supports: "给出了每项目具体数值、方法论、查询语句、模型版本，且数据一致。"
    does_not_support: "仅测试了一种模型（Claude Opus 4.8）和一种查询类型（架构问题），可能不推广到所有场景。"
    threat: "新模型可能自带高效探索能力，缩小收益；或用户实际使用复杂查询时收益降低。"
  - claim: "支持 20+ 编程语言和 14 个 web 框架。"
    plain_english: "能解析很多语言的代码，并认出路由。"
    source: "README.md Key Features 列表"
    evidence_strength: "medium"
    supports: "明确列出了语言和框架数量，但未公开每种语言的解析器质量或覆盖率。"
    does_not_support: "未在 README 列出所有具体框架名称或支持的详细功能（如路由模板语法）。"
    threat: "对于某些语言的新特性或非标准写法可能解析失败。"
  - claim: "100% 本地运行，无 API 密钥，无数据离开机器。"
    plain_english: "所有东西都在你电脑上，不上传。"
    source: "README.md Key Features 及描述"
    evidence_strength: "high"
    supports: "架构明确基于本地 SQLite 和 MCP 本地连接，无需外部服务。"
    does_not_support: "除非用户主动使用需要网络的 agent，CodeGraph 自身不联网。"
    threat: "若代理本身将结果上传至外部服务，则 CodeGraph 的本地性被绕过，但这不是 CodeGraph 的职权范围。"
  - claim: "文件监视器自动同步，agent 永不会得到过时数据。"
    plain_english: "你改代码，图谱自动更新，还有提醒防止短暂不同步。"
    source: "README.md 的 'How auto-syncing works' 部分"
    evidence_strength: "medium"
    supports: "描述了 FSEvents/inotify 机制、防抖、过时 Banner、连接时追赶。"
    does_not_support: "未提供极端并发编辑下的表现数据，或防抖窗口内 agent 不读文件 banner 的可能。"
    threat: "在禁用文件监视器的环境（如某些容器）中需手动 sync，若忘记则会拿到旧数据；过时 Banner 依赖 agent 遵循指令。"
artifact_audit:
  official_repo: "https://github.com/colbymchenry/codegraph"
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

## 大白话定位

**给 Claude Code、Cursor 等编程 AI 助手配上一个离线的代码关系地图，让 AI 直接查地图找代码，而不是反复扫文件、搜字符串，省 token、省调用、完全本地跑。**

> 一句话:把 AI 编程的“找代码”变成一个查地图的动作，一问直达，不用乱翻。

## 为什么火

- **多 AI 助手开箱即用:** 已适配 Claude Code、Cursor、Codex、Gemini、OpenCode、AntiGravity、Kiro、Hermes Agent，一条命令自动配置 MCP 集成，零摩擦接入。
- **实打实的效率提升:** 在 7 个真实仓库上的基准测试显示，平均省 16% 费用、47% tokens、22% 时间、58% 工具调用。尤其在大型、多语言项目上，工具调用减少 80% 以上。
- **完全本地，隐私零妥协:** 不调 API，不上传数据，所有索引和查询在本地 SQLite 完成。无密钥、无外部服务，不用担心代码泄露。
- **20+ 语言 & 14 种 web 框架感知:** 覆盖 TypeScript、Python、Go、Rust、Java 等主流语言，并能识别路由文件、跨语言桥接（如 Swift ↔ ObjC、React Native 混合项目），填补静态解析的盲区。
- **自动同步，永远保持新鲜:** 利用操作系统原生文件事件，代码变更后自动重索引；带防抖和过时提醒，agent 绝不会拿到旧数据。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README.md | available | 仓库根目录 README.md，包含项目介绍、安装、基准测试、功能列表等完整信息。 |
| package.json | available | 根目录 package.json，定义 npm 包和依赖。 |
| tsconfig.json | available | TypeScript 编译配置。 |
| docs/ | available | 文档目录，包含更多用法说明。 |
| src/ | available | 源代码目录。 |
| __tests__/ | available | 测试目录。 |
| install.sh / install.ps1 | available | 提供了 macOS/Linux 和 Windows 的安装脚本。 |
| LICENSE | available | MIT 协议。 |
| examples/ | not_found | 根目录未发现 examples 目录。 |
| Dockerfile / docker-compose.yml | not_found | 根目录未发现 Docker 相关文件。 |

一句话:**artifact 至少有源码、测试和 license 信号,可进入深挖**

## 技术拆解(agent framework / agent 怎么跑起来)

### 整体架构：预索引知识图谱 + MCP 工具接口
CodeGraph 由两部分组成：一个本地索引引擎（解析代码生成符号关系图）和一个 MCP 服务器（暴露查询工具给 AI 助手）。两者共享同一个 SQLite 数据库，存放在项目 `.codegraph/` 目录下。AI 助手（如 Claude Code）启动时连接 MCP 服务器，之后所有代码探索都通过 `codegraph_explore` 等工具完成，无需直接读文件或 grep。

#### Agent Loop
CodeGraph 本身不控制 agent 的执行循环；循环由宿主 agent（Claude Code、Cursor 等）管理。CodeGraph 作为 MCP 服务器插入循环的“工具调用”环节：当 agent 需要理解代码结构时，调用 `codegraph_explore(question)`，获得预加工的答案（含相关符号、调用链、代码片段），然后直接输出给用户或继续推理。这种模式下 agent 的探索子任务大幅减少，通常一次工具调用便完成信息获取。

#### Tool Interface
通过 MCP 协议暴露的工具核心为**codegraph_explore**：接收自然语言问题，返回结构化的代码关系响应。此外还有 `codegraph_status` 用于检查索引状态。工具响应经过裁剪，会折叠冗余的重复实现，只返回签名，让 answer 大小与问题直接相关，而非与文件数量相关。所有工具均通过标准的 MCP JSON-RPC 交互，与具体模型无关。

#### State/Memory
状态完全存储在**本地 SQLite 数据库**中。索引过程解析代码生成符号表、调用图、路由映射等，入库。数据库随项目走（`.codegraph/`），可跨 agent 复用。同步机制保证一致性：
- **文件监视器**（依靠 FSEvents/inotify/ReadDirectoryChangesW）捕获文件变更，经防抖（默认 2 秒）后触发增量索引。
- **过时提醒**：当有文件待同步时，MCP 响应会插入警告 banner，引导 agent 直接读文件。
- **连接时追赶**：每次 MCP 重连，会对工作树做快速校验（size、mtime、内容哈希），确保漏掉的编辑被补上。

#### Planner
CodeGraph 不包含规划组件，也没有内置的推理流程。它只是提供“知识检索”能力，由上层 AI 模型自行规划何时查询、如何组合多个查询。可以说，规划完全交给了 LLM。

#### Sandbox
CodeGraph 没有沙箱机制。它运行在用户的本地环境，直接访问文件系统，不限制 agent 的其他操作。

#### 安全边界
CodeGraph 的安全边界主要体现在**数据完全本地化**：不调用任何外部 API，不需要 API key，索引和查询都不离开本机。代码数据不会上传，风险仅来自 agent 本身的行为（但那是宿主 agent 的安全范畴）。此外，MCP 服务器仅监听本地接口，没有远程暴露。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 学习如何设计一个可嵌入 AI agent 的代码知识图谱，包括静态解析、增量同步、MCP 工具接口和 token 优化。 |
| 迁移到 AI-Brief | 可借鉴 MCP 工具服务器的构建模式，为 AI-Brief 提供项目级别的代码智能检索，降低 agent 探索 repo 的成本。 |
| 迁移到 BriefMem | 知识图谱的存储结构（符号关系、调用链、路由映射）和查询接口可作为 BriefMem 长期记忆模块的参考。 |
| 简历故事 | 优化 AI 编程助手的 token 和工具调用消耗：通过预索引代码知识图谱，在 7 个开源项目上将工具调用平均减少 58%、成本降低 16%，支持超过 20 种语言和 14 种框架，完全本地运行无隐私风险。 |

## 风险

- 强依赖 MCP 协议，若未来 agent 生态转向其他标准则需适配。
- 语言和框架支持尚不完善，对于非主流语言或自定义语法可能无法索引。
- 初始索引对于超大型仓库（如几万文件）可能耗时较长，但 README 未给出具体数据。
- 自动同步依赖操作系统文件监视 API，在容器或沙箱环境内可能失效，需手动触发同步。
- 基准测试仅基于 Claude Opus 4.8 单模型，其他模型或 agent 的收益可能不同。
- 工具响应的“折叠冗余实现”策略可能漏掉 agent 需要的信息，导致额外查询。

## Memory card

```text
problem_pattern:        AI 编程助手在代码库中进行探索时，通过反复的 grep、glob、Read 来定位代码，消耗大量 tokens 和工具调用，尤其在大型多语言项目中效率极低。
architecture_pattern:   预索引的代码知识图谱（静态解析→符号关系、调用图→SQLite 存储）+ MCP 工具服务器，将代码探索转化为单次知识检索。
reusable_pattern:       将代码库预处理为可查询的知识图谱，以少量工具调用和 tokens 传递结构化上下文给 LLM，减少 agent 的盲目搜索。
risk_pattern:           高度依赖宿主 agent 的集成方式（MCP），若协议变化或 agent 不支持则需要适配；索引的正确性和覆盖面对静态解析质量敏感。
similar_projects:       未在 README/artifact 说明
```

可复用范式落库:[[concepts/pre-indexed-knowledge-graph]]、[[concepts/mcp-tool-integration]]。另见 [[content/codegraph]]、[[claims/codegraph-main-claim]]。
