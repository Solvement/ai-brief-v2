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
    total_stars: "44809"
    stars_in_period: "42778"
    author: "colbymchenry"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "它值得关注，不是因为又做了一个代码搜索，而是因为它把 agent 的上下文获取路径也改了：MCP initialize 里直接告诉 agent 优先用 `codegraph_explore`，不要重复 grep/read。对做 AI 应用的人，这是一种可复用的“工具使用纪律 + 本地结构索引”组合。（来源：src/mcp/server-instructions.ts；src/mcp/tools.ts）"
  core_capabilities:
    - "MCP initialize 工具纪律"
    - "Staleness banner"
    - "Agent target registry"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "Sourcegraph Cody：官方文档说 Cody context 来自 keyword search、Sourcegraph Search API、Code Graph，并可用 managed 或 self-hosted Sourcegraph 搜索栈。取舍：要公司级跨仓库搜索和 Sourcegraph 生态，选 Cody；要本地 `.codegraph`、任意 MCP agent、无外部服务，选 CodeGraph。该差异来自官方文档，未跑同题对比。（来源：Sourcegraph Cody Context docs https://sourcegraph.com/docs/cody/core-concepts/context；README 100% Local） Cursor Codebase Indexing：Cursor 文档说它为每个文件计算 embeddings，打开项目自动索引，新文件增量索引，并提到服务器侧取 embeddings 后解密片段。取舍：要 Cursor IDE 内置体验和 PR search，选 Cursor；要结构化 callers/callees/impact、可接 Codex/Claude/opencode 等外部 agent，选 CodeGraph。（来源：Cursor Codebase Indexing docs https://docs.cursor.com/zh/context/codebase-indexing；src/mcp/tools.ts） Aider Repomap：Aider 文档说 repo map 会把重要类、函数、签名和关键定义行随请求发给 LLM。取舍：要轻量、随 Aider 编辑循环走，选 Aider；要持久 SQLite 图、MCP 工具、watcher stale banner，选 CodeGraph。（来源：Aider Repository map docs https://aider.chat/docs/repomap.html；src/db/schema.sql；src/sync/watcher.ts）"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "```mermaid flowchart TD A[项目源码] --> B[扫描过滤] B --> C[TreeSitter解析] C --> D[未解析引用] D --> E[框架和导入解析] E --> F[SQLite图] F --> G[MCP工具] G --> H[Agent回答或编辑] A --> I[文件变更] I --> J[Watcher同步] J --> F J --> K[Stale提示] K --> H ``` 真实流：`__tests__/integration/full-pipeline.test.ts` 生成约 120 个 TS 模块，`indexAll()` 后搜索 `entry` 和 `fn50`，再用 `getCallers(fn0)`、`buildContext(\"entry function chain\")` 验证图能被查询；随后 `sync()` 处理三类变更：新增 `src/consumer.ts`、修改 `src/mod0.ts` 加 `newHelper`、删除 `src/mod1.ts`。（来源：__tests__/integration/full-pipeline.test.ts） 最小使用路径是： ```bash codegraph init -i codegraph serve --mcp ``` 第一行建 `.codegraph/codegraph.db`，第二行把 MCP 工具暴露给 agent；installer 写入的实际命令也是 `codegraph` + `serve --mcp`。（来源：README CLI Reference；src/installer/targets/shared.ts）"
  essential_design_difference: "最值得复用的不是某个 parser，而是这些“agent 基础设施模式”：预索引、工具纪律、stale 信号、按客户端写配置。 - MCP initialize 工具纪律；把工具选择规则放到 MCP server 的 initialize 指令里，例如“结构问题先用 explore，读文件用 node file 模式”。；如果你的工具只给人类 UI 用，不直接给 agent 调用，就不需要这层系统提示。；减少 agent 自己发明 grep/read 流程的概率；CodeGraph 把 exact text 集中在 `src/mcp/server-instructions.ts`。（来源：src/mcp/server-instructions.ts） - Staleness banner；索引延迟不可避免时，不阻塞查询，而是在响应顶部标出待同步文件，让 agent 只 Read 那些文件。；如果你的数据源是强一致事务库，没必要加这个复杂度。；它解决的是 agent 场景里的危险问题：不是慢，而是静默错；测试覆盖 banner、footer、status 三种表现。（来源：src/sync/watcher.ts；__tests__/mcp-staleness-banner.test.ts） - Agent target registry；每个客户端一个 target 模块，统一实现 detect/install/uninstall/printConfig。；如果只支持一个客户端，直接写配置即可。；客户端配置漂移很快；registry 让 Codex TOML、Claude JSON、Cursor rules、Antigravity legacy/unified path 分开演进。（来源：src/installer/targets/types.ts；src/installer/targets/registry.ts） - 本地图 schema 加 FTS；把代码对象拆成 nodes、edges、files、unresolved_refs，再用 FTS5 查 symbol/docstring/signature。；如果只做全文语义搜索，向量库更简单。；结构边让 callers/callees/impact 这类工具有明确语义，不只是相似片段召回。（来源：src/db/schema.sql） - Affected tests CLI；用依赖图从变更文件反查受影响测试，例如 `git diff --name-only | codegraph affected --stdin --quiet`。；如果项目已有成熟 Bazel/Pants/Nx affected pipeline，可不重复造。；这是 AI agent 之外的直接工程收益：把图谱用于 CI/test selection。（来源：README codegraph affected；src/bin/codegraph.ts affected command）"
  practitioner_meaning: "判断：值得读源码和抽模式，暂不建议只因热度就直接生产依赖。最可复用的是 MCP 工具纪律、stale banner、installer target registry、本地图 schema；最需要警惕的是客户端兼容、watcher 平台差异、全量测试在 Windows 的失败和 npm audit 风险。（来源：src/mcp/server-instructions.ts；src/sync/watcher.ts；本地 build/test 验证）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "CodeGraph 是给 AI 编程 agent 用的本地代码知识图谱 CLI/MCP：先把仓库解析成 SQLite 节点和边，再让 agent 用 codegraph_explore 等工具少 grep、少 Read。"
    body_md: "人话：它把“临时翻代码”变成“先建索引再查询”。术语：TypeScript CLI + MCP server + tree-sitter 解析 + SQLite/FTS5 图数据库；入口命令包括 `codegraph install`、`codegraph init -i`、`codegraph serve --mcp`。（来源：README Get Started；src/bin/codegraph.ts Commands；src/db/schema.sql）"
  why_worth_attention:
    summary: ""
    body_md: "它值得关注，不是因为又做了一个代码搜索，而是因为它把 agent 的上下文获取路径也改了：MCP initialize 里直接告诉 agent 优先用 `codegraph_explore`，不要重复 grep/read。对做 AI 应用的人，这是一种可复用的“工具使用纪律 + 本地结构索引”组合。（来源：src/mcp/server-instructions.ts；src/mcp/tools.ts）"
    bullets:
      - "痛点明确：Claude/Codex/Cursor 这类 agent 经常先 `find/grep/read` 扫一圈，CodeGraph 试图把这部分变成一次结构化查询。（来源：README Why CodeGraph）"
      - "机制具体：本地 `.codegraph/codegraph.db` 存 `nodes`、`edges`、`files`、`unresolved_refs`，并用 `nodes_fts` 做全文索引。（来源：src/db/schema.sql）"
      - "接入面宽：installer registry 明列 Claude、Cursor、Codex、opencode、Hermes、Gemini、Antigravity、Kiro 八个 target，公共 MCP 命令是 `codegraph serve --mcp`。（来源：src/installer/targets/registry.ts；src/installer/targets/shared.ts）"
      - "工程细节比 README 更实：watcher 有 pending-file stale banner，测试里验证“引用到待同步文件时加 banner，未引用时放 footer”。（来源：src/sync/watcher.ts；__tests__/mcp-staleness-banner.test.ts）"
  key_claims_evidence:
    summary: ""
    body_md: "下面把 README 的强主张和源码可核实事实拆开。benchmark 数字按作者自称处理；schema、命令、target、测试按本地 checkout 已核实处理。"
    items:
      - claim: "可以通过 MCP 接入多个 agent。"
        plain_english: "不是只给 Claude Code 写死的插件；installer target 是模块化 registry。"
        source: "src/installer/targets/registry.ts；src/installer/targets/shared.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "ALL_TARGETS 包含 claude、cursor、codex、opencode、hermes、gemini、antigravity、kiro；公共配置返回 command `codegraph` 和 args `serve --mcp`。"
        does_not_support: "没有证明这些客户端在 2026-06-09 的最新版本全部可用。"
        threat: "各 agent 配置格式会变；Antigravity 文件里已写到 unified/legacy config 路径迁移。"
      - claim: "本地知识图谱落在 SQLite，而不是外部服务。"
        plain_english: "你的项目结构被存成节点表、边表、文件表，再由 MCP 工具查。"
        source: "src/db/schema.sql；site/src/content/docs/getting-started/configuration.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "schema 有 nodes、edges、files、unresolved_refs、project_metadata；配置文档写 per-project 数据在 `.codegraph/`，数据库为 `codegraph.db`。"
        does_not_support: "不等于对所有源码内容都不会进入 agent 上下文；工具返回代码片段时仍会暴露给当前 agent。"
        threat: "SQLite WAL 在网络盘/WSL 边界仍有 README troubleshooting 提到的锁风险。"
      - claim: "自动同步能避免 agent 静默读到旧索引。"
        plain_english: "文件变了但索引还没更新时，工具响应会告诉 agent 哪些文件可能旧。"
        source: "README How auto-syncing works；src/sync/watcher.ts；src/mcp/tools.ts；__tests__/mcp-staleness-banner.test.ts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "watcher 默认 debounce 2000ms；pendingFiles 记录 firstSeenMs/lastSeenMs/indexing；测试 5 个用例通过，覆盖 banner、footer、pending sync status。"
        does_not_support: "没有证明所有真实编辑器/文件系统事件都稳定触发。"
        threat: "Windows/WSL/macOS/Linux watcher 行为不同；全量测试在本机 Windows 出现 watcher/daemon 相关失败。"
      - claim: "README 自称平均 16% 更便宜、47% 更少 tokens、22% 更快、58% 更少工具调用。"
        plain_english: "这是作者 benchmark 结论，不是第三方复现。"
        source: "README Benchmark Results；README Methodology"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 写 7 个真实开源仓库、每 arm 4 次、取 median；with 为 CodeGraph MCP，without 为空 MCP config。"
        does_not_support: "不支持把该数字推广到所有模型、所有任务、所有 agent。"
        threat: "benchmark 依赖 Claude Opus 4.8、prompt、工具策略和 repo 状态；run-to-run variance README 自己也承认存在。"
      - claim: "支持多语言和框架路径解析。"
        plain_english: "它不只索引 TS；源码里有多语言 extractor 和 framework resolver。"
        source: "README Supported Languages；src/extraction/languages/index.ts；src/resolution/frameworks/index.ts"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 表列出 TypeScript、JavaScript、Python、Go、Rust、Java、C#、PHP、Ruby、C/C++、Objective-C、Swift、Kotlin、Scala、Dart、Svelte、Vue、Liquid、Pascal/Delphi、Lua、Luau 等；源码有对应 extractor/专用 extractor 文件。"
        does_not_support: "README 的 coverage 百分比未由我独立复测；Objective-C 在 README 标为 partial。"
        threat: "静态分析天然受动态分派、反射、DI、运行时路由约束。"
      - claim: "项目可构建，核心窄测试可过。"
        plain_english: "不是只有文档；本地 checkout 可以编译，关键路径测试可跑。"
        source: "本地验证：npm run build；npx vitest run installer-targets mcp-staleness-banner integration/full-pipeline"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`npm run build` 通过；3 个测试文件、146 个测试通过，覆盖 installer targets、staleness banner、init/index/resolve/search/callers/context/sync。"
        does_not_support: "全量 `npm test` 未通过。"
        threat: "全量测试第一次运行失败，包含 dist 未 build 的 CLI 测试、Windows Temp EPERM、watcher/daemon 超时；`npm ci` 还报告 8 个 audit vulnerabilities。"
  how_it_works:
    summary: ""
    body_md: "```mermaid\nflowchart TD\n  A[项目源码] --> B[扫描过滤]\n  B --> C[TreeSitter解析]\n  C --> D[未解析引用]\n  D --> E[框架和导入解析]\n  E --> F[SQLite图]\n  F --> G[MCP工具]\n  G --> H[Agent回答或编辑]\n  A --> I[文件变更]\n  I --> J[Watcher同步]\n  J --> F\n  J --> K[Stale提示]\n  K --> H\n```\n\n真实流：`__tests__/integration/full-pipeline.test.ts` 生成约 120 个 TS 模块，`indexAll()` 后搜索 `entry` 和 `fn50`，再用 `getCallers(fn0)`、`buildContext(\"entry function chain\")` 验证图能被查询；随后 `sync()` 处理三类变更：新增 `src/consumer.ts`、修改 `src/mod0.ts` 加 `newHelper`、删除 `src/mod1.ts`。（来源：__tests__/integration/full-pipeline.test.ts）\n\n最小使用路径是：\n```bash\ncodegraph init -i\ncodegraph serve --mcp\n```\n第一行建 `.codegraph/codegraph.db`，第二行把 MCP 工具暴露给 agent；installer 写入的实际命令也是 `codegraph` + `serve --mcp`。（来源：README CLI Reference；src/installer/targets/shared.ts）"
  reusable_abstractions:
    summary: ""
    body_md: "最值得复用的不是某个 parser，而是这些“agent 基础设施模式”：预索引、工具纪律、stale 信号、按客户端写配置。"
    items:
      - name: "MCP initialize 工具纪律"
        copy: "把工具选择规则放到 MCP server 的 initialize 指令里，例如“结构问题先用 explore，读文件用 node file 模式”。"
        skip: "如果你的工具只给人类 UI 用，不直接给 agent 调用，就不需要这层系统提示。"
        why_it_matters: "减少 agent 自己发明 grep/read 流程的概率；CodeGraph 把 exact text 集中在 `src/mcp/server-instructions.ts`。（来源：src/mcp/server-instructions.ts）"
      - name: "Staleness banner"
        copy: "索引延迟不可避免时，不阻塞查询，而是在响应顶部标出待同步文件，让 agent 只 Read 那些文件。"
        skip: "如果你的数据源是强一致事务库，没必要加这个复杂度。"
        why_it_matters: "它解决的是 agent 场景里的危险问题：不是慢，而是静默错；测试覆盖 banner、footer、status 三种表现。（来源：src/sync/watcher.ts；__tests__/mcp-staleness-banner.test.ts）"
      - name: "Agent target registry"
        copy: "每个客户端一个 target 模块，统一实现 detect/install/uninstall/printConfig。"
        skip: "如果只支持一个客户端，直接写配置即可。"
        why_it_matters: "客户端配置漂移很快；registry 让 Codex TOML、Claude JSON、Cursor rules、Antigravity legacy/unified path 分开演进。（来源：src/installer/targets/types.ts；src/installer/targets/registry.ts）"
      - name: "本地图 schema 加 FTS"
        copy: "把代码对象拆成 nodes、edges、files、unresolved_refs，再用 FTS5 查 symbol/docstring/signature。"
        skip: "如果只做全文语义搜索，向量库更简单。"
        why_it_matters: "结构边让 callers/callees/impact 这类工具有明确语义，不只是相似片段召回。（来源：src/db/schema.sql）"
      - name: "Affected tests CLI"
        copy: "用依赖图从变更文件反查受影响测试，例如 `git diff --name-only | codegraph affected --stdin --quiet`。"
        skip: "如果项目已有成熟 Bazel/Pants/Nx affected pipeline，可不重复造。"
        why_it_matters: "这是 AI agent 之外的直接工程收益：把图谱用于 CI/test selection。（来源：README codegraph affected；src/bin/codegraph.ts affected command）"
  dependency_platform_risk:
    summary: ""
    body_md: "主要风险集中在运行时、文件系统 watcher、客户端配置漂移和 benchmark 可迁移性。"
    items:
      - dependency: "Node bundled runtime / node:sqlite"
        what_if_change: "Node 的 `node:sqlite` 仍会提示 experimental；Node 25 还被 CLI 硬拦，源码里需要 `CODEGRAPH_ALLOW_UNSAFE_NODE` 才能绕过。"
        exposure: "medium"
        mitigation_or_unknown: "发行包绑定 Node runtime；源码运行要求 package.json engines `>=20.0.0 <25.0.0`，sqlite adapter 写明源码模式需 Node 22.5+。"
        source: "package.json engines；src/bin/codegraph.ts node-version gate；src/db/sqlite-adapter.ts；本地测试 warning"
      - dependency: "文件系统 watcher"
        what_if_change: "fs.watch 在 WSL2 `/mnt`、Windows、Linux inotify、macOS FSEvents 行为不同，可能影响自动同步。"
        exposure: "medium"
        mitigation_or_unknown: "watch-policy 支持 `CODEGRAPH_NO_WATCH=1`、`CODEGRAPH_FORCE_WATCH=1`，README 也给手动 `codegraph sync` fallback。"
        source: "src/sync/watch-policy.ts；site/src/content/docs/guides/indexing.md"
      - dependency: "Agent 客户端配置格式"
        what_if_change: "Claude/Cursor/Codex/Gemini 等配置路径或字段变更，会让 installer 失效。"
        exposure: "high"
        mitigation_or_unknown: "target registry 分模块处理；测试覆盖 137 个 installer-targets 用例，但这不是客户端最新版本的 live 验证。"
        source: "src/installer/targets/*.ts；__tests__/installer-targets.test.ts"
      - dependency: "GitHub Releases / npm 分发"
        what_if_change: "release archive、optional package 或 GitHub API/redirect 失败会影响安装。"
        exposure: "medium"
        mitigation_or_unknown: "install.sh 先用 releases/latest redirect，失败再 API；BUNDLING.md 描述 npm shim + per-platform optionalDependencies。"
        source: "install.sh；install.ps1；BUNDLING.md"
      - dependency: "npm dependencies"
        what_if_change: "依赖安全漏洞可能影响 CLI/MCP 运行面。"
        exposure: "medium"
        mitigation_or_unknown: "本地 `npm ci` 报告 8 vulnerabilities：5 moderate、2 high、1 critical；未执行 `npm audit fix`，需要上游确认。"
        source: "本地 npm ci 输出；package.json dependencies"
      - dependency: "Claude Opus benchmark 环境"
        what_if_change: "模型、prompt、agent 工具策略变化会改变 README 的成本/速度结论。"
        exposure: "medium"
        mitigation_or_unknown: "README 方法写明 Opus 4.8、4 runs per arm、median；docs/benchmarks 另有 0.9.4 snapshot，不应混为独立事实。"
        source: "README Methodology；docs/benchmarks/codegraph-ab-matrix.md"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些点在 README/docs/tree 里没有足够证据，不能补脑。"
    items:
      - "指定 `checkout` 目录已存在且 origin 指向 `Solvement/ai-brief-v2`；为避免覆盖，真实上游读取路径是 `checkout/upstream-codegraph`。"
      - "README 顶部提到的 hosted CodeGraph platform 只是 waitlist/coming，不在当前 repo 里实现；PR 风险评估托管产品能力未知。（来源：README 顶部 waitlist）"
      - "各 agent 的最新客户端版本是否仍接受当前 installer 写法，未逐个 live 验证。"
      - "README coverage 百分比和 benchmark 原始运行日志未完整随 repo 提供；可复现实验脚本存在，但未在本轮复跑。"
      - "全量 `npm test` 在本机 Windows 未通过；已通过 build 和 146 个窄测试，但不能声明完整测试绿。"
      - "生产环境隐私边界取决于实际 agent/LLM 客户端；CodeGraph 本地索引不等于 agent 不会把返回片段发给模型。"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 4
      成熟度: 3
    body_md: "判断：值得读源码和抽模式，暂不建议只因热度就直接生产依赖。最可复用的是 MCP 工具纪律、stale banner、installer target registry、本地图 schema；最需要警惕的是客户端兼容、watcher 平台差异、全量测试在 Windows 的失败和 npm audit 风险。（来源：src/mcp/server-instructions.ts；src/sync/watcher.ts；本地 build/test 验证）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-radar12-20260608\\\\colbymchenry-codegraph\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-radar12-20260608\\colbymchenry-codegraph\\prompt.md"
  raw_response: "logs\\codex-deepdive-radar12-20260608\\colbymchenry-codegraph\\codex-last-message.json"
  invoked_at: "2026-06-09T00:32:25.838Z"
  completed_at: "2026-06-09T00:40:31.240Z"
  repo: "colbymchenry/codegraph"
reasoning_trace:
  paper_type_decision: "project_type = devtool_cli; evidence from README/artifactAudit only."
  central_contribution: "Pre-indexed code knowledge graph for Claude Code, Codex, Gemini, Cursor, OpenCode, AntiGravity, Kiro, and Hermes Agent — fewer tokens, fewer tool calls, 100% local"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "可以通过 MCP 接入多个 agent。"
    - "本地知识图谱落在 SQLite，而不是外部服务。"
    - "自动同步能避免 agent 静默读到旧索引。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "package.json engines；src/bin/codegraph.ts node-version gate；src/db/sqlite-adapter.ts；本地测试 warning"
    - "src/sync/watch-policy.ts；site/src/content/docs/guides/indexing.md"
    - "src/installer/targets/*.ts；__tests__/installer-targets.test.ts"
    - "install.sh；install.ps1；BUNDLING.md"
    - "本地 npm ci 输出；package.json dependencies"
    - "README Methodology；docs/benchmarks/codegraph-ab-matrix.md"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 4
  maturity: 3
  main_risk: "判断：值得读源码和抽模式，暂不建议只因热度就直接生产依赖。最可复用的是 MCP 工具纪律、stale banner、installer target registry、本地图 schema；最需要警惕的是客户端兼容、watcher 平台差异、全量测试在 Windows 的失败和 npm audit 风险。（来源：src/mcp/server-instructions.ts；src/sync/watcher.ts；本地 build/test 验证）"
next_actions:
  - "extract-pattern"
unknowns:
  - "指定 `checkout` 目录已存在且 origin 指向 `Solvement/ai-brief-v2`；为避免覆盖，真实上游读取路径是 `checkout/upstream-codegraph`。"
  - "README 顶部提到的 hosted CodeGraph platform 只是 waitlist/coming，不在当前 repo 里实现；PR 风险评估托管产品能力未知。（来源：README 顶部 waitlist）"
  - "各 agent 的最新客户端版本是否仍接受当前 installer 写法，未逐个 live 验证。"
  - "README coverage 百分比和 benchmark 原始运行日志未完整随 repo 提供；可复现实验脚本存在，但未在本轮复跑。"
  - "全量 `npm test` 在本机 Windows 未通过；已通过 build 和 146 个窄测试，但不能声明完整测试绿。"
  - "生产环境隐私边界取决于实际 agent/LLM 客户端；CodeGraph 本地索引不等于 agent 不会把返回片段发给模型。"
builder_reuse:
  pattern: "MCP initialize 工具纪律"
  copy: "把工具选择规则放到 MCP server 的 initialize 指令里，例如“结构问题先用 explore，读文件用 node file 模式”。"
  skip: "如果你的工具只给人类 UI 用，不直接给 agent 调用，就不需要这层系统提示。"
  why_it_matters: "减少 agent 自己发明 grep/read 流程的概率；CodeGraph 把 exact text 集中在 `src/mcp/server-instructions.ts`。（来源：src/mcp/server-instructions.ts）"
dependency_platform_risk:
  dependency: "Node bundled runtime / node:sqlite"
  what_if_change: "Node 的 `node:sqlite` 仍会提示 experimental；Node 25 还被 CLI 硬拦，源码里需要 `CODEGRAPH_ALLOW_UNSAFE_NODE` 才能绕过。"
  exposure: "medium"
  mitigation_or_unknown: "发行包绑定 Node runtime；源码运行要求 package.json engines `>=20.0.0 <25.0.0`，sqlite adapter 写明源码模式需 Node 22.5+。"
claim_ledger:
  - claim: "可以通过 MCP 接入多个 agent。"
    plain_english: "不是只给 Claude Code 写死的插件；installer target 是模块化 registry。"
    source: "src/installer/targets/registry.ts；src/installer/targets/shared.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "ALL_TARGETS 包含 claude、cursor、codex、opencode、hermes、gemini、antigravity、kiro；公共配置返回 command `codegraph` 和 args `serve --mcp`。"
    does_not_support: "没有证明这些客户端在 2026-06-09 的最新版本全部可用。"
    threat: "各 agent 配置格式会变；Antigravity 文件里已写到 unified/legacy config 路径迁移。"
  - claim: "本地知识图谱落在 SQLite，而不是外部服务。"
    plain_english: "你的项目结构被存成节点表、边表、文件表，再由 MCP 工具查。"
    source: "src/db/schema.sql；site/src/content/docs/getting-started/configuration.md"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "schema 有 nodes、edges、files、unresolved_refs、project_metadata；配置文档写 per-project 数据在 `.codegraph/`，数据库为 `codegraph.db`。"
    does_not_support: "不等于对所有源码内容都不会进入 agent 上下文；工具返回代码片段时仍会暴露给当前 agent。"
    threat: "SQLite WAL 在网络盘/WSL 边界仍有 README troubleshooting 提到的锁风险。"
  - claim: "自动同步能避免 agent 静默读到旧索引。"
    plain_english: "文件变了但索引还没更新时，工具响应会告诉 agent 哪些文件可能旧。"
    source: "README How auto-syncing works；src/sync/watcher.ts；src/mcp/tools.ts；__tests__/mcp-staleness-banner.test.ts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "watcher 默认 debounce 2000ms；pendingFiles 记录 firstSeenMs/lastSeenMs/indexing；测试 5 个用例通过，覆盖 banner、footer、pending sync status。"
    does_not_support: "没有证明所有真实编辑器/文件系统事件都稳定触发。"
    threat: "Windows/WSL/macOS/Linux watcher 行为不同；全量测试在本机 Windows 出现 watcher/daemon 相关失败。"
  - claim: "README 自称平均 16% 更便宜、47% 更少 tokens、22% 更快、58% 更少工具调用。"
    plain_english: "这是作者 benchmark 结论，不是第三方复现。"
    source: "README Benchmark Results；README Methodology"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 写 7 个真实开源仓库、每 arm 4 次、取 median；with 为 CodeGraph MCP，without 为空 MCP config。"
    does_not_support: "不支持把该数字推广到所有模型、所有任务、所有 agent。"
    threat: "benchmark 依赖 Claude Opus 4.8、prompt、工具策略和 repo 状态；run-to-run variance README 自己也承认存在。"
  - claim: "支持多语言和框架路径解析。"
    plain_english: "它不只索引 TS；源码里有多语言 extractor 和 framework resolver。"
    source: "README Supported Languages；src/extraction/languages/index.ts；src/resolution/frameworks/index.ts"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 表列出 TypeScript、JavaScript、Python、Go、Rust、Java、C#、PHP、Ruby、C/C++、Objective-C、Swift、Kotlin、Scala、Dart、Svelte、Vue、Liquid、Pascal/Delphi、Lua、Luau 等；源码有对应 extractor/专用 extractor 文件。"
    does_not_support: "README 的 coverage 百分比未由我独立复测；Objective-C 在 README 标为 partial。"
    threat: "静态分析天然受动态分派、反射、DI、运行时路由约束。"
  - claim: "项目可构建，核心窄测试可过。"
    plain_english: "不是只有文档；本地 checkout 可以编译，关键路径测试可跑。"
    source: "本地验证：npm run build；npx vitest run installer-targets mcp-staleness-banner integration/full-pipeline"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`npm run build` 通过；3 个测试文件、146 个测试通过，覆盖 installer targets、staleness banner、init/index/resolve/search/callers/context/sync。"
    does_not_support: "全量 `npm test` 未通过。"
    threat: "全量测试第一次运行失败，包含 dist 未 build 的 CLI 测试、Windows Temp EPERM、watcher/daemon 超时；`npm ci` 还报告 8 个 audit vulnerabilities。"
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
| total_stars | 44809 |
| stars_in_period | 42778 |
| author | colbymchenry |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

它值得关注，不是因为又做了一个代码搜索，而是因为它把 agent 的上下文获取路径也改了：MCP initialize 里直接告诉 agent 优先用 `codegraph_explore`，不要重复 grep/read。对做 AI 应用的人，这是一种可复用的“工具使用纪律 + 本地结构索引”组合。（来源：src/mcp/server-instructions.ts；src/mcp/tools.ts）

## 核心能力

- MCP initialize 工具纪律（来源：数据不足）
- Staleness banner（来源：数据不足）
- Agent target registry（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

Sourcegraph Cody：官方文档说 Cody context 来自 keyword search、Sourcegraph Search API、Code Graph，并可用 managed 或 self-hosted Sourcegraph 搜索栈。取舍：要公司级跨仓库搜索和 Sourcegraph 生态，选 Cody；要本地 `.codegraph`、任意 MCP agent、无外部服务，选 CodeGraph。该差异来自官方文档，未跑同题对比。（来源：Sourcegraph Cody Context docs https://sourcegraph.com/docs/cody/core-concepts/context；README 100% Local） Cursor Codebase Indexing：Cursor 文档说它为每个文件计算 embeddings，打开项目自动索引，新文件增量索引，并提到服务器侧取 embeddings 后解密片段。取舍：要 Cursor IDE 内置体验和 PR search，选 Cursor；要结构化 callers/callees/impact、可接 Codex/Claude/opencode 等外部 agent，选 CodeGraph。（来源：Cursor Codebase Indexing docs https://docs.cursor.com/zh/context/codebase-indexing；src/mcp/tools.ts） Aider Repomap：Aider 文档说 repo map 会把重要类、函数、签名和关键定义行随请求发给 LLM。取舍：要轻量、随 Aider 编辑循环走，选 Aider；要持久 SQLite 图、MCP 工具、watcher stale banner，选 CodeGraph。（来源：Aider Repository map docs https://aider.chat/docs/repomap.html；src/db/schema.sql；src/sync/watcher.ts）

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

```mermaid flowchart TD A[项目源码] --> B[扫描过滤] B --> C[TreeSitter解析] C --> D[未解析引用] D --> E[框架和导入解析] E --> F[SQLite图] F --> G[MCP工具] G --> H[Agent回答或编辑] A --> I[文件变更] I --> J[Watcher同步] J --> F J --> K[Stale提示] K --> H ``` 真实流：`__tests__/integration/full-pipeline.test.ts` 生成约 120 个 TS 模块，`indexAll()` 后搜索 `entry` 和 `fn50`，再用 `getCallers(fn0)`、`buildContext("entry function chain")` 验证图能被查询；随后 `sync()` 处理三类变更：新增 `src/consumer.ts`、修改 `src/mod0.ts` 加 `newHelper`、删除 `src/mod1.ts`。（来源：__tests__/integration/full-pipeline.test.ts） 最小使用路径是： ```bash codegraph init -i codegraph serve --mcp ``` 第一行建 `.codegraph/codegraph.db`，第二行把 MCP 工具暴露给 agent；installer 写入的实际命令也是 `codegraph` + `serve --mcp`。（来源：README CLI Reference；src/installer/targets/shared.ts）

## 本质不同的设计取舍

最值得复用的不是某个 parser，而是这些“agent 基础设施模式”：预索引、工具纪律、stale 信号、按客户端写配置。 - MCP initialize 工具纪律；把工具选择规则放到 MCP server 的 initialize 指令里，例如“结构问题先用 explore，读文件用 node file 模式”。；如果你的工具只给人类 UI 用，不直接给 agent 调用，就不需要这层系统提示。；减少 agent 自己发明 grep/read 流程的概率；CodeGraph 把 exact text 集中在 `src/mcp/server-instructions.ts`。（来源：src/mcp/server-instructions.ts） - Staleness banner；索引延迟不可避免时，不阻塞查询，而是在响应顶部标出待同步文件，让 agent 只 Read 那些文件。；如果你的数据源是强一致事务库，没必要加这个复杂度。；它解决的是 agent 场景里的危险问题：不是慢，而是静默错；测试覆盖 banner、footer、status 三种表现。（来源：src/sync/watcher.ts；__tests__/mcp-staleness-banner.test.ts） - Agent target registry；每个客户端一个 target 模块，统一实现 detect/install/uninstall/printConfig。；如果只支持一个客户端，直接写配置即可。；客户端配置漂移很快；registry 让 Codex TOML、Claude JSON、Cursor rules、Antigravity legacy/unified path 分开演进。（来源：src/installer/targets/types.ts；src/installer/targets/registry.ts） - 本地图 schema 加 FTS；把代码对象拆成 nodes、edges、files、unresolved_refs，再用 FTS5 查 symbol/docstring/signature。；如果只做全文语义搜索，向量库更简单。；结构边让 callers/callees/impact 这类工具有明确语义，不只是相似片段召回。（来源：src/db/schema.sql） - Affected tests CLI；用依赖图从变更文件反查受影响测试，例如 `git diff --name-only | codegraph affected --stdin --quiet`。；如果项目已有成熟 Bazel/Pants/Nx affected pipeline，可不重复造。；这是 AI agent 之外的直接工程收益：把图谱用于 CI/test selection。（来源：README codegraph affected；src/bin/codegraph.ts affected command）

## 对从业者意味着什么

判断：值得读源码和抽模式，暂不建议只因热度就直接生产依赖。最可复用的是 MCP 工具纪律、stale banner、installer target registry、本地图 schema；最需要警惕的是客户端兼容、watcher 平台差异、全量测试在 Windows 的失败和 npm audit 风险。（来源：src/mcp/server-instructions.ts；src/sync/watcher.ts；本地 build/test 验证）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/code-knowledge-graph]]、[[concepts/mcp-tool-steering]]。另见 [[content/colbymchenry-codegraph]]、[[claims/colbymchenry-codegraph-main-claim-2]]。
