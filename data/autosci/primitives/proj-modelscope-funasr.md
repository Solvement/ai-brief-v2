<!-- AI-ONLY AutoSci primitive. Generated from a deep-analyzed GitHub project; not for the public project card. -->
# AutoSci reuse - modelscope/FunASR

## Core Pattern
AutoModel 组件组装器: 复制“主模型 + vad_model + punc_model + spk_model + kwargs”的组合方式，让应用代码只拿到一个 `generate()`。 模型 alias 层: 像 `examples/openai_api/server.py` 一样把 `sensevoice`、`paraformer`、`paraformer-en`、`fun-asr-nano` 映射到真实模型配置。 OpenAI 兼容转写端点: 保留 `/v1/audio/transcriptions`、`/v1/models`、`/health`，让 OpenAI SDK、Dify、n8n、LangChain 走同一接入路径。 MCP 本地工具包装: 把语音文件路径包装成 MCP `transcribe_audio`，返回文本和 segments，适合作为桌面 Agent 的本地能力。 迁移评测脚本: 复用 `examples/migration/benchmark_funasr.py` 的输入目录扫描、音频时长、elapsed_seconds、realtime_factor、results.jsonl、summary.md。 部署选型表: 把 Colab、Python API、OpenAI API、Docker Compose、Kubernetes、Runtime WebSocket、vLLM、MCP、Triton 分成不同路径。

## Mapping
- problem_class: reliable-agent-runtime-and-tool-orchestration
- components: agent_orchestrator, tool_protocol_adapter, developer_control_surface, model_or_retrieval_layer, validation_harness, automodel, alias, openai
- autosci_modules: pattern_library, experiment_runner, agent_runtime, tool_governance, trace_memory

## Small Experiment
Compare baseline free-form execution against the extracted agent-infra pattern from modelscope/FunASR on three AutoSci tasks. Measure completion rate, trace inspectability, failure recovery, and cost over 1-3 days.

## Design Principles
- agent-infra-boundary-as-module: AutoModel 组件组装器: 复制“主模型 + vad_model + punc_model + spk_model + kwargs”的组合方式，让应用代码只拿到一个 `generate()`。 模型 alias 层: 像 `examples/openai_api/server.py` 一样把 `sensevoice`、`paraformer`、`paraformer-en`、`fun-asr-nano` 映射到真实模型配置。 OpenAI 兼容转写端点: 保留 `/v1/audio/transcriptions`、`/v1/models`、`/health`，让 OpenAI SDK、Dify、n8n、LangChain 走同一接入路径。 MCP 本地工具包装: 把语音文件路径包装成 MCP `transcribe_audio`，返回文本和 segments，适合作为桌面 Agent 的本地能力。 迁移评测脚本: 复用 `examples/migration/benchmark_funasr.py` 的输入目录扫描、音频时长、elapsed_seconds、realtime_factor、results.jsonl、summary.md。 部署选型表: 把 Colab、Python API、OpenAI API、Docker Compose、Kubernetes、Runtime WebSocket、vLLM、MCP、Triton 分成不同路径。
- agent-infra-observable-flow: 人话流程：上传一段 `meeting.wav`，FunASR 先把音频里真正有人说话的段落找出来，再把每段送进识别模型，最后把文字、时间、说话人信息拼回一个结果。技术流程可以从两个真实入口看。 入口一，Python API：README 的例子是 `AutoModel(model="iic/SenseVoiceSmall", vad_model="fsmn-vad", spk_model="cam++", device="cuda")` 后调用 `model.generate(input="meeting.wav")`。（来源：README Quick Start）源码里 `AutoModel.generate` 会先判断有没有 `vad_model`：没有就走 `inference()`，有就走 `inference_with_vad()`；`inference_with_vad` 先调用 `self.vad_model` 得到 `vadsegments`，再按片段长度排序批处理，用 `slice_padding_audio_samples` 取音频片段，调用主 ASR 模型，必要时调用 `punc_model`，有 `spk_model` 时提取 `spk_embedding`、聚类并把结果写到 `sentence_info`。（来源：funasr/auto/auto_model.py generate/inference_with_vad） 入口二，OpenAI 兼容服务：`funasr-server --model sensevoice --device cuda` 最终调用 `funasr.bin._server_app.create_app`。如果 `preload_model == "auto"`，GPU 默认选 `fun-asr-nano`，CPU 默认选 `sensevoice`；`/v1/audio/transcriptions` 接收 `file`、`model`、`language`、`response_format`、`spk`。当 `model == "fun-asr-nano"` 且 vLLM 可用时，代码用 `soundfile.read` 读 bytes，必要时 `librosa.resample` 到 16000Hz，调用 VAD 得到毫秒级 segments，再对每段 `engine.generate(inputs=seg_audios, max_new_tokens=500, repetition_penalty=1.3)`，最后返回 `text` 和 `segments`；如果不是 vLLM 路径，则写临时文件，调用 `_process_fallback`，也就是 `AutoModel.generate`。（来源：funasr/bin/server.py；funasr/bin/_server_app.py create_app/_process_vllm/_process_fallback） 术语定义：RTFx 是“音频时长 / 推理耗时”的倍数；`response_format=verbose_json` 是返回分段细节；`spk` 是 speaker 参数；`hotwords` 是热词，用来把“张三、北京”这类词传给模型或 vLLM 解码。（来源：docs/vllm_guide_zh_v2.md 离线 SDK 推理/API 参考；examples/openai_api/README_zh.md 使用 OpenAI SDK）
- agent-infra-risk-first-transfer: Transfer the architecture together with its main failure boundary: PyTorch/CUDA/vLLM: vLLM 或 CUDA 版本不匹配会导致 Fun-ASR-Nano 加速路径失败，服务代码会 fallback 到 AutoModel，但吞吐和延迟会变。.

## Risks
- PyTorch/CUDA/vLLM: vLLM 或 CUDA 版本不匹配会导致 Fun-ASR-Nano 加速路径失败，服务代码会 fallback 到 AutoModel，但吞吐和延迟会变。
- ModelScope/HuggingFace 模型仓库: 模型下载失败、模型 revision 变化或远端代码要求变化会影响首次启动和复现。
- 示例 OpenAI API 安全边界: 直接暴露示例服务会接受任意 SDK api_key 占位符，音频上传可带来隐私和资源风险。
- FastAPI/uvicorn/python-multipart/soundfile/librosa/ffmpeg: multipart 上传、音频解码、重采样或容器系统库缺失会导致服务不能处理文件。
- MODEL_LICENSE: 只按 MIT 使用模型权重会漏掉模型许可证要求。
- Kubernetes/GPU 调度和模型缓存: 默认 K8s 模板是 CPU、ClusterIP、1 副本；直接扩展到 GPU 服务需要镜像和调度补齐。
- over_transfer
