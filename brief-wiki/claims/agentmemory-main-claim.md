---
text: "在 LongMemEval-S 上取得 95.2% R@5 召回率"
slug: "agentmemory-main-claim"
kind: "claim"
content: "agentmemory"
source_pointer: "README 中的 LongMemEval-S 表格"
evidence_strength: "medium"
supports:
  - "external-memory-server"
  - "mcp-tool-server"
contradicts: []
open_challenges:
  - "只在特定数据集上验证，不代表所有真实编码场景"
  - "数据集可能已被系统针对优化，且未与其他系统完整对比（仅与 BM25 对比）"
status: "supported"
---

## Claim

在标准长期记忆测试集上，前5个结果中能找到95.2%的正确答案。

证据:系统具备优秀的检索准确度。边界:只在特定数据集上验证，不代表所有真实编码场景。风险:数据集可能已被系统针对优化，且未与其他系统完整对比（仅与 BM25 对比）。See [[content/agentmemory]]。
