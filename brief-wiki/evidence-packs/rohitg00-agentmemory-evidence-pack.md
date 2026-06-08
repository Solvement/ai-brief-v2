---
content: "rohitg00-agentmemory"
kind: "evidence-pack"
title: "agentmemory — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "agentmemory 是给 AI 编程代理用的本地持久记忆服务器，核心路径是 hooks/REST/MCP 写入观察，再用 BM25、向量和图检索把相关历史找回来。"
    internal_logic: "人话：最小真实流程可以从 `examples/python/quickstart.py` 看清楚：先连 `ws://localhost:49134`，触发 `mem::remember` 保存 `project: demo`、`title: auth-stack`、`content: Service uses HMAC bearer tokens; refresh every 24h.`、`concepts: [auth,hmac,refresh]`，再触发 `mem::smart-search` 查询 `how do tokens refresh`、`limit: 5`。术语：`mem::remember` 在 `src/functions/remember.ts` 中校验 content/files/concepts，把 memory 写入 `KV.memories`，类型限制在 `pattern/preference/architecture/bug/workflow/fact`，相似度 `jaccardSimilarity > 0.7` 时会把旧 memory 标成非 latest 并设置 version/parent/supersedes，然后调用 `getSearchIndex().add(memoryToObservation(memory))` 和 `vectorIndexAddGuarded(...)`。检索时 `src/functions/smart-search.ts` 的 `mem::smart-search` 会调用注入的 searchFn；`src/state/hybrid-search.ts` 先 BM25，再可选 vector，再按 query entity 做 graph retrieval，最后用 RRF 加权、按 session 做最多 3 条的多样化，返回 compact 的 `obsId/sessionId/title/type/score/timestamp`。如果代理不是手动保存，而是 hook 自动采集，`plugin/hooks/hooks.json` 会把 `PostToolUse` 指向 `node ${CLAUDE_PLUGIN_ROOT}/scripts/post-tool-use.mjs`；HTTP 侧 `/agentmemory/observe` 要求 `hookType/sessionId/project/cwd/timestamp`，再触发 `mem::observe`。默认 LLM 自动压缩关闭时，`mem::observe` 用 `buildSyntheticCompression(raw)` 生成可索引内容；打开 `AGENTMEMORY_AUTO_COMPRESS=true` 才会触发 `mem::compress`。（来源：examples/python/quickstart.py；src/functions/remember.ts；src/functions/smart-search.ts；src/state/hybrid-search.ts；plugin/hooks/hooks.json；src/triggers/api.ts api::observe；src/functions/observe.ts）"
    failure_mode: "docker-compose.yml iii-engine comment；iii-config.yaml workers；package.json dependency iii-sdk 0.11.2"
    source_pointer: "https://github.com/rohitg00/agentmemory"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:true/true/true/true/Apache-2.0/v0.9.27"
experiments: []
claims:
  - "[[claims/rohitg00-agentmemory-main-claim]]"
artifacts:
  - "[[artifacts/rohitg00-agentmemory-repo]]"
metrics:
  - "stars=21844"
  - "forks=1797"
  - "open_issues=249"
  - "latest_release=v0.9.27"
  - "pushed_at=2026-06-08T11:01:56Z"
baselines: []
failure_modes:
  - "docker-compose.yml iii-engine comment；iii-config.yaml workers；package.json dependency iii-sdk 0.11.2"
  - "package.json bin/engines/files；packages/mcp/package.json；packages/mcp/README.md"
  - "plugin/hooks/hooks.json；plugin/hooks/hooks.codex.json；INSTALL_FOR_AGENTS.md connect supported agent names"
  - "README Embedding providers/Local models；.env.example Embedding provider；src/config.ts detectEmbeddingProvider；src/providers/embedding/index.ts；src/providers/embedding/local.ts"
  - "src/config.ts detectProvider/isAutoCompressEnabled/isConsolidationEnabled；README Configuration"
  - "src/triggers/api.ts checkAuth；.env.example Auth & security；README API"
missing_details: []
source_pointers:
  - "https://github.com/rohitg00/agentmemory"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/rohitg00-agentmemory-main-claim]],官方 artifact 落库为 [[artifacts/rohitg00-agentmemory-repo]]。See [[content/rohitg00-agentmemory]]。
