---
slug: "hkuds-vimax-repo"
kind: "artifact"
content: "hkuds-vimax"
artifact_type: "repo"
url: "https://github.com/HKUDS/ViMax"
official_or_third_party: "official"
status: "available"
license: "MIT"
runnable: "unknown"
missing_parts:
  - "端到端运行需要 LLM、image、video API key；本次未运行真实生成。"
  - "未发现 docs/ 目录或独立 examples/ 目录。"
  - "README 中 AutoCameo 缺少已核实源码入口。"
  - "Novel2MoviePipeline 文件顶部仍标注 TODO。"
  - "TUI 入口是 bash 脚本，Windows 原生执行方式未在 README/docs/tree 详细说明。"
last_checked: "2026-06-08"
---

## Artifact audit

已按要求克隆并检查真实上游仓库到 `logs/codex-deepdive-2026-06-08T1732/hkuds-vimax/checkout`。HEAD 为 `89cdc2f69fedb98e3531d95cd054b645bdef85b0`，提交时间 `2026-06-08 22:08:49 +0800`，提交信息 `remove minimax readme section`。仓库包含 Python pipelines、agent_runtime、configs、tests、prompts 和 Ink TUI；许可证文件为 MIT。

出处:https://github.com/hkuds/vimax。See [[content/hkuds-vimax]]。
