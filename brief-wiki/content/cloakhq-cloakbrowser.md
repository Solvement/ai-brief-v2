---
title: "CloakBrowser — Stealth Chromium that passes every bot detection tes..."
slug: "cloakhq-cloakbrowser"
kind: "content"
type: "project"
source: "github-trending:monthly"
url: "https://github.com/CloakHQ/CloakBrowser"
authors_or_creators:
  - "CloakHQ"
date: "2026-05-21"
discovered_at: "2026-06-08"
content_track: "FDE"
status: "deep_dived"
project_kind: "functional_software"
tags:
  - "tier-3"
  - "project"
  - "agents"
  - "cli"
  - "deep"
  - "library-sdk"
  - "python"
importance: 4
why_discovered: "CloakHQ/CloakBrowser came from github-trending:monthly; ranking=score=83; max=deep; final=deep"
why_selected: "CloakBrowser 是一个 Python/JavaScript 浏览器自动化 SDK，用 Playwright/Puppeteer 风格 API 启动 CloakHQ 自己分发的 patched Chromium 二进制，并把 fingerprint、proxy、GeoIP、humanize、CDP server 等反检测相关配置封装成启动参数。"
relation_to_existing_memory: "extends_existing"
---

## Summary

CloakBrowser 是一个 Python/JavaScript 浏览器自动化 SDK，用 Playwright/Puppeteer 风格 API 启动 CloakHQ 自己分发的 patched Chromium 二进制，并把 fingerprint、proxy、GeoIP、humanize、CDP server 等反检测相关配置封装成启动参数。

## Pipeline
- [[source-packs/cloakhq-cloakbrowser-source-pack]]
- [[evidence-packs/cloakhq-cloakbrowser-evidence-pack]]
- [[deep-dives/cloakhq-cloakbrowser-deep-dive]]

## Concepts
- [[concepts/patched-browser-binary]]
- [[concepts/fingerprint-seed]]

## Claims
- [[claims/cloakhq-cloakbrowser-main-claim]]

## Artifacts
- [[artifacts/cloakhq-cloakbrowser-repo]]
