---
text: "CLI 可安装并以 `omp` 运行。"
slug: "can1357-oh-my-pi-main-claim-2"
kind: "claim"
content: "can1357-oh-my-pi"
source_pointer: "packages/coding-agent/package.json bin；README Install"
evidence_strength: "high"
supports:
  - "hashline-editing"
  - "unified-read-path"
contradicts: []
open_challenges:
  - "我未实际执行安装、登录模型或跑一次真实任务。"
  - "安装脚本、平台二进制、模型凭据流程仍需在目标机器复验。"
status: "supported"
---

## Claim

包名是 `@oh-my-pi/pi-coding-agent`，`bin` 把 `omp` 指到 `src/cli.ts`；README 给出 curl、Homebrew、Bun、Windows PowerShell、mise 五种安装入口。

证据:`bin: { "omp": "src/cli.ts" }`；`bun install -g @oh-my-pi/pi-coding-agent`。。边界:我未实际执行安装、登录模型或跑一次真实任务。。风险:安装脚本、平台二进制、模型凭据流程仍需在目标机器复验。。See [[content/can1357-oh-my-pi]]。
