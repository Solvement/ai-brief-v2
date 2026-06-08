---
text: "“60–95% fewer tokens · library · proxy · MCP · 6 algorithms · local-first · reversible”。"
slug: "chopratejas-headroom-main-claim"
kind: "claim"
content: "chopratejas-headroom"
source_pointer: "README top badge line / What it does"
evidence_strength: "medium"
supports:
  - "context-compression-layer"
  - "compress-cache-retrieve"
contradicts: []
open_challenges:
  - "仓库检查没有独立第三方复现实验；60–95% 是项目声明，不能当外部验证结论。"
  - "不同内容类型差异很大；docs/benchmarks.mdx 自称 grep results 和 Python source 在表中为 0.0% 压缩。"
status: "supported"
---

## Claim

项目说自己能在本地用库、代理和 MCP 三种方式减少 token，并保留可逆取回。

证据:README 明确列出 `compress(messages)`、`headroom proxy --port 8787`、`headroom wrap ...`、MCP 工具和 CCR；源码也有对应入口。。边界:仓库检查没有独立第三方复现实验；60–95% 是项目声明，不能当外部验证结论。。风险:不同内容类型差异很大；docs/benchmarks.mdx 自称 grep results 和 Python source 在表中为 0.0% 压缩。。See [[content/chopratejas-headroom]]。
