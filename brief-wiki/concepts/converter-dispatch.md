---
name: "converter 分发"
slug: "converter-dispatch"
kind: "concept"
tags:
  - "architecture"
  - "plugin-system"
  - "file-conversion"
maturity: "stable"
first_seen_in: "microsoft-markitdown"
related_content:
  - "microsoft-markitdown"
related_concepts: []
explanation: "先人话：一堆格式处理器排队，谁能处理谁上。术语点：每个 DocumentConverter 实现 `accepts()` 和 `convert()`，MarkItDown 按 priority 排序调用。"
examples:
  - "内置注册 PdfConverter、DocxConverter、XlsxConverter、PptxConverter 等"
  - "OCR 插件用 priority `-1.0` 抢在内置 converter 前"
common_misunderstandings:
  - "不是所有 converter 并行跑后选最佳结果"
  - "注册顺序和 priority 会影响命中路径"
open_questions:
  - "插件之间冲突时的治理策略未在 README 说明"
---

## Explanation

先人话：一堆格式处理器排队，谁能处理谁上。术语点：每个 DocumentConverter 实现 `accepts()` 和 `convert()`，MarkItDown 按 priority 排序调用。 出处:https://github.com/microsoft/markitdown。See [[content/microsoft-markitdown]]。

## Supported by
- [[claims/microsoft-markitdown-main-claim-2]]
