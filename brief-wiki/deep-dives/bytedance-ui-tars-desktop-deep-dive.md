---
content: "bytedance-ui-tars-desktop"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "UI-TARS-desktop — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "bytedance/UI-TARS-desktop：开源多模态 AI Agent 技术栈，用于连接前沿 AI 模型和 Agent 基础设施。"
  what_it_does: "The Open-Source Multimodal AI Agent Stack: Connecting Cutting-Edge AI Models and Agent Infra"
  metadata:
    language: "TypeScript"
    total_stars: "36148"
    stars_in_period: "6653"
    author: "bytedance"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "人话：值得看的是它把“GUI agent”拆成了可替换部件，而不是只给一个演示视频。技术上：UI-TARS SDK 有 `GUIAgent`、`UITarsModel`、`Operator`、`action-parser`；Agent TARS 则把浏览器、文件系统、命令和自定义 MCP Server 接到 Tarko Agent 循环里。"
  core_capabilities:
    - "Operator 接口"
    - "Action grammar + parser"
    - "MCP transport adapter"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向判断：UI-TARS-desktop 更像“开源可改的 GUI Agent 工程栈”，不是纯 SaaS computer-use API，也不是纯浏览器测试框架。 与 OpenAI Computer Use 相比：OpenAI 官方文档要求用 `computer-use-preview` 模型配 `computer_use_preview` tool，属于 OpenAI Responses/API 生态的托管工具路径（外部来源：https://platform.openai.com/docs/guides/tools-computer-use）。选 OpenAI：你已经在 OpenAI 平台、想少维护本机 operator。选 UI-TARS：你要自己掌控 Electron/TypeScript 源码、使用 UI-TARS/Doubao/Hugging Face OpenAI-compatible VLM endpoint、或要把 MCP/browser/filesystem/commands 改进到自己的 Agent 栈。OpenAI 能力按官方文档自称，本文未实测。 与 Anthropic Computer Use 相比：Anthropic 官方 docs 描述 Claude API 返回 `tool_use`，开发者要提供 Anthropic-schema computer-use tool 实现和 agent loop（外部来源：https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool）。选 Anthropic：你以 Claude 模型和 Anthropic 工具协议为中心。选 UI-TARS：你要模型可换、operator 可换、并希望把 browser/filesystem/commands MCP server 作为同一套工具层来管理。Anthropic 能力按官方文档自称，本文未实测。 与 browser-use 相比：browser-use 官方 GitHub 定位是让网站可被 AI agents 访问、偏 Python/browser automation（外部来源：https://github.com/browser-use/browser-use）。选 browser-use：任务集中在网页、Python 生态、无需桌面应用控制。选 UI-TARS：任务跨本机桌面、浏览器、Android/ADB、Agent TARS MCP 工具，且需要 TypeScript monorepo。browser-use 能力按其 README/仓库自称，本文未克隆实测。 与 Playwright 相比：Playwright 官方文档定位为 Chromium/Firefox/WebKit 单 API 自动化，`npx playwright install` 安装浏览器，偏确定性测试/脚本（外部来源：https://playwright.dev/docs/browsers）。选 Playwright：页面结构已知、断言明确、要稳定 CI。选 UI-TARS：任务是自然语言、视觉定位、未知 UI；代价是模型调用、截图、解析和权限风险更高。Playwright 能力按官方文档自称，本文未实测。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话：最小链路可以从 CLI 跑起来：`npx @ui-tars/cli start`（文档写法），CLI 先拿模型配置，再让你选 `nut-js` 或 `adb`，最后把自然语言任务交给 GUIAgent。技术上：`packages/ui-tars/cli/src/cli/start.ts` 会读 `~/.ui-tars-cli.json`；如果传 `--presets`，它 fetch YAML 并读取 `vlmApiKey`、`vlmBaseUrl`、`vlmModelName`、`useResponsesApi`；没有配置就用 `@clack/prompts` 询问 `baseURL/apiKey/model`，并写回 `~/.ui-tars-cli.json`。随后它选择 operator：`adb` 会 `getAndroidDeviceId()` 后 new `AdbOperator(deviceId)`，默认 `nut-js` 会 new `NutJSOperator()`；再 new `GUIAgent({ model: { baseURL, apiKey, model, useResponsesApi }, operator, signal })`，执行 `await guiAgent.run(answers.instruction)`（来源：packages/ui-tars/cli/src/cli/start.ts）。 真实的一轮执行是：`GUIAgent.run()` 初始化 conversations，把用户 instruction 放入 human message；每轮调用 `operator.screenshot()`，用 Jimp 读出 width/height/mime，把截图作为 human `<image>` 放回 conversations；构造 `vlmParams`，包含 `screenContext: { width, height }`、`scaleFactor`、`uiTarsVersion`、`previousResponseId`；然后 `model.invoke(vlmParams)`（来源：packages/ui-tars/sdk/src/GUIAgent.ts run）。`UITarsModel.invoke()` 会按版本选择 `MAX_PIXELS_V1_5`/`MAX_PIXELS_DOUBAO`/`MAX_PIXELS_V1_0`，对图片做 `preprocessResizeImage()`，`convertToOpenAIMessages()` 把图片变成 `content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,...' }}]`；如果 `useResponsesApi` 为真走 `openai.responses.create()`，否则走 `openai.chat.completions.create()`；模型响应再交给 `actionParser({ prediction, factor, screenContext, scaleFactor, modelVer })`（来源：packages/ui-tars/sdk/src/Model.ts；packages/ui-tars/sdk/src/utils.ts）。 动作解析的例子：默认 prompt 要求模型输出 `Thought: ...` 和 `Action: click(start_box='[x1, y1, x2, y2]')`、`type(content='')`、`scroll(...)`、`finished()` 等；parser 会把 `<point>510 150</point>` 改写成 `start_box`，把 `<bbox>637 964 637 964</bbox>` 改写成坐标串，再把 box 按 `[1000,1000]` 或 UI-TARS-1.5 的 smart resize factor 缩放成 0-1 坐标（来源：packages/ui-tars/sdk/src/constants.ts；packages/ui-tars/action-parser/src/actionParser.ts）。执行时 `parseBoxToScreenCoords()` 取 box 中心点，按屏幕宽高换算成像素；`NutJSOperator.execute()` 对 `click` 移动鼠标并 `mouse.click(Button.LEFT)`，对 `type` 在 Windows 用剪贴板粘贴并在末尾 `\\n` 时敲 Enter，对 `scroll down` 执行 `mouse.scrollDown(5 * 100)`（来源：packages/ui-tars/sdk/src/utils.ts；packages/ui-tars/operators/nut-js/src/index.ts）。 Agent TARS 的另一个真实流是：`new AgentTARS({ aioSandbox: 'http://localhost:8080', model: { provider: 'volcengine', id: 'ep-20250510145437-5sxhs', apiKey: process.env.ARK_API_KEY } })`，`initialize()` 后打印 tools，再 `run('Open https://seed-tars.com')`（来源：multimodal/agent-tars/core/examples/aio-sandbox-example.ts）。如果不用 AIO Sandbox，本地环境会按 browser control 初始化 GUI Agent、SearchToolProvider、in-memory MCP server；browser 工具调用前 `onBeforeToolCall()` 会 lazy launch browser，filesystem/command 路径参数会经过 WorkspacePathResolver（来源：multimodal/agent-tars/core/src/agent-tars.ts；multimodal/agent-tars/core/src/environments/local/index.ts）。"
  essential_design_difference: "这些不是“照搬项目名”，而是可抽出的工程构件。 - Operator 接口；复制 `Operator.screenshot()` + `Operator.execute(params)` 这层边界：上层 Agent 不知道鼠标、ADB、浏览器、远程 sandbox 的细节，只处理 screenshot/output/action。；如果你的任务只调用 API 或数据库，不需要真实 GUI 状态，就不要引入截图闭环。；它让同一个 GUIAgent 可以换 `NutJSOperator`、`AdbOperator`、`BrowserOperator` 或 AIO operator（来源：packages/ui-tars/sdk/src/types.ts；packages/ui-tars/cli/src/cli/start.ts）。 - Action grammar + parser；保留少量固定动作：`click/drag/hotkey/type/scroll/wait/finished/call_user`，再用 parser 兼容 `<point>`、`<bbox>`、`start_box`、`end_box`。；如果你能拿到结构化 tool call，不必让模型输出 Python-like 字符串再 regex 解析。；GUI 模型经常输出近似格式；这里把格式兼容集中在 `action-parser`，避免散落到 operator（来源：packages/ui-tars/action-parser/src/actionParser.ts）。 - MCP transport adapter；把 MCP Server 包成 SSE + Streamable HTTP：默认 `/sse`、`/message`、`/mcp`，并允许自定义 `routes`、`middlewares`、`createMcpServer(req)`。；如果所有工具都在同进程内，in-memory transport 更简单。；同一套工具可以本地嵌入，也可以远程暴露给 Agent TARS/AIO Sandbox（来源：packages/agent-infra/mcp-http-server/src/startServer.ts）。 - Browser control strategy；把 browser 自动化拆成 `dom`、`visual-grounding`、`hybrid` 三个策略，而不是在 prompt 里让模型自己猜工具。；如果是可预测内部后台系统，Playwright/DOM-first 可能更稳定。；`hybrid` 同时注册 GUI Agent tool、navigation/content/visual tools 和部分 MCP browser tools；适合网页结构和视觉元素混合的任务（来源：multimodal/agent-tars/core/src/environments/local/browser/browser-control-strategies/browser-hybrid-strategy.ts）。 - 安全目录树替换；替换 MCP 原生 `directory_tree`，默认 `maxDepth=3`、`maxFiles=1000`，排除 `node_modules/.git/dist/build/.next/coverage/logs` 等。；小型脚本目录不需要这层；但大型 monorepo 很需要。；它直接处理 Agent 上下文爆炸，而不是只在 prompt 里说“少读文件”（来源：multimodal/agent-tars/core/src/environments/local/filesystem/filesystem-tools-manager.ts）。 - Preset 配置格式；把 `language`、`vlmProvider`、`vlmBaseUrl`、`vlmApiKey`、`vlmModelName`、`reportStorageBaseUrl`、`utioBaseUrl` 放进 YAML，可从 file 或 URL 导入。；如果部署环境有强密钥管理，不要把 API key 放进可分发 preset。；配置可迁移，但也暴露密钥分发风险；文档说 URL preset 可启动时自动拉取（来源：docs/preset.md；examples/presets/default.yaml）。"
  practitioner_meaning: "判断：值得 clone-and-run，但先把它当“可拆解的 Agent 工程栈”，不要当开箱即用的可靠桌面机器人。人话：如果你在做 GUI agent、browser agent、MCP 工具编排或多模态 agent UI，这个仓库有很多可直接学习的工程边界；如果你只是要稳定自动化一个网页，Playwright/browser-use 这类更窄工具更省心。技术上：优先跑 `@ui-tars/cli` 的 nut-js 路径和 `multimodal/agent-tars/core/examples/default.ts`/`aio-sandbox-example.ts`，验证模型 endpoint、权限、坐标、MCP tool list，再抽 Operator、action parser、MCP HTTP server、browser strategy 和 safe directory_tree。成熟度给 4 而不是 5：仓库结构、测试、打包脚本都很完整，但 remote operator 已过停止日期，模型服务外置，真实 GUI 任务稳定性未由仓库内可复现实验支撑。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "UI-TARS-desktop 是一个把桌面/浏览器截图、视觉语言模型、动作解析器和本机/MCP 工具执行串成闭环的多模态 Agent monorepo。"
    body_md: "人话：它不是单一桌面壳，而是一套从“用户说一句话”到“截图、问模型、解析 Action、点击/输入/滚动”的工程栈；同仓库还包含 Agent TARS/Tarko 的 MCP Agent 框架、CLI、AIO Sandbox 接入与浏览器/文件系统/命令工具编排。技术上：已核实 monorepo 使用 pnpm workspace，包含 `apps/ui-tars`、`packages/ui-tars/*`、`packages/agent-infra/*`、`multimodal/agent-tars/*`、`multimodal/tarko/*`、`multimodal/gui-agent/*`；根 `package.json` 要求 `node >=20.x`，`@agent-tars/cli` 要求 `node >=22.15.0`（来源：pnpm-workspace.yaml packages；package.json engines；multimodal/agent-tars/cli package.json engines）。"
  why_worth_attention:
    summary: ""
    body_md: "人话：值得看的是它把“GUI agent”拆成了可替换部件，而不是只给一个演示视频。技术上：UI-TARS SDK 有 `GUIAgent`、`UITarsModel`、`Operator`、`action-parser`；Agent TARS 则把浏览器、文件系统、命令和自定义 MCP Server 接到 Tarko Agent 循环里。"
    bullets:
      - "已核实的桌面闭环：`GUIAgent.run()` 每轮调用 `operator.screenshot()`，把截图作为 `data:image/png;base64,...` 转成 OpenAI chat messages，调用 `openai.chat.completions.create()` 或 `openai.responses.create()`，再用 `actionParser()` 解析 `Action:`，最后 `operator.execute()` 执行动作（来源：packages/ui-tars/sdk/src/GUIAgent.ts run；packages/ui-tars/sdk/src/Model.ts invoke/invokeModelProvider；packages/ui-tars/sdk/src/utils.ts convertToOpenAIMessages）。"
      - "已核实的本机执行层：`NutJSOperator` 用 `@computer-use/nut-js` 的 `screen.grab()` 截屏，`mouse.click()`、`mouse.drag()`、`keyboard.pressKey()`、`clipboard.setContent()` 执行点击、拖拽、热键和 Windows 粘贴输入（来源：packages/ui-tars/operators/nut-js/src/index.ts）。"
      - "已核实的 Agent TARS/MCP 层：`AgentTARS extends MCPAgent`，构造时把 `environment.getMCPServerRegistry()` 传给父类；本地 in-memory 模式创建 browser/filesystem/commands 三类 MCP server，stdio 模式返回 `npx -y @agent-infra/mcp-server-browser`、`@agent-infra/mcp-server-filesystem <workspace>`、`@agent-infra/mcp-server-commands`（来源：multimodal/agent-tars/core/src/agent-tars.ts；multimodal/agent-tars/core/src/environments/local/index.ts）。"
      - "工程成熟度有证据但不是无风险：仓库内已核实 123 个 `*.test.ts/*.test.mts` 文件，根 vitest coverage include `apps/**/*.ts`、`packages/**/*.ts`，Electron e2e 只核验 app launch 和可见 button；未运行安装/构建/发布（来源：rg file scan；vitest.config.mts；apps/ui-tars/e2e/app.test.ts）。"
  key_claims_evidence:
    summary: ""
    body_md: "以下把 README/文档的自称和代码树可验证事实分开。自称不等于实测性能；已核实只表示文件/源码存在并支持该机制。"
    items:
      - claim: "“TARS is a Multimodal AI Agent stack, currently shipping two projects: Agent TARS and UI-TARS-desktop”。"
        plain_english: "仓库定位自己为多模态 Agent 栈，主线有 Agent TARS 和 UI-TARS Desktop 两块。"
        source: "README Introduction；README Agent TARS；README UI-TARS Desktop"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 明确列出两块；代码树也有 `apps/ui-tars`、`packages/ui-tars/*`、`multimodal/agent-tars/core`、`multimodal/agent-tars/cli`。"
        does_not_support: "不直接证明两个产品在当前 commit 都能完整端到端运行。"
        threat: "Agent TARS 的完整用户文档大量指向外部 `agent-tars.com`，本次主要核验了仓库内代码和 README。"
      - claim: "UI-TARS Desktop 的本地使用需要外部或自部署 VLM 配置：`VLM Provider`、`VLM Base URL`、`VLM API KEY`、`VLM Model Name`。"
        plain_english: "桌面应用不是内置一个可直接离线跑的模型；你要给它一个 OpenAI-compatible 的视觉模型服务。"
        source: "docs/quick-start.md Get model and run local operator；docs/setting.md VLM Settings"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "Quick Start 给出 Hugging Face 示例：`VLM Provider: Hugging Face for UI-TARS-1.5`、`VLM Base URL: https:xxx`、`VLM API KEY: your_api_key`、`VLM Model Name: xxx`；VolcEngine 示例给出 `https://ark.cn-beijing.volces.com/api/v3` 与 `doubao-1.5-ui-tars-250328`。Settings 文档说 Base URL should be OpenAI compatible API endpoints。"
        does_not_support: "不证明任何第三方 endpoint 在 2026-06-08 可用或免费。"
        threat: "模型部署说明链接到另一个仓库/外部文档；本仓库只说明接入字段。"
      - claim: "SDK 的真实执行循环是“截图 -> VLM -> 解析动作 -> operator 执行”。"
        plain_english: "用户指令不会直接变成鼠标动作，中间有截图、多模态模型响应和动作解析。"
        source: "packages/ui-tars/sdk/src/GUIAgent.ts run；packages/ui-tars/sdk/src/Model.ts invoke；packages/ui-tars/action-parser/src/actionParser.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`GUIAgent.run()` 调 `operator.screenshot()`，把截图写进 conversations；`UITarsModel.invoke()` 对图片做 `preprocessResizeImage()` 后转 OpenAI messages；`actionParser()` 调 `parseActionVlm()`，支持 `Action:`、`Action：`、`<point>`、`<bbox>`、`start_box`/`end_box`。"
        does_not_support: "不证明模型输出总能被 parser 正确解析；源码 catch 后会返回空 parsedPredictions。"
        threat: "Action grammar 依赖模型遵守 prompt，格式漂移会直接影响执行。"
      - claim: "本机 Desktop operator 支持点击、双击、右键、拖拽、热键、输入、滚动、等待、结束/求助。"
        plain_english: "它能控制真实桌面鼠标键盘，但不是任意 OS API 自动化。"
        source: "packages/ui-tars/operators/nut-js/src/index.ts MANUAL/ACTION_SPACES and execute"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`NutJSOperator.MANUAL.ACTION_SPACES` 列出 `click`、`left_double`、`right_single`、`drag`、`hotkey`、`type`、`scroll`、`wait`、`finished`、`call_user`；`execute()` 中 `wait` 是 `sleep(5000)`，Windows `type` 用剪贴板再 `Ctrl+V`。"
        does_not_support: "不证明所有应用窗口、权限状态、多显示器环境都稳定。"
        threat: "Quick Start 明确写了当前只支持 single monitor setup，多显示器可能导致任务失败。"
      - claim: "Agent TARS 的浏览器控制有 `dom`、`visual-grounding`、`hybrid` 三种策略。"
        plain_english: "浏览器任务可以走 DOM 工具，也可以走截图视觉点击，或者混用。"
        source: "multimodal/agent-tars/core README Browser Control Modes；multimodal/agent-tars/core/src/environments/local/browser/browser-control-strategies/*.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`browser-dom-strategy.ts` 注册 `browser_navigate`、`browser_click`、`browser_evaluate` 等 MCP Browser tools；`browser-visual-grounding-strategy.ts` 注册 GUI Agent tool 和 navigation/content/status/visual tools；`browser-hybrid-strategy.ts` 同时注册 GUI Agent tool、navigation/content/visual tools 和部分 MCP browser tools。"
        does_not_support: "不证明 hybrid 总是优于 dom 或 visual-grounding；README 的 “recommended/fastest/reliable” 属项目自称。"
        threat: "不同网站的 DOM、反自动化、登录状态和视觉布局会改变成功率。"
      - claim: "MCP HTTP server 同时提供 SSE 和 Streamable HTTP 端点。"
        plain_english: "它能把一个 MCP server 挂成 HTTP 服务，客户端可走 `/sse` 或 `/mcp`。"
        source: "packages/agent-infra/mcp-http-server/src/startServer.ts；packages/agent-infra/mcp-http-server/package.json"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "默认 routes 是 `mcp: /mcp`、`message: /message`、`sse: /sse`；`app.get(/sse)` 创建 `SSEServerTransport`，`app.post(/mcp)` 创建 `StreamableHTTPServerTransport`；默认 `PORT` 是 `port || process.env.PORT || 8080`。"
        does_not_support: "不证明公网部署安全、鉴权、限流或多租户隔离。"
        threat: "源码未在该 server 层内看到内置认证；需要调用方用 middlewares 或外部网关处理。"
      - claim: "Agent TARS 对文件系统工具做了工作区化和目录树限流。"
        plain_english: "它尝试避免 Agent 一次把整个仓库树塞进上下文，也把相对路径解析到 workspace。"
        source: "multimodal/agent-tars/core/src/environments/local/filesystem/filesystem-tools-manager.ts；multimodal/agent-tars/core/src/shared/workspace-path-resolver.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`FilesystemToolsManager` 排除原 MCP `directory_tree`，替换为 `maxDepth default 3`、`maxFiles default 1000`、默认排除 `node_modules`、`.git`、`dist`、`build`、`.next`、`coverage`、`logs` 等；`WorkspacePathResolver` 将 `write_file/read_file/list_directory/run_command cwd` 等相对路径按 workspace resolve。"
        does_not_support: "`WorkspacePathResolver.resolvePath()` 对已是 absolute 的路径直接 return as-is；真正越界限制依赖底层 filesystem MCP 的 `allowedDirectories: [workspace]` 和命令工具自身约束。"
        threat: "命令工具 `run_command/run_script` 的执行风险未在该 resolver 中被策略化，只解析 `cwd`。"
  how_it_works:
    summary: ""
    body_md: "人话：最小链路可以从 CLI 跑起来：`npx @ui-tars/cli start`（文档写法），CLI 先拿模型配置，再让你选 `nut-js` 或 `adb`，最后把自然语言任务交给 GUIAgent。技术上：`packages/ui-tars/cli/src/cli/start.ts` 会读 `~/.ui-tars-cli.json`；如果传 `--presets`，它 fetch YAML 并读取 `vlmApiKey`、`vlmBaseUrl`、`vlmModelName`、`useResponsesApi`；没有配置就用 `@clack/prompts` 询问 `baseURL/apiKey/model`，并写回 `~/.ui-tars-cli.json`。随后它选择 operator：`adb` 会 `getAndroidDeviceId()` 后 new `AdbOperator(deviceId)`，默认 `nut-js` 会 new `NutJSOperator()`；再 new `GUIAgent({ model: { baseURL, apiKey, model, useResponsesApi }, operator, signal })`，执行 `await guiAgent.run(answers.instruction)`（来源：packages/ui-tars/cli/src/cli/start.ts）。\n\n真实的一轮执行是：`GUIAgent.run()` 初始化 conversations，把用户 instruction 放入 human message；每轮调用 `operator.screenshot()`，用 Jimp 读出 width/height/mime，把截图作为 human `<image>` 放回 conversations；构造 `vlmParams`，包含 `screenContext: { width, height }`、`scaleFactor`、`uiTarsVersion`、`previousResponseId`；然后 `model.invoke(vlmParams)`（来源：packages/ui-tars/sdk/src/GUIAgent.ts run）。`UITarsModel.invoke()` 会按版本选择 `MAX_PIXELS_V1_5`/`MAX_PIXELS_DOUBAO`/`MAX_PIXELS_V1_0`，对图片做 `preprocessResizeImage()`，`convertToOpenAIMessages()` 把图片变成 `content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,...' }}]`；如果 `useResponsesApi` 为真走 `openai.responses.create()`，否则走 `openai.chat.completions.create()`；模型响应再交给 `actionParser({ prediction, factor, screenContext, scaleFactor, modelVer })`（来源：packages/ui-tars/sdk/src/Model.ts；packages/ui-tars/sdk/src/utils.ts）。\n\n动作解析的例子：默认 prompt 要求模型输出 `Thought: ...` 和 `Action: click(start_box='[x1, y1, x2, y2]')`、`type(content='')`、`scroll(...)`、`finished()` 等；parser 会把 `<point>510 150</point>` 改写成 `start_box`，把 `<bbox>637 964 637 964</bbox>` 改写成坐标串，再把 box 按 `[1000,1000]` 或 UI-TARS-1.5 的 smart resize factor 缩放成 0-1 坐标（来源：packages/ui-tars/sdk/src/constants.ts；packages/ui-tars/action-parser/src/actionParser.ts）。执行时 `parseBoxToScreenCoords()` 取 box 中心点，按屏幕宽高换算成像素；`NutJSOperator.execute()` 对 `click` 移动鼠标并 `mouse.click(Button.LEFT)`，对 `type` 在 Windows 用剪贴板粘贴并在末尾 `\\n` 时敲 Enter，对 `scroll down` 执行 `mouse.scrollDown(5 * 100)`（来源：packages/ui-tars/sdk/src/utils.ts；packages/ui-tars/operators/nut-js/src/index.ts）。\n\nAgent TARS 的另一个真实流是：`new AgentTARS({ aioSandbox: 'http://localhost:8080', model: { provider: 'volcengine', id: 'ep-20250510145437-5sxhs', apiKey: process.env.ARK_API_KEY } })`，`initialize()` 后打印 tools，再 `run('Open https://seed-tars.com')`（来源：multimodal/agent-tars/core/examples/aio-sandbox-example.ts）。如果不用 AIO Sandbox，本地环境会按 browser control 初始化 GUI Agent、SearchToolProvider、in-memory MCP server；browser 工具调用前 `onBeforeToolCall()` 会 lazy launch browser，filesystem/command 路径参数会经过 WorkspacePathResolver（来源：multimodal/agent-tars/core/src/agent-tars.ts；multimodal/agent-tars/core/src/environments/local/index.ts）。"
  reusable_abstractions:
    summary: ""
    body_md: "这些不是“照搬项目名”，而是可抽出的工程构件。"
    items:
      - name: "Operator 接口"
        copy: "复制 `Operator.screenshot()` + `Operator.execute(params)` 这层边界：上层 Agent 不知道鼠标、ADB、浏览器、远程 sandbox 的细节，只处理 screenshot/output/action。"
        skip: "如果你的任务只调用 API 或数据库，不需要真实 GUI 状态，就不要引入截图闭环。"
        why_it_matters: "它让同一个 GUIAgent 可以换 `NutJSOperator`、`AdbOperator`、`BrowserOperator` 或 AIO operator（来源：packages/ui-tars/sdk/src/types.ts；packages/ui-tars/cli/src/cli/start.ts）。"
      - name: "Action grammar + parser"
        copy: "保留少量固定动作：`click/drag/hotkey/type/scroll/wait/finished/call_user`，再用 parser 兼容 `<point>`、`<bbox>`、`start_box`、`end_box`。"
        skip: "如果你能拿到结构化 tool call，不必让模型输出 Python-like 字符串再 regex 解析。"
        why_it_matters: "GUI 模型经常输出近似格式；这里把格式兼容集中在 `action-parser`，避免散落到 operator（来源：packages/ui-tars/action-parser/src/actionParser.ts）。"
      - name: "MCP transport adapter"
        copy: "把 MCP Server 包成 SSE + Streamable HTTP：默认 `/sse`、`/message`、`/mcp`，并允许自定义 `routes`、`middlewares`、`createMcpServer(req)`。"
        skip: "如果所有工具都在同进程内，in-memory transport 更简单。"
        why_it_matters: "同一套工具可以本地嵌入，也可以远程暴露给 Agent TARS/AIO Sandbox（来源：packages/agent-infra/mcp-http-server/src/startServer.ts）。"
      - name: "Browser control strategy"
        copy: "把 browser 自动化拆成 `dom`、`visual-grounding`、`hybrid` 三个策略，而不是在 prompt 里让模型自己猜工具。"
        skip: "如果是可预测内部后台系统，Playwright/DOM-first 可能更稳定。"
        why_it_matters: "`hybrid` 同时注册 GUI Agent tool、navigation/content/visual tools 和部分 MCP browser tools；适合网页结构和视觉元素混合的任务（来源：multimodal/agent-tars/core/src/environments/local/browser/browser-control-strategies/browser-hybrid-strategy.ts）。"
      - name: "安全目录树替换"
        copy: "替换 MCP 原生 `directory_tree`，默认 `maxDepth=3`、`maxFiles=1000`，排除 `node_modules/.git/dist/build/.next/coverage/logs` 等。"
        skip: "小型脚本目录不需要这层；但大型 monorepo 很需要。"
        why_it_matters: "它直接处理 Agent 上下文爆炸，而不是只在 prompt 里说“少读文件”（来源：multimodal/agent-tars/core/src/environments/local/filesystem/filesystem-tools-manager.ts）。"
      - name: "Preset 配置格式"
        copy: "把 `language`、`vlmProvider`、`vlmBaseUrl`、`vlmApiKey`、`vlmModelName`、`reportStorageBaseUrl`、`utioBaseUrl` 放进 YAML，可从 file 或 URL 导入。"
        skip: "如果部署环境有强密钥管理，不要把 API key 放进可分发 preset。"
        why_it_matters: "配置可迁移，但也暴露密钥分发风险；文档说 URL preset 可启动时自动拉取（来源：docs/preset.md；examples/presets/default.yaml）。"
  dependency_platform_risk:
    summary: ""
    body_md: "风险重点不是“能不能点鼠标”，而是模型、OS 权限、远程服务、MCP 工具边界和 telemetry/share 配置。"
    items:
      - dependency: "OpenAI-compatible VLM endpoint / UI-TARS-1.5 / Doubao-1.5-UI-TARS"
        what_if_change: "Base URL、模型名、Responses API 行为或 action 输出格式变化，会让 `UITarsModel.invoke()` 或 `actionParser()` 失败。"
        exposure: "high"
        mitigation_or_unknown: "Settings 提供 provider 选择和 `useResponsesApi` 开关；未在 README/docs/tree 看到端到端兼容性矩阵或自动 fallback 机制。"
        source: "docs/setting.md VLM Settings；packages/ui-tars/sdk/src/Model.ts"
      - dependency: "macOS/Windows 本机权限和单显示器环境"
        what_if_change: "屏幕录制/辅助功能权限缺失、多显示器、缩放比例异常，会影响截图坐标和点击位置。"
        exposure: "high"
        mitigation_or_unknown: "Quick Start 要求 macOS Accessibility 与 Screen Recording；文档明确 single monitor only，多显示器可能失败。"
        source: "docs/quick-start.md Prerequisites/Install"
      - dependency: "Remote Operator 服务"
        what_if_change: "文档写 Remote Operator service will be discontinued on August 20, 2025；当前日期 2026-06-08，默认远程服务状态不能当作可用。"
        exposure: "high"
        mitigation_or_unknown: "文档建议 free trial 后探索 Volcano Engine OS Agent Services；未在 README/docs/tree 说明 2026-06-08 的官方远程服务替代状态。"
        source: "docs/quick-start.md Run remote operator"
      - dependency: "Electron + native modules + nut-js"
        what_if_change: "Electron 版本、native permission 包或 nut-js 变动会影响打包、截屏、鼠标键盘控制。"
        exposure: "medium"
        mitigation_or_unknown: "`apps/ui-tars/package.json` 锁定 `electron 34.1.1`、`@computer-use/nut-js ^4.2.0`、`@computer-use/node-mac-permissions 2.2.2`；Forge config 保留 native modules 并配置 fuses。未运行构建验证。"
        source: "apps/ui-tars/package.json dependencies；apps/ui-tars/forge.config.ts"
      - dependency: "MCP filesystem/commands 工具边界"
        what_if_change: "Agent 调用文件或命令工具时，错误 cwd/path 或恶意任务可能扩大影响。"
        exposure: "medium"
        mitigation_or_unknown: "filesystem server 用 `allowedDirectories: [workspace]`，`directory_tree` 有 maxDepth/maxFiles/exclude；`WorkspacePathResolver` 只把相对路径 resolve 到 workspace，absolute path 直接保留，命令执行策略未在该 resolver 中说明。"
        source: "multimodal/agent-tars/core/src/environments/local/index.ts；workspace-path-resolver.ts；filesystem-tools-manager.ts"
      - dependency: "Report Storage / UTIO endpoints"
        what_if_change: "如果配置了 reportStorageBaseUrl 或 utioBaseUrl，报告 HTML、instruction、截图/报告 URL 等会发到用户配置的服务器。"
        exposure: "medium"
        mitigation_or_unknown: "文档明确 Report Storage Server 当前 no authentication designed；UTIO 事件包括 `appLaunched`、`sendInstruction`、`shareReport`。未看到内置鉴权方案。"
        source: "docs/setting.md Report Settings/UTIO Base URL"
      - dependency: "AIO Sandbox endpoint"
        what_if_change: "AIO 模式完全依赖 `${aioSandbox}/mcp`，本地 browser/filesystem/commands 初始化会被跳过。"
        exposure: "medium"
        mitigation_or_unknown: "AIO environment 的 registry 是 `{ aio: { type: 'streamable-http', url: '<aioSandbox>/mcp' } }`；未在仓库内证明 sandbox 可用性、隔离策略或部署 SLA。"
        source: "multimodal/agent-tars/core/src/environments/aio/index.ts；multimodal/agent-tars/core/examples/aio-sandbox-example.ts"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些不能从 README/docs/tree 推出来，不能补成事实。"
    items:
      - "未运行 `pnpm install`、`pnpm test`、`pnpm dev:ui-tars` 或 Electron build；可运行性在本次只依据文件和脚本判断，未实测。"
      - "README 的 “Private and secure - fully local processing” 是项目自称；代码和文档显示本地 operator 会把截图发到配置的 VLM Base URL，只有当 VLM endpoint 本身是本地/自托管时才可称为全本地。"
      - "Remote Operator 文档写 2025-08-20 停止服务；当前 2026-06-08，实际远程服务/Volcano Engine 模板可用性未在本仓库 README/docs/tree 说明。"
      - "Agent TARS 的外部 Web UI/agent-tars.com 文档没有完整克隆到本地；仓库内可核验的是 `multimodal/agent-tars/*` 包和 README 片段。"
      - "没有从仓库文件中找到对模型成功率、benchmark 数字、任务覆盖率、OS 兼容矩阵的可复现实测说明。"
      - "`@agent-tars/core` README 称 Tarko/Agent TARS 获得 over 15k Stars，这是 README 自称；本次未用 GitHub API 实时核验星数。"
      - "报告上传和 UTIO endpoint 的生产安全配置、鉴权、数据保留策略未在 README/docs/tree 说明。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 4
    body_md: "判断：值得 clone-and-run，但先把它当“可拆解的 Agent 工程栈”，不要当开箱即用的可靠桌面机器人。人话：如果你在做 GUI agent、browser agent、MCP 工具编排或多模态 agent UI，这个仓库有很多可直接学习的工程边界；如果你只是要稳定自动化一个网页，Playwright/browser-use 这类更窄工具更省心。技术上：优先跑 `@ui-tars/cli` 的 nut-js 路径和 `multimodal/agent-tars/core/examples/default.ts`/`aio-sandbox-example.ts`，验证模型 endpoint、权限、坐标、MCP tool list，再抽 Operator、action parser、MCP HTTP server、browser strategy 和 safe directory_tree。成熟度给 4 而不是 5：仓库结构、测试、打包脚本都很完整，但 remote operator 已过停止日期，模型服务外置，真实 GUI 任务稳定性未由仓库内可复现实验支撑。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-2026-06-08T1732\\\\bytedance-ui-tars-desktop\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-2026-06-08T1732\\bytedance-ui-tars-desktop\\prompt.md"
  raw_response: "logs\\codex-deepdive-2026-06-08T1732\\bytedance-ui-tars-desktop\\codex-last-message.json"
  invoked_at: "2026-06-08T17:42:54.282Z"
  completed_at: "2026-06-08T17:48:51.782Z"
  repo: "bytedance/UI-TARS-desktop"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "The Open-Source Multimodal AI Agent Stack: Connecting Cutting-Edge AI Models and Agent Infra"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "“TARS is a Multimodal AI Agent stack, currently shipping two projects: Agent TARS and UI-TARS-desktop”。"
    - "UI-TARS Desktop 的本地使用需要外部或自部署 VLM 配置：`VLM Provider`、`VLM Base URL`、`VLM API KEY`、`VLM Model Name`。"
    - "SDK 的真实执行循环是“截图 -> VLM -> 解析动作 -> operator 执行”。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "docs/setting.md VLM Settings；packages/ui-tars/sdk/src/Model.ts"
    - "docs/quick-start.md Prerequisites/Install"
    - "docs/quick-start.md Run remote operator"
    - "apps/ui-tars/package.json dependencies；apps/ui-tars/forge.config.ts"
    - "multimodal/agent-tars/core/src/environments/local/index.ts；workspace-path-resolver.ts；filesystem-tools-manager.ts"
    - "docs/setting.md Report Settings/UTIO Base URL"
    - "multimodal/agent-tars/core/src/environments/aio/index.ts；multimodal/agent-tars/core/examples/aio-sandbox-example.ts"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 4
  main_risk: "判断：值得 clone-and-run，但先把它当“可拆解的 Agent 工程栈”，不要当开箱即用的可靠桌面机器人。人话：如果你在做 GUI agent、browser agent、MCP 工具编排或多模态 agent UI，这个仓库有很多可直接学习的工程边界；如果你只是要稳定自动化一个网页，Playwright/browser-use 这类更窄工具更省心。技术上：优先跑 `@ui-tars/cli` 的 nut-js 路径和 `multimodal/agent-tars/core/examples/default.ts`/`aio-sandbox-example.ts`，验证模型 endpoint、权限、坐标、MCP tool list，再抽 Operator、action parser、MCP HTTP server、browser strategy 和 safe directory_tree。成熟度给 4 而不是 5：仓库结构、测试、打包脚本都很完整，但 remote operator 已过停止日期，模型服务外置，真实 GUI 任务稳定性未由仓库内可复现实验支撑。"
next_actions:
  - "clone-and-run"
unknowns:
  - "未运行 `pnpm install`、`pnpm test`、`pnpm dev:ui-tars` 或 Electron build；可运行性在本次只依据文件和脚本判断，未实测。"
  - "README 的 “Private and secure - fully local processing” 是项目自称；代码和文档显示本地 operator 会把截图发到配置的 VLM Base URL，只有当 VLM endpoint 本身是本地/自托管时才可称为全本地。"
  - "Remote Operator 文档写 2025-08-20 停止服务；当前 2026-06-08，实际远程服务/Volcano Engine 模板可用性未在本仓库 README/docs/tree 说明。"
  - "Agent TARS 的外部 Web UI/agent-tars.com 文档没有完整克隆到本地；仓库内可核验的是 `multimodal/agent-tars/*` 包和 README 片段。"
  - "没有从仓库文件中找到对模型成功率、benchmark 数字、任务覆盖率、OS 兼容矩阵的可复现实测说明。"
  - "`@agent-tars/core` README 称 Tarko/Agent TARS 获得 over 15k Stars，这是 README 自称；本次未用 GitHub API 实时核验星数。"
  - "报告上传和 UTIO endpoint 的生产安全配置、鉴权、数据保留策略未在 README/docs/tree 说明。"
builder_reuse:
  pattern: "Operator 接口"
  copy: "复制 `Operator.screenshot()` + `Operator.execute(params)` 这层边界：上层 Agent 不知道鼠标、ADB、浏览器、远程 sandbox 的细节，只处理 screenshot/output/action。"
  skip: "如果你的任务只调用 API 或数据库，不需要真实 GUI 状态，就不要引入截图闭环。"
  why_it_matters: "它让同一个 GUIAgent 可以换 `NutJSOperator`、`AdbOperator`、`BrowserOperator` 或 AIO operator（来源：packages/ui-tars/sdk/src/types.ts；packages/ui-tars/cli/src/cli/start.ts）。"
dependency_platform_risk:
  dependency: "OpenAI-compatible VLM endpoint / UI-TARS-1.5 / Doubao-1.5-UI-TARS"
  what_if_change: "Base URL、模型名、Responses API 行为或 action 输出格式变化，会让 `UITarsModel.invoke()` 或 `actionParser()` 失败。"
  exposure: "high"
  mitigation_or_unknown: "Settings 提供 provider 选择和 `useResponsesApi` 开关；未在 README/docs/tree 看到端到端兼容性矩阵或自动 fallback 机制。"
claim_ledger:
  - claim: "“TARS is a Multimodal AI Agent stack, currently shipping two projects: Agent TARS and UI-TARS-desktop”。"
    plain_english: "仓库定位自己为多模态 Agent 栈，主线有 Agent TARS 和 UI-TARS Desktop 两块。"
    source: "README Introduction；README Agent TARS；README UI-TARS Desktop"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 明确列出两块；代码树也有 `apps/ui-tars`、`packages/ui-tars/*`、`multimodal/agent-tars/core`、`multimodal/agent-tars/cli`。"
    does_not_support: "不直接证明两个产品在当前 commit 都能完整端到端运行。"
    threat: "Agent TARS 的完整用户文档大量指向外部 `agent-tars.com`，本次主要核验了仓库内代码和 README。"
  - claim: "UI-TARS Desktop 的本地使用需要外部或自部署 VLM 配置：`VLM Provider`、`VLM Base URL`、`VLM API KEY`、`VLM Model Name`。"
    plain_english: "桌面应用不是内置一个可直接离线跑的模型；你要给它一个 OpenAI-compatible 的视觉模型服务。"
    source: "docs/quick-start.md Get model and run local operator；docs/setting.md VLM Settings"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "Quick Start 给出 Hugging Face 示例：`VLM Provider: Hugging Face for UI-TARS-1.5`、`VLM Base URL: https:xxx`、`VLM API KEY: your_api_key`、`VLM Model Name: xxx`；VolcEngine 示例给出 `https://ark.cn-beijing.volces.com/api/v3` 与 `doubao-1.5-ui-tars-250328`。Settings 文档说 Base URL should be OpenAI compatible API endpoints。"
    does_not_support: "不证明任何第三方 endpoint 在 2026-06-08 可用或免费。"
    threat: "模型部署说明链接到另一个仓库/外部文档；本仓库只说明接入字段。"
  - claim: "SDK 的真实执行循环是“截图 -> VLM -> 解析动作 -> operator 执行”。"
    plain_english: "用户指令不会直接变成鼠标动作，中间有截图、多模态模型响应和动作解析。"
    source: "packages/ui-tars/sdk/src/GUIAgent.ts run；packages/ui-tars/sdk/src/Model.ts invoke；packages/ui-tars/action-parser/src/actionParser.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`GUIAgent.run()` 调 `operator.screenshot()`，把截图写进 conversations；`UITarsModel.invoke()` 对图片做 `preprocessResizeImage()` 后转 OpenAI messages；`actionParser()` 调 `parseActionVlm()`，支持 `Action:`、`Action：`、`<point>`、`<bbox>`、`start_box`/`end_box`。"
    does_not_support: "不证明模型输出总能被 parser 正确解析；源码 catch 后会返回空 parsedPredictions。"
    threat: "Action grammar 依赖模型遵守 prompt，格式漂移会直接影响执行。"
  - claim: "本机 Desktop operator 支持点击、双击、右键、拖拽、热键、输入、滚动、等待、结束/求助。"
    plain_english: "它能控制真实桌面鼠标键盘，但不是任意 OS API 自动化。"
    source: "packages/ui-tars/operators/nut-js/src/index.ts MANUAL/ACTION_SPACES and execute"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`NutJSOperator.MANUAL.ACTION_SPACES` 列出 `click`、`left_double`、`right_single`、`drag`、`hotkey`、`type`、`scroll`、`wait`、`finished`、`call_user`；`execute()` 中 `wait` 是 `sleep(5000)`，Windows `type` 用剪贴板再 `Ctrl+V`。"
    does_not_support: "不证明所有应用窗口、权限状态、多显示器环境都稳定。"
    threat: "Quick Start 明确写了当前只支持 single monitor setup，多显示器可能导致任务失败。"
  - claim: "Agent TARS 的浏览器控制有 `dom`、`visual-grounding`、`hybrid` 三种策略。"
    plain_english: "浏览器任务可以走 DOM 工具，也可以走截图视觉点击，或者混用。"
    source: "multimodal/agent-tars/core README Browser Control Modes；multimodal/agent-tars/core/src/environments/local/browser/browser-control-strategies/*.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`browser-dom-strategy.ts` 注册 `browser_navigate`、`browser_click`、`browser_evaluate` 等 MCP Browser tools；`browser-visual-grounding-strategy.ts` 注册 GUI Agent tool 和 navigation/content/status/visual tools；`browser-hybrid-strategy.ts` 同时注册 GUI Agent tool、navigation/content/visual tools 和部分 MCP browser tools。"
    does_not_support: "不证明 hybrid 总是优于 dom 或 visual-grounding；README 的 “recommended/fastest/reliable” 属项目自称。"
    threat: "不同网站的 DOM、反自动化、登录状态和视觉布局会改变成功率。"
  - claim: "MCP HTTP server 同时提供 SSE 和 Streamable HTTP 端点。"
    plain_english: "它能把一个 MCP server 挂成 HTTP 服务，客户端可走 `/sse` 或 `/mcp`。"
    source: "packages/agent-infra/mcp-http-server/src/startServer.ts；packages/agent-infra/mcp-http-server/package.json"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "默认 routes 是 `mcp: /mcp`、`message: /message`、`sse: /sse`；`app.get(/sse)` 创建 `SSEServerTransport`，`app.post(/mcp)` 创建 `StreamableHTTPServerTransport`；默认 `PORT` 是 `port || process.env.PORT || 8080`。"
    does_not_support: "不证明公网部署安全、鉴权、限流或多租户隔离。"
    threat: "源码未在该 server 层内看到内置认证；需要调用方用 middlewares 或外部网关处理。"
artifact_audit:
  official_repo: "https://github.com/bytedance/UI-TARS-desktop"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "Apache-2.0"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

bytedance/UI-TARS-desktop：开源多模态 AI Agent 技术栈，用于连接前沿 AI 模型和 Agent 基础设施。

（来源：README/artifactAudit）

## 干什么

The Open-Source Multimodal AI Agent Stack: Connecting Cutting-Edge AI Models and Agent Infra

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | TypeScript |
| total_stars | 36148 |
| stars_in_period | 6653 |
| author | bytedance |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

人话：值得看的是它把“GUI agent”拆成了可替换部件，而不是只给一个演示视频。技术上：UI-TARS SDK 有 `GUIAgent`、`UITarsModel`、`Operator`、`action-parser`；Agent TARS 则把浏览器、文件系统、命令和自定义 MCP Server 接到 Tarko Agent 循环里。

（来源：README/artifactAudit）

## 核心能力

- Operator 接口（来源：数据不足）
- Action grammar + parser（来源：数据不足）
- MCP transport adapter（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向判断：UI-TARS-desktop 更像“开源可改的 GUI Agent 工程栈”，不是纯 SaaS computer-use API，也不是纯浏览器测试框架。 与 OpenAI Computer Use 相比：OpenAI 官方文档要求用 `computer-use-preview` 模型配 `computer_use_preview` tool，属于 OpenAI Responses/API 生态的托管工具路径（外部来源：https://platform.openai.com/docs/guides/tools-computer-use）。选 OpenAI：你已经在 OpenAI 平台、想少维护本机 operator。选 UI-TARS：你要自己掌控 Electron/TypeScript 源码、使用 UI-TARS/Doubao/Hugging Face OpenAI-compatible VLM endpoint、或要把 MCP/browser/filesystem/commands 改进到自己的 Agent 栈。OpenAI 能力按官方文档自称，本文未实测。 与 Anthropic Computer Use 相比：Anthropic 官方 docs 描述 Claude API 返回 `tool_use`，开发者要提供 Anthropic-schema computer-use tool 实现和 agent loop（外部来源：https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool）。选 Anthropic：你以 Claude 模型和 Anthropic 工具协议为中心。选 UI-TARS：你要模型可换、operator 可换、并希望把 browser/filesystem/commands MCP server 作为同一套工具层来管理。Anthropic 能力按官方文档自称，本文未实测。 与 browser-use 相比：browser-use 官方 GitHub 定位是让网站可被 AI agents 访问、偏 Python/browser automation（外部来源：https://github.com/browser-use/browser-use）。选 browser-use：任务集中在网页、Python 生态、无需桌面应用控制。选 UI-TARS：任务跨本机桌面、浏览器、Android/ADB、Agent TARS MCP 工具，且需要 TypeScript monorepo。browser-use 能力按其 README/仓库自称，本文未克隆实测。 与 Playwright 相比：Playwright 官方文档定位为 Chromium/Firefox/WebKit 单 API 自动化，`npx playwright install` 安装浏览器，偏确定性测试/脚本（外部来源：https://playwright.dev/docs/browsers）。选 Playwright：页面结构已知、断言明确、要稳定 CI。选 UI-TARS：任务是自然语言、视觉定位、未知 UI；代价是模型调用、截图、解析和权限风险更高。Playwright 能力按官方文档自称，本文未实测。

（来源：README/artifactAudit）

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话：最小链路可以从 CLI 跑起来：`npx @ui-tars/cli start`（文档写法），CLI 先拿模型配置，再让你选 `nut-js` 或 `adb`，最后把自然语言任务交给 GUIAgent。技术上：`packages/ui-tars/cli/src/cli/start.ts` 会读 `~/.ui-tars-cli.json`；如果传 `--presets`，它 fetch YAML 并读取 `vlmApiKey`、`vlmBaseUrl`、`vlmModelName`、`useResponsesApi`；没有配置就用 `@clack/prompts` 询问 `baseURL/apiKey/model`，并写回 `~/.ui-tars-cli.json`。随后它选择 operator：`adb` 会 `getAndroidDeviceId()` 后 new `AdbOperator(deviceId)`，默认 `nut-js` 会 new `NutJSOperator()`；再 new `GUIAgent({ model: { baseURL, apiKey, model, useResponsesApi }, operator, signal })`，执行 `await guiAgent.run(answers.instruction)`（来源：packages/ui-tars/cli/src/cli/start.ts）。 真实的一轮执行是：`GUIAgent.run()` 初始化 conversations，把用户 instruction 放入 human message；每轮调用 `operator.screenshot()`，用 Jimp 读出 width/height/mime，把截图作为 human `<image>` 放回 conversations；构造 `vlmParams`，包含 `screenContext: { width, height }`、`scaleFactor`、`uiTarsVersion`、`previousResponseId`；然后 `model.invoke(vlmParams)`（来源：packages/ui-tars/sdk/src/GUIAgent.ts run）。`UITarsModel.invoke()` 会按版本选择 `MAX_PIXELS_V1_5`/`MAX_PIXELS_DOUBAO`/`MAX_PIXELS_V1_0`，对图片做 `preprocessResizeImage()`，`convertToOpenAIMessages()` 把图片变成 `content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,...' }}]`；如果 `useResponsesApi` 为真走 `openai.responses.create()`，否则走 `openai.chat.completions.create()`；模型响应再交给 `actionParser({ prediction, factor, screenContext, scaleFactor, modelVer })`（来源：packages/ui-tars/sdk/src/Model.ts；packages/ui-tars/sdk/src/utils.ts）。 动作解析的例子：默认 prompt 要求模型输出 `Thought: ...` 和 `Action: click(start_box='[x1, y1, x2, y2]')`、`type(content='')`、`scroll(...)`、`finished()` 等；parser 会把 `<point>510 150</point>` 改写成 `start_box`，把 `<bbox>637 964 637 964</bbox>` 改写成坐标串，再把 box 按 `[1000,1000]` 或 UI-TARS-1.5 的 smart resize factor 缩放成 0-1 坐标（来源：packages/ui-tars/sdk/src/constants.ts；packages/ui-tars/action-parser/src/actionParser.ts）。执行时 `parseBoxToScreenCoords()` 取 box 中心点，按屏幕宽高换算成像素；`NutJSOperator.execute()` 对 `click` 移动鼠标并 `mouse.click(Button.LEFT)`，对 `type` 在 Windows 用剪贴板粘贴并在末尾 `\n` 时敲 Enter，对 `scroll down` 执行 `mouse.scrollDown(5 * 100)`（来源：packages/ui-tars/sdk/src/utils.ts；packages/ui-tars/operators/nut-js/src/index.ts）。 Agent TARS 的另一个真实流是：`new AgentTARS({ aioSandbox: 'http://localhost:8080', model: { provider: 'volcengine', id: 'ep-20250510145437-5sxhs', apiKey: process.env.ARK_API_KEY } })`，`initialize()` 后打印 tools，再 `run('Open https://seed-tars.com')`（来源：multimodal/agent-tars/core/examples/aio-sandbox-example.ts）。如果不用 AIO Sandbox，本地环境会按 browser control 初始化 GUI Agent、SearchToolProvider、in-memory MCP server；browser 工具调用前 `onBeforeToolCall()` 会 lazy launch browser，filesystem/command 路径参数会经过 WorkspacePathResolver（来源：multimodal/agent-tars/core/src/agent-tars.ts；multimodal/agent-tars/core/src/environments/local/index.ts）。

## 本质不同的设计取舍

这些不是“照搬项目名”，而是可抽出的工程构件。 - Operator 接口；复制 `Operator.screenshot()` + `Operator.execute(params)` 这层边界：上层 Agent 不知道鼠标、ADB、浏览器、远程 sandbox 的细节，只处理 screenshot/output/action。；如果你的任务只调用 API 或数据库，不需要真实 GUI 状态，就不要引入截图闭环。；它让同一个 GUIAgent 可以换 `NutJSOperator`、`AdbOperator`、`BrowserOperator` 或 AIO operator（来源：packages/ui-tars/sdk/src/types.ts；packages/ui-tars/cli/src/cli/start.ts）。 - Action grammar + parser；保留少量固定动作：`click/drag/hotkey/type/scroll/wait/finished/call_user`，再用 parser 兼容 `<point>`、`<bbox>`、`start_box`、`end_box`。；如果你能拿到结构化 tool call，不必让模型输出 Python-like 字符串再 regex 解析。；GUI 模型经常输出近似格式；这里把格式兼容集中在 `action-parser`，避免散落到 operator（来源：packages/ui-tars/action-parser/src/actionParser.ts）。 - MCP transport adapter；把 MCP Server 包成 SSE + Streamable HTTP：默认 `/sse`、`/message`、`/mcp`，并允许自定义 `routes`、`middlewares`、`createMcpServer(req)`。；如果所有工具都在同进程内，in-memory transport 更简单。；同一套工具可以本地嵌入，也可以远程暴露给 Agent TARS/AIO Sandbox（来源：packages/agent-infra/mcp-http-server/src/startServer.ts）。 - Browser control strategy；把 browser 自动化拆成 `dom`、`visual-grounding`、`hybrid` 三个策略，而不是在 prompt 里让模型自己猜工具。；如果是可预测内部后台系统，Playwright/DOM-first 存在风险更稳定。；`hybrid` 同时注册 GUI Agent tool、navigation/content/visual tools 和部分 MCP browser tools；适合网页结构和视觉元素混合的任务（来源：multimodal/agent-tars/core/src/environments/local/browser/browser-control-strategies/browser-hybrid-strategy.ts）。 - 安全目录树替换；替换 MCP 原生 `directory_tree`，默认 `maxDepth=3`、`maxFiles=1000`，排除 `node_modules/.git/dist/build/.next/coverage/logs` 等。；小型脚本目录不需要这层；但大型 monorepo 很需要。；它直接处理 Agent 上下文爆炸，而不是只在 prompt 里说“少读文件”（来源：multimodal/agent-tars/core/src/environments/local/filesystem/filesystem-tools-manager.ts）。 - Preset 配置格式；把 `language`、`vlmProvider`、`vlmBaseUrl`、`vlmApiKey`、`vlmModelName`、`reportStorageBaseUrl`、`utioBaseUrl` 放进 YAML，可从 file 或 URL 导入。；如果部署环境有强密钥管理，不要把 API key 放进可分发 preset。；配置可迁移，但也暴露密钥分发风险；文档说 URL preset 可启动时自动拉取（来源：docs/preset.md；examples/presets/default.yaml）。

## 对从业者意味着什么

判断：值得 clone-and-run，但先把它当“可拆解的 Agent 工程栈”，不要当开箱即用的可靠桌面机器人。人话：如果你在做 GUI agent、browser agent、MCP 工具编排或多模态 agent UI，这个仓库有很多可直接学习的工程边界；如果你只是要稳定自动化一个网页，Playwright/browser-use 这类更窄工具更省心。技术上：优先跑 `@ui-tars/cli` 的 nut-js 路径和 `multimodal/agent-tars/core/examples/default.ts`/`aio-sandbox-example.ts`，验证模型 endpoint、权限、坐标、MCP tool list，再抽 Operator、action parser、MCP HTTP server、browser strategy 和 safe directory_tree。成熟度给 4 而不是 5：仓库结构、测试、打包脚本都很完整，但 remote operator 已过停止日期，模型服务外置，真实 GUI 任务稳定性未由仓库内可复现实验支撑。

（来源：README/artifactAudit）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/gui-agent]]、[[concepts/visual-grounding]]。另见 [[content/bytedance-ui-tars-desktop]]、[[claims/bytedance-ui-tars-desktop-main-claim]]。
