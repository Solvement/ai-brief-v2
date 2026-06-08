---
content: "colbymchenry-codegraph"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "devtool_cli"
title: "codegraph — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "colbymchenry/codegraph：GitHub 描述为“Pre-indexed code knowledge graph for Claude Code, Codex, Gemini, Cursor, OpenCode, AntiGravity, Kiro, and Hermes Agent — fewer tokens, fewer tool calls, 100% local”。"
  what_it_does: "Pre-indexed code knowledge graph for Claude Code, Codex, Gemini, Cursor, OpenCode, AntiGravity, Kiro, and Hermes Agent — fewer tokens, fewer tool calls, 100% local"
  metadata:
    language: "TypeScript"
    total_stars: "44567"
    stars_in_period: "42778"
    author: "colbymchenry"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "白话：值得看，不是因为 README 的性能数字本身，而是因为它把“给编程代理找代码上下文”做成了一个完整本地基础设施：索引、增量同步、MCP 工具、代理配置写入、代码片段输出预算、影响半径查询都在同一仓库里。术语：它把静态解析、符号解析、图遍历和 MCP tool surface 串成一条链路；这比单纯 embedding/RAG 或单纯 grep 更接近“代理可调用的代码索引层”。（来源：README How It Works；src/index.ts indexAll/sync；src/mcp/tools.ts；src/installer/targets/registry.ts）"
  core_capabilities:
    - "MCP initialize instructions as single source of truth"
    - "Local graph schema with unresolved reference staging"
    - "Staleness banner instead of silent stale context"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "白话：CodeGraph 最直接的对照不是另一个库，而是代理今天常用的几种找代码方式。1. `ripgrep/Glob/Read/Bash`：README 的 benchmark baseline 就是没有 MCP 时让代理用内置 Read/Grep/Bash；优点是零安装、永远读到磁盘现状，缺点是每次会重新发现路径和调用链。要快速查 1-2 个文件，选 grep/Read；要在中大型仓库反复问调用链、影响面、架构流，选 CodeGraph。（来源：README Full benchmark details）2. Sourcegraph/Cody/Code Search：外部官方资料显示 Sourcegraph 侧重跨仓库/IDE/平台级代码搜索和 Cody 上下文，能力范围更大；CodeGraph 的差异是每项目 `.codegraph/codegraph.db`、MCP stdio、100% 本地 CLI 工作流。要企业级跨仓库搜索和团队平台，选 Sourcegraph；要给本地代理加一个轻量本地代码图工具，选 CodeGraph。（外部资料：Sourcegraph docs，2026-06-08 浏览；本仓库来源：README Configuration/MCP Tools）3. SCIP/LSIF/LSP/ctags 类索引：它们更偏编辑器导航、定义/引用或标准索引格式；CodeGraph 把输出面做成代理工具，如 `codegraph_explore` 返回相关源码、relationship map、blast radius。要标准化代码导航协议或编辑器跳转，选 SCIP/LSP/ctags；要让代理少读文件并带影响半径上下文，选 CodeGraph。（外部资料：SCIP/Universal Ctags docs，2026-06-08 浏览；本仓库来源：src/mcp/tools.ts；src/types.ts）术语：这里的差异维度是 retrieval mechanism、integration path、self-hosting/locality、workflow fit；外部替代项能力未在本仓库内验证。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "白话：真实路径可以按一个项目初始化来走。用户先装 CLI：README 给出 `curl -fsSL .../install.sh | sh`、Windows `irm .../install.ps1 | iex`，或 `npm i -g @colbymchenry/codegraph`。然后 `codegraph install` 写入代理 MCP 配置；例如 Codex 目标写 `~/.codex/config.toml` 的 `[mcp_servers.codegraph]`，Claude 全局写 `~/.claude.json`、本地写 `./.mcp.json`，共同的 server 配置是 `command: codegraph`、`args: ['serve','--mcp']`。（来源：README Get Started；src/installer/targets/codex.ts；src/installer/targets/claude.ts；src/installer/targets/shared.ts） 项目内运行 `codegraph init -i` 时，CLI 的 `init [path]` 命令会调用 `CodeGraph.init(projectPath, { index: false })`，随后实际执行 `cg.indexAll()`；源码注释说明 `-i/--index` 现在保留兼容但初始化默认会建索引。`CodeGraph.init()` 创建 `.codegraph/`，初始化 `.codegraph/codegraph.db`，然后 `indexAll()` 扫描源码文件、抽取 nodes/edges/unresolved refs，运行 resolver，把引用落成 `calls`、`references`、`imports`、`extends` 等边，并写入 `indexed_with_version`、`indexed_with_extraction_version`。（来源：src/bin/codegraph.ts init command；src/index.ts CodeGraph.init/indexAll；src/extraction/index.ts storeExtractionResult；src/db/schema.sql） 具体例子：README 的 `codegraph affected` CI 片段是 `AFFECTED=$(git diff --name-only HEAD | codegraph affected --stdin --quiet)`，CLI 里 `affected [files...]` 读取 stdin 或参数，默认 test pattern 包括 `.spec.`、`.test.`、`/__tests__/`、`/tests?/`、`/e2e/`、`/spec/`，然后从 changed file 做 BFS，调用 `cg.getFileDependents(current.file)` 追踪依赖，默认 `--depth` 是 `5`，最后输出受影响测试文件。（来源：README codegraph affected；src/bin/codegraph.ts affected command；site/src/content/docs/guides/affected-tests.md） 术语：Tree-sitter 是把源码转 AST 的解析器；node 是函数、类、方法、路由等符号；edge 是 `calls`、`contains`、`extends` 等关系；FTS5 是 SQLite 的全文索引；MCP 是代理通过 stdio 调工具的协议。"
  essential_design_difference: "白话：最值得复用的不是具体语言 parser，而是“代理上下文基础设施”的几块拼法。术语：这些是可迁移的架构模式，不等于直接复制实现就能覆盖所有语言。 - MCP initialize instructions as single source of truth；把工具使用策略放到 MCP `initialize` 响应里，而不是到处写 `CLAUDE.md`、`AGENTS.md`。CodeGraph 的 `SERVER_INSTRUCTIONS` 明确写了何时用 `codegraph_explore`、何时用 `codegraph_search`、何时回退 Read。（来源：src/mcp/server-instructions.ts；src/installer/targets/claude.ts issue #529 comments）；如果目标代理不支持或不稳定展示 MCP server instructions，就需要保留文件级 instructions fallback。；减少多份说明漂移，也让 tool selection 规则跟工具版本一起发布。 - Local graph schema with unresolved reference staging；先把未解析引用写进 `unresolved_refs`，再批量解析并创建 `edges`；schema 里节点、边、文件和 unresolved refs 分表。（来源：src/db/schema.sql；src/extraction/index.ts storeExtractionResult；src/resolution/index.ts resolveAndPersistBatched）；小型 demo 或只做全文搜索时不必引入完整图模型。；让解析和跨文件 resolution 解耦，便于增量同步和框架 resolver 后处理。 - Staleness banner instead of silent stale context；当 watcher debounce 期间某个响应引用了 pending file，就在响应顶部提示该文件可能 stale，并让代理 Read 指定文件；未引用的 pending file 放 footer。（来源：src/mcp/tools.ts formatStaleBanner/formatStaleFooter；__tests__/mcp-staleness-banner.test.ts）；如果系统不能准确知道响应引用了哪些文件，banner 会误报或漏报。；代理工具最怕安静地给旧答案；显式 freshness 信号比盲目等待同步更实用。 - Installer target registry；每个代理作为 `AgentTarget`，集中注册在 `ALL_TARGETS`，支持 `auto`、`all`、`none` 和 CSV 解析。（来源：src/installer/targets/registry.ts）；只服务单一 IDE/agent 时不用抽象成 registry。；代理生态配置格式变化快，分 target 文件能把 TOML、JSON、权限、local/global 差异隔离。 - Adaptive explore output budget；`getExploreOutputBudget(fileCount)` 按文件数给 `codegraph_explore` 设置 `maxOutputChars`、`defaultMaxFiles`、`maxCharsPerFile` 等预算，小仓库和大仓库不同。（来源：src/mcp/tools.ts getExploreOutputBudget）；如果调用方没有严格上下文窗口或工具输出上限，预算逻辑收益较小。；把“索引找得准”和“返回内容不爆上下文”分开控制，是面向代理的关键工程细节。"
  practitioner_meaning: "白话：建议抽模式，不建议盲目接入生产关键路径。它的价值在于本地代码图 + MCP 工具 + freshness 信号 + installer target registry 这套组合，对 AI 编程代理基础设施很有参考价值。术语：成熟度给 4，不给 5，是因为源码和测试很多、CHANGELOG 活跃，但 README/docs 存在 backend 口径不一致，且关键性能/覆盖率数字未在本次复现。对 AI-Brief 读者，最可复用的是 staleness banner、MCP initialize instructions、SQLite graph schema、adaptive explore budget，而不是复制某个语言 extractor。（来源：src/mcp/server-instructions.ts；src/mcp/tools.ts；src/db/schema.sql；CHANGELOG Unreleased；README Benchmark Results）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "CodeGraph 是一个把本地代码库预先解析成 SQLite 符号关系图、再通过 CLI/MCP 暴露给 Claude Code、Codex、Cursor 等代理的代码理解工具。"
    body_md: "白话：它不是再让代理临时 `grep`、`Read` 一堆文件，而是先在项目里生成 `.codegraph/codegraph.db`，代理问问题时调用 `codegraph_explore`、`codegraph_search`、`codegraph_impact` 等工具拿结构化上下文。术语：仓库实现了 TypeScript CLI 包 `@colbymchenry/codegraph`，`package.json` 的 `bin` 指向 `./dist/bin/codegraph.js`，数据库 schema 有 `nodes`、`edges`、`files`、`unresolved_refs` 和 FTS5 `nodes_fts`。安装入口是 `codegraph install`，项目入口是 `codegraph init -i`，MCP 入口是 `codegraph serve --mcp`。（来源：README Get Started；README MCP Tools；package.json bin/scripts；src/db/schema.sql）"
  why_worth_attention:
    summary: ""
    body_md: "白话：值得看，不是因为 README 的性能数字本身，而是因为它把“给编程代理找代码上下文”做成了一个完整本地基础设施：索引、增量同步、MCP 工具、代理配置写入、代码片段输出预算、影响半径查询都在同一仓库里。术语：它把静态解析、符号解析、图遍历和 MCP tool surface 串成一条链路；这比单纯 embedding/RAG 或单纯 grep 更接近“代理可调用的代码索引层”。（来源：README How It Works；src/index.ts indexAll/sync；src/mcp/tools.ts；src/installer/targets/registry.ts）"
    bullets:
      - "已核实：MCP 工具面包含 `codegraph_explore`、`codegraph_search`、`codegraph_callers`、`codegraph_callees`、`codegraph_impact`、`codegraph_node`、`codegraph_files`、`codegraph_status`；Claude 权限列表也写了这 8 个工具名。（来源：README MCP Tools；src/installer/targets/shared.ts）"
      - "已核实：索引不是只存文本块；schema 明确存 `nodes`、`edges`、`files`、`unresolved_refs`，并用 FTS5 在 `name`、`qualified_name`、`docstring`、`signature` 上建全文索引。（来源：src/db/schema.sql）"
      - "已核实：安装器有目标注册表，当前 `ALL_TARGETS` 包括 `claude`、`cursor`、`codex`、`opencode`、`hermes`、`gemini`、`antigravity`、`kiro`。（来源：src/installer/targets/registry.ts）"
      - "自称：README 报告 median of 4 runs per arm 后平均 `16% cheaper · 47% fewer tokens · 22% faster · 58% fewer tool calls`；这属于作者基准结论，未在本次复现实验中验证。（来源：README Benchmark Results）"
  key_claims_evidence:
    summary: ""
    body_md: "白话：下面把“能从代码核实的机制”和“README 自称的效果”分开。术语：已核实只表示文件/源码里确实有这个结构或命令；自称表示效果、覆盖率、性能表述来自 README/docs/benchmark 文本，未独立重跑。"
    items:
      - claim: "提供本地 MCP 服务器给代理调用。"
        plain_english: "代理不是直接读数据库，而是通过 `codegraph serve --mcp` 暴露的一组工具访问索引。"
        source: "README CLI Reference；README MCP Tools；src/bin/codegraph.ts serve command；src/installer/targets/shared.ts getMcpServerConfig"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`getMcpServerConfig()` 返回 `{ type: 'stdio', command: 'codegraph', args: ['serve', '--mcp'] }`；README 列出 8 个 MCP 工具。"
        does_not_support: "不证明所有代理实际都能稳定加载，只证明仓库实现了配置写入和 MCP 入口。"
        threat: "不同 MCP 客户端的配置格式和权限模型会变；安装目标文件需要持续维护。"
      - claim: "索引是本地 SQLite 知识图谱，不是远程服务。"
        plain_english: "项目根目录下生成 `.codegraph/codegraph.db`，代码符号和关系存在本地数据库里。"
        source: "README How It Works；README Configuration；src/db/schema.sql；src/directory.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "schema 包含 `nodes`、`edges`、`files`、`unresolved_refs`、`project_metadata`；`createDirectory()` 创建 `.codegraph/` 并写 `.codegraph/.gitignore`。"
        does_not_support: "不证明不会有任何网络访问；只证明索引数据路径和核心存储是本地 SQLite。"
        threat: "本地数据库仍可能暴露敏感结构；CHANGELOG 提到曾修复 symlink 越界读和配置 secret 暴露问题。"
      - claim: "索引流程会扫描、解析、存储、解析引用并维护版本戳。"
        plain_english: "`codegraph init -i` 之后，代码会扫描源文件、用 Tree-sitter/WASM 解析、写入数据库，再把未解析引用转成边。"
        source: "src/index.ts CodeGraph.init/indexAll；src/extraction/index.ts ExtractionOrchestrator.indexAll/storeExtractionResult；src/resolution/index.ts resolveAndPersistBatched"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`indexAll()` 调 `orchestrator.indexAll()`、`resolver.initialize()`、`resolver.runPostExtract()`、`resolveReferencesBatched()`，并写 `indexed_with_version` 和 `indexed_with_extraction_version` metadata。"
        does_not_support: "不保证每种语言的解析完整度；这只核实流程存在。"
        threat: "跨文件解析依赖启发式、导入规则和框架 resolver；复杂动态分发仍会漏边。"
      - claim: "支持多语言文件扩展名自动识别。"
        plain_english: "仓库里有一个扩展名到语言的映射表，不需要项目级语言配置。"
        source: "src/extraction/grammars.ts EXTENSION_MAP/isSourceFile；README Supported Languages"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`EXTENSION_MAP` 覆盖 `.ts`、`.tsx`、`.mts`、`.cts`、`.py`、`.go`、`.rs`、`.java`、`.cs`、`.php`、`.rb`、`.swift`、`.kt`、`.dart`、`.svelte`、`.vue`、`.liquid`、`.lua`、`.luau`、`.m`、`.mm`、`.xml`、`.properties` 等。"
        does_not_support: "README 的 `Full support` 是质量等级声明；仅从映射表不能证明完整支持。"
        threat: "Tree-sitter grammar、WASM ABI、特殊框架语法都会影响真实覆盖率。"
      - claim: "自动同步有 debounce、staleness banner 和 connect-time catch-up。"
        plain_english: "代理改完文件后，索引有一个短窗口可能落后；CodeGraph 用 pending-file 提示让代理只对这些文件回退到直接 Read。"
        source: "README Key Features auto-sync details；site/src/content/docs/guides/indexing.md；src/index.ts watch/getPendingFiles；src/mcp/tools.ts formatStaleBanner；__tests__/mcp-staleness-banner.test.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "README 写默认 `2000ms` debounce、`CODEGRAPH_WATCH_DEBOUNCE_MS` clamp 到 `[100ms, 60s]`；测试覆盖 pending file banner、footer、`codegraph_status` 的 `### Pending sync:`。"
        does_not_support: "测试使用 synthetic watch event，不证明所有 OS 文件事件在所有环境都可靠。"
        threat: "沙箱、网络盘、WSL、巨量文件变更会影响 watcher 行为。"
      - claim: "README 性能基准显示平均更便宜、更少 token、更快、更少工具调用。"
        plain_english: "作者声称 CodeGraph 在 7 个开源代码库上让代理少读文件、少调用工具。"
        source: "README Benchmark Results；README Full benchmark details"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 写 `median of 4 runs per arm`、Opus 4.8、2026-06-02 复核，并列出 VS Code、Excalidraw、Django、Tokio、OkHttp、Gin、Alamofire 的表格。"
        does_not_support: "仓库内未提供可直接复现这些 median 的完整原始运行日志；本次未重跑 `claude -p`。"
        threat: "代理模型、提示、MCP tool definitions、仓库版本和缓存都会改变结果。"
  how_it_works:
    summary: ""
    body_md: "白话：真实路径可以按一个项目初始化来走。用户先装 CLI：README 给出 `curl -fsSL .../install.sh | sh`、Windows `irm .../install.ps1 | iex`，或 `npm i -g @colbymchenry/codegraph`。然后 `codegraph install` 写入代理 MCP 配置；例如 Codex 目标写 `~/.codex/config.toml` 的 `[mcp_servers.codegraph]`，Claude 全局写 `~/.claude.json`、本地写 `./.mcp.json`，共同的 server 配置是 `command: codegraph`、`args: ['serve','--mcp']`。（来源：README Get Started；src/installer/targets/codex.ts；src/installer/targets/claude.ts；src/installer/targets/shared.ts）\n\n项目内运行 `codegraph init -i` 时，CLI 的 `init [path]` 命令会调用 `CodeGraph.init(projectPath, { index: false })`，随后实际执行 `cg.indexAll()`；源码注释说明 `-i/--index` 现在保留兼容但初始化默认会建索引。`CodeGraph.init()` 创建 `.codegraph/`，初始化 `.codegraph/codegraph.db`，然后 `indexAll()` 扫描源码文件、抽取 nodes/edges/unresolved refs，运行 resolver，把引用落成 `calls`、`references`、`imports`、`extends` 等边，并写入 `indexed_with_version`、`indexed_with_extraction_version`。（来源：src/bin/codegraph.ts init command；src/index.ts CodeGraph.init/indexAll；src/extraction/index.ts storeExtractionResult；src/db/schema.sql）\n\n具体例子：README 的 `codegraph affected` CI 片段是 `AFFECTED=$(git diff --name-only HEAD | codegraph affected --stdin --quiet)`，CLI 里 `affected [files...]` 读取 stdin 或参数，默认 test pattern 包括 `.spec.`、`.test.`、`/__tests__/`、`/tests?/`、`/e2e/`、`/spec/`，然后从 changed file 做 BFS，调用 `cg.getFileDependents(current.file)` 追踪依赖，默认 `--depth` 是 `5`，最后输出受影响测试文件。（来源：README codegraph affected；src/bin/codegraph.ts affected command；site/src/content/docs/guides/affected-tests.md）\n\n术语：Tree-sitter 是把源码转 AST 的解析器；node 是函数、类、方法、路由等符号；edge 是 `calls`、`contains`、`extends` 等关系；FTS5 是 SQLite 的全文索引；MCP 是代理通过 stdio 调工具的协议。"
  reusable_abstractions:
    summary: ""
    body_md: "白话：最值得复用的不是具体语言 parser，而是“代理上下文基础设施”的几块拼法。术语：这些是可迁移的架构模式，不等于直接复制实现就能覆盖所有语言。"
    items:
      - name: "MCP initialize instructions as single source of truth"
        copy: "把工具使用策略放到 MCP `initialize` 响应里，而不是到处写 `CLAUDE.md`、`AGENTS.md`。CodeGraph 的 `SERVER_INSTRUCTIONS` 明确写了何时用 `codegraph_explore`、何时用 `codegraph_search`、何时回退 Read。（来源：src/mcp/server-instructions.ts；src/installer/targets/claude.ts issue #529 comments）"
        skip: "如果目标代理不支持或不稳定展示 MCP server instructions，就需要保留文件级 instructions fallback。"
        why_it_matters: "减少多份说明漂移，也让 tool selection 规则跟工具版本一起发布。"
      - name: "Local graph schema with unresolved reference staging"
        copy: "先把未解析引用写进 `unresolved_refs`，再批量解析并创建 `edges`；schema 里节点、边、文件和 unresolved refs 分表。（来源：src/db/schema.sql；src/extraction/index.ts storeExtractionResult；src/resolution/index.ts resolveAndPersistBatched）"
        skip: "小型 demo 或只做全文搜索时不必引入完整图模型。"
        why_it_matters: "让解析和跨文件 resolution 解耦，便于增量同步和框架 resolver 后处理。"
      - name: "Staleness banner instead of silent stale context"
        copy: "当 watcher debounce 期间某个响应引用了 pending file，就在响应顶部提示该文件可能 stale，并让代理 Read 指定文件；未引用的 pending file 放 footer。（来源：src/mcp/tools.ts formatStaleBanner/formatStaleFooter；__tests__/mcp-staleness-banner.test.ts）"
        skip: "如果系统不能准确知道响应引用了哪些文件，banner 会误报或漏报。"
        why_it_matters: "代理工具最怕安静地给旧答案；显式 freshness 信号比盲目等待同步更实用。"
      - name: "Installer target registry"
        copy: "每个代理作为 `AgentTarget`，集中注册在 `ALL_TARGETS`，支持 `auto`、`all`、`none` 和 CSV 解析。（来源：src/installer/targets/registry.ts）"
        skip: "只服务单一 IDE/agent 时不用抽象成 registry。"
        why_it_matters: "代理生态配置格式变化快，分 target 文件能把 TOML、JSON、权限、local/global 差异隔离。"
      - name: "Adaptive explore output budget"
        copy: "`getExploreOutputBudget(fileCount)` 按文件数给 `codegraph_explore` 设置 `maxOutputChars`、`defaultMaxFiles`、`maxCharsPerFile` 等预算，小仓库和大仓库不同。（来源：src/mcp/tools.ts getExploreOutputBudget）"
        skip: "如果调用方没有严格上下文窗口或工具输出上限，预算逻辑收益较小。"
        why_it_matters: "把“索引找得准”和“返回内容不爆上下文”分开控制，是面向代理的关键工程细节。"
  dependency_platform_risk:
    summary: ""
    body_md: "白话：主要风险来自运行时、WASM parser、SQLite、文件 watcher 和各代理配置格式。术语：这些是运行时/平台依赖，不是业务逻辑依赖。"
    items:
      - dependency: "Node runtime and `node:sqlite`"
        what_if_change: "库模式要求调用方 runtime 支持 Node 22.5+ 的 `node:sqlite`；CLI/MCP 作者说使用自带 runtime。若 Node 版本或 `node:sqlite` 行为变化，数据库打开会失败。"
        exposure: "high"
        mitigation_or_unknown: "源码在 `createDatabase()` 失败时给出安装 self-contained release 或 Node 22.5+ 的错误；`package.json engines` 是 `>=20.0.0 <25.0.0`，但源码注释又说 source requires Node >=22.5，存在文档/配置口径需要确认。"
        source: "src/db/sqlite-adapter.ts；README Library Usage；package.json engines；src/bin/node-version-check.ts"
      - dependency: "web-tree-sitter and WASM grammars"
        what_if_change: "语言解析依赖 `web-tree-sitter`、`tree-sitter-wasms` 和 vendored wasm；grammar ABI 或 AST 形状变化会影响 node/edge 抽取。"
        exposure: "high"
        mitigation_or_unknown: "源码按语言懒加载 grammar，并对 C#、Lua、Luau、Pascal、Scala 使用本地 wasm 路径；parse worker 有 `PARSE_TIMEOUT_MS = 10_000` 和 `WORKER_RECYCLE_INTERVAL = 250`。"
        source: "src/extraction/grammars.ts；src/extraction/index.ts"
      - dependency: "SQLite WAL and local filesystem"
        what_if_change: "WAL、mmap、busy timeout、文件锁在网络盘、WSL、虚拟化挂载上可能不一致；并发写可能影响 MCP 查询。"
        exposure: "medium"
        mitigation_or_unknown: "连接设置 `busy_timeout = 5000`、`journal_mode = WAL`、`mmap_size = 268435456`；`getJournalMode()` 会报告实际 journal mode。"
        source: "src/db/index.ts configureConnection/getJournalMode；README Troubleshooting"
      - dependency: "Native file watcher"
        what_if_change: "FSEvents、inotify、ReadDirectoryChangesW 或沙箱限制导致自动同步延迟或失败。"
        exposure: "medium"
        mitigation_or_unknown: "README/docs 提供 `CODEGRAPH_WATCH_DEBOUNCE_MS` 和 `CODEGRAPH_NO_DAEMON=1` 手动 `codegraph sync` fallback；staleness banner 降低 stale response 风险。"
        source: "README Key Features auto-sync；site/src/content/docs/guides/indexing.md；src/index.ts watch"
      - dependency: "Agent configuration formats"
        what_if_change: "Claude、Codex、Cursor、Gemini 等配置路径或 schema 改动会让自动安装失效。"
        exposure: "medium"
        mitigation_or_unknown: "仓库为每个 target 单独实现，如 Codex 写 `~/.codex/config.toml`，Claude 写 `~/.claude.json` 或 `./.mcp.json`；但外部代理版本变化仍需跟进。"
        source: "src/installer/targets/codex.ts；src/installer/targets/claude.ts；src/installer/targets/registry.ts"
  unknowns_to_confirm:
    summary: ""
    body_md: "白话：这些点不能从 README/docs/tree 直接确认，不能补成事实。术语：unknown 是证据缺口，不是否定。"
    items:
      - "README benchmark 的完整原始运行日志未在仓库主树中发现；README 提到矩阵 driver/parser 在 `/tmp/ab-matrix/`，不属于此 checkout。（来源：README Full benchmark details）"
      - "site docs 的 `core-concepts/how-it-works.md` 仍说 `better-sqlite3`/WASM fallback，但源码 `src/db/sqlite-adapter.ts` 说当前只有 `node:sqlite`、无 wasm fallback；需要维护者确认 docs 是否过期。"
      - "README 顶部提到 “The CodeGraph platform is coming” 和 getcodegraph.com hosted product；仓库中没有 hosted product 的实现细节。（来源：README top section）"
      - "本次未执行 `npm test`、`npm run build` 或真实 `codegraph init -i`；可运行性判断来自 package scripts、源码和 README 命令。"
      - "各语言 `Full support` 和 coverage 百分比来自 README/CHANGELOG 自称；本次只核实了扩展名映射、grammar 加载和测试/源码存在。"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 4
    body_md: "白话：建议抽模式，不建议盲目接入生产关键路径。它的价值在于本地代码图 + MCP 工具 + freshness 信号 + installer target registry 这套组合，对 AI 编程代理基础设施很有参考价值。术语：成熟度给 4，不给 5，是因为源码和测试很多、CHANGELOG 活跃，但 README/docs 存在 backend 口径不一致，且关键性能/覆盖率数字未在本次复现。对 AI-Brief 读者，最可复用的是 staleness banner、MCP initialize instructions、SQLite graph schema、adaptive explore budget，而不是复制某个语言 extractor。（来源：src/mcp/server-instructions.ts；src/mcp/tools.ts；src/db/schema.sql；CHANGELOG Unreleased；README Benchmark Results）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\colbymchenry-codegraph\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\colbymchenry-codegraph\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\colbymchenry-codegraph\\codex-last-message.json"
  invoked_at: "2026-06-08T14:51:26.645Z"
  completed_at: "2026-06-08T14:55:46.414Z"
  repo: "colbymchenry/codegraph"
reasoning_trace:
  paper_type_decision: "project_type = devtool_cli; evidence from README/artifactAudit only."
  central_contribution: "Pre-indexed code knowledge graph for Claude Code, Codex, Gemini, Cursor, OpenCode, AntiGravity, Kiro, and Hermes Agent — fewer tokens, fewer tool calls, 100% local"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "提供本地 MCP 服务器给代理调用。"
    - "索引是本地 SQLite 知识图谱，不是远程服务。"
    - "索引流程会扫描、解析、存储、解析引用并维护版本戳。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "src/db/sqlite-adapter.ts；README Library Usage；package.json engines；src/bin/node-version-check.ts"
    - "src/extraction/grammars.ts；src/extraction/index.ts"
    - "src/db/index.ts configureConnection/getJournalMode；README Troubleshooting"
    - "README Key Features auto-sync；site/src/content/docs/guides/indexing.md；src/index.ts watch"
    - "src/installer/targets/codex.ts；src/installer/targets/claude.ts；src/installer/targets/registry.ts"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 4
  main_risk: "白话：建议抽模式，不建议盲目接入生产关键路径。它的价值在于本地代码图 + MCP 工具 + freshness 信号 + installer target registry 这套组合，对 AI 编程代理基础设施很有参考价值。术语：成熟度给 4，不给 5，是因为源码和测试很多、CHANGELOG 活跃，但 README/docs 存在 backend 口径不一致，且关键性能/覆盖率数字未在本次复现。对 AI-Brief 读者，最可复用的是 staleness banner、MCP initialize instructions、SQLite graph schema、adaptive explore budget，而不是复制某个语言 extractor。（来源：src/mcp/server-instructions.ts；src/mcp/tools.ts；src/db/schema.sql；CHANGELOG Unreleased；README Benchmark Results）"
next_actions:
  - "extract-pattern"
unknowns:
  - "README benchmark 的完整原始运行日志未在仓库主树中发现；README 提到矩阵 driver/parser 在 `/tmp/ab-matrix/`，不属于此 checkout。（来源：README Full benchmark details）"
  - "site docs 的 `core-concepts/how-it-works.md` 仍说 `better-sqlite3`/WASM fallback，但源码 `src/db/sqlite-adapter.ts` 说当前只有 `node:sqlite`、无 wasm fallback；需要维护者确认 docs 是否过期。"
  - "README 顶部提到 “The CodeGraph platform is coming” 和 getcodegraph.com hosted product；仓库中没有 hosted product 的实现细节。（来源：README top section）"
  - "本次未执行 `npm test`、`npm run build` 或真实 `codegraph init -i`；可运行性判断来自 package scripts、源码和 README 命令。"
  - "各语言 `Full support` 和 coverage 百分比来自 README/CHANGELOG 自称；本次只核实了扩展名映射、grammar 加载和测试/源码存在。"
builder_reuse:
  pattern: "MCP initialize instructions as single source of truth"
  copy: "把工具使用策略放到 MCP `initialize` 响应里，而不是到处写 `CLAUDE.md`、`AGENTS.md`。CodeGraph 的 `SERVER_INSTRUCTIONS` 明确写了何时用 `codegraph_explore`、何时用 `codegraph_search`、何时回退 Read。（来源：src/mcp/server-instructions.ts；src/installer/targets/claude.ts issue #529 comments）"
  skip: "如果目标代理不支持或不稳定展示 MCP server instructions，就需要保留文件级 instructions fallback。"
  why_it_matters: "减少多份说明漂移，也让 tool selection 规则跟工具版本一起发布。"
dependency_platform_risk:
  dependency: "Node runtime and `node:sqlite`"
  what_if_change: "库模式要求调用方 runtime 支持 Node 22.5+ 的 `node:sqlite`；CLI/MCP 作者说使用自带 runtime。若 Node 版本或 `node:sqlite` 行为变化，数据库打开会失败。"
  exposure: "high"
  mitigation_or_unknown: "源码在 `createDatabase()` 失败时给出安装 self-contained release 或 Node 22.5+ 的错误；`package.json engines` 是 `>=20.0.0 <25.0.0`，但源码注释又说 source requires Node >=22.5，存在文档/配置口径需要确认。"
claim_ledger:
  - claim: "提供本地 MCP 服务器给代理调用。"
    plain_english: "代理不是直接读数据库，而是通过 `codegraph serve --mcp` 暴露的一组工具访问索引。"
    source: "README CLI Reference；README MCP Tools；src/bin/codegraph.ts serve command；src/installer/targets/shared.ts getMcpServerConfig"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`getMcpServerConfig()` 返回 `{ type: 'stdio', command: 'codegraph', args: ['serve', '--mcp'] }`；README 列出 8 个 MCP 工具。"
    does_not_support: "不证明所有代理实际都能稳定加载，只证明仓库实现了配置写入和 MCP 入口。"
    threat: "不同 MCP 客户端的配置格式和权限模型会变；安装目标文件需要持续维护。"
  - claim: "索引是本地 SQLite 知识图谱，不是远程服务。"
    plain_english: "项目根目录下生成 `.codegraph/codegraph.db`，代码符号和关系存在本地数据库里。"
    source: "README How It Works；README Configuration；src/db/schema.sql；src/directory.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "schema 包含 `nodes`、`edges`、`files`、`unresolved_refs`、`project_metadata`；`createDirectory()` 创建 `.codegraph/` 并写 `.codegraph/.gitignore`。"
    does_not_support: "不证明不会有任何网络访问；只证明索引数据路径和核心存储是本地 SQLite。"
    threat: "本地数据库仍可能暴露敏感结构；CHANGELOG 提到曾修复 symlink 越界读和配置 secret 暴露问题。"
  - claim: "索引流程会扫描、解析、存储、解析引用并维护版本戳。"
    plain_english: "`codegraph init -i` 之后，代码会扫描源文件、用 Tree-sitter/WASM 解析、写入数据库，再把未解析引用转成边。"
    source: "src/index.ts CodeGraph.init/indexAll；src/extraction/index.ts ExtractionOrchestrator.indexAll/storeExtractionResult；src/resolution/index.ts resolveAndPersistBatched"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`indexAll()` 调 `orchestrator.indexAll()`、`resolver.initialize()`、`resolver.runPostExtract()`、`resolveReferencesBatched()`，并写 `indexed_with_version` 和 `indexed_with_extraction_version` metadata。"
    does_not_support: "不保证每种语言的解析完整度；这只核实流程存在。"
    threat: "跨文件解析依赖启发式、导入规则和框架 resolver；复杂动态分发仍会漏边。"
  - claim: "支持多语言文件扩展名自动识别。"
    plain_english: "仓库里有一个扩展名到语言的映射表，不需要项目级语言配置。"
    source: "src/extraction/grammars.ts EXTENSION_MAP/isSourceFile；README Supported Languages"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`EXTENSION_MAP` 覆盖 `.ts`、`.tsx`、`.mts`、`.cts`、`.py`、`.go`、`.rs`、`.java`、`.cs`、`.php`、`.rb`、`.swift`、`.kt`、`.dart`、`.svelte`、`.vue`、`.liquid`、`.lua`、`.luau`、`.m`、`.mm`、`.xml`、`.properties` 等。"
    does_not_support: "README 的 `Full support` 是质量等级声明；仅从映射表不能证明完整支持。"
    threat: "Tree-sitter grammar、WASM ABI、特殊框架语法都会影响真实覆盖率。"
  - claim: "自动同步有 debounce、staleness banner 和 connect-time catch-up。"
    plain_english: "代理改完文件后，索引有一个短窗口可能落后；CodeGraph 用 pending-file 提示让代理只对这些文件回退到直接 Read。"
    source: "README Key Features auto-sync details；site/src/content/docs/guides/indexing.md；src/index.ts watch/getPendingFiles；src/mcp/tools.ts formatStaleBanner；__tests__/mcp-staleness-banner.test.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "README 写默认 `2000ms` debounce、`CODEGRAPH_WATCH_DEBOUNCE_MS` clamp 到 `[100ms, 60s]`；测试覆盖 pending file banner、footer、`codegraph_status` 的 `### Pending sync:`。"
    does_not_support: "测试使用 synthetic watch event，不证明所有 OS 文件事件在所有环境都可靠。"
    threat: "沙箱、网络盘、WSL、巨量文件变更会影响 watcher 行为。"
  - claim: "README 性能基准显示平均更便宜、更少 token、更快、更少工具调用。"
    plain_english: "作者声称 CodeGraph 在 7 个开源代码库上让代理少读文件、少调用工具。"
    source: "README Benchmark Results；README Full benchmark details"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 写 `median of 4 runs per arm`、Opus 4.8、2026-06-02 复核，并列出 VS Code、Excalidraw、Django、Tokio、OkHttp、Gin、Alamofire 的表格。"
    does_not_support: "仓库内未提供可直接复现这些 median 的完整原始运行日志；本次未重跑 `claude -p`。"
    threat: "代理模型、提示、MCP tool definitions、仓库版本和缓存都会改变结果。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 55: 白话：CodeGraph 最直接的对照不是另一个库，而是代理今天常用的几种找代码方式。1. `ripgrep/Glob/Read/Bash`：README 的 benchmark baseline 就是没有 MCP 时让代理用内置 Read/Grep/Bash；优点是零安装..."
artifact_audit:
  official_repo: "https://github.com/colbymchenry/codegraph"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "reproducible"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

colbymchenry/codegraph：GitHub 描述为“Pre-indexed code knowledge graph for Claude Code, Codex, Gemini, Cursor, OpenCode, AntiGravity, Kiro, and Hermes Agent — fewer tokens, fewer tool calls, 100% local”。

（来源：README/artifactAudit）

## 干什么

Pre-indexed code knowledge graph for Claude Code, Codex, Gemini, Cursor, OpenCode, AntiGravity, Kiro, and Hermes Agent — fewer tokens, fewer tool calls, 100% local

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | TypeScript |
| total_stars | 44567 |
| stars_in_period | 42778 |
| author | colbymchenry |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

白话：值得看，不是因为 README 的性能数字本身，而是因为它把“给编程代理找代码上下文”做成了一个完整本地基础设施：索引、增量同步、MCP 工具、代理配置写入、代码片段输出预算、影响半径查询都在同一仓库里。术语：它把静态解析、符号解析、图遍历和 MCP tool surface 串成一条链路；这比单纯 embedding/RAG 或单纯 grep 更接近“代理可调用的代码索引层”。（来源：README How It Works；src/index.ts indexAll/sync；src/mcp/tools.ts；src/installer/targets/registry.ts）

## 核心能力

- MCP initialize instructions as single source of truth（来源：数据不足）
- Local graph schema with unresolved reference staging（来源：数据不足）
- Staleness banner instead of silent stale context（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

白话：CodeGraph 最直接的对照不是另一个库，而是代理今天常用的几种找代码方式。1. `ripgrep/Glob/Read/Bash`：README 的 benchmark baseline 就是没有 MCP 时让代理用内置 Read/Grep/Bash；优点是零安装、永远读到磁盘现状，缺点是每次会重新发现路径和调用链。要快速查 1-2 个文件，选 grep/Read；要在中大型仓库反复问调用链、影响面、架构流，选 CodeGraph。（来源：README Full benchmark details）2. Sourcegraph/Cody/Code Search：外部官方资料显示 Sourcegraph 侧重跨仓库/IDE/平台级代码搜索和 Cody 上下文，能力范围更大；CodeGraph 的差异是每项目 `.codegraph/codegraph.db`、MCP stdio、100% 本地 CLI 工作流。要企业级跨仓库搜索和团队平台，选 Sourcegraph；要给本地代理加一个轻量本地代码图工具，选 CodeGraph。（外部资料：Sourcegraph docs，2026-06-08 浏览；本仓库来源：README Configuration/MCP Tools）3. SCIP/LSIF/LSP/ctags 类索引：它们更偏编辑器导航、定义/引用或标准索引格式；CodeGraph 把输出面做成代理工具，如 `codegraph_explore` 返回相关源码、relationship map、blast radius。要标准化代码导航协议或编辑器跳转，选 SCIP/LSP/ctags；要让代理少读文件并带影响半径上下文，选 CodeGraph。（外部资料：SCIP/Universal Ctags docs，2026-06-08 浏览；本仓库来源：src/mcp/tools.ts；src/types.ts）术语：这里的差异维度是 retrieval mechanism、integration path、self-hosting/locality、workflow fit；外部替代项能力未在本仓库内验证。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

白话：真实路径可以按一个项目初始化来走。用户先装 CLI：README 给出 `curl -fsSL .../install.sh | sh`、Windows `irm .../install.ps1 | iex`，或 `npm i -g @colbymchenry/codegraph`。然后 `codegraph install` 写入代理 MCP 配置；例如 Codex 目标写 `~/.codex/config.toml` 的 `[mcp_servers.codegraph]`，Claude 全局写 `~/.claude.json`、本地写 `./.mcp.json`，共同的 server 配置是 `command: codegraph`、`args: ['serve','--mcp']`。（来源：README Get Started；src/installer/targets/codex.ts；src/installer/targets/claude.ts；src/installer/targets/shared.ts） 项目内运行 `codegraph init -i` 时，CLI 的 `init [path]` 命令会调用 `CodeGraph.init(projectPath, { index: false })`，随后实际执行 `cg.indexAll()`；源码注释说明 `-i/--index` 现在保留兼容但初始化默认会建索引。`CodeGraph.init()` 创建 `.codegraph/`，初始化 `.codegraph/codegraph.db`，然后 `indexAll()` 扫描源码文件、抽取 nodes/edges/unresolved refs，运行 resolver，把引用落成 `calls`、`references`、`imports`、`extends` 等边，并写入 `indexed_with_version`、`indexed_with_extraction_version`。（来源：src/bin/codegraph.ts init command；src/index.ts CodeGraph.init/indexAll；src/extraction/index.ts storeExtractionResult；src/db/schema.sql） 具体例子：README 的 `codegraph affected` CI 片段是 `AFFECTED=$(git diff --name-only HEAD | codegraph affected --stdin --quiet)`，CLI 里 `affected [files...]` 读取 stdin 或参数，默认 test pattern 包括 `.spec.`、`.test.`、`/__tests__/`、`/tests?/`、`/e2e/`、`/spec/`，然后从 changed file 做 BFS，调用 `cg.getFileDependents(current.file)` 追踪依赖，默认 `--depth` 是 `5`，最后输出受影响测试文件。（来源：README codegraph affected；src/bin/codegraph.ts affected command；site/src/content/docs/guides/affected-tests.md） 术语：Tree-sitter 是把源码转 AST 的解析器；node 是函数、类、方法、路由等符号；edge 是 `calls`、`contains`、`extends` 等关系；FTS5 是 SQLite 的全文索引；MCP 是代理通过 stdio 调工具的协议。

## 本质不同的设计取舍

白话：最值得复用的不是具体语言 parser，而是“代理上下文基础设施”的几块拼法。术语：这些是可迁移的架构模式，不等于直接复制实现就能覆盖所有语言。 - MCP initialize instructions as single source of truth；把工具使用策略放到 MCP `initialize` 响应里，而不是到处写 `CLAUDE.md`、`AGENTS.md`。CodeGraph 的 `SERVER_INSTRUCTIONS` 明确写了何时用 `codegraph_explore`、何时用 `codegraph_search`、何时回退 Read。（来源：src/mcp/server-instructions.ts；src/installer/targets/claude.ts issue #529 comments）；如果目标代理不支持或不稳定展示 MCP server instructions，就需要保留文件级 instructions fallback。；减少多份说明漂移，也让 tool selection 规则跟工具版本一起发布。 - Local graph schema with unresolved reference staging；先把未解析引用写进 `unresolved_refs`，再批量解析并创建 `edges`；schema 里节点、边、文件和 unresolved refs 分表。（来源：src/db/schema.sql；src/extraction/index.ts storeExtractionResult；src/resolution/index.ts resolveAndPersistBatched）；小型 demo 或只做全文搜索时不必引入完整图模型。；让解析和跨文件 resolution 解耦，便于增量同步和框架 resolver 后处理。 - Staleness banner instead of silent stale context；当 watcher debounce 期间某个响应引用了 pending file，就在响应顶部提示该文件存在风险 stale，并让代理 Read 指定文件；未引用的 pending file 放 footer。（来源：src/mcp/tools.ts formatStaleBanner/formatStaleFooter；__tests__/mcp-staleness-banner.test.ts）；如果系统不能准确知道响应引用了哪些文件，banner 会误报或漏报。；代理工具最怕安静地给旧答案；显式 freshness 信号比盲目等待同步更实用。 - Installer target registry；每个代理作为 `AgentTarget`，集中注册在 `ALL_TARGETS`，支持 `auto`、`all`、`none` 和 CSV 解析。（来源：src/installer/targets/registry.ts）；只服务单一 IDE/agent 时不用抽象成 registry。；代理生态配置格式变化快，分 target 文件能把 TOML、JSON、权限、local/global 差异隔离。 - Adaptive explore output budget；`getExploreOutputBudget(fileCount)` 按文件数给 `codegraph_explore` 设置 `maxOutputChars`、`defaultMaxFiles`、`maxCharsPerFile` 等预算，小仓库和大仓库不同。（来源：src/mcp/tools.ts getExploreOutputBudget）；如果调用方没有严格上下文窗口或工具输出上限，预算逻辑收益较小。；把“索引找得准”和“返回内容不爆上下文”分开控制，是面向代理的关键工程细节。

## 对从业者意味着什么

白话：建议抽模式，不建议盲目接入生产关键路径。它的价值在于本地代码图 + MCP 工具 + freshness 信号 + installer target registry 这套组合，对 AI 编程代理基础设施很有参考价值。术语：成熟度给 4，不给 5，是因为源码和测试很多、CHANGELOG 活跃，但 README/docs 存在 backend 口径不一致，且关键性能/覆盖率数字未在本次复现。对 AI-Brief 读者，最可复用的是 staleness banner、MCP initialize instructions、SQLite graph schema、adaptive explore budget，而不是复制某个语言 extractor。（来源：src/mcp/server-instructions.ts；src/mcp/tools.ts；src/db/schema.sql；CHANGELOG Unreleased；README Benchmark Results）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/mcp-code-index]]、[[concepts/sqlite-knowledge-graph]]。另见 [[content/colbymchenry-codegraph]]、[[claims/colbymchenry-codegraph-main-claim]]。
