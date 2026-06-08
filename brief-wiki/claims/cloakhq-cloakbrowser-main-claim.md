---
text: "“Drop-in Playwright/Puppeteer replacement for Python and JavaScript”。"
slug: "cloakhq-cloakbrowser-main-claim"
kind: "claim"
content: "cloakhq-cloakbrowser"
source_pointer: "README Quickstart；cloakbrowser/browser.py launch；js/src/playwright.ts launch；js/src/puppeteer.ts launch"
evidence_strength: "high"
supports:
  - "patched-browser-binary"
  - "fingerprint-seed"
contradicts: []
open_challenges:
  - "不证明所有 Playwright/Puppeteer API 100% 等价，也不证明所有目标网站都可用。"
  - "Playwright 或 Puppeteer 上游 API 变化、CDP 行为变化、浏览器二进制版本不匹配会破坏兼容性。"
status: "supported"
---

## Claim

人话：用户把原来的 Playwright/Puppeteer 启动入口替换成 CloakBrowser 的 `launch()`，后续仍用熟悉的 page/browser API。技术词：wrapper 将自定义 `executable_path`/`executablePath` 注入到 Playwright/Puppeteer launch options。

证据:Python `launch()` 返回 Playwright Browser；JS `launch()` 从 `playwright-core` 导入 `chromium` 并调用 `chromium.launch(await buildLaunchOptions(options))`；Puppeteer 版本调用 `puppeteer.default.launch({ executablePath: binaryPath, ... })`。。边界:不证明所有 Playwright/Puppeteer API 100% 等价，也不证明所有目标网站都可用。。风险:Playwright 或 Puppeteer 上游 API 变化、CDP 行为变化、浏览器二进制版本不匹配会破坏兼容性。。See [[content/cloakhq-cloakbrowser]]。
