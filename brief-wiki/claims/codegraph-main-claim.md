---
text: "使用 CodeGraph 后，AI 助手平均节省 16% 费用、47% tokens、22% 时间、58% 工具调用。"
slug: "codegraph-main-claim"
kind: "claim"
content: "codegraph"
source_pointer: "README.md 中的 Benchmarks 表格和详细 breakdown"
evidence_strength: "high"
supports:
  - "pre-indexed-knowledge-graph"
  - "mcp-tool-integration"
contradicts: []
open_challenges:
  - "仅测试了一种模型（Claude Opus 4.8）和一种查询类型（架构问题），可能不推广到所有场景。"
  - "新模型可能自带高效探索能力，缩小收益；或用户实际使用复杂查询时收益降低。"
status: "supported"
---

## Claim

在 7 个开源项目上测试，有 CodeGraph 比没有它整体更省。

证据:给出了每项目具体数值、方法论、查询语句、模型版本，且数据一致。。边界:仅测试了一种模型（Claude Opus 4.8）和一种查询类型（架构问题），可能不推广到所有场景。。风险:新模型可能自带高效探索能力，缩小收益；或用户实际使用复杂查询时收益降低。。See [[content/codegraph]]。
