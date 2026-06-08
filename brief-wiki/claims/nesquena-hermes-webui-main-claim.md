---
text: "“No build step, no framework, no bundler. Just Python and vanilla JS.”"
slug: "nesquena-hermes-webui-main-claim"
kind: "claim"
content: "nesquena-hermes-webui"
source_pointer: "README 顶部介绍；package.json scripts；pyproject.toml header"
evidence_strength: "high"
supports:
  - "sse-chat-stream"
  - "agent-source-boundary"
contradicts: []
open_challenges:
  - "不证明生产环境没有任何外部静态库；仓库 vendored 了 KaTeX、js-yaml 等静态资源。"
  - "如果未来引入构建链，此判断会失效；按 2026-06-08 checkout 核实。"
status: "supported"
---

## Claim

这个 WebUI 不需要前端构建链，开发依赖也没有承担运行时打包职责。

证据:`package.json` 描述为 dev-only tooling，唯一 script 是 `lint:runtime`；`pyproject.toml` 写明不是 packaged distribution、没有 `[build-system]`；运行依赖在 `requirements.txt` 只有 `pyyaml>=6.0` 和 `cryptography>=42.0`。。边界:不证明生产环境没有任何外部静态库；仓库 vendored 了 KaTeX、js-yaml 等静态资源。。风险:如果未来引入构建链，此判断会失效；按 2026-06-08 checkout 核实。。See [[content/nesquena-hermes-webui]]。
