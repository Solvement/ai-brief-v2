---
content: "microsoft-markitdown"
kind: "evidence-pack"
title: "markitdown — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "MarkItDown 是微软维护的 Python CLI/库，把 PDF、Office、HTML、音频、图片、ZIP 等输入转成更适合 LLM 与文本分析管线消费的 Markdown。"
    internal_logic: "人话：以真实 README 示例 `markitdown path-to-file.pdf -o document.md` 为流：CLI 在 `packages/markitdown/src/markitdown/__main__.py` 解析 `filename` 和 `-o`，构造 `MarkItDown(enable_plugins=args.use_plugins)`；`MarkItDown.__init__()` 默认启用 builtins，注册 `PdfConverter()`、`DocxConverter()`、`XlsxConverter()`、`HtmlConverter()`、`ZipConverter(markitdown=self)` 等；`convert()` 看到 source 是普通字符串路径，就调用 `convert_local()`；`convert_local()` 建一个 `StreamInfo(local_path=path, extension=os.path.splitext(path)[1], filename=os.path.basename(path))`，打开文件后调用 `_get_stream_info_guesses()`；该函数先用扩展名推 MIME，再调用 `magika.Magika().identify_stream()`，文本还会用 `charset_normalizer` 读前 4096 bytes 猜 charset；`_convert()` 把 converter 按 priority 排序，逐个执行 `accepts()`，PDF 文件命中 `PdfConverter.accepts()` 的 `.pdf` 或 `application/pdf`；`PdfConverter.convert()` 用 `pdfplumber` 按页尝试表单/表格式内容抽取，若没有 form 页面或出错就用 `pdfminer.high_level.extract_text()`，最后合并 MasterFormat 风格的 `.1`、`.2` 行并返回 `DocumentConverterResult(markdown=markdown)`；CLI 的 `_handle_output()` 把 `result.markdown` 写到 `-o` 指定文件。术语：这是 source dispatcher → stream metadata inference → priority converter chain → format converter → result normalization 的管线。仓库测试把同一逻辑用于 `packages/markitdown/tests/test_files/test.pdf`，断言输出包含 `While there is contemporaneous exploration of multi-agent approaches`。（来源：README Command-Line；来源：packages/markitdown/src/markitdown/__main__.py；来源：packages/markitdown/src/markitdown/_markitdown.py；来源：packages/markitdown/src/markitdown/converters/_pdf_converter.py；来源：packages/markitdown/tests/_test_vectors.py）"
    failure_mode: "packages/markitdown/src/markitdown/_markitdown.py _get_stream_info_guesses；packages/markitdown/src/markitdown/__main__.py args"
    source_pointer: "https://github.com/microsoft/markitdown"
pipeline_steps:
  - "project_type 分诊:devtool_cli"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/false/MIT/v0.1.6"
experiments: []
claims:
  - "[[claims/microsoft-markitdown-main-claim]]"
artifacts:
  - "[[artifacts/microsoft-markitdown-repo]]"
metrics:
  - "stars=148001"
  - "forks=10152"
  - "open_issues=818"
  - "latest_release=v0.1.6"
  - "pushed_at=2026-05-26T22:41:34Z"
baselines: []
failure_modes:
  - "packages/markitdown/src/markitdown/_markitdown.py _get_stream_info_guesses；packages/markitdown/src/markitdown/__main__.py args"
  - "packages/markitdown/pyproject.toml optional-dependencies；packages/markitdown/tests tree"
  - "packages/markitdown/pyproject.toml optional-dependencies；packages/markitdown/src/markitdown/converters/_docx_converter.py；packages/markitdown/src/markitdown/converters/_xlsx_converter.py"
  - "README Azure Content Understanding；packages/markitdown/src/markitdown/converters/_cu_converter.py；packages/markitdown/src/markitdown/converters/_doc_intel_converter.py"
  - "packages/markitdown/src/markitdown/converters/_image_converter.py；packages/markitdown-ocr/src/markitdown_ocr/_plugin.py；packages/markitdown-ocr/README.md Usage"
  - "packages/markitdown-mcp/pyproject.toml dependencies；packages/markitdown-mcp/src/markitdown_mcp/__main__.py；packages/markitdown-mcp/README.md Security Considerations"
  - "Dockerfile；packages/markitdown/src/markitdown/converters/_image_converter.py；packages/markitdown/src/markitdown/converters/_audio_converter.py"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/microsoft/markitdown"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/microsoft-markitdown-main-claim]],官方 artifact 落库为 [[artifacts/microsoft-markitdown-repo]]。See [[content/microsoft-markitdown]]。
