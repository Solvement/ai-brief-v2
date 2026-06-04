---
text: "hashline 编辑使 Grok 4 Fast 输出 token 减少 61%"
slug: "oh-my-pi-main-claim"
kind: "claim"
content: "oh-my-pi"
source_pointer: "README 中 '# Every tool, benchmaxxed.' 下的表格和 'Hashline: edit by content hash' 章节"
evidence_strength: "medium"
supports:
  - "hashline-editing"
  - "time-traveling-stream-rules"
contradicts: []
open_challenges:
  - "未提供对比基准细节（如原始输出 token 量、文件大小），也未说明其他模型上的效果。"
  - "可能只对特定长度的文件或编码风格有效，对其他模型可能不适用。"
status: "supported"
---

## Claim

通过让模型只写内容哈希而不是完整代码行，节省发送给 API 的输出 token 量。

证据:表格列出 Grok 4 Fast: −61% tokens，用户报告一致。。边界:未提供对比基准细节（如原始输出 token 量、文件大小），也未说明其他模型上的效果。。风险:可能只对特定长度的文件或编码风格有效，对其他模型可能不适用。。See [[content/oh-my-pi]]。
