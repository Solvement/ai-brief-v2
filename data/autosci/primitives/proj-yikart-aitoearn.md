<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - yikart/AiToEarn

## Core Pattern
NestJS MCP Tool Decorator: 用 `@Tool({ name, description, parameters })` 把业务 service 方法注册为 MCP tool；`McpRegistryService` 在 bootstrap 扫描 provider/controller 方法元数据。 Draft-first Agent Workflow: 生成内容后不直接结束，而是固定走 `getDraftGroupInfoByName → createDraft → action: navigateToDraft`，把 AI 产物落到产品对象里。 Action-based UI Handoff: Agent 最终用结构化 `result` 返回 `none`、`navigateToDraft`、`navigateToMedia`、`createChannel`、`updateChannel`、`navigateToPublish` 等 action。 Platform Restriction Map: 把各平台发布限制集中在 `PublishRestrictionsPrompt`，例如 Twitter `Desc required ≤280; Images≤4, ≤5MB, ≤8192px.`，TikTok `Topics≤5; Desc≤2200; Video 3-600s, ≤1GB, ≥360px; Images≤10, ≤20MB, 1080x1920.` Relay OAuth For Self-hosting: 自部署时通过 `RELAY_SERVER_URL`、`RELAY_API_KEY`、`RELAY_CALLBACK_URL` 借用官方 OAuth 凭据，避免每个平台单独申请 client_id/secret。

## Mapping
- problem_class: reliable-agent-runtime-and-tool-orchestration
- components: agent_orchestrator, tool_protocol_adapter, developer_control_surface, model_or_retrieval_layer, nestjs-mcp-tool-decorator, draft-first-agent-workflow, action-based-ui-handoff, platform-restriction-map
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted agent-infra pattern from yikart/AiToEarn on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- agent-infra-boundary-as-module: NestJS MCP Tool Decorator: 用 `@Tool({ name, description, parameters })` 把业务 service 方法注册为 MCP tool；`McpRegistryService` 在 bootstrap 扫描 provider/controller 方法元数据。 Draft-first Agent Workflow: 生成内容后不直接结束，而是固定走 `getDraftGroupInfoByName → createDraft → action: navigateToDraft`，把 AI 产物落到产品对象里。 Action-based UI Handoff: Agent 最终用结构化 `result` 返回 `none`、`navigateToDraft`、`navigateToMedia`、`createChannel`、`updateChannel`、`navigateToPublish` 等 action。 Platform Restriction Map: 把各平台发布限制集中在 `PublishRestrictionsPrompt`，例如 Twitter `Desc required ≤280; Images≤4, ≤5MB, ≤8192px.`，TikTok `Topics≤5; Desc≤2200; Video 3-600s, ≤1GB, ≥360px; Images≤10, ≤20MB, 1080x1920.` Relay OAuth For Self-hosting: 自部署时通过 `RELAY_SERVER_URL`、`RELAY_API_KEY`、`RELAY_CALLBACK_URL` 借用官方 OAuth 凭据，避免每个平台单独申请 client_id/secret。
- agent-infra-observable-flow: 人话：一个真实流程可以这样走：用户在前端/接口创建 Agent 任务，AI 服务把用户请求交给 Claude Agent SDK，Agent 先分析技能，再调用媒体生成、草稿、账号、发布等 MCP 工具，最后返回结构化 action 给产品界面。具体入口是 `POST /agent/tasks`，请求 schema 是 `prompt`、`model`、`includePartialMessages`、`taskId`；默认模型 schema 是 `claude-opus-4-6`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.controller.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.dto.ts） 术语：`AgentRuntimeService` 创建任务后会 `normalizePrompt`、`enhancePrompt`，构造 `SYSTEM_PROMPT`，再通过 `query()` 调 Claude Agent SDK；它设置 `ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456'`、`ANTHROPIC_AUTH_TOKEN: 'ccr'`、`DISABLE_TELEMETRY: 'true'`，并把 MCP servers 传入 query options。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts） 具体例子：用户说“生成 8 秒竖屏视频并发到 YouTube”。系统提示词要求先调用 `skill-analyzer`，加载 `generating-videos`，展示执行计划；`generating-videos/SKILL.md` 规定 Grok 默认 `grok-imagine-video`、`duration` 1-15 秒、默认 `aspectRatio` 9:16；`media.mcp.ts` 暴露 `generateVideoWithGrok` 和 `getGrokVideoStatus`，状态轮询由 `polling-task` 子 Agent 执行，Grok 最大等待 `5 min`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-videos/SKILL.md；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts） 生成完成后，系统提示词规定必须生成 title、description、tags，并自动保存草稿：`getDraftGroupInfoByName` 查组，`createDraft` 写入 `groupId`、`title`、`desc`、`mediaList`、`type`，返回 `Draft created successfully, ID: ...`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts） 如果要发 YouTube，Agent 先调用 `publishRestrictions`；限制表写 YouTube `Title required ≤100; Desc required ≤5000; categoryId required; Video≤256GB, ≤12h.`。然后查账号组与账号，找到 YouTube accountId 后调用 `publishPostToYoutube`；`doPublish` 生成 `flowId = uuidv4()` 并返回 `Publish task created successfully. FlowId: ...`。（来源：project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts）
- agent-infra-risk-first-transfer: Transfer the architecture together with its main failure boundary: 社交平台 OAuth/API：TikTok、YouTube、Facebook、Instagram、Threads、Pinterest、Twitter/X、Kwai、Bilibili、微信公众号等: 平台改 scopes、媒体限制、审核规则或发布 API，`publishPostTo*` 工具和 OAuth 回调可能失败。.

## Risks
- 社交平台 OAuth/API：TikTok、YouTube、Facebook、Instagram、Threads、Pinterest、Twitter/X、Kwai、Bilibili、微信公众号等: 平台改 scopes、媒体限制、审核规则或发布 API，`publishPostTo*` 工具和 OAuth 回调可能失败。
- 官方 Relay：`RELAY_SERVER_URL`、`RELAY_API_KEY`、`RELAY_CALLBACK_URL`: 官方中继不可用或策略变化，自部署用户需要自己申请多个平台 OAuth 凭据。
- `@anthropic-ai/claude-agent-sdk` 0.2.33 与 Claude 模型名: SDK API、Claude Code 运行方式、模型名或鉴权路径变化，Agent runtime 会受影响。
- OpenAI、Gemini/Vertex、Grok、Volcengine、DashScope: 密钥缺失、模型下线、计费/限流变化会导致图片、视频、理解、剪辑等 AI 功能失败。
- MongoDB、Redis、RustFS: 数据库、队列或对象存储不可用，任务、草稿、会话、媒体 URL 和发布记录都会受影响。
- Windows 长路径文件系统: 默认 Windows 配置下 checkout 可能因长路径失败。
- over_transfer
