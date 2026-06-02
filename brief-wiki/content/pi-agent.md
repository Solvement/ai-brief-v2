---
title: "pi — 程序员的命令行 AI 编程 agent + 统一 LLM 工具箱"
slug: pi-agent
kind: content
type: project
source: github-trending:weekly
url: https://github.com/badlogic/pi-mono
authors_or_creators:
  - Mario Zechner (badlogic, libGDX 作者)
  - earendil-works
date: "2026-05-29"
discovered_at: "2026-06-01"
content_track: FDE
status: deep_dived
project_kind: functional_software
tags:
  - coding-agent
  - llm-api
  - cli
  - supply-chain-security
importance: 5
why_discovered: "GitHub trending 本周在涨(58.7k star,最新 release v0.78.0 = 2026-05-29,3 天前);coding agent 工具箱,贴 FDE。"
why_selected: "过 triage + 够新:不是 demo——monorepo 分层(CLI/runtime/统一 LLM API/TUI)、225 releases、4387 commits、MIT、有测试与 CI。两个稀缺亮点:①统一多 provider LLM API 抽象 ②供应链安全硬功夫(exact pinning + shrinkwrap + 定时 npm audit)。作者 badlogic(libGDX 作者)。验证 project_type=devtool_cli 分诊,且是『现抓最新』的示范。"
relation_to_existing_memory: extends_existing
---

## Summary

pi 是一套**给程序员的 AI 工具箱**,旗舰是一个交互式命令行 coding agent(能调工具、带状态、可自我扩展写新技能),底下是一个 monorepo:`pi-coding-agent`(CLI)/`pi-agent-core`(runtime,tool calling + 状态)/`pi-ai`(**统一多 provider LLM API**,一套接口调 OpenAI/Anthropic/Google 等)/`pi-tui`(终端 UI 库)。工程上以**供应链安全**著称:依赖精确锁定 + npm-shrinkwrap + 预提交锁文件校验 + 隔离 release smoke test + 定时 npm audit。TypeScript,MIT,225 releases(v0.78.0 @ 2026-05-29),4387 commits,7k forks。出处:github.com/badlogic/pi-mono(earendil-works/pi,2026-06-01 核验)。

## Pipeline
- [[source-packs/pi-agent-source-pack]]
- [[evidence-packs/pi-agent-evidence-pack]]
- [[deep-dives/pi-agent-deep-dive]]

## Concepts
- [[concepts/unified-llm-api]]
- [[concepts/supply-chain-hardening]]

## Claims
- [[claims/pi-agent-depth-in-plumbing]]

## Artifacts
- [[artifacts/pi-agent-repo]]
