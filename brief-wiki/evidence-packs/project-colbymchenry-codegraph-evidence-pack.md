---
content: "colbymchenry-codegraph"
kind: "evidence-pack"
title: "codegraph — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "CodeGraph 是给 AI 编程 agent 用的本地代码知识图谱 CLI/MCP：先把仓库解析成 SQLite 节点和边，再让 agent 用 codegraph_explore 等工具少 grep、少 Read。"
    internal_logic: "```mermaid\nflowchart TD\n  A[项目源码] --> B[扫描过滤]\n  B --> C[TreeSitter解析]\n  C --> D[未解析引用]\n  D --> E[框架和导入解析]\n  E --> F[SQLite图]\n  F --> G[MCP工具]\n  G --> H[Agent回答或编辑]\n  A --> I[文件变更]\n  I --> J[Watcher同步]\n  J --> F\n  J --> K[Stale提示]\n  K --> H\n```\n\n真实流：`__tests__/integration/full-pipeline.test.ts` 生成约 120 个 TS 模块，`indexAll()` 后搜索 `entry` 和 `fn50`，再用 `getCallers(fn0)`、`buildContext(\"entry function chain\")` 验证图能被查询；随后 `sync()` 处理三类变更：新增 `src/consumer.ts`、修改 `src/mod0.ts` 加 `newHelper`、删除 `src/mod1.ts`。（来源：__tests__/integration/full-pipeline.test.ts）\n\n最小使用路径是：\n```bash\ncodegraph init -i\ncodegraph serve --mcp\n```\n第一行建 `.codegraph/codegraph.db`，第二行把 MCP 工具暴露给 agent；installer 写入的实际命令也是 `codegraph` + `serve --mcp`。（来源：README CLI Reference；src/installer/targets/shared.ts）"
    failure_mode: "package.json engines；src/bin/codegraph.ts node-version gate；src/db/sqlite-adapter.ts；本地测试 warning"
    source_pointer: "https://github.com/colbymchenry/codegraph"
pipeline_steps:
  - "project_type 分诊:devtool_cli"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/MIT/v0.9.9"
experiments: []
claims:
  - "[[claims/colbymchenry-codegraph-main-claim-2]]"
artifacts:
  - "[[artifacts/project-colbymchenry-codegraph-repo]]"
metrics:
  - "stars=44809"
  - "forks=2758"
  - "open_issues=206"
  - "latest_release=v0.9.9"
  - "pushed_at=2026-06-08T23:31:52Z"
baselines: []
failure_modes:
  - "package.json engines；src/bin/codegraph.ts node-version gate；src/db/sqlite-adapter.ts；本地测试 warning"
  - "src/sync/watch-policy.ts；site/src/content/docs/guides/indexing.md"
  - "src/installer/targets/*.ts；__tests__/installer-targets.test.ts"
  - "install.sh；install.ps1；BUNDLING.md"
  - "本地 npm ci 输出；package.json dependencies"
  - "README Methodology；docs/benchmarks/codegraph-ab-matrix.md"
missing_details: []
source_pointers:
  - "https://github.com/colbymchenry/codegraph"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/colbymchenry-codegraph-main-claim-2]],官方 artifact 落库为 [[artifacts/project-colbymchenry-codegraph-repo]]。See [[content/colbymchenry-codegraph]]。
