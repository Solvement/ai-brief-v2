---
slug: "ogulcancelik-herdr-repo"
kind: "artifact"
content: "ogulcancelik-herdr"
artifact_type: "repo"
url: "https://github.com/ogulcancelik/herdr"
official_or_third_party: "official"
status: "available"
license: "AGPL-3.0-or-later；LICENSE 另写 commercial licenses are available for organizations that cannot comply with AGPL"
runnable: "unknown"
missing_parts:
  - "本次环境未安装 cargo，无法执行 cargo test --locked"
  - "未实测 release binary 或包管理器安装"
  - "未实测外部 agent 集成"
last_checked: "2026-06-03"
---

## Artifact audit

已克隆真实上游仓库到指定 checkout；HEAD 为 e05bd5cb2a26e3690d73ca241e1e457d3eb664cb，最新本地 tag 列表包含 v0.6.7。仓库是 Rust CLI/TUI 项目，Cargo.toml 版本 0.6.7，README/docs/source 显示核心是终端复用、agent 状态识别、本地 socket API、官方集成和 session/remote 工作流。

出处:https://github.com/ogulcancelik/herdr。See [[content/ogulcancelik-herdr]]。
