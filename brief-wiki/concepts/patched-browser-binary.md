---
name: "patched browser binary"
slug: "patched-browser-binary"
kind: "concept"
tags:
  - "browser-automation"
  - "fingerprint"
  - "binary-distribution"
maturity: "active"
first_seen_in: "cloakhq-cloakbrowser"
related_content:
  - "cloakhq-cloakbrowser"
related_concepts: []
explanation: "人话：不是给普通 Chrome 打启动参数，而是运行一个已经改过源码并重新编译的浏览器。技术词：CloakBrowser wrapper 用 `executable_path`/`executablePath` 指向 CloakHQ 发布的 Chromium binary；README 自称 fingerprint patch 在 C++ source level。"
examples:
  - "`cloakbrowser/browser.py launch()` 调用 `pw.chromium.launch(executable_path=binary_path, ...)`"
  - "`config.py` 当前 `CHROMIUM_VERSION = 146.0.7680.177.5`"
common_misunderstandings:
  - "wrapper MIT 不等于 binary 也可自由再分发。"
  - "有 C++ patch 自称不等于 patch 源码已公开。"
open_questions:
  - "58 个 patch 的源码和测试映射未在 repo tree 公开。"
---

## Explanation

人话：不是给普通 Chrome 打启动参数，而是运行一个已经改过源码并重新编译的浏览器。技术词：CloakBrowser wrapper 用 `executable_path`/`executablePath` 指向 CloakHQ 发布的 Chromium binary；README 自称 fingerprint patch 在 C++ source level。 出处:https://github.com/cloakhq/cloakbrowser。See [[content/cloakhq-cloakbrowser]]。

## Supported by
- [[claims/cloakhq-cloakbrowser-main-claim]]
