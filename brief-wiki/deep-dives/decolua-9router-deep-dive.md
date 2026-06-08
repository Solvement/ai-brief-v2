---
content: "decolua-9router"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "devtool_cli"
title: "9router — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "decolua/9router：GitHub 描述为“Unlimited FREE AI coding. Connect Claude Code, Codex, Cursor, Cline, Copilot, Antigravity to FREE Claude/GPT/Gemini via 40+ providers. Auto-fallback, RTK -40% tokens, never hit limits”。"
  what_it_does: "Unlimited FREE AI coding. Connect Claude Code, Codex, Cursor, Cline, Copilot, Antigravity to FREE Claude/GPT/Gemini via 40+ providers. Auto-fallback, RTK -40% tokens, never hit limits."
  metadata:
    language: "JavaScript"
    total_stars: "16559"
    stars_in_period: "12723"
    author: "decolua"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "skills"
    - "models"
  pain_point: "通俗说，这个项目值得看不是因为 README 说“免费无限”，而是因为源码里确实实现了一个面向 AI 编程工具的本地网关：有 `/v1` 重写、格式翻译、账号选择、combo fallback、RTK 工具输出压缩、SQLite 状态库、CLI 包和 Docker 入口。术语定义：网关是请求入口；fallback 是失败后切换备选；RTK 是对工具输出做压缩的预处理；SQLite 状态库保存 provider 连接、combo、API key、usage 等本地状态。"
  core_capabilities:
    - "Model string as routing contract"
    - "Combo fallback service"
    - "Per-model account lock"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "通俗说，9Router 更像“给 AI 编程工具用的本地多账号/多上游网关”，不是通用企业 LLM gateway 的完整替代。和 LiteLLM 相比，LiteLLM 官方文档自称提供 proxy、router retry/fallback、生产网关配置；它更适合服务端团队统一接入多模型，但 9Router 对 Claude Code/Codex/Cursor/OpenClaw 等本地编程工具有更多专门入口、OAuth/provider executor 和 dashboard 配置文件写入逻辑（来源：9Router src/app/api/cli-tools/*；LiteLLM docs https://docs.litellm.ai/ ，外部能力未在本仓库核验）。和 OpenRouter 相比，OpenRouter 是托管 API/模型路由服务，适合不想自管 provider key/账号逻辑的人；9Router 是本地 MIT 代码，provider token 和请求经过你自己的进程，但你要承担上游账号、OAuth、更新和安全配置（来源：README Deployment；OpenRouter docs https://openrouter.ai/docs/api/reference/overview/ ，外部能力为官方自称）。和 musistudio/claude-code-router 相比，Claude Code Router 更聚焦 Claude Code 路由；9Router 覆盖 `/v1/chat/completions`、`/v1/messages`、`/v1/responses`、images、audio、embeddings、web skills，并内置更宽的 dashboard/provider registry（来源：src/app/api/v1/*；skills/README.md；Claude Code Router README https://github.com/musistudio/claude-code-router ，外部能力未在本仓库核验）。术语定义：integration path 指客户端怎么接入；self-hosting 指是否自己运行网关；workflow fit 指对本地 AI 编程工具还是服务端应用更顺手。选择 9Router：当你要把本机 AI 编程 CLI 指到一个本地 `/v1`，并用多个账号/订阅/低价 provider 做 fallback。选择 LiteLLM：当你要面向后端服务部署通用 LLM proxy、集中治理和团队级配置。选择 OpenRouter：当你接受托管中间层并优先要少运维、多模型市场。选择 Claude Code Router：当需求主要围绕 Claude Code 且不需要 9Router 的 dashboard、多模态和大 provider registry。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "通俗说，真实请求流是：用户在 Claude Code/Codex/Cline 这类工具里配置 `Endpoint: http://localhost:20128/v1`、`API Key: [dashboard key]`、`Model: kr/claude-sonnet-4.5`。请求到 `/v1/chat/completions` 后，`next.config.mjs` rewrite 到 `/api/v1/chat/completions`；`src/app/api/v1/chat/completions/route.js` 初始化 translator 后调用 `handleChat(request)`。`handleChat` 读取 JSON、缓存 Claude header、检查 `settings.requireApiKey`，没有 model 就返回 400；如果 model 是 combo 名，会取 `getComboModels(modelStr)` 并调用 `handleComboChat`；如果是 `kr/claude-sonnet-4.5` 这种 `alias/model`，`open-sse/services/model.js` 把 `kr` 解析为 provider `kiro`。然后 `src/sse/services/auth.js` 选择账号：无认证 provider 会返回虚拟 `noauth` connection；普通 provider 会查 active `providerConnections`，过滤 `modelLock_*`，按 `fill-first` 或 `round-robin` 选连接。之后 `handleChatCore` 检测来源格式，决定目标格式；非 native passthrough 时调用 `translateRequest(sourceFormat, targetFormat, upstreamModel, ...)`；发送前执行 `compressMessages` 和可选 `injectCaveman`；再用 `getExecutor(provider)` 调上游。如果上游 401/403，会尝试 `refreshWithRetry(..., 3, log)`；如果上游失败，会 `parseUpstreamError`，调用 `markAccountUnavailable` 写入 `modelLock_${model}`，再走账号或 combo fallback。（来源：README Quick Start；next.config.mjs rewrites；src/app/api/v1/chat/completions/route.js；src/sse/handlers/chat.js；open-sse/services/model.js；src/sse/services/auth.js；open-sse/handlers/chatCore.js；open-sse/services/combo.js） 术语定义：alias 是短前缀，例如 `kr` 映射 `kiro`、`cx` 映射 `codex`；source format 是客户端请求格式，例如 OpenAI/Claude/Gemini；target format 是上游 provider 需要的格式；executor 是 provider-specific 网络调用模块；model lock 是某账号某模型在限流/认证错误后被临时锁住的字段。"
  essential_design_difference: "通俗说，最值得复用的不是“免费 provider 列表”，而是本地 AI 网关的几层边界：统一入口、模型名解析、combo fallback、账号锁、格式翻译、工具输出压缩、SQLite 状态仓库。术语定义：抽象是可以迁到别的 AI 应用里的设计单元；copy 是值得借鉴；skip 是不要照搬的部分。 - Model string as routing contract；用 `alias/model` 作为路由键，例如 `kr/claude-sonnet-4.5`、`cx/gpt-5.5`，并把 alias 映射集中在 `open-sse/services/model.js` 与 `PROVIDER_ID_TO_ALIAS`。；不要把上游仍会变动的模型名当成长期稳定 API。；客户端不需要知道账号、OAuth、format、endpoint；一个字符串就能表达路由目标。（来源：open-sse/services/model.js；open-sse/config/providerModels.js） - Combo fallback service；`handleComboChat({ body, models, handleSingleModel, comboStrategy, comboStickyLimit })` 这种把 fallback 编排与单模型执行分离的接口。；不要只依赖文本规则判断失败原因；生产系统还需要 provider-specific 错误契约和指标回放。；它让“模型组合”成为用户可配置对象，而不是硬编码 if/else。（来源：open-sse/services/combo.js；src/lib/db/schema.js combos table） - Per-model account lock；失败后写 `modelLock_${model}`，成功后只清当前模型 lock；避免一个模型限流导致整个账号不可用。；不要忽略隐私和密钥保护；provider token 存在本地 DB 的 data JSON 里。；对 Claude/Codex/GitHub 这类有分模型或分额度行为的上游，模型粒度锁比账号级熔断更细。（来源：src/sse/services/auth.js markAccountUnavailable/clearAccountError；src/lib/db/repos/connectionsRepo.js） - RTK pre-dispatch compression；在格式翻译之后、executor 之前处理 tool output，并支持 OpenAI、Claude、Responses、Kiro 多种 body 形状。；不要把 README 的节省比例当成 SLA；应记录每次 `bytesBefore/bytesAfter/hits`。；压缩点选得靠后，可以覆盖 passthrough 与 translated flows；日志格式 `[RTK] saved ... via [...]` 可用于实际观测。（来源：open-sse/handlers/chatCore.js；open-sse/rtk/index.js formatRtkLog） - Driver chain for local persistence；Node 下优先 `better-sqlite3`，再尝试 `node:sqlite`，最后 `sql.js`；Bun 下先 `bun:sqlite`。；不要让架构文档和代码漂移；本仓库 `docs/ARCHITECTURE.md` 仍有 `db.json` 陈旧表述。；本地工具要在 Windows/macOS/Linux 和 Docker 中启动，SQLite driver fallback 能降低安装失败率。（来源：src/lib/db/driver.js；src/lib/db/paths.js；package.json optionalDependencies）"
  practitioner_meaning: "通俗判断：对 AI 编程工具重度用户和做本地 LLM gateway 的工程师，值得 clone-and-run；对生产后端统一网关，不应直接按 README 的“免费无限”叙事采用。工程上有真实深度：Next rewrite、OpenAI/Claude/Gemini/Responses 翻译、provider executor、combo/account fallback、RTK、SQLite driver chain、Docker/CLI、测试树和快速 changelog。主要扣分在上游接口脆弱、文档局部陈旧、免费额度不可由仓库证明。术语定义：clone-and-run 表示下一步应该在隔离机器上启动、接一个低风险 provider、跑真实 `/v1/chat/completions` 和 RTK 日志，而不是只收藏 README。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "9Router 是一个本地运行的 AI 编程工具网关：把 Claude Code、Codex、Cursor、Cline 等客户端接到统一的 `/v1` 接口，再按模型名、账号、组合和错误状态转发到不同上游 provider。"
    body_md: "通俗说，它像一个本地“AI API 总插线板”：你的工具只认 `http://localhost:20128/v1`，9Router 在后面决定走 `kr/claude-sonnet-4.5`、`cx/gpt-5.5`、`glm/glm-5.1` 还是 combo。术语定义：OpenAI-compatible endpoint 指客户端按 OpenAI `/v1/chat/completions` 形状发请求；provider executor 指 `open-sse/executors/*` 里面真正调用上游服务的适配器；combo 指数据库里的一个模型序列，失败后按顺序或 round-robin 尝试下一个模型。（来源：README Quick Start；src/app/api/v1/chat/completions/route.js POST；src/sse/handlers/chat.js handleChat；open-sse/services/combo.js）"
  why_worth_attention:
    summary: ""
    body_md: "通俗说，这个项目值得看不是因为 README 说“免费无限”，而是因为源码里确实实现了一个面向 AI 编程工具的本地网关：有 `/v1` 重写、格式翻译、账号选择、combo fallback、RTK 工具输出压缩、SQLite 状态库、CLI 包和 Docker 入口。术语定义：网关是请求入口；fallback 是失败后切换备选；RTK 是对工具输出做压缩的预处理；SQLite 状态库保存 provider 连接、combo、API key、usage 等本地状态。"
    bullets:
      - "已核实：`next.config.mjs` 把 `/v1/:path*` rewrite 到 `/api/v1/:path*`，并有 `/codex/:path*` 到 `/api/v1/responses` 的兼容入口。（来源：next.config.mjs rewrites）"
      - "已核实：主聊天入口是 `src/app/api/v1/chat/completions/route.js`，实际调用 `handleChat(request)`；`handleChat` 再解析 model、combo、API key、账号和设置。（来源：src/app/api/v1/chat/completions/route.js；src/sse/handlers/chat.js）"
      - "已核实：配置中 `PROVIDERS` 当前有 89 个 provider id，`PROVIDER_MODELS` 当前有 102 个 key、710 个列出的模型条目；这是从 `open-sse/config/providers.js` 与 `open-sse/config/providerModels.js` 直接导入统计，不等同于真实可用性证明。（来源：open-sse/config/providers.js PROVIDERS；open-sse/config/providerModels.js PROVIDER_MODELS）"
      - "已核实：测试树包含 translator、RTK、combo、DB、OAuth、image、embeddings、TTS、provider validation 等单元测试文件；但本次未执行测试。（来源：tests/ tree；tests/package.json scripts）"
  key_claims_evidence:
    summary: ""
    body_md: "通俗说，README 的“省 20-40% token”“40+ providers”“免费无限”等必须分开看：数字和免费额度大多是自称；源码能验证的是路由、压缩、fallback、模型清单和运行入口。术语定义：自称是 README/营销文字；已核实是文件、配置、源码路径能直接支持；证据强度 high 表示代码路径清楚，medium 表示配置/文档支持但未运行真实请求。"
    items:
      - claim: "提供本地 OpenAI-compatible `/v1` API 给 AI 编程工具使用。"
        plain_english: "客户端可以把 base URL 指到 `http://localhost:20128/v1`；Next.js rewrite 会把 `/v1/chat/completions` 转到 `/api/v1/chat/completions`，route 再调用 `handleChat`。"
        source: "README Quick Start；next.config.mjs rewrites；src/app/api/v1/chat/completions/route.js POST"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`source: \"/v1/:path*\" destination: \"/api/v1/:path*\"`；README 示例给出 Endpoint `http://localhost:20128/v1` 与 Model `kr/claude-sonnet-4.5`。"
        does_not_support: "不证明所有第三方 CLI 在当前版本都无 bug 可用。"
        threat: "不同客户端的非标准请求、SSE 细节或 tool-call 行为仍可能破坏兼容性。"
      - claim: "支持 combo fallback 与账号级 fallback。"
        plain_english: "如果 model 字符串不是 `provider/model`，`handleChat` 会查 combo；`handleComboChat` 遍历模型序列，失败则根据 `checkFallbackError` 决定是否尝试下一个。单 provider 内部也会用 `getProviderCredentials` 过滤被锁定的连接并选择可用账号。"
        source: "src/sse/handlers/chat.js combo branch；open-sse/services/combo.js handleComboChat；src/sse/services/auth.js getProviderCredentials/markAccountUnavailable；open-sse/config/errorConfig.js ERROR_RULES"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "combo strategy 支持 `fallback` 和 `round-robin`；账号策略支持默认 `fill-first` 与 provider override `round-robin`；错误规则覆盖文本如 `rate limit`、`quota exceeded` 和状态码 401/402/403/404/429。"
        does_not_support: "不证明“zero downtime”；真实上游限流、账号封禁和网络故障可能同时发生。"
        threat: "fallback 依赖错误文本和状态码启发式；上游错误格式变化会降低命中率。"
      - claim: "RTK Token Saver 会压缩工具输出。"
        plain_english: "`handleChatCore` 在 dispatch 前调用 `compressMessages(translatedBody, rtkEnabled)`；它会处理 OpenAI tool message、Claude `tool_result`、OpenAI Responses `function_call_output` 和 Kiro `conversationState`。"
        source: "open-sse/handlers/chatCore.js token savers block；open-sse/rtk/index.js compressMessages；open-sse/rtk/autodetect.js；open-sse/rtk/constants.js；tests/unit/rtk.test.js"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "过滤器包括 `git-diff`、`git-status`、`build-output`、`grep`、`find`、`tree`、`ls`、`search-list`、`read-numbered`、`dedup-log`、`smart-truncate`；`MIN_COMPRESS_SIZE=500`，`RAW_CAP=10 * 1024 * 1024`，`DETECT_WINDOW=1024`。"
        does_not_support: "README 的“20-40% input tokens”是自称；源码和测试证明机制，不证明对所有请求的平均节省比例。"
        threat: "压缩是有损摘要式过滤；虽然代码避免返回空内容或变大内容，但仍可能删掉用户希望模型看到的上下文。"
      - claim: "README 称连接 40+ AI Providers 与 100+ Models。"
        plain_english: "README 是自称；源码配置当前列出更多：89 个 provider config id、102 个 `PROVIDER_MODELS` key、710 个模型条目。"
        source: "README header；open-sse/config/providers.js PROVIDERS；open-sse/config/providerModels.js PROVIDER_MODELS"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "代码配置里确有大量 provider/model 条目，如 `claude`、`codex`、`github`、`kiro`、`openrouter`、`glm`、`minimax`、`vertex`、`opencode`、`grok-web` 等。"
        does_not_support: "不证明这些 provider 在 2026-06-08 都真实可用，也不证明所有模型名仍被上游接受。"
        threat: "模型和免费层高度动态；README 与配置中已出现历史免费层变动说明，真实可用性需要在线账户验证。"
      - claim: "项目提供 npm CLI、源码运行和 Docker 运行入口。"
        plain_english: "根包是 private `9router-app`，有 `npm run dev/build/start`；`cli/package.json` 暴露 bin `9router`；Dockerfile 构建 Next standalone 并暴露 20128。"
        source: "package.json scripts；cli/package.json bin；Dockerfile runner；DOCKER.md Quick start"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`dev: next dev --webpack --port 20128`；Docker `ENV PORT=20128 HOSTNAME=0.0.0.0 DATA_DIR=/app/data`；DOCKER.md 给出 `docker run -d -p 20128:20128 -v \"$HOME/.9router:/app/data\" ... decolua/9router:latest`。"
        does_not_support: "本次未执行 `npm install`、`npm run dev` 或 Docker 启动。"
        threat: "CLI 打包涉及 runtime SQLite 依赖自修复；Windows/macOS/Linux 的 native dependency 行为需要本机验证。"
      - claim: "本地持久化已迁到 SQLite，并有多个 driver fallback。"
        plain_english: "当前 `localDb.js` 是 shim，实际重导出 `src/lib/db/index.js`；DB 路径是 `${DATA_DIR}/db/data.sqlite`，driver 顺序是 Bun `bun:sqlite`、Node `better-sqlite3`、Node `node:sqlite`、`sql.js`。"
        source: "src/lib/localDb.js；src/lib/db/paths.js；src/lib/db/driver.js；src/lib/db/schema.js"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`DATA_FILE = path.join(DB_DIR, \"data.sqlite\")`；schema 包含 `settings`、`providerConnections`、`providerNodes`、`proxyPools`、`apiKeys`、`combos`、`usageHistory`、`requestDetails` 等表。"
        does_not_support: "`docs/ARCHITECTURE.md` 仍写 primary state DB 是 `${DATA_DIR}/db.json`，与当前代码冲突；应以代码为准。"
        threat: "文档陈旧会误导部署和备份；迁移路径需在真实用户数据上验证。"
  how_it_works:
    summary: ""
    body_md: "通俗说，真实请求流是：用户在 Claude Code/Codex/Cline 这类工具里配置 `Endpoint: http://localhost:20128/v1`、`API Key: [dashboard key]`、`Model: kr/claude-sonnet-4.5`。请求到 `/v1/chat/completions` 后，`next.config.mjs` rewrite 到 `/api/v1/chat/completions`；`src/app/api/v1/chat/completions/route.js` 初始化 translator 后调用 `handleChat(request)`。`handleChat` 读取 JSON、缓存 Claude header、检查 `settings.requireApiKey`，没有 model 就返回 400；如果 model 是 combo 名，会取 `getComboModels(modelStr)` 并调用 `handleComboChat`；如果是 `kr/claude-sonnet-4.5` 这种 `alias/model`，`open-sse/services/model.js` 把 `kr` 解析为 provider `kiro`。然后 `src/sse/services/auth.js` 选择账号：无认证 provider 会返回虚拟 `noauth` connection；普通 provider 会查 active `providerConnections`，过滤 `modelLock_*`，按 `fill-first` 或 `round-robin` 选连接。之后 `handleChatCore` 检测来源格式，决定目标格式；非 native passthrough 时调用 `translateRequest(sourceFormat, targetFormat, upstreamModel, ...)`；发送前执行 `compressMessages` 和可选 `injectCaveman`；再用 `getExecutor(provider)` 调上游。如果上游 401/403，会尝试 `refreshWithRetry(..., 3, log)`；如果上游失败，会 `parseUpstreamError`，调用 `markAccountUnavailable` 写入 `modelLock_${model}`，再走账号或 combo fallback。（来源：README Quick Start；next.config.mjs rewrites；src/app/api/v1/chat/completions/route.js；src/sse/handlers/chat.js；open-sse/services/model.js；src/sse/services/auth.js；open-sse/handlers/chatCore.js；open-sse/services/combo.js）\n\n术语定义：alias 是短前缀，例如 `kr` 映射 `kiro`、`cx` 映射 `codex`；source format 是客户端请求格式，例如 OpenAI/Claude/Gemini；target format 是上游 provider 需要的格式；executor 是 provider-specific 网络调用模块；model lock 是某账号某模型在限流/认证错误后被临时锁住的字段。"
  reusable_abstractions:
    summary: ""
    body_md: "通俗说，最值得复用的不是“免费 provider 列表”，而是本地 AI 网关的几层边界：统一入口、模型名解析、combo fallback、账号锁、格式翻译、工具输出压缩、SQLite 状态仓库。术语定义：抽象是可以迁到别的 AI 应用里的设计单元；copy 是值得借鉴；skip 是不要照搬的部分。"
    items:
      - name: "Model string as routing contract"
        copy: "用 `alias/model` 作为路由键，例如 `kr/claude-sonnet-4.5`、`cx/gpt-5.5`，并把 alias 映射集中在 `open-sse/services/model.js` 与 `PROVIDER_ID_TO_ALIAS`。"
        skip: "不要把上游仍会变动的模型名当成长期稳定 API。"
        why_it_matters: "客户端不需要知道账号、OAuth、format、endpoint；一个字符串就能表达路由目标。（来源：open-sse/services/model.js；open-sse/config/providerModels.js）"
      - name: "Combo fallback service"
        copy: "`handleComboChat({ body, models, handleSingleModel, comboStrategy, comboStickyLimit })` 这种把 fallback 编排与单模型执行分离的接口。"
        skip: "不要只依赖文本规则判断失败原因；生产系统还需要 provider-specific 错误契约和指标回放。"
        why_it_matters: "它让“模型组合”成为用户可配置对象，而不是硬编码 if/else。（来源：open-sse/services/combo.js；src/lib/db/schema.js combos table）"
      - name: "Per-model account lock"
        copy: "失败后写 `modelLock_${model}`，成功后只清当前模型 lock；避免一个模型限流导致整个账号不可用。"
        skip: "不要忽略隐私和密钥保护；provider token 存在本地 DB 的 data JSON 里。"
        why_it_matters: "对 Claude/Codex/GitHub 这类有分模型或分额度行为的上游，模型粒度锁比账号级熔断更细。（来源：src/sse/services/auth.js markAccountUnavailable/clearAccountError；src/lib/db/repos/connectionsRepo.js）"
      - name: "RTK pre-dispatch compression"
        copy: "在格式翻译之后、executor 之前处理 tool output，并支持 OpenAI、Claude、Responses、Kiro 多种 body 形状。"
        skip: "不要把 README 的节省比例当成 SLA；应记录每次 `bytesBefore/bytesAfter/hits`。"
        why_it_matters: "压缩点选得靠后，可以覆盖 passthrough 与 translated flows；日志格式 `[RTK] saved ... via [...]` 可用于实际观测。（来源：open-sse/handlers/chatCore.js；open-sse/rtk/index.js formatRtkLog）"
      - name: "Driver chain for local persistence"
        copy: "Node 下优先 `better-sqlite3`，再尝试 `node:sqlite`，最后 `sql.js`；Bun 下先 `bun:sqlite`。"
        skip: "不要让架构文档和代码漂移；本仓库 `docs/ARCHITECTURE.md` 仍有 `db.json` 陈旧表述。"
        why_it_matters: "本地工具要在 Windows/macOS/Linux 和 Docker 中启动，SQLite driver fallback 能降低安装失败率。（来源：src/lib/db/driver.js；src/lib/db/paths.js；package.json optionalDependencies）"
  dependency_platform_risk:
    summary: ""
    body_md: "通俗说，9Router 的核心风险不在 Next.js，而在“许多上游不是稳定公共网关契约”：OAuth、CLI 指纹、私有 endpoint、免费层和模型名都会变。术语定义：exposure 是变更影响面；mitigation 是仓库已有缓解或仍未知。"
    items:
      - dependency: "上游 provider 私有/半私有接口与客户端指纹"
        what_if_change: "Claude/Codex/GitHub/Cursor/Kiro/Antigravity 等接口、OAuth client、header 或模型名变化时，executor 或 translator 可能失效。"
        exposure: "high"
        mitigation_or_unknown: "仓库有 provider-specific executors、token refresh、changelog 高频修复；但没有证明上游稳定承诺。"
        source: "open-sse/config/providers.js headers/clientId/tokenUrl；open-sse/executors/*；CHANGELOG.md v0.4.71/v0.4.66/v0.4.62"
      - dependency: "免费/无限 provider 可用性"
        what_if_change: "README 推荐的 free tier 变化会直接影响用户成本和可用性。"
        exposure: "high"
        mitigation_or_unknown: "README 已写 iFlow、Qwen、Gemini CLI free tiers 在 2026 年变动/不推荐；源码无法证明 Kiro/OpenCode/Vertex 的真实免费额度。"
        source: "README FREE Providers；README FAQ Are FREE providers really unlimited?"
      - dependency: "本地密钥与请求日志"
        what_if_change: "provider access token、API key、请求体或 header 若落盘，机器被共享或日志误传会泄露。"
        exposure: "medium"
        mitigation_or_unknown: "`ENABLE_REQUEST_LOGS=false` 默认在 `.env.example`；`REQUIRE_API_KEY=false` 默认；dashboard auth 默认需要登录但 `INITIAL_PASSWORD` 需要用户改。文件系统加密/密钥加密未在 README/docs/tree 说明。"
        source: ".env.example；src/lib/db/schema.js providerConnections/apiKeys；docs/ARCHITECTURE.md Security-Sensitive Boundaries"
      - dependency: "SQLite driver/native dependency"
        what_if_change: "Windows 或精简环境缺少 native build tools 时，`better-sqlite3` 可能安装失败。"
        exposure: "medium"
        mitigation_or_unknown: "driver 链会尝试 `better-sqlite3`、`node:sqlite`、`sql.js`；CLI hooks 会把 better-sqlite3 安到用户 runtime 目录，并称失败会 fallback。"
        source: "src/lib/db/driver.js；cli/hooks/sqliteRuntime.js；package.json optionalDependencies"
      - dependency: "Next.js standalone 和大请求体转发"
        what_if_change: "长上下文或 base64 图片请求超过默认 body limit 时，代理可能失败。"
        exposure: "medium"
        mitigation_or_unknown: "`next.config.mjs` 设置 `experimental.proxyClientMaxBodySize`，默认 `128mb`，可用 `NINEROUTER_PROXY_CLIENT_MAX_BODY_SIZE` 调整。"
        source: "next.config.mjs experimental.proxyClientMaxBodySize；CHANGELOG.md v0.4.71 Fixes"
  unknowns_to_confirm:
    summary: ""
    body_md: "通俗说，源码能证明“怎么路由”，不能证明“所有上游今天都免费、无限、稳定、合规”。术语定义：unknown 是 README/docs/tree 没有足够证据或本次未运行验证的点。"
    items:
      - "未运行 `npm install`、`npm run dev`、`npm run build`、Docker 或测试套件；运行可用性未知。"
      - "未用真实 Claude/Codex/Kiro/OpenCode/GitHub/Cursor 等账号发请求；provider 实际可用性、额度和封号风险未知。"
      - "README 的“Save 20-40% tokens”“Caveman up to 65% output tokens”“Unlimited FREE”均未由本次仓库文件证明为平均效果或稳定承诺。"
      - "docs/ARCHITECTURE.md 的持久化说明仍写 `db.json`，当前代码是 SQLite `data.sqlite`；其他文档是否同步未知。"
      - "Cloud sync 后端 `https://9router.com` 的实现和数据处理边界不在本仓库说明范围内；docs 明确 cloud service implementation out of scope。"
      - "provider 配置里的 89 个 provider id 与 710 个模型条目是代码清单，不等于真实上游在线验证结果。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 5
      工程深度: 4
      复用价值: 4
      成熟度: 3
    body_md: "通俗判断：对 AI 编程工具重度用户和做本地 LLM gateway 的工程师，值得 clone-and-run；对生产后端统一网关，不应直接按 README 的“免费无限”叙事采用。工程上有真实深度：Next rewrite、OpenAI/Claude/Gemini/Responses 翻译、provider executor、combo/account fallback、RTK、SQLite driver chain、Docker/CLI、测试树和快速 changelog。主要扣分在上游接口脆弱、文档局部陈旧、免费额度不可由仓库证明。术语定义：clone-and-run 表示下一步应该在隔离机器上启动、接一个低风险 provider、跑真实 `/v1/chat/completions` 和 RTK 日志，而不是只收藏 README。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-2026-06-08T1732\\\\decolua-9router\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-2026-06-08T1732\\decolua-9router\\prompt.md"
  raw_response: "logs\\codex-deepdive-2026-06-08T1732\\decolua-9router\\codex-last-message.json"
  invoked_at: "2026-06-08T17:38:42.061Z"
  completed_at: "2026-06-08T17:42:53.978Z"
  repo: "decolua/9router"
reasoning_trace:
  paper_type_decision: "project_type = devtool_cli; evidence from README/artifactAudit only."
  central_contribution: "Unlimited FREE AI coding. Connect Claude Code, Codex, Cursor, Cline, Copilot, Antigravity to FREE Claude/GPT/Gemini via 40+ providers. Auto-fallback, RTK -40% tokens, never hit limits."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "提供本地 OpenAI-compatible `/v1` API 给 AI 编程工具使用。"
    - "支持 combo fallback 与账号级 fallback。"
    - "RTK Token Saver 会压缩工具输出。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "open-sse/config/providers.js headers/clientId/tokenUrl；open-sse/executors/*；CHANGELOG.md v0.4.71/v0.4.66/v0.4.62"
    - "README FREE Providers；README FAQ Are FREE providers really unlimited?"
    - ".env.example；src/lib/db/schema.js providerConnections/apiKeys；docs/ARCHITECTURE.md Security-Sensitive Boundaries"
    - "src/lib/db/driver.js；cli/hooks/sqliteRuntime.js；package.json optionalDependencies"
    - "next.config.mjs experimental.proxyClientMaxBodySize；CHANGELOG.md v0.4.71 Fixes"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 4
  maturity: 3
  main_risk: "通俗判断：对 AI 编程工具重度用户和做本地 LLM gateway 的工程师，值得 clone-and-run；对生产后端统一网关，不应直接按 README 的“免费无限”叙事采用。工程上有真实深度：Next rewrite、OpenAI/Claude/Gemini/Responses 翻译、provider executor、combo/account fallback、RTK、SQLite driver chain、Docker/CLI、测试树和快速 changelog。主要扣分在上游接口脆弱、文档局部陈旧、免费额度不可由仓库证明。术语定义：clone-and-run 表示下一步应该在隔离机器上启动、接一个低风险 provider、跑真实 `/v1/chat/completions` 和 RTK 日志，而不是只收藏 README。"
next_actions:
  - "clone-and-run"
unknowns:
  - "未运行 `npm install`、`npm run dev`、`npm run build`、Docker 或测试套件；运行可用性未知。"
  - "未用真实 Claude/Codex/Kiro/OpenCode/GitHub/Cursor 等账号发请求；provider 实际可用性、额度和封号风险未知。"
  - "README 的“Save 20-40% tokens”“Caveman up to 65% output tokens”“Unlimited FREE”均未由本次仓库文件证明为平均效果或稳定承诺。"
  - "docs/ARCHITECTURE.md 的持久化说明仍写 `db.json`，当前代码是 SQLite `data.sqlite`；其他文档是否同步未知。"
  - "Cloud sync 后端 `https://9router.com` 的实现和数据处理边界不在本仓库说明范围内；docs 明确 cloud service implementation out of scope。"
  - "provider 配置里的 89 个 provider id 与 710 个模型条目是代码清单，不等于真实上游在线验证结果。"
builder_reuse:
  pattern: "Model string as routing contract"
  copy: "用 `alias/model` 作为路由键，例如 `kr/claude-sonnet-4.5`、`cx/gpt-5.5`，并把 alias 映射集中在 `open-sse/services/model.js` 与 `PROVIDER_ID_TO_ALIAS`。"
  skip: "不要把上游仍会变动的模型名当成长期稳定 API。"
  why_it_matters: "客户端不需要知道账号、OAuth、format、endpoint；一个字符串就能表达路由目标。（来源：open-sse/services/model.js；open-sse/config/providerModels.js）"
dependency_platform_risk:
  dependency: "上游 provider 私有/半私有接口与客户端指纹"
  what_if_change: "Claude/Codex/GitHub/Cursor/Kiro/Antigravity 等接口、OAuth client、header 或模型名变化时，executor 或 translator 可能失效。"
  exposure: "high"
  mitigation_or_unknown: "仓库有 provider-specific executors、token refresh、changelog 高频修复；但没有证明上游稳定承诺。"
claim_ledger:
  - claim: "提供本地 OpenAI-compatible `/v1` API 给 AI 编程工具使用。"
    plain_english: "客户端可以把 base URL 指到 `http://localhost:20128/v1`；Next.js rewrite 会把 `/v1/chat/completions` 转到 `/api/v1/chat/completions`，route 再调用 `handleChat`。"
    source: "README Quick Start；next.config.mjs rewrites；src/app/api/v1/chat/completions/route.js POST"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`source: \"/v1/:path*\" destination: \"/api/v1/:path*\"`；README 示例给出 Endpoint `http://localhost:20128/v1` 与 Model `kr/claude-sonnet-4.5`。"
    does_not_support: "不证明所有第三方 CLI 在当前版本都无 bug 可用。"
    threat: "不同客户端的非标准请求、SSE 细节或 tool-call 行为仍可能破坏兼容性。"
  - claim: "支持 combo fallback 与账号级 fallback。"
    plain_english: "如果 model 字符串不是 `provider/model`，`handleChat` 会查 combo；`handleComboChat` 遍历模型序列，失败则根据 `checkFallbackError` 决定是否尝试下一个。单 provider 内部也会用 `getProviderCredentials` 过滤被锁定的连接并选择可用账号。"
    source: "src/sse/handlers/chat.js combo branch；open-sse/services/combo.js handleComboChat；src/sse/services/auth.js getProviderCredentials/markAccountUnavailable；open-sse/config/errorConfig.js ERROR_RULES"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "combo strategy 支持 `fallback` 和 `round-robin`；账号策略支持默认 `fill-first` 与 provider override `round-robin`；错误规则覆盖文本如 `rate limit`、`quota exceeded` 和状态码 401/402/403/404/429。"
    does_not_support: "不证明“zero downtime”；真实上游限流、账号封禁和网络故障可能同时发生。"
    threat: "fallback 依赖错误文本和状态码启发式；上游错误格式变化会降低命中率。"
  - claim: "RTK Token Saver 会压缩工具输出。"
    plain_english: "`handleChatCore` 在 dispatch 前调用 `compressMessages(translatedBody, rtkEnabled)`；它会处理 OpenAI tool message、Claude `tool_result`、OpenAI Responses `function_call_output` 和 Kiro `conversationState`。"
    source: "open-sse/handlers/chatCore.js token savers block；open-sse/rtk/index.js compressMessages；open-sse/rtk/autodetect.js；open-sse/rtk/constants.js；tests/unit/rtk.test.js"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "过滤器包括 `git-diff`、`git-status`、`build-output`、`grep`、`find`、`tree`、`ls`、`search-list`、`read-numbered`、`dedup-log`、`smart-truncate`；`MIN_COMPRESS_SIZE=500`，`RAW_CAP=10 * 1024 * 1024`，`DETECT_WINDOW=1024`。"
    does_not_support: "README 的“20-40% input tokens”是自称；源码和测试证明机制，不证明对所有请求的平均节省比例。"
    threat: "压缩是有损摘要式过滤；虽然代码避免返回空内容或变大内容，但仍可能删掉用户希望模型看到的上下文。"
  - claim: "README 称连接 40+ AI Providers 与 100+ Models。"
    plain_english: "README 是自称；源码配置当前列出更多：89 个 provider config id、102 个 `PROVIDER_MODELS` key、710 个模型条目。"
    source: "README header；open-sse/config/providers.js PROVIDERS；open-sse/config/providerModels.js PROVIDER_MODELS"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "代码配置里确有大量 provider/model 条目，如 `claude`、`codex`、`github`、`kiro`、`openrouter`、`glm`、`minimax`、`vertex`、`opencode`、`grok-web` 等。"
    does_not_support: "不证明这些 provider 在 2026-06-08 都真实可用，也不证明所有模型名仍被上游接受。"
    threat: "模型和免费层高度动态；README 与配置中已出现历史免费层变动说明，真实可用性需要在线账户验证。"
  - claim: "项目提供 npm CLI、源码运行和 Docker 运行入口。"
    plain_english: "根包是 private `9router-app`，有 `npm run dev/build/start`；`cli/package.json` 暴露 bin `9router`；Dockerfile 构建 Next standalone 并暴露 20128。"
    source: "package.json scripts；cli/package.json bin；Dockerfile runner；DOCKER.md Quick start"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`dev: next dev --webpack --port 20128`；Docker `ENV PORT=20128 HOSTNAME=0.0.0.0 DATA_DIR=/app/data`；DOCKER.md 给出 `docker run -d -p 20128:20128 -v \"$HOME/.9router:/app/data\" ... decolua/9router:latest`。"
    does_not_support: "本次未执行 `npm install`、`npm run dev` 或 Docker 启动。"
    threat: "CLI 打包涉及 runtime SQLite 依赖自修复；Windows/macOS/Linux 的 native dependency 行为需要本机验证。"
  - claim: "本地持久化已迁到 SQLite，并有多个 driver fallback。"
    plain_english: "当前 `localDb.js` 是 shim，实际重导出 `src/lib/db/index.js`；DB 路径是 `${DATA_DIR}/db/data.sqlite`，driver 顺序是 Bun `bun:sqlite`、Node `better-sqlite3`、Node `node:sqlite`、`sql.js`。"
    source: "src/lib/localDb.js；src/lib/db/paths.js；src/lib/db/driver.js；src/lib/db/schema.js"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`DATA_FILE = path.join(DB_DIR, \"data.sqlite\")`；schema 包含 `settings`、`providerConnections`、`providerNodes`、`proxyPools`、`apiKeys`、`combos`、`usageHistory`、`requestDetails` 等表。"
    does_not_support: "`docs/ARCHITECTURE.md` 仍写 primary state DB 是 `${DATA_DIR}/db.json`，与当前代码冲突；应以代码为准。"
    threat: "文档陈旧会误导部署和备份；迁移路径需在真实用户数据上验证。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 67: 通俗说，真实请求流是：用户在 Claude Code/Codex/Cline 这类工具里配置 `Endpoint: http://localhost:20128/v1`、`API Key: [dashboard key]`、`Model: kr/claude-sonnet-..."
artifact_audit:
  official_repo: "https://github.com/decolua/9router"
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

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

decolua/9router：GitHub 描述为“Unlimited FREE AI coding. Connect Claude Code, Codex, Cursor, Cline, Copilot, Antigravity to FREE Claude/GPT/Gemini via 40+ providers. Auto-fallback, RTK -40% tokens, never hit limits”。

（来源：README/artifactAudit）

## 干什么

Unlimited FREE AI coding. Connect Claude Code, Codex, Cursor, Cline, Copilot, Antigravity to FREE Claude/GPT/Gemini via 40+ providers. Auto-fallback, RTK -40% tokens, never hit limits.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | JavaScript |
| total_stars | 16559 |
| stars_in_period | 12723 |
| author | decolua |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- skills（来源：数据不足）
- models（来源：数据不足）

## 解决什么痛点

通俗说，这个项目值得看不是因为 README 说“免费无限”，而是因为源码里确实实现了一个面向 AI 编程工具的本地网关：有 `/v1` 重写、格式翻译、账号选择、combo fallback、RTK 工具输出压缩、SQLite 状态库、CLI 包和 Docker 入口。术语定义：网关是请求入口；fallback 是失败后切换备选；RTK 是对工具输出做压缩的预处理；SQLite 状态库保存 provider 连接、combo、API key、usage 等本地状态。

（来源：README/artifactAudit）

## 核心能力

- Model string as routing contract（来源：数据不足）
- Combo fallback service（来源：数据不足）
- Per-model account lock（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

通俗说，9Router 更像“给 AI 编程工具用的本地多账号/多上游网关”，不是通用企业 LLM gateway 的完整替代。和 LiteLLM 相比，LiteLLM 官方文档自称提供 proxy、router retry/fallback、生产网关配置；它更适合服务端团队统一接入多模型，但 9Router 对 Claude Code/Codex/Cursor/OpenClaw 等本地编程工具有更多专门入口、OAuth/provider executor 和 dashboard 配置文件写入逻辑（来源：9Router src/app/api/cli-tools/*；LiteLLM docs https://docs.litellm.ai/ ，外部能力未在本仓库核验）。和 OpenRouter 相比，OpenRouter 是托管 API/模型路由服务，适合不想自管 provider key/账号逻辑的人；9Router 是本地 MIT 代码，provider token 和请求经过你自己的进程，但你要承担上游账号、OAuth、更新和安全配置（来源：README Deployment；OpenRouter docs https://openrouter.ai/docs/api/reference/overview/ ，外部能力为官方自称）。和 musistudio/claude-code-router 相比，Claude Code Router 更聚焦 Claude Code 路由；9Router 覆盖 `/v1/chat/completions`、`/v1/messages`、`/v1/responses`、images、audio、embeddings、web skills，并内置更宽的 dashboard/provider registry（来源：src/app/api/v1/*；skills/README.md；Claude Code Router README https://github.com/musistudio/claude-code-router ，外部能力未在本仓库核验）。术语定义：integration path 指客户端怎么接入；self-hosting 指是否自己运行网关；workflow fit 指对本地 AI 编程工具还是服务端应用更顺手。选择 9Router：当你要把本机 AI 编程 CLI 指到一个本地 `/v1`，并用多个账号/订阅/低价 provider 做 fallback。选择 LiteLLM：当你要面向后端服务部署通用 LLM proxy、集中治理和团队级配置。选择 OpenRouter：当你接受托管中间层并优先要少运维、多模型市场。选择 Claude Code Router：当需求主要围绕 Claude Code 且不需要 9Router 的 dashboard、多模态和大 provider registry。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

通俗说，真实请求流是：用户在 Claude Code/Codex/Cline 这类工具里配置 `Endpoint: http://localhost:20128/v1`、`API Key: [dashboard key]`、`Model: kr/claude-sonnet-4.5`。请求到 `/v1/chat/completions` 后，`next.config.mjs` rewrite 到 `/api/v1/chat/completions`；`src/app/api/v1/chat/completions/route.js` 初始化 translator 后调用 `handleChat(request)`。`handleChat` 读取 JSON、缓存 Claude header、检查 `settings.requireApiKey`，没有 model 就返回 400；如果 model 是 combo 名，会取 `getComboModels(modelStr)` 并调用 `handleComboChat`；如果是 `kr/claude-sonnet-4.5` 这种 `alias/model`，`open-sse/services/model.js` 把 `kr` 解析为 provider `kiro`。然后 `src/sse/services/auth.js` 选择账号：无认证 provider 会返回虚拟 `noauth` connection；普通 provider 会查 active `providerConnections`，过滤 `modelLock_*`，按 `fill-first` 或 `round-robin` 选连接。之后 `handleChatCore` 检测来源格式，决定目标格式；非 native passthrough 时调用 `translateRequest(sourceFormat, targetFormat, upstreamModel, ...)`；发送前执行 `compressMessages` 和可选 `injectCaveman`；再用 `getExecutor(provider)` 调上游。如果上游 401/403，会尝试 `refreshWithRetry(..., 3, log)`；如果上游失败，会 `parseUpstreamError`，调用 `markAccountUnavailable` 写入 `modelLock_${model}`，再走账号或 combo fallback。（来源：README Quick Start；next.config.mjs rewrites；src/app/api/v1/chat/completions/route.js；src/sse/handlers/chat.js；open-sse/services/model.js；src/sse/services/auth.js；open-sse/handlers/chatCore.js；open-sse/services/combo.js） 术语定义：alias 是短前缀，例如 `kr` 映射 `kiro`、`cx` 映射 `codex`；source format 是客户端请求格式，例如 OpenAI/Claude/Gemini；target format 是上游 provider 需要的格式；executor 是 provider-specific 网络调用模块；model lock 是某账号某模型在限流/认证错误后被临时锁住的字段。

## 本质不同的设计取舍

通俗说，最值得复用的不是“免费 provider 列表”，而是本地 AI 网关的几层边界：统一入口、模型名解析、combo fallback、账号锁、格式翻译、工具输出压缩、SQLite 状态仓库。术语定义：抽象是可以迁到别的 AI 应用里的设计单元；copy 是值得借鉴；skip 是不要照搬的部分。 - Model string as routing contract；用 `alias/model` 作为路由键，例如 `kr/claude-sonnet-4.5`、`cx/gpt-5.5`，并把 alias 映射集中在 `open-sse/services/model.js` 与 `PROVIDER_ID_TO_ALIAS`。；不要把上游仍会变动的模型名当成长期稳定 API。；客户端不需要知道账号、OAuth、format、endpoint；一个字符串就能表达路由目标。（来源：open-sse/services/model.js；open-sse/config/providerModels.js） - Combo fallback service；`handleComboChat({ body, models, handleSingleModel, comboStrategy, comboStickyLimit })` 这种把 fallback 编排与单模型执行分离的接口。；不要只依赖文本规则判断失败原因；生产系统还需要 provider-specific 错误契约和指标回放。；它让“模型组合”成为用户可配置对象，而不是硬编码 if/else。（来源：open-sse/services/combo.js；src/lib/db/schema.js combos table） - Per-model account lock；失败后写 `modelLock_${model}`，成功后只清当前模型 lock；避免一个模型限流导致整个账号不可用。；不要忽略隐私和密钥保护；provider token 存在本地 DB 的 data JSON 里。；对 Claude/Codex/GitHub 这类有分模型或分额度行为的上游，模型粒度锁比账号级熔断更细。（来源：src/sse/services/auth.js markAccountUnavailable/clearAccountError；src/lib/db/repos/connectionsRepo.js） - RTK pre-dispatch compression；在格式翻译之后、executor 之前处理 tool output，并支持 OpenAI、Claude、Responses、Kiro 多种 body 形状。；不要把 README 的节省比例当成 SLA；应记录每次 `bytesBefore/bytesAfter/hits`。；压缩点选得靠后，可以覆盖 passthrough 与 translated flows；日志格式 `[RTK] saved ... via [...]` 可用于实际观测。（来源：open-sse/handlers/chatCore.js；open-sse/rtk/index.js formatRtkLog） - Driver chain for local persistence；Node 下优先 `better-sqlite3`，再尝试 `node:sqlite`，最后 `sql.js`；Bun 下先 `bun:sqlite`。；不要让架构文档和代码漂移；本仓库 `docs/ARCHITECTURE.md` 仍有 `db.json` 陈旧表述。；本地工具要在 Windows/macOS/Linux 和 Docker 中启动，SQLite driver fallback 能降低安装失败率。（来源：src/lib/db/driver.js；src/lib/db/paths.js；package.json optionalDependencies）

## 对从业者意味着什么

通俗判断：对 AI 编程工具重度用户和做本地 LLM gateway 的工程师，值得 clone-and-run；对生产后端统一网关，不应直接按 README 的“免费无限”叙事采用。工程上有真实深度：Next rewrite、OpenAI/Claude/Gemini/Responses 翻译、provider executor、combo/account fallback、RTK、SQLite driver chain、Docker/CLI、测试树和快速 changelog。主要扣分在上游接口脆弱、文档局部陈旧、免费额度不可由仓库证明。术语定义：clone-and-run 表示下一步未确认在隔离机器上启动、接一个低风险 provider、跑真实 `/v1/chat/completions` 和 RTK 日志，而不是只收藏 README。

（来源：README/artifactAudit）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/openai-compatible-local-gateway]]、[[concepts/combo-fallback-routing]]。另见 [[content/decolua-9router]]、[[claims/decolua-9router-main-claim]]。
