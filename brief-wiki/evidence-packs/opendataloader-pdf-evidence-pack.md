---
content: "opendataloader-pdf"
kind: "evidence-pack"
title: "opendataloader-pdf — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "一款能解析任意 PDF 并输出带坐标的 Markdown/JSON 的开源工具，同时可自动生成无障碍 Tagged PDF。"
    internal_logic: "### 整体架构\n\nOpenDataLoader PDF 采用**核心 Java 引擎 + 多语言 SDK** 的设计。Java 引擎负责版式分析、阅读顺序确定（XY-Cut++ 算法）、元素边界框计算以及 PDF 标签化；Python、Node.js 和 Java SDK 通过进程调用封装 Java 引擎，提供统一的 `convert()` 接口。\n\n### 双模式处理流水线\n\n#### 1. 本地确定性模式（Fast mode）\n- **流程**：输入 PDF → Java 引擎解析 → 版面分割 → 应用 XY-Cut++ 阅读顺序 → 生成带边界框的结构化输出（Markdown/JSON/HTML）。\n- **特点**：纯确定性，速度快（README 声称 0.015s/page），无外部依赖，适合标准数字 PDF。\n- **输出示例**（JSON 片段，来源 README）：\n```json\n{\n  \"type\": \"formula\",\n  \"page number\": 1,\n  \"bounding box\": [226.2, 144.7, 377.1, 168.7],\n  \"content\": \"\\\\frac{f(x+h) - f(x)}{h}\"\n}\n```\n\n#### 2. 混合模式（Hybrid mode）\n- **流程**：本地 Java 引擎对简单页面直接输出（约 0.02s），对复杂页面（由决策模块判断）路由到 AI 后端服务 `opendataloader-pdf-hybrid`。\n- **AI 后端** 可启用 OCR、公式提取、图表描述等能力，最终输出融合结果。\n- **决策模块**（planner）**：README 未说明具体的路由规则，但提到“复杂页面路由到 AI 后端”，推测基于页面内表格、扫描特征等指标。\n- **接口**：AI 后端通过 `--enrich-formula`、`--enrich-picture-description` 等 flag 启用富化，客户端通过 `--hybrid docling-fast` 选择后端模型（如 docling-fast）。\n\n### Agent 工具特性\nOpenDataLoader PDF 可被其他 Agent 作为工具调用，提供以下能力：\n- **LangChain 集成**：README 明确提及 LangChain integration available。\n- **AI 安全过滤器**：内置 prompt injection 过滤（来源 README Capability Matrix）。\n- **状态/记忆**：项目本身无显式的对话记忆，但输出的结构化 JSON 可作为 Agent 工作记忆的持久化载体。\n- **工具接口**：通过 SDK 或 CLI 调用，输入 PDF 路径，输出结构化数据，符合 Agent tool 标准形态。\n\n### 无障碍自动化管线\n- **输入**：无标签的 PDF。\n- **处理**：Java 引擎进行布局分析，识别标题、段落、表格、图像等，并依据 Well-Tagged PDF 规范生成语义标签。\n- **输出**：Tagged PDF，可直接供屏幕阅读器使用。\n- **验证**：与 Dual Lab 合作，使用 veraPDF 进行自动化验证。\n\n### 安全边界\n- **AI 安全**：README 声称具备 prompt injection 过滤，但具体实现（规则/模型）未披露。\n- **进程隔离**：每个 `convert()` 调用会启动一个独立的 JVM 进程（来源 README 批处理注释），提供一定隔离性。"
    failure_mode: "Java 依赖：必须预装 JDK 11+，增加了部署复杂度，在无 root 权限或受限环境可能成为障碍。"
    source_pointer: "https://github.com/opendataloader-project/opendataloader-pdf"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/true/Apache-2.0/v2.4.7"
experiments: []
claims:
  - "[[claims/opendataloader-pdf-main-claim]]"
artifacts:
  - "[[artifacts/opendataloader-pdf-repo]]"
metrics:
  - "stars=23366"
  - "forks=2186"
  - "open_issues=57"
  - "latest_release=v2.4.7"
  - "pushed_at=2026-06-03T16:14:48Z"
baselines: []
failure_modes:
  - "Java 依赖：必须预装 JDK 11+，增加了部署复杂度，在无 root 权限或受限环境可能成为障碍。"
  - "AI 后端集成不稳定风险：Hybrid 模式依赖外部 AI 推理服务（需自行启动 `opendataloader-pdf-hybrid`），若服务不可用或性能不足，原本路由到 AI 的复杂页面将退化，影响最终质量。"
  - "企业功能锁定风险：PDF/UA 合规导出、无障碍编辑器等核心无障碍能力属于企业附加组件，可能导致开源版本在法规强约束下稍显不足。"
missing_details: []
source_pointers:
  - "https://github.com/opendataloader-project/opendataloader-pdf"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/opendataloader-pdf-main-claim]],官方 artifact 落库为 [[artifacts/opendataloader-pdf-repo]]。See [[content/opendataloader-pdf]]。
