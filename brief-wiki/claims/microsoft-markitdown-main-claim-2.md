---
text: "面向 LLM/text analysis 的 Markdown 转换工具"
slug: "microsoft-markitdown-main-claim-2"
kind: "claim"
content: "microsoft-markitdown"
source_pointer: "README opening + Why Markdown"
evidence_strength: "medium"
supports:
  - "markdown-for-llm-ingestion"
  - "converter-dispatch"
contradicts: []
open_challenges:
  - "README 没给 token 节省比例、准确率或召回率基准。"
  - "若业务需要版式级还原或可视化排版，README 自己也说它不是最佳选择。"
status: "supported"
---

## Claim

它把多种文件转成 Markdown，不追求人类阅读的高保真排版。

证据:README 明确说输出用于 LLM 和文本分析流水线，并强调 Markdown 接近纯文本、保留文档结构。。边界:README 没给 token 节省比例、准确率或召回率基准。。风险:若业务需要版式级还原或可视化排版，README 自己也说它不是最佳选择。。See [[content/microsoft-markitdown]]。
