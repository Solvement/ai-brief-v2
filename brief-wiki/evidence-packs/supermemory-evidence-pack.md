---
content: "supermemory"
kind: "evidence-pack"
title: "supermemory — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Supermemory 是一个开箱即用的 AI 记忆引擎，自动从对话中提取事实、维护用户画像，并融合 RAG 与连接器，让任何 AI 应用都拥有持久化、可演进的上下文记忆。"
    internal_logic: "### 记忆引擎核心：不是 RAG，而是有状态的用户认知\nSupermemory 将记忆定义为随时间和对话更新的**事实知识图谱**，而非简单的文档分块。它从对话中提取原子事实，并维护一个动态更新的用户画像。其关键机制包括：\n- **事实提取与更新**：通过 LLM 从文本中抽取结构化事实，当新信息与旧事实冲突时（如“我搬到了 SF” vs “我住在 NYC”），自动消解矛盾，旧事实被覆盖。\n- **自动遗忘**：临时事实（如“我明天有考试”）在时间点后自动过期；矛盾和新信息会触发旧记忆的降权或删除。\n- **用户画像**：分为静态部分（长期偏好、身份）和动态部分（近期活动、项目），一次调用即可获取完整画像，延迟约 50ms。\n\n### Agent 工具接口：记忆作为可调用的工具\nSupermemory 通过 **MCP（Model Context Protocol）** 和 SDK 包装，将记忆能力暴露为 Agent 可以直接使用的工具。典型的工具集包括：\n- `memory`：保存或忘记信息，Agent 可在对话中主动调用。\n- `recall`：根据查询搜索记忆，返回相关记忆和用户画像摘要。\n- `context`：在对话开始时注入完整用户画像（偏好、近期活动），通过 `/context` 命令触发。\n\n对于开发者，API 提供了更细粒度的控制：\n- `client.add()`：存储任意内容（文本、对话、URL 等），系统自动提取和索引。\n- `client.profile()`：获取用户画像并可选附加搜索，一次调用同时得到静态和动态事实。\n- `client.search.memories()`：混合搜索（Hybrid Search），同时检索个人记忆和知识库文档，解决通用知识和个人上下文结合的问题。\n\n### 状态与存储设计：containerTag 隔离与多模态\n- **隔离机制**：通过 `containerTag`（项目标签）实现多租户/多项目隔离，每个标签下的记忆和画像独立演化，可用于区分不同用户或不同项目。\n- **存储后端**：未在 README 中详细说明，但根据 tech stack（Cloudflare Workers、KV、Postgres、Drizzle ORM）和\"extremely fast, scalable\"的承诺，推测其存储层结合了 Cloudflare KV 用于快速画像读取、Postgres 用于关系型事实存储、向量索引用于语义搜索。\n- **连接器**：自动同步 Google Drive、Gmail、Notion 等外部数据，通过 webhook 实时更新，文件被自动处理、分块并变为可搜索。\n\n### Planner 与上下文编排\nSupermemory 不提供独立的 Planner 组件，但通过混合搜索默认同时执行 RAG 和 Memory 查询，将知识库文档和个人上下文合并返回，相当于为 Agent 的 Planner 提供了统一的上下文来源。用户可以在 `searchMode` 中选择仅记忆或混合模式，灵活控制 Planner 可用的信息类型。\n\n### 安全边界与沙箱\n- **访问控制**：通过 API Key 或 OAuth 保护 MCP 和 API 端点，支持多客户端（Claude、Cursor 等）。\n- **数据隔离**：containerTag 提供基本隔离，但未声明行级安全或加密机制。\n- **沙箱**：未提及代码执行或工具使用的沙箱，因为 Supermemory 主要是数据面，不涉及 Agent 执行动作。其 skill 扩展机制允许运行 `npx` 命令，但安全边界依赖宿主环境。"
    failure_mode: "云服务依赖：核心记忆能力通过 hosted API 提供，自托管方案未在 README 中说明，存在厂商锁定风险，且离线或内网部署受限。"
    source_pointer: "https://github.com/supermemoryai/supermemory"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/false/MIT/not_found"
experiments: []
claims:
  - "[[claims/supermemory-main-claim]]"
artifacts:
  - "[[artifacts/supermemory-repo]]"
metrics:
  - "stars=24973"
  - "forks=2197"
  - "open_issues=26"
  - "latest_release=not_found"
  - "pushed_at=2026-06-03T12:04:42Z"
baselines: []
failure_modes:
  - "云服务依赖：核心记忆能力通过 hosted API 提供，自托管方案未在 README 中说明，存在厂商锁定风险，且离线或内网部署受限。"
  - "评估基准的代表性：虽然三大基准 #1，但基准成绩不一定完全对应真实应用中的记忆准确性和时效性，需额外内测验证。"
  - "多模态提取的成熟度：PDF、视频、代码提取等未给出具体实现细节和准确率，可能存在提取质量不稳定的情况。"
  - "市场竞品跟进：Mem0、Zep 等同样主打记忆的玩家也在快速发展，社区和文档的持续投入是保持优势的关键。"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
source_pointers:
  - "https://github.com/supermemoryai/supermemory"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/supermemory-main-claim]],官方 artifact 落库为 [[artifacts/supermemory-repo]]。See [[content/supermemory]]。
