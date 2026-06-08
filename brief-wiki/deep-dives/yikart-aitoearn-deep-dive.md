---
content: "yikart-aitoearn"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "ai_app"
title: "AiToEarn — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "yikart/AiToEarn：GitHub 描述为“Let's use AI to Earn”。"
  what_it_does: "Let's use AI to Earn!"
  metadata:
    language: "TypeScript"
    total_stars: "19269"
    stars_in_period: "9466"
    author: "yikart"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "models"
  pain_point: "人话：值得看的点不是“又一个内容生成器”，而是它把内容营销链路拆成可执行工具：生成图/视频、保存到草稿、检查账号、按平台规则发布、缺账号时让前端跳到绑定账号。这个链路在源码里有具体实现，而不只是 README 营销文案。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts） 术语：它的复用价值主要在“产品型 Agent orchestration”：用系统提示词约束 Agent 步骤，用 MCP 暴露业务工具，用 `outputTaskResult` 返回结构化 action，例如 `navigateToDraft`、`createChannel`、`navigateToPublish`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts）"
  core_capabilities:
    - "NestJS MCP Tool Decorator"
    - "Draft-first Agent Workflow"
    - "Action-based UI Handoff"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "人话：AiToEarn 更像“开源、自部署优先的 AI 内容营销操作台”，而不是纯社媒排期 SaaS 或通用自动化工具。与 Buffer 相比，Buffer 官方资料强调计划、排期、发布和渠道支持；AiToEarn 的差异是把 Claude Agent SDK、MCP 工具、草稿与生成模型放进同一套自部署代码。要快速稳定排期、团队审批和成熟 SaaS 体验，选 Buffer；要研究 AI Agent 如何驱动内容生成到发布的端到端源码，选 AiToEarn。（来源：Buffer 官方支持页 https://support.buffer.com/article/567-supported-channels/；README 源码开发；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts） 与 Hootsuite 相比，Hootsuite 官方页面强调统一 dashboard、AI 生成 captions/images、日历、协作审批、bulk scheduling、social listening；AiToEarn 的源码优势是可看见 MCP tool、发布限制表、Docker 组成和 Agent action schema。企业级审核、analytics、social listening 成熟度优先，选 Hootsuite；要自部署改造 Agent 工作流，选 AiToEarn。（来源：Hootsuite 官方 publishing 页 https://www.hootsuite.com/platform/publishing；DOCKER_DEPLOYMENT_CN.md 服务架构） 与 n8n 相比，n8n 官方 docs 定位为 workflow automation，可 npm/Docker/Cloud 使用并支持自托管，AI Agent 是节点式工作流的一部分；AiToEarn 更垂直，直接内置社交账号、草稿、发布和媒体生成工具。要连接任意 SaaS、做低代码流程编排，选 n8n；要复用内容营销领域的 Agent+MCP 业务工具样例，选 AiToEarn。（来源：n8n docs https://docs.n8n.io/；https://docs.n8n.io/advanced-ai/intro-tutorial/；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts） 术语：以上外部替代品仅按官方文档做横向定位，未审计其源码或实时能力；AiToEarn 证据来自本次 clone 的 repository tree。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话：一个真实流程可以这样走：用户在前端/接口创建 Agent 任务，AI 服务把用户请求交给 Claude Agent SDK，Agent 先分析技能，再调用媒体生成、草稿、账号、发布等 MCP 工具，最后返回结构化 action 给产品界面。具体入口是 `POST /agent/tasks`，请求 schema 是 `prompt`、`model`、`includePartialMessages`、`taskId`；默认模型 schema 是 `claude-opus-4-6`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.controller.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.dto.ts） 术语：`AgentRuntimeService` 创建任务后会 `normalizePrompt`、`enhancePrompt`，构造 `SYSTEM_PROMPT`，再通过 `query()` 调 Claude Agent SDK；它设置 `ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456'`、`ANTHROPIC_AUTH_TOKEN: 'ccr'`、`DISABLE_TELEMETRY: 'true'`，并把 MCP servers 传入 query options。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts） 具体例子：用户说“生成 8 秒竖屏视频并发到 YouTube”。系统提示词要求先调用 `skill-analyzer`，加载 `generating-videos`，展示执行计划；`generating-videos/SKILL.md` 规定 Grok 默认 `grok-imagine-video`、`duration` 1-15 秒、默认 `aspectRatio` 9:16；`media.mcp.ts` 暴露 `generateVideoWithGrok` 和 `getGrokVideoStatus`，状态轮询由 `polling-task` 子 Agent 执行，Grok 最大等待 `5 min`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-videos/SKILL.md；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts） 生成完成后，系统提示词规定必须生成 title、description、tags，并自动保存草稿：`getDraftGroupInfoByName` 查组，`createDraft` 写入 `groupId`、`title`、`desc`、`mediaList`、`type`，返回 `Draft created successfully, ID: ...`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts） 如果要发 YouTube，Agent 先调用 `publishRestrictions`；限制表写 YouTube `Title required ≤100; Desc required ≤5000; categoryId required; Video≤256GB, ≤12h.`。然后查账号组与账号，找到 YouTube accountId 后调用 `publishPostToYoutube`；`doPublish` 生成 `flowId = uuidv4()` 并返回 `Publish task created successfully. FlowId: ...`。（来源：project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts）"
  essential_design_difference: "人话：最值得拆出来学的是“业务工具 MCP 化”和“Agent 输出 action 给产品 UI”，而不是具体社交平台适配。术语：这些抽象可以迁移到 CRM、客服、增长运营、内部知识库等 AI 应用。 - NestJS MCP Tool Decorator；用 `@Tool({ name, description, parameters })` 把业务 service 方法注册为 MCP tool；`McpRegistryService` 在 bootstrap 扫描 provider/controller 方法元数据。；如果只是单体后端内部调用，不需要 MCP 客户端或 Agent 工具发现，直接 REST/RPC 更简单。；它把“账号列表、草稿创建、发布任务”包装成 Agent 可调用工具，同时仍保留 NestJS 依赖注入和鉴权上下文。（来源：project/aitoearn-backend/libs/nest-mcp/src/decorators/tool.decorator.ts；project/aitoearn-backend/libs/nest-mcp/src/services/mcp-registry.service.ts） - Draft-first Agent Workflow；生成内容后不直接结束，而是固定走 `getDraftGroupInfoByName → createDraft → action: navigateToDraft`，把 AI 产物落到产品对象里。；如果应用只做一次性回答或临时生成，不需要草稿/素材库对象。；这让 Agent 输出变成可编辑、可发布、可追踪的业务资产，而不是聊天记录里的临时 URL。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts） - Action-based UI Handoff；Agent 最终用结构化 `result` 返回 `none`、`navigateToDraft`、`navigateToMedia`、`createChannel`、`updateChannel`、`navigateToPublish` 等 action。；如果前端不需要根据 Agent 结果自动跳转或打开绑定流程，这层 schema 会显得重。；它把 Agent 决策和 UI 导航解耦：缺账号时不是报错，而是返回 `createChannel` 让产品引导用户绑定账号。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts） - Platform Restriction Map；把各平台发布限制集中在 `PublishRestrictionsPrompt`，例如 Twitter `Desc required ≤280; Images≤4, ≤5MB, ≤8192px.`，TikTok `Topics≤5; Desc≤2200; Video 3-600s, ≤1GB, ≥360px; Images≤10, ≤20MB, 1080x1920.`；如果平台规则频繁变化但没有维护机制，硬编码限制会过期。；Agent 在发布前可先查询约束，减少无效发布请求，也让平台差异显式化。（来源：project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts） - Relay OAuth For Self-hosting；自部署时通过 `RELAY_SERVER_URL`、`RELAY_API_KEY`、`RELAY_CALLBACK_URL` 借用官方 OAuth 凭据，避免每个平台单独申请 client_id/secret。；如果项目要求完全独立、不能依赖官方中继，Relay 不适合。；这是社交发布产品的实用抽象：把最难维护的平台 OAuth 凭据集中到中继服务，但也引入官方服务依赖。（来源：README 配置 Relay；DOCKER_DEPLOYMENT_CN.md Relay 中继；project/aitoearn-backend/apps/aitoearn-server/config/config.js）"
  practitioner_meaning: "人话：建议下一步 clone-and-run，而不是只读 README。它有真实工程体量、MCP 工具层、Agent 运行时和 Docker 栈；但对 AI 工程师的价值主要是学习“垂直应用如何把 Agent 接进业务系统”，不是直接拿来当通用 Agent framework。术语：优先验证 `docker compose up -d`、`/api/unified/mcp`、`POST /agent/tasks`、草稿保存、YouTube/Twitter 这类有自动发布工具的平台；同时检查 internal MCP endpoint 接线问题。（来源：README 源码开发；docker-compose.yml；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "AiToEarn 是一个面向内容创作者的一站式 AI 内容营销应用，把内容生成、草稿管理、账号连接、跨平台发布和部分互动运营放在同一套 Web/后端/AI Agent 系统里。"
    body_md: "人话：它不是一个通用 Agent 框架，而是把“生成内容、存草稿、找账号、发到平台”做成产品化流程的 AI 应用；README 自称围绕 Monetize、Publish、Engage、Create 四块能力工作。（来源：README 核心功能）\n术语：代码里有 NestJS 后端、Next.js 前端、Electron 客户端、MCP 工具层和 Claude Agent SDK 运行时；AI 服务的 Agent 入口是 `POST /agent/tasks`，DTO 字段包括 `prompt`、`model`、`includePartialMessages`、`taskId`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.controller.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.dto.ts）"
  why_worth_attention:
    summary: ""
    body_md: "人话：值得看的点不是“又一个内容生成器”，而是它把内容营销链路拆成可执行工具：生成图/视频、保存到草稿、检查账号、按平台规则发布、缺账号时让前端跳到绑定账号。这个链路在源码里有具体实现，而不只是 README 营销文案。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts）\n术语：它的复用价值主要在“产品型 Agent orchestration”：用系统提示词约束 Agent 步骤，用 MCP 暴露业务工具，用 `outputTaskResult` 返回结构化 action，例如 `navigateToDraft`、`createChannel`、`navigateToPublish`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts）"
    bullets:
      - "已核实：Docker Compose 定义了 `mongodb`、`redis`、`rustfs`、`aitoearn-ai`、`aitoearn-server`、`aitoearn-web`、`nginx` 等服务，Nginx 对外端口是 `8080`。（来源：docker-compose.yml；DOCKER_DEPLOYMENT_CN.md 服务架构）"
      - "已核实：Agent 运行时接入 `@anthropic-ai/claude-agent-sdk`，并创建 `mediaGeneration`、`util`、`aideo`、`videoEdit`、`dramaRecap`、`videoUtils`、`styleTransfer`、`imageEdit`、`account`、`content`、`publish` 等 MCP server 配置。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts）"
      - "已核实：前端平台枚举含 TikTok、Douyin、Xhs、WxSph、KWAI、YouTube、BILIBILI、Twitter、WxGzh、Facebook、Instagram、Threads、Pinterest、LinkedIn。（来源：project/aitoearn-web/src/app/config/platConfig.ts）"
  key_claims_evidence:
    summary: ""
    body_md: "人话：README 的渠道、赚钱、AI Agent、10+ 平台等表述需要按“自称”看；源码能核实的是配置、工具、服务、路由、限制表和运行脚本。术语：下面把 claim 分成 README claim 与 tree/code verified facts。"
    items:
      - claim: "“Monetize · Publish · Engage · Create —— 一站式平台。”"
        plain_english: "项目自称覆盖赚钱、发布、互动、创作四个内容营销环节。"
        source: "README 顶部标语与 README 核心功能"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 明确列出四大 Agent 能力，并解释 CPS/CPE/CPM、发布、互动、创作。"
        does_not_support: "README 文字不能证明真实交易量、结算可用性、平台审核通过率或商业闭环有效性。"
        threat: "变现链路依赖真实商家任务、平台 OAuth、结算系统；本次未运行线上业务流程。"
      - claim: "支持 Docker 一键部署。"
        plain_english: "仓库提供可启动完整应用栈的 Docker Compose 配置。"
        source: "README Docker 一键部署；docker-compose.yml；DOCKER_DEPLOYMENT_CN.md 服务架构"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`docker compose up -d` 写在 README；compose 文件定义 MongoDB、Redis、RustFS、AI、Server、Web、Nginx；部署文档写明访问 `http://localhost:8080`。"
        does_not_support: "未实际执行容器启动；AI 功能默认使用 `sk-placeholder`，文档说明真实 AI 功能需要填入密钥。"
        threat: "生产环境默认密码包括 `password`、`change-this-jwt-secret`、`change-this-secret-token`，必须修改。"
      - claim: "支持 Claude / Cursor 等 MCP 客户端使用。"
        plain_english: "项目公开说明可用 `https://aitoearn.ai/api/unified/mcp` 和 `x-api-key` 接入。"
        source: "README Claude / Cursor / 其他 AI 助手；project/aitoearn-backend/apps/aitoearn-server/src/core/unified-mcp/unified-mcp.module.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "README 给出 `claude_desktop_config.json` 示例；源码 `UnifiedMcpModule` 使用 `McpModule.forRoot({ name: 'aitoearn', version: '1.0.0', apiPrefix: 'unified' })`。"
        does_not_support: "未验证线上 `aitoearn.ai` endpoint 当前是否可用；本地鉴权、配额与账号权限未运行测试。"
        threat: "MCP 对外暴露业务工具，认证和 API key 管理是核心风险。"
      - claim: "Agent 生成内容后默认保存草稿，并按平台发布。"
        plain_english: "Agent 提示词强制先做技能分析和执行计划，生成后调用草稿工具；发布前先查账号和限制。"
        source: "project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "系统提示词写明 `getDraftGroupInfoByName → createDraft → action: navigateToDraft`；发布流程要求 `publishRestrictions`、`getAccountGroupList`、`getAccountListByGroupId`，再调用平台发布工具。"
        does_not_support: "这证明了设计和代码路径，不证明每个平台发布 API 在真实账号上稳定成功。"
        threat: "各平台限制经常变化；README/docs 未说明自动化发布成功率或回归覆盖。"
      - claim: "“小红书、抖音”等平台也在发布链路中。"
        plain_english: "前端和限制表包含 Xhs/Douyin，但 Agent 提示词明确说这两个没有自动发布工具，需要引导人工发布。"
        source: "README 支持渠道；project/aitoearn-web/src/app/config/platConfig.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "前端 `PlatType` 有 `Douyin` 和 `Xhs`；`PublishRestrictionsPrompt` 有 Xhs/Douyin 限制；系统提示词写 `No publishPostToXhs`、`No publishPostToDouyin`。"
        does_not_support: "不能把 README 的“支持渠道”理解为每个平台都支持全自动发布。"
        threat: "产品文案的支持范围与 Agent 自动化能力存在粒度差异。"
      - claim: "内置视频/图片生成模型选择策略。"
        plain_english: "技能文件规定 Grok 优先，Veo 用于 16-36 秒、首尾帧、参考图等高级场景。"
        source: "project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-videos/SKILL.md；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`generating-videos` 写明 Grok `1-15s`、Veo `16-36s`、Veo 参考图最多 `3`；`media.mcp.ts` 的 Grok schema 限制 `duration` 为 `1` 到 `15`。"
        does_not_support: "未证明模型服务实际可用；配置依赖 `GROK_API_KEY`、Gemini/Vertex 配置等。"
        threat: "模型 ID 如 `gemini-3.1-pro-preview`、`claude-opus-4-6` 属于强外部依赖，失效或改名会影响运行。"
      - claim: "代码库有测试，不是纯 demo。"
        plain_english: "仓库包含后端和 MCP 工具相关 spec 文件。"
        source: "repo tree：`rg --files -g '*.spec.ts'`；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/*.spec.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/channel/*.spec.ts"
        attribution: "已核实"
        evidence_strength: "medium"
        supports: "本次 tree 中发现 30 个 `*.spec.ts`/`*.test.ts` 文件，包括 `media.mcp.spec.ts`、`video-edit.mcp.spec.ts`、`publishing.service.spec.ts`、`twitter.service.spec.ts`。"
        does_not_support: "未运行测试，不能证明当前 main 分支全部通过。"
        threat: "仓库 Windows checkout 遇到长路径文件，需要 `core.longpaths`；CI 状态未核验。"
  how_it_works:
    summary: ""
    body_md: "人话：一个真实流程可以这样走：用户在前端/接口创建 Agent 任务，AI 服务把用户请求交给 Claude Agent SDK，Agent 先分析技能，再调用媒体生成、草稿、账号、发布等 MCP 工具，最后返回结构化 action 给产品界面。具体入口是 `POST /agent/tasks`，请求 schema 是 `prompt`、`model`、`includePartialMessages`、`taskId`；默认模型 schema 是 `claude-opus-4-6`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.controller.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.dto.ts）\n术语：`AgentRuntimeService` 创建任务后会 `normalizePrompt`、`enhancePrompt`，构造 `SYSTEM_PROMPT`，再通过 `query()` 调 Claude Agent SDK；它设置 `ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456'`、`ANTHROPIC_AUTH_TOKEN: 'ccr'`、`DISABLE_TELEMETRY: 'true'`，并把 MCP servers 传入 query options。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts）\n具体例子：用户说“生成 8 秒竖屏视频并发到 YouTube”。系统提示词要求先调用 `skill-analyzer`，加载 `generating-videos`，展示执行计划；`generating-videos/SKILL.md` 规定 Grok 默认 `grok-imagine-video`、`duration` 1-15 秒、默认 `aspectRatio` 9:16；`media.mcp.ts` 暴露 `generateVideoWithGrok` 和 `getGrokVideoStatus`，状态轮询由 `polling-task` 子 Agent 执行，Grok 最大等待 `5 min`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-videos/SKILL.md；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts）\n生成完成后，系统提示词规定必须生成 title、description、tags，并自动保存草稿：`getDraftGroupInfoByName` 查组，`createDraft` 写入 `groupId`、`title`、`desc`、`mediaList`、`type`，返回 `Draft created successfully, ID: ...`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts）\n如果要发 YouTube，Agent 先调用 `publishRestrictions`；限制表写 YouTube `Title required ≤100; Desc required ≤5000; categoryId required; Video≤256GB, ≤12h.`。然后查账号组与账号，找到 YouTube accountId 后调用 `publishPostToYoutube`；`doPublish` 生成 `flowId = uuidv4()` 并返回 `Publish task created successfully. FlowId: ...`。（来源：project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts）"
  reusable_abstractions:
    summary: ""
    body_md: "人话：最值得拆出来学的是“业务工具 MCP 化”和“Agent 输出 action 给产品 UI”，而不是具体社交平台适配。术语：这些抽象可以迁移到 CRM、客服、增长运营、内部知识库等 AI 应用。"
    items:
      - name: "NestJS MCP Tool Decorator"
        copy: "用 `@Tool({ name, description, parameters })` 把业务 service 方法注册为 MCP tool；`McpRegistryService` 在 bootstrap 扫描 provider/controller 方法元数据。"
        skip: "如果只是单体后端内部调用，不需要 MCP 客户端或 Agent 工具发现，直接 REST/RPC 更简单。"
        why_it_matters: "它把“账号列表、草稿创建、发布任务”包装成 Agent 可调用工具，同时仍保留 NestJS 依赖注入和鉴权上下文。（来源：project/aitoearn-backend/libs/nest-mcp/src/decorators/tool.decorator.ts；project/aitoearn-backend/libs/nest-mcp/src/services/mcp-registry.service.ts）"
      - name: "Draft-first Agent Workflow"
        copy: "生成内容后不直接结束，而是固定走 `getDraftGroupInfoByName → createDraft → action: navigateToDraft`，把 AI 产物落到产品对象里。"
        skip: "如果应用只做一次性回答或临时生成，不需要草稿/素材库对象。"
        why_it_matters: "这让 Agent 输出变成可编辑、可发布、可追踪的业务资产，而不是聊天记录里的临时 URL。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts）"
      - name: "Action-based UI Handoff"
        copy: "Agent 最终用结构化 `result` 返回 `none`、`navigateToDraft`、`navigateToMedia`、`createChannel`、`updateChannel`、`navigateToPublish` 等 action。"
        skip: "如果前端不需要根据 Agent 结果自动跳转或打开绑定流程，这层 schema 会显得重。"
        why_it_matters: "它把 Agent 决策和 UI 导航解耦：缺账号时不是报错，而是返回 `createChannel` 让产品引导用户绑定账号。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts）"
      - name: "Platform Restriction Map"
        copy: "把各平台发布限制集中在 `PublishRestrictionsPrompt`，例如 Twitter `Desc required ≤280; Images≤4, ≤5MB, ≤8192px.`，TikTok `Topics≤5; Desc≤2200; Video 3-600s, ≤1GB, ≥360px; Images≤10, ≤20MB, 1080x1920.`"
        skip: "如果平台规则频繁变化但没有维护机制，硬编码限制会过期。"
        why_it_matters: "Agent 在发布前可先查询约束，减少无效发布请求，也让平台差异显式化。（来源：project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts）"
      - name: "Relay OAuth For Self-hosting"
        copy: "自部署时通过 `RELAY_SERVER_URL`、`RELAY_API_KEY`、`RELAY_CALLBACK_URL` 借用官方 OAuth 凭据，避免每个平台单独申请 client_id/secret。"
        skip: "如果项目要求完全独立、不能依赖官方中继，Relay 不适合。"
        why_it_matters: "这是社交发布产品的实用抽象：把最难维护的平台 OAuth 凭据集中到中继服务，但也引入官方服务依赖。（来源：README 配置 Relay；DOCKER_DEPLOYMENT_CN.md Relay 中继；project/aitoearn-backend/apps/aitoearn-server/config/config.js）"
  dependency_platform_risk:
    summary: ""
    body_md: "人话：这个项目的核心风险集中在外部平台和模型服务，而不是单纯代码能不能编译。术语：风险主要来自 OAuth/API policy、模型 ID、MCP/Claude SDK、Relay 中继、对象存储与队列。"
    items:
      - dependency: "社交平台 OAuth/API：TikTok、YouTube、Facebook、Instagram、Threads、Pinterest、Twitter/X、Kwai、Bilibili、微信公众号等"
        what_if_change: "平台改 scopes、媒体限制、审核规则或发布 API，`publishPostTo*` 工具和 OAuth 回调可能失败。"
        exposure: "high"
        mitigation_or_unknown: "代码集中有 `PublishRestrictionsPrompt` 和各平台 provider，但 README/docs 未说明规则更新机制或平台回归测试。"
        source: "project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts；project/aitoearn-backend/apps/aitoearn-server/config/config.js"
      - dependency: "官方 Relay：`RELAY_SERVER_URL`、`RELAY_API_KEY`、`RELAY_CALLBACK_URL`"
        what_if_change: "官方中继不可用或策略变化，自部署用户需要自己申请多个平台 OAuth 凭据。"
        exposure: "high"
        mitigation_or_unknown: "文档说明可不配 Relay 但要自行申请 client_id/secret；未说明 Relay SLA。"
        source: "README 配置 Relay；DOCKER_DEPLOYMENT_CN.md Relay 中继；project/aitoearn-backend/apps/aitoearn-server/config/config.js"
      - dependency: "`@anthropic-ai/claude-agent-sdk` 0.2.33 与 Claude 模型名"
        what_if_change: "SDK API、Claude Code 运行方式、模型名或鉴权路径变化，Agent runtime 会受影响。"
        exposure: "high"
        mitigation_or_unknown: "package 锁定 `@anthropic-ai/claude-agent-sdk: 0.2.33`；DTO 允许的模型含 `claude-opus-4-6` 等，README/docs 未说明 fallback。"
        source: "project/aitoearn-backend/apps/aitoearn-ai/package.json；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.dto.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts"
      - dependency: "OpenAI、Gemini/Vertex、Grok、Volcengine、DashScope"
        what_if_change: "密钥缺失、模型下线、计费/限流变化会导致图片、视频、理解、剪辑等 AI 功能失败。"
        exposure: "high"
        mitigation_or_unknown: "部署文档说明默认 `sk-placeholder` 只能启动，AI 功能需要真实密钥；`config.js` 中模型配置可改，但未验证线上可用性。"
        source: "DOCKER_DEPLOYMENT_CN.md AI 服务配置；project/aitoearn-backend/apps/aitoearn-ai/config/config.js"
      - dependency: "MongoDB、Redis、RustFS"
        what_if_change: "数据库、队列或对象存储不可用，任务、草稿、会话、媒体 URL 和发布记录都会受影响。"
        exposure: "medium"
        mitigation_or_unknown: "Docker Compose 提供健康检查和本地 RustFS；生产备份、迁移和多副本策略未在 README/docs/tree 说明。"
        source: "docker-compose.yml；DOCKER_DEPLOYMENT_CN.md 服务架构"
      - dependency: "Windows 长路径文件系统"
        what_if_change: "默认 Windows 配置下 checkout 可能因长路径失败。"
        exposure: "low"
        mitigation_or_unknown: "本次 clone 在 Windows 下遇到 `Filename too long`，设置 `core.longpaths true` 后继续读取；README 未说明 Windows clone 注意事项。"
        source: "本次 clone 输出；project/aitoearn-electron/src/views/publish/... 长路径文件"
  unknowns_to_confirm:
    summary: ""
    body_md: "人话：README 讲了产品愿景，源码能看到不少工程实现，但商业闭环、线上可用性和平台稳定性还需要实测。术语：以下都是未在 README/docs/tree 中充分证明的事实。"
    items:
      - "未运行 `docker compose up -d`，因此未确认本地 `http://localhost:8080` 实际启动成功。"
      - "未确认线上 `https://aitoearn.ai/api/unified/mcp` 在 2026-06-08 是否可用、延迟如何、需要哪些权限。"
      - "未在 README/docs/tree 看到 CPS/CPE/CPM 真实结算、提现、对账、风控、商家任务审核的完整技术说明。"
      - "Agent runtime 中配置了 internal HTTP MCP servers `/account/mcp`、`/content/mcp`、`/publish/mcp`，但 `AppModule` 只显式导入 `UnifiedMcpModule`；单独的 `AccountMcpModule`、`ContentMcpModule`、`PublishMcpModule` 在 tree 中存在但本次 `rg` 未发现被导入，需运行验证这些内部 endpoint 是否实际存在。"
      - "`crawling-social-media/SKILL.md` 提到 `createCrawlTask` 和 `getCrawlTaskStatus`，本次在 backend tree 未找到同名工具实现，需确认是否遗漏、未接线或已改名。"
      - "未确认 v2.4.0 release 包与 main 分支代码完全一致；本次 clone HEAD 为 `74e884f0e250b902097c355bf8fb55a9ed2c79a5`，提交信息为 `docs: update readme for v2.4.0`。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 4
      工程深度: 4
      复用价值: 3
      成熟度: 3
    body_md: "人话：建议下一步 clone-and-run，而不是只读 README。它有真实工程体量、MCP 工具层、Agent 运行时和 Docker 栈；但对 AI 工程师的价值主要是学习“垂直应用如何把 Agent 接进业务系统”，不是直接拿来当通用 Agent framework。术语：优先验证 `docker compose up -d`、`/api/unified/mcp`、`POST /agent/tasks`、草稿保存、YouTube/Twitter 这类有自动发布工具的平台；同时检查 internal MCP endpoint 接线问题。（来源：README 源码开发；docker-compose.yml；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\yikart-aitoearn\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\yikart-aitoearn\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\yikart-aitoearn\\codex-last-message.json"
  invoked_at: "2026-06-08T14:24:18.115Z"
  completed_at: "2026-06-08T14:32:43.017Z"
  repo: "yikart/AiToEarn"
reasoning_trace:
  paper_type_decision: "project_type = ai_app; evidence from README/artifactAudit only."
  central_contribution: "Let's use AI to Earn!"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "“Monetize · Publish · Engage · Create —— 一站式平台。”"
    - "支持 Docker 一键部署。"
    - "支持 Claude / Cursor 等 MCP 客户端使用。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts；project/aitoearn-backend/apps/aitoearn-server/config/config.js"
    - "README 配置 Relay；DOCKER_DEPLOYMENT_CN.md Relay 中继；project/aitoearn-backend/apps/aitoearn-server/config/config.js"
    - "project/aitoearn-backend/apps/aitoearn-ai/package.json；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.dto.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts"
    - "DOCKER_DEPLOYMENT_CN.md AI 服务配置；project/aitoearn-backend/apps/aitoearn-ai/config/config.js"
    - "docker-compose.yml；DOCKER_DEPLOYMENT_CN.md 服务架构"
    - "本次 clone 输出；project/aitoearn-electron/src/views/publish/... 长路径文件"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 4
  engineering_depth: 4
  reuse_value: 3
  maturity: 3
  main_risk: "人话：建议下一步 clone-and-run，而不是只读 README。它有真实工程体量、MCP 工具层、Agent 运行时和 Docker 栈；但对 AI 工程师的价值主要是学习“垂直应用如何把 Agent 接进业务系统”，不是直接拿来当通用 Agent framework。术语：优先验证 `docker compose up -d`、`/api/unified/mcp`、`POST /agent/tasks`、草稿保存、YouTube/Twitter 这类有自动发布工具的平台；同时检查 internal MCP endpoint 接线问题。（来源：README 源码开发；docker-compose.yml；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts）"
next_actions:
  - "clone-and-run"
unknowns:
  - "未运行 `docker compose up -d`，因此未确认本地 `http://localhost:8080` 实际启动成功。"
  - "未确认线上 `https://aitoearn.ai/api/unified/mcp` 在 2026-06-08 是否可用、延迟如何、需要哪些权限。"
  - "未在 README/docs/tree 看到 CPS/CPE/CPM 真实结算、提现、对账、风控、商家任务审核的完整技术说明。"
  - "Agent runtime 中配置了 internal HTTP MCP servers `/account/mcp`、`/content/mcp`、`/publish/mcp`，但 `AppModule` 只显式导入 `UnifiedMcpModule`；单独的 `AccountMcpModule`、`ContentMcpModule`、`PublishMcpModule` 在 tree 中存在但本次 `rg` 未发现被导入，需运行验证这些内部 endpoint 是否实际存在。"
  - "`crawling-social-media/SKILL.md` 提到 `createCrawlTask` 和 `getCrawlTaskStatus`，本次在 backend tree 未找到同名工具实现，需确认是否遗漏、未接线或已改名。"
  - "未确认 v2.4.0 release 包与 main 分支代码完全一致；本次 clone HEAD 为 `74e884f0e250b902097c355bf8fb55a9ed2c79a5`，提交信息为 `docs: update readme for v2.4.0`。"
builder_reuse:
  pattern: "NestJS MCP Tool Decorator"
  copy: "用 `@Tool({ name, description, parameters })` 把业务 service 方法注册为 MCP tool；`McpRegistryService` 在 bootstrap 扫描 provider/controller 方法元数据。"
  skip: "如果只是单体后端内部调用，不需要 MCP 客户端或 Agent 工具发现，直接 REST/RPC 更简单。"
  why_it_matters: "它把“账号列表、草稿创建、发布任务”包装成 Agent 可调用工具，同时仍保留 NestJS 依赖注入和鉴权上下文。（来源：project/aitoearn-backend/libs/nest-mcp/src/decorators/tool.decorator.ts；project/aitoearn-backend/libs/nest-mcp/src/services/mcp-registry.service.ts）"
dependency_platform_risk:
  dependency: "社交平台 OAuth/API：TikTok、YouTube、Facebook、Instagram、Threads、Pinterest、Twitter/X、Kwai、Bilibili、微信公众号等"
  what_if_change: "平台改 scopes、媒体限制、审核规则或发布 API，`publishPostTo*` 工具和 OAuth 回调可能失败。"
  exposure: "high"
  mitigation_or_unknown: "代码集中有 `PublishRestrictionsPrompt` 和各平台 provider，但 README/docs 未说明规则更新机制或平台回归测试。"
claim_ledger:
  - claim: "“Monetize · Publish · Engage · Create —— 一站式平台。”"
    plain_english: "项目自称覆盖赚钱、发布、互动、创作四个内容营销环节。"
    source: "README 顶部标语与 README 核心功能"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 明确列出四大 Agent 能力，并解释 CPS/CPE/CPM、发布、互动、创作。"
    does_not_support: "README 文字不能证明真实交易量、结算可用性、平台审核通过率或商业闭环有效性。"
    threat: "变现链路依赖真实商家任务、平台 OAuth、结算系统；本次未运行线上业务流程。"
  - claim: "支持 Docker 一键部署。"
    plain_english: "仓库提供可启动完整应用栈的 Docker Compose 配置。"
    source: "README Docker 一键部署；docker-compose.yml；DOCKER_DEPLOYMENT_CN.md 服务架构"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`docker compose up -d` 写在 README；compose 文件定义 MongoDB、Redis、RustFS、AI、Server、Web、Nginx；部署文档写明访问 `http://localhost:8080`。"
    does_not_support: "未实际执行容器启动；AI 功能默认使用 `sk-placeholder`，文档说明真实 AI 功能需要填入密钥。"
    threat: "生产环境默认密码包括 `password`、`change-this-jwt-secret`、`change-this-secret-token`，必须修改。"
  - claim: "支持 Claude / Cursor 等 MCP 客户端使用。"
    plain_english: "项目公开说明可用 `https://aitoearn.ai/api/unified/mcp` 和 `x-api-key` 接入。"
    source: "README Claude / Cursor / 其他 AI 助手；project/aitoearn-backend/apps/aitoearn-server/src/core/unified-mcp/unified-mcp.module.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "README 给出 `claude_desktop_config.json` 示例；源码 `UnifiedMcpModule` 使用 `McpModule.forRoot({ name: 'aitoearn', version: '1.0.0', apiPrefix: 'unified' })`。"
    does_not_support: "未验证线上 `aitoearn.ai` endpoint 当前是否可用；本地鉴权、配额与账号权限未运行测试。"
    threat: "MCP 对外暴露业务工具，认证和 API key 管理是核心风险。"
  - claim: "Agent 生成内容后默认保存草稿，并按平台发布。"
    plain_english: "Agent 提示词强制先做技能分析和执行计划，生成后调用草稿工具；发布前先查账号和限制。"
    source: "project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "系统提示词写明 `getDraftGroupInfoByName → createDraft → action: navigateToDraft`；发布流程要求 `publishRestrictions`、`getAccountGroupList`、`getAccountListByGroupId`，再调用平台发布工具。"
    does_not_support: "这证明了设计和代码路径，不证明每个平台发布 API 在真实账号上稳定成功。"
    threat: "各平台限制经常变化；README/docs 未说明自动化发布成功率或回归覆盖。"
  - claim: "“小红书、抖音”等平台也在发布链路中。"
    plain_english: "前端和限制表包含 Xhs/Douyin，但 Agent 提示词明确说这两个没有自动发布工具，需要引导人工发布。"
    source: "README 支持渠道；project/aitoearn-web/src/app/config/platConfig.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "前端 `PlatType` 有 `Douyin` 和 `Xhs`；`PublishRestrictionsPrompt` 有 Xhs/Douyin 限制；系统提示词写 `No publishPostToXhs`、`No publishPostToDouyin`。"
    does_not_support: "不能把 README 的“支持渠道”理解为每个平台都支持全自动发布。"
    threat: "产品文案的支持范围与 Agent 自动化能力存在粒度差异。"
  - claim: "内置视频/图片生成模型选择策略。"
    plain_english: "技能文件规定 Grok 优先，Veo 用于 16-36 秒、首尾帧、参考图等高级场景。"
    source: "project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-videos/SKILL.md；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`generating-videos` 写明 Grok `1-15s`、Veo `16-36s`、Veo 参考图最多 `3`；`media.mcp.ts` 的 Grok schema 限制 `duration` 为 `1` 到 `15`。"
    does_not_support: "未证明模型服务实际可用；配置依赖 `GROK_API_KEY`、Gemini/Vertex 配置等。"
    threat: "模型 ID 如 `gemini-3.1-pro-preview`、`claude-opus-4-6` 属于强外部依赖，失效或改名会影响运行。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 69: 人话：最值得拆出来学的是“业务工具 MCP 化”和“Agent 输出 action 给产品 UI”，而不是具体社交平台适配。术语：这些抽象可以迁移到 CRM、客服、增长运营、内部知识库等 AI 应用。 - NestJS MCP Tool Decorator；用 `@Tool..."
artifact_audit:
  official_repo: "https://github.com/yikart/AiToEarn"
  official_data: "not_found"
  evaluation_code: "not_found"
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
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

yikart/AiToEarn：GitHub 描述为“Let's use AI to Earn”。

（来源：README/artifactAudit）

## 干什么

Let's use AI to Earn!

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | TypeScript |
| total_stars | 19269 |
| stars_in_period | 9466 |
| author | yikart |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- models（来源：数据不足）

## 解决什么痛点

人话：值得看的点不是“又一个内容生成器”，而是它把内容营销链路拆成可执行工具：生成图/视频、保存到草稿、检查账号、按平台规则发布、缺账号时让前端跳到绑定账号。这个链路在源码里有具体实现，而不只是 README 营销文案。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts） 术语：它的复用价值主要在“产品型 Agent orchestration”：用系统提示词约束 Agent 步骤，用 MCP 暴露业务工具，用 `outputTaskResult` 返回结构化 action，例如 `navigateToDraft`、`createChannel`、`navigateToPublish`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts）

## 核心能力

- NestJS MCP Tool Decorator（来源：数据不足）
- Draft-first Agent Workflow（来源：数据不足）
- Action-based UI Handoff（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

人话：AiToEarn 更像“开源、自部署优先的 AI 内容营销操作台”，而不是纯社媒排期 SaaS 或通用自动化工具。与 Buffer 相比，Buffer 官方资料强调计划、排期、发布和渠道支持；AiToEarn 的差异是把 Claude Agent SDK、MCP 工具、草稿与生成模型放进同一套自部署代码。要快速稳定排期、团队审批和成熟 SaaS 体验，选 Buffer；要研究 AI Agent 如何驱动内容生成到发布的端到端源码，选 AiToEarn。（来源：Buffer 官方支持页 https://support.buffer.com/article/567-supported-channels/；README 源码开发；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts） 与 Hootsuite 相比，Hootsuite 官方页面强调统一 dashboard、AI 生成 captions/images、日历、协作审批、bulk scheduling、social listening；AiToEarn 的源码优势是可看见 MCP tool、发布限制表、Docker 组成和 Agent action schema。企业级审核、analytics、social listening 成熟度优先，选 Hootsuite；要自部署改造 Agent 工作流，选 AiToEarn。（来源：Hootsuite 官方 publishing 页 https://www.hootsuite.com/platform/publishing；DOCKER_DEPLOYMENT_CN.md 服务架构） 与 n8n 相比，n8n 官方 docs 定位为 workflow automation，可 npm/Docker/Cloud 使用并支持自托管，AI Agent 是节点式工作流的一部分；AiToEarn 更垂直，直接内置社交账号、草稿、发布和媒体生成工具。要连接任意 SaaS、做低代码流程编排，选 n8n；要复用内容营销领域的 Agent+MCP 业务工具样例，选 AiToEarn。（来源：n8n docs https://docs.n8n.io/；https://docs.n8n.io/advanced-ai/intro-tutorial/；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts） 术语：以上外部替代品仅按官方文档做横向定位，未审计其源码或实时能力；AiToEarn 证据来自本次 clone 的 repository tree。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话：一个真实流程可以这样走：用户在前端/接口创建 Agent 任务，AI 服务把用户请求交给 Claude Agent SDK，Agent 先分析技能，再调用媒体生成、草稿、账号、发布等 MCP 工具，最后返回结构化 action 给产品界面。具体入口是 `POST /agent/tasks`，请求 schema 是 `prompt`、`model`、`includePartialMessages`、`taskId`；默认模型 schema 是 `claude-opus-4-6`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.controller.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.dto.ts） 术语：`AgentRuntimeService` 创建任务后会 `normalizePrompt`、`enhancePrompt`，构造 `SYSTEM_PROMPT`，再通过 `query()` 调 Claude Agent SDK；它设置 `ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456'`、`ANTHROPIC_AUTH_TOKEN: 'ccr'`、`DISABLE_TELEMETRY: 'true'`，并把 MCP servers 传入 query options。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts） 具体例子：用户说“生成 8 秒竖屏视频并发到 YouTube”。系统提示词要求先调用 `skill-analyzer`，加载 `generating-videos`，展示执行计划；`generating-videos/SKILL.md` 规定 Grok 默认 `grok-imagine-video`、`duration` 1-15 秒、默认 `aspectRatio` 9:16；`media.mcp.ts` 暴露 `generateVideoWithGrok` 和 `getGrokVideoStatus`，状态轮询由 `polling-task` 子 Agent 执行，Grok 最大等待 `5 min`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-videos/SKILL.md；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts） 生成完成后，系统提示词规定必须生成 title、description、tags，并自动保存草稿：`getDraftGroupInfoByName` 查组，`createDraft` 写入 `groupId`、`title`、`desc`、`mediaList`、`type`，返回 `Draft created successfully, ID: ...`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts） 如果要发 YouTube，Agent 先调用 `publishRestrictions`；限制表写 YouTube `Title required ≤100; Desc required ≤5000; categoryId required; Video≤256GB, ≤12h.`。然后查账号组与账号，找到 YouTube accountId 后调用 `publishPostToYoutube`；`doPublish` 生成 `flowId = uuidv4()` 并返回 `Publish task created successfully. FlowId: ...`。（来源：project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts）

## 本质不同的设计取舍

人话：最值得拆出来学的是“业务工具 MCP 化”和“Agent 输出 action 给产品 UI”，而不是具体社交平台适配。术语：这些抽象可以迁移到 CRM、客服、增长运营、内部知识库等 AI 应用。 - NestJS MCP Tool Decorator；用 `@Tool({ name, description, parameters })` 把业务 service 方法注册为 MCP tool；`McpRegistryService` 在 bootstrap 扫描 provider/controller 方法元数据。；如果只是单体后端内部调用，不需要 MCP 客户端或 Agent 工具发现，直接 REST/RPC 更简单。；它把“账号列表、草稿创建、发布任务”包装成 Agent 可调用工具，同时仍保留 NestJS 依赖注入和鉴权上下文。（来源：project/aitoearn-backend/libs/nest-mcp/src/decorators/tool.decorator.ts；project/aitoearn-backend/libs/nest-mcp/src/services/mcp-registry.service.ts） - Draft-first Agent Workflow；生成内容后不直接结束，而是固定走 `getDraftGroupInfoByName → createDraft → action: navigateToDraft`，把 AI 产物落到产品对象里。；如果应用只做一次性回答或临时生成，不需要草稿/素材库对象。；这让 Agent 输出变成可编辑、可发布、可追踪的业务资产，而不是聊天记录里的临时 URL。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts） - Action-based UI Handoff；Agent 最终用结构化 `result` 返回 `none`、`navigateToDraft`、`navigateToMedia`、`createChannel`、`updateChannel`、`navigateToPublish` 等 action。；如果前端不需要根据 Agent 结果自动跳转或打开绑定流程，这层 schema 会显得重。；它把 Agent 决策和 UI 导航解耦：缺账号时不是报错，而是返回 `createChannel` 让产品引导用户绑定账号。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts） - Platform Restriction Map；把各平台发布限制集中在 `PublishRestrictionsPrompt`，例如 Twitter `Desc required ≤280; Images≤4, ≤5MB, ≤8192px.`，TikTok `Topics≤5; Desc≤2200; Video 3-600s, ≤1GB, ≥360px; Images≤10, ≤20MB, 1080x1920.`；如果平台规则频繁变化但没有维护机制，硬编码限制会过期。；Agent 在发布前可先查询约束，减少无效发布请求，也让平台差异显式化。（来源：project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts） - Relay OAuth For Self-hosting；自部署时通过 `RELAY_SERVER_URL`、`RELAY_API_KEY`、`RELAY_CALLBACK_URL` 借用官方 OAuth 凭据，避免每个平台单独申请 client_id/secret。；如果项目要求完全独立、不能依赖官方中继，Relay 不适合。；这是社交发布产品的实用抽象：把最难维护的平台 OAuth 凭据集中到中继服务，但也引入官方服务依赖。（来源：README 配置 Relay；DOCKER_DEPLOYMENT_CN.md Relay 中继；project/aitoearn-backend/apps/aitoearn-server/config/config.js）

## 对从业者意味着什么

人话：建议下一步 clone-and-run，而不是只读 README。它有真实工程体量、MCP 工具层、Agent 运行时和 Docker 栈；但对 AI 工程师的价值主要是学习“垂直应用如何把 Agent 接进业务系统”，不是直接拿来当通用 Agent framework。术语：优先验证 `docker compose up -d`、`/api/unified/mcp`、`POST /agent/tasks`、草稿保存、YouTube/Twitter 这类有自动发布工具的平台；同时检查 internal MCP endpoint 接线问题。（来源：README 源码开发；docker-compose.yml；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/mcp-tool-controller]]、[[concepts/draft-first-agent-workflow]]。另见 [[content/yikart-aitoearn]]、[[claims/yikart-aitoearn-main-claim]]。
