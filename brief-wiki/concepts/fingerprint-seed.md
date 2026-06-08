---
name: "fingerprint seed"
slug: "fingerprint-seed"
kind: "concept"
tags:
  - "fingerprint"
  - "session-isolation"
  - "cdp"
maturity: "active"
first_seen_in: "cloakhq-cloakbrowser"
related_content:
  - "cloakhq-cloakbrowser"
related_concepts: []
explanation: "人话：用一个 seed 生成一套浏览器身份；同一个 seed 可复用同一类信号。技术词：默认 `get_default_stealth_args()` 生成 `--fingerprint=<10000..99999>`，`cloakserve` 也允许 `?fingerprint=11111` 路由到单独 Chrome 进程。"
examples:
  - "`--fingerprint=12345`"
  - "`pw.chromium.connect_over_cdp(\"http://localhost:9222?fingerprint=11111\")`"
common_misunderstandings:
  - "seed 不是账号身份，也不能替代 cookie/profile 管理。"
  - "同 seed 首次参数会赢；README 写 same seed reuses same process，first connection's params win。"
open_questions:
  - "seed 到具体 GPU/screen/device-memory 生成规则在二进制内，repo wrapper 未公开。"
---

## Explanation

人话：用一个 seed 生成一套浏览器身份；同一个 seed 可复用同一类信号。技术词：默认 `get_default_stealth_args()` 生成 `--fingerprint=<10000..99999>`，`cloakserve` 也允许 `?fingerprint=11111` 路由到单独 Chrome 进程。 出处:https://github.com/cloakhq/cloakbrowser。See [[content/cloakhq-cloakbrowser]]。

## Supported by
- [[claims/cloakhq-cloakbrowser-main-claim]]
