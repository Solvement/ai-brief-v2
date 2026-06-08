---
name: "文档转换器链"
slug: "document-converter-chain"
kind: "concept"
tags:
  - "architecture"
  - "converter"
  - "python"
maturity: "stable"
first_seen_in: "microsoft-markitdown"
related_content:
  - "microsoft-markitdown"
related_concepts: []
explanation: "人话：每种文件格式一个小转换器，调度器按顺序试。术语：`DocumentConverter.accepts()` 做格式接受判断，`convert()` 返回 `DocumentConverterResult(markdown=...)`。"
examples:
  - "`PdfConverter` 接受 `.pdf` 和 `application/pdf`。"
  - "`ZipConverter` 解压后对内部文件递归调用 `self._markitdown.convert_stream()`。"
common_misunderstandings:
  - "不是所有 converter 都一定会运行；只有 `accepts()` 返回 True 的 converter 才会尝试转换。"
open_questions:
  - "未在 README 说明第三方 converter 冲突时的用户级诊断体验。"
---

## Explanation

人话：每种文件格式一个小转换器，调度器按顺序试。术语：`DocumentConverter.accepts()` 做格式接受判断，`convert()` 返回 `DocumentConverterResult(markdown=...)`。 出处:https://github.com/microsoft/markitdown。See [[content/microsoft-markitdown]]。

## Supported by
- [[claims/microsoft-markitdown-main-claim]]
