---
text: "提供 Python 库、代理、agent wrap、MCP server 四种入口。"
slug: "chopratejas-headroom-main-claim-2"
kind: "claim"
content: "chopratejas-headroom"
source_pointer: "README What it does；README Get started；pyproject.toml project.scripts；headroom/cli/wrap.py command examples；headroom/cli/proxy.py command options"
evidence_strength: "high"
supports:
  - "ccr-compress-cache-retrieve"
  - "content-router"
contradicts: []
open_challenges:
  - "不证明每个 wrapper 在所有 agent 版本上都稳定可用。"
  - "CLI 包装依赖外部 agent CLI 的配置格式，Claude/Codex/Copilot 等上游变更会破坏集成。"
status: "supported"
---

## Claim

你可以改代码调用 `compress()`，也可以把客户端 base URL 指到 `headroom proxy --port 8787`，或用 `headroom wrap claude|codex|cursor|aider|copilot` 包现有 CLI。

证据:`headroom = "headroom.cli:main"` 存在；proxy、wrap、mcp、learn、perf 都有 Click 命令文件。。边界:不证明每个 wrapper 在所有 agent 版本上都稳定可用。。风险:CLI 包装依赖外部 agent CLI 的配置格式，Claude/Codex/Copilot 等上游变更会破坏集成。。See [[content/chopratejas-headroom]]。
