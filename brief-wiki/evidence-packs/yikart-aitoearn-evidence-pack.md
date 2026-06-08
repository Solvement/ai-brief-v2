---
content: "yikart-aitoearn"
kind: "evidence-pack"
title: "AiToEarn — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "AiToEarn 是一个面向内容创作者的一站式 AI 内容营销应用，把内容生成、草稿管理、账号连接、跨平台发布和部分互动运营放在同一套 Web/后端/AI Agent 系统里。"
    internal_logic: "人话：一个真实流程可以这样走：用户在前端/接口创建 Agent 任务，AI 服务把用户请求交给 Claude Agent SDK，Agent 先分析技能，再调用媒体生成、草稿、账号、发布等 MCP 工具，最后返回结构化 action 给产品界面。具体入口是 `POST /agent/tasks`，请求 schema 是 `prompt`、`model`、`includePartialMessages`、`taskId`；默认模型 schema 是 `claude-opus-4-6`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.controller.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.dto.ts）\n术语：`AgentRuntimeService` 创建任务后会 `normalizePrompt`、`enhancePrompt`，构造 `SYSTEM_PROMPT`，再通过 `query()` 调 Claude Agent SDK；它设置 `ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456'`、`ANTHROPIC_AUTH_TOKEN: 'ccr'`、`DISABLE_TELEMETRY: 'true'`，并把 MCP servers 传入 query options。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts）\n具体例子：用户说“生成 8 秒竖屏视频并发到 YouTube”。系统提示词要求先调用 `skill-analyzer`，加载 `generating-videos`，展示执行计划；`generating-videos/SKILL.md` 规定 Grok 默认 `grok-imagine-video`、`duration` 1-15 秒、默认 `aspectRatio` 9:16；`media.mcp.ts` 暴露 `generateVideoWithGrok` 和 `getGrokVideoStatus`，状态轮询由 `polling-task` 子 Agent 执行，Grok 最大等待 `5 min`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/skills/generating-videos/SKILL.md；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/mcp/media.mcp.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts）\n生成完成后，系统提示词规定必须生成 title、description、tags，并自动保存草稿：`getDraftGroupInfoByName` 查组，`createDraft` 写入 `groupId`、`title`、`desc`、`mediaList`、`type`，返回 `Draft created successfully, ID: ...`。（来源：project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.constants.ts；project/aitoearn-backend/apps/aitoearn-server/src/core/content/content.mcp.controller.ts）\n如果要发 YouTube，Agent 先调用 `publishRestrictions`；限制表写 YouTube `Title required ≤100; Desc required ≤5000; categoryId required; Video≤256GB, ≤12h.`。然后查账号组与账号，找到 YouTube accountId 后调用 `publishPostToYoutube`；`doPublish` 生成 `flowId = uuidv4()` 并返回 `Publish task created successfully. FlowId: ...`。（来源：project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts）"
    failure_mode: "project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts；project/aitoearn-backend/apps/aitoearn-server/config/config.js"
    source_pointer: "https://github.com/yikart/aitoearn"
pipeline_steps:
  - "project_type 分诊:ai_app"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/true/MIT/v2.4.0"
experiments: []
claims:
  - "[[claims/yikart-aitoearn-main-claim]]"
artifacts:
  - "[[artifacts/yikart-aitoearn-repo]]"
metrics:
  - "stars=19269"
  - "forks=2959"
  - "open_issues=26"
  - "latest_release=v2.4.0"
  - "pushed_at=2026-05-21T02:55:15Z"
baselines: []
failure_modes:
  - "project/aitoearn-backend/apps/aitoearn-server/src/core/channel/publish.mcp.controller.ts；project/aitoearn-backend/apps/aitoearn-server/config/config.js"
  - "README 配置 Relay；DOCKER_DEPLOYMENT_CN.md Relay 中继；project/aitoearn-backend/apps/aitoearn-server/config/config.js"
  - "project/aitoearn-backend/apps/aitoearn-ai/package.json；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/agent.dto.ts；project/aitoearn-backend/apps/aitoearn-ai/src/core/agent/services/agent-runtime.service.ts"
  - "DOCKER_DEPLOYMENT_CN.md AI 服务配置；project/aitoearn-backend/apps/aitoearn-ai/config/config.js"
  - "docker-compose.yml；DOCKER_DEPLOYMENT_CN.md 服务架构"
  - "本次 clone 输出；project/aitoearn-electron/src/views/publish/... 长路径文件"
missing_details: []
source_pointers:
  - "https://github.com/yikart/aitoearn"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/yikart-aitoearn-main-claim]],官方 artifact 落库为 [[artifacts/yikart-aitoearn-repo]]。See [[content/yikart-aitoearn]]。
