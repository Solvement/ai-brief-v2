---
content: "colbymchenry-codegraph"
kind: "evidence-pack"
title: "codegraph — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "CodeGraph 是一个把本地代码库预先解析成 SQLite 符号关系图、再通过 CLI/MCP 暴露给 Claude Code、Codex、Cursor 等代理的代码理解工具。"
    internal_logic: "白话：真实路径可以按一个项目初始化来走。用户先装 CLI：README 给出 `curl -fsSL .../install.sh | sh`、Windows `irm .../install.ps1 | iex`，或 `npm i -g @colbymchenry/codegraph`。然后 `codegraph install` 写入代理 MCP 配置；例如 Codex 目标写 `~/.codex/config.toml` 的 `[mcp_servers.codegraph]`，Claude 全局写 `~/.claude.json`、本地写 `./.mcp.json`，共同的 server 配置是 `command: codegraph`、`args: ['serve','--mcp']`。（来源：README Get Started；src/installer/targets/codex.ts；src/installer/targets/claude.ts；src/installer/targets/shared.ts）\n\n项目内运行 `codegraph init -i` 时，CLI 的 `init [path]` 命令会调用 `CodeGraph.init(projectPath, { index: false })`，随后实际执行 `cg.indexAll()`；源码注释说明 `-i/--index` 现在保留兼容但初始化默认会建索引。`CodeGraph.init()` 创建 `.codegraph/`，初始化 `.codegraph/codegraph.db`，然后 `indexAll()` 扫描源码文件、抽取 nodes/edges/unresolved refs，运行 resolver，把引用落成 `calls`、`references`、`imports`、`extends` 等边，并写入 `indexed_with_version`、`indexed_with_extraction_version`。（来源：src/bin/codegraph.ts init command；src/index.ts CodeGraph.init/indexAll；src/extraction/index.ts storeExtractionResult；src/db/schema.sql）\n\n具体例子：README 的 `codegraph affected` CI 片段是 `AFFECTED=$(git diff --name-only HEAD | codegraph affected --stdin --quiet)`，CLI 里 `affected [files...]` 读取 stdin 或参数，默认 test pattern 包括 `.spec.`、`.test.`、`/__tests__/`、`/tests?/`、`/e2e/`、`/spec/`，然后从 changed file 做 BFS，调用 `cg.getFileDependents(current.file)` 追踪依赖，默认 `--depth` 是 `5`，最后输出受影响测试文件。（来源：README codegraph affected；src/bin/codegraph.ts affected command；site/src/content/docs/guides/affected-tests.md）\n\n术语：Tree-sitter 是把源码转 AST 的解析器；node 是函数、类、方法、路由等符号；edge 是 `calls`、`contains`、`extends` 等关系；FTS5 是 SQLite 的全文索引；MCP 是代理通过 stdio 调工具的协议。"
    failure_mode: "src/db/sqlite-adapter.ts；README Library Usage；package.json engines；src/bin/node-version-check.ts"
    source_pointer: "https://github.com/colbymchenry/codegraph"
pipeline_steps:
  - "project_type 分诊:devtool_cli"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/false/MIT/v0.9.9"
experiments: []
claims:
  - "[[claims/colbymchenry-codegraph-main-claim]]"
artifacts:
  - "[[artifacts/colbymchenry-codegraph-repo]]"
metrics:
  - "stars=44567"
  - "forks=2744"
  - "open_issues=205"
  - "latest_release=v0.9.9"
  - "pushed_at=2026-06-08T05:25:22Z"
baselines: []
failure_modes:
  - "src/db/sqlite-adapter.ts；README Library Usage；package.json engines；src/bin/node-version-check.ts"
  - "src/extraction/grammars.ts；src/extraction/index.ts"
  - "src/db/index.ts configureConnection/getJournalMode；README Troubleshooting"
  - "README Key Features auto-sync；site/src/content/docs/guides/indexing.md；src/index.ts watch"
  - "src/installer/targets/codex.ts；src/installer/targets/claude.ts；src/installer/targets/registry.ts"
missing_details: []
source_pointers:
  - "https://github.com/colbymchenry/codegraph"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/colbymchenry-codegraph-main-claim]],官方 artifact 落库为 [[artifacts/colbymchenry-codegraph-repo]]。See [[content/colbymchenry-codegraph]]。
