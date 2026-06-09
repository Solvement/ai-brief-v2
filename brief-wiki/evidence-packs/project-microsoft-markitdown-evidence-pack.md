---
content: "microsoft-markitdown"
kind: "evidence-pack"
title: "markitdown — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "MarkItDown 是把 PDF、Office、网页、图片、音频等输入转成 Markdown 的 Python CLI/SDK，定位是给 LLM/RAG 做文档入口清洗。"
    internal_logic: "真实例子：`markitdown test.xlsx -o out.md` 会从 CLI 进入 `MarkItDown.convert()`，再走本地文件流、文件类型猜测、converter 选择，最后由 XLSX converter 把每个 sheet 变成 Markdown 表。（来源：README Command-Line；packages/markitdown/src/markitdown/__main__.py；packages/markitdown/src/markitdown/converters/_xlsx_converter.py）\n\n```mermaid\nflowchart TD\n  A[文件或URI] --> B[CLI或Python API]\n  B --> C[MarkItDown convert]\n  C --> D{输入类型}\n  D --> E[本地文件]\n  D --> F[HTTP响应]\n  D --> G[二进制流]\n  D --> H[data URI]\n  E --> I[StreamInfo 猜测]\n  F --> I\n  G --> I\n  H --> I\n  I --> J[扩展名 MIME Magika]\n  J --> K[按优先级排序 converters]\n  K --> L[accepts 检查]\n  L --> M[convert 转 Markdown]\n  M --> N[清理空行和行尾]\n  N --> O[stdout 文件或SDK结果]\n```\n\n关键点：`ZipConverter` 会把 ZIP 内文件递归交回同一个 MarkItDown 实例；`ContentUnderstandingConverter` 在传入 `cu_endpoint` 时才注册到 converter 栈；插件 converter 只有 `enable_plugins=True` 或 `--use-plugins` 才加载。（来源：packages/markitdown/src/markitdown/converters/_zip_converter.py；packages/markitdown/src/markitdown/_markitdown.py enable_builtins/enable_plugins）"
    failure_mode: "packages/markitdown/src/markitdown/_markitdown.py _get_stream_info_guesses；packages/markitdown/src/markitdown/__main__.py CLI hints"
    source_pointer: "https://github.com/microsoft/markitdown"
pipeline_steps:
  - "project_type 分诊:devtool_cli"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/false/MIT/v0.1.6"
experiments: []
claims:
  - "[[claims/microsoft-markitdown-main-claim-2]]"
artifacts:
  - "[[artifacts/project-microsoft-markitdown-repo]]"
metrics:
  - "stars=148388"
  - "forks=10183"
  - "open_issues=824"
  - "latest_release=v0.1.6"
  - "pushed_at=2026-05-26T22:41:34Z"
baselines: []
failure_modes:
  - "packages/markitdown/src/markitdown/_markitdown.py _get_stream_info_guesses；packages/markitdown/src/markitdown/__main__.py CLI hints"
  - "packages/markitdown/src/markitdown/converters/_pdf_converter.py"
  - "README Azure Content Understanding Cost note；packages/markitdown/src/markitdown/converters/_cu_converter.py"
  - "packages/markitdown/src/markitdown/converters/_image_converter.py；packages/markitdown-ocr/README.md Usage"
  - "packages/markitdown-mcp/src/markitdown_mcp/__main__.py；packages/markitdown-mcp/README.md Security Considerations"
  - "Dockerfile"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/microsoft/markitdown"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/microsoft-markitdown-main-claim-2]],官方 artifact 落库为 [[artifacts/project-microsoft-markitdown-repo]]。See [[content/microsoft-markitdown]]。
