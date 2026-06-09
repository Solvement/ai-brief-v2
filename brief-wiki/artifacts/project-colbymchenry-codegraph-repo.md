---
slug: "project-colbymchenry-codegraph-repo"
kind: "artifact"
content: "colbymchenry-codegraph"
artifact_type: "repo"
url: "https://github.com/colbymchenry/codegraph"
official_or_third_party: "official"
status: "available"
license: "MIT"
runnable: "yes"
missing_parts:
  - "真实上游未覆盖指定 checkout 根目录；因该目录已有非目标 git remote，读取的是 checkout/upstream-codegraph。"
  - "全量 npm test 在本机 Windows 未通过；build 通过，窄测试 146 passed。"
  - "hosted CodeGraph platform 不在当前 repo 中。"
  - "README benchmark 原始临时矩阵脚本位置写为 /tmp/ab-matrix，repo 内没有完整原始产物。"
last_checked: "2026-06-09"
---

## Artifact audit

已检查 README、site docs、docs/benchmarks、package.json、install scripts、BUNDLING.md、src/bin、src/mcp、src/db、src/sync、src/installer、src/extraction、tests；本地 `npm run build` 通过，installer/staleness/full-pipeline 窄测试 146 个通过。

出处:https://github.com/colbymchenry/codegraph。See [[content/colbymchenry-codegraph]]。
