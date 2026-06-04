---
slug: "microsoft-agent-governance-toolkit-repo"
kind: "artifact"
content: "microsoft-agent-governance-toolkit"
artifact_type: "repo"
url: "https://github.com/microsoft/agent-governance-toolkit"
official_or_third_party: "official"
status: "available"
license: "MIT"
runnable: "yes"
missing_parts:
  - "未运行完整测试和 benchmark"
  - "未核验外部包仓库发布状态"
  - "README/docs/package VERSION 存在版本口径不一致"
  - "性能和红队百分比需要用公开 methodology 或本地复现实验确认"
  - "同进程边界不是 OS 级隔离"
last_checked: "2026-06-03"
---

## Artifact audit

真实上游仓库已克隆检查。它是一个大型 Public Preview agent governance 工具集，包含多语言 SDK、Rust policy-engine/ACS、Python 核心包、框架适配、MCP/协议组件、examples、docs/specs、CI 和 Docker 开发环境。适合深读和试跑，生产采用前必须锁版本、跑目标 adapter、验证 fail-closed 和端到端延迟。

出处:https://github.com/microsoft/agent-governance-toolkit。See [[content/microsoft-agent-governance-toolkit]]。
