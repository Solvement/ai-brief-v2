---
slug: "chopratejas-headroom-repo"
kind: "artifact"
content: "chopratejas-headroom"
artifact_type: "repo"
url: "https://github.com/chopratejas/headroom"
official_or_third_party: "official"
status: "available"
license: "Apache-2.0"
runnable: "yes"
missing_parts:
  - "本次未运行测试或 benchmark"
  - "Windows prebuilt wheels 未在 docs 中标为可用"
  - "README/docs benchmark 数字未做第三方复现"
last_checked: "2026-06-08"
---

## Artifact audit

已按要求读取真实 upstream checkout：本地路径为 `logs/codex-deepdive-20260608-backlog-12/chopratejas-headroom/checkout`，commit `8dbe7ad41b3a1d33c01874be5c1cbc68a5e68111`。仓库包含 Python 包、Rust workspace、TypeScript SDK、FastAPI proxy、MCP server、Docker、docs、examples 和 tests；由于 Windows 长路径限制，checkout 排除了一个 vendored example `node_modules` 树，不影响核心源码和文档检查。

出处:https://github.com/chopratejas/headroom。See [[content/chopratejas-headroom]]。
