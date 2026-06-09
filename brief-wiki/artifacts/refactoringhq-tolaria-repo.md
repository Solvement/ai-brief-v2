---
slug: "refactoringhq-tolaria-repo"
kind: "artifact"
content: "refactoringhq-tolaria"
artifact_type: "repo"
url: "https://github.com/refactoringhq/tolaria"
official_or_third_party: "official"
status: "available"
license: "AGPL-3.0-or-later"
runnable: "yes"
missing_parts:
  - "未本地运行桌面应用"
  - "未验证 release 安装包"
  - "未实测外部 CLI 登录与 MCP client 兼容性"
  - "未找到公开性能 benchmark"
last_checked: "2026-06-09"
---

## Artifact audit

已按要求克隆并检查真实 upstream 仓库：README、docs/ARCHITECTURE、docs/ABSTRACTIONS、ADR、package/Cargo/Tauri 配置、mcp-server、AI adapter、vault/cache 源码、demo vault 和测试文件。结论：Tolaria 是本地优先 Markdown 知识库桌面应用，AI 价值在 MCP/CLI agent/权限/vault context 的工程组合。

出处:https://github.com/refactoringhq/tolaria。See [[content/refactoringhq-tolaria]]。
