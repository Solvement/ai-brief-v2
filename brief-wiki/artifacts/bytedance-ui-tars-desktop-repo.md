---
slug: "bytedance-ui-tars-desktop-repo"
kind: "artifact"
content: "bytedance-ui-tars-desktop"
artifact_type: "repo"
url: "https://github.com/bytedance/UI-TARS-desktop"
official_or_third_party: "official"
status: "available"
license: "Apache-2.0 at repo root; `packages/agent-infra/mcp-http-server/package.json` declares MIT for that subpackage"
runnable: "unknown"
missing_parts:
  - "未运行安装/测试/构建"
  - "需要 VLM Base URL/API Key/Model Name"
  - "本机 GUI 控制需要 OS 权限"
  - "Remote Operator 文档显示 2025-08-20 停止服务，当前可用性未在仓库说明"
last_checked: "2026-06-08"
---

## Artifact audit

已克隆并检查真实 upstream checkout：`e9f3387288da4af2ad99972da2ac916cdabce093`。仓库是 TypeScript/pnpm monorepo，覆盖 UI-TARS Desktop、UI-TARS SDK/operator/action-parser、Agent TARS、Tarko Agent、agent-infra MCP/browser/filesystem/commands 相关包。

出处:https://github.com/bytedance/ui-tars-desktop。See [[content/bytedance-ui-tars-desktop]]。
