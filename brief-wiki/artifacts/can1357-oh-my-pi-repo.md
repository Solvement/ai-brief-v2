---
slug: "can1357-oh-my-pi-repo"
kind: "artifact"
content: "can1357-oh-my-pi"
artifact_type: "repo"
url: "https://github.com/can1357/oh-my-pi"
official_or_third_party: "official"
status: "available"
license: "MIT"
runnable: "unknown"
missing_parts:
  - "未运行 bun install / bun test / omp --smoke-test"
  - "未验证外部模型、OAuth、MCP server、web_search provider 凭据"
  - "未复算 README benchmark 和 Rust LoC 数字"
last_checked: "2026-06-08"
---

## Artifact audit

已克隆并检查 upstream checkout，HEAD/tag 为 `98c91cfa99d85e0033820583d992dc49283db701` / `v15.10.4`；仓库是 MIT 许可的 Bun + TypeScript + Rust monorepo，CLI 包 `@oh-my-pi/pi-coding-agent` 暴露 `omp`，核心证据来自 README、package/Cargo/Dockerfile、docs/tools、docs/sdk、docs/mcp-config、docs/skills、docs/ttsr、packages/coding-agent 和 packages/hashline。

出处:https://github.com/can1357/oh-my-pi。See [[content/can1357-oh-my-pi]]。
