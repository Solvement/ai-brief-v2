---
slug: "nesquena-hermes-webui-repo"
kind: "artifact"
content: "nesquena-hermes-webui"
artifact_type: "repo"
url: "https://github.com/nesquena/hermes-webui"
official_or_third_party: "official"
status: "available"
license: "MIT"
runnable: "yes"
missing_parts:
  - "运行聊天需要 Hermes Agent 可导入或已安装；README/bootstrap 会尝试检测或安装。"
  - "真实 provider/API key、本地模型 Base URL、Hermes config.yaml/.env 不随仓库提供。"
  - "Native Windows bootstrap 未官方支持；README 建议 Linux、macOS 或 WSL2，native Windows 为社区路径。"
last_checked: "2026-06-08"
---

## Artifact audit

已克隆并检查 upstream checkout `396d0d0abd5c25ac7d1de8a73f240abb68c7f200`，标签 `v0.51.326`。仓库是 Hermes Agent 的自托管 WebUI，工程重点在浏览器工作台、SSE runtime、审批、profile、workspace、Docker 和兼容性边界。

出处:https://github.com/nesquena/hermes-webui。See [[content/nesquena-hermes-webui]]。
