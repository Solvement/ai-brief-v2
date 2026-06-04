---
name: "文件转Markdown转换器"
slug: "file-to-markdown-converter"
kind: "concept"
tags:
  - "document-processing"
  - "markdown"
  - "llm-ingestion"
maturity: "stable"
first_seen_in: "markitdown"
related_content:
  - "markitdown"
related_concepts: []
explanation: "一种将异构文档格式统一为结构化 Markdown 的模式，通过分发器根据文件类型调用特定解析器，输出保留标题、表格、链接等结构。"
examples:
  - "MarkItDown 转换 PDF 保留标题层级，转换 Excel 保留表格 Markdown"
common_misunderstandings:
  - "不是所见即得的 PDF 渲染器，输出可能丢失复杂布局"
open_questions:
  - "如何平衡结构保真与存储/计算开销？"
---

## Explanation

一种将异构文档格式统一为结构化 Markdown 的模式，通过分发器根据文件类型调用特定解析器，输出保留标题、表格、链接等结构。 出处:https://github.com/microsoft/markitdown。See [[content/markitdown]]。

## Supported by
- [[claims/markitdown-main-claim]]
