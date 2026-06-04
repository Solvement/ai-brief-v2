---
content: "funasr"
kind: "deep-dive"
shape: "agent-build"
project_type: "agent_framework"
title: "FunASR — 深度拆解"
reasoning_trace:
  paper_type_decision: "agent_framework：项目通过 MCP 服务器和 OpenAI 兼容 API 将语音处理封装为代理工具，且 README 明确提到与 Claude、Cursor、LangChain 等集成，证据充分。"
  central_contribution: "提供了一个工业级、高效率的端到端语音识别工具包，将 VAD、ASR、标点、说话人日志、情感识别统一到单一接口，速度比 Whisper 快一个数量级，支持 CPU 实时运行和多语言。"
  inspected:
    - "README.md (全部内容)"
    - "仓库目录树 (top_level_dirs)"
    - "topic 标签 (如 mcp-server, openai-compatible-api, vllm)"
    - "artifactAudit 汇总 (key files, tests, docs, examples)"
  top_claims:
    - "SenseVoice-Small GPU 170 倍实时速度 (README benchmark 表)"
    - "内置说话人分离和情感识别 (Why FunASR 表格与 Quick Start 示例)"
    - "支持 50+ 语言 (顶部标语及模型动物园多语言模型)"
    - "一行代码完成 VAD + ASR + 标点 + 说话人 (Quick Start 代码示例)"
    - "提供 MCP 服务器和 OpenAI 兼容 API 供代理使用 (README Deploy 部分)"
  evidence_needed:
    - "完整的基准测试报告以验证速度指标并了解测试硬件和音频性质"
    - "各语言的词错率 (WER) 对比数据以评估精度"
    - "MCP 服务器实现细节和代理交互示例"
    - "流式服务的延迟和吞吐量基准"
  main_threats:
    - "基准测试可能仅在特定优化条件下达到，未体现一般场景性能"
    - "远程代码执行风险 (trust_remote_code) 可能导致供应链攻击"
    - "多语言覆盖可能不均衡，部分语言实际效果差"
    - "情感识别和说话人分割的精度未提供独立评测"
  transfer_decision: "可复用其 AutoModel 封装模式、OpenAI API 适配器和 MCP 服务器设计，构建类似工具化服务；但内部流水线结构不适合直接作为自主代理循环。"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 5
  maturity: 5
  main_risk: "远程代码信任问题 (`trust_remote_code=True`) 和 LLM 模型安全性"
next_actions:
  - "clone-and-run"
  - "write-deepdive"
claim_ledger:
  - claim: "SenseVoice-Small 模型在 GPU 上达到 170 倍实时速度"
    plain_english: "处理 1 小时的音频，该模型仅需要 21 秒（60×60/170）"
    source: "README Benchmark 表格"
    evidence_strength: "high"
    supports: "表格中给出 GPU Speed 为 170x realtime，且注明对比 Whisper-large-v3 的 baseline 13x 快 13 倍"
    does_not_support: "未说明具体 GPU 型号、CPU 型号、音频采样率、批次大小等条件"
    threat: "测试环境可能非典型，实际应用场景速度可能低于宣称；未提供端到端延迟（包括模型加载）"
  - claim: "FunASR 内置说话人分离和情感识别"
    plain_english: "无需额外工具即可知道谁在说话以及说话时情绪"
    source: "Why FunASR 对比表及 Quick Start 输出示例"
    evidence_strength: "high"
    supports: "Quick Start 示例输出中包含 Speaker 0/1 标签；对比表中声称 Speaker ID 和 Emotion 均支持"
    does_not_support: "未提供说话人分离和情感识别的精度数据或独立评测"
    threat: "精度可能不如专业情感识别工具或 pyannote，存在漏判误判"
  - claim: "支持 50+ 语言"
    plain_english: "能转录超过 50 种语言的语音"
    source: "README 首页标题和模型动物园中列出的多语言模型"
    evidence_strength: "medium"
    supports: "有模型支持 31 语言 (Fun-ASR-Nano)、52 语言 (Qwen3-ASR)、17 语言 (GLM-ASR-Nano) 等；模型动物园显示支持中英日韩粤等"
    does_not_support: "未列出完整的 50+ 语言清单，也未提供每种语言的转录质量数据"
    threat: "部分语言可能只是编码器覆盖，解码精度很差，需实际测试"
  - claim: "一条命令启动 OpenAI 兼容 API 服务"
    plain_english: "运行 `funasr-server --device cuda` 即可在本地 8000 端口提供语音转录接口"
    source: "README Deploy 部分"
    evidence_strength: "high"
    supports: "提供了 curl 验证命令和示例；安装依赖清晰"
    does_not_support: "未说明默认加载哪些模型、如何切换模型、以及生产环境调优"
    threat: "默认配置可能不适合高并发或特定音频格式，需要进一步定制"
artifact_audit:
  official_repo: "https://github.com/modelscope/FunASR"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## 大白话定位

**FunASR 是一个端到端的工业级语音识别工具包，通过一行代码提供说话人分离、情感识别、流式转录和多语言支持，速度比 Whisper 快 170 倍。**

> 一句话:Whisper 替代品的标杆：更快、更全能、一键自托管。

## 为什么火

- **性能碾压:** SenseVoice-Small 模型 GPU 上 170 倍实时速度，CPU 上 17 倍，大幅超越 Whisper 和其它云服务。
- **全能集成:** 内置语音活动检测 (VAD)、说话人日志、情感识别、标点恢复，无需额外工具，一行调用全部自动处理。
- **代理生态就绪:** 通过 MCP 服务器和 OpenAI 兼容 API，可直接对接 Claude、Cursor、LangChain、Dify 等 AI 代理框架。
- **LLM 驱动的进展:** Fun-ASR-Nano 等模型结合 SenseVoice 编码器和 Qwen 解码器，提供更高精度和 vLLM 加速，紧跟大模型浪潮。
- **部署即服务:** 一条命令启动 OpenAI 兼容 API，提供 Docker、Kubernetes 模板和安全指南，降低生产环境门槛。

## Artifact audit

| 项 | 状态 | 证据 |
| --- | --- | --- |
| README.md | available | 根目录 README.md 包含完整快速入门、模型动物园、基准测试、部署指南。 |
| LICENSE | available | 根目录 LICENSE 文件，MIT 许可证。 |
| setup.py / pyproject.toml | available | 根目录存在 setup.py 和 pyproject.toml，支持 pip 安装。 |
| tests/ | available | tests 目录存在，指示有测试代码。 |
| docs/ | available | docs 目录包含模型选择、迁移指南、部署矩阵等；并提供在线文档。 |
| examples/ | available | examples 目录包含 Colab、MCP 服务器、OpenAI API、工业数据预训练等多个示例。 |
| funasr/ | available | 主 Python 包目录，包含 auto 模块、模型加载、推理等核心代码。 |
| model_zoo/ | available | 包含模型配置或下载信息。 |
| runtime/ | available | 包含运行环境和部署相关文档。 |

一句话:**artifact 证据偏薄,缺失项不能脑补**

## 技术拆解(agent framework / agent 怎么跑起来)

### 整体架构：流水线即代理工具
FunASR 本身并非自循环代理，而是一个模块化语音处理工具箱，**通过 MCP 服务器和 OpenAI 兼容 API 变成外部代理可调用的工具**。内部采用**固定流水线**：语音活动检测 (VAD) → 语音识别 (ASR) → 标点恢复 → 说话人日志 → 情感识别，每个步骤由专门的模型完成。

### Agent Loop：外部代理驱动，无内部自主循环
FunASR 不实现自己的 agent loop。它**响应外部请求**，处理音频并返回结构化结果。对于流式场景，通过 WebSocket 持续接收音频块并实时输出，但决策逻辑仍由外部控制。

### Tool Interface：双重接口让代理无缝接入
- **OpenAI 兼容 API**：将语音识别包装为标准的 `/v1/audio/transcriptions` 端点，**任何支持 OpenAI 的工具都可直接调用**，适用于 LangChain、AutoGen 等框架。
- **MCP 服务器**：提供专门的 MCP 协议服务器，使 Claude、Cursor 等代理能**发现并使用“语音转录”工具**，无需复杂集成。

### State/Memory：轻量级流式缓存
流式识别时，通过 `cache` 字典传递**分块状态**，例如 `model.generate(input="chunk.wav", cache={}, chunk_size=[0, 10, 5])`。动态 VAD 自适应调整静音阈值，**在句子边界和长段分割之间平衡**。

### Planner：自动模型选择与管线组合
`AutoModel` 类扮演**简易规划器**：根据指定模型名（如 `"paraformer-zh"`）和可选 VAD、标点、说话人模型参数，**动态构建处理管道**。无需用户手动编排各步骤。

### Sandbox & 安全边界：本地模型运行，远程代码信任风险
所有模型在本地 Python 环境中运行，**推理本身无沙箱隔离**，依赖 PyTorch 和用户系统安全。启用 `trust_remote_code=True` 可加载 HuggingFace 上的模型代码，**这存在远程代码执行风险**，需要用户信任模型来源。API 模式下，项目提供了安全指南，需自行配置鉴权和速率限制。

### 关键模块
- **VAD (语音活动检测)**：fsmn-vad，仅 0.4M 参数，将长音频切分为语音片段。
- **ASR 模型**：SenseVoice (234M, 带情感和声音事件)、Paraformer (220M, 非自回归，速度快)、Fun-ASR-Nano (800M, LLM 驱动)、Qwen3-ASR (1.7B, 52 语言)、GLM-ASR-Nano (1.5B)。
- **标点恢复**：ct-punc (290M)，为识别文本加入标点。
- **说话人日志**：cam++ (7.2M)，通过说话人嵌入区分。
- **情感识别**：emotion2vec+large (300M)，识别高兴、悲伤、生气等情感。
- **vLLM 加速**：为 LLM 类 ASR 模型提供 2-3 倍解码加速，支持 WebSocket 流式服务。

## 对我的价值

| 维度 | 具体 |
| --- | --- |
| 能学什么 | 1) 如何将多个独立语音任务（VAD, ASR, 标点, 说话人, 情感）组合为一个易用管线；2) 非自回归模型（Paraformer）如何实现高速推理；3) 如何将语音能力封装为 OpenAI 兼容 API 和 MCP 服务器，使其可被 AI 代理调用；4) 如何利用 vLLM 加速 LLM 推理。 |
| 迁移到 AI-Brief | 可将 FunASR 的语音转录能力集成到 AI-Brief 中，为用户生成音频摘要、提取关键信息，或分析会议情感动向。 |
| 迁移到 BriefMem | 可作为 BriefMem 的语音输入通道，将音频记录转写并存储为结构化笔记，并附加说话人标签和情感标签。 |
| 简历故事 | 使用 FunASR 搭建了多语言会议转写服务，集成说话人分离和情感分析，对比原生 Whisper 性能提升 10 倍以上；并将转写能力封装为 OpenAI 兼容 API，接入公司内部会议助手，日处理音频 500 小时。 |

## 风险

- 模型精度在特定领域（如嘈杂环境、小众方言）可能下降，需根据场景评估。
- 多语言支持不均衡：50+ 语言中的低资源语言性能未经验证，可能不如主流语言。
- Fun-ASR-Nano 等 LLM 模型使用 `trust_remote_code=True` 加载，存在远程代码执行风险，须审计模型文件。
- OpenAI 兼容 API 默认无鉴权和速率限制，暴露于公网时需自行添加安全层。
- 高性能依赖 GPU，CPU 上仅小模型可实时，大模型延迟较高。

## Memory card

```text
problem_pattern:        实现语音识别需要集成多个独立工具（VAD、ASR、标点、说话人分离、情感分析），导致代码复杂、性能低下。FunASR 将这一切统一为单次调用，大幅降低集成成本。
architecture_pattern:   模块化流水线 + AutoModel 工厂，通过模型名称动态组装处理链，对外提供统一接口，对内可灵活替换各个组件。
reusable_pattern:       1) AutoModel 模式：根据配置自动加载模型并构建管线；2) 流式处理的 cache 状态传递；3) MCP 服务器模式使任意工具能被 AI 代理发现和调用。
risk_pattern:           远程代码信任 (trust_remote_code)：在使用社区模型时，若未审查代码，可能引入恶意操作。
similar_projects:       OpenAI Whisper (仅 ASR，无说话人日志/情感)，Wav2Vec2 (仅特征提取)，DeepSpeech (停维)，阿里云智能语音交互 (云服务)。FunASR 在功能完整度和速度上均具优势。
```

可复用范式落库:[[concepts/automodel-pipeline]]、[[concepts/non-autoregressive-asr]]。另见 [[content/funasr]]、[[claims/funasr-main-claim]]。
