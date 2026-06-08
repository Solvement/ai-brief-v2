---
content: "can1357-oh-my-pi"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "oh-my-pi — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "can1357/oh-my-pi：GitHub 描述为“⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more”。"
  what_it_does: "⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more"
  metadata:
    language: "TypeScript"
    total_stars: "11193"
    stars_in_period: "7042"
    author: "can1357"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "人话：值得看的是“代理 harness”本身：它把容易导致编码代理失败的环节拆成可检查的工具协议，例如读文件时生成编辑锚点、编辑时校验锚点、结构化 AST 改写先预览再 `resolve`、LSP rename 走 `workspace/willRenameFiles`、子代理必须通过 `yield` 收尾。术语：这是一个多工具 agent runtime，不只是 CLI UI；`createAgentSession()` 会发现 auth/model/settings/session/skills/extensions/MCP/LSP/built-in tools，`createTools()` 注册 29 个公开内置工具和 5 个隐藏工具，默认 essential tools 是 `read,bash,edit`。（来源：docs/sdk.md What createAgentSession discovers by default；packages/coding-agent/src/tools/index.ts BUILTIN_TOOLS；packages/coding-agent/src/tools/index.ts DEFAULT_ESSENTIAL_TOOL_NAMES）"
  core_capabilities:
    - "Hashline anchored edits"
    - "Preview-first structural rewrite"
    - "Internal URL filesystem"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "人话：横向看，oh-my-pi 更像“把终端编码代理、工具平台、SDK、native harness 都塞进一个发行物”的路线；Claude Code、OpenAI Codex CLI、aider 更常被用户作为终端编码代理入口来比较。竞品事实只用公开入口做类别定位：Claude Code 官网称其运行在 terminal 并可配合 IDE；OpenAI Codex GitHub/Help 称 Codex CLI 是本地终端 coding agent；aider 官网称其是 terminal AI pair programming。术语与取舍：选 omp，当你要研究/复用 hashline、TTSR、internal URL、MCP discovery、LSP/DAP/native Rust 工具、SDK/session/subagent 这些 harness 机制；选 Claude Code，当你主要押 Anthropic 官方产品体验和企业集成，且不需要读源码改 harness；选 OpenAI Codex CLI，当你主要押 OpenAI 官方终端代理和其 sandbox/approval/profile 生态，且不需要 omp 的 Rust native + hashline 协议；选 aider，当你想要更轻量、成熟、以 Git diff/提交工作流为中心的终端 pair programmer，而不是全套工具平台。上述竞品能力没有在本仓库内核验，除“终端编码代理/terminal pair programming”定位外不写为已核实性能结论。（来源：README Four entry points；docs/sdk.md；docs/tools/edit.md；外部定位来源：https://www.claude.com/product/claude-code；https://github.com/openai/codex；https://aider.chat/）"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话：一个真实 flow 可以这样走：用户运行 `omp -p \"List all .ts files in src/\"`，`packages/coding-agent/src/cli.ts` 会把非子命令 argv 改写为 `launch`，`packages/coding-agent/src/commands/launch.ts` 定义 `-p/--print`、`--model`、`--tools`、`--no-lsp`、`--approval-mode` 等参数，然后 `runRootCommand` 创建 agent session。session 创建后，`createTools()` 默认注册 `read,bash,edit` 等工具；当模型需要看文件，`read` 对本地文本输出 `¶src/foo.ts#0A1B` 加 `41:def alpha():` 这种 hashline header/行号，并把读取内容写入 `session.fileReadCache`。模型编辑时调用 `edit`，输入像 `¶a.ts#0A3B replace 1..1: +const X = \"b\";`；`edit` 通过 snapshot tag 验证 live file 是否仍匹配，失败时走 snapshot recovery 或返回 mismatch。结构性替换则走 `ast_edit`：输入 `ops: [{ pat, out }], paths: [...]`，先 dry-run 预览，真正落盘必须后续 `resolve(action:\"apply\")`。如果任务很大，`task` 会按 `task.maxConcurrency` 分派子代理，子代理输出 `<id>.md`，父代理再读 `agent://<id>` 汇总。术语：这条链路包含 CLI routing、session discovery、tool registry、read snapshot store、hashline patcher、resolve preview queue、subagent artifact protocol；对应源码/文档锚点是 `packages/coding-agent/src/cli.ts runCli`、`packages/coding-agent/src/commands/launch.ts flags/examples`、`docs/tools/read.md Flow`、`docs/tools/edit.md Worked examples`、`docs/tools/ast-edit.md Flow`、`docs/tools/task.md Flow`。"
  essential_design_difference: "人话：可复用的不是某个 UI，而是几套把 LLM 失误面缩小的协议。术语：下面只列仓库里能看到的抽象。 - Hashline anchored edits；把 read 输出设计成带 snapshot tag 的可编辑视图，例如 `¶a.ts#0A3B` + `replace 1..1:`；patcher 在写入前验证 full-file hash，multi-section patch 先 preflight，避免部分落盘。；如果你的 agent 只做只读问答，或者所有编辑都由 IDE API transaction 管理，hashline 的额外格式训练成本未必值得。；LLM 编辑失败常来自 stale context 和字符串找不到；hashline 把“要改哪几行”和“看到的是哪个版本”显式化。（来源：docs/tools/edit.md Inputs；packages/hashline/README.md SnapshotStore/Patcher） - Preview-first structural rewrite；`ast_edit` 固定先 dry-run，显示 per-file replacements，排队一个 `resolve` action；apply 时重新计算并比较 replacement totals/per-file counts，stale preview 报错。；如果项目语言不在 tree-sitter/ast-grep 支持范围，或变更需要复杂语义分析，单纯 AST pattern rewrite 不够。；它把 codemod 从“模型直接改文件”变成“模型提出结构规则，人或系统确认后落盘”。（来源：docs/tools/ast-edit.md Flow；docs/tools/ast-edit.md Errors） - Internal URL filesystem；让 `read` 统一处理 `agent://`、`artifact://`、`issue://`、`pr://`、`rule://`、`skill://`、`memory://` 等资源；子代理 JSON 输出还能用 `agent://<id>/<path>` 抽字段。；如果系统资源很少，普通 API 参数更直观；internal URL 需要维护 resolver、权限、分页和不可变资源语义。；模型只学一个 `read path` 接口，就能读取文件、PR、规则、技能和子代理结果。（来源：docs/tools/read.md Internal URLs；docs/tools/task.md Outputs；docs/skills.md skill:// URL behavior） - TTSR stream interruption；规则文件用 frontmatter 写 `condition`、`scope`、`interruptMode`，匹配 stream delta 后可 abort、注入 `<system-interrupt>`、继续生成；工具源非中断匹配则把 `<system-reminder>` prepend 到 tool result。；如果模型供应商不提供可中断流，或你不愿为规则误报承担重试成本，不要照搬。；规则不必每轮塞进上下文；只有模型偏航时才把相关规则注入。（来源：docs/ttsr-injection-lifecycle.md Retry scheduling；.omp/rules/ts-hook-fetch.md） - Subagent artifact protocol；每个子代理必须通过隐藏 `yield` 工具结束，输出写 `<id>.md`，父代理用 `agent://<id>` 读取；缺失 yield 最多发 3 次 reminder。；如果任务不能并行或没有可合并 artifact，子代理只会增加复杂度和模型费用。；父代理不需要从自由文本里猜 worker 状态；输出、patch、branch、usage、duration 都有结构化字段。（来源：docs/tools/task.md Outputs；docs/tools/task.md Flow；docs/tools/task.md Limits & Caps）"
  practitioner_meaning: "人话：建议不是先把它当日常主力工具盲装，而是抽取设计模式：hashline、read/internal URL、preview-first AST rewrite、TTSR、subagent artifact/yield、MCP config discovery 都很值得 AI 工程师拆读。成熟度给 4：仓库有 MIT license、15.10.4 版本、Dockerfile、CI/installer、很多 tests/docs，但当前热度和 README 自称指标需要运行验证，且外部 provider/native 依赖面大。术语：这是 Tier 3 的横向 agent harness 候选，最适合 `clone-and-run` 后做机制复用，而不是只读 README 翻译。（来源：LICENSE；git tag v15.10.4 at 98c91cfa99d85e0033820583d992dc49283db701；package.json scripts；Dockerfile；docs/tools/*.md）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "oh-my-pi 是一个 Bun/TypeScript 终端编码代理，把读文件、hashline 编辑、LSP、DAP、浏览器、MCP、子代理、记忆和本地 Rust native 工具打包成同一个 `omp` CLI/SDK。"
    body_md: "人话：它不是只包一层聊天模型，而是把“模型如何看代码、改代码、运行代码、分派任务、接入外部工具”做成一套完整终端工作台；安装入口包括 `curl -fsSL https://omp.sh/install | sh`、`bun install -g @oh-my-pi/pi-coding-agent`、Windows PowerShell `irm https://omp.sh/install.ps1 | iex`，CLI 包的 `bin` 是 `omp: src/cli.ts`。术语：仓库是 Bun monorepo，根 `package.json` 使用 `packageManager: bun@1.3.14` 和 `workspaces: packages/*`，`packages/coding-agent/package.json` 暴露 CLI/SDK，Rust workspace 由 `crates/pi-natives`、`pi-shell`、`pi-ast`、`pi-iso` 等组成，版本为 `15.10.4`。（来源：README Install；package.json workspaces；packages/coding-agent/package.json bin；Cargo.toml workspace）"
  why_worth_attention:
    summary: ""
    body_md: "人话：值得看的是“代理 harness”本身：它把容易导致编码代理失败的环节拆成可检查的工具协议，例如读文件时生成编辑锚点、编辑时校验锚点、结构化 AST 改写先预览再 `resolve`、LSP rename 走 `workspace/willRenameFiles`、子代理必须通过 `yield` 收尾。术语：这是一个多工具 agent runtime，不只是 CLI UI；`createAgentSession()` 会发现 auth/model/settings/session/skills/extensions/MCP/LSP/built-in tools，`createTools()` 注册 29 个公开内置工具和 5 个隐藏工具，默认 essential tools 是 `read,bash,edit`。（来源：docs/sdk.md What createAgentSession discovers by default；packages/coding-agent/src/tools/index.ts BUILTIN_TOOLS；packages/coding-agent/src/tools/index.ts DEFAULT_ESSENTIAL_TOOL_NAMES）"
    bullets:
      - "已核实：`packages/coding-agent/src/tools/index.ts` 定义 29 个公开内置工具：`read,bash,edit,ast_grep,ast_edit,render_mermaid,ask,debug,eval,ssh,github,find,search,lsp,inspect_image,browser,checkpoint,rewind,task,job,irc,todo,web_search,search_tool_bm25,write,memory_edit,retain,recall,reflect`；另有隐藏 `yield,report_finding,report_tool_issue,resolve,goal`。（来源：packages/coding-agent/src/tools/index.ts BUILTIN_TOOLS/HIDDEN_TOOLS）"
      - "已核实：`read` 支持本地文件、目录、archive、SQLite、internal URL、图片、文档、URL；本地文本读会把内容记录进 file-read cache，供后续 hashline stale-anchor recovery 使用。（来源：docs/tools/read.md Flow；docs/tools/read.md Modes / Local text files）"
      - "已核实：`task` 子代理支持 async/sync、`task.maxConcurrency`、隔离 worktree/FUSE/ProjFS、`agent://<id>` 输出、最多 3 次 `yield` reminder。（来源：docs/tools/task.md Flow；docs/tools/task.md Limits & Caps）"
      - "自称：README 写 `40+ providers · 32 built-in tools · 13 lsp ops · 27 dap ops · ~27k lines of Rust core`；本次只核实了工具注册表、docs/tools、Rust crates 和 package 配置，未独立复算 README 的 40+/27/~27k 等口径。（来源：README 顶部指标；packages/coding-agent/src/tools/index.ts）"
  key_claims_evidence:
    summary: ""
    body_md: "人话：下面把 README 的营销句和仓库里能验的机制分开。术语：`自称` 只代表 README/文档声称；`已核实` 代表在源码、配置或 docs 里找到对应机制。"
    items:
      - claim: "README 自称 `32 built-in tools`。"
        plain_english: "作者说盒子里有 32 个工具，但实际代码注册表显示 29 个公开内置工具和 5 个隐藏工具；这说明 README 的统计口径未在代码里直接等同为一个 32 项数组。"
        source: "README Whatever the task needs；packages/coding-agent/src/tools/index.ts BUILTIN_TOOLS/HIDDEN_TOOLS"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "代码确有大量内置工具注册；公开注册表 29 项，隐藏注册表 5 项。"
        does_not_support: "不支持把 README 的 32 作为本次独立核实后的精确工具数。"
        threat: "工具是否默认可用还受 `settings.get(...)`、`enableLsp`、`task.maxRecursionDepth`、memory backend 等门控影响。"
      - claim: "`edit` 默认是 hashline patch language，要求 `¶PATH#TAG` 或 `[PATH#TAG]` 这类内容锚点。"
        plain_english: "模型不是靠全文 diff 猜位置，而是先从 `read` 得到文件 tag，再用 `replace 1..1:`、`insert after 5:`、`delete 4..5` 这类行操作提交补丁。"
        source: "docs/tools/edit.md Inputs；packages/hashline/README.md Format"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "docs 给出 `¶a.ts#0A3B`、`replace 1..1:`、`insert after 5:`、`delete 4..5` 的 worked examples；hashline README 说明 tag 是 full-file content hash 的 4-hex 记录。"
        does_not_support: "不证明所有模型都会一次写对；只证明工具协议有锚点校验和 recovery 机制。"
        threat: "tag 只在当前 `SnapshotStore` 有意义；跨 session 或未先 read/search 的编辑会失败。"
      - claim: "`read` 是统一入口，可以读文件、URL、SQLite、archive、internal URL，并为 hashline 编辑留缓存。"
        plain_english: "代理看到的不是裸 `cat` 输出，而是带选择器、截断、摘要、hashline header、内部协议解析的读取层。"
        source: "docs/tools/read.md Inputs；docs/tools/read.md Flow；docs/tools/read.md Limits & Caps"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "文档列出 selector 如 `:raw`、`:A-B`、`:A+C`、`:R1,R2`；archive 支持 `.tar/.tar.gz/.tgz/.zip`；SQLite 默认 query limit `20`、max `500`；URL 输出截到 `300` 行和 `50 KiB`。"
        does_not_support: "不证明每个文档格式转换都稳定；转换失败会返回 `[Cannot read .pdf file: ...]`。"
        threat: "URL 读取有网络和站点解析风险；SQLite raw `q=` 不限制必须 SELECT，只依赖只读打开和外围契约。"
      - claim: "LSP 工具能做诊断、定义、引用、rename、rename_file、code_actions 和 raw request。"
        plain_english: "它把 IDE 语言服务器能力暴露给模型，例如 rename 文件前先发 `workspace/willRenameFiles`，应用后发 `workspace/didRenameFiles`。"
        source: "docs/tools/lsp.md Inputs；docs/tools/lsp.md Flow；packages/coding-agent/src/lsp/defaults.json"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "docs 的 action enum 包含 `diagnostics,definition,references,hover,symbols,rename,rename_file,code_actions,type_definition,implementation,status,reload,capabilities,request`；defaults.json 配置 `rust-analyzer`、`typescript-language-server`、`pyright`、`gopls` 等。"
        does_not_support: "不保证用户机器已安装每个 language server。"
        threat: "LSP 是本地 stdio 子进程；缺少二进制、项目初始化慢或 server 行为差异会影响结果。"
      - claim: "`task` 子代理能并行、隔离、结构化返回，并通过 `agent://<id>` 被父代理读取。"
        plain_english: "一个大任务可以分给多个 worker；每个 worker 的完整输出写成 artifact，父代理用统一 `read agent://...` 读取。"
        source: "docs/tools/task.md Outputs；docs/tools/task.md Flow；packages/coding-agent/src/prompts/agents/*.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "docs 说明 `<id>.md`、`<id>.jsonl`、`<id>.patch`、`agent://<id>/<path>`；内置 agent prompt 文件包括 `explore,plan,designer,reviewer,task,librarian,oracle` 等。"
        does_not_support: "不证明隔离合并永远无冲突；docs 明确 patch/branch merge 失败会留下人工处理 artifact。"
        threat: "隔离执行要求 git repo；FUSE/ProjFS/backend fallback 与平台有关。"
      - claim: "`web_search` 有 14 个 provider 的顺序 fallback。"
        plain_english: "搜索不是写死一个供应商；`auto` 会按固定顺序找已配置 provider，先成功先返回。"
        source: "docs/tools/web_search.md Flow；packages/coding-agent/src/web/search/types.ts SEARCH_PROVIDER_ORDER"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`SEARCH_PROVIDER_ORDER` 精确列出 `tavily,perplexity,brave,jina,kimi,anthropic,gemini,codex,zai,exa,parallel,kagi,synthetic,searxng`。"
        does_not_support: "不证明这些 provider 都可用；每个都需要对应 OAuth/API key/endpoint。"
        threat: "外部 API 价格、限流、认证方式和返回格式会变。"
      - claim: "TTSR 规则能在模型输出中途触发，abort 当前流并注入规则提醒后继续。"
        plain_english: "如果模型开始写团队禁止的模式，规则可以在 token 流中截停，而不是等整段错误输出结束。"
        source: "docs/ttsr-injection-lifecycle.md Trigger decision；.omp/rules/ts-hook-fetch.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "示例规则 `.omp/rules/ts-hook-fetch.md` 的 condition 是 `globalThis\\.fetch\\s*=|spyOn\\(globalThis.*fetch`，scope 是 `tool:edit(**/*.test.{ts,tsx,js,jsx}), tool:write(**/*.test.{ts,tsx,js,jsx})`；生命周期文档说明匹配后 `agent.abort()`、50ms 后注入 `<system-interrupt ...>` 并 `agent.continue()`。"
        does_not_support: "不证明所有规则都会被执行；docs 说明 invalid regex、scope 不匹配、disabledRules 会跳过。"
        threat: "文档还说明 `TtsrSettings.enabled` 当前未在 runtime gating 检查，配置语义有 caveat。"
      - claim: "SDK 可在 Node/Bun 进程里直接创建 session。"
        plain_english: "不只能用 TUI；可以把代理嵌到自己的程序，订阅流事件，限制工具集，用内存 session。"
        source: "README SDK section；docs/sdk.md Quick start；packages/coding-agent/package.json exports"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "docs 示例 `import { createAgentSession } from '@oh-my-pi/pi-coding-agent'`，订阅 `message_update` 的 `text_delta`，再 `await session.prompt(...)`；package exports 暴露 `./sdk`、`./tools`、`./mcp`、`./task`、`./lsp` 等模块路径。"
        does_not_support: "不证明普通 Node 无 Bun 能完整运行；package engines 写 `bun >=1.3.14`。"
        threat: "SDK 与源码 TypeScript 入口绑定较深，发布包和 Bun runtime 是关键依赖。"
  how_it_works:
    summary: ""
    body_md: "人话：一个真实 flow 可以这样走：用户运行 `omp -p \"List all .ts files in src/\"`，`packages/coding-agent/src/cli.ts` 会把非子命令 argv 改写为 `launch`，`packages/coding-agent/src/commands/launch.ts` 定义 `-p/--print`、`--model`、`--tools`、`--no-lsp`、`--approval-mode` 等参数，然后 `runRootCommand` 创建 agent session。session 创建后，`createTools()` 默认注册 `read,bash,edit` 等工具；当模型需要看文件，`read` 对本地文本输出 `¶src/foo.ts#0A1B` 加 `41:def alpha():` 这种 hashline header/行号，并把读取内容写入 `session.fileReadCache`。模型编辑时调用 `edit`，输入像 `¶a.ts#0A3B replace 1..1: +const X = \"b\";`；`edit` 通过 snapshot tag 验证 live file 是否仍匹配，失败时走 snapshot recovery 或返回 mismatch。结构性替换则走 `ast_edit`：输入 `ops: [{ pat, out }], paths: [...]`，先 dry-run 预览，真正落盘必须后续 `resolve(action:\"apply\")`。如果任务很大，`task` 会按 `task.maxConcurrency` 分派子代理，子代理输出 `<id>.md`，父代理再读 `agent://<id>` 汇总。术语：这条链路包含 CLI routing、session discovery、tool registry、read snapshot store、hashline patcher、resolve preview queue、subagent artifact protocol；对应源码/文档锚点是 `packages/coding-agent/src/cli.ts runCli`、`packages/coding-agent/src/commands/launch.ts flags/examples`、`docs/tools/read.md Flow`、`docs/tools/edit.md Worked examples`、`docs/tools/ast-edit.md Flow`、`docs/tools/task.md Flow`。"
  reusable_abstractions:
    summary: ""
    body_md: "人话：可复用的不是某个 UI，而是几套把 LLM 失误面缩小的协议。术语：下面只列仓库里能看到的抽象。"
    items:
      - name: "Hashline anchored edits"
        copy: "把 read 输出设计成带 snapshot tag 的可编辑视图，例如 `¶a.ts#0A3B` + `replace 1..1:`；patcher 在写入前验证 full-file hash，multi-section patch 先 preflight，避免部分落盘。"
        skip: "如果你的 agent 只做只读问答，或者所有编辑都由 IDE API transaction 管理，hashline 的额外格式训练成本未必值得。"
        why_it_matters: "LLM 编辑失败常来自 stale context 和字符串找不到；hashline 把“要改哪几行”和“看到的是哪个版本”显式化。（来源：docs/tools/edit.md Inputs；packages/hashline/README.md SnapshotStore/Patcher）"
      - name: "Preview-first structural rewrite"
        copy: "`ast_edit` 固定先 dry-run，显示 per-file replacements，排队一个 `resolve` action；apply 时重新计算并比较 replacement totals/per-file counts，stale preview 报错。"
        skip: "如果项目语言不在 tree-sitter/ast-grep 支持范围，或变更需要复杂语义分析，单纯 AST pattern rewrite 不够。"
        why_it_matters: "它把 codemod 从“模型直接改文件”变成“模型提出结构规则，人或系统确认后落盘”。（来源：docs/tools/ast-edit.md Flow；docs/tools/ast-edit.md Errors）"
      - name: "Internal URL filesystem"
        copy: "让 `read` 统一处理 `agent://`、`artifact://`、`issue://`、`pr://`、`rule://`、`skill://`、`memory://` 等资源；子代理 JSON 输出还能用 `agent://<id>/<path>` 抽字段。"
        skip: "如果系统资源很少，普通 API 参数更直观；internal URL 需要维护 resolver、权限、分页和不可变资源语义。"
        why_it_matters: "模型只学一个 `read path` 接口，就能读取文件、PR、规则、技能和子代理结果。（来源：docs/tools/read.md Internal URLs；docs/tools/task.md Outputs；docs/skills.md skill:// URL behavior）"
      - name: "TTSR stream interruption"
        copy: "规则文件用 frontmatter 写 `condition`、`scope`、`interruptMode`，匹配 stream delta 后可 abort、注入 `<system-interrupt>`、继续生成；工具源非中断匹配则把 `<system-reminder>` prepend 到 tool result。"
        skip: "如果模型供应商不提供可中断流，或你不愿为规则误报承担重试成本，不要照搬。"
        why_it_matters: "规则不必每轮塞进上下文；只有模型偏航时才把相关规则注入。（来源：docs/ttsr-injection-lifecycle.md Retry scheduling；.omp/rules/ts-hook-fetch.md）"
      - name: "Subagent artifact protocol"
        copy: "每个子代理必须通过隐藏 `yield` 工具结束，输出写 `<id>.md`，父代理用 `agent://<id>` 读取；缺失 yield 最多发 3 次 reminder。"
        skip: "如果任务不能并行或没有可合并 artifact，子代理只会增加复杂度和模型费用。"
        why_it_matters: "父代理不需要从自由文本里猜 worker 状态；输出、patch、branch、usage、duration 都有结构化字段。（来源：docs/tools/task.md Outputs；docs/tools/task.md Flow；docs/tools/task.md Limits & Caps）"
  dependency_platform_risk:
    summary: ""
    body_md: "人话：风险主要来自运行时、外部模型/搜索服务、native 二进制、语言服务器和本地权限边界。术语：下面按依赖面列。"
    items:
      - dependency: "Bun >= 1.3.14"
        what_if_change: "Bun 版本不足会直接在 `src/cli.ts` 报错退出；install 脚本也检查 `MIN_BUN_VERSION=1.3.14`。"
        exposure: "high"
        mitigation_or_unknown: "README 和 install scripts 都写明 Bun 要求；是否支持纯 Node 未在 README/docs/tree 说明。"
        source: "packages/coding-agent/src/cli.ts MIN_BUN_VERSION check；scripts/install.sh；scripts/install.ps1；package.json packageManager"
      - dependency: "Rust N-API native addon"
        what_if_change: "grep、shell、AST、highlight、PTY、image、token counting 等路径依赖 `@oh-my-pi/pi-natives` 和 `pi_natives` 二进制；平台构建/加载失败会影响热路径工具。"
        exposure: "high"
        mitigation_or_unknown: "Dockerfile 有 `natives-builder` 阶段编译 `pi_natives.linux-*.node`；packages/natives 声明 N-API package；未运行安装测试。"
        source: "Dockerfile natives-builder；packages/natives/package.json；crates/pi-natives/Cargo.toml"
      - dependency: "外部 LLM providers 和 OAuth/API key"
        what_if_change: "模型不可用、key 过期、quota/429 会影响主代理；registry 会做 auth lookup、fallback、runtime discovery，但最终仍依赖供应商。"
        exposure: "high"
        mitigation_or_unknown: "docs/models.md 说明 auth priority、runtime discovery、fallback candidate；实际账户可用性未知。"
        source: "docs/models.md Auth and credential resolution；docs/sdk.md Model and auth wiring"
      - dependency: "Web search providers"
        what_if_change: "`web_search` auto 链要有至少一个已配置 provider；否则返回 `Error: No web search provider configured.`。"
        exposure: "medium"
        mitigation_or_unknown: "支持 14 provider 顺序链和 SearXNG self-hosted endpoint；每个 provider 的认证/限流仍外部控制。"
        source: "docs/tools/web_search.md Flow；packages/coding-agent/src/web/search/types.ts SEARCH_PROVIDER_ORDER"
      - dependency: "MCP server configs"
        what_if_change: "粘贴远程 MCP 忘写 `type: http` 会被当成 stdio 并报缺 `command`；server name 还要匹配 `^[a-zA-Z0-9_.-]{1,100}$`。"
        exposure: "medium"
        mitigation_or_unknown: "文档给 `.omp/mcp.json`、`~/.omp/agent/mcp.json`、stdio/http/sse 示例和 `/mcp test <name>` 排错路径。"
        source: "docs/mcp-config.md File shape；docs/mcp-config.md Validation rules"
      - dependency: "本地 language servers / debuggers"
        what_if_change: "LSP/DAP 能力依赖用户安装 `rust-analyzer`、`typescript-language-server`、`pyright` 等二进制；缺失时对应操作不可用或冷启动失败。"
        exposure: "medium"
        mitigation_or_unknown: "defaults.json 提供 server definitions；安装这些 server 不是仓库自动保证的事实。"
        source: "packages/coding-agent/src/lsp/defaults.json；docs/tools/lsp.md Flow"
      - dependency: "权限/审批模式"
        what_if_change: "默认 `yolo` 会自动批准 read/write/exec；如果用户以为所有破坏性操作都会提示，会有权限预期风险。"
        exposure: "medium"
        mitigation_or_unknown: "可用 `tools.approvalMode: always-ask|write|yolo` 和 per-tool `allow|deny|prompt` 覆盖；`bash` 的 critical override 在非 yolo 强制 prompt。"
        source: "docs/approval-mode.md Modes；docs/approval-mode.md Safety overrides"
  unknowns_to_confirm:
    summary: ""
    body_md: "人话：仓库证据很厚，但仍有几个必须跑起来或查 release 才能确认的问题。术语：以下不填补为事实。"
    items:
      - "README 的 `40+ providers`、`32 built-in tools`、`13 lsp ops`、`27 dap ops`、`~27k lines of Rust core` 未在本次逐项复算；只能标为 README 自称。"
      - "未运行 `bun install`、`bun test`、`omp --smoke-test` 或 Docker build；因此 artifact.runnable 标为 `unknown`。"
      - "README benchmark 表如 `Grok Code Fast 1 6.7% -> 68.3%`、`Grok 4 Fast -61% tokens` 未找到本仓库内完整可复现实验报告；只能标为自称。"
      - "MCP、web_search、OAuth provider、browser、image generation 的真实可用性取决于本机凭据、网络和外部 API，未在 README/docs/tree 说明默认可用。"
      - "TTSR 文档写 `TtsrSettings.enabled` 当前未在 runtime gating 检查；这是否为设计选择还是待修 bug 未在文档说明。"
      - "Windows 下 native addon、bash shell、ProjFS 隔离的真实体验未运行验证；install.ps1 只说明会查找 Git Bash/WSL/Cygwin/MSYS2 bash。"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 4
    body_md: "人话：建议不是先把它当日常主力工具盲装，而是抽取设计模式：hashline、read/internal URL、preview-first AST rewrite、TTSR、subagent artifact/yield、MCP config discovery 都很值得 AI 工程师拆读。成熟度给 4：仓库有 MIT license、15.10.4 版本、Dockerfile、CI/installer、很多 tests/docs，但当前热度和 README 自称指标需要运行验证，且外部 provider/native 依赖面大。术语：这是 Tier 3 的横向 agent harness 候选，最适合 `clone-and-run` 后做机制复用，而不是只读 README 翻译。（来源：LICENSE；git tag v15.10.4 at 98c91cfa99d85e0033820583d992dc49283db701；package.json scripts；Dockerfile；docs/tools/*.md）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\can1357-oh-my-pi\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\can1357-oh-my-pi\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\can1357-oh-my-pi\\codex-last-message.json"
  invoked_at: "2026-06-08T14:37:57.867Z"
  completed_at: "2026-06-08T14:42:53.385Z"
  repo: "can1357/oh-my-pi"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "README 自称 `32 built-in tools`。"
    - "`edit` 默认是 hashline patch language，要求 `¶PATH#TAG` 或 `[PATH#TAG]` 这类内容锚点。"
    - "`read` 是统一入口，可以读文件、URL、SQLite、archive、internal URL，并为 hashline 编辑留缓存。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "packages/coding-agent/src/cli.ts MIN_BUN_VERSION check；scripts/install.sh；scripts/install.ps1；package.json packageManager"
    - "Dockerfile natives-builder；packages/natives/package.json；crates/pi-natives/Cargo.toml"
    - "docs/models.md Auth and credential resolution；docs/sdk.md Model and auth wiring"
    - "docs/tools/web_search.md Flow；packages/coding-agent/src/web/search/types.ts SEARCH_PROVIDER_ORDER"
    - "docs/mcp-config.md File shape；docs/mcp-config.md Validation rules"
    - "packages/coding-agent/src/lsp/defaults.json；docs/tools/lsp.md Flow"
    - "docs/approval-mode.md Modes；docs/approval-mode.md Safety overrides"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 4
  main_risk: "人话：建议不是先把它当日常主力工具盲装，而是抽取设计模式：hashline、read/internal URL、preview-first AST rewrite、TTSR、subagent artifact/yield、MCP config discovery 都很值得 AI 工程师拆读。成熟度给 4：仓库有 MIT license、15.10.4 版本、Dockerfile、CI/installer、很多 tests/docs，但当前热度和 README 自称指标需要运行验证，且外部 provider/native 依赖面大。术语：这是 Tier 3 的横向 agent harness 候选，最适合 `clone-and-run` 后做机制复用，而不是只读 README 翻译。（来源：LICENSE；git tag v15.10.4 at 98c91cfa99d85e0033820583d992dc49283db701；package.json scripts；Dockerfile；docs/tools/*.md）"
next_actions:
  - "extract-pattern"
unknowns:
  - "README 的 `40+ providers`、`32 built-in tools`、`13 lsp ops`、`27 dap ops`、`~27k lines of Rust core` 未在本次逐项复算；只能标为 README 自称。"
  - "未运行 `bun install`、`bun test`、`omp --smoke-test` 或 Docker build；因此 artifact.runnable 标为 `unknown`。"
  - "README benchmark 表如 `Grok Code Fast 1 6.7% -> 68.3%`、`Grok 4 Fast -61% tokens` 未找到本仓库内完整可复现实验报告；只能标为自称。"
  - "MCP、web_search、OAuth provider、browser、image generation 的真实可用性取决于本机凭据、网络和外部 API，未在 README/docs/tree 说明默认可用。"
  - "TTSR 文档写 `TtsrSettings.enabled` 当前未在 runtime gating 检查；这是否为设计选择还是待修 bug 未在文档说明。"
  - "Windows 下 native addon、bash shell、ProjFS 隔离的真实体验未运行验证；install.ps1 只说明会查找 Git Bash/WSL/Cygwin/MSYS2 bash。"
builder_reuse:
  pattern: "Hashline anchored edits"
  copy: "把 read 输出设计成带 snapshot tag 的可编辑视图，例如 `¶a.ts#0A3B` + `replace 1..1:`；patcher 在写入前验证 full-file hash，multi-section patch 先 preflight，避免部分落盘。"
  skip: "如果你的 agent 只做只读问答，或者所有编辑都由 IDE API transaction 管理，hashline 的额外格式训练成本未必值得。"
  why_it_matters: "LLM 编辑失败常来自 stale context 和字符串找不到；hashline 把“要改哪几行”和“看到的是哪个版本”显式化。（来源：docs/tools/edit.md Inputs；packages/hashline/README.md SnapshotStore/Patcher）"
dependency_platform_risk:
  dependency: "Bun >= 1.3.14"
  what_if_change: "Bun 版本不足会直接在 `src/cli.ts` 报错退出；install 脚本也检查 `MIN_BUN_VERSION=1.3.14`。"
  exposure: "high"
  mitigation_or_unknown: "README 和 install scripts 都写明 Bun 要求；是否支持纯 Node 未在 README/docs/tree 说明。"
claim_ledger:
  - claim: "README 自称 `32 built-in tools`。"
    plain_english: "作者说盒子里有 32 个工具，但实际代码注册表显示 29 个公开内置工具和 5 个隐藏工具；这说明 README 的统计口径未在代码里直接等同为一个 32 项数组。"
    source: "README Whatever the task needs；packages/coding-agent/src/tools/index.ts BUILTIN_TOOLS/HIDDEN_TOOLS"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "代码确有大量内置工具注册；公开注册表 29 项，隐藏注册表 5 项。"
    does_not_support: "不支持把 README 的 32 作为本次独立核实后的精确工具数。"
    threat: "工具是否默认可用还受 `settings.get(...)`、`enableLsp`、`task.maxRecursionDepth`、memory backend 等门控影响。"
  - claim: "`edit` 默认是 hashline patch language，要求 `¶PATH#TAG` 或 `[PATH#TAG]` 这类内容锚点。"
    plain_english: "模型不是靠全文 diff 猜位置，而是先从 `read` 得到文件 tag，再用 `replace 1..1:`、`insert after 5:`、`delete 4..5` 这类行操作提交补丁。"
    source: "docs/tools/edit.md Inputs；packages/hashline/README.md Format"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "docs 给出 `¶a.ts#0A3B`、`replace 1..1:`、`insert after 5:`、`delete 4..5` 的 worked examples；hashline README 说明 tag 是 full-file content hash 的 4-hex 记录。"
    does_not_support: "不证明所有模型都会一次写对；只证明工具协议有锚点校验和 recovery 机制。"
    threat: "tag 只在当前 `SnapshotStore` 有意义；跨 session 或未先 read/search 的编辑会失败。"
  - claim: "`read` 是统一入口，可以读文件、URL、SQLite、archive、internal URL，并为 hashline 编辑留缓存。"
    plain_english: "代理看到的不是裸 `cat` 输出，而是带选择器、截断、摘要、hashline header、内部协议解析的读取层。"
    source: "docs/tools/read.md Inputs；docs/tools/read.md Flow；docs/tools/read.md Limits & Caps"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "文档列出 selector 如 `:raw`、`:A-B`、`:A+C`、`:R1,R2`；archive 支持 `.tar/.tar.gz/.tgz/.zip`；SQLite 默认 query limit `20`、max `500`；URL 输出截到 `300` 行和 `50 KiB`。"
    does_not_support: "不证明每个文档格式转换都稳定；转换失败会返回 `[Cannot read .pdf file: ...]`。"
    threat: "URL 读取有网络和站点解析风险；SQLite raw `q=` 不限制必须 SELECT，只依赖只读打开和外围契约。"
  - claim: "LSP 工具能做诊断、定义、引用、rename、rename_file、code_actions 和 raw request。"
    plain_english: "它把 IDE 语言服务器能力暴露给模型，例如 rename 文件前先发 `workspace/willRenameFiles`，应用后发 `workspace/didRenameFiles`。"
    source: "docs/tools/lsp.md Inputs；docs/tools/lsp.md Flow；packages/coding-agent/src/lsp/defaults.json"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "docs 的 action enum 包含 `diagnostics,definition,references,hover,symbols,rename,rename_file,code_actions,type_definition,implementation,status,reload,capabilities,request`；defaults.json 配置 `rust-analyzer`、`typescript-language-server`、`pyright`、`gopls` 等。"
    does_not_support: "不保证用户机器已安装每个 language server。"
    threat: "LSP 是本地 stdio 子进程；缺少二进制、项目初始化慢或 server 行为差异会影响结果。"
  - claim: "`task` 子代理能并行、隔离、结构化返回，并通过 `agent://<id>` 被父代理读取。"
    plain_english: "一个大任务可以分给多个 worker；每个 worker 的完整输出写成 artifact，父代理用统一 `read agent://...` 读取。"
    source: "docs/tools/task.md Outputs；docs/tools/task.md Flow；packages/coding-agent/src/prompts/agents/*.md"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "docs 说明 `<id>.md`、`<id>.jsonl`、`<id>.patch`、`agent://<id>/<path>`；内置 agent prompt 文件包括 `explore,plan,designer,reviewer,task,librarian,oracle` 等。"
    does_not_support: "不证明隔离合并永远无冲突；docs 明确 patch/branch merge 失败会留下人工处理 artifact。"
    threat: "隔离执行要求 git repo；FUSE/ProjFS/backend fallback 与平台有关。"
  - claim: "`web_search` 有 14 个 provider 的顺序 fallback。"
    plain_english: "搜索不是写死一个供应商；`auto` 会按固定顺序找已配置 provider，先成功先返回。"
    source: "docs/tools/web_search.md Flow；packages/coding-agent/src/web/search/types.ts SEARCH_PROVIDER_ORDER"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`SEARCH_PROVIDER_ORDER` 精确列出 `tavily,perplexity,brave,jina,kimi,anthropic,gemini,codex,zai,exa,parallel,kagi,synthetic,searxng`。"
    does_not_support: "不证明这些 provider 都可用；每个都需要对应 OAuth/API key/endpoint。"
    threat: "外部 API 价格、限流、认证方式和返回格式会变。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 34: 人话：值得看的是“代理 harness”本身：它把容易导致编码代理失败的环节拆成可检查的工具协议，例如读文件时生成编辑锚点、编辑时校验锚点、结构化 AST 改写先预览再 `resolve`、LSP rename 走 `workspace/willRenameFiles`、子..."
artifact_audit:
  official_repo: "https://github.com/can1357/oh-my-pi"
  official_data: "not_found"
  evaluation_code: "not_found"
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
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

can1357/oh-my-pi：GitHub 描述为“⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more”。

（来源：README/artifactAudit）

## 干什么

⌥ AI Coding agent for the terminal — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | TypeScript |
| total_stars | 11193 |
| stars_in_period | 7042 |
| author | can1357 |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

人话：值得看的是“代理 harness”本身：它把容易导致编码代理失败的环节拆成可检查的工具协议，例如读文件时生成编辑锚点、编辑时校验锚点、结构化 AST 改写先预览再 `resolve`、LSP rename 走 `workspace/willRenameFiles`、子代理必须通过 `yield` 收尾。术语：这是一个多工具 agent runtime，不只是 CLI UI；`createAgentSession()` 会发现 auth/model/settings/session/skills/extensions/MCP/LSP/built-in tools，`createTools()` 注册 29 个公开内置工具和 5 个隐藏工具，默认 essential tools 是 `read,bash,edit`。（来源：docs/sdk.md What createAgentSession discovers by default；packages/coding-agent/src/tools/index.ts BUILTIN_TOOLS；packages/coding-agent/src/tools/index.ts DEFAULT_ESSENTIAL_TOOL_NAMES）

## 核心能力

- Hashline anchored edits（来源：数据不足）
- Preview-first structural rewrite（来源：数据不足）
- Internal URL filesystem（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

人话：横向看，oh-my-pi 更像“把终端编码代理、工具平台、SDK、native harness 都塞进一个发行物”的路线；Claude Code、OpenAI Codex CLI、aider 更常被用户作为终端编码代理入口来比较。竞品事实只用公开入口做类别定位：Claude Code 官网称其运行在 terminal 并可配合 IDE；OpenAI Codex GitHub/Help 称 Codex CLI 是本地终端 coding agent；aider 官网称其是 terminal AI pair programming。术语与取舍：选 omp，当你要研究/复用 hashline、TTSR、internal URL、MCP discovery、LSP/DAP/native Rust 工具、SDK/session/subagent 这些 harness 机制；选 Claude Code，当你主要押 Anthropic 官方产品体验和企业集成，且不需要读源码改 harness；选 OpenAI Codex CLI，当你主要押 OpenAI 官方终端代理和其 sandbox/approval/profile 生态，且不需要 omp 的 Rust native + hashline 协议；选 aider，当你想要更轻量、成熟、以 Git diff/提交工作流为中心的终端 pair programmer，而不是全套工具平台。上述竞品能力没有在本仓库内核验，除“终端编码代理/terminal pair programming”定位外不写为已核实性能结论。（来源：README Four entry points；docs/sdk.md；docs/tools/edit.md；外部定位来源：https://www.claude.com/product/claude-code；https://github.com/openai/codex；https://aider.chat/）

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话：一个真实 flow 可以这样走：用户运行 `omp -p "List all .ts files in src/"`，`packages/coding-agent/src/cli.ts` 会把非子命令 argv 改写为 `launch`，`packages/coding-agent/src/commands/launch.ts` 定义 `-p/--print`、`--model`、`--tools`、`--no-lsp`、`--approval-mode` 等参数，然后 `runRootCommand` 创建 agent session。session 创建后，`createTools()` 默认注册 `read,bash,edit` 等工具；当模型需要看文件，`read` 对本地文本输出 `¶src/foo.ts#0A1B` 加 `41:def alpha():` 这种 hashline header/行号，并把读取内容写入 `session.fileReadCache`。模型编辑时调用 `edit`，输入像 `¶a.ts#0A3B replace 1..1: +const X = "b";`；`edit` 通过 snapshot tag 验证 live file 是否仍匹配，失败时走 snapshot recovery 或返回 mismatch。结构性替换则走 `ast_edit`：输入 `ops: [{ pat, out }], paths: [...]`，先 dry-run 预览，真正落盘必须后续 `resolve(action:"apply")`。如果任务很大，`task` 会按 `task.maxConcurrency` 分派子代理，子代理输出 `<id>.md`，父代理再读 `agent://<id>` 汇总。术语：这条链路包含 CLI routing、session discovery、tool registry、read snapshot store、hashline patcher、resolve preview queue、subagent artifact protocol；对应源码/文档锚点是 `packages/coding-agent/src/cli.ts runCli`、`packages/coding-agent/src/commands/launch.ts flags/examples`、`docs/tools/read.md Flow`、`docs/tools/edit.md Worked examples`、`docs/tools/ast-edit.md Flow`、`docs/tools/task.md Flow`。

（来源：README/artifactAudit）

## 本质不同的设计取舍

人话：可复用的不是某个 UI，而是几套把 LLM 失误面缩小的协议。术语：下面只列仓库里能看到的抽象。 - Hashline anchored edits；把 read 输出设计成带 snapshot tag 的可编辑视图，例如 `¶a.ts#0A3B` + `replace 1..1:`；patcher 在写入前验证 full-file hash，multi-section patch 先 preflight，避免部分落盘。；如果你的 agent 只做只读问答，或者所有编辑都由 IDE API transaction 管理，hashline 的额外格式训练成本未必值得。；LLM 编辑失败常来自 stale context 和字符串找不到；hashline 把“要改哪几行”和“看到的是哪个版本”显式化。（来源：docs/tools/edit.md Inputs；packages/hashline/README.md SnapshotStore/Patcher） - Preview-first structural rewrite；`ast_edit` 固定先 dry-run，显示 per-file replacements，排队一个 `resolve` action；apply 时重新计算并比较 replacement totals/per-file counts，stale preview 报错。；如果项目语言不在 tree-sitter/ast-grep 支持范围，或变更需要复杂语义分析，单纯 AST pattern rewrite 不够。；它把 codemod 从“模型直接改文件”变成“模型提出结构规则，人或系统确认后落盘”。（来源：docs/tools/ast-edit.md Flow；docs/tools/ast-edit.md Errors） - Internal URL filesystem；让 `read` 统一处理 `agent://`、`artifact://`、`issue://`、`pr://`、`rule://`、`skill://`、`memory://` 等资源；子代理 JSON 输出还能用 `agent://<id>/<path>` 抽字段。；如果系统资源很少，普通 API 参数更直观；internal URL 需要维护 resolver、权限、分页和不可变资源语义。；模型只学一个 `read path` 接口，就能读取文件、PR、规则、技能和子代理结果。（来源：docs/tools/read.md Internal URLs；docs/tools/task.md Outputs；docs/skills.md skill:// URL behavior） - TTSR stream interruption；规则文件用 frontmatter 写 `condition`、`scope`、`interruptMode`，匹配 stream delta 后可 abort、注入 `<system-interrupt>`、继续生成；工具源非中断匹配则把 `<system-reminder>` prepend 到 tool result。；如果模型供应商不提供可中断流，或你不愿为规则误报承担重试成本，不要照搬。；规则不必每轮塞进上下文；只有模型偏航时才把相关规则注入。（来源：docs/ttsr-injection-lifecycle.md Retry scheduling；.omp/rules/ts-hook-fetch.md） - Subagent artifact protocol；每个子代理必须通过隐藏 `yield` 工具结束，输出写 `<id>.md`，父代理用 `agent://<id>` 读取；缺失 yield 最多发 3 次 reminder。；如果任务不能并行或没有可合并 artifact，子代理只会增加复杂度和模型费用。；父代理不需要从自由文本里猜 worker 状态；输出、patch、branch、usage、duration 都有结构化字段。（来源：docs/tools/task.md Outputs；docs/tools/task.md Flow；docs/tools/task.md Limits & Caps）

## 对从业者意味着什么

人话：建议不是先把它当日常主力工具盲装，而是抽取设计模式：hashline、read/internal URL、preview-first AST rewrite、TTSR、subagent artifact/yield、MCP config discovery 都很值得 AI 工程师拆读。成熟度给 4：仓库有 MIT license、15.10.4 版本、Dockerfile、CI/installer、很多 tests/docs，但当前热度和 README 自称指标需要运行验证，且外部 provider/native 依赖面大。术语：这是 Tier 3 的横向 agent harness 候选，最适合 `clone-and-run` 后做机制复用，而不是只读 README 翻译。（来源：LICENSE；git tag v15.10.4 at 98c91cfa99d85e0033820583d992dc49283db701；package.json scripts；Dockerfile；docs/tools/*.md）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/hashline]]、[[concepts/ttsr]]。另见 [[content/can1357-oh-my-pi]]、[[claims/can1357-oh-my-pi-main-claim]]。
