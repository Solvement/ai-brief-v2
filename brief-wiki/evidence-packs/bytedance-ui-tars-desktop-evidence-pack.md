---
content: "bytedance-ui-tars-desktop"
kind: "evidence-pack"
title: "UI-TARS-desktop — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "UI-TARS-desktop 是一个把桌面/浏览器截图、视觉语言模型、动作解析器和本机/MCP 工具执行串成闭环的多模态 Agent monorepo。"
    internal_logic: "人话：最小链路可以从 CLI 跑起来：`npx @ui-tars/cli start`（文档写法），CLI 先拿模型配置，再让你选 `nut-js` 或 `adb`，最后把自然语言任务交给 GUIAgent。技术上：`packages/ui-tars/cli/src/cli/start.ts` 会读 `~/.ui-tars-cli.json`；如果传 `--presets`，它 fetch YAML 并读取 `vlmApiKey`、`vlmBaseUrl`、`vlmModelName`、`useResponsesApi`；没有配置就用 `@clack/prompts` 询问 `baseURL/apiKey/model`，并写回 `~/.ui-tars-cli.json`。随后它选择 operator：`adb` 会 `getAndroidDeviceId()` 后 new `AdbOperator(deviceId)`，默认 `nut-js` 会 new `NutJSOperator()`；再 new `GUIAgent({ model: { baseURL, apiKey, model, useResponsesApi }, operator, signal })`，执行 `await guiAgent.run(answers.instruction)`（来源：packages/ui-tars/cli/src/cli/start.ts）。\n\n真实的一轮执行是：`GUIAgent.run()` 初始化 conversations，把用户 instruction 放入 human message；每轮调用 `operator.screenshot()`，用 Jimp 读出 width/height/mime，把截图作为 human `<image>` 放回 conversations；构造 `vlmParams`，包含 `screenContext: { width, height }`、`scaleFactor`、`uiTarsVersion`、`previousResponseId`；然后 `model.invoke(vlmParams)`（来源：packages/ui-tars/sdk/src/GUIAgent.ts run）。`UITarsModel.invoke()` 会按版本选择 `MAX_PIXELS_V1_5`/`MAX_PIXELS_DOUBAO`/`MAX_PIXELS_V1_0`，对图片做 `preprocessResizeImage()`，`convertToOpenAIMessages()` 把图片变成 `content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,...' }}]`；如果 `useResponsesApi` 为真走 `openai.responses.create()`，否则走 `openai.chat.completions.create()`；模型响应再交给 `actionParser({ prediction, factor, screenContext, scaleFactor, modelVer })`（来源：packages/ui-tars/sdk/src/Model.ts；packages/ui-tars/sdk/src/utils.ts）。\n\n动作解析的例子：默认 prompt 要求模型输出 `Thought: ...` 和 `Action: click(start_box='[x1, y1, x2, y2]')`、`type(content='')`、`scroll(...)`、`finished()` 等；parser 会把 `<point>510 150</point>` 改写成 `start_box`，把 `<bbox>637 964 637 964</bbox>` 改写成坐标串，再把 box 按 `[1000,1000]` 或 UI-TARS-1.5 的 smart resize factor 缩放成 0-1 坐标（来源：packages/ui-tars/sdk/src/constants.ts；packages/ui-tars/action-parser/src/actionParser.ts）。执行时 `parseBoxToScreenCoords()` 取 box 中心点，按屏幕宽高换算成像素；`NutJSOperator.execute()` 对 `click` 移动鼠标并 `mouse.click(Button.LEFT)`，对 `type` 在 Windows 用剪贴板粘贴并在末尾 `\\n` 时敲 Enter，对 `scroll down` 执行 `mouse.scrollDown(5 * 100)`（来源：packages/ui-tars/sdk/src/utils.ts；packages/ui-tars/operators/nut-js/src/index.ts）。\n\nAgent TARS 的另一个真实流是：`new AgentTARS({ aioSandbox: 'http://localhost:8080', model: { provider: 'volcengine', id: 'ep-20250510145437-5sxhs', apiKey: process.env.ARK_API_KEY } })`，`initialize()` 后打印 tools，再 `run('Open https://seed-tars.com')`（来源：multimodal/agent-tars/core/examples/aio-sandbox-example.ts）。如果不用 AIO Sandbox，本地环境会按 browser control 初始化 GUI Agent、SearchToolProvider、in-memory MCP server；browser 工具调用前 `onBeforeToolCall()` 会 lazy launch browser，filesystem/command 路径参数会经过 WorkspacePathResolver（来源：multimodal/agent-tars/core/src/agent-tars.ts；multimodal/agent-tars/core/src/environments/local/index.ts）。"
    failure_mode: "docs/setting.md VLM Settings；packages/ui-tars/sdk/src/Model.ts"
    source_pointer: "https://github.com/bytedance/ui-tars-desktop"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/true/Apache-2.0/v0.3.0"
experiments: []
claims:
  - "[[claims/bytedance-ui-tars-desktop-main-claim]]"
artifacts:
  - "[[artifacts/bytedance-ui-tars-desktop-repo]]"
metrics:
  - "stars=36148"
  - "forks=3638"
  - "open_issues=403"
  - "latest_release=v0.3.0"
  - "pushed_at=2026-05-18T02:55:49Z"
baselines: []
failure_modes:
  - "docs/setting.md VLM Settings；packages/ui-tars/sdk/src/Model.ts"
  - "docs/quick-start.md Prerequisites/Install"
  - "docs/quick-start.md Run remote operator"
  - "apps/ui-tars/package.json dependencies；apps/ui-tars/forge.config.ts"
  - "multimodal/agent-tars/core/src/environments/local/index.ts；workspace-path-resolver.ts；filesystem-tools-manager.ts"
  - "docs/setting.md Report Settings/UTIO Base URL"
  - "multimodal/agent-tars/core/src/environments/aio/index.ts；multimodal/agent-tars/core/examples/aio-sandbox-example.ts"
missing_details: []
source_pointers:
  - "https://github.com/bytedance/ui-tars-desktop"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/bytedance-ui-tars-desktop-main-claim]],官方 artifact 落库为 [[artifacts/bytedance-ui-tars-desktop-repo]]。See [[content/bytedance-ui-tars-desktop]]。
