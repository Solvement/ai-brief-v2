---
name: "面向 LLM 的 Markdown 入口"
slug: "markdown-for-llm-ingestion"
kind: "concept"
tags:
  - "rag"
  - "document-ingestion"
  - "markdown"
maturity: "active"
first_seen_in: "microsoft-markitdown"
related_content:
  - "microsoft-markitdown"
related_concepts: []
explanation: "先人话：把复杂文件压成模型更容易读的文本。术语点：Markdown 保留标题、列表、表格、链接等轻结构，适合后续 RAG chunking。"
examples:
  - "README 里用 `markitdown path-to-file.pdf > document.md`"
  - "XlsxConverter 每个 sheet 输出 `## sheet名` 后接 Markdown 表"
common_misunderstandings:
  - "不是高保真排版转换器"
  - "不是向量库或 chunking 系统"
open_questions:
  - "不同文件格式转 Markdown 后的检索质量没有仓库基准"
---

## Explanation

先人话：把复杂文件压成模型更容易读的文本。术语点：Markdown 保留标题、列表、表格、链接等轻结构，适合后续 RAG chunking。 出处:https://github.com/microsoft/markitdown。See [[content/microsoft-markitdown]]。

## Supported by
- [[claims/microsoft-markitdown-main-claim-2]]
