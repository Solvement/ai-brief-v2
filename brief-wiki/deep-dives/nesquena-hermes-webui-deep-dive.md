---
content: "nesquena-hermes-webui"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "ai_app"
title: "hermes-webui — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "nesquena/hermes-webui：GitHub 描述为“Hermes WebUI: The best way to use Hermes Agent from the web or from your phone”。"
  what_it_does: "Hermes WebUI: The best way to use Hermes Agent from the web or from your phone!"
  metadata:
    language: "Python"
    total_stars: "13589"
    stars_in_period: "4424"
    author: "nesquena"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "skills"
    - "models"
  pain_point: "值得看不是因为 README 写了很多功能，而是因为这个仓库把“本地/自托管 Agent 的 Web 工作台”做成了完整产品面：有真实的流式聊天链路、文件工作区、审批卡片、Docker 部署、onboarding、profile、扩展注入、Git 工作区控制和大量回归测试。它对 AI 工程师的价值主要在“如何把 CLI Agent 安全地包成 Web 产品”，不是在模型算法本身。（来源：README Features；ARCHITECTURE.md；docs/workspace-git.md；docs/EXTENSIONS.md）"
  core_capabilities:
    - "start/observe 分离的聊天协议"
    - "审批卡片作为运行时控制面"
    - "profile-scoped runtime env"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "未联网核验竞品当前能力；以下竞品信息只按本仓库 `README` 和 `docs/why-hermes.md` 的自称/对比使用。 OpenClaw：本仓库文档称 OpenClaw 是最直接对比，二者都是 always-on/self-hosted/open-source agents，有 memory、cron、messaging。差异维度是架构和技能路径：文档称 OpenClaw 是 Node.js/TypeScript Gateway control plane，技能偏 marketplace；Hermes 是 Python，强调 self-improving skills，并由 WebUI 包成浏览器工作台。做 AI 应用时，如果你要 Python/ML 生态、Hermes Agent 记忆/cron/profile 这套，选 Hermes WebUI；如果你更看重文档自称的更广 messaging 覆盖或 ClawHub/Marketplace 工作流，应评估 OpenClaw。（来源：README Why Hermes；docs/why-hermes.md vs. OpenClaw；竞品能力未独立核验） Claude Code：本仓库文档把 Claude Code 定位为强代码 Agent，但不是 Hermes 这种 self-hosted persistent agent 工作台；README 表里写 Claude Code provider-agnostic 为 No、self-hosted scheduled jobs 为 No/云或桌面路径。做 AI 应用时，如果需求是单人/团队代码编辑与 Anthropic 官方生态，Claude Code 更直接；如果需求是把一个常驻服务器 Agent 暴露到浏览器、手机、cron、workspace 和 profile，Hermes WebUI 更贴近。（来源：README comparison table；docs/why-hermes.md vs. Claude Code；竞品能力未独立核验） OpenCode：本仓库文档称 OpenCode 是开源 TUI coding assistant，支持 WebUI、AGENTS.md/CLAUDE.md 类上下文，但 scheduled jobs 为 No 或 community plugin，persistent memory 为 Partial。做 AI 应用时，如果你要的是终端 coding assistant 和多 provider coding workflow，OpenCode 更轻；如果你要浏览器里管理 Hermes Agent 的记忆、任务、技能、profile、workspace 文件和审批链路，Hermes WebUI 更像完整控制台。（来源：docs/why-hermes.md vs. OpenCode；竞品能力未独立核验）"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "真实流程示例：用户在浏览器 composer 里按发送。前端 `static/messages.js` 先把 user message 乐观插入 `S.messages`，上传附件时调用 `uploadPendingFiles()`；如果只有附件，会把消息文本构造成 `I've uploaded N file(s): ...`，如果有正文则追加 `[Attached files: ...]`。随后它 POST `/api/chat/start`，body 里包含 `session_id`、`message`、`model`、`workspace`、`model_provider`、`profile`、`explicit_model_pick` 和 `attachments`。（来源：static/messages.js send flow） 后端 `api/routes.py` 的 `_handle_chat_start` 先 `require(body, \"session_id\")`，找 session，校验 profile id，要求 `message` 非空，最多取 20 个 attachments，然后解析 workspace/model/provider。普通 legacy 路径会进入 `_start_chat_stream_for_session`，生成 stream，浏览器拿到 `stream_id`。（来源：api/routes.py `_handle_chat_start`） 流式部分由 `api/streaming.py` 执行。worker 注册 active run，创建 cancel event，把 `CANCEL_FLAGS[stream_id]`、`STREAM_PARTIAL_TEXT[stream_id]`、`STREAM_REASONING_TEXT[stream_id]`、`STREAM_LIVE_TOOL_CALLS[stream_id]` 放进全局表。跑 Agent 前，它设置线程/进程环境：`TERMINAL_CWD=str(s.workspace)`、`HERMES_EXEC_ASK=1`、`HERMES_SESSION_KEY=session_id`、`HERMES_SESSION_ID=session_id`、`HERMES_SESSION_PLATFORM=webui`；如果有 profile home，还临时设置 `HERMES_HOME`。然后按 Hermes Agent 的签名创建或复用 `AIAgent`，最终调用 `agent.run_conversation(user_message=..., system_message=..., conversation_history=..., task_id=session_id, persist_user_message=msg_text)`。（来源：api/streaming.py `_run_agent_streaming` env mutation and run_conversation） 浏览器侧对 SSE 做事件分发：`token` 追加到 assistantText 并节流渲染 markdown；`approval` 调用 `showApprovalCard`；用户点审批按钮时 `respondApproval(choice)` POST `/api/approval/respond`，body 是 `{session_id, choice, approval_id}`。审批监听优先开 `api/approval/stream?session_id=...` 的 EventSource，失败后回退到 HTTP polling。（来源：static/messages.js `_wireSSE`；static/messages.js `showApprovalCard/respondApproval/startApprovalPolling`） 技术定义：EventSource/SSE 是浏览器长连接；`stream_id` 是一次 Agent run 的观察句柄；`task_id=session_id` 是 WebUI 传给 Hermes Agent 的会话键；`HERMES_HOME` 是 profile/state 的根目录。"
  essential_design_difference: "这个项目最可复用的不是 UI 颜色，而是把“长时间运行的 CLI/Agent 进程”产品化时的边界处理。 - start/observe 分离的聊天协议；复制 `POST /api/chat/start` 返回 run/stream id、`GET /api/chat/stream` 观察事件的模式；事件至少区分 token、tool、approval、done、error。；如果你的 Agent 每次请求都能在几秒内同步返回，没必要引入 stream registry 和 reconnect 复杂度。；浏览器刷新、SSH tunnel 抖动、手机网络切换时，长任务不能只绑在一个 HTTP response 上。（来源：ARCHITECTURE.md 4.3；docs/rfcs/hermes-run-adapter-contract.md Event Envelope） - 审批卡片作为运行时控制面；把危险操作暴露为 pending approval 对象，前端显示 command/description/pattern_keys，响应 API 用 once/session/always/deny。；如果底层工具没有明确的风险分类和暂停机制，UI 卡片只是装饰。；Agent 工具执行需要人类可审计的中断点；Hermes WebUI 已把该中断点并入 SSE 和 fallback polling。（来源：ARCHITECTURE.md 4.5；TESTING.md Section 7；static/messages.js approval functions） - profile-scoped runtime env；在进入 Agent run 前显式设置 `HERMES_HOME`、`HERMES_SESSION_ID`、`HERMES_SESSION_PLATFORM`，并在 finally 恢复旧环境。；如果服务端是多进程/多租户硬隔离，优先用进程级隔离，不要共享 os.environ。；它让一个 WebUI 进程能切换不同 Hermes profile，但同时暴露全局环境变量并发风险。（来源：api/streaming.py env mutation；README Profiles） - 管理员控制的同源扩展面；只允许 `HERMES_WEBUI_EXTENSION_DIR` 下的 `/extensions/...` 或 `/static/...` 同源 URL 注入脚本/样式，拒绝 scheme、host、fragment、反斜杠和 path traversal。；面向不可信用户的 SaaS 不应给同源 JS 扩展权限。；本地/自托管产品常有内部 dashboard 需求；同源扩展能少改 core，但安全边界必须写清楚。（来源：docs/EXTENSIONS.md Configuration/URL rules/Trust model） - 工作区 Git 的只读默认 + 显式破坏性开关；默认只允许 status、branch、diff、fetch、commit-message suggestion；stage/commit/pull/push/checkout 要 `HERMES_WEBUI_WORKSPACE_GIT_DESTRUCTIVE=1`。；如果你的 WebUI 没有直接编辑仓库，不需要这套 Git mutation gate。；浏览器按钮触发 Git 命令等价于让 WebUI 进程用户执行本地代码路径，尤其 hooks 和 credential helper 风险需要显式化。（来源：docs/workspace-git.md）"
  practitioner_meaning: "建议：对 AI 工程师是 `clone-and-run`，但不是因为它是通用 Agent framework，而是因为它展示了一个自托管 Agent Web 工作台的真实工程做法：SSE 流、审批、profile/env 隔离、Docker 权限、onboarding、扩展、Git mutation gate、run journal/adapter migration。成熟度给 3，是因为仓库测试和部署面很重，但兼容性文档明确承认 WebUI 仍直接耦合 Hermes Agent 内部模块，older/newer 组合 unsupported。用于生产前，应先用隔离 `HERMES_HOME` 和 `HERMES_WEBUI_STATE_DIR` 跑通 onboarding，再决定是否接入真实 profile 和 workspace。（来源：README Quick start/Compatibility；docs/onboarding.md Re-running onboarding safely；docs/rfcs/agent-source-boundary.md）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "Hermes WebUI 是给 Hermes Agent 用的自托管浏览器工作台：用 Python 标准库 HTTP 服务和 vanilla JS，把聊天、会话、工作区文件、审批、任务、技能、记忆和多 profile 管理放到一个 Web UI 里。"
    body_md: "人话：它不是一个新的大模型框架，而是把已经安装在服务器上的 Hermes Agent 搬进浏览器和手机可访问的界面；官方 README 自称接近 “1:1 parity with Hermes CLI”，但仓库同时承认 WebUI 仍直接依赖 Hermes Agent 的 Python 内部模块和状态布局。（来源：README 顶部介绍；README Compatibility；docs/rfcs/agent-source-boundary.md）\n\n术语：vanilla JS 指不用 React/Vue 等前端框架；SSE 指浏览器通过 EventSource 接收服务端持续推送；profile 指 Hermes Agent 的一套配置、凭证、技能、记忆和状态目录。"
  why_worth_attention:
    summary: ""
    body_md: "值得看不是因为 README 写了很多功能，而是因为这个仓库把“本地/自托管 Agent 的 Web 工作台”做成了完整产品面：有真实的流式聊天链路、文件工作区、审批卡片、Docker 部署、onboarding、profile、扩展注入、Git 工作区控制和大量回归测试。它对 AI 工程师的价值主要在“如何把 CLI Agent 安全地包成 Web 产品”，不是在模型算法本身。（来源：README Features；ARCHITECTURE.md；docs/workspace-git.md；docs/EXTENSIONS.md）"
    bullets:
      - "已核实：后端入口是 `server.py` + `api/`，前端在 `static/`，README 明确说 “No build step, no framework, no bundler”；`package.json` 只有 dev-only ESLint 脚本 `lint:runtime`。（来源：README Architecture；package.json scripts）"
      - "已核实：浏览器聊天不是一次性 HTTP 返回，而是 `POST /api/chat/start` 返回 `stream_id`，再用 `GET /api/chat/stream`/EventSource 接收 token、tool、approval、done、error。（来源：ARCHITECTURE.md 4.3/6；static/messages.js chat start/EventSource）"
      - "已核实：Docker 既有单容器，也有 two-container 和 three-container；默认 WebUI 端口是 `8787`，单容器 compose 绑定 `127.0.0.1:8787:8787`。（来源：docker-compose.yml；README Docker）"
      - "已核实：仓库有 817 个 `tests/` 下文件，其中 813 个匹配 `test_*.py`；CI 矩阵跑 Python `3.11`、`3.12`、`3.13`，每个版本 3 个 shard。（来源：tests/ tree；.github/workflows/tests.yml）"
  key_claims_evidence:
    summary: ""
    body_md: "下面把 README/文档自称和从文件树、配置、代码中能核实的事实分开。竞品对比、平台数量、稳定性和“best/closest competitor”类说法只按自称处理。"
    items:
      - claim: "“No build step, no framework, no bundler. Just Python and vanilla JS.”"
        plain_english: "这个 WebUI 不需要前端构建链，开发依赖也没有承担运行时打包职责。"
        source: "README 顶部介绍；package.json scripts；pyproject.toml header"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`package.json` 描述为 dev-only tooling，唯一 script 是 `lint:runtime`；`pyproject.toml` 写明不是 packaged distribution、没有 `[build-system]`；运行依赖在 `requirements.txt` 只有 `pyyaml>=6.0` 和 `cryptography>=42.0`。"
        does_not_support: "不证明生产环境没有任何外部静态库；仓库 vendored 了 KaTeX、js-yaml 等静态资源。"
        threat: "如果未来引入构建链，此判断会失效；按 2026-06-08 checkout 核实。"
      - claim: "WebUI 提供接近 Hermes CLI 的浏览器体验。"
        plain_english: "浏览器里覆盖聊天、sessions、workspace、Tasks、Skills、Memory、Profiles、Todos、Spaces 等面板，但“1:1 parity”本身是项目自称。"
        source: "README 顶部介绍；README Features"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 逐项列出 Chat、Sessions、Workspace file browser、Voice input、Profiles、Authentication、Themes、Slash commands、Panels、Mobile responsive。"
        does_not_support: "没有在仓库内给出与 Hermes CLI 每个命令逐项通过的完整 parity 表。"
        threat: "Hermes Agent CLI 变化会让 WebUI parity 变动；README Compatibility 也要求 WebUI 与 hermes-agent 同步升级。"
      - claim: "聊天链路使用 start + stream 的 SSE 双端点。"
        plain_english: "用户发消息后，前端先 POST 开始任务，再打开 EventSource 监听流式事件。"
        source: "ARCHITECTURE.md 4.3 SSE Streaming Engine；ARCHITECTURE.md 6 Data Flow；api/routes.py `/api/chat/start` 与 `/api/chat/stream`；static/messages.js chat start/EventSource"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`_handle_chat_start` 校验 `session_id`、`message`、workspace、model/provider；`static/messages.js` 调用 `api('/api/chat/start', ...)` 后保存 `streamId`，再构造 `new EventSource('api/chat/stream?stream_id=...')`。"
        does_not_support: "未本地运行端到端聊天，因此不验证真实 provider 响应质量。"
        threat: "RuntimeAdapter/runner-local 迁移是进行中边界，未来 hot path 可能变化。"
      - claim: "危险 shell 命令有审批卡片。"
        plain_english: "Agent 请求危险操作时，浏览器显示命令和 allow once/session/always/deny 类交互。"
        source: "TESTING.md Section 7 Tool Approval；static/messages.js showApprovalCard/respondApproval/startApprovalPolling；ARCHITECTURE.md 4.5 Approval System Integration"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "TESTING.md 的例子要求输入 `Run the command: rm -rf /tmp/hermes_test_delete_me`；前端 `respondApproval(choice)` POST 到 `/api/approval/respond`，`startApprovalPolling` 优先用 `/api/approval/stream?session_id=...` SSE，失败后回退轮询。"
        does_not_support: "不证明所有危险工具调用都能被识别；识别逻辑在 Hermes Agent 的 `tools/approval.py`，不是本仓库完全拥有。"
        threat: "审批状态依赖 Hermes Agent 模块级状态；跨进程或 import reload 会破坏 ARCHITECTURE.md 所描述的共享状态前提。"
      - claim: "支持 Docker 单容器和多容器部署。"
        plain_english: "仓库提供三个 compose 形态：WebUI 内跑 agent、agent+WebUI 分离、agent+dashboard+WebUI。"
        source: "README Docker；docker-compose.yml；docker-compose.two-container.yml；Dockerfile"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`docker-compose.yml` 默认 `127.0.0.1:8787:8787`，挂载 `${HERMES_HOME:-${HOME}/.hermes}` 和 `${HERMES_WORKSPACE:-${HOME}/workspace}`；two-container 使用 `nousresearch/hermes-agent:latest` 和 `ghcr.io/nesquena/hermes-webui:latest`，共享 named volumes。"
        does_not_support: "未证明所有平台上的容器权限问题都已解决；README 仍列出 UID/GID、Podman、localhost、source mount 等失败模式。"
        threat: "two-container 文档明确限制：WebUI 触发的 tools 在 WebUI container 运行，不在 agent container 运行。"
      - claim: "WebUI 与 Hermes Agent 仍有内部源码耦合。"
        plain_english: "这个 WebUI 不是只调用稳定 HTTP API；它会 import Agent Python 模块、读 Agent state.db/schema 和配置。"
        source: "README Compatibility；docs/rfcs/agent-source-boundary.md Source-access inventory；api/streaming.py imports/use of AIAgent"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "RFC 列出 Browser chat execution 依赖 `run_agent.AIAgent`，Provider/auth/model catalogs 依赖 `hermes_cli.models`、`hermes_cli.auth`、`agent.credential_pool`，CLI/Gateway session bridge 读 Agent `state.db` schema。"
        does_not_support: "不代表项目不可用；它代表版本 skew 风险较高。"
        threat: "README 明确说 older/newer pinned combinations 在稳定 API boundary 完成前 untested and unsupported。"
      - claim: "测试规模很大。"
        plain_english: "README 自称约 7,150 tests collected、约 700 test files；实际 checkout 文件树中测试文件更多。"
        source: "README Running tests；TESTING.md 顶部；tests/ tree；.github/workflows/tests.yml"
        attribution: "已核实"
        evidence_strength: "medium"
        supports: "README/TESTING.md 自称 `~7,150 tests collected`；本次 checkout 计数 `tests/` 下 817 个文件、813 个 `test_*.py`；CI 配置 Python 3.11/3.12/3.13 × 3 shards。"
        does_not_support: "未运行 `pytest --collect-only`，因此不把 7,150 当本次实测精确值。"
        threat: "测试数量会随提交变化；README 的 `~` 是近似数。"
  how_it_works:
    summary: ""
    body_md: "真实流程示例：用户在浏览器 composer 里按发送。前端 `static/messages.js` 先把 user message 乐观插入 `S.messages`，上传附件时调用 `uploadPendingFiles()`；如果只有附件，会把消息文本构造成 `I've uploaded N file(s): ...`，如果有正文则追加 `[Attached files: ...]`。随后它 POST `/api/chat/start`，body 里包含 `session_id`、`message`、`model`、`workspace`、`model_provider`、`profile`、`explicit_model_pick` 和 `attachments`。（来源：static/messages.js send flow）\n\n后端 `api/routes.py` 的 `_handle_chat_start` 先 `require(body, \"session_id\")`，找 session，校验 profile id，要求 `message` 非空，最多取 20 个 attachments，然后解析 workspace/model/provider。普通 legacy 路径会进入 `_start_chat_stream_for_session`，生成 stream，浏览器拿到 `stream_id`。（来源：api/routes.py `_handle_chat_start`）\n\n流式部分由 `api/streaming.py` 执行。worker 注册 active run，创建 cancel event，把 `CANCEL_FLAGS[stream_id]`、`STREAM_PARTIAL_TEXT[stream_id]`、`STREAM_REASONING_TEXT[stream_id]`、`STREAM_LIVE_TOOL_CALLS[stream_id]` 放进全局表。跑 Agent 前，它设置线程/进程环境：`TERMINAL_CWD=str(s.workspace)`、`HERMES_EXEC_ASK=1`、`HERMES_SESSION_KEY=session_id`、`HERMES_SESSION_ID=session_id`、`HERMES_SESSION_PLATFORM=webui`；如果有 profile home，还临时设置 `HERMES_HOME`。然后按 Hermes Agent 的签名创建或复用 `AIAgent`，最终调用 `agent.run_conversation(user_message=..., system_message=..., conversation_history=..., task_id=session_id, persist_user_message=msg_text)`。（来源：api/streaming.py `_run_agent_streaming` env mutation and run_conversation）\n\n浏览器侧对 SSE 做事件分发：`token` 追加到 assistantText 并节流渲染 markdown；`approval` 调用 `showApprovalCard`；用户点审批按钮时 `respondApproval(choice)` POST `/api/approval/respond`，body 是 `{session_id, choice, approval_id}`。审批监听优先开 `api/approval/stream?session_id=...` 的 EventSource，失败后回退到 HTTP polling。（来源：static/messages.js `_wireSSE`；static/messages.js `showApprovalCard/respondApproval/startApprovalPolling`）\n\n技术定义：EventSource/SSE 是浏览器长连接；`stream_id` 是一次 Agent run 的观察句柄；`task_id=session_id` 是 WebUI 传给 Hermes Agent 的会话键；`HERMES_HOME` 是 profile/state 的根目录。"
  reusable_abstractions:
    summary: ""
    body_md: "这个项目最可复用的不是 UI 颜色，而是把“长时间运行的 CLI/Agent 进程”产品化时的边界处理。"
    items:
      - name: "start/observe 分离的聊天协议"
        copy: "复制 `POST /api/chat/start` 返回 run/stream id、`GET /api/chat/stream` 观察事件的模式；事件至少区分 token、tool、approval、done、error。"
        skip: "如果你的 Agent 每次请求都能在几秒内同步返回，没必要引入 stream registry 和 reconnect 复杂度。"
        why_it_matters: "浏览器刷新、SSH tunnel 抖动、手机网络切换时，长任务不能只绑在一个 HTTP response 上。（来源：ARCHITECTURE.md 4.3；docs/rfcs/hermes-run-adapter-contract.md Event Envelope）"
      - name: "审批卡片作为运行时控制面"
        copy: "把危险操作暴露为 pending approval 对象，前端显示 command/description/pattern_keys，响应 API 用 once/session/always/deny。"
        skip: "如果底层工具没有明确的风险分类和暂停机制，UI 卡片只是装饰。"
        why_it_matters: "Agent 工具执行需要人类可审计的中断点；Hermes WebUI 已把该中断点并入 SSE 和 fallback polling。（来源：ARCHITECTURE.md 4.5；TESTING.md Section 7；static/messages.js approval functions）"
      - name: "profile-scoped runtime env"
        copy: "在进入 Agent run 前显式设置 `HERMES_HOME`、`HERMES_SESSION_ID`、`HERMES_SESSION_PLATFORM`，并在 finally 恢复旧环境。"
        skip: "如果服务端是多进程/多租户硬隔离，优先用进程级隔离，不要共享 os.environ。"
        why_it_matters: "它让一个 WebUI 进程能切换不同 Hermes profile，但同时暴露全局环境变量并发风险。（来源：api/streaming.py env mutation；README Profiles）"
      - name: "管理员控制的同源扩展面"
        copy: "只允许 `HERMES_WEBUI_EXTENSION_DIR` 下的 `/extensions/...` 或 `/static/...` 同源 URL 注入脚本/样式，拒绝 scheme、host、fragment、反斜杠和 path traversal。"
        skip: "面向不可信用户的 SaaS 不应给同源 JS 扩展权限。"
        why_it_matters: "本地/自托管产品常有内部 dashboard 需求；同源扩展能少改 core，但安全边界必须写清楚。（来源：docs/EXTENSIONS.md Configuration/URL rules/Trust model）"
      - name: "工作区 Git 的只读默认 + 显式破坏性开关"
        copy: "默认只允许 status、branch、diff、fetch、commit-message suggestion；stage/commit/pull/push/checkout 要 `HERMES_WEBUI_WORKSPACE_GIT_DESTRUCTIVE=1`。"
        skip: "如果你的 WebUI 没有直接编辑仓库，不需要这套 Git mutation gate。"
        why_it_matters: "浏览器按钮触发 Git 命令等价于让 WebUI 进程用户执行本地代码路径，尤其 hooks 和 credential helper 风险需要显式化。（来源：docs/workspace-git.md）"
  dependency_platform_risk:
    summary: ""
    body_md: "主要风险不是 Python/JS 技术栈本身，而是 WebUI 仍包在 Hermes Agent 内部实现上。仓库自己把这点写成兼容性和 source-boundary RFC。"
    items:
      - dependency: "Hermes Agent Python internals：`run_agent.AIAgent`、`hermes_cli.*`、Agent `state.db` schema"
        what_if_change: "Agent 改模块名、构造参数、配置/状态 schema 后，WebUI 的聊天、profile、model catalog、CLI session bridge 会坏。"
        exposure: "high"
        mitigation_or_unknown: "README 要求 WebUI 和 hermes-agent 同 release train/date 升级；RFC 提出未来用 versioned Agent API/RuntimeAdapter，但状态仍是 Proposed/迁移中。"
        source: "README Compatibility；docs/rfcs/agent-source-boundary.md"
      - dependency: "Process-local stream state：`STREAMS`、`CANCEL_FLAGS`、`AGENT_INSTANCES`、`ACTIVE_RUNS`"
        what_if_change: "WebUI 进程重启或多进程部署会丢失当前 run 的内存状态，影响 reconnect/cancel/approval。"
        exposure: "medium"
        mitigation_or_unknown: "Run journal/RFC 在做 replay 和 adapter seam；但 RFC 明确当前 browser-originated chat 仍在 WebUI server process 执行。"
        source: "api/config.py stream globals；docs/rfcs/hermes-run-adapter-contract.md Problem/Current Gate State"
      - dependency: "Docker volume、UID/GID、agent source mount"
        what_if_change: "挂载权限不对会导致 `.hermes`、workspace、credential 文件不可读；two-container 下 tool 运行在 WebUI container 而非 agent container。"
        exposure: "medium"
        mitigation_or_unknown: "compose 提供 `WANTED_UID`/`WANTED_GID`、named volumes、read-only `hermes-agent-src`；README 和 docs/docker.md 列失败模式。"
        source: "docker-compose.yml；docker-compose.two-container.yml；README Docker Common failure modes"
      - dependency: "浏览器同源扩展注入"
        what_if_change: "被注入 JS 可调用登录用户能调用的所有 WebUI API，包括读会话、发消息、改设置、触发工具。"
        exposure: "medium"
        mitigation_or_unknown: "默认关闭；只允许同源 `/extensions/` 或 `/static/` URL；文档要求不要指向 user-writable directory。"
        source: "docs/EXTENSIONS.md Trust model/URL rules"
      - dependency: "Workspace Git destructive actions"
        what_if_change: "启用后浏览器动作可以 stage/commit/pull/push/checkout，并可能触发 Git hooks。"
        exposure: "high"
        mitigation_or_unknown: "默认关闭，需 `HERMES_WEBUI_WORKSPACE_GIT_DESTRUCTIVE=1`；git subprocess 使用 `shell=False`，清理 Git 环境变量，mutating action 遇 active stream 会拒绝。"
        source: "docs/workspace-git.md"
      - dependency: "Model provider/API key/local model Base URL"
        what_if_change: "provider 未配置、Docker 中误用 localhost、API key 缺失或模型列表探测失败，会导致 onboarding 或聊天不可用。"
        exposure: "high"
        mitigation_or_unknown: "onboarding wizard 写 `config.yaml`、`.env`，并探测 `<base-url>/models`；Docker 本机服务建议 `host.docker.internal` 或 `api.local:host-gateway`。"
        source: "docs/onboarding.md Choosing a provider/Base URL rules"
  unknowns_to_confirm:
    summary: ""
    body_md: "以下不从 README/docs/tree 推断，必须运行或查外部项目才能确认。"
    items:
      - "未本地运行 `python3 bootstrap.py` 或 `docker compose up -d`，因此没有验证当前机器上 Hermes Agent/provider/onboarding 是否能完整启动。"
      - "未运行 `pytest --collect-only`，README 的 `~7,150 tests collected` 只按自称记录；本次只核实文件树中 817 个 `tests/` 文件和 CI 配置。"
      - "未独立核验 OpenClaw、Claude Code、OpenCode、Cursor 的当前能力；comparison 中竞品能力按本仓库 `docs/why-hermes.md` 自称/对比处理。"
      - "未核实 GHCR 镜像是否可拉取、multi-arch manifest 是否包含 amd64 + arm64；README 自称每个 release 发布预构建镜像。"
      - "Hermes Agent 的 `tools/approval.py`、`run_agent.AIAgent`、`hermes_cli.*` 不在本仓库内完整实现，内部行为和兼容性需要到 Hermes Agent 仓库确认。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 5
      工程深度: 4
      复用价值: 4
      成熟度: 3
    body_md: "建议：对 AI 工程师是 `clone-and-run`，但不是因为它是通用 Agent framework，而是因为它展示了一个自托管 Agent Web 工作台的真实工程做法：SSE 流、审批、profile/env 隔离、Docker 权限、onboarding、扩展、Git mutation gate、run journal/adapter migration。成熟度给 3，是因为仓库测试和部署面很重，但兼容性文档明确承认 WebUI 仍直接耦合 Hermes Agent 内部模块，older/newer 组合 unsupported。用于生产前，应先用隔离 `HERMES_HOME` 和 `HERMES_WEBUI_STATE_DIR` 跑通 onboarding，再决定是否接入真实 profile 和 workspace。（来源：README Quick start/Compatibility；docs/onboarding.md Re-running onboarding safely；docs/rfcs/agent-source-boundary.md）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\nesquena-hermes-webui\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\nesquena-hermes-webui\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\nesquena-hermes-webui\\codex-last-message.json"
  invoked_at: "2026-06-08T14:42:53.667Z"
  completed_at: "2026-06-08T14:46:40.048Z"
  repo: "nesquena/hermes-webui"
reasoning_trace:
  paper_type_decision: "project_type = ai_app; evidence from README/artifactAudit only."
  central_contribution: "Hermes WebUI: The best way to use Hermes Agent from the web or from your phone!"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "“No build step, no framework, no bundler. Just Python and vanilla JS.”"
    - "WebUI 提供接近 Hermes CLI 的浏览器体验。"
    - "聊天链路使用 start + stream 的 SSE 双端点。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "README Compatibility；docs/rfcs/agent-source-boundary.md"
    - "api/config.py stream globals；docs/rfcs/hermes-run-adapter-contract.md Problem/Current Gate State"
    - "docker-compose.yml；docker-compose.two-container.yml；README Docker Common failure modes"
    - "docs/EXTENSIONS.md Trust model/URL rules"
    - "docs/workspace-git.md"
    - "docs/onboarding.md Choosing a provider/Base URL rules"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 4
  maturity: 3
  main_risk: "建议：对 AI 工程师是 `clone-and-run`，但不是因为它是通用 Agent framework，而是因为它展示了一个自托管 Agent Web 工作台的真实工程做法：SSE 流、审批、profile/env 隔离、Docker 权限、onboarding、扩展、Git mutation gate、run journal/adapter migration。成熟度给 3，是因为仓库测试和部署面很重，但兼容性文档明确承认 WebUI 仍直接耦合 Hermes Agent 内部模块，older/newer 组合 unsupported。用于生产前，应先用隔离 `HERMES_HOME` 和 `HERMES_WEBUI_STATE_DIR` 跑通 onboarding，再决定是否接入真实 profile 和 workspace。（来源：README Quick start/Compatibility；docs/onboarding.md Re-running onboarding safely；docs/rfcs/agent-source-boundary.md）"
next_actions:
  - "clone-and-run"
unknowns:
  - "未本地运行 `python3 bootstrap.py` 或 `docker compose up -d`，因此没有验证当前机器上 Hermes Agent/provider/onboarding 是否能完整启动。"
  - "未运行 `pytest --collect-only`，README 的 `~7,150 tests collected` 只按自称记录；本次只核实文件树中 817 个 `tests/` 文件和 CI 配置。"
  - "未独立核验 OpenClaw、Claude Code、OpenCode、Cursor 的当前能力；comparison 中竞品能力按本仓库 `docs/why-hermes.md` 自称/对比处理。"
  - "未核实 GHCR 镜像是否可拉取、multi-arch manifest 是否包含 amd64 + arm64；README 自称每个 release 发布预构建镜像。"
  - "Hermes Agent 的 `tools/approval.py`、`run_agent.AIAgent`、`hermes_cli.*` 不在本仓库内完整实现，内部行为和兼容性需要到 Hermes Agent 仓库确认。"
builder_reuse:
  pattern: "start/observe 分离的聊天协议"
  copy: "复制 `POST /api/chat/start` 返回 run/stream id、`GET /api/chat/stream` 观察事件的模式；事件至少区分 token、tool、approval、done、error。"
  skip: "如果你的 Agent 每次请求都能在几秒内同步返回，没必要引入 stream registry 和 reconnect 复杂度。"
  why_it_matters: "浏览器刷新、SSH tunnel 抖动、手机网络切换时，长任务不能只绑在一个 HTTP response 上。（来源：ARCHITECTURE.md 4.3；docs/rfcs/hermes-run-adapter-contract.md Event Envelope）"
dependency_platform_risk:
  dependency: "Hermes Agent Python internals：`run_agent.AIAgent`、`hermes_cli.*`、Agent `state.db` schema"
  what_if_change: "Agent 改模块名、构造参数、配置/状态 schema 后，WebUI 的聊天、profile、model catalog、CLI session bridge 会坏。"
  exposure: "high"
  mitigation_or_unknown: "README 要求 WebUI 和 hermes-agent 同 release train/date 升级；RFC 提出未来用 versioned Agent API/RuntimeAdapter，但状态仍是 Proposed/迁移中。"
claim_ledger:
  - claim: "“No build step, no framework, no bundler. Just Python and vanilla JS.”"
    plain_english: "这个 WebUI 不需要前端构建链，开发依赖也没有承担运行时打包职责。"
    source: "README 顶部介绍；package.json scripts；pyproject.toml header"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`package.json` 描述为 dev-only tooling，唯一 script 是 `lint:runtime`；`pyproject.toml` 写明不是 packaged distribution、没有 `[build-system]`；运行依赖在 `requirements.txt` 只有 `pyyaml>=6.0` 和 `cryptography>=42.0`。"
    does_not_support: "不证明生产环境没有任何外部静态库；仓库 vendored 了 KaTeX、js-yaml 等静态资源。"
    threat: "如果未来引入构建链，此判断会失效；按 2026-06-08 checkout 核实。"
  - claim: "WebUI 提供接近 Hermes CLI 的浏览器体验。"
    plain_english: "浏览器里覆盖聊天、sessions、workspace、Tasks、Skills、Memory、Profiles、Todos、Spaces 等面板，但“1:1 parity”本身是项目自称。"
    source: "README 顶部介绍；README Features"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 逐项列出 Chat、Sessions、Workspace file browser、Voice input、Profiles、Authentication、Themes、Slash commands、Panels、Mobile responsive。"
    does_not_support: "没有在仓库内给出与 Hermes CLI 每个命令逐项通过的完整 parity 表。"
    threat: "Hermes Agent CLI 变化会让 WebUI parity 变动；README Compatibility 也要求 WebUI 与 hermes-agent 同步升级。"
  - claim: "聊天链路使用 start + stream 的 SSE 双端点。"
    plain_english: "用户发消息后，前端先 POST 开始任务，再打开 EventSource 监听流式事件。"
    source: "ARCHITECTURE.md 4.3 SSE Streaming Engine；ARCHITECTURE.md 6 Data Flow；api/routes.py `/api/chat/start` 与 `/api/chat/stream`；static/messages.js chat start/EventSource"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`_handle_chat_start` 校验 `session_id`、`message`、workspace、model/provider；`static/messages.js` 调用 `api('/api/chat/start', ...)` 后保存 `streamId`，再构造 `new EventSource('api/chat/stream?stream_id=...')`。"
    does_not_support: "未本地运行端到端聊天，因此不验证真实 provider 响应质量。"
    threat: "RuntimeAdapter/runner-local 迁移是进行中边界，未来 hot path 可能变化。"
  - claim: "危险 shell 命令有审批卡片。"
    plain_english: "Agent 请求危险操作时，浏览器显示命令和 allow once/session/always/deny 类交互。"
    source: "TESTING.md Section 7 Tool Approval；static/messages.js showApprovalCard/respondApproval/startApprovalPolling；ARCHITECTURE.md 4.5 Approval System Integration"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "TESTING.md 的例子要求输入 `Run the command: rm -rf /tmp/hermes_test_delete_me`；前端 `respondApproval(choice)` POST 到 `/api/approval/respond`，`startApprovalPolling` 优先用 `/api/approval/stream?session_id=...` SSE，失败后回退轮询。"
    does_not_support: "不证明所有危险工具调用都能被识别；识别逻辑在 Hermes Agent 的 `tools/approval.py`，不是本仓库完全拥有。"
    threat: "审批状态依赖 Hermes Agent 模块级状态；跨进程或 import reload 会破坏 ARCHITECTURE.md 所描述的共享状态前提。"
  - claim: "支持 Docker 单容器和多容器部署。"
    plain_english: "仓库提供三个 compose 形态：WebUI 内跑 agent、agent+WebUI 分离、agent+dashboard+WebUI。"
    source: "README Docker；docker-compose.yml；docker-compose.two-container.yml；Dockerfile"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`docker-compose.yml` 默认 `127.0.0.1:8787:8787`，挂载 `${HERMES_HOME:-${HOME}/.hermes}` 和 `${HERMES_WORKSPACE:-${HOME}/workspace}`；two-container 使用 `nousresearch/hermes-agent:latest` 和 `ghcr.io/nesquena/hermes-webui:latest`，共享 named volumes。"
    does_not_support: "未证明所有平台上的容器权限问题都已解决；README 仍列出 UID/GID、Podman、localhost、source mount 等失败模式。"
    threat: "two-container 文档明确限制：WebUI 触发的 tools 在 WebUI container 运行，不在 agent container 运行。"
  - claim: "WebUI 与 Hermes Agent 仍有内部源码耦合。"
    plain_english: "这个 WebUI 不是只调用稳定 HTTP API；它会 import Agent Python 模块、读 Agent state.db/schema 和配置。"
    source: "README Compatibility；docs/rfcs/agent-source-boundary.md Source-access inventory；api/streaming.py imports/use of AIAgent"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "RFC 列出 Browser chat execution 依赖 `run_agent.AIAgent`，Provider/auth/model catalogs 依赖 `hermes_cli.models`、`hermes_cli.auth`、`agent.credential_pool`，CLI/Gateway session bridge 读 Agent `state.db` schema。"
    does_not_support: "不代表项目不可用；它代表版本 skew 风险较高。"
    threat: "README 明确说 older/newer pinned combinations 在稳定 API boundary 完成前 untested and unsupported。"
artifact_audit:
  official_repo: "https://github.com/nesquena/hermes-webui"
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
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

nesquena/hermes-webui：GitHub 描述为“Hermes WebUI: The best way to use Hermes Agent from the web or from your phone”。

（来源：README/artifactAudit）

## 干什么

Hermes WebUI: The best way to use Hermes Agent from the web or from your phone!

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 13589 |
| stars_in_period | 4424 |
| author | nesquena |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- skills（来源：数据不足）
- models（来源：数据不足）

## 解决什么痛点

值得看不是因为 README 写了很多功能，而是因为这个仓库把“本地/自托管 Agent 的 Web 工作台”做成了完整产品面：有真实的流式聊天链路、文件工作区、审批卡片、Docker 部署、onboarding、profile、扩展注入、Git 工作区控制和大量回归测试。它对 AI 工程师的价值主要在“如何把 CLI Agent 安全地包成 Web 产品”，不是在模型算法本身。（来源：README Features；ARCHITECTURE.md；docs/workspace-git.md；docs/EXTENSIONS.md）

## 核心能力

- start/observe 分离的聊天协议（来源：数据不足）
- 审批卡片作为运行时控制面（来源：数据不足）
- profile-scoped runtime env（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

未联网核验竞品当前能力；以下竞品信息只按本仓库 `README` 和 `docs/why-hermes.md` 的自称/对比使用。 OpenClaw：本仓库文档称 OpenClaw 是最直接对比，二者都是 always-on/self-hosted/open-source agents，有 memory、cron、messaging。差异维度是架构和技能路径：文档称 OpenClaw 是 Node.js/TypeScript Gateway control plane，技能偏 marketplace；Hermes 是 Python，强调 self-improving skills，并由 WebUI 包成浏览器工作台。做 AI 应用时，如果你要 Python/ML 生态、Hermes Agent 记忆/cron/profile 这套，选 Hermes WebUI；如果你更看重文档自称的更广 messaging 覆盖或 ClawHub/Marketplace 工作流，应评估 OpenClaw。（来源：README Why Hermes；docs/why-hermes.md vs. OpenClaw；竞品能力未独立核验） Claude Code：本仓库文档把 Claude Code 定位为强代码 Agent，但不是 Hermes 这种 self-hosted persistent agent 工作台；README 表里写 Claude Code provider-agnostic 为 No、self-hosted scheduled jobs 为 No/云或桌面路径。做 AI 应用时，如果需求是单人/团队代码编辑与 Anthropic 官方生态，Claude Code 更直接；如果需求是把一个常驻服务器 Agent 暴露到浏览器、手机、cron、workspace 和 profile，Hermes WebUI 更贴近。（来源：README comparison table；docs/why-hermes.md vs. Claude Code；竞品能力未独立核验） OpenCode：本仓库文档称 OpenCode 是开源 TUI coding assistant，支持 WebUI、AGENTS.md/CLAUDE.md 类上下文，但 scheduled jobs 为 No 或 community plugin，persistent memory 为 Partial。做 AI 应用时，如果你要的是终端 coding assistant 和多 provider coding workflow，OpenCode 更轻；如果你要浏览器里管理 Hermes Agent 的记忆、任务、技能、profile、workspace 文件和审批链路，Hermes WebUI 更像完整控制台。（来源：docs/why-hermes.md vs. OpenCode；竞品能力未独立核验）

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

真实流程示例：用户在浏览器 composer 里按发送。前端 `static/messages.js` 先把 user message 乐观插入 `S.messages`，上传附件时调用 `uploadPendingFiles()`；如果只有附件，会把消息文本构造成 `I've uploaded N file(s): ...`，如果有正文则追加 `[Attached files: ...]`。随后它 POST `/api/chat/start`，body 里包含 `session_id`、`message`、`model`、`workspace`、`model_provider`、`profile`、`explicit_model_pick` 和 `attachments`。（来源：static/messages.js send flow） 后端 `api/routes.py` 的 `_handle_chat_start` 先 `require(body, "session_id")`，找 session，校验 profile id，要求 `message` 非空，最多取 20 个 attachments，然后解析 workspace/model/provider。普通 legacy 路径会进入 `_start_chat_stream_for_session`，生成 stream，浏览器拿到 `stream_id`。（来源：api/routes.py `_handle_chat_start`） 流式部分由 `api/streaming.py` 执行。worker 注册 active run，创建 cancel event，把 `CANCEL_FLAGS[stream_id]`、`STREAM_PARTIAL_TEXT[stream_id]`、`STREAM_REASONING_TEXT[stream_id]`、`STREAM_LIVE_TOOL_CALLS[stream_id]` 放进全局表。跑 Agent 前，它设置线程/进程环境：`TERMINAL_CWD=str(s.workspace)`、`HERMES_EXEC_ASK=1`、`HERMES_SESSION_KEY=session_id`、`HERMES_SESSION_ID=session_id`、`HERMES_SESSION_PLATFORM=webui`；如果有 profile home，还临时设置 `HERMES_HOME`。然后按 Hermes Agent 的签名创建或复用 `AIAgent`，最终调用 `agent.run_conversation(user_message=..., system_message=..., conversation_history=..., task_id=session_id, persist_user_message=msg_text)`。（来源：api/streaming.py `_run_agent_streaming` env mutation and run_conversation） 浏览器侧对 SSE 做事件分发：`token` 追加到 assistantText 并节流渲染 markdown；`approval` 调用 `showApprovalCard`；用户点审批按钮时 `respondApproval(choice)` POST `/api/approval/respond`，body 是 `{session_id, choice, approval_id}`。审批监听优先开 `api/approval/stream?session_id=...` 的 EventSource，失败后回退到 HTTP polling。（来源：static/messages.js `_wireSSE`；static/messages.js `showApprovalCard/respondApproval/startApprovalPolling`） 技术定义：EventSource/SSE 是浏览器长连接；`stream_id` 是一次 Agent run 的观察句柄；`task_id=session_id` 是 WebUI 传给 Hermes Agent 的会话键；`HERMES_HOME` 是 profile/state 的根目录。

## 本质不同的设计取舍

这个项目最可复用的不是 UI 颜色，而是把“长时间运行的 CLI/Agent 进程”产品化时的边界处理。 - start/observe 分离的聊天协议；复制 `POST /api/chat/start` 返回 run/stream id、`GET /api/chat/stream` 观察事件的模式；事件至少区分 token、tool、approval、done、error。；如果你的 Agent 每次请求都能在几秒内同步返回，没必要引入 stream registry 和 reconnect 复杂度。；浏览器刷新、SSH tunnel 抖动、手机网络切换时，长任务不能只绑在一个 HTTP response 上。（来源：ARCHITECTURE.md 4.3；docs/rfcs/hermes-run-adapter-contract.md Event Envelope） - 审批卡片作为运行时控制面；把危险操作暴露为 pending approval 对象，前端显示 command/description/pattern_keys，响应 API 用 once/session/always/deny。；如果底层工具没有明确的风险分类和暂停机制，UI 卡片只是装饰。；Agent 工具执行需要人类可审计的中断点；Hermes WebUI 已把该中断点并入 SSE 和 fallback polling。（来源：ARCHITECTURE.md 4.5；TESTING.md Section 7；static/messages.js approval functions） - profile-scoped runtime env；在进入 Agent run 前显式设置 `HERMES_HOME`、`HERMES_SESSION_ID`、`HERMES_SESSION_PLATFORM`，并在 finally 恢复旧环境。；如果服务端是多进程/多租户硬隔离，优先用进程级隔离，不要共享 os.environ。；它让一个 WebUI 进程能切换不同 Hermes profile，但同时暴露全局环境变量并发风险。（来源：api/streaming.py env mutation；README Profiles） - 管理员控制的同源扩展面；只允许 `HERMES_WEBUI_EXTENSION_DIR` 下的 `/extensions/...` 或 `/static/...` 同源 URL 注入脚本/样式，拒绝 scheme、host、fragment、反斜杠和 path traversal。；面向不可信用户的 SaaS 不应给同源 JS 扩展权限。；本地/自托管产品常有内部 dashboard 需求；同源扩展能少改 core，但安全边界必须写清楚。（来源：docs/EXTENSIONS.md Configuration/URL rules/Trust model） - 工作区 Git 的只读默认 + 显式破坏性开关；默认只允许 status、branch、diff、fetch、commit-message suggestion；stage/commit/pull/push/checkout 要 `HERMES_WEBUI_WORKSPACE_GIT_DESTRUCTIVE=1`。；如果你的 WebUI 没有直接编辑仓库，不需要这套 Git mutation gate。；浏览器按钮触发 Git 命令等价于让 WebUI 进程用户执行本地代码路径，尤其 hooks 和 credential helper 风险需要显式化。（来源：docs/workspace-git.md）

## 对从业者意味着什么

建议：对 AI 工程师是 `clone-and-run`，但不是因为它是通用 Agent framework，而是因为它展示了一个自托管 Agent Web 工作台的真实工程做法：SSE 流、审批、profile/env 隔离、Docker 权限、onboarding、扩展、Git mutation gate、run journal/adapter migration。成熟度给 3，是因为仓库测试和部署面很重，但兼容性文档明确承认 WebUI 仍直接耦合 Hermes Agent 内部模块，older/newer 组合 unsupported。用于生产前，应先用隔离 `HERMES_HOME` 和 `HERMES_WEBUI_STATE_DIR` 跑通 onboarding，再决定是否接入真实 profile 和 workspace。（来源：README Quick start/Compatibility；docs/onboarding.md Re-running onboarding safely；docs/rfcs/agent-source-boundary.md）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/sse-chat-stream]]、[[concepts/agent-source-boundary]]。另见 [[content/nesquena-hermes-webui]]、[[claims/nesquena-hermes-webui-main-claim]]。
