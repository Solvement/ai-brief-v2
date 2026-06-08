---
slug: "cloakhq-cloakbrowser-repo"
kind: "artifact"
content: "cloakhq-cloakbrowser"
artifact_type: "repo"
url: "https://github.com/CloakHQ/CloakBrowser"
official_or_third_party: "official"
status: "available"
license: "Wrapper code: MIT. Compiled CloakBrowser Chromium binary: CloakBrowser Binary License v1.0, free internal use but no redistribution/resell/repackage; OEM/SaaS license required for third-party hosted/browser-as-a-service use."
runnable: "unknown"
missing_parts:
  - "未在本次下载/运行 patched Chromium binary。"
  - "未运行 live detection tests。"
  - "Chromium patch 源码未在 repo tree 中公开。"
  - "CloakBrowser Manager 另 repo 未检查。"
last_checked: "2026-06-08"
---

## Artifact audit

已按要求克隆并检查 upstream 到 `logs/codex-deepdive-20260608-backlog-12/cloakhq-cloakbrowser/checkout`。本地 HEAD 为 `dcf9ba55d6e0ded03975ada8481d607ef5d10a00`，最近提交 `feat(widevine): auto-seed CDM hint file for persistent contexts (Linux)`；读取了 README、CHANGELOG、LICENSE、BINARY-LICENSE、pyproject、Dockerfile、Python/JS source、examples、tests。

出处:https://github.com/cloakhq/cloakbrowser。See [[content/cloakhq-cloakbrowser]]。
