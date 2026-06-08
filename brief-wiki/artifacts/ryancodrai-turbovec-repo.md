---
slug: "ryancodrai-turbovec-repo"
kind: "artifact"
content: "ryancodrai-turbovec"
artifact_type: "repo"
url: "https://github.com/RyanCodrai/turbovec"
official_or_third_party: "official"
status: "available"
license: "MIT"
runnable: "unknown"
missing_parts:
  - "本次只读检查，未执行 cargo build、cargo test、pytest、maturin build 或 benchmark。"
  - "README 提供 `pip install turbovec`、`cargo add turbovec`、`maturin build --release` 和 benchmark 命令，但本次未验证。"
last_checked: "2026-06-08"
---

## Artifact audit

已克隆并检查 upstream checkout `efe29a184986cbf562a9847c2ac52a2990bfaca2`。仓库包含 Rust core、Python bindings、docs、framework integrations、benchmarks/results 和 tests；核心价值是本地压缩向量索引、稳定 ID、kernel-level filtered search 和 RAG 框架适配。

出处:https://github.com/ryancodrai/turbovec。See [[content/ryancodrai-turbovec]]。
