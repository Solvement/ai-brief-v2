---
text: "MarkItDown 是轻量 Python 工具，把各种文件转 Markdown，供 LLM 和文本分析管线使用。"
slug: "microsoft-markitdown-main-claim"
kind: "claim"
content: "microsoft-markitdown"
source_pointer: "README opening description"
evidence_strength: "medium"
supports:
  - "markdown-for-llm"
  - "document-converter-chain"
contradicts: []
open_challenges:
  - "README 同段明确说 may not be the best option for high-fidelity document conversions for human consumption。"
  - "没有 README 内 benchmark 或人工评测表证明转换质量。"
status: "supported"
---

## Claim

定位是先把 PDF/Office/网页/媒体等输入变成 Markdown，而不是做高保真排版还原。

证据:README 明确说用于 LLMs and related text analysis pipelines，并说明输出 often reasonably presentable 但 meant to be consumed by text analysis tools。。边界:README 同段明确说 may not be the best option for high-fidelity document conversions for human consumption。。风险:没有 README 内 benchmark 或人工评测表证明转换质量。。See [[content/microsoft-markitdown]]。
