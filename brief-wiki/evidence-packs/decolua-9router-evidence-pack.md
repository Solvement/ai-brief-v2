---
content: "decolua-9router"
kind: "evidence-pack"
title: "9router — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "9Router 是一个本地运行的 AI 编程工具网关：把 Claude Code、Codex、Cursor、Cline 等客户端接到统一的 `/v1` 接口，再按模型名、账号、组合和错误状态转发到不同上游 provider。"
    internal_logic: "通俗说，真实请求流是：用户在 Claude Code/Codex/Cline 这类工具里配置 `Endpoint: http://localhost:20128/v1`、`API Key: [dashboard key]`、`Model: kr/claude-sonnet-4.5`。请求到 `/v1/chat/completions` 后，`next.config.mjs` rewrite 到 `/api/v1/chat/completions`；`src/app/api/v1/chat/completions/route.js` 初始化 translator 后调用 `handleChat(request)`。`handleChat` 读取 JSON、缓存 Claude header、检查 `settings.requireApiKey`，没有 model 就返回 400；如果 model 是 combo 名，会取 `getComboModels(modelStr)` 并调用 `handleComboChat`；如果是 `kr/claude-sonnet-4.5` 这种 `alias/model`，`open-sse/services/model.js` 把 `kr` 解析为 provider `kiro`。然后 `src/sse/services/auth.js` 选择账号：无认证 provider 会返回虚拟 `noauth` connection；普通 provider 会查 active `providerConnections`，过滤 `modelLock_*`，按 `fill-first` 或 `round-robin` 选连接。之后 `handleChatCore` 检测来源格式，决定目标格式；非 native passthrough 时调用 `translateRequest(sourceFormat, targetFormat, upstreamModel, ...)`；发送前执行 `compressMessages` 和可选 `injectCaveman`；再用 `getExecutor(provider)` 调上游。如果上游 401/403，会尝试 `refreshWithRetry(..., 3, log)`；如果上游失败，会 `parseUpstreamError`，调用 `markAccountUnavailable` 写入 `modelLock_${model}`，再走账号或 combo fallback。（来源：README Quick Start；next.config.mjs rewrites；src/app/api/v1/chat/completions/route.js；src/sse/handlers/chat.js；open-sse/services/model.js；src/sse/services/auth.js；open-sse/handlers/chatCore.js；open-sse/services/combo.js）\n\n术语定义：alias 是短前缀，例如 `kr` 映射 `kiro`、`cx` 映射 `codex`；source format 是客户端请求格式，例如 OpenAI/Claude/Gemini；target format 是上游 provider 需要的格式；executor 是 provider-specific 网络调用模块；model lock 是某账号某模型在限流/认证错误后被临时锁住的字段。"
    failure_mode: "open-sse/config/providers.js headers/clientId/tokenUrl；open-sse/executors/*；CHANGELOG.md v0.4.71/v0.4.66/v0.4.62"
    source_pointer: "https://github.com/decolua/9router"
pipeline_steps:
  - "project_type 分诊:devtool_cli"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/MIT/v0.4.71"
experiments: []
claims:
  - "[[claims/decolua-9router-main-claim]]"
artifacts:
  - "[[artifacts/decolua-9router-repo]]"
metrics:
  - "stars=16559"
  - "forks=2496"
  - "open_issues=638"
  - "latest_release=v0.4.71"
  - "pushed_at=2026-06-06T09:18:08Z"
baselines: []
failure_modes:
  - "open-sse/config/providers.js headers/clientId/tokenUrl；open-sse/executors/*；CHANGELOG.md v0.4.71/v0.4.66/v0.4.62"
  - "README FREE Providers；README FAQ Are FREE providers really unlimited?"
  - ".env.example；src/lib/db/schema.js providerConnections/apiKeys；docs/ARCHITECTURE.md Security-Sensitive Boundaries"
  - "src/lib/db/driver.js；cli/hooks/sqliteRuntime.js；package.json optionalDependencies"
  - "next.config.mjs experimental.proxyClientMaxBodySize；CHANGELOG.md v0.4.71 Fixes"
missing_details: []
source_pointers:
  - "https://github.com/decolua/9router"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/decolua-9router-main-claim]],官方 artifact 落库为 [[artifacts/decolua-9router-repo]]。See [[content/decolua-9router]]。
