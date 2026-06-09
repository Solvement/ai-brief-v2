<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - microsoft/markitdown

## Core Pattern
StreamInfo: 把 mimetype、extension、charset、filename、local_path、url 合成一个对象，并允许 `copy_and_update()` 逐步补全。 converter priority: converter 注册时带 `priority`，转换前排序；OCR 插件用 `-1.0` 抢在内置 converter 前面。 narrow convert methods: 公开 `convert_local()`、`convert_stream()`、`convert_response()`、`convert_uri()`，让调用方按信任边界选入口。 entry point plugin: 用 `[project.entry-points."markitdown.plugin"]` 发现插件，插件实现 `register_converters(markitdown, **kwargs)`。 local MCP wrapper: 把复杂 SDK 包成一个本地 MCP tool：`convert_to_markdown(uri)`。

## Mapping
- problem_class: developer-facing-ai-automation-with-observable-feedback
- components: developer_control_surface, model_or_retrieval_layer, streaminfo, converter-priority, narrow-convert-methods, entry-point-plugin, local-mcp-wrapper
- autosci_modules: pattern_library, experiment_runner, developer_tooling, feedback_loop

## Small Experiment
Compare baseline free-form execution against the extracted devtool pattern from microsoft/markitdown on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- devtool-boundary-as-module: StreamInfo: 把 mimetype、extension、charset、filename、local_path、url 合成一个对象，并允许 `copy_and_update()` 逐步补全。 converter priority: converter 注册时带 `priority`，转换前排序；OCR 插件用 `-1.0` 抢在内置 converter 前面。 narrow convert methods: 公开 `convert_local()`、`convert_stream()`、`convert_response()`、`convert_uri()`，让调用方按信任边界选入口。 entry point plugin: 用 `[project.entry-points."markitdown.plugin"]` 发现插件，插件实现 `register_converters(markitdown, **kwargs)`。 local MCP wrapper: 把复杂 SDK 包成一个本地 MCP tool：`convert_to_markdown(uri)`。
- devtool-observable-flow: 真实例子：`markitdown test.xlsx -o out.md` 会从 CLI 进入 `MarkItDown.convert()`，再走本地文件流、文件类型猜测、converter 选择，最后由 XLSX converter 把每个 sheet 变成 Markdown 表。（来源：README Command-Line；packages/markitdown/src/markitdown/__main__.py；packages/markitdown/src/markitdown/converters/_xlsx_converter.py） ```mermaid flowchart TD A[文件或URI] --> B[CLI或Python API] B --> C[MarkItDown convert] C --> D{输入类型} D --> E[本地文件] D --> F[HTTP响应] D --> G[二进制流] D --> H[data URI] E --> I[StreamInfo 猜测] F --> I G --> I H --> I I --> J[扩展名 MIME Magika] J --> K[按优先级排序 converters] K --> L[accepts 检查] L --> M[convert 转 Markdown] M --> N[清理空行和行尾] N --> O[stdout 文件或SDK结果] ``` 关键点：`ZipConverter` 会把 ZIP 内文件递归交回同一个 MarkItDown 实例；`ContentUnderstandingConverter` 在传入 `cu_endpoint` 时才注册到 converter 栈；插件 converter 只有 `enable_plugins=True` 或 `--use-plugins` 才加载。（来源：packages/markitdown/src/markitdown/converters/_zip_converter.py；packages/markitdown/src/markitdown/_markitdown.py enable_builtins/enable_plugins）
- devtool-risk-first-transfer: Transfer the architecture together with its main failure boundary: Magika + charset-normalizer: 文件类型或字符集猜错，会让错误 converter 接手，或让支持格式被判成 unsupported。.

## Risks
- Magika + charset-normalizer: 文件类型或字符集猜错，会让错误 converter 接手，或让支持格式被判成 unsupported。
- pdfminer.six + pdfplumber: PDF 表格、扫描件、复杂版式输出会受第三方解析器影响。
- Azure Content Understanding / Document Intelligence: API 费用、凭证、区域、SDK 版本或 analyzer 变化会影响转换结果和成本。
- OpenAI-compatible llm_client: 图片 caption/OCR 依赖模型输出，成本和数据外发由调用方承担。
- MCP server local process privileges: HTTP/SSE 绑定被暴露后，访问者可借工具读当前用户可读文件或访问网络。
- exiftool / ffmpeg: 媒体元数据和音频处理受系统二进制可用性影响。
- over_transfer
