---
content: "microsoft-markitdown"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "devtool_cli"
title: "markitdown — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "microsoft/markitdown：Python 工具，用于将文件和 Office 文档转换为 Markdown。"
  what_it_does: "Python tool for converting files and office documents to Markdown."
  metadata:
    language: "Python"
    total_stars: "148001"
    stars_in_period: "26145"
    author: "microsoft"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "skills"
    - "models"
    - "cli"
  pain_point: "人话：它值得看，是因为很多 RAG、检索、评测、Agent 工具调用场景的第一步不是推理，而是把文件稳定读出来。MarkItDown 把 CLI、Python API、可选依赖、插件、MCP 包和 Azure 路由放在一个仓库里。术语：它把输入解析分成 source routing、stream metadata guessing、converter priority、format-specific converter、optional cloud converter 几层。（来源：README Installation；来源：README Optional Dependencies；来源：packages/markitdown/pyproject.toml；来源：packages/markitdown-mcp/README.md）"
  core_capabilities:
    - "DocumentConverter 接口"
    - "StreamInfo 数据对象"
    - "优先级 converter 注册"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "{\"body_md\":\"人话：README 自己把 MarkItDown 和 `textract` 放在同一类，但强调它更关注把标题、列表、表格、链接等结构保留为 Markdown；它也明确说不适合高保真人类文档转换。横向看：选 MarkItDown，当目标是 Python/RAG/LLM 管线、希望 CLI 与 Python API 一起用、输出 Markdown 足够；选 textract，当只需要传统纯文本抽取且已有 textract 工作流，textract 能力未在本次仓库核验；选 Pandoc，当目标是人类可读文档格式互转、排版语义和文档出版链路更重要，Pandoc 能力未在本次仓库核验；选 Apache Tika，当组织已有 JVM/服务化内容抽取平台、需要把抽取作为中心服务暴露，Tika 能力未在本次仓库核验。术语：差异维度是输出目标 Markdown vs plain text vs publishing conversion、集成路径 Python library/CLI/MCP vs 现有工具链、运行边界本地进程 vs 服务化抽取。未在本次克隆中找到官方 benchmark 对 textract、Pandoc、Tika 做质量或速度对比。（来源：README opening description；来源：README Security Considerations；来源：packages/markitdown-mcp/README.md）\"}"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话：以真实 README 示例 `markitdown path-to-file.pdf -o document.md` 为流：CLI 在 `packages/markitdown/src/markitdown/__main__.py` 解析 `filename` 和 `-o`，构造 `MarkItDown(enable_plugins=args.use_plugins)`；`MarkItDown.__init__()` 默认启用 builtins，注册 `PdfConverter()`、`DocxConverter()`、`XlsxConverter()`、`HtmlConverter()`、`ZipConverter(markitdown=self)` 等；`convert()` 看到 source 是普通字符串路径，就调用 `convert_local()`；`convert_local()` 建一个 `StreamInfo(local_path=path, extension=os.path.splitext(path)[1], filename=os.path.basename(path))`，打开文件后调用 `_get_stream_info_guesses()`；该函数先用扩展名推 MIME，再调用 `magika.Magika().identify_stream()`，文本还会用 `charset_normalizer` 读前 4096 bytes 猜 charset；`_convert()` 把 converter 按 priority 排序，逐个执行 `accepts()`，PDF 文件命中 `PdfConverter.accepts()` 的 `.pdf` 或 `application/pdf`；`PdfConverter.convert()` 用 `pdfplumber` 按页尝试表单/表格式内容抽取，若没有 form 页面或出错就用 `pdfminer.high_level.extract_text()`，最后合并 MasterFormat 风格的 `.1`、`.2` 行并返回 `DocumentConverterResult(markdown=markdown)`；CLI 的 `_handle_output()` 把 `result.markdown` 写到 `-o` 指定文件。术语：这是 source dispatcher → stream metadata inference → priority converter chain → format converter → result normalization 的管线。仓库测试把同一逻辑用于 `packages/markitdown/tests/test_files/test.pdf`，断言输出包含 `While there is contemporaneous exploration of multi-agent approaches`。（来源：README Command-Line；来源：packages/markitdown/src/markitdown/__main__.py；来源：packages/markitdown/src/markitdown/_markitdown.py；来源：packages/markitdown/src/markitdown/converters/_pdf_converter.py；来源：packages/markitdown/tests/_test_vectors.py）"
  essential_design_difference: "人话：最可复用的不是某个 PDF trick，而是它把文档读取拆成一组小接口：文件信息猜测、converter 接受判断、converter 转换、插件注册、MCP 封装。术语：这些是 adapter chain、metadata object、entry-point plugin、priority override、tool wrapper。（来源：packages/markitdown/src/markitdown/_base_converter.py；来源：packages/markitdown/src/markitdown/_stream_info.py；来源：packages/markitdown-sample-plugin/README.md） - DocumentConverter 接口 — copy: 每个格式实现 `accepts(file_stream, stream_info, **kwargs)` 和 `convert(...) -> DocumentConverterResult`；`accepts()` 文档强调如果读取 stream 必须 seek 回原位置。；skip: 如果你的项目只支持一种固定格式，用一个 converter chain 会增加样板。；why: 这让 PDF、DOCX、ZIP、YouTube、Azure CU、插件都能接同一个调度器。（来源：packages/markitdown/src/markitdown/_base_converter.py） - StreamInfo 数据对象 — copy: 用 `mimetype`、`extension`、`charset`、`filename`、`local_path`、`url` 承载上下文，并用 `copy_and_update()` 合并推断值。；skip: 如果输入元数据完全来自可信数据库，不需要重复猜测。；why: 同一个二进制 stream 可以从本地路径、HTTP header、data URI 或用户 hint 获得不同线索。（来源：packages/markitdown/src/markitdown/_stream_info.py；来源：packages/markitdown/src/markitdown/_markitdown.py convert_response） - 优先级 converter 注册 — copy: 内置具体格式 priority 0.0，泛文本/HTML/ZIP priority 10.0；插件可以用更低数值抢先，例如 OCR 插件的 -1.0。；skip: 如果扩展方不能信任，开放任意 priority 会增加不可预期行为。；why: 这提供了不改 core 就替换 converter 的路径。（来源：packages/markitdown/src/markitdown/_markitdown.py register_converter；来源：packages/markitdown-ocr/src/markitdown_ocr/_plugin.py） - entry point 插件协议 — copy: 插件包声明 `[project.entry-points.\"markitdown.plugin\"]`，导出 `__plugin_interface_version__ = 1` 和 `register_converters(markitdown, **kwargs)`。；skip: 如果部署环境禁止动态包发现，entry point 插件会增加供应链审计成本。；why: 第三方格式支持可以作为独立 pip 包发布，样例 RTF 插件用 `striprtf` 实现。（来源：packages/markitdown-sample-plugin/README.md；来源：packages/markitdown-sample-plugin/src/markitdown_sample_plugin/_plugin.py） - MCP 薄封装 — copy: `convert_to_markdown(uri)` 直接调用 `MarkItDown(...).convert_uri(uri).markdown`，HTTP 模式默认 host 是 `127.0.0.1`、port 是 `3001`。；skip: 需要多租户、认证、审计日志时，不要直接暴露该 MCP server。；why: 把文档转换变成 agent 可调用工具，但安全边界仍是本地可信进程。（来源：packages/markitdown-mcp/src/markitdown_mcp/__main__.py；来源：packages/markitdown-mcp/README.md Security Considerations）"
  practitioner_meaning: "人话：对 AI 工程师来说，MarkItDown 是值得 clone-and-run 的基础设施项目：它解决的是文件进 RAG/Agent 前的输入整形，且给了 CLI、Python、Docker、MCP、插件和 Azure 云转换路径。不要把它当高保真文档转换器，也不要把 MCP server 当可直接公网暴露的服务。术语：建议抽取的模式是 converter chain + StreamInfo + priority plugin；落地前要补自己的依赖锁定、SSRF/path allowlist、格式回归样本和 OCR/云成本控制。（来源：README Security Considerations；来源：packages/markitdown/src/markitdown/_markitdown.py；来源：packages/markitdown-mcp/README.md）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "MarkItDown 是微软维护的 Python CLI/库，把 PDF、Office、HTML、音频、图片、ZIP 等输入转成更适合 LLM 与文本分析管线消费的 Markdown。"
    body_md: "人话：它不是一个 Agent 框架，而是把杂乱文件先清洗成 Markdown 的入口层；CLI 示例是 `markitdown path-to-file.pdf > document.md`，Python 示例是 `MarkItDown(enable_plugins=False).convert(\"test.xlsx\")`。术语：这是文档转换 devtool，核心对象是 `MarkItDown`、`DocumentConverter`、`StreamInfo` 和 `DocumentConverterResult`，包版本在源码中为 `0.1.6`。（来源：README Usage；来源：packages/markitdown/src/markitdown/__about__.py；来源：packages/markitdown/src/markitdown/_markitdown.py）"
  why_worth_attention:
    summary: ""
    body_md: "人话：它值得看，是因为很多 RAG、检索、评测、Agent 工具调用场景的第一步不是推理，而是把文件稳定读出来。MarkItDown 把 CLI、Python API、可选依赖、插件、MCP 包和 Azure 路由放在一个仓库里。术语：它把输入解析分成 source routing、stream metadata guessing、converter priority、format-specific converter、optional cloud converter 几层。（来源：README Installation；来源：README Optional Dependencies；来源：packages/markitdown/pyproject.toml；来源：packages/markitdown-mcp/README.md）"
    bullets:
      - "CLI 已核实：`packages/markitdown/pyproject.toml` 定义脚本 `markitdown = markitdown.__main__:main`，`__main__.py` 支持 `-o/--output`、`-x/--extension`、`-m/--mime-type`、`-c/--charset`、`--use-docintel`、`--use-cu`、`--use-plugins`、`--keep-data-uris`。（来源：packages/markitdown/pyproject.toml project.scripts；来源：packages/markitdown/src/markitdown/__main__.py）"
      - "Python API 已核实：README 给出 `md = MarkItDown(enable_plugins=False)` 和 `result = md.convert(\"test.xlsx\")`；源码 `convert()` 分派到 `convert_uri()`、`convert_local()`、`convert_response()` 或 `convert_stream()`。（来源：README Python API；来源：packages/markitdown/src/markitdown/_markitdown.py convert）"
      - "可扩展性已核实：插件通过 `entry_points(group=\"markitdown.plugin\")` 懒加载，样例插件在 `pyproject.toml` 里声明 `[project.entry-points.\"markitdown.plugin\"] sample_plugin = \"markitdown_sample_plugin\"`。（来源：packages/markitdown/src/markitdown/_markitdown.py _load_plugins；来源：packages/markitdown-sample-plugin/pyproject.toml entry-points）"
      - "AI 入口已核实：图片描述通过 `llm_client` 和 `llm_model` 调用 `client.chat.completions.create`，OCR 插件也复用同一类 OpenAI-compatible client。（来源：README Python API；来源：packages/markitdown/src/markitdown/converters/_image_converter.py；来源：packages/markitdown-ocr/src/markitdown_ocr/_ocr_service.py）"
  key_claims_evidence:
    summary: ""
    body_md: "人话：README 的格式支持、LLM 友好、Azure 更高质量等描述按自称处理；源码中能看到的 CLI 入口、转换器注册、MCP 工具、插件优先级按已核实处理。术语：下面把 claim、mechanism、support boundary 和 threat 拆开，避免把营销句当实现事实。（来源：README；来源：packages tree）"
    items:
      - claim: "MarkItDown 是轻量 Python 工具，把各种文件转 Markdown，供 LLM 和文本分析管线使用。"
        plain_english: "定位是先把 PDF/Office/网页/媒体等输入变成 Markdown，而不是做高保真排版还原。"
        source: "README opening description"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 明确说用于 LLMs and related text analysis pipelines，并说明输出 often reasonably presentable 但 meant to be consumed by text analysis tools。"
        does_not_support: "README 同段明确说 may not be the best option for high-fidelity document conversions for human consumption。"
        threat: "没有 README 内 benchmark 或人工评测表证明转换质量。"
      - claim: "CLI 和 Python API 都是仓库内真实入口。"
        plain_english: "可以作为命令行工具，也可以嵌入 Python 代码。"
        source: "packages/markitdown/pyproject.toml project.scripts；packages/markitdown/src/markitdown/__main__.py；README Usage"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`project.scripts` 定义 `markitdown = markitdown.__main__:main`；README 给出 `markitdown path-to-file.pdf -o document.md` 和 `MarkItDown(...).convert(\"test.xlsx\")`。"
        does_not_support: "本次未执行完整安装后的 CLI 转换。"
        threat: "直接从源码导入在当前环境缺少 `magika` 依赖，说明未安装依赖时不能直接运行。"
      - claim: "内置转换器通过优先级排序尝试，低数值优先。"
        plain_english: "它不是一个大 if/else，而是注册一组 converter，再按 priority 轮流问谁接受该文件。"
        source: "packages/markitdown/src/markitdown/_markitdown.py enable_builtins/register_converter/_convert"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "源码常量 `PRIORITY_SPECIFIC_FILE_FORMAT = 0.0`、`PRIORITY_GENERIC_FILE_FORMAT = 10.0`；`_convert()` 对 `self._converters` 按 `priority` stable sort；内置注册了 `DocxConverter`、`XlsxConverter`、`PptxConverter`、`AudioConverter`、`ImageConverter`、`PdfConverter`、`EpubConverter`、`CsvConverter` 等。"
        does_not_support: "没有证明所有 README 列出的格式在所有真实文件上都成功。"
        threat: "转换成功依赖可选依赖和具体文件结构。"
      - claim: "可选依赖按文件类型拆包。"
        plain_english: "不想装全家桶时，可以只装 PDF、DOCX、PPTX 等需要的部分。"
        source: "README Optional Dependencies；packages/markitdown/pyproject.toml optional-dependencies"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "README 示例 `pip install 'markitdown[pdf, docx, pptx]'`；pyproject 定义 `[pdf]` 为 `pdfminer.six>=20251230` 与 `pdfplumber>=0.11.9`，`[docx]` 为 `mammoth~=1.11.0` 与 `lxml`，`[az-content-understanding]` 为 `azure-ai-contentunderstanding>=1.2.0b1` 与 `azure-identity`。"
        does_not_support: "没有在本次运行中安装每个 extras 并逐项验证。"
        threat: "extras 版本约束变化会影响安装成功率和转换行为。"
      - claim: "PDF 转换有 pdfplumber 富提取与 pdfminer fallback。"
        plain_english: "遇到表单/表格式 PDF 时先按页面词坐标处理，否则回退到整文档文本提取。"
        source: "packages/markitdown/src/markitdown/converters/_pdf_converter.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`PdfConverter.convert()` 读取 PDF 到 `BytesIO`，用 `pdfplumber.open()` 逐页调用 `_extract_form_content_from_words(page)`，无 form 页面时用 `pdfminer.high_level.extract_text(pdf_bytes)`；异常时也 fallback 到 pdfminer；最后调用 `_merge_partial_numbering_lines()`。"
        does_not_support: "没有证明复杂扫描件、手写表格或所有语言都能正确还原。"
        threat: "依赖 pdfplumber/pdfminer；扫描 PDF 需要 OCR 插件或 Azure 路径。"
      - claim: "MCP 包暴露一个转换工具 `convert_to_markdown(uri)`。"
        plain_english: "本地 agent 可以通过 MCP 调 MarkItDown，把 URI 转 Markdown。"
        source: "packages/markitdown-mcp/README.md Usage；packages/markitdown-mcp/src/markitdown_mcp/__main__.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "README 写明一个工具 `convert_to_markdown(uri)`，uri 可为 `http:`、`https:`、`file:`、`data:`；源码 `@mcp.tool()` 函数返回 `MarkItDown(enable_plugins=check_plugins_enabled()).convert_uri(uri).markdown`。"
        does_not_support: "没有认证、租户隔离或远程安全网关。"
        threat: "README Security 明确该 server no authentication，并以运行用户权限读取文件和网络。"
      - claim: "OCR 插件用 priority -1.0 抢在内置 converter 之前处理 PDF/DOCX/PPTX/XLSX。"
        plain_english: "启用插件后，它先尝试带 LLM Vision OCR 的 converter；没配置 llm_client/llm_model 时 OCR 服务为空。"
        source: "packages/markitdown-ocr/README.md How It Works；packages/markitdown-ocr/src/markitdown_ocr/_plugin.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`register_converters()` 读取 `llm_client`、`llm_model`、`llm_prompt`，在二者存在时创建 `LLMVisionOCRService`；四个 converter 以 `PRIORITY_OCR_ENHANCED = -1.0` 注册。"
        does_not_support: "OCR README 的 CLI 示例包含 `--llm-client openai --llm-model gpt-4o`，但主 CLI parser 未定义这两个参数。"
        threat: "CLI OCR 路径存在文档/实现不一致；Python API 路径更清晰。"
      - claim: "Azure Content Understanding 路径会产生 billable Azure API calls，并可用 `cu_file_types` 限制路由。"
        plain_english: "云端高质量提取不是免费本地转换，每次被 CU 路由的 convert 都会打 Azure。"
        source: "README Azure Content Understanding；packages/markitdown/src/markitdown/converters/_cu_converter.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "README 写 `Each convert() call for a CU-routed format is a billable Azure API call`；源码 `ContentUnderstandingConverter.convert()` 调用 `begin_analyze_binary()`，`file_types` 由 `cu_file_types` 传入。"
        does_not_support: "没有本次账号级调用验证、成本数值或质量评测。"
        threat: "Azure SDK、认证、endpoint、analyzer 可用性都会影响运行。"
  how_it_works:
    summary: ""
    body_md: "人话：以真实 README 示例 `markitdown path-to-file.pdf -o document.md` 为流：CLI 在 `packages/markitdown/src/markitdown/__main__.py` 解析 `filename` 和 `-o`，构造 `MarkItDown(enable_plugins=args.use_plugins)`；`MarkItDown.__init__()` 默认启用 builtins，注册 `PdfConverter()`、`DocxConverter()`、`XlsxConverter()`、`HtmlConverter()`、`ZipConverter(markitdown=self)` 等；`convert()` 看到 source 是普通字符串路径，就调用 `convert_local()`；`convert_local()` 建一个 `StreamInfo(local_path=path, extension=os.path.splitext(path)[1], filename=os.path.basename(path))`，打开文件后调用 `_get_stream_info_guesses()`；该函数先用扩展名推 MIME，再调用 `magika.Magika().identify_stream()`，文本还会用 `charset_normalizer` 读前 4096 bytes 猜 charset；`_convert()` 把 converter 按 priority 排序，逐个执行 `accepts()`，PDF 文件命中 `PdfConverter.accepts()` 的 `.pdf` 或 `application/pdf`；`PdfConverter.convert()` 用 `pdfplumber` 按页尝试表单/表格式内容抽取，若没有 form 页面或出错就用 `pdfminer.high_level.extract_text()`，最后合并 MasterFormat 风格的 `.1`、`.2` 行并返回 `DocumentConverterResult(markdown=markdown)`；CLI 的 `_handle_output()` 把 `result.markdown` 写到 `-o` 指定文件。术语：这是 source dispatcher → stream metadata inference → priority converter chain → format converter → result normalization 的管线。仓库测试把同一逻辑用于 `packages/markitdown/tests/test_files/test.pdf`，断言输出包含 `While there is contemporaneous exploration of multi-agent approaches`。（来源：README Command-Line；来源：packages/markitdown/src/markitdown/__main__.py；来源：packages/markitdown/src/markitdown/_markitdown.py；来源：packages/markitdown/src/markitdown/converters/_pdf_converter.py；来源：packages/markitdown/tests/_test_vectors.py）"
  reusable_abstractions:
    summary: ""
    body_md: "人话：最可复用的不是某个 PDF trick，而是它把文档读取拆成一组小接口：文件信息猜测、converter 接受判断、converter 转换、插件注册、MCP 封装。术语：这些是 adapter chain、metadata object、entry-point plugin、priority override、tool wrapper。（来源：packages/markitdown/src/markitdown/_base_converter.py；来源：packages/markitdown/src/markitdown/_stream_info.py；来源：packages/markitdown-sample-plugin/README.md）"
    items:
      - name: "DocumentConverter 接口"
        copy: "每个格式实现 `accepts(file_stream, stream_info, **kwargs)` 和 `convert(...) -> DocumentConverterResult`；`accepts()` 文档强调如果读取 stream 必须 seek 回原位置。"
        skip: "如果你的项目只支持一种固定格式，用一个 converter chain 会增加样板。"
        why_it_matters: "这让 PDF、DOCX、ZIP、YouTube、Azure CU、插件都能接同一个调度器。（来源：packages/markitdown/src/markitdown/_base_converter.py）"
      - name: "StreamInfo 数据对象"
        copy: "用 `mimetype`、`extension`、`charset`、`filename`、`local_path`、`url` 承载上下文，并用 `copy_and_update()` 合并推断值。"
        skip: "如果输入元数据完全来自可信数据库，不需要重复猜测。"
        why_it_matters: "同一个二进制 stream 可以从本地路径、HTTP header、data URI 或用户 hint 获得不同线索。（来源：packages/markitdown/src/markitdown/_stream_info.py；来源：packages/markitdown/src/markitdown/_markitdown.py convert_response）"
      - name: "优先级 converter 注册"
        copy: "内置具体格式 priority 0.0，泛文本/HTML/ZIP priority 10.0；插件可以用更低数值抢先，例如 OCR 插件的 -1.0。"
        skip: "如果扩展方不能信任，开放任意 priority 会增加不可预期行为。"
        why_it_matters: "这提供了不改 core 就替换 converter 的路径。（来源：packages/markitdown/src/markitdown/_markitdown.py register_converter；来源：packages/markitdown-ocr/src/markitdown_ocr/_plugin.py）"
      - name: "entry point 插件协议"
        copy: "插件包声明 `[project.entry-points.\"markitdown.plugin\"]`，导出 `__plugin_interface_version__ = 1` 和 `register_converters(markitdown, **kwargs)`。"
        skip: "如果部署环境禁止动态包发现，entry point 插件会增加供应链审计成本。"
        why_it_matters: "第三方格式支持可以作为独立 pip 包发布，样例 RTF 插件用 `striprtf` 实现。（来源：packages/markitdown-sample-plugin/README.md；来源：packages/markitdown-sample-plugin/src/markitdown_sample_plugin/_plugin.py）"
      - name: "MCP 薄封装"
        copy: "`convert_to_markdown(uri)` 直接调用 `MarkItDown(...).convert_uri(uri).markdown`，HTTP 模式默认 host 是 `127.0.0.1`、port 是 `3001`。"
        skip: "需要多租户、认证、审计日志时，不要直接暴露该 MCP server。"
        why_it_matters: "把文档转换变成 agent 可调用工具，但安全边界仍是本地可信进程。（来源：packages/markitdown-mcp/src/markitdown_mcp/__main__.py；来源：packages/markitdown-mcp/README.md Security Considerations）"
  dependency_platform_risk:
    summary: ""
    body_md: "人话：这个项目的风险主要不在核心类数量，而在输入权限、可选依赖、云服务、插件和 MCP 暴露面。术语：dependency exposure 包括 package extras、native tools、cloud API、dynamic plugin loading、local network server。（来源：packages/markitdown/pyproject.toml；来源：Dockerfile；来源：packages/markitdown-mcp/README.md）"
    items:
      - dependency: "magika、charset-normalizer、mimetypes 推断链"
        what_if_change: "文件类型识别结果变化会改变 `_convert()` 尝试的 converter 和 `StreamInfo`。"
        exposure: "medium"
        mitigation_or_unknown: "可用 CLI `-x/--extension`、`-m/--mime-type`、`-c/--charset` 或 Python `StreamInfo` 提供 hint；没有 README 级回归矩阵说明所有格式稳定性。"
        source: "packages/markitdown/src/markitdown/_markitdown.py _get_stream_info_guesses；packages/markitdown/src/markitdown/__main__.py args"
      - dependency: "PDF extras：pdfminer.six>=20251230、pdfplumber>=0.11.9"
        what_if_change: "PDF 文本/表格抽取和 fallback 行为会随这两个库变化。"
        exposure: "medium"
        mitigation_or_unknown: "测试目录含 `test_pdf_tables.py`、`test_pdf_memory.py`、`test_pdf_masterformat.py` 和多个 expected_outputs；未找到公开 benchmark。"
        source: "packages/markitdown/pyproject.toml optional-dependencies；packages/markitdown/tests tree"
      - dependency: "Office extras：mammoth~=1.11.0、lxml、pandas、openpyxl、xlrd、python-pptx"
        what_if_change: "DOCX→HTML→Markdown、XLSX/XLS sheet 转表格、PPTX 图片和图表处理会受依赖版本影响。"
        exposure: "medium"
        mitigation_or_unknown: "按格式拆 extras 可降低安装面；没有 README 说明 Office 复杂样式兼容范围。"
        source: "packages/markitdown/pyproject.toml optional-dependencies；packages/markitdown/src/markitdown/converters/_docx_converter.py；packages/markitdown/src/markitdown/converters/_xlsx_converter.py"
      - dependency: "Azure Document Intelligence / Azure Content Understanding"
        what_if_change: "云 SDK、endpoint、认证、analyzer 名称或计费策略变化会影响转换、成本和输出 YAML/front matter。"
        exposure: "high"
        mitigation_or_unknown: "README 建议用 `cu_file_types=[ContentUnderstandingFileType.PDF]` 限制 CU 路由；成本数值未在 README/docs/tree 说明。"
        source: "README Azure Content Understanding；packages/markitdown/src/markitdown/converters/_cu_converter.py；packages/markitdown/src/markitdown/converters/_doc_intel_converter.py"
      - dependency: "OpenAI-compatible vision client"
        what_if_change: "图片描述和 OCR 插件依赖 `client.chat.completions.create` 的 message schema、模型视觉能力和 API quota。"
        exposure: "medium"
        mitigation_or_unknown: "无 `llm_client` 或 `llm_model` 时 OCR service 不创建；OCR README 说会 silent skip，但 CLI OCR 参数与主 CLI parser 不一致，需确认。"
        source: "packages/markitdown/src/markitdown/converters/_image_converter.py；packages/markitdown-ocr/src/markitdown_ocr/_plugin.py；packages/markitdown-ocr/README.md Usage"
      - dependency: "MCP server：mcp~=1.8.0、Starlette、uvicorn、本地文件权限"
        what_if_change: "MCP transport 或 server 暴露方式变化会影响 agent 集成；绑定非 localhost 会暴露文件读取和网络访问能力。"
        exposure: "high"
        mitigation_or_unknown: "README 建议本地可信 agent，Docker/VM sandbox；源码在非 localhost host 时打印 no authentication 权限警告。"
        source: "packages/markitdown-mcp/pyproject.toml dependencies；packages/markitdown-mcp/src/markitdown_mcp/__main__.py；packages/markitdown-mcp/README.md Security Considerations"
      - dependency: "exiftool、ffmpeg Docker runtime"
        what_if_change: "图片/音频元数据和音频处理依赖系统工具可用性。"
        exposure: "low"
        mitigation_or_unknown: "Dockerfile 安装 `ffmpeg` 与 `exiftool`，并设置 `EXIFTOOL_PATH=/usr/bin/exiftool`、`FFMPEG_PATH=/usr/bin/ffmpeg`；非 Docker 环境需自行安装。"
        source: "Dockerfile；packages/markitdown/src/markitdown/converters/_image_converter.py；packages/markitdown/src/markitdown/converters/_audio_converter.py"
  unknowns_to_confirm:
    summary: ""
    body_md: "人话：仓库内容足够判断它是实用的文档转 Markdown 工具，但不足以证明质量、速度、格式覆盖边界和安全部署方案。术语：unknowns 集中在 benchmark、compatibility matrix、production hardening、OCR CLI parity。（来源：README；来源：repo tree；来源：packages tests tree）"
    items:
      - "未在 README/docs/tree 找到系统 benchmark、吞吐量、内存占用或与 textract/Pandoc/Tika 的定量对比。"
      - "README 写 `... and more!`，但没有精确支持格式总数；可核实的是源码注册的 converter 和 pyproject extras。"
      - "未找到 top-level `docs/` 或 `examples/` 目录；更深说明分散在各 package README、tests 和源码注释中。"
      - "OCR README 的 CLI 示例 `--llm-client openai --llm-model gpt-4o` 与 `packages/markitdown/src/markitdown/__main__.py` 当前 parser 不匹配，需要上游确认。"
      - "MCP server README 明确无认证；未在仓库看到 allowlist、path sandbox、SSRF 防护或 per-tool policy。"
      - "本次未执行 `pip install 'packages/markitdown[all]'`、`hatch test` 或真实文件转换；直接源码 import 因当前环境缺少 `magika` 失败。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 4
      工程深度: 3
      复用价值: 4
      成熟度: 4
    body_md: "人话：对 AI 工程师来说，MarkItDown 是值得 clone-and-run 的基础设施项目：它解决的是文件进 RAG/Agent 前的输入整形，且给了 CLI、Python、Docker、MCP、插件和 Azure 云转换路径。不要把它当高保真文档转换器，也不要把 MCP server 当可直接公网暴露的服务。术语：建议抽取的模式是 converter chain + StreamInfo + priority plugin；落地前要补自己的依赖锁定、SSRF/path allowlist、格式回归样本和 OCR/云成本控制。（来源：README Security Considerations；来源：packages/markitdown/src/markitdown/_markitdown.py；来源：packages/markitdown-mcp/README.md）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-ptp2\\\\microsoft-markitdown\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-ptp2\\microsoft-markitdown\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-ptp2\\microsoft-markitdown\\codex-last-message.json"
  invoked_at: "2026-06-08T14:00:33.875Z"
  completed_at: "2026-06-08T14:05:06.141Z"
  repo: "microsoft/markitdown"
reasoning_trace:
  paper_type_decision: "project_type = devtool_cli; evidence from README/artifactAudit only."
  central_contribution: "Python tool for converting files and office documents to Markdown."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "MarkItDown 是轻量 Python 工具，把各种文件转 Markdown，供 LLM 和文本分析管线使用。"
    - "CLI 和 Python API 都是仓库内真实入口。"
    - "内置转换器通过优先级排序尝试，低数值优先。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "packages/markitdown/src/markitdown/_markitdown.py _get_stream_info_guesses；packages/markitdown/src/markitdown/__main__.py args"
    - "packages/markitdown/pyproject.toml optional-dependencies；packages/markitdown/tests tree"
    - "packages/markitdown/pyproject.toml optional-dependencies；packages/markitdown/src/markitdown/converters/_docx_converter.py；packages/markitdown/src/markitdown/converters/_xlsx_converter.py"
    - "README Azure Content Understanding；packages/markitdown/src/markitdown/converters/_cu_converter.py；packages/markitdown/src/markitdown/converters/_doc_intel_converter.py"
    - "packages/markitdown/src/markitdown/converters/_image_converter.py；packages/markitdown-ocr/src/markitdown_ocr/_plugin.py；packages/markitdown-ocr/README.md Usage"
    - "packages/markitdown-mcp/pyproject.toml dependencies；packages/markitdown-mcp/src/markitdown_mcp/__main__.py；packages/markitdown-mcp/README.md Security Considerations"
    - "Dockerfile；packages/markitdown/src/markitdown/converters/_image_converter.py；packages/markitdown/src/markitdown/converters/_audio_converter.py"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 4
  engineering_depth: 3
  reuse_value: 4
  maturity: 4
  main_risk: "人话：对 AI 工程师来说，MarkItDown 是值得 clone-and-run 的基础设施项目：它解决的是文件进 RAG/Agent 前的输入整形，且给了 CLI、Python、Docker、MCP、插件和 Azure 云转换路径。不要把它当高保真文档转换器，也不要把 MCP server 当可直接公网暴露的服务。术语：建议抽取的模式是 converter chain + StreamInfo + priority plugin；落地前要补自己的依赖锁定、SSRF/path allowlist、格式回归样本和 OCR/云成本控制。（来源：README Security Considerations；来源：packages/markitdown/src/markitdown/_markitdown.py；来源：packages/markitdown-mcp/README.md）"
next_actions:
  - "clone-and-run"
unknowns:
  - "未在 README/docs/tree 找到系统 benchmark、吞吐量、内存占用或与 textract/Pandoc/Tika 的定量对比。"
  - "README 写 `... and more!`，但没有精确支持格式总数；可核实的是源码注册的 converter 和 pyproject extras。"
  - "未找到 top-level `docs/` 或 `examples/` 目录；更深说明分散在各 package README、tests 和源码注释中。"
  - "OCR README 的 CLI 示例 `--llm-client openai --llm-model gpt-4o` 与 `packages/markitdown/src/markitdown/__main__.py` 当前 parser 不匹配，需要上游确认。"
  - "MCP server README 明确无认证；未在仓库看到 allowlist、path sandbox、SSRF 防护或 per-tool policy。"
  - "本次未执行 `pip install 'packages/markitdown[all]'`、`hatch test` 或真实文件转换；直接源码 import 因当前环境缺少 `magika` 失败。"
builder_reuse:
  pattern: "DocumentConverter 接口"
  copy: "每个格式实现 `accepts(file_stream, stream_info, **kwargs)` 和 `convert(...) -> DocumentConverterResult`；`accepts()` 文档强调如果读取 stream 必须 seek 回原位置。"
  skip: "如果你的项目只支持一种固定格式，用一个 converter chain 会增加样板。"
  why_it_matters: "这让 PDF、DOCX、ZIP、YouTube、Azure CU、插件都能接同一个调度器。（来源：packages/markitdown/src/markitdown/_base_converter.py）"
dependency_platform_risk:
  dependency: "magika、charset-normalizer、mimetypes 推断链"
  what_if_change: "文件类型识别结果变化会改变 `_convert()` 尝试的 converter 和 `StreamInfo`。"
  exposure: "medium"
  mitigation_or_unknown: "可用 CLI `-x/--extension`、`-m/--mime-type`、`-c/--charset` 或 Python `StreamInfo` 提供 hint；没有 README 级回归矩阵说明所有格式稳定性。"
claim_ledger:
  - claim: "MarkItDown 是轻量 Python 工具，把各种文件转 Markdown，供 LLM 和文本分析管线使用。"
    plain_english: "定位是先把 PDF/Office/网页/媒体等输入变成 Markdown，而不是做高保真排版还原。"
    source: "README opening description"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 明确说用于 LLMs and related text analysis pipelines，并说明输出 often reasonably presentable 但 meant to be consumed by text analysis tools。"
    does_not_support: "README 同段明确说 may not be the best option for high-fidelity document conversions for human consumption。"
    threat: "没有 README 内 benchmark 或人工评测表证明转换质量。"
  - claim: "CLI 和 Python API 都是仓库内真实入口。"
    plain_english: "可以作为命令行工具，也可以嵌入 Python 代码。"
    source: "packages/markitdown/pyproject.toml project.scripts；packages/markitdown/src/markitdown/__main__.py；README Usage"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`project.scripts` 定义 `markitdown = markitdown.__main__:main`；README 给出 `markitdown path-to-file.pdf -o document.md` 和 `MarkItDown(...).convert(\"test.xlsx\")`。"
    does_not_support: "本次未执行完整安装后的 CLI 转换。"
    threat: "直接从源码导入在当前环境缺少 `magika` 依赖，说明未安装依赖时不能直接运行。"
  - claim: "内置转换器通过优先级排序尝试，低数值优先。"
    plain_english: "它不是一个大 if/else，而是注册一组 converter，再按 priority 轮流问谁接受该文件。"
    source: "packages/markitdown/src/markitdown/_markitdown.py enable_builtins/register_converter/_convert"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "源码常量 `PRIORITY_SPECIFIC_FILE_FORMAT = 0.0`、`PRIORITY_GENERIC_FILE_FORMAT = 10.0`；`_convert()` 对 `self._converters` 按 `priority` stable sort；内置注册了 `DocxConverter`、`XlsxConverter`、`PptxConverter`、`AudioConverter`、`ImageConverter`、`PdfConverter`、`EpubConverter`、`CsvConverter` 等。"
    does_not_support: "没有证明所有 README 列出的格式在所有真实文件上都成功。"
    threat: "转换成功依赖可选依赖和具体文件结构。"
  - claim: "可选依赖按文件类型拆包。"
    plain_english: "不想装全家桶时，可以只装 PDF、DOCX、PPTX 等需要的部分。"
    source: "README Optional Dependencies；packages/markitdown/pyproject.toml optional-dependencies"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "README 示例 `pip install 'markitdown[pdf, docx, pptx]'`；pyproject 定义 `[pdf]` 为 `pdfminer.six>=20251230` 与 `pdfplumber>=0.11.9`，`[docx]` 为 `mammoth~=1.11.0` 与 `lxml`，`[az-content-understanding]` 为 `azure-ai-contentunderstanding>=1.2.0b1` 与 `azure-identity`。"
    does_not_support: "没有在本次运行中安装每个 extras 并逐项验证。"
    threat: "extras 版本约束变化会影响安装成功率和转换行为。"
  - claim: "PDF 转换有 pdfplumber 富提取与 pdfminer fallback。"
    plain_english: "遇到表单/表格式 PDF 时先按页面词坐标处理，否则回退到整文档文本提取。"
    source: "packages/markitdown/src/markitdown/converters/_pdf_converter.py"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`PdfConverter.convert()` 读取 PDF 到 `BytesIO`，用 `pdfplumber.open()` 逐页调用 `_extract_form_content_from_words(page)`，无 form 页面时用 `pdfminer.high_level.extract_text(pdf_bytes)`；异常时也 fallback 到 pdfminer；最后调用 `_merge_partial_numbering_lines()`。"
    does_not_support: "没有证明复杂扫描件、手写表格或所有语言都能正确还原。"
    threat: "依赖 pdfplumber/pdfminer；扫描 PDF 需要 OCR 插件或 Azure 路径。"
  - claim: "MCP 包暴露一个转换工具 `convert_to_markdown(uri)`。"
    plain_english: "本地 agent 可以通过 MCP 调 MarkItDown，把 URI 转 Markdown。"
    source: "packages/markitdown-mcp/README.md Usage；packages/markitdown-mcp/src/markitdown_mcp/__main__.py"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "README 写明一个工具 `convert_to_markdown(uri)`，uri 可为 `http:`、`https:`、`file:`、`data:`；源码 `@mcp.tool()` 函数返回 `MarkItDown(enable_plugins=check_plugins_enabled()).convert_uri(uri).markdown`。"
    does_not_support: "没有认证、租户隔离或远程安全网关。"
    threat: "README Security 明确该 server no authentication，并以运行用户权限读取文件和网络。"
artifact_audit:
  official_repo: "https://github.com/microsoft/markitdown"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "not_found"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

microsoft/markitdown：Python 工具，用于将文件和 Office 文档转换为 Markdown。

（来源：README/artifactAudit）

## 干什么

Python tool for converting files and office documents to Markdown.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 148001 |
| stars_in_period | 26145 |
| author | microsoft |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- skills（来源：数据不足）
- models（来源：数据不足）
- cli（来源：数据不足）

## 解决什么痛点

人话：它值得看，是因为很多 RAG、检索、评测、Agent 工具调用场景的第一步不是推理，而是把文件稳定读出来。MarkItDown 把 CLI、Python API、可选依赖、插件、MCP 包和 Azure 路由放在一个仓库里。术语：它把输入解析分成 source routing、stream metadata guessing、converter priority、format-specific converter、optional cloud converter 几层。（来源：README Installation；来源：README Optional Dependencies；来源：packages/markitdown/pyproject.toml；来源：packages/markitdown-mcp/README.md）

## 核心能力

- DocumentConverter 接口（来源：数据不足）
- StreamInfo 数据对象（来源：数据不足）
- 优先级 converter 注册（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

{"body_md":"人话：README 自己把 MarkItDown 和 `textract` 放在同一类，但强调它更关注把标题、列表、表格、链接等结构保留为 Markdown；它也明确说不适合高保真人类文档转换。横向看：选 MarkItDown，当目标是 Python/RAG/LLM 管线、希望 CLI 与 Python API 一起用、输出 Markdown 足够；选 textract，当只需要传统纯文本抽取且已有 textract 工作流，textract 能力未在本次仓库核验；选 Pandoc，当目标是人类可读文档格式互转、排版语义和文档出版链路更重要，Pandoc 能力未在本次仓库核验；选 Apache Tika，当组织已有 JVM/服务化内容抽取平台、需要把抽取作为中心服务暴露，Tika 能力未在本次仓库核验。术语：差异维度是输出目标 Markdown vs plain text vs publishing conversion、集成路径 Python library/CLI/MCP vs 现有工具链、运行边界本地进程 vs 服务化抽取。未在本次克隆中找到官方 benchmark 对 textract、Pandoc、Tika 做质量或速度对比。（来源：README opening description；来源：README Security Considerations；来源：packages/markitdown-mcp/README.md）"}

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话：以真实 README 示例 `markitdown path-to-file.pdf -o document.md` 为流：CLI 在 `packages/markitdown/src/markitdown/__main__.py` 解析 `filename` 和 `-o`，构造 `MarkItDown(enable_plugins=args.use_plugins)`；`MarkItDown.__init__()` 默认启用 builtins，注册 `PdfConverter()`、`DocxConverter()`、`XlsxConverter()`、`HtmlConverter()`、`ZipConverter(markitdown=self)` 等；`convert()` 看到 source 是普通字符串路径，就调用 `convert_local()`；`convert_local()` 建一个 `StreamInfo(local_path=path, extension=os.path.splitext(path)[1], filename=os.path.basename(path))`，打开文件后调用 `_get_stream_info_guesses()`；该函数先用扩展名推 MIME，再调用 `magika.Magika().identify_stream()`，文本还会用 `charset_normalizer` 读前 4096 bytes 猜 charset；`_convert()` 把 converter 按 priority 排序，逐个执行 `accepts()`，PDF 文件命中 `PdfConverter.accepts()` 的 `.pdf` 或 `application/pdf`；`PdfConverter.convert()` 用 `pdfplumber` 按页尝试表单/表格式内容抽取，若没有 form 页面或出错就用 `pdfminer.high_level.extract_text()`，最后合并 MasterFormat 风格的 `.1`、`.2` 行并返回 `DocumentConverterResult(markdown=markdown)`；CLI 的 `_handle_output()` 把 `result.markdown` 写到 `-o` 指定文件。术语：这是 source dispatcher → stream metadata inference → priority converter chain → format converter → result normalization 的管线。仓库测试把同一逻辑用于 `packages/markitdown/tests/test_files/test.pdf`，断言输出包含 `While there is contemporaneous exploration of multi-agent approaches`。（来源：README Command-Line；来源：packages/markitdown/src/markitdown/__main__.py；来源：packages/markitdown/src/markitdown/_markitdown.py；来源：packages/markitdown/src/markitdown/converters/_pdf_converter.py；来源：packages/markitdown/tests/_test_vectors.py）

## 本质不同的设计取舍

人话：最可复用的不是某个 PDF trick，而是它把文档读取拆成一组小接口：文件信息猜测、converter 接受判断、converter 转换、插件注册、MCP 封装。术语：这些是 adapter chain、metadata object、entry-point plugin、priority override、tool wrapper。（来源：packages/markitdown/src/markitdown/_base_converter.py；来源：packages/markitdown/src/markitdown/_stream_info.py；来源：packages/markitdown-sample-plugin/README.md） - DocumentConverter 接口 — copy: 每个格式实现 `accepts(file_stream, stream_info, **kwargs)` 和 `convert(...) -> DocumentConverterResult`；`accepts()` 文档强调如果读取 stream 必须 seek 回原位置。；skip: 如果你的项目只支持一种固定格式，用一个 converter chain 会增加样板。；why: 这让 PDF、DOCX、ZIP、YouTube、Azure CU、插件都能接同一个调度器。（来源：packages/markitdown/src/markitdown/_base_converter.py） - StreamInfo 数据对象 — copy: 用 `mimetype`、`extension`、`charset`、`filename`、`local_path`、`url` 承载上下文，并用 `copy_and_update()` 合并推断值。；skip: 如果输入元数据完全来自可信数据库，不需要重复猜测。；why: 同一个二进制 stream 可以从本地路径、HTTP header、data URI 或用户 hint 获得不同线索。（来源：packages/markitdown/src/markitdown/_stream_info.py；来源：packages/markitdown/src/markitdown/_markitdown.py convert_response） - 优先级 converter 注册 — copy: 内置具体格式 priority 0.0，泛文本/HTML/ZIP priority 10.0；插件可以用更低数值抢先，例如 OCR 插件的 -1.0。；skip: 如果扩展方不能信任，开放任意 priority 会增加不可预期行为。；why: 这提供了不改 core 就替换 converter 的路径。（来源：packages/markitdown/src/markitdown/_markitdown.py register_converter；来源：packages/markitdown-ocr/src/markitdown_ocr/_plugin.py） - entry point 插件协议 — copy: 插件包声明 `[project.entry-points."markitdown.plugin"]`，导出 `__plugin_interface_version__ = 1` 和 `register_converters(markitdown, **kwargs)`。；skip: 如果部署环境禁止动态包发现，entry point 插件会增加供应链审计成本。；why: 第三方格式支持可以作为独立 pip 包发布，样例 RTF 插件用 `striprtf` 实现。（来源：packages/markitdown-sample-plugin/README.md；来源：packages/markitdown-sample-plugin/src/markitdown_sample_plugin/_plugin.py） - MCP 薄封装 — copy: `convert_to_markdown(uri)` 直接调用 `MarkItDown(...).convert_uri(uri).markdown`，HTTP 模式默认 host 是 `127.0.0.1`、port 是 `3001`。；skip: 需要多租户、认证、审计日志时，不要直接暴露该 MCP server。；why: 把文档转换变成 agent 可调用工具，但安全边界仍是本地可信进程。（来源：packages/markitdown-mcp/src/markitdown_mcp/__main__.py；来源：packages/markitdown-mcp/README.md Security Considerations）

## 对从业者意味着什么

人话：对 AI 工程师来说，MarkItDown 是值得 clone-and-run 的基础设施项目：它解决的是文件进 RAG/Agent 前的输入整形，且给了 CLI、Python、Docker、MCP、插件和 Azure 云转换路径。不要把它当高保真文档转换器，也不要把 MCP server 当可直接公网暴露的服务。术语：建议抽取的模式是 converter chain + StreamInfo + priority plugin；落地前要补自己的依赖锁定、SSRF/path allowlist、格式回归样本和 OCR/云成本控制。（来源：README Security Considerations；来源：packages/markitdown/src/markitdown/_markitdown.py；来源：packages/markitdown-mcp/README.md）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/markdown-for-llm]]、[[concepts/document-converter-chain]]。另见 [[content/microsoft-markitdown]]、[[claims/microsoft-markitdown-main-claim]]。
