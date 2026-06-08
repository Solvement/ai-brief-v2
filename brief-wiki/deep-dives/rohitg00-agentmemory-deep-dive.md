---
content: "rohitg00-agentmemory"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "agentmemory — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "rohitg00/agentmemory：基于真实基准测试的 AI 编程智能体持久记忆。"
  what_it_does: "#1 Persistent memory for AI coding agents based on real-world benchmarks"
  metadata:
    language: "TypeScript"
    total_stars: "21844"
    stars_in_period: "19547"
    author: "rohitg00"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "人话：值得看的是它不是只写一个 MEMORY.md 文件，而是把“自动采集、搜索、工具面、API、viewer、评测”都放在一个仓库里。术语：仓库里有 `plugin/hooks/hooks.json` 的 12 个 Claude Code 生命周期 hook、`src/triggers/api.ts` 的 128 个 HTTP trigger、`src/mcp/tools-registry.ts` 的 53 个 MCP tool、`eval/` 和 `benchmark/` 的评测脚本与报告。（来源：plugin/hooks/hooks.json；src/triggers/api.ts registerTrigger；src/mcp/tools-registry.ts getAllTools；eval/README.md）"
  core_capabilities:
    - "Hook-to-observation 管道"
    - "Progressive MCP tool surface"
    - "Hybrid retrieval with graceful fallback"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "{\"body_md\":\"人话：agentmemory 更像“本地的编程代理记忆层”，不是完整 agent runtime，也不是普通 RAG 文档库。术语：直接可比项可以按接入路径、检索机制、自托管、成熟度和工作流 fit 判断。\\n\\n1. 对比 built-in memory，例如 `CLAUDE.md`、`.cursorrules`、Cline memory-bank：agentmemory 的差异是自动 hook 采集、REST/MCP 查询和全库检索；built-in file 的优势是零服务、可读、少依赖。做小项目、只存几十条偏好时选 built-in；会话历史超过 200 条观察、需要跨 agent 或跨 session 查询时选 agentmemory。README/benchmark 对 built-in 的 200-line cap、token unreachable 等数字属于项目方自称，未本次独立复现。（来源：README Why agentmemory；benchmark/SCALE.md）\\n\\n2. 对比 mem0：agentmemory 仓库自己的 comparison 说 mem0 是 memory layer API，主要靠手动 `add()` 或 API 集成，外部依赖可到 Qdrant/pgvector；agentmemory 是 memory engine + MCP server，强调 hooks 自动采集和本地 iii KV。构建已有产品内存 API 时 mem0 的 SDK/云路径更直接；给 Claude Code/Codex/Cursor 这类编程代理加共享本地记忆时 agentmemory fit 更强。mem0 的分数和功能描述在本仓库 comparison 里标为 vendor/project published，未独立核验。（来源：benchmark/COMPARISON.md Feature Matrix/What Each Tool Is Best At）\\n\\n3. 对比 Letta/MemGPT：仓库 comparison 把 Letta/MemGPT 定位为 full agent runtime，agentmemory 则不替代代理运行时，只提供记忆 server、MCP、REST、hooks。需要长运行 conversational agent 和 runtime 管理时选 Letta；已有多个 coding agent，只缺跨会话记忆时选 agentmemory。Letta 的 LoCoMo 数字在本仓库中明确不是同一 benchmark，属于未复现 vendor claim。（来源：benchmark/COMPARISON.md Retrieval Accuracy/Feature Matrix）\\n\\n4. 对比 codegraph / Understand Anything / Graphify：这些不是直接替代，而是上下文层互补。codegraph 管代码结构 MCP，agentmemory 管会话历史；Graphify 管代码、docs、PDF、图像、视频的知识图；Understand Anything 偏 dashboard 和 on-demand 项目理解。问“谁调用这个函数”选 codegraph；问“上周为什么改认证中间件”选 agentmemory。（来源：docs/recipes/pairings.md）\"}"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话：最小真实流程可以从 `examples/python/quickstart.py` 看清楚：先连 `ws://localhost:49134`，触发 `mem::remember` 保存 `project: demo`、`title: auth-stack`、`content: Service uses HMAC bearer tokens; refresh every 24h.`、`concepts: [auth,hmac,refresh]`，再触发 `mem::smart-search` 查询 `how do tokens refresh`、`limit: 5`。术语：`mem::remember` 在 `src/functions/remember.ts` 中校验 content/files/concepts，把 memory 写入 `KV.memories`，类型限制在 `pattern/preference/architecture/bug/workflow/fact`，相似度 `jaccardSimilarity > 0.7` 时会把旧 memory 标成非 latest 并设置 version/parent/supersedes，然后调用 `getSearchIndex().add(memoryToObservation(memory))` 和 `vectorIndexAddGuarded(...)`。检索时 `src/functions/smart-search.ts` 的 `mem::smart-search` 会调用注入的 searchFn；`src/state/hybrid-search.ts` 先 BM25，再可选 vector，再按 query entity 做 graph retrieval，最后用 RRF 加权、按 session 做最多 3 条的多样化，返回 compact 的 `obsId/sessionId/title/type/score/timestamp`。如果代理不是手动保存，而是 hook 自动采集，`plugin/hooks/hooks.json` 会把 `PostToolUse` 指向 `node ${CLAUDE_PLUGIN_ROOT}/scripts/post-tool-use.mjs`；HTTP 侧 `/agentmemory/observe` 要求 `hookType/sessionId/project/cwd/timestamp`，再触发 `mem::observe`。默认 LLM 自动压缩关闭时，`mem::observe` 用 `buildSyntheticCompression(raw)` 生成可索引内容；打开 `AGENTMEMORY_AUTO_COMPRESS=true` 才会触发 `mem::compress`。（来源：examples/python/quickstart.py；src/functions/remember.ts；src/functions/smart-search.ts；src/state/hybrid-search.ts；plugin/hooks/hooks.json；src/triggers/api.ts api::observe；src/functions/observe.ts）"
  essential_design_difference: "人话：可复用的不是“记忆”这个词，而是几个明确工程接口。术语：这些抽象都能从源码或配置中定位。 - Hook-to-observation 管道 — copy: 把 agent 生命周期事件统一转成 `HookPayload`，字段至少有 `sessionId`、`hookType`、`timestamp`、`project`、`cwd`，再脱敏、去重、写 KV、写 stream。可复用到任意需要审计 agent 行为的系统。（来源：src/functions/observe.ts；src/triggers/api.ts api::observe）；skip: 如果你的 agent 不能稳定输出 lifecycle hooks，或者只需要显式 `save()` API，不必复制 hook 层。；why: 自动采集比手动 add 更接近真实工作流，但也带来隐私、成本和噪声治理问题。 - Progressive MCP tool surface — copy: `AGENTMEMORY_TOOLS=core` 暴露精简 essential tools，默认 all 暴露完整 53 工具；`ESSENTIAL_TOOLS` 明确列出 `memory_save`、`memory_recall`、`memory_consolidate`、`memory_smart_search`、`memory_sessions`、`memory_diagnose`、`memory_lesson_save`、`memory_reflect`。（来源：src/mcp/tools-registry.ts）；skip: 如果宿主模型工具选择能力弱，53 个工具会增加选择负担，直接保留 core 更稳。；why: AI 应用常见问题不是没有工具，而是工具太多导致错用；分层暴露是实用设计。 - Hybrid retrieval with graceful fallback — copy: BM25 始终可用；vector provider 不存在或 embed 失败时跳过；graph retrieval 是 best-effort；合成分数用 RRF，权重会按实际有结果的 stream 重新归一。（来源：src/state/hybrid-search.ts）；skip: 如果数据量小于几十条，普通 grep/SQLite LIKE 足够，hybrid 会增加运行和调参复杂度。；why: 记忆系统不能因为 embedding API 失败就无法回忆，降级路径比单一向量库更抗故障。 - Agent scope isolation — copy: 写入时 `AGENT_ID` 会标到 `Session/RawObservation/CompressedObservation/Memory`，`AGENTMEMORY_AGENT_SCOPE=isolated` 时 search/smart-search 无 agentId 会 fail-closed，`agentId: *` 才显式通配。（来源：src/config.ts loadAgentScope；src/functions/search.ts；src/functions/smart-search.ts）；skip: 单人单代理本地使用时不需要隔离，shared 默认更方便。；why: 多代理共享记忆时，审计和隔离比单纯共享更重要。 - Benchmark harness adapters — copy: `eval/runner/adapters/` 有 grep、vector、agentmemory 三类 adapter；coding-life 跑 15 fictional sessions/15 queries，LongMemEval 跑 public 500 questions；报告输出 `scores.ndjson` 和 `summary.json`。（来源：eval/README.md）；skip: 如果没有固定 gold session 或评价集，先不要写漂亮 benchmark，先收集真实查询失败样本。；why: 记忆系统很容易只靠 demo 讲故事；adapter 化评测能把检索层单独拿出来测。"
  practitioner_meaning: "人话：值得继续，但下一步应该是 clone-and-run，而不是直接相信 README 数字。它的源码面很完整：CLI、REST、MCP、hooks、viewer、eval、benchmark、docker 都在；关键路径也能从 `observe -> remember/search -> smart-search/context` 读通。术语：成熟度扣分来自文档漂移和未复现 claims：embedding 默认、MCP tool count、benchmark scripts 与 package.json 不一致。工程上可抽取的模式是 hook 自动采集、MCP 工具分层、hybrid retrieval graceful fallback、agent scope isolation；作为生产依赖前，应在干净 HOME/端口 sandbox 中跑 `agentmemory demo --serve`、`npm test`、`npm run eval:coding-life -- --adapters grep,agentmemory`。（来源：src/index.ts；src/functions/observe.ts；src/state/hybrid-search.ts；src/mcp/tools-registry.ts；eval/README.md；package.json scripts）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "agentmemory 是给 AI 编程代理用的本地持久记忆服务器，核心路径是 hooks/REST/MCP 写入观察，再用 BM25、向量和图检索把相关历史找回来。"
    body_md: "人话：它把代理做过的事、保存过的决定、项目偏好和会话片段放进本地服务，下次代理可以搜索而不是让你重讲。术语：这是一个 TypeScript/Node 包，npm 名为 `@agentmemory/agentmemory`，bin 是 `agentmemory`，主服务注册 iii worker、REST 触发器、MCP 工具和 viewer；包版本为 `0.9.27`，Node 要求 `>=20.0.0`。（来源：package.json name/version/bin/engines；src/index.ts main）"
  why_worth_attention:
    summary: ""
    body_md: "人话：值得看的是它不是只写一个 MEMORY.md 文件，而是把“自动采集、搜索、工具面、API、viewer、评测”都放在一个仓库里。术语：仓库里有 `plugin/hooks/hooks.json` 的 12 个 Claude Code 生命周期 hook、`src/triggers/api.ts` 的 128 个 HTTP trigger、`src/mcp/tools-registry.ts` 的 53 个 MCP tool、`eval/` 和 `benchmark/` 的评测脚本与报告。（来源：plugin/hooks/hooks.json；src/triggers/api.ts registerTrigger；src/mcp/tools-registry.ts getAllTools；eval/README.md）"
    bullets:
      - "自动采集链路已核实：`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`、`SessionEnd` 等 hook 都映射到 `plugin/scripts/*.mjs`。（来源：plugin/hooks/hooks.json）"
      - "MCP 工具面已核实为 53 个 `memory_*` 工具，包括 `memory_save`、`memory_smart_search`、`memory_sessions`、`memory_lease`、`memory_signal_send`、`memory_slot_*`。（来源：src/mcp/tools-registry.ts getAllTools）"
      - "REST 面已核实注册 128 个 trigger，关键路径有 `/agentmemory/remember`、`/agentmemory/smart-search`、`/agentmemory/context`、`/agentmemory/export`、`/agentmemory/audit`。（来源：src/triggers/api.ts api_path）"
      - "它自带 LongMemEval-S、coding-agent-life-v1、scale/quality 报告，但这些是项目方仓库内报告；我未在本次任务重跑 benchmark。（来源：benchmark/LONGMEMEVAL.md；docs/benchmarks/2026-05-20-coding-agent-life-v1.md；eval/README.md）"
  key_claims_evidence:
    summary: ""
    body_md: "人话：下面把 README 的宣传和代码里能核实的机制分开。术语：自称表示 README/benchmark 文档的项目方说法；已核实表示我在源码、配置或 package 中看到具体实现入口。"
    items:
      - claim: "安装和启动入口是 `npm install -g @agentmemory/agentmemory`、`agentmemory`、`agentmemory demo`、`agentmemory connect claude-code`、`npx @agentmemory/agentmemory`。"
        plain_english: "用户可以把它当本地守护进程启动，也可以用 npx 临时运行。"
        source: "README Install；package.json bin"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "package.json 定义 `bin.agentmemory = dist/cli.mjs`，README 给出上述命令。"
        does_not_support: "没有证明这些命令在当前机器已成功运行；本次只检查仓库文件。"
        threat: "README 的命令依赖已发布 npm 包和 iii runtime，源码存在不等于本机运行成功。"
      - claim: "MCP 工具默认完整面是 53 个工具，精简模式是 core。"
        plain_english: "代理接入后能看到一批 memory_* 工具；工具数量不是 README 空话，源码里能数到。"
        source: "src/mcp/tools-registry.ts getAllTools/getVisibleTools；INSTALL_FOR_AGENTS.md Tool surface"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`getAllTools()` 返回 CORE_TOOLS、V040、V050、V051、V061、V070、V073、V010_SLOTS 拼接；源码中 `memory_` 工具名为 53 个。`getVisibleTools()` 根据 `AGENTMEMORY_TOOLS` 返回 all 或 core。"
        does_not_support: "`.env.example` 仍写着 core 7/all 51，和当前源码/安装文档的 53/8 有文档漂移。"
        threat: "MCP 客户端实际可见数量还取决于服务器是否在线、shim 是否 fallback、环境变量设置。"
      - claim: "REST API 有 128 个 endpoint/trigger。"
        plain_english: "它不是只有 MCP，也提供 HTTP API。"
        source: "src/triggers/api.ts registerTrigger；README API"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`src/triggers/api.ts` 中 `registerTrigger` 出现 128 次；关键 path 包括 `/agentmemory/livez`、`/agentmemory/health`、`/agentmemory/session/start`、`/agentmemory/remember`、`/agentmemory/smart-search`。"
        does_not_support: "没有逐个验证每个 endpoint 的运行结果。"
        threat: "iii-engine 注册失败或环境不完整时，源码中的 trigger 不等于运行时全部可用。"
      - claim: "写入流程会去重、脱敏、保存 KV、写 stream，并在默认关闭 LLM 压缩时走 synthetic compression。"
        plain_english: "代理的一次 hook 不只是原样保存；它会先做安全处理，再生成可检索的压缩条目。"
        source: "src/functions/observe.ts registerObserveFunction"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`mem::observe` 校验 `sessionId/hookType/timestamp`，调用 `stripPrivateData`，写 `KV.observations(sessionId)`，发送 `stream::set`/`stream::send`，`AGENTMEMORY_AUTO_COMPRESS` 关闭时调用 `buildSyntheticCompression(raw)` 并加入 BM25/vector。"
        does_not_support: "脱敏规则覆盖率和实际隐私安全未做动态测试。"
        threat: "hook payload 格式变化、插件脚本失败或环境变量打开 LLM 压缩会改变成本和行为。"
      - claim: "检索是 BM25、Vector、Graph 三路融合，RRF 常数为 60，默认权重 BM25 0.4、Vector 0.6、Graph 0.3。"
        plain_english: "它把关键词命中、语义向量和图关系结果合并排序。"
        source: "src/state/hybrid-search.ts；src/config.ts loadEmbeddingConfig；src/index.ts HybridSearch constructor"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`HybridSearch.tripleStreamSearch()` 先查 `bm25.search(query, limit * 2)`，再查 vector，实体抽取后走 `graphRetrieval.searchByEntities`，用 `1/(RRF_K + rank)` 加权合成；`RRF_K = 60`。"
        does_not_support: "默认本地 embedding 是否自动启用存在源码/README 差异：`detectEmbeddingProvider()` 无 key 且无 `EMBEDDING_PROVIDER` 时返回 null。"
        threat: "如果没有 embedding provider，运行日志会进入 BM25+Graph 或 BM25-only，README 的 local embeddings 默认说法需运行确认。"
      - claim: "LongMemEval-S 自称结果：agentmemory BM25+Vector R@5 95.2%、R@10 98.6%、MRR 88.2%。"
        plain_english: "项目方给了可复现的检索评测报告，但我没有重跑。"
        source: "benchmark/LONGMEMEVAL.md Results"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "报告写明数据集 LongMemEval-S 500 questions、约 48 sessions/question、约 115K tokens、embedding `all-MiniLM-L6-v2`、no LLM in loop。"
        does_not_support: "这不是端到端 QA 准确率；报告自己说明是 retrieval recall，不是 LongMemEval 官方 QA leaderboard 分数。"
        threat: "未本地复现，依赖数据集版本、脚本、embedding provider 和检索实现。"
      - claim: "coding-agent-life-v1 自称结果：15 sessions、15 queries，agentmemory-hybrid P@5 0.240、R@5 1.000、Hit rate 15/15、p50 latency 14 ms。"
        plain_english: "小型内部编程代理语料上，项目方说 hybrid 找回了所有 gold session。"
        source: "docs/benchmarks/2026-05-20-coding-agent-life-v1.md Headline/Per-adapter"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "报告给出 math ceiling：12 个问题 1 gold、3 个问题 2 gold，P@5 上限 0.240；sandbox 端口 3411/3412；通过生产 `/agentmemory/smart-search` 路径。"
        does_not_support: "样本很小且 gold-sparse，报告自己说 aggregate P@5 饱和，不能代表大规模真实项目泛化。"
        threat: "内部 fictional sessions，未重跑。"
      - claim: "Apache-2.0 许可。"
        plain_english: "可以按 Apache 2.0 条款使用和分发。"
        source: "LICENSE；package.json license"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "package.json `license` 为 `Apache-2.0`，LICENSE 文件是 Apache License Version 2.0。"
        does_not_support: "不代表第三方依赖、模型权重或外部服务都同许可。"
        threat: "使用本地/云 embedding 或 LLM 时还要看对应 provider 条款。"
  how_it_works:
    summary: ""
    body_md: "人话：最小真实流程可以从 `examples/python/quickstart.py` 看清楚：先连 `ws://localhost:49134`，触发 `mem::remember` 保存 `project: demo`、`title: auth-stack`、`content: Service uses HMAC bearer tokens; refresh every 24h.`、`concepts: [auth,hmac,refresh]`，再触发 `mem::smart-search` 查询 `how do tokens refresh`、`limit: 5`。术语：`mem::remember` 在 `src/functions/remember.ts` 中校验 content/files/concepts，把 memory 写入 `KV.memories`，类型限制在 `pattern/preference/architecture/bug/workflow/fact`，相似度 `jaccardSimilarity > 0.7` 时会把旧 memory 标成非 latest 并设置 version/parent/supersedes，然后调用 `getSearchIndex().add(memoryToObservation(memory))` 和 `vectorIndexAddGuarded(...)`。检索时 `src/functions/smart-search.ts` 的 `mem::smart-search` 会调用注入的 searchFn；`src/state/hybrid-search.ts` 先 BM25，再可选 vector，再按 query entity 做 graph retrieval，最后用 RRF 加权、按 session 做最多 3 条的多样化，返回 compact 的 `obsId/sessionId/title/type/score/timestamp`。如果代理不是手动保存，而是 hook 自动采集，`plugin/hooks/hooks.json` 会把 `PostToolUse` 指向 `node ${CLAUDE_PLUGIN_ROOT}/scripts/post-tool-use.mjs`；HTTP 侧 `/agentmemory/observe` 要求 `hookType/sessionId/project/cwd/timestamp`，再触发 `mem::observe`。默认 LLM 自动压缩关闭时，`mem::observe` 用 `buildSyntheticCompression(raw)` 生成可索引内容；打开 `AGENTMEMORY_AUTO_COMPRESS=true` 才会触发 `mem::compress`。（来源：examples/python/quickstart.py；src/functions/remember.ts；src/functions/smart-search.ts；src/state/hybrid-search.ts；plugin/hooks/hooks.json；src/triggers/api.ts api::observe；src/functions/observe.ts）"
  reusable_abstractions:
    summary: ""
    body_md: "人话：可复用的不是“记忆”这个词，而是几个明确工程接口。术语：这些抽象都能从源码或配置中定位。"
    items:
      - name: "Hook-to-observation 管道"
        copy: "把 agent 生命周期事件统一转成 `HookPayload`，字段至少有 `sessionId`、`hookType`、`timestamp`、`project`、`cwd`，再脱敏、去重、写 KV、写 stream。可复用到任意需要审计 agent 行为的系统。（来源：src/functions/observe.ts；src/triggers/api.ts api::observe）"
        skip: "如果你的 agent 不能稳定输出 lifecycle hooks，或者只需要显式 `save()` API，不必复制 hook 层。"
        why_it_matters: "自动采集比手动 add 更接近真实工作流，但也带来隐私、成本和噪声治理问题。"
      - name: "Progressive MCP tool surface"
        copy: "`AGENTMEMORY_TOOLS=core` 暴露精简 essential tools，默认 all 暴露完整 53 工具；`ESSENTIAL_TOOLS` 明确列出 `memory_save`、`memory_recall`、`memory_consolidate`、`memory_smart_search`、`memory_sessions`、`memory_diagnose`、`memory_lesson_save`、`memory_reflect`。（来源：src/mcp/tools-registry.ts）"
        skip: "如果宿主模型工具选择能力弱，53 个工具会增加选择负担，直接保留 core 更稳。"
        why_it_matters: "AI 应用常见问题不是没有工具，而是工具太多导致错用；分层暴露是实用设计。"
      - name: "Hybrid retrieval with graceful fallback"
        copy: "BM25 始终可用；vector provider 不存在或 embed 失败时跳过；graph retrieval 是 best-effort；合成分数用 RRF，权重会按实际有结果的 stream 重新归一。（来源：src/state/hybrid-search.ts）"
        skip: "如果数据量小于几十条，普通 grep/SQLite LIKE 足够，hybrid 会增加运行和调参复杂度。"
        why_it_matters: "记忆系统不能因为 embedding API 失败就无法回忆，降级路径比单一向量库更抗故障。"
      - name: "Agent scope isolation"
        copy: "写入时 `AGENT_ID` 会标到 `Session/RawObservation/CompressedObservation/Memory`，`AGENTMEMORY_AGENT_SCOPE=isolated` 时 search/smart-search 无 agentId 会 fail-closed，`agentId: *` 才显式通配。（来源：src/config.ts loadAgentScope；src/functions/search.ts；src/functions/smart-search.ts）"
        skip: "单人单代理本地使用时不需要隔离，shared 默认更方便。"
        why_it_matters: "多代理共享记忆时，审计和隔离比单纯共享更重要。"
      - name: "Benchmark harness adapters"
        copy: "`eval/runner/adapters/` 有 grep、vector、agentmemory 三类 adapter；coding-life 跑 15 fictional sessions/15 queries，LongMemEval 跑 public 500 questions；报告输出 `scores.ndjson` 和 `summary.json`。（来源：eval/README.md）"
        skip: "如果没有固定 gold session 或评价集，先不要写漂亮 benchmark，先收集真实查询失败样本。"
        why_it_matters: "记忆系统很容易只靠 demo 讲故事；adapter 化评测能把检索层单独拿出来测。"
  dependency_platform_risk:
    summary: ""
    body_md: "人话：最大风险不是 TypeScript 写法，而是它把 npm、iii-engine、MCP 客户端、hook 格式、embedding/LLM provider 绑在同一运行链路里。术语：下面按依赖变化看暴露面。"
    items:
      - dependency: "iii-engine / iii-sdk"
        what_if_change: "engine worker 模型变化会影响 agentmemory worker 注册、state、stream、REST trigger。仓库 docker-compose 明确 pin 到 `iiidev/iii:${AGENTMEMORY_III_VERSION:-0.11.2}`，注释说 v0.11.6 的 sandbox-everything-via-`iii worker add` 模型尚未重构适配。"
        exposure: "high"
        mitigation_or_unknown: "使用默认 pinned `0.11.2`；升级 iii 前需要确认 worker 模型迁移。"
        source: "docker-compose.yml iii-engine comment；iii-config.yaml workers；package.json dependency iii-sdk 0.11.2"
      - dependency: "Node/npm packaging"
        what_if_change: "全局 CLI、npx、MCP shim 都依赖 npm 包发布和 Node >=20。`@agentmemory/mcp` 只是 thin shim，依赖 `@agentmemory/agentmemory` 并转发到 `dist/standalone.mjs`。"
        exposure: "medium"
        mitigation_or_unknown: "保留 pinned package version 或从源码 build；但本次未运行 npm install/build。"
        source: "package.json bin/engines/files；packages/mcp/package.json；packages/mcp/README.md"
      - dependency: "MCP clients and agent hook APIs"
        what_if_change: "Claude Code、Codex、OpenCode 等 hook 名称或插件变量变化会让自动采集失效。Codex hooks 文件只有 6 类 hook，而 Claude hooks 文件有 12 类。"
        exposure: "medium"
        mitigation_or_unknown: "REST `/agentmemory/observe` 和 MCP standalone 可作为替代接入；具体客户端兼容需实测。"
        source: "plugin/hooks/hooks.json；plugin/hooks/hooks.codex.json；INSTALL_FOR_AGENTS.md connect supported agent names"
      - dependency: "Embedding providers"
        what_if_change: "没有 embedding provider 时 vector leg 不会创建；README 写 local embeddings 默认可用，但当前源码 `detectEmbeddingProvider()` 在无 key 且无 `EMBEDDING_PROVIDER` 时返回 null，只有显式 `EMBEDDING_PROVIDER=local` 才会 new `LocalEmbeddingProvider`。"
        exposure: "medium"
        mitigation_or_unknown: "运行前设置 `EMBEDDING_PROVIDER=local` 并确认 `@xenova/transformers` 可加载；文档/源码差异需要维护者确认。"
        source: "README Embedding providers/Local models；.env.example Embedding provider；src/config.ts detectEmbeddingProvider；src/providers/embedding/index.ts；src/providers/embedding/local.ts"
      - dependency: "LLM providers and Claude Agent SDK fallback"
        what_if_change: "LLM 压缩、总结、图抽取、consolidation 依赖 provider key；无 key 时 `detectProvider()` 返回 noop。`AGENTMEMORY_ALLOW_AGENT_SDK=true` 会启用 Claude subscription fallback，但源码警告 Stop-hook recursion 风险。"
        exposure: "medium"
        mitigation_or_unknown: "默认保持 noop 和 `AGENTMEMORY_AUTO_COMPRESS=false`；只在明确接受成本时开启。"
        source: "src/config.ts detectProvider/isAutoCompressEnabled/isConsolidationEnabled；README Configuration"
      - dependency: "REST auth and localhost binding"
        what_if_change: "未设置 `AGENTMEMORY_SECRET` 时 localhost REST 默认开放；暴露到非 loopback 或反代时会有未授权访问风险。"
        exposure: "medium"
        mitigation_or_unknown: "设置 `AGENTMEMORY_SECRET`；`checkAuth()` 要求 `Authorization: Bearer <secret>`。"
        source: "src/triggers/api.ts checkAuth；.env.example Auth & security；README API"
  unknowns_to_confirm:
    summary: ""
    body_md: "人话：下面是不该替项目方补完的地方。术语：这些项在 README/docs/tree 中有信息不一致、未运行或未独立复现。"
    items:
      - "未运行 `npm install`、`npm test`、`agentmemory demo --serve`，所以 artifact.runnable 不能从本次检查证明。"
      - "README/INSTALL_FOR_AGENTS 说无 key 也有 local embeddings；源码 `detectEmbeddingProvider()` 默认返回 null。需运行默认启动日志确认实际行为。"
      - "`.env.example` 写 `AGENTMEMORY_TOOLS=all` 注释为 core 7/all 51；当前 `src/mcp/tools-registry.ts` 是 53 tools，INSTALL_FOR_AGENTS 写 full 53/core 8。需维护者清理文档漂移。"
      - "benchmark/COMPARISON.md 的运行命令写 `npm run bench:longmemeval`、`bench:quality`、`bench:scale`、`bench:real-embeddings`，但当前 package.json scripts 中是 `eval:longmemeval`、`eval:coding-life`、`bench:load`，未看到这些 bench:* 脚本。"
      - "README 的 1,423+ tests 是自称；仓库中 `test/*.test.ts` 文件数我看到 129，但没有运行 vitest 得到测试用例计数。"
      - "competitor star counts、mem0/Letta/MemPalace 等能力与分数只来自本仓库 comparison 文档，未到各上游独立核验。"
      - "Windows 原生路径：README/INSTALL_FOR_AGENTS 都说 WSL2 是 fast path，native Windows engine setup 手动且 `agentmemory connect` 不支持；未实测。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 3
    body_md: "人话：值得继续，但下一步应该是 clone-and-run，而不是直接相信 README 数字。它的源码面很完整：CLI、REST、MCP、hooks、viewer、eval、benchmark、docker 都在；关键路径也能从 `observe -> remember/search -> smart-search/context` 读通。术语：成熟度扣分来自文档漂移和未复现 claims：embedding 默认、MCP tool count、benchmark scripts 与 package.json 不一致。工程上可抽取的模式是 hook 自动采集、MCP 工具分层、hybrid retrieval graceful fallback、agent scope isolation；作为生产依赖前，应在干净 HOME/端口 sandbox 中跑 `agentmemory demo --serve`、`npm test`、`npm run eval:coding-life -- --adapters grep,agentmemory`。（来源：src/index.ts；src/functions/observe.ts；src/state/hybrid-search.ts；src/mcp/tools-registry.ts；eval/README.md；package.json scripts）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-ptp2\\\\rohitg00-agentmemory\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-ptp2\\rohitg00-agentmemory\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-ptp2\\rohitg00-agentmemory\\codex-last-message.json"
  invoked_at: "2026-06-08T13:56:09.744Z"
  completed_at: "2026-06-08T14:00:33.586Z"
  repo: "rohitg00/agentmemory"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "#1 Persistent memory for AI coding agents based on real-world benchmarks"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "安装和启动入口是 `npm install -g @agentmemory/agentmemory`、`agentmemory`、`agentmemory demo`、`agentmemory connect claude-code`、`npx @agentmemory/agentmemory`。"
    - "MCP 工具默认完整面是 53 个工具，精简模式是 core。"
    - "REST API 有 128 个 endpoint/trigger。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "docker-compose.yml iii-engine comment；iii-config.yaml workers；package.json dependency iii-sdk 0.11.2"
    - "package.json bin/engines/files；packages/mcp/package.json；packages/mcp/README.md"
    - "plugin/hooks/hooks.json；plugin/hooks/hooks.codex.json；INSTALL_FOR_AGENTS.md connect supported agent names"
    - "README Embedding providers/Local models；.env.example Embedding provider；src/config.ts detectEmbeddingProvider；src/providers/embedding/index.ts；src/providers/embedding/local.ts"
    - "src/config.ts detectProvider/isAutoCompressEnabled/isConsolidationEnabled；README Configuration"
    - "src/triggers/api.ts checkAuth；.env.example Auth & security；README API"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 3
  main_risk: "人话：值得继续，但下一步应该是 clone-and-run，而不是直接相信 README 数字。它的源码面很完整：CLI、REST、MCP、hooks、viewer、eval、benchmark、docker 都在；关键路径也能从 `observe -> remember/search -> smart-search/context` 读通。术语：成熟度扣分来自文档漂移和未复现 claims：embedding 默认、MCP tool count、benchmark scripts 与 package.json 不一致。工程上可抽取的模式是 hook 自动采集、MCP 工具分层、hybrid retrieval graceful fallback、agent scope isolation；作为生产依赖前，应在干净 HOME/端口 sandbox 中跑 `agentmemory demo --serve`、`npm test`、`npm run eval:coding-life -- --adapters grep,agentmemory`。（来源：src/index.ts；src/functions/observe.ts；src/state/hybrid-search.ts；src/mcp/tools-registry.ts；eval/README.md；package.json scripts）"
next_actions:
  - "clone-and-run"
unknowns:
  - "未运行 `npm install`、`npm test`、`agentmemory demo --serve`，所以 artifact.runnable 不能从本次检查证明。"
  - "README/INSTALL_FOR_AGENTS 说无 key 也有 local embeddings；源码 `detectEmbeddingProvider()` 默认返回 null。需运行默认启动日志确认实际行为。"
  - "`.env.example` 写 `AGENTMEMORY_TOOLS=all` 注释为 core 7/all 51；当前 `src/mcp/tools-registry.ts` 是 53 tools，INSTALL_FOR_AGENTS 写 full 53/core 8。需维护者清理文档漂移。"
  - "benchmark/COMPARISON.md 的运行命令写 `npm run bench:longmemeval`、`bench:quality`、`bench:scale`、`bench:real-embeddings`，但当前 package.json scripts 中是 `eval:longmemeval`、`eval:coding-life`、`bench:load`，未看到这些 bench:* 脚本。"
  - "README 的 1,423+ tests 是自称；仓库中 `test/*.test.ts` 文件数我看到 129，但没有运行 vitest 得到测试用例计数。"
  - "competitor star counts、mem0/Letta/MemPalace 等能力与分数只来自本仓库 comparison 文档，未到各上游独立核验。"
  - "Windows 原生路径：README/INSTALL_FOR_AGENTS 都说 WSL2 是 fast path，native Windows engine setup 手动且 `agentmemory connect` 不支持；未实测。"
builder_reuse:
  pattern: "Hook-to-observation 管道"
  copy: "把 agent 生命周期事件统一转成 `HookPayload`，字段至少有 `sessionId`、`hookType`、`timestamp`、`project`、`cwd`，再脱敏、去重、写 KV、写 stream。可复用到任意需要审计 agent 行为的系统。（来源：src/functions/observe.ts；src/triggers/api.ts api::observe）"
  skip: "如果你的 agent 不能稳定输出 lifecycle hooks，或者只需要显式 `save()` API，不必复制 hook 层。"
  why_it_matters: "自动采集比手动 add 更接近真实工作流，但也带来隐私、成本和噪声治理问题。"
dependency_platform_risk:
  dependency: "iii-engine / iii-sdk"
  what_if_change: "engine worker 模型变化会影响 agentmemory worker 注册、state、stream、REST trigger。仓库 docker-compose 明确 pin 到 `iiidev/iii:${AGENTMEMORY_III_VERSION:-0.11.2}`，注释说 v0.11.6 的 sandbox-everything-via-`iii worker add` 模型尚未重构适配。"
  exposure: "high"
  mitigation_or_unknown: "使用默认 pinned `0.11.2`；升级 iii 前需要确认 worker 模型迁移。"
claim_ledger:
  - claim: "安装和启动入口是 `npm install -g @agentmemory/agentmemory`、`agentmemory`、`agentmemory demo`、`agentmemory connect claude-code`、`npx @agentmemory/agentmemory`。"
    plain_english: "用户可以把它当本地守护进程启动，也可以用 npx 临时运行。"
    source: "README Install；package.json bin"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "package.json 定义 `bin.agentmemory = dist/cli.mjs`，README 给出上述命令。"
    does_not_support: "没有证明这些命令在当前机器已成功运行；本次只检查仓库文件。"
    threat: "README 的命令依赖已发布 npm 包和 iii runtime，源码存在不等于本机运行成功。"
  - claim: "MCP 工具默认完整面是 53 个工具，精简模式是 core。"
    plain_english: "代理接入后能看到一批 memory_* 工具；工具数量不是 README 空话，源码里能数到。"
    source: "src/mcp/tools-registry.ts getAllTools/getVisibleTools；INSTALL_FOR_AGENTS.md Tool surface"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`getAllTools()` 返回 CORE_TOOLS、V040、V050、V051、V061、V070、V073、V010_SLOTS 拼接；源码中 `memory_` 工具名为 53 个。`getVisibleTools()` 根据 `AGENTMEMORY_TOOLS` 返回 all 或 core。"
    does_not_support: "`.env.example` 仍写着 core 7/all 51，和当前源码/安装文档的 53/8 有文档漂移。"
    threat: "MCP 客户端实际可见数量还取决于服务器是否在线、shim 是否 fallback、环境变量设置。"
  - claim: "REST API 有 128 个 endpoint/trigger。"
    plain_english: "它不是只有 MCP，也提供 HTTP API。"
    source: "src/triggers/api.ts registerTrigger；README API"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`src/triggers/api.ts` 中 `registerTrigger` 出现 128 次；关键 path 包括 `/agentmemory/livez`、`/agentmemory/health`、`/agentmemory/session/start`、`/agentmemory/remember`、`/agentmemory/smart-search`。"
    does_not_support: "没有逐个验证每个 endpoint 的运行结果。"
    threat: "iii-engine 注册失败或环境不完整时，源码中的 trigger 不等于运行时全部可用。"
  - claim: "写入流程会去重、脱敏、保存 KV、写 stream，并在默认关闭 LLM 压缩时走 synthetic compression。"
    plain_english: "代理的一次 hook 不只是原样保存；它会先做安全处理，再生成可检索的压缩条目。"
    source: "src/functions/observe.ts registerObserveFunction"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`mem::observe` 校验 `sessionId/hookType/timestamp`，调用 `stripPrivateData`，写 `KV.observations(sessionId)`，发送 `stream::set`/`stream::send`，`AGENTMEMORY_AUTO_COMPRESS` 关闭时调用 `buildSyntheticCompression(raw)` 并加入 BM25/vector。"
    does_not_support: "脱敏规则覆盖率和实际隐私安全未做动态测试。"
    threat: "hook payload 格式变化、插件脚本失败或环境变量打开 LLM 压缩会改变成本和行为。"
  - claim: "检索是 BM25、Vector、Graph 三路融合，RRF 常数为 60，默认权重 BM25 0.4、Vector 0.6、Graph 0.3。"
    plain_english: "它把关键词命中、语义向量和图关系结果合并排序。"
    source: "src/state/hybrid-search.ts；src/config.ts loadEmbeddingConfig；src/index.ts HybridSearch constructor"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`HybridSearch.tripleStreamSearch()` 先查 `bm25.search(query, limit * 2)`，再查 vector，实体抽取后走 `graphRetrieval.searchByEntities`，用 `1/(RRF_K + rank)` 加权合成；`RRF_K = 60`。"
    does_not_support: "默认本地 embedding 是否自动启用存在源码/README 差异：`detectEmbeddingProvider()` 无 key 且无 `EMBEDDING_PROVIDER` 时返回 null。"
    threat: "如果没有 embedding provider，运行日志会进入 BM25+Graph 或 BM25-only，README 的 local embeddings 默认说法需运行确认。"
  - claim: "LongMemEval-S 自称结果：agentmemory BM25+Vector R@5 95.2%、R@10 98.6%、MRR 88.2%。"
    plain_english: "项目方给了可复现的检索评测报告，但我没有重跑。"
    source: "benchmark/LONGMEMEVAL.md Results"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "报告写明数据集 LongMemEval-S 500 questions、约 48 sessions/question、约 115K tokens、embedding `all-MiniLM-L6-v2`、no LLM in loop。"
    does_not_support: "这不是端到端 QA 准确率；报告自己说明是 retrieval recall，不是 LongMemEval 官方 QA leaderboard 分数。"
    threat: "未本地复现，依赖数据集版本、脚本、embedding provider 和检索实现。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 34: 人话：值得看的是它不是只写一个 MEMORY.md 文件，而是把“自动采集、搜索、工具面、API、viewer、评测”都放在一个仓库里。术语：仓库里有 `plugin/hooks/hooks.json` 的 12 个 Claude Code 生命周期 hook、`src/t..."
  - "faithfulness.high_risk_claim_attribution line 69: 人话：可复用的不是“记忆”这个词，而是几个明确工程接口。术语：这些抽象都能从源码或配置中定位。 - Hook-to-observation 管道 — copy: 把 agent 生命周期事件统一转成 `HookPayload`，字段至少有 `sessionId`、`hook..."
artifact_audit:
  official_repo: "https://github.com/rohitg00/agentmemory"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "Apache-2.0"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "reproducible"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

rohitg00/agentmemory：基于真实基准测试的 AI 编程智能体持久记忆。

（来源：README/artifactAudit）

## 干什么

#1 Persistent memory for AI coding agents based on real-world benchmarks

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | TypeScript |
| total_stars | 21844 |
| stars_in_period | 19547 |
| author | rohitg00 |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

人话：值得看的是它不是只写一个 MEMORY.md 文件，而是把“自动采集、搜索、工具面、API、viewer、评测”都放在一个仓库里。术语：仓库里有 `plugin/hooks/hooks.json` 的 12 个 Claude Code 生命周期 hook、`src/triggers/api.ts` 的 128 个 HTTP trigger、`src/mcp/tools-registry.ts` 的 53 个 MCP tool、`eval/` 和 `benchmark/` 的评测脚本与报告。（来源：plugin/hooks/hooks.json；src/triggers/api.ts registerTrigger；src/mcp/tools-registry.ts getAllTools；eval/README.md）

## 核心能力

- Hook-to-observation 管道（来源：数据不足）
- Progressive MCP tool surface（来源：数据不足）
- Hybrid retrieval with graceful fallback（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

{"body_md":"人话：agentmemory 更像“本地的编程代理记忆层”，不是完整 agent runtime，也不是普通 RAG 文档库。术语：直接可比项可以按接入路径、检索机制、自托管、成熟度和工作流 fit 判断。\n\n1. 对比 built-in memory，例如 `CLAUDE.md`、`.cursorrules`、Cline memory-bank：agentmemory 的差异是自动 hook 采集、REST/MCP 查询和全库检索；built-in file 的优势是零服务、可读、少依赖。做小项目、只存几十条偏好时选 built-in；会话历史超过 200 条观察、需要跨 agent 或跨 session 查询时选 agentmemory。README/benchmark 对 built-in 的 200-line cap、token unreachable 等数字属于项目方自称，未本次独立复现。（来源：README Why agentmemory；benchmark/SCALE.md）\n\n2. 对比 mem0：agentmemory 仓库自己的 comparison 说 mem0 是 memory layer API，主要靠手动 `add()` 或 API 集成，外部依赖可到 Qdrant/pgvector；agentmemory 是 memory engine + MCP server，强调 hooks 自动采集和本地 iii KV。构建已有产品内存 API 时 mem0 的 SDK/云路径更直接；给 Claude Code/Codex/Cursor 这类编程代理加共享本地记忆时 agentmemory fit 更强。mem0 的分数和功能描述在本仓库 comparison 里标为 vendor/project published，未独立核验。（来源：benchmark/COMPARISON.md Feature Matrix/What Each Tool Is Best At）\n\n3. 对比 Letta/MemGPT：仓库 comparison 把 Letta/MemGPT 定位为 full agent runtime，agentmemory 则不替代代理运行时，只提供记忆 server、MCP、REST、hooks。需要长运行 conversational agent 和 runtime 管理时选 Letta；已有多个 coding agent，只缺跨会话记忆时选 agentmemory。Letta 的 LoCoMo 数字在本仓库中明确不是同一 benchmark，属于未复现 vendor claim。（来源：benchmark/COMPARISON.md Retrieval Accuracy/Feature Matrix）\n\n4. 对比 codegraph / Understand Anything / Graphify：这些不是直接替代，而是上下文层互补。codegraph 管代码结构 MCP，agentmemory 管会话历史；Graphify 管代码、docs、PDF、图像、视频的知识图；Understand Anything 偏 dashboard 和 on-demand 项目理解。问“谁调用这个函数”选 codegraph；问“上周为什么改认证中间件”选 agentmemory。（来源：docs/recipes/pairings.md）"}

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话：最小真实流程可以从 `examples/python/quickstart.py` 看清楚：先连 `ws://localhost:49134`，触发 `mem::remember` 保存 `project: demo`、`title: auth-stack`、`content: Service uses HMAC bearer tokens; refresh every 24h.`、`concepts: [auth,hmac,refresh]`，再触发 `mem::smart-search` 查询 `how do tokens refresh`、`limit: 5`。术语：`mem::remember` 在 `src/functions/remember.ts` 中校验 content/files/concepts，把 memory 写入 `KV.memories`，类型限制在 `pattern/preference/architecture/bug/workflow/fact`，相似度 `jaccardSimilarity > 0.7` 时会把旧 memory 标成非 latest 并设置 version/parent/supersedes，然后调用 `getSearchIndex().add(memoryToObservation(memory))` 和 `vectorIndexAddGuarded(...)`。检索时 `src/functions/smart-search.ts` 的 `mem::smart-search` 会调用注入的 searchFn；`src/state/hybrid-search.ts` 先 BM25，再可选 vector，再按 query entity 做 graph retrieval，最后用 RRF 加权、按 session 做最多 3 条的多样化，返回 compact 的 `obsId/sessionId/title/type/score/timestamp`。如果代理不是手动保存，而是 hook 自动采集，`plugin/hooks/hooks.json` 会把 `PostToolUse` 指向 `node ${CLAUDE_PLUGIN_ROOT}/scripts/post-tool-use.mjs`；HTTP 侧 `/agentmemory/observe` 要求 `hookType/sessionId/project/cwd/timestamp`，再触发 `mem::observe`。默认 LLM 自动压缩关闭时，`mem::observe` 用 `buildSyntheticCompression(raw)` 生成可索引内容；打开 `AGENTMEMORY_AUTO_COMPRESS=true` 才会触发 `mem::compress`。（来源：examples/python/quickstart.py；src/functions/remember.ts；src/functions/smart-search.ts；src/state/hybrid-search.ts；plugin/hooks/hooks.json；src/triggers/api.ts api::observe；src/functions/observe.ts）

## 本质不同的设计取舍

人话：可复用的不是“记忆”这个词，而是几个明确工程接口。术语：这些抽象都能从源码或配置中定位。 - Hook-to-observation 管道 — copy: 把 agent 生命周期事件统一转成 `HookPayload`，字段至少有 `sessionId`、`hookType`、`timestamp`、`project`、`cwd`，再脱敏、去重、写 KV、写 stream。可复用到任意需要审计 agent 行为的系统。（来源：src/functions/observe.ts；src/triggers/api.ts api::observe）；skip: 如果你的 agent 不能稳定输出 lifecycle hooks，或者只需要显式 `save()` API，不必复制 hook 层。；why: 自动采集比手动 add 更接近真实工作流，但也带来隐私、成本和噪声治理问题。 - Progressive MCP tool surface — copy: `AGENTMEMORY_TOOLS=core` 暴露精简 essential tools，默认 all 暴露完整 53 工具；`ESSENTIAL_TOOLS` 明确列出 `memory_save`、`memory_recall`、`memory_consolidate`、`memory_smart_search`、`memory_sessions`、`memory_diagnose`、`memory_lesson_save`、`memory_reflect`。（来源：src/mcp/tools-registry.ts）；skip: 如果宿主模型工具选择能力弱，53 个工具会增加选择负担，直接保留 core 更稳。；why: AI 应用常见问题不是没有工具，而是工具太多导致错用；分层暴露是实用设计。 - Hybrid retrieval with graceful fallback — copy: BM25 始终可用；vector provider 不存在或 embed 失败时跳过；graph retrieval 是 best-effort；合成分数用 RRF，权重会按实际有结果的 stream 重新归一。（来源：src/state/hybrid-search.ts）；skip: 如果数据量小于几十条，普通 grep/SQLite LIKE 足够，hybrid 会增加运行和调参复杂度。；why: 记忆系统不能因为 embedding API 失败就无法回忆，降级路径比单一向量库更抗故障。 - Agent scope isolation — copy: 写入时 `AGENT_ID` 会标到 `Session/RawObservation/CompressedObservation/Memory`，`AGENTMEMORY_AGENT_SCOPE=isolated` 时 search/smart-search 无 agentId 会 fail-closed，`agentId: *` 才显式通配。（来源：src/config.ts loadAgentScope；src/functions/search.ts；src/functions/smart-search.ts）；skip: 单人单代理本地使用时不需要隔离，shared 默认更方便。；why: 多代理共享记忆时，审计和隔离比单纯共享更重要。 - Benchmark harness adapters — copy: `eval/runner/adapters/` 有 grep、vector、agentmemory 三类 adapter；coding-life 跑 15 fictional sessions/15 queries，LongMemEval 跑 public 500 questions；报告输出 `scores.ndjson` 和 `summary.json`。（来源：eval/README.md）；skip: 如果没有固定 gold session 或评价集，先不要写漂亮 benchmark，先收集真实查询失败样本。；why: 记忆系统很容易只靠 demo 讲故事；adapter 化评测能把检索层单独拿出来测。

## 对从业者意味着什么

人话：值得继续，但下一步未确认是 clone-and-run，而不是直接相信 README 数字。它的源码面很完整：CLI、REST、MCP、hooks、viewer、eval、benchmark、docker 都在；关键路径也能从 `observe -> remember/search -> smart-search/context` 读通。术语：成熟度扣分来自文档漂移和未复现 claims：embedding 默认、MCP tool count、benchmark scripts 与 package.json 不一致。工程上可抽取的模式是 hook 自动采集、MCP 工具分层、hybrid retrieval graceful fallback、agent scope isolation；作为生产依赖前，应在干净 HOME/端口 sandbox 中跑 `agentmemory demo --serve`、`npm test`、`npm run eval:coding-life -- --adapters grep,agentmemory`。（来源：src/index.ts；src/functions/observe.ts；src/state/hybrid-search.ts；src/mcp/tools-registry.ts；eval/README.md；package.json scripts）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/persistent-agent-memory]]、[[concepts/hook-based-observation-capture]]。另见 [[content/rohitg00-agentmemory]]、[[claims/rohitg00-agentmemory-main-claim]]。
