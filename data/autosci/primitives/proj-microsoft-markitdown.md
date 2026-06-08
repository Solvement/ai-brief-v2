<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - microsoft/markitdown

## Core Pattern
DocumentConverter 接口: 每个格式实现 `accepts(file_stream, stream_info, **kwargs)` 和 `convert(...) -> DocumentConverterResult`；`accepts()` 文档强调如果读取 stream 必须 seek 回原位置。 StreamInfo 数据对象: 用 `mimetype`、`extension`、`charset`、`filename`、`local_path`、`url` 承载上下文，并用 `copy_and_update()` 合并推断值。 优先级 converter 注册: 内置具体格式 priority 0.0，泛文本/HTML/ZIP priority 10.0；插件可以用更低数值抢先，例如 OCR 插件的 -1.0。 entry point 插件协议: 插件包声明 `[project.entry-points."markitdown.plugin"]`，导出 `__plugin_interface_version__ = 1` 和 `register_converters(markitdown, **kwargs)`。 MCP 薄封装: `convert_to_markdown(uri)` 直接调用 `MarkItDown(...).convert_uri(uri).markdown`，HTTP 模式默认 host 是 `127.0.0.1`、port 是 `3001`。

## Mapping
- problem_class: developer-facing-ai-automation-with-observable-feedback
- components: developer_control_surface, model_or_retrieval_layer, documentconverter, streaminfo, converter, entry-point, mcp
- autosci_modules: pattern_library, experiment_runner, developer_tooling, feedback_loop

## Small Experiment
Compare baseline free-form execution against the extracted devtool pattern from microsoft/markitdown on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- devtool-boundary-as-module: DocumentConverter 接口: 每个格式实现 `accepts(file_stream, stream_info, **kwargs)` 和 `convert(...) -> DocumentConverterResult`；`accepts()` 文档强调如果读取 stream 必须 seek 回原位置。 StreamInfo 数据对象: 用 `mimetype`、`extension`、`charset`、`filename`、`local_path`、`url` 承载上下文，并用 `copy_and_update()` 合并推断值。 优先级 converter 注册: 内置具体格式 priority 0.0，泛文本/HTML/ZIP priority 10.0；插件可以用更低数值抢先，例如 OCR 插件的 -1.0。 entry point 插件协议: 插件包声明 `[project.entry-points."markitdown.plugin"]`，导出 `__plugin_interface_version__ = 1` 和 `register_converters(markitdown, **kwargs)`。 MCP 薄封装: `convert_to_markdown(uri)` 直接调用 `MarkItDown(...).convert_uri(uri).markdown`，HTTP 模式默认 host 是 `127.0.0.1`、port 是 `3001`。
- devtool-observable-flow: 人话：以真实 README 示例 `markitdown path-to-file.pdf -o document.md` 为流：CLI 在 `packages/markitdown/src/markitdown/__main__.py` 解析 `filename` 和 `-o`，构造 `MarkItDown(enable_plugins=args.use_plugins)`；`MarkItDown.__init__()` 默认启用 builtins，注册 `PdfConverter()`、`DocxConverter()`、`XlsxConverter()`、`HtmlConverter()`、`ZipConverter(markitdown=self)` 等；`convert()` 看到 source 是普通字符串路径，就调用 `convert_local()`；`convert_local()` 建一个 `StreamInfo(local_path=path, extension=os.path.splitext(path)[1], filename=os.path.basename(path))`，打开文件后调用 `_get_stream_info_guesses()`；该函数先用扩展名推 MIME，再调用 `magika.Magika().identify_stream()`，文本还会用 `charset_normalizer` 读前 4096 bytes 猜 charset；`_convert()` 把 converter 按 priority 排序，逐个执行 `accepts()`，PDF 文件命中 `PdfConverter.accepts()` 的 `.pdf` 或 `application/pdf`；`PdfConverter.convert()` 用 `pdfplumber` 按页尝试表单/表格式内容抽取，若没有 form 页面或出错就用 `pdfminer.high_level.extract_text()`，最后合并 MasterFormat 风格的 `.1`、`.2` 行并返回 `DocumentConverterResult(markdown=markdown)`；CLI 的 `_handle_output()` 把 `result.markdown` 写到 `-o` 指定文件。术语：这是 source dispatcher → stream metadata inference → priority converter chain → format converter → result normalization 的管线。仓库测试把同一逻辑用于 `packages/markitdown/tests/test_files/test.pdf`，断言输出包含 `While there is contemporaneous exploration of multi-agent approaches`。（来源：README Command-Line；来源：packages/markitdown/src/markitdown/__main__.py；来源：packages/markitdown/src/markitdown/_markitdown.py；来源：packages/markitdown/src/markitdown/converters/_pdf_converter.py；来源：packages/markitdown/tests/_test_vectors.py）
- devtool-risk-first-transfer: Transfer the architecture together with its main failure boundary: magika、charset-normalizer、mimetypes 推断链: 文件类型识别结果变化会改变 `_convert()` 尝试的 converter 和 `StreamInfo`。.

## Risks
- magika、charset-normalizer、mimetypes 推断链: 文件类型识别结果变化会改变 `_convert()` 尝试的 converter 和 `StreamInfo`。
- PDF extras：pdfminer.six>=20251230、pdfplumber>=0.11.9: PDF 文本/表格抽取和 fallback 行为会随这两个库变化。
- Office extras：mammoth~=1.11.0、lxml、pandas、openpyxl、xlrd、python-pptx: DOCX→HTML→Markdown、XLSX/XLS sheet 转表格、PPTX 图片和图表处理会受依赖版本影响。
- Azure Document Intelligence / Azure Content Understanding: 云 SDK、endpoint、认证、analyzer 名称或计费策略变化会影响转换、成本和输出 YAML/front matter。
- OpenAI-compatible vision client: 图片描述和 OCR 插件依赖 `client.chat.completions.create` 的 message schema、模型视觉能力和 API quota。
- MCP server：mcp~=1.8.0、Starlette、uvicorn、本地文件权限: MCP transport 或 server 暴露方式变化会影响 agent 集成；绑定非 localhost 会暴露文件读取和网络访问能力。
- over_transfer
