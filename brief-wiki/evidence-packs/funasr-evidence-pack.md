---
content: "funasr"
kind: "evidence-pack"
title: "FunASR — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "FunASR 是一个端到端的工业级语音识别工具包，通过一行代码提供说话人分离、情感识别、流式转录和多语言支持，速度比 Whisper 快 170 倍。"
    internal_logic: "### 整体架构：流水线即代理工具\nFunASR 本身并非自循环代理，而是一个模块化语音处理工具箱，**通过 MCP 服务器和 OpenAI 兼容 API 变成外部代理可调用的工具**。内部采用**固定流水线**：语音活动检测 (VAD) → 语音识别 (ASR) → 标点恢复 → 说话人日志 → 情感识别，每个步骤由专门的模型完成。\n\n### Agent Loop：外部代理驱动，无内部自主循环\nFunASR 不实现自己的 agent loop。它**响应外部请求**，处理音频并返回结构化结果。对于流式场景，通过 WebSocket 持续接收音频块并实时输出，但决策逻辑仍由外部控制。\n\n### Tool Interface：双重接口让代理无缝接入\n- **OpenAI 兼容 API**：将语音识别包装为标准的 `/v1/audio/transcriptions` 端点，**任何支持 OpenAI 的工具都可直接调用**，适用于 LangChain、AutoGen 等框架。\n- **MCP 服务器**：提供专门的 MCP 协议服务器，使 Claude、Cursor 等代理能**发现并使用“语音转录”工具**，无需复杂集成。\n\n### State/Memory：轻量级流式缓存\n流式识别时，通过 `cache` 字典传递**分块状态**，例如 `model.generate(input=\"chunk.wav\", cache={}, chunk_size=[0, 10, 5])`。动态 VAD 自适应调整静音阈值，**在句子边界和长段分割之间平衡**。\n\n### Planner：自动模型选择与管线组合\n`AutoModel` 类扮演**简易规划器**：根据指定模型名（如 `\"paraformer-zh\"`）和可选 VAD、标点、说话人模型参数，**动态构建处理管道**。无需用户手动编排各步骤。\n\n### Sandbox & 安全边界：本地模型运行，远程代码信任风险\n所有模型在本地 Python 环境中运行，**推理本身无沙箱隔离**，依赖 PyTorch 和用户系统安全。启用 `trust_remote_code=True` 可加载 HuggingFace 上的模型代码，**这存在远程代码执行风险**，需要用户信任模型来源。API 模式下，项目提供了安全指南，需自行配置鉴权和速率限制。\n\n### 关键模块\n- **VAD (语音活动检测)**：fsmn-vad，仅 0.4M 参数，将长音频切分为语音片段。\n- **ASR 模型**：SenseVoice (234M, 带情感和声音事件)、Paraformer (220M, 非自回归，速度快)、Fun-ASR-Nano (800M, LLM 驱动)、Qwen3-ASR (1.7B, 52 语言)、GLM-ASR-Nano (1.5B)。\n- **标点恢复**：ct-punc (290M)，为识别文本加入标点。\n- **说话人日志**：cam++ (7.2M)，通过说话人嵌入区分。\n- **情感识别**：emotion2vec+large (300M)，识别高兴、悲伤、生气等情感。\n- **vLLM 加速**：为 LLM 类 ASR 模型提供 2-3 倍解码加速，支持 WebSocket 流式服务。"
    failure_mode: "模型精度在特定领域（如嘈杂环境、小众方言）可能下降，需根据场景评估。"
    source_pointer: "https://github.com/modelscope/funasr"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/MIT/v1.3.9"
experiments: []
claims:
  - "[[claims/funasr-main-claim]]"
artifacts:
  - "[[artifacts/funasr-repo]]"
metrics:
  - "stars=17029"
  - "forks=1735"
  - "open_issues=19"
  - "latest_release=v1.3.9"
  - "pushed_at=2026-05-30T16:19:19Z"
baselines: []
failure_modes:
  - "模型精度在特定领域（如嘈杂环境、小众方言）可能下降，需根据场景评估。"
  - "多语言支持不均衡：50+ 语言中的低资源语言性能未经验证，可能不如主流语言。"
  - "Fun-ASR-Nano 等 LLM 模型使用 `trust_remote_code=True` 加载，存在远程代码执行风险，须审计模型文件。"
  - "OpenAI 兼容 API 默认无鉴权和速率限制，暴露于公网时需自行添加安全层。"
  - "高性能依赖 GPU，CPU 上仅小模型可实时，大模型延迟较高。"
missing_details: []
source_pointers:
  - "https://github.com/modelscope/funasr"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/funasr-main-claim]],官方 artifact 落库为 [[artifacts/funasr-repo]]。See [[content/funasr]]。
