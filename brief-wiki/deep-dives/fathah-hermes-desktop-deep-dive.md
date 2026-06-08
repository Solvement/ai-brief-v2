---
content: "fathah-hermes-desktop"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "ai_app"
title: "hermes-desktop — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "fathah/hermes-desktop：GitHub 描述为“Desktop Companion for Hermes Agent”。"
  what_it_does: "Desktop Companion for Hermes Agent"
  metadata:
    language: "TypeScript"
    total_stars: "11119"
    stars_in_period: "9784"
    author: "fathah"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "skills"
    - "models"
  pain_point: "人话：值得看的是“桌面 UI 怎样接管一个已有 CLI agent”的工程细节，而不是 README 里的大而全能力表。代码里已经处理了安装路径、远程模式、SSH 隧道、profile 端口、API key 位置、SSE 解析、SQLite 会话搜索、skill 文件安全边界等很多真实桌面集成问题。术语：profile 是隔离的 Hermes 环境；gateway 是 Hermes Agent 暴露 OpenAI-compatible API 和消息平台能力的本地服务。"
  core_capabilities:
    - "安装目标预检与显式确认"
    - "profile-aware gateway port allocator"
    - "capabilities-gated transport selection"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "人话：第一类替代是直接用 Hermes Agent CLI。CLI 更少依赖、更贴近上游；Hermes Desktop 更适合需要图形化安装、模型配置、历史会话、gateway、skills、memory 管理的人。差异维度是集成路径：CLI 直接运行 `hermes chat`，Desktop 会先启动/探测 gateway，API 失败才 fallback 到 `hermes chat -q ... --source desktop`。（来源：README Related Project；src/main/hermes.ts sendMessageViaCli） 第二类替代是普通 Remote HTTP URL + API key。它适合只把桌面当聊天客户端；SSH Tunnel 适合远端 VPS 上有完整 `~/.hermes`，并且要管理 Sessions、Skills、Memory、Soul、Tools、Schedules、Gateway、Profiles、Models、Logs。差异维度是管理面：Remote HTTP 文档明确说其他屏幕读本地 `~/.hermes`，SSH 通过远端路径代理。（来源：docs/SSH-TUNNEL-VPS.md Why SSH Tunnel mode） 第三类可比实践是 Open WebUI 消费 OpenAI-compatible API。仓库源码只说明 Hermes 可作为 API server 暴露给 “tools like Open WebUI”，未在本次检查 Open WebUI 自身能力；因此对 Open WebUI 的能力不做独立事实扩展。取舍：如果团队已有 web UI 和统一模型网关，选 OpenAI-compatible API 消费；如果要编辑 Hermes profile、skill、SOUL.md、gateway 平台配置，Hermes Desktop 更贴合。（来源：src/shared/messaging-platforms.ts api_server description） 术语：CLI 是命令行入口；Remote HTTP 是只连 API 的远程模式；SSH Tunnel 是把远端 127.0.0.1:8642 转发成本地端口并代理管理操作。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话流程：第一次启动时，安装页先调用 `inspectInstallTarget()` 显示将写入的 `repoPath`，状态是 `fresh`、`update` 或 `replace`；用户点确认后才 `startInstall()`，进度对象固定有 `step`、`totalSteps: 7`、`title`、`detail`、`log`。（来源：src/renderer/src/screens/Install/Install.tsx；src/main/installer.ts inspectInstallTarget） 接着 Setup 页默认选 `openrouter`，如果 provider 需要 key，就把 key 写进对应 env，例如 `OPENROUTER_API_KEY`；如果选 local/custom，则从 base URL 推导 env key，最后调用 `setModelConfig(provider, model, baseUrl)` 写 `config.yaml` 的 `model.provider`、`model.default`、`model.base_url`。（来源：src/renderer/src/screens/Setup/Setup.tsx；src/main/config.ts setEnvValue/setModelConfig；src/shared/url-key-map.ts） 真正聊天时，`sendMessage()` 先区分 local/remote/ssh。local 会探测 API server，不通就 `startGatewayWithRecovery()`；gateway 启动时 spawn `HERMES_PYTHON`，参数来自 `gatewayCliCommandArgs(profile, [\"gateway\"])`，非默认 profile 会加 `--profile <name>`，stderr 写进 profile log。（来源：src/main/hermes.ts sendMessage/startGatewayDetailed） 消息 API 有三条路：如果 `/v1/capabilities` 同时声明 `run_submission`、`run_events_sse`、`run_stop`、`run_approval_response`、`tool_progress_events`，且 endpoints 精确等于 `/v1/runs`、`/v1/runs/{run_id}/events`、`/v1/runs/{run_id}/approval`、`/v1/runs/{run_id}/stop`，就走 runs transport；否则 POST `/v1/chat/completions`，body 含 `model`、`messages`、`stream: true`、可选 `session_id`；SSE block 按 `\\n\\n` 分割，`event: hermes.tool.progress` 走 tool event，普通 `data:` 解析 OpenAI-style `choices[0].delta.content` 和 `usage`。（来源：src/main/run-stream.ts supportsHermesRunsTransport；src/main/hermes.ts sendMessageViaRuns/sendMessageViaApi；src/main/sse-parser.ts） 术语定义：OpenAI-compatible 是指用 `/v1/chat/completions` 一类接口对接不同模型服务；gateway 是 Hermes Agent 的本地 HTTP/消息平台进程；SSE block 是服务端推送的一段 `event:`/`data:` 文本。"
  essential_design_difference: "人话：这个仓库最可复用的不是 UI，而是把一个 CLI agent 变成桌面产品时的边界处理。术语：抽象不是类名，而是一组可迁移的工程模式。 - 安装目标预检与显式确认；复制 `fresh/update/replace` 分类思路：先检查目标 repo 是否存在、是否 git repo，再把将要覆盖/更新的路径展示给用户。；如果你的工具只是 npm 包或单文件 CLI，不需要复制完整 installer wrapper。；避免桌面应用静默重装或覆盖用户已有 agent 数据；Hermes Desktop 在 `Install.tsx` 里把安装放到用户确认之后。（来源：src/main/installer.ts classifyInstallTarget；src/renderer/src/screens/Install/Install.tsx） - profile-aware gateway port allocator；默认 profile 固定 `8642`，命名 profile 从 `8643-8742` 分配并持久化到 `platforms.api_server.extra.port`。；如果你的 agent 不允许多个 profile/gateway 并行，这个复杂度可以省掉。；解决多个 profile 同时启动时抢同一个 API server port 的问题。（来源：src/main/gateway-ports.ts） - capabilities-gated transport selection；先读 `/v1/capabilities` 再决定是否使用新 `/v1/runs` transport；不满足就回退 `/v1/chat/completions`。；如果你的后端版本完全锁死，不需要 runtime capability probing。；桌面端可以兼容不同 Hermes Agent 版本，而不是硬编码新 API。（来源：src/main/run-stream.ts；src/main/hermes.ts sendMessageViaNonGatewayApi） - 配置写入只改目标 YAML block；用 block-aware writer 更新 `model:` 子项，避免 loose regex 改到 `personalities.default` 或 `auxiliary.*.api_key`。；如果配置文件是 JSON/TOML，优先用正式 parser。；这是从真实 bug 里提炼的防错模式：`setModelConfig` scoped 到 `model:`，还会把 `streaming` 写成 true。（来源：src/main/config.ts getModelConfig/setModelConfig） - Skill 文件读取白名单；读取 `SKILL.md` 前先确认路径落在 `HERMES_HOME/skills`、`HERMES_REPO/skills` 或合法 profile skills 目录里。；如果 skill 内容来自可信内存 catalog，不需要本地路径防护。；UI 展示本地文件时防止任意路径读取。（来源：src/main/skills.ts isAllowedSkillFile/getSkillContent）"
  practitioner_meaning: "人话：建议下一步 clone-and-run，但判断重点不是“又一个聊天桌面端”，而是学习它如何把 CLI agent 的安装、gateway、profile、远程 SSH、SSE、SQLite 历史和配置写入串成桌面工作流。成熟度给 3，是因为 README 自称 active development，且安装签名、远程屏幕例外、README 与源码 catalog 数字不一致都提示仍在快速迭代。术语：clone-and-run 意味着值得在隔离环境实际启动并跑 setup/chat/SSH/skills 四条 smoke flow。（来源：README active development；README Install；docs/SSH-TUNNEL-VPS.md；package.json scripts）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "Hermes Desktop 是 Hermes Agent 的 Electron 桌面控制台：负责安装 Hermes、写入模型/API 配置，并把聊天、会话、技能、记忆、网关和远程 SSH 管理做成 GUI。"
    body_md: "人话：它不是新的 agent 引擎，而是把 Hermes Agent 从命令行包装成桌面应用；核心价值在于把 `~/.hermes`、`config.yaml`、`.env`、gateway 进程和 SSE 聊天流集中管理。术语：Electron 是桌面壳，Hermes Agent 是上游 agent runtime，SSE 是服务端持续推送 token/tool event 的流式协议。（来源：README Features；README How It Works；src/main/hermes.ts sendMessage；src/main/installer.ts HERMES_HOME）"
  why_worth_attention:
    summary: ""
    body_md: "人话：值得看的是“桌面 UI 怎样接管一个已有 CLI agent”的工程细节，而不是 README 里的大而全能力表。代码里已经处理了安装路径、远程模式、SSH 隧道、profile 端口、API key 位置、SSE 解析、SQLite 会话搜索、skill 文件安全边界等很多真实桌面集成问题。术语：profile 是隔离的 Hermes 环境；gateway 是 Hermes Agent 暴露 OpenAI-compatible API 和消息平台能力的本地服务。"
    bullets:
      - "已核实：本次检出 commit 为 `2376c93bfd1ed1d267e2d0112832f6fb9c8f89ac`，最近提交信息为 `Merge pull request #600 from fathah/context-menu-mislocation-fix`。（来源：git log）"
      - "已核实：`package.json` 版本是 `0.5.8`，脚本含 `dev`、`build`、`build:win`、`build:mac`、`build:linux`、`build:rpm`、`test`、`typecheck`。（来源：package.json scripts）"
      - "已核实：仓库内有 90 个 `*.test.ts`/`*.test.tsx` 测试文件，覆盖 SSE parser、IPC handlers、installer、providers、sessions、SSH remote、skills 等区域。（来源：repo tree tests；Get-ChildItem 统计）"
      - "自称：README 说支持 Chat、Sessions、Agents、Skills、Models、Memory、Soul、Tools、Schedules、Gateway、Office、Settings 等屏幕；截图资源也在 `previews/` 下。（来源：README Screens；previews tree）"
  key_claims_evidence:
    summary: ""
    body_md: "人话：README 的“支持多少 providers/toolsets/gateways”要当自称；源码里的路径、端口、脚本、env key、IPC/API 流程可以当已核实。术语：自称是项目文档或 badge 说法；已核实是从代码、配置、文件树直接看到的机制。"
    items:
      - claim: "桌面端会安装或复用 Hermes Agent，并把 Hermes 文件放到 Hermes home。"
        plain_english: "安装页先展示目标目录和 fresh/update/replace 状态，用户确认后才调用安装；也允许选择已有安装并校验 venv binary。"
        source: "src/renderer/src/screens/Install/Install.tsx lines 33-80, 112-130；src/main/installer.ts HERMES_HOME/HERMES_REPO/validateHermesHome/runInstallWindows；README First-Time Setup"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`HERMES_HOME` 解析到 env override、desktop override 或默认目录；`HERMES_REPO = join(HERMES_HOME, \"hermes-agent\")`；Windows wrapper 下载 `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1` 并传 `-SkipSetup -HermesHome ... -InstallDir ...`。"
        does_not_support: "不证明安装脚本在本机成功跑通；本次未执行安装。"
        threat: "上游 install.sh/install.ps1 或 Hermes Agent 目录结构变化会直接破坏桌面安装/复用逻辑。"
      - claim: "聊天优先走本地/远程 API 流式通道，必要时退回 CLI。"
        plain_english: "发送消息时先判断 remote/SSH；本地模式会检查 `/health`、尝试启动 gateway；API 可用时走 TUI gateway、runs API 或 `/v1/chat/completions`，最后才走 `hermes chat -q`。"
        source: "src/main/hermes.ts sendMessage, sendMessageViaBestApi, sendMessageViaRuns, sendMessageViaApi, sendMessageViaCli；src/main/run-stream.ts supportsHermesRunsTransport"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`sendMessage` 在 remote 模式直接 `sendMessageViaBestApi`；本地会 `isApiServerReady` / `startGatewayWithRecovery`；`sendMessageViaApi` POST 到 `${getApiUrl(profile)}/v1/chat/completions` 且 `stream: true`；CLI fallback 参数是 `chat -q <message> -Q --source desktop`。"
        does_not_support: "不证明所有 Hermes Agent 版本都支持 `/v1/runs`；代码会先读 `/v1/capabilities` 再判断。"
        threat: "Hermes API event schema、capabilities endpoint 或 CLI 参数变化会影响流式聊天。"
      - claim: "项目支持远程 Hermes，但 Remote HTTP 和 SSH Tunnel 的能力面不同。"
        plain_english: "普通 Remote 只够聊天；SSH Tunnel 才把 Sessions、Skills、Memory、Soul、Tools、Schedules、Gateway、Profiles、Models、Logs 等管理屏幕代理到远端 `~/.hermes`。"
        source: "docs/SSH-TUNNEL-VPS.md Why SSH Tunnel mode；src/main/ssh-tunnel.ts buildSshArgs/testSshConnection"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "SSH 命令参数含 `-N -L <localPort>:127.0.0.1:<remotePort> -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ExitOnForwardFailure=yes`；默认 remotePort 是 `8642`，localPort 是 `18642`。"
        does_not_support: "文档也说明 Kanban、Office 存在例外/未完全远程化区域；不能写成所有屏幕 100% 等价。"
        threat: "远端用户选择错误时，`~/.hermes` 会指向错误 home，管理屏幕会空。"
      - claim: "README 称有多 provider、多 toolset、多 messaging gateway。"
        plain_english: "README 的数量是项目自称；源码中可核实 provider/base URL、toolset 和 messaging catalog，但数量与 README 文案不完全一致。"
        source: "README Features；src/renderer/src/constants.ts PROVIDERS/LOCAL_PRESETS；src/shared/messaging-platforms.ts MESSAGING_TOOLSET_DEFINITIONS/MESSAGING_PLATFORM_CATALOG"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "源码核实：`MESSAGING_TOOLSET_DEFINITIONS` 有 18 个 key：web, browser, terminal, file, code_execution, vision, image_gen, tts, skills, memory, session_search, clarify, cronjob, todo, messaging, kanban, delegation, moa；`MESSAGING_PLATFORM_CATALOG` 有 20 个 id，包括 telegram、discord、slack、api_server、webhook。"
        does_not_support: "README 写“14 toolsets”和“16 messaging gateways”，本次不把这些数字当作已核实事实；也未验证每个平台真实可用。"
        threat: "README 与源码 catalog 可能不同步；深潜时应优先引用源码 catalog。"
      - claim: "会话搜索和恢复依赖 Hermes 的 SQLite state.db，并保留 reasoning/tool_call/tool_result。"
        plain_english: "Sessions 不是简单文本日志；它打开 active profile 的 `state.db`，查询 `sessions`、`messages`、可选 `messages_fts`，并把 assistant reasoning、tool call、tool result 展开成时间线项。"
        source: "src/main/sessions.ts listSessions/searchSessions/expandRowsToHistory/getSessionMessages"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`searchSessions` 检查 `messages_fts`，用 FTS5 `MATCH` 和 `snippet(messages_fts, 0, '<<', '>>', '...', 40)`；`expandRowsToHistory` 输出 `reasoning`、`tool_call`、`tool_result`。"
        does_not_support: "不证明上游 state.db schema 永久稳定。"
        threat: "Hermes Agent 数据库 schema 或 JSON sentinel `\\x00json:` 变化会影响历史恢复。"
  how_it_works:
    summary: ""
    body_md: "人话流程：第一次启动时，安装页先调用 `inspectInstallTarget()` 显示将写入的 `repoPath`，状态是 `fresh`、`update` 或 `replace`；用户点确认后才 `startInstall()`，进度对象固定有 `step`、`totalSteps: 7`、`title`、`detail`、`log`。（来源：src/renderer/src/screens/Install/Install.tsx；src/main/installer.ts inspectInstallTarget）\n\n接着 Setup 页默认选 `openrouter`，如果 provider 需要 key，就把 key 写进对应 env，例如 `OPENROUTER_API_KEY`；如果选 local/custom，则从 base URL 推导 env key，最后调用 `setModelConfig(provider, model, baseUrl)` 写 `config.yaml` 的 `model.provider`、`model.default`、`model.base_url`。（来源：src/renderer/src/screens/Setup/Setup.tsx；src/main/config.ts setEnvValue/setModelConfig；src/shared/url-key-map.ts）\n\n真正聊天时，`sendMessage()` 先区分 local/remote/ssh。local 会探测 API server，不通就 `startGatewayWithRecovery()`；gateway 启动时 spawn `HERMES_PYTHON`，参数来自 `gatewayCliCommandArgs(profile, [\"gateway\"])`，非默认 profile 会加 `--profile <name>`，stderr 写进 profile log。（来源：src/main/hermes.ts sendMessage/startGatewayDetailed）\n\n消息 API 有三条路：如果 `/v1/capabilities` 同时声明 `run_submission`、`run_events_sse`、`run_stop`、`run_approval_response`、`tool_progress_events`，且 endpoints 精确等于 `/v1/runs`、`/v1/runs/{run_id}/events`、`/v1/runs/{run_id}/approval`、`/v1/runs/{run_id}/stop`，就走 runs transport；否则 POST `/v1/chat/completions`，body 含 `model`、`messages`、`stream: true`、可选 `session_id`；SSE block 按 `\\n\\n` 分割，`event: hermes.tool.progress` 走 tool event，普通 `data:` 解析 OpenAI-style `choices[0].delta.content` 和 `usage`。（来源：src/main/run-stream.ts supportsHermesRunsTransport；src/main/hermes.ts sendMessageViaRuns/sendMessageViaApi；src/main/sse-parser.ts）\n\n术语定义：OpenAI-compatible 是指用 `/v1/chat/completions` 一类接口对接不同模型服务；gateway 是 Hermes Agent 的本地 HTTP/消息平台进程；SSE block 是服务端推送的一段 `event:`/`data:` 文本。"
  reusable_abstractions:
    summary: ""
    body_md: "人话：这个仓库最可复用的不是 UI，而是把一个 CLI agent 变成桌面产品时的边界处理。术语：抽象不是类名，而是一组可迁移的工程模式。"
    items:
      - name: "安装目标预检与显式确认"
        copy: "复制 `fresh/update/replace` 分类思路：先检查目标 repo 是否存在、是否 git repo，再把将要覆盖/更新的路径展示给用户。"
        skip: "如果你的工具只是 npm 包或单文件 CLI，不需要复制完整 installer wrapper。"
        why_it_matters: "避免桌面应用静默重装或覆盖用户已有 agent 数据；Hermes Desktop 在 `Install.tsx` 里把安装放到用户确认之后。（来源：src/main/installer.ts classifyInstallTarget；src/renderer/src/screens/Install/Install.tsx）"
      - name: "profile-aware gateway port allocator"
        copy: "默认 profile 固定 `8642`，命名 profile 从 `8643-8742` 分配并持久化到 `platforms.api_server.extra.port`。"
        skip: "如果你的 agent 不允许多个 profile/gateway 并行，这个复杂度可以省掉。"
        why_it_matters: "解决多个 profile 同时启动时抢同一个 API server port 的问题。（来源：src/main/gateway-ports.ts）"
      - name: "capabilities-gated transport selection"
        copy: "先读 `/v1/capabilities` 再决定是否使用新 `/v1/runs` transport；不满足就回退 `/v1/chat/completions`。"
        skip: "如果你的后端版本完全锁死，不需要 runtime capability probing。"
        why_it_matters: "桌面端可以兼容不同 Hermes Agent 版本，而不是硬编码新 API。（来源：src/main/run-stream.ts；src/main/hermes.ts sendMessageViaNonGatewayApi）"
      - name: "配置写入只改目标 YAML block"
        copy: "用 block-aware writer 更新 `model:` 子项，避免 loose regex 改到 `personalities.default` 或 `auxiliary.*.api_key`。"
        skip: "如果配置文件是 JSON/TOML，优先用正式 parser。"
        why_it_matters: "这是从真实 bug 里提炼的防错模式：`setModelConfig` scoped 到 `model:`，还会把 `streaming` 写成 true。（来源：src/main/config.ts getModelConfig/setModelConfig）"
      - name: "Skill 文件读取白名单"
        copy: "读取 `SKILL.md` 前先确认路径落在 `HERMES_HOME/skills`、`HERMES_REPO/skills` 或合法 profile skills 目录里。"
        skip: "如果 skill 内容来自可信内存 catalog，不需要本地路径防护。"
        why_it_matters: "UI 展示本地文件时防止任意路径读取。（来源：src/main/skills.ts isAllowedSkillFile/getSkillContent）"
  dependency_platform_risk:
    summary: ""
    body_md: "人话：风险集中在上游 Hermes Agent、Electron 打包/签名、模型 provider key 映射、SQLite schema、SSH 环境。术语：平台风险是外部依赖变化导致桌面端同样代码失效。"
    items:
      - dependency: "NousResearch/hermes-agent install scripts and CLI"
        what_if_change: "install.sh/install.ps1 参数、venv 结构、`hermes chat`/`gateway` CLI 参数变化会影响安装、启动和 fallback。"
        exposure: "high"
        mitigation_or_unknown: "代码有 `validateHermesHome`、`verifyInstall`、CLI fallback，但未说明与哪些 Hermes Agent 版本兼容。"
        source: "src/main/installer.ts；src/main/hermes.ts；README Notes"
      - dependency: "Hermes HTTP API and SSE schema"
        what_if_change: "`/v1/capabilities`、`/v1/runs`、`/v1/chat/completions`、tool event 名称或 usage 字段变化会影响聊天显示。"
        exposure: "high"
        mitigation_or_unknown: "有 capability gate 和 chat-completions fallback；未在 README/docs 说明 API schema 版本契约。"
        source: "src/main/run-stream.ts；src/main/hermes.ts；src/main/sse-parser.ts"
      - dependency: "Electron/electron-builder/electron-updater"
        what_if_change: "平台打包、auto-update、Linux sandbox、Windows signing 都依赖 Electron 生态。"
        exposure: "medium"
        mitigation_or_unknown: "README 明确 Windows installer 未 code-signed，RPM 未 GPG-signed且 `.rpm` 不支持 auto-update；electron-builder 配置含 nsis、portable、AppImage、snap、deb、rpm。"
        source: "README Install；electron-builder.yml；package.json dependencies"
      - dependency: "Provider URL to env-key mapping"
        what_if_change: "新 provider host 或 key 名变化会导致 API key 写入/读取错误。"
        exposure: "medium"
        mitigation_or_unknown: "有 `URL_KEY_MAP` 和 `CUSTOM_API_KEY` fallback；但 README 的 provider 列表和源码 registry 需要持续同步。"
        source: "src/shared/url-key-map.ts；src/main/provider-registry.ts；src/renderer/src/constants.ts"
      - dependency: "SQLite `state.db` schema"
        what_if_change: "`sessions`、`messages`、`messages_fts`、reasoning/tool call 字段变化会影响历史列表、搜索和恢复。"
        exposure: "medium"
        mitigation_or_unknown: "代码对缺少 `messages_fts` 有降级；对 schema 版本迁移未在 README/docs 说明。"
        source: "src/main/sessions.ts"
      - dependency: "OpenSSH client and remote account layout"
        what_if_change: "SSH key、BatchMode、known_hosts、远端用户 home 不正确，会让 SSH Tunnel 失败或读错 `~/.hermes`。"
        exposure: "medium"
        mitigation_or_unknown: "SSH docs 给出 `ssh -o BatchMode=yes ... curl ... /health` 验证命令；Kanban/Office 仍有远程限制。"
        source: "docs/SSH-TUNNEL-VPS.md；src/main/ssh-tunnel.ts"
  unknowns_to_confirm:
    summary: ""
    body_md: "人话：本次只做仓库级深潜，没有启动桌面端，也没有真实安装 Hermes Agent 或连 provider。术语：未知项是 README/docs/tree 没有说明，或需要运行环境验证的事实。"
    items:
      - "未知：未执行 `npm install`、`npm run dev`、`npm run test`；`runnable` 只能从 scripts 判断，不能证明本机可跑。"
      - "未知：README/badge 的 star、download、provider model 数字未独立核验；这些应按自称处理。"
      - "未知：每个 messaging platform 实际是否可连通；源码只有 env schema、状态判断和 gateway 配置。"
      - "未知：Hermes Agent 上游 API/CLI 的稳定版本范围；README/docs/tree 没有给兼容矩阵。"
      - "未知：自动更新在各平台的真实成功率；README 明确 `.rpm` auto-update 不支持。"
      - "未知：PostHog analytics 官方 build 如何注入和开关；`.env.example` 只说明 fork 无 secrets 会禁用。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 4
      工程深度: 4
      复用价值: 4
      成熟度: 3
    body_md: "人话：建议下一步 clone-and-run，但判断重点不是“又一个聊天桌面端”，而是学习它如何把 CLI agent 的安装、gateway、profile、远程 SSH、SSE、SQLite 历史和配置写入串成桌面工作流。成熟度给 3，是因为 README 自称 active development，且安装签名、远程屏幕例外、README 与源码 catalog 数字不一致都提示仍在快速迭代。术语：clone-and-run 意味着值得在隔离环境实际启动并跑 setup/chat/SSH/skills 四条 smoke flow。（来源：README active development；README Install；docs/SSH-TUNNEL-VPS.md；package.json scripts）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\fathah-hermes-desktop\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\fathah-hermes-desktop\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\fathah-hermes-desktop\\codex-last-message.json"
  invoked_at: "2026-06-08T15:00:05.632Z"
  completed_at: "2026-06-08T15:04:54.865Z"
  repo: "fathah/hermes-desktop"
reasoning_trace:
  paper_type_decision: "project_type = ai_app; evidence from README/artifactAudit only."
  central_contribution: "Desktop Companion for Hermes Agent"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "桌面端会安装或复用 Hermes Agent，并把 Hermes 文件放到 Hermes home。"
    - "聊天优先走本地/远程 API 流式通道，必要时退回 CLI。"
    - "项目支持远程 Hermes，但 Remote HTTP 和 SSH Tunnel 的能力面不同。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "src/main/installer.ts；src/main/hermes.ts；README Notes"
    - "src/main/run-stream.ts；src/main/hermes.ts；src/main/sse-parser.ts"
    - "README Install；electron-builder.yml；package.json dependencies"
    - "src/shared/url-key-map.ts；src/main/provider-registry.ts；src/renderer/src/constants.ts"
    - "src/main/sessions.ts"
    - "docs/SSH-TUNNEL-VPS.md；src/main/ssh-tunnel.ts"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 4
  engineering_depth: 4
  reuse_value: 4
  maturity: 3
  main_risk: "人话：建议下一步 clone-and-run，但判断重点不是“又一个聊天桌面端”，而是学习它如何把 CLI agent 的安装、gateway、profile、远程 SSH、SSE、SQLite 历史和配置写入串成桌面工作流。成熟度给 3，是因为 README 自称 active development，且安装签名、远程屏幕例外、README 与源码 catalog 数字不一致都提示仍在快速迭代。术语：clone-and-run 意味着值得在隔离环境实际启动并跑 setup/chat/SSH/skills 四条 smoke flow。（来源：README active development；README Install；docs/SSH-TUNNEL-VPS.md；package.json scripts）"
next_actions:
  - "clone-and-run"
unknowns:
  - "未知：未执行 `npm install`、`npm run dev`、`npm run test`；`runnable` 只能从 scripts 判断，不能证明本机可跑。"
  - "未知：README/badge 的 star、download、provider model 数字未独立核验；这些应按自称处理。"
  - "未知：每个 messaging platform 实际是否可连通；源码只有 env schema、状态判断和 gateway 配置。"
  - "未知：Hermes Agent 上游 API/CLI 的稳定版本范围；README/docs/tree 没有给兼容矩阵。"
  - "未知：自动更新在各平台的真实成功率；README 明确 `.rpm` auto-update 不支持。"
  - "未知：PostHog analytics 官方 build 如何注入和开关；`.env.example` 只说明 fork 无 secrets 会禁用。"
builder_reuse:
  pattern: "安装目标预检与显式确认"
  copy: "复制 `fresh/update/replace` 分类思路：先检查目标 repo 是否存在、是否 git repo，再把将要覆盖/更新的路径展示给用户。"
  skip: "如果你的工具只是 npm 包或单文件 CLI，不需要复制完整 installer wrapper。"
  why_it_matters: "避免桌面应用静默重装或覆盖用户已有 agent 数据；Hermes Desktop 在 `Install.tsx` 里把安装放到用户确认之后。（来源：src/main/installer.ts classifyInstallTarget；src/renderer/src/screens/Install/Install.tsx）"
dependency_platform_risk:
  dependency: "NousResearch/hermes-agent install scripts and CLI"
  what_if_change: "install.sh/install.ps1 参数、venv 结构、`hermes chat`/`gateway` CLI 参数变化会影响安装、启动和 fallback。"
  exposure: "high"
  mitigation_or_unknown: "代码有 `validateHermesHome`、`verifyInstall`、CLI fallback，但未说明与哪些 Hermes Agent 版本兼容。"
claim_ledger:
  - claim: "桌面端会安装或复用 Hermes Agent，并把 Hermes 文件放到 Hermes home。"
    plain_english: "安装页先展示目标目录和 fresh/update/replace 状态，用户确认后才调用安装；也允许选择已有安装并校验 venv binary。"
    source: "src/renderer/src/screens/Install/Install.tsx lines 33-80, 112-130；src/main/installer.ts HERMES_HOME/HERMES_REPO/validateHermesHome/runInstallWindows；README First-Time Setup"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`HERMES_HOME` 解析到 env override、desktop override 或默认目录；`HERMES_REPO = join(HERMES_HOME, \"hermes-agent\")`；Windows wrapper 下载 `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1` 并传 `-SkipSetup -HermesHome ... -InstallDir ...`。"
    does_not_support: "不证明安装脚本在本机成功跑通；本次未执行安装。"
    threat: "上游 install.sh/install.ps1 或 Hermes Agent 目录结构变化会直接破坏桌面安装/复用逻辑。"
  - claim: "聊天优先走本地/远程 API 流式通道，必要时退回 CLI。"
    plain_english: "发送消息时先判断 remote/SSH；本地模式会检查 `/health`、尝试启动 gateway；API 可用时走 TUI gateway、runs API 或 `/v1/chat/completions`，最后才走 `hermes chat -q`。"
    source: "src/main/hermes.ts sendMessage, sendMessageViaBestApi, sendMessageViaRuns, sendMessageViaApi, sendMessageViaCli；src/main/run-stream.ts supportsHermesRunsTransport"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`sendMessage` 在 remote 模式直接 `sendMessageViaBestApi`；本地会 `isApiServerReady` / `startGatewayWithRecovery`；`sendMessageViaApi` POST 到 `${getApiUrl(profile)}/v1/chat/completions` 且 `stream: true`；CLI fallback 参数是 `chat -q <message> -Q --source desktop`。"
    does_not_support: "不证明所有 Hermes Agent 版本都支持 `/v1/runs`；代码会先读 `/v1/capabilities` 再判断。"
    threat: "Hermes API event schema、capabilities endpoint 或 CLI 参数变化会影响流式聊天。"
  - claim: "项目支持远程 Hermes，但 Remote HTTP 和 SSH Tunnel 的能力面不同。"
    plain_english: "普通 Remote 只够聊天；SSH Tunnel 才把 Sessions、Skills、Memory、Soul、Tools、Schedules、Gateway、Profiles、Models、Logs 等管理屏幕代理到远端 `~/.hermes`。"
    source: "docs/SSH-TUNNEL-VPS.md Why SSH Tunnel mode；src/main/ssh-tunnel.ts buildSshArgs/testSshConnection"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "SSH 命令参数含 `-N -L <localPort>:127.0.0.1:<remotePort> -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ExitOnForwardFailure=yes`；默认 remotePort 是 `8642`，localPort 是 `18642`。"
    does_not_support: "文档也说明 Kanban、Office 存在例外/未完全远程化区域；不能写成所有屏幕 100% 等价。"
    threat: "远端用户选择错误时，`~/.hermes` 会指向错误 home，管理屏幕会空。"
  - claim: "README 称有多 provider、多 toolset、多 messaging gateway。"
    plain_english: "README 的数量是项目自称；源码中可核实 provider/base URL、toolset 和 messaging catalog，但数量与 README 文案不完全一致。"
    source: "README Features；src/renderer/src/constants.ts PROVIDERS/LOCAL_PRESETS；src/shared/messaging-platforms.ts MESSAGING_TOOLSET_DEFINITIONS/MESSAGING_PLATFORM_CATALOG"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "源码核实：`MESSAGING_TOOLSET_DEFINITIONS` 有 18 个 key：web, browser, terminal, file, code_execution, vision, image_gen, tts, skills, memory, session_search, clarify, cronjob, todo, messaging, kanban, delegation, moa；`MESSAGING_PLATFORM_CATALOG` 有 20 个 id，包括 telegram、discord、slack、api_server、webhook。"
    does_not_support: "README 写“14 toolsets”和“16 messaging gateways”，本次不把这些数字当作已核实事实；也未验证每个平台真实可用。"
    threat: "README 与源码 catalog 可能不同步；深潜时应优先引用源码 catalog。"
  - claim: "会话搜索和恢复依赖 Hermes 的 SQLite state.db，并保留 reasoning/tool_call/tool_result。"
    plain_english: "Sessions 不是简单文本日志；它打开 active profile 的 `state.db`，查询 `sessions`、`messages`、可选 `messages_fts`，并把 assistant reasoning、tool call、tool result 展开成时间线项。"
    source: "src/main/sessions.ts listSessions/searchSessions/expandRowsToHistory/getSessionMessages"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`searchSessions` 检查 `messages_fts`，用 FTS5 `MATCH` 和 `snippet(messages_fts, 0, '<<', '>>', '...', 40)`；`expandRowsToHistory` 输出 `reasoning`、`tool_call`、`tool_result`。"
    does_not_support: "不证明上游 state.db schema 永久稳定。"
    threat: "Hermes Agent 数据库 schema 或 JSON sentinel `\\x00json:` 变化会影响历史恢复。"
artifact_audit:
  official_repo: "https://github.com/fathah/hermes-desktop"
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

fathah/hermes-desktop：GitHub 描述为“Desktop Companion for Hermes Agent”。

（来源：README/artifactAudit）

## 干什么

Desktop Companion for Hermes Agent

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | TypeScript |
| total_stars | 11119 |
| stars_in_period | 9784 |
| author | fathah |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- skills（来源：数据不足）
- models（来源：数据不足）

## 解决什么痛点

人话：值得看的是“桌面 UI 怎样接管一个已有 CLI agent”的工程细节，而不是 README 里的大而全能力表。代码里已经处理了安装路径、远程模式、SSH 隧道、profile 端口、API key 位置、SSE 解析、SQLite 会话搜索、skill 文件安全边界等很多真实桌面集成问题。术语：profile 是隔离的 Hermes 环境；gateway 是 Hermes Agent 暴露 OpenAI-compatible API 和消息平台能力的本地服务。

（来源：README/artifactAudit）

## 核心能力

- 安装目标预检与显式确认（来源：数据不足）
- profile-aware gateway port allocator（来源：数据不足）
- capabilities-gated transport selection（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

人话：第一类替代是直接用 Hermes Agent CLI。CLI 更少依赖、更贴近上游；Hermes Desktop 更适合需要图形化安装、模型配置、历史会话、gateway、skills、memory 管理的人。差异维度是集成路径：CLI 直接运行 `hermes chat`，Desktop 会先启动/探测 gateway，API 失败才 fallback 到 `hermes chat -q ... --source desktop`。（来源：README Related Project；src/main/hermes.ts sendMessageViaCli） 第二类替代是普通 Remote HTTP URL + API key。它适合只把桌面当聊天客户端；SSH Tunnel 适合远端 VPS 上有完整 `~/.hermes`，并且要管理 Sessions、Skills、Memory、Soul、Tools、Schedules、Gateway、Profiles、Models、Logs。差异维度是管理面：Remote HTTP 文档明确说其他屏幕读本地 `~/.hermes`，SSH 通过远端路径代理。（来源：docs/SSH-TUNNEL-VPS.md Why SSH Tunnel mode） 第三类可比实践是 Open WebUI 消费 OpenAI-compatible API。仓库源码只说明 Hermes 可作为 API server 暴露给 “tools like Open WebUI”，未在本次检查 Open WebUI 自身能力；因此对 Open WebUI 的能力不做独立事实扩展。取舍：如果团队已有 web UI 和统一模型网关，选 OpenAI-compatible API 消费；如果要编辑 Hermes profile、skill、SOUL.md、gateway 平台配置，Hermes Desktop 更贴合。（来源：src/shared/messaging-platforms.ts api_server description） 术语：CLI 是命令行入口；Remote HTTP 是只连 API 的远程模式；SSH Tunnel 是把远端 127.0.0.1:8642 转发成本地端口并代理管理操作。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话流程：第一次启动时，安装页先调用 `inspectInstallTarget()` 显示将写入的 `repoPath`，状态是 `fresh`、`update` 或 `replace`；用户点确认后才 `startInstall()`，进度对象固定有 `step`、`totalSteps: 7`、`title`、`detail`、`log`。（来源：src/renderer/src/screens/Install/Install.tsx；src/main/installer.ts inspectInstallTarget） 接着 Setup 页默认选 `openrouter`，如果 provider 需要 key，就把 key 写进对应 env，例如 `OPENROUTER_API_KEY`；如果选 local/custom，则从 base URL 推导 env key，最后调用 `setModelConfig(provider, model, baseUrl)` 写 `config.yaml` 的 `model.provider`、`model.default`、`model.base_url`。（来源：src/renderer/src/screens/Setup/Setup.tsx；src/main/config.ts setEnvValue/setModelConfig；src/shared/url-key-map.ts） 真正聊天时，`sendMessage()` 先区分 local/remote/ssh。local 会探测 API server，不通就 `startGatewayWithRecovery()`；gateway 启动时 spawn `HERMES_PYTHON`，参数来自 `gatewayCliCommandArgs(profile, ["gateway"])`，非默认 profile 会加 `--profile <name>`，stderr 写进 profile log。（来源：src/main/hermes.ts sendMessage/startGatewayDetailed） 消息 API 有三条路：如果 `/v1/capabilities` 同时声明 `run_submission`、`run_events_sse`、`run_stop`、`run_approval_response`、`tool_progress_events`，且 endpoints 精确等于 `/v1/runs`、`/v1/runs/{run_id}/events`、`/v1/runs/{run_id}/approval`、`/v1/runs/{run_id}/stop`，就走 runs transport；否则 POST `/v1/chat/completions`，body 含 `model`、`messages`、`stream: true`、可选 `session_id`；SSE block 按 `\n\n` 分割，`event: hermes.tool.progress` 走 tool event，普通 `data:` 解析 OpenAI-style `choices[0].delta.content` 和 `usage`。（来源：src/main/run-stream.ts supportsHermesRunsTransport；src/main/hermes.ts sendMessageViaRuns/sendMessageViaApi；src/main/sse-parser.ts） 术语定义：OpenAI-compatible 是指用 `/v1/chat/completions` 一类接口对接不同模型服务；gateway 是 Hermes Agent 的本地 HTTP/消息平台进程；SSE block 是服务端推送的一段 `event:`/`data:` 文本。

## 本质不同的设计取舍

人话：这个仓库最可复用的不是 UI，而是把一个 CLI agent 变成桌面产品时的边界处理。术语：抽象不是类名，而是一组可迁移的工程模式。 - 安装目标预检与显式确认；复制 `fresh/update/replace` 分类思路：先检查目标 repo 是否存在、是否 git repo，再把将要覆盖/更新的路径展示给用户。；如果你的工具只是 npm 包或单文件 CLI，不需要复制完整 installer wrapper。；避免桌面应用静默重装或覆盖用户已有 agent 数据；Hermes Desktop 在 `Install.tsx` 里把安装放到用户确认之后。（来源：src/main/installer.ts classifyInstallTarget；src/renderer/src/screens/Install/Install.tsx） - profile-aware gateway port allocator；默认 profile 固定 `8642`，命名 profile 从 `8643-8742` 分配并持久化到 `platforms.api_server.extra.port`。；如果你的 agent 不允许多个 profile/gateway 并行，这个复杂度可以省掉。；解决多个 profile 同时启动时抢同一个 API server port 的问题。（来源：src/main/gateway-ports.ts） - capabilities-gated transport selection；先读 `/v1/capabilities` 再决定是否使用新 `/v1/runs` transport；不满足就回退 `/v1/chat/completions`。；如果你的后端版本完全锁死，不需要 runtime capability probing。；桌面端可以兼容不同 Hermes Agent 版本，而不是硬编码新 API。（来源：src/main/run-stream.ts；src/main/hermes.ts sendMessageViaNonGatewayApi） - 配置写入只改目标 YAML block；用 block-aware writer 更新 `model:` 子项，避免 loose regex 改到 `personalities.default` 或 `auxiliary.*.api_key`。；如果配置文件是 JSON/TOML，优先用正式 parser。；这是从真实 bug 里提炼的防错模式：`setModelConfig` scoped 到 `model:`，还会把 `streaming` 写成 true。（来源：src/main/config.ts getModelConfig/setModelConfig） - Skill 文件读取白名单；读取 `SKILL.md` 前先确认路径落在 `HERMES_HOME/skills`、`HERMES_REPO/skills` 或合法 profile skills 目录里。；如果 skill 内容来自可信内存 catalog，不需要本地路径防护。；UI 展示本地文件时防止任意路径读取。（来源：src/main/skills.ts isAllowedSkillFile/getSkillContent）

## 对从业者意味着什么

人话：建议下一步 clone-and-run，但判断重点不是“又一个聊天桌面端”，而是学习它如何把 CLI agent 的安装、gateway、profile、远程 SSH、SSE、SQLite 历史和配置写入串成桌面工作流。成熟度给 3，是因为 README 自称 active development，且安装签名、远程屏幕例外、README 与源码 catalog 数字不一致都提示仍在快速迭代。术语：clone-and-run 意味着值得在隔离环境实际启动并跑 setup/chat/SSH/skills 四条 smoke flow。（来源：README active development；README Install；docs/SSH-TUNNEL-VPS.md；package.json scripts）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/desktop-companion-for-cli-agent]]、[[concepts/capabilities-gated-streaming-transport]]。另见 [[content/fathah-hermes-desktop]]、[[claims/fathah-hermes-desktop-main-claim]]。
