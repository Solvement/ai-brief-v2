---
name: "基于插件的转换器架构"
slug: "plugin-based-converter-architecture"
kind: "concept"
tags:
  - "plugin-system"
  - "extensibility"
maturity: "active"
first_seen_in: "markitdown"
related_content:
  - "markitdown"
related_concepts: []
explanation: "核心引擎提供注册机制，外部通过入口点贡献格式处理器或后处理步骤，不修改核心代码即可扩展能力。"
examples:
  - "MarkItDown 的 markitdown-ocr 插件通过 entry point 注册 OCR 转换器，复用 llm_client"
common_misunderstandings:
  - "插件不一定运行在沙箱，可能继承宿主权限"
open_questions:
  - "如何保证插件的质量和安全审查？"
---

## Explanation

核心引擎提供注册机制，外部通过入口点贡献格式处理器或后处理步骤，不修改核心代码即可扩展能力。 出处:https://github.com/microsoft/markitdown。See [[content/markitdown]]。

## Supported by
- [[claims/markitdown-main-claim]]
