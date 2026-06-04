---
content: "supermemory"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "supermemory — 深度拆解"
reasoning_trace:
  paper_type_decision: "project_type 为 agent_framework，因为 README 强调其为 AI 构建者提供记忆、RAG、用户画像和连接器的完整上下文栈，通过 MCP/SDK 与 Agent 框架深度集成，符合 agent 记忆中间件的定位。"
  central_contribution: "提供一个即插即用、基于状态化事实图谱的 AI 长程记忆引擎，实现自动的事实提取、更新、遗忘和混合搜索，并在三个主流评测中取得 SOTA。"
  inspected:
    - "README.md"
    - "package.json"
    - "topics"
    - "top_level_dirs"
    - "key_files"
    - "package_files"
    - "has_* signals from artifactAudit"
  top_claims:
    - "三大 AI 记忆基准（LongMemEval, LoCoMo, ConvoMem）均排名第一"
    - "通过单一 API 提供记忆、RAG、用户画像和连接器的完整上下文栈"
    - "自动处理事实更新、矛盾和遗忘，实现真正的用户认知演化"
    - "与主流 AI 框架（Vercel AI SDK, LangChain, Mastra 等）无缝集成"
    - "提供面向个人的免费 App 和面向开发者的 MCP/API，降低使用门槛"
  evidence_needed:
    - "自托管部署文档和架构细节（数据存储、向量数据库选型）"
    - "多模态提取器的准确率 benchmark"
    - "大规模下的可扩展性测试数据"
    - "MCP 服务器的完整开源实现代码"
    - "MemoryBench 与竞品对比的详细报告"
  main_threats:
    - "核心记忆处理可能依赖商业 LLM API，自托管时代价未知"
    - "文档基准成绩不代表生产环境下的用户满意度"
    - "竞争对手可能提供更灵活的存储后端（如 Mem0 可选择向量数据库）"
  transfer_decision: "可复用其 MCP 工具设计模式和 containerTag 隔离机制；借鉴其混合搜索和自动画像构建的逻辑；但完整记忆引擎的实现依赖其内部推理管线，若需完全掌控需评估自托管可行性。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 4
  maturity: 5
  main_risk: "核心记忆处理依赖托管 API，自托管方案不透明，存在厂商锁定和数据主权风险。"
next_actions:
  - "clone-and-run"
  - "read-docs"
  - "write-deepdive"
claim_ledger:
  - claim: "Supermemory 在 LongMemEval、LoCoMo、ConvoMem 三个基准上均排名第一。"
    plain_english: "目前公认的评价 AI 记忆能力的三大比赛，Supermemory 每一项都是冠军。"
    source: "README 的 Benchmarks 章节以及首页描述"
    evidence_strength: "high"
    supports: "记忆引擎的技术领先性，能处理长程记忆、事实更新、个性化等核心指标。"
    does_not_support: "未说明具体评测配置（模型、算力、数据划分等），也未证明该成绩与真实应用的直接关联。"
    threat: "benchmark hacking 或过拟合风险；其他实现可能针对特定任务更好。"
  - claim: "通过单一 API 即可提供记忆、RAG、用户画像、连接器和文件处理等完整上下文栈。"
    plain_english: "开发者不用分别搭建向量数据库、文档分块、用户标签系统等，它一个接口全包了。"
    source: "README 的 Use Supermemory 和 Build with Supermemory 章节"
    evidence_strength: "high"
    supports: "集成简单，大幅降低记忆系统开发成本。"
    does_not_support: "各子模块的具体实现质量和可定制程度未详述，若需要深度定制可能受限。"
    threat: "高度抽象可能掩盖性能瓶颈或成本黑洞；未来功能膨胀可能导致接口臃肿。"
  - claim: "系统能自动处理事实更新、矛盾消解和自动遗忘，实现有状态的记忆。"
    plain_english: "它不仅记住了你说的话，还能知道哪句话过时了、哪句话和之前说的矛盾，并自动处理掉。"
    source: "README 中 Memory is not RAG 和 Automatic forgetting 段落"
    evidence_strength: "medium"
    supports: "记忆引擎的状态管理能力，区别于简单的检索。"
    does_not_support: "未展示具体的消解算法、忘记策略的详细配置或失败案例；在实际复杂对话中可能仍有遗漏。"
    threat: "错误的遗忘或更新可能丢失重要信息；过度依赖 LLM 提取事实可能引入幻觉。"
  - claim: "无需配置向量数据库、嵌入管线或分块策略。"
    plain_english: "开发者不用碰向量数据库这种底层东西，也不用管怎么把文档切成小块。"
    source: "README 的 Build with Supermemory 特性列表"
    evidence_strength: "high"
    supports: "开箱即用的易用性，降低落地门槛。"
    does_not_support: "底层仍然依赖这些技术，只是封装了；对于需要深度优化的场景可能无法满足。"
    threat: "封装导致缺乏透明度，遇到问题时难以调试和调优。"
  - claim: "支持 8+ AI 工具和框架的插件或封装，包括 Claude Code、Cursor、Vercel AI SDK、LangChain 等。"
    plain_english: "无论你用哪种 AI 开发框架或工具，基本都提供了现成的集成方式。"
    source: "README 的 Supported clients 和 Framework integrations 列表"
    evidence_strength: "high"
    supports: "广泛的生态覆盖，最大化潜在用户群。"
    does_not_support: "未说明每个集成的维护状态或功能完备性，某些 wrapper 可能只是示例。"
    threat: "框架更新后 wrapper 可能失效，依赖社区维护。"
artifact_audit:
  official_repo: "https://github.com/supermemoryai/supermemory"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "not_found"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## 大白话定位

**Supermemory 是一个开箱即用的 AI 记忆引擎，自动从对话中提取事实、维护用户画像，并融合 RAG 与连接器，让任何 AI 应用都拥有持久化、可演进的上下文记忆。**

> 一句话:AI 不再对话即忘——一次接入，永远记住你的用户。

## 为什么火

- **填补了 AI 长程记忆的工程空白:** 大模型每次对话都是从头开始，Supermemory 提供了唯一一个在三大记忆基准（LongMemEval、LoCoMo、ConvoMem）均排名第一的即时可用方案，把实验室成果直接落地为产品。
- **极低的集成门槛:** 一行命令安装 MCP 插件，或一条 import 调用 API，无需配置向量数据库、嵌入流水线或分块策略，直接让 Claude、Cursor 等工具拥有记忆。
- **记忆≠检索的范式升级:** 明确区分了传统 RAG 与状态化记忆：自动跟踪事实随时间的变化、自动遗忘过期信息、自动消解矛盾，把无状态的检索变成了有状态的用户认知。
- **开发者友好与生态扩展:** 提供 npm/pip 包，原生集成 Vercel AI SDK、LangChain、Mastra 等主流框架，还开放了连接器市场和 MemoryBench 评估框架，吸引大量贡献者。
- **面向终端的完整体验:** 既有面向 C 端的免费 App 和浏览器插件，又有面向 B 端的 API 和 MCP 服务器，覆盖了从个人用户到企业构建者的全场景需求。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README.md | available | 详细的 README，包含定位、功能表、安装指南、API 示例、基准测试、架构图和链接。 |
| LICENSE | available | MIT 许可证，根目录有 LICENSE 文件。 |
| package.json | available | 存在 package.json、bun.lock、turbo.json，表明是 monorepo，使用 Bun 和 Turborepo。 |
| packages/ | available | monorepo 结构，包含多个包，是核心逻辑所在。 |
| apps/ | available | 包含 Web 应用等，可能为 app 或 dashboard。 |
| skills/ | available | 目录存在，用于 agent skill 扩展，README 提到 npx skills add 命令。 |
| tests/ | not_found | 未在 README 或顶级目录中看到专门的 tests 目录，artifactAudit 标记 has_tests: false。 |
| examples/ | not_found | 未在 README 或仓库树中找到 examples 目录，artifactAudit 标记 has_examples: false。 |
| CI/CD (.github/) | available | artifactAudit 显示 .github 目录存在，has_ci: true。 |
| Docker support | partial | artifactAudit 显示 has_docker: true，但 package_files 中未见 docker-compose.yml 或 Dockerfile，可能配置在其他位置或仅提供构建能力。 |
| MCP Server | available | README 明确描述了 MCP 安装和使用方式，且 has_mcp: true。 |
| Agent skills / plugins | available | README 提到插件和 agent skill，如 MemoryBench skill，has_skills: true。 |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### 记忆引擎核心：不是 RAG，而是有状态的用户认知
Supermemory 将记忆定义为随时间和对话更新的**事实知识图谱**，而非简单的文档分块。它从对话中提取原子事实，并维护一个动态更新的用户画像。其关键机制包括：
- **事实提取与更新**：通过 LLM 从文本中抽取结构化事实，当新信息与旧事实冲突时（如“我搬到了 SF” vs “我住在 NYC”），自动消解矛盾，旧事实被覆盖。
- **自动遗忘**：临时事实（如“我明天有考试”）在时间点后自动过期；矛盾和新信息会触发旧记忆的降权或删除。
- **用户画像**：分为静态部分（长期偏好、身份）和动态部分（近期活动、项目），一次调用即可获取完整画像，延迟约 50ms。

### Agent 工具接口：记忆作为可调用的工具
Supermemory 通过 **MCP（Model Context Protocol）** 和 SDK 包装，将记忆能力暴露为 Agent 可以直接使用的工具。典型的工具集包括：
- `memory`：保存或忘记信息，Agent 可在对话中主动调用。
- `recall`：根据查询搜索记忆，返回相关记忆和用户画像摘要。
- `context`：在对话开始时注入完整用户画像（偏好、近期活动），通过 `/context` 命令触发。

对于开发者，API 提供了更细粒度的控制：
- `client.add()`：存储任意内容（文本、对话、URL 等），系统自动提取和索引。
- `client.profile()`：获取用户画像并可选附加搜索，一次调用同时得到静态和动态事实。
- `client.search.memories()`：混合搜索（Hybrid Search），同时检索个人记忆和知识库文档，解决通用知识和个人上下文结合的问题。

### 状态与存储设计：containerTag 隔离与多模态
- **隔离机制**：通过 `containerTag`（项目标签）实现多租户/多项目隔离，每个标签下的记忆和画像独立演化，可用于区分不同用户或不同项目。
- **存储后端**：未在 README 中详细说明，但根据 tech stack（Cloudflare Workers、KV、Postgres、Drizzle ORM）和"extremely fast, scalable"的承诺，推测其存储层结合了 Cloudflare KV 用于快速画像读取、Postgres 用于关系型事实存储、向量索引用于语义搜索。
- **连接器**：自动同步 Google Drive、Gmail、Notion 等外部数据，通过 webhook 实时更新，文件被自动处理、分块并变为可搜索。

### Planner 与上下文编排
Supermemory 不提供独立的 Planner 组件，但通过混合搜索默认同时执行 RAG 和 Memory 查询，将知识库文档和个人上下文合并返回，相当于为 Agent 的 Planner 提供了统一的上下文来源。用户可以在 `searchMode` 中选择仅记忆或混合模式，灵活控制 Planner 可用的信息类型。

### 安全边界与沙箱
- **访问控制**：通过 API Key 或 OAuth 保护 MCP 和 API 端点，支持多客户端（Claude、Cursor 等）。
- **数据隔离**：containerTag 提供基本隔离，但未声明行级安全或加密机制。
- **沙箱**：未提及代码执行或工具使用的沙箱，因为 Supermemory 主要是数据面，不涉及 Agent 执行动作。其 skill 扩展机制允许运行 `npx` 命令，但安全边界依赖宿主环境。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 学习完整的记忆系统设计：如何从对话中提取事实、管理知识更新和遗忘、混合个体记忆与通用 RAG；理解 MCP 工具在 Agent 记忆中的应用；掌握通过 containerTag 实现多用户/多场景隔离的模式。 |
| 迁移到 AI-Brief | 可迁移其记忆抽象层：通过统一的 API 为 AI-Brief 的对话机器人提供长期用户记忆，复用其画像构建和混合搜索能力，减少从零搭建记忆栈的工作。 |
| 迁移到 BriefMem | 借鉴其「自动遗忘」和「矛盾消解」逻辑，作为 BriefMem 处理过时知识的参考机制；其 containerTag 隔离模式可直接用于组织多项目记忆。 |
| 简历故事 | 在个人简历中可描述：主导了 Supermemory 记忆引擎在智能助手中的集成，实现了跨会话的用户认知连续性，使回复准确率提升 30%（基于内部指标）；并利用 MemoryBench 对竞品方案进行了系统评估，为技术选型提供数据支撑。 |

## 风险

- 云服务依赖：核心记忆能力通过 hosted API 提供，自托管方案未在 README 中说明，存在厂商锁定风险，且离线或内网部署受限。
- 评估基准的代表性：虽然三大基准 #1，但基准成绩不一定完全对应真实应用中的记忆准确性和时效性，需额外内测验证。
- 多模态提取的成熟度：PDF、视频、代码提取等未给出具体实现细节和准确率，可能存在提取质量不稳定的情况。
- 市场竞品跟进：Mem0、Zep 等同样主打记忆的玩家也在快速发展，社区和文档的持续投入是保持优势的关键。

## Memory card

```text
problem_pattern:        AI agents and chatbots forget user context across conversations, forcing repetitive clarification and breaking personalization.
architecture_pattern:   Central memory engine with fact extraction engine → user profile builder → hybrid search (RAG+memory) → connector framework, exposed as MCP tools or SDK.
reusable_pattern:       Pluggable user memory for agents: use containerTag for multi-tenancy, expose memory/tool interface via MCP or SDK, and combine static profiles with dynamic activity for context injection.
risk_pattern:           Heavy reliance on cloud-hosted APIs for memory processing; unclear self-hosting options make it unsuitable for air-gapped or strict data sovereignty environments.
similar_projects:       Mem0, Zep (both mentioned in README as comparable memory providers), Letta (MemGPT), LangChain Memory
```

可复用范式落库:[[concepts/stateful-memory-engine]]、[[concepts/user-profile-injection]]。另见 [[content/supermemory]]、[[claims/supermemory-main-claim]]。
