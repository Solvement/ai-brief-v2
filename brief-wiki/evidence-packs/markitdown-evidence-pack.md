---
content: "markitdown"
kind: "evidence-pack"
title: "markitdown — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一个把各种文件（PDF、Office、图片、音视频等）转成 Markdown 的 Python 工具，主要供 LLM 文本分析流水线使用。"
    internal_logic: "### 整体架构\nMarkItDown 是一个无状态的文件转换工具，核心组件是 **MarkItDown 类**，通过内置转换器和可选插件将输入文件流向 Markdown 输出。没有复杂的 agent loop，而是按文件类型分发的线性管道。\n\n#### 核心转换循环\n- 输入可以是本地路径、文件对象、URL 或管道流。\n- 根据文件扩展名或 MIME 类型自动选择对应的转换器（如 `pdf`, `docx`, `xlsx` 等）。\n- 如果启用 LLM（通过 `llm_client` 和 `llm_model` 参数），对图像或 PPTX 中的图片生成描述文本。\n- 最终输出一个包含 **text_content** 或 **markdown** 属性的对象，或直接写入文件。\n\n#### 工具接口（插件系统）\n- 插件默认禁用，通过 `enable_plugins=True` 开启，采用 Python 入口点机制（`markitdown.plugins`）。\n- 第三方插件可以注册新的转换器，或覆盖内置转换器。\n- `markitdown-ocr` 插件演示了如何复用 LLM Vision 能力进行 OCR，遵循 `llm_client`/`llm_model` 统一接口。\n- 插件开发参考 `packages/markitdown-sample-plugin`。\n\n#### 状态/记忆\n- 完全无状态，每次 `convert()` 调用互不干扰。\n- 通过 `MarkItDown` 实例可配置全局参数（如 Azure 端点、LLM 客户端），但实例本身不保存转换历史。\n\n#### 规划器\n- 无显式规划；转换路径由文件类型和配置决定。\n- 当使用 Azure Content Understanding 时，根据文件模态自动路由到预构建分析器（如文档、视频、音频）。\n\n#### 沙箱与安全\n- **进程权限级别 I/O**：MarkItDown 以当前进程的权限打开文件和发送网络请求，如 `open()` 或 `requests.get()`。\n- 官方建议在不可信环境对输入进行净化，并调用最窄的转换函数（如 `convert_stream()` 或 `convert_local()`），避免读取未预期资源。\n- 使用 Azure 云服务时，需自行管理端点密钥和成本；可以限制 `cu_file_types` 控制传输格局。\n\n#### LLM 集成\n- **视觉理解**：提供 `llm_client` + `llm_model`，对图像和 PPTX 内嵌图片生成自然语言描述。\n- **自定义提示**：`llm_prompt` 参数可注入任务描述，例如要求提取特定信息。\n- **OCR 扩展**：`markitdown-ocr` 插件将同样模式用于 PDF/DOCX 内图片的文字提取。"
    failure_mode: "转换质量依赖底层格式解析库，复杂排版、表格、公式可能失真，README 未提供基准测试。"
    source_pointer: "https://github.com/microsoft/markitdown"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/false/MIT/v0.1.6"
experiments: []
claims:
  - "[[claims/markitdown-main-claim]]"
artifacts:
  - "[[artifacts/markitdown-repo]]"
metrics:
  - "stars=142402"
  - "forks=9719"
  - "open_issues=802"
  - "latest_release=v0.1.6"
  - "pushed_at=2026-05-26T22:41:34Z"
baselines: []
failure_modes:
  - "转换质量依赖底层格式解析库，复杂排版、表格、公式可能失真，README 未提供基准测试。"
  - "插件生态起步阶段，可用第三方插件有限，维护可能滞后。"
  - "开启插件或 LLM 功能增加外部依赖和成本（如 OpenAI API 费用），且 LLM 输出不稳定可能引入噪声。"
  - "安全模型依赖于调用者正确使用最小权限函数，开发者容易忽略输入净化。"
  - "对超大文件（如高清视频）的处理内存和耗时未知，未在文档说明。"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/microsoft/markitdown"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/markitdown-main-claim]],官方 artifact 落库为 [[artifacts/markitdown-repo]]。See [[content/markitdown]]。
