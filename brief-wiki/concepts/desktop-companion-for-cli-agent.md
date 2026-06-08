---
name: "CLI Agent 桌面伴侣"
slug: "desktop-companion-for-cli-agent"
kind: "concept"
tags:
  - "desktop"
  - "agent-ui"
  - "cli-wrapper"
maturity: "active"
first_seen_in: "fathah-hermes-desktop"
related_content:
  - "fathah-hermes-desktop"
related_concepts: []
explanation: "人话：把本来要手动装、手动改配置、手动跑命令的 agent 做成桌面入口。术语：Hermes Desktop 通过 Electron UI 管理 `~/.hermes`、Hermes Agent repo、gateway、profiles 和配置文件。"
examples:
  - "安装页调用官方 Hermes install script 并传 `--skip-setup`/`-SkipSetup`。"
  - "聊天失败时 fallback 到 `hermes chat -q ... --source desktop`。"
common_misunderstandings:
  - "不要把 Hermes Desktop 当成新的 agent runtime；agent 行为依赖上游 Hermes Agent。"
open_questions:
  - "与 Hermes Agent 具体版本的兼容矩阵未在 README/docs/tree 说明。"
---

## Explanation

人话：把本来要手动装、手动改配置、手动跑命令的 agent 做成桌面入口。术语：Hermes Desktop 通过 Electron UI 管理 `~/.hermes`、Hermes Agent repo、gateway、profiles 和配置文件。 出处:https://github.com/fathah/hermes-desktop。See [[content/fathah-hermes-desktop]]。

## Supported by
- [[claims/fathah-hermes-desktop-main-claim]]
