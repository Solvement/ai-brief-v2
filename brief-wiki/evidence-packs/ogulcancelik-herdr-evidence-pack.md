---
content: "ogulcancelik-herdr"
kind: "evidence-pack"
title: "herdr — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Herdr 是一个面向 AI coding agents 的 Rust 终端复用器，用 workspace/tab/pane、后台 session server、agent 状态识别和本地 socket API，把多个终端里的 agent 工作流放在一个 TUI 里管理。"
    internal_logic: "人话：Herdr 启动后默认连到一个后台 server；client 可以 detach，server 继续托管 pane 进程。界面上把项目组织成 workspaces，workspace 里有 tabs，tab 里有 panes。agent 状态来自三路信号：前台进程识别、终端屏幕启发式、hook/plugin/socket 上报。agent 或脚本优先用 CLI wrapper；需要长连接或精细控制时才用 raw socket。术语：Unix domain socket 是本机进程通信通道；newline-delimited JSON 是一行一个 JSON request/response；semantic state 是影响 wait、notification、rollup 的状态字段，不等同于 UI 上的 custom_status。（来源：README core concepts；docs/socket-api.mdx Choose an integration layer / Socket transport / Agent state reporting；docs/integrations.mdx How Herdr uses integrations）"
    failure_mode: "src/detect/agents/mod.rs；docs/integrations.mdx"
    source_pointer: "https://github.com/ogulcancelik/herdr"
pipeline_steps:
  - "project_type 分诊:devtool_cli"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/NOASSERTION/v0.6.7"
experiments: []
claims:
  - "[[claims/ogulcancelik-herdr-main-claim]]"
artifacts:
  - "[[artifacts/ogulcancelik-herdr-repo]]"
metrics:
  - "stars=4012"
  - "forks=256"
  - "open_issues=23"
  - "latest_release=v0.6.7"
  - "pushed_at=2026-06-03T12:23:50Z"
baselines: []
failure_modes:
  - "src/detect/agents/mod.rs；docs/integrations.mdx"
  - "docs/install.mdx；docs/configuration.mdx"
  - "LICENSE header；Cargo.toml license"
  - "README development；本次 shell: cargo command not found"
missing_details: []
source_pointers:
  - "https://github.com/ogulcancelik/herdr"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/ogulcancelik-herdr-main-claim]],官方 artifact 落库为 [[artifacts/ogulcancelik-herdr-repo]]。See [[content/ogulcancelik-herdr]]。
