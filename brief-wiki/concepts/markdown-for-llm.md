---
name: "面向 LLM 的 Markdown 中间层"
slug: "markdown-for-llm"
kind: "concept"
tags:
  - "markdown"
  - "llm"
  - "rag"
maturity: "active"
first_seen_in: "microsoft-markitdown"
related_content:
  - "microsoft-markitdown"
related_concepts: []
explanation: "人话：先把复杂文件变成 Markdown，再给检索、摘要、Agent 或评测用。术语：Markdown 保留标题、列表、表格、链接等轻量结构，比纯文本多结构，比 HTML/Office 少噪声。"
examples:
  - "README 说目标是 LLMs and related text analysis pipelines。"
  - "XLSX converter 为每个 sheet 输出 `## sheet-name` 和 Markdown 表格。"
common_misunderstandings:
  - "它不是高保真排版转换器；README 明确说 may not be the best option for high-fidelity document conversions for human consumption。"
open_questions:
  - "没有仓库内 benchmark 说明 Markdown 输出对不同 LLM/RAG 任务的质量提升幅度。"
---

## Explanation

人话：先把复杂文件变成 Markdown，再给检索、摘要、Agent 或评测用。术语：Markdown 保留标题、列表、表格、链接等轻量结构，比纯文本多结构，比 HTML/Office 少噪声。 出处:https://github.com/microsoft/markitdown。See [[content/microsoft-markitdown]]。

## Supported by
- [[claims/microsoft-markitdown-main-claim]]
