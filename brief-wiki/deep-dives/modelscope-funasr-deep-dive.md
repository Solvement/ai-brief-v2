---
content: "modelscope-funasr"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "model_infra"
title: "FunASR — 深度拆解"
tier_template:
  tier: 3
  bucket: "数据不足"
  tag: "[Tier 3｜数据不足]"
  one_sentence_positioning: "modelscope/FunASR: deep radar candidate with agent/tooling evidence"
  what_it_does: "Industrial-grade speech recognition toolkit: 170x realtime, 50+ languages, speaker diarization, emotion detection, streaming, and OpenAI-compatible API."
  metadata:
    language: "Python"
    total_stars: "17029"
    stars_in_period: "544"
    author: "modelscope"
  labels:
    - "agents"
    - "mcp"
    - "models"
    - "cli"
    - "docs"
  pain_point: "值得看的是它把“模型调用”和“应用接入”同时做了。README 的最短路径是 `pip install funasr`，然后 `AutoModel(model=\"iic/SenseVoiceSmall\", vad_model=\"fsmn-vad\", spk_model=\"cam++\", device=\"cuda\")`，再 `model.generate(input=\"meeting.wav\")`；服务路径则是 `funasr-server --model sensevoice --device cuda` 暴露 `POST /v1/audio/transcriptions`。（来源：README Quick Start/部署）"
  core_capabilities:
    - "AutoModel 组件组装器"
    - "模型 alias 层"
    - "OpenAI 兼容转写端点"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向判断：FunASR 更像“私有 ASR 工程套件”，不是纯模型论文仓库。 对 OpenAI Whisper：README 自称 FunASR 的 SenseVoice-Small 在 benchmark 中 GPU `170 倍实时`，Whisper-large-v3 为 GPU `13 倍实时`；迁移指南把 Whisper 文件转写映射到 FunASR 的 README 快速开始和模型选择，把 `Whisper + pyannote` 映射到 `VAD、标点和 spk_model=\"cam++\"`。选 FunASR：需要私有部署、长音频吞吐、内置 VAD/标点/说话人、OpenAI 兼容服务。选 Whisper：已有 Whisper 质量基线、只做少量英文/多语种离线转写、团队不想引入 ModelScope/HuggingFace 多模型组合。速度差异为项目自称，未复跑。（来源：README 性能评测；docs/migration_from_whisper_zh.md 功能映射） 对 OpenAI Audio API/托管云 ASR：迁移指南明确把“OpenAI 音频 API 或云端批量 ASR”映射到 FunASR 的 OpenAI 兼容 API，并要求验证 `/v1/audio/transcriptions`、响应格式、客户端兼容性和上传限制。选 FunASR：音频不能出私有环境、需要本地成本控制、需要接 Dify/LangChain/AutoGen/内部 HTTP。选托管 API：需要厂商 SLA、弹性容量、少运维，或自有评测显示 FunASR 目标语言/领域还不够好。（来源：docs/migration_from_whisper_zh.md 什么时候值得评估/功能映射） 对 Whisper + pyannote + silero-vad + 标点等拼装栈：FunASR 的差异是把 `vad_model=\"fsmn-vad\"`、`punc_model=\"ct-punc\"`、`spk_model=\"cam++\"` 放进同一个 AutoModel 调用和同一个服务 alias；拼装栈的优势是每个环节可替换、社区资料多。选 FunASR：先要一条可跑通的端到端路径。选拼装栈：对每个环节已有成熟模型选择和评测，且愿意维护多个依赖边界。（来源：README 使用示例；funasr/auto/auto_model.py inference_with_vad；docs/migration_from_whisper_zh.md 功能映射）"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话流程：上传一段 `meeting.wav`，FunASR 先把音频里真正有人说话的段落找出来，再把每段送进识别模型，最后把文字、时间、说话人信息拼回一个结果。技术流程可以从两个真实入口看。 入口一，Python API：README 的例子是 `AutoModel(model=\"iic/SenseVoiceSmall\", vad_model=\"fsmn-vad\", spk_model=\"cam++\", device=\"cuda\")` 后调用 `model.generate(input=\"meeting.wav\")`。（来源：README Quick Start）源码里 `AutoModel.generate` 会先判断有没有 `vad_model`：没有就走 `inference()`，有就走 `inference_with_vad()`；`inference_with_vad` 先调用 `self.vad_model` 得到 `vadsegments`，再按片段长度排序批处理，用 `slice_padding_audio_samples` 取音频片段，调用主 ASR 模型，必要时调用 `punc_model`，有 `spk_model` 时提取 `spk_embedding`、聚类并把结果写到 `sentence_info`。（来源：funasr/auto/auto_model.py generate/inference_with_vad） 入口二，OpenAI 兼容服务：`funasr-server --model sensevoice --device cuda` 最终调用 `funasr.bin._server_app.create_app`。如果 `preload_model == \"auto\"`，GPU 默认选 `fun-asr-nano`，CPU 默认选 `sensevoice`；`/v1/audio/transcriptions` 接收 `file`、`model`、`language`、`response_format`、`spk`。当 `model == \"fun-asr-nano\"` 且 vLLM 可用时，代码用 `soundfile.read` 读 bytes，必要时 `librosa.resample` 到 16000Hz，调用 VAD 得到毫秒级 segments，再对每段 `engine.generate(inputs=seg_audios, max_new_tokens=500, repetition_penalty=1.3)`，最后返回 `text` 和 `segments`；如果不是 vLLM 路径，则写临时文件，调用 `_process_fallback`，也就是 `AutoModel.generate`。（来源：funasr/bin/server.py；funasr/bin/_server_app.py create_app/_process_vllm/_process_fallback） 术语定义：RTFx 是“音频时长 / 推理耗时”的倍数；`response_format=verbose_json` 是返回分段细节；`spk` 是 speaker 参数；`hotwords` 是热词，用来把“张三、北京”这类词传给模型或 vLLM 解码。（来源：docs/vllm_guide_zh_v2.md 离线 SDK 推理/API 参考；examples/openai_api/README_zh.md 使用 OpenAI SDK）"
  essential_design_difference: "最值得复用的不是某个模型名，而是几层边界：模型别名、AutoModel 组装、兼容 API、Agent 工具、迁移 benchmark。 - AutoModel 组件组装器；复制“主模型 + vad_model + punc_model + spk_model + kwargs”的组合方式，让应用代码只拿到一个 `generate()`。；如果团队只需要单一固定模型且无长音频、标点、说话人需求，直接调用底层模型更简单。；`AutoModel.build_model` 已处理 hub 下载、config、registry、frontend/tokenizer/model、权重加载，能降低多模型切换成本。（来源：funasr/auto/auto_model.py build_model） - 模型 alias 层；像 `examples/openai_api/server.py` 一样把 `sensevoice`、`paraformer`、`paraformer-en`、`fun-asr-nano` 映射到真实模型配置。；如果用户必须直接选择完整 HuggingFace/ModelScope ID，alias 会隐藏必要细节。；alias 让客户端不依赖底层仓库 ID；`MODEL_CONFIGS` 里每个 alias 明确写 `model`、`vad_model`、`punc_model`、`hub`、`trust_remote_code`。（来源：examples/openai_api/server.py MODEL_CONFIGS） - OpenAI 兼容转写端点；保留 `/v1/audio/transcriptions`、`/v1/models`、`/health`，让 OpenAI SDK、Dify、n8n、LangChain 走同一接入路径。；如果产品需要完整权限、计费、审计、多租户，不要直接把示例服务当生产网关。；示例 API 可快速替换云端转写入口；安全文档明确说示例服务本身不内置鉴权，应在反向代理/API 网关补控制。（来源：examples/openai_api/README_zh.md API 端点；examples/openai_api/SECURITY_zh.md 对团队开放前的最低控制项） - MCP 本地工具包装；把语音文件路径包装成 MCP `transcribe_audio`，返回文本和 segments，适合作为桌面 Agent 的本地能力。；如果输入来自浏览器上传或移动端流，不适合只收本地路径的 MCP 示例。；`funasr_mcp.py` 展示了最小 MCP stdio 实现：`initialize`、`tools/list`、`tools/call`、Content-Length framing。（来源：examples/mcp_server/funasr_mcp.py） - 迁移评测脚本；复用 `examples/migration/benchmark_funasr.py` 的输入目录扫描、音频时长、elapsed_seconds、realtime_factor、results.jsonl、summary.md。；不要用它单独证明准确率；README 明确要求旧方案也在同一批音频上跑，再用人工审阅或 WER/CER 对比。；它把迁移讨论从“一个 demo 好不好”变成可重复记录字段：模型、设备、语言、耗时、RTF、错误。（来源：examples/migration/README.md；examples/migration/benchmark_funasr.py） - 部署选型表；把 Colab、Python API、OpenAI API、Docker Compose、Kubernetes、Runtime WebSocket、vLLM、MCP、Triton 分成不同路径。；不要让所有场景都从最重的 Kubernetes/vLLM 开始。；docs 明确建议“先选择能满足目标的最小方案”，只有吞吐、延迟或集成方式有明确要求时再切重运行时。（来源：docs/deployment_matrix_zh.md 快速决策表）"
  practitioner_meaning: "结论：对做 AI 应用的工程团队，这是值得 clone-and-run 的项目，尤其是会议转写、Agent 语音输入、内部语音 API、批量归档、字幕和从 Whisper/云端 ASR 迁移的场景。先不要信性能表，按 `docs/model_selection_zh.md` 建议从 SenseVoice-Small 和 `examples/migration/benchmark_funasr.py` 开始，用 20-50 条代表性音频记录质量、速度、失败率和成本。技术词定义：clone-and-run 是下载源码并跑 smoke test；成熟度 4 是因为代码、docs、tests、服务模板齐全，但本次未复跑 benchmark，且生产鉴权/GPU 镜像/模型 revision 锁定需要使用方补齐。（来源：docs/model_selection_zh.md 上线前先 benchmark；examples/migration/README.md Quick start；examples/openai_api/SECURITY_zh.md 上线检查清单）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "FunASR 是一个把离线/流式语音识别、VAD、标点、说话人分离、OpenAI 兼容 API、MCP 工具和 vLLM 加速放在同一套 Python/部署栈里的 ASR 工具箱。"
    body_md: "人话：它不是只给一个模型下载链接，而是给工程团队一条从 `AutoModel(...).generate(input=\"meeting.wav\")` 到 `funasr-server --model sensevoice --device cuda`、再到 Docker/Kubernetes/MCP 的完整私有转写路径。技术定义：ASR 是语音转文字；VAD 是先找出音频里有说话的片段；speaker diarization 是给片段打说话人标签；OpenAI 兼容 API 是把本地服务做成 `/v1/audio/transcriptions` 这种客户端容易接入的接口。（来源：README Quick Start；examples/openai_api/README_zh.md 快速开始/API 端点；examples/mcp_server/README.md Tools）"
  why_worth_attention:
    summary: ""
    body_md: "值得看的是它把“模型调用”和“应用接入”同时做了。README 的最短路径是 `pip install funasr`，然后 `AutoModel(model=\"iic/SenseVoiceSmall\", vad_model=\"fsmn-vad\", spk_model=\"cam++\", device=\"cuda\")`，再 `model.generate(input=\"meeting.wav\")`；服务路径则是 `funasr-server --model sensevoice --device cuda` 暴露 `POST /v1/audio/transcriptions`。（来源：README Quick Start/部署）"
    bullets:
      - "自称性能强：README 的 benchmark 写明测试“184 条长音频（共 192 分钟）”，SenseVoice-Small 为 GPU `170 倍实时`、CPU `17 倍实时`，Paraformer-Large 为 GPU `120 倍实时`、CPU `15 倍实时`；这类数字未在本次环境复跑，应按项目自称处理。（来源：README 性能评测）"
      - "已核实工程入口多：`setup.py` 注册了 `funasr`、`funasr-server`、`funasr-train`、`funasr-export`、`scp2jsonl`、`jsonl2scp` 等 console scripts。（来源：setup.py entry_points）"
      - "已核实服务代码存在：`funasr/bin/_server_app.py` 创建 FastAPI app，包含 `/v1/audio/transcriptions`、`/asr`、`/v1/models`、`/health`；`examples/openai_api/server.py` 也提供同类示例服务。（来源：funasr/bin/_server_app.py create_app；examples/openai_api/server.py）"
      - "已核实 Agent 接入不是 README 空话：`examples/mcp_server/funasr_mcp.py` 实现 MCP stdio JSON-RPC，暴露 `transcribe_audio` 工具，输入 `audio_path` 和可选 `language`。（来源：examples/mcp_server/funasr_mcp.py tools/list）"
  key_claims_evidence:
    summary: ""
    body_md: "下面把营销性说法和文件可验证事实分开。README/badge/benchmark/“supports N” 一律按自称；从源码、配置、脚本、目录直接读到的机制按已核实。"
    items:
      - claim: "“比 Whisper 快 170 倍、支持 50+ 语言”。"
        plain_english: "项目首页把 FunASR 定位成高吞吐、多语言的私有语音识别工具。"
        source: "README 顶部标语；README Why FunASR 表格"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 明确写 `170x faster than Whisper`、`50+ languages`，中文 README 写“比 Whisper 快 170 倍。支持 50+ 语言”。"
        does_not_support: "本次没有运行 benchmark，也没有核验 50+ 语言清单覆盖质量。"
        threat: "速度数字依赖硬件、模型、batch、warmup、音频分布；语言数量不等于每种语言质量一致。"
      - claim: "README benchmark 给出 SenseVoice-Small、Paraformer-Large、Whisper-large-v3-turbo、Fun-ASR-Nano、Whisper-large-v3 的速度表。"
        plain_english: "它提供了公开对比口径，但仍是项目方报告。"
        source: "README 性能评测"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "表格写：测试集为 `184 条长音频（共 192 分钟）`；SenseVoice-Small GPU `170 倍实时`、CPU `17 倍实时`；Paraformer-Large GPU `120 倍实时`、CPU `15 倍实时`；Whisper-large-v3 为 GPU `13 倍实时`。"
        does_not_support: "未提供本地复现实验日志；README 链接完整报告但本次未用同硬件重跑。"
        threat: "如果业务音频是噪声、多人重叠、方言或长静音，吞吐和质量都要重新测。"
      - claim: "OpenAI 兼容 API 是真实实现，不只是文档。"
        plain_english: "可以用 OpenAI 风格 SDK 或 multipart HTTP 上传音频。"
        source: "funasr/bin/_server_app.py create_app；examples/openai_api/server.py transcribe；examples/openai_api/README_zh.md API 端点"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`@app.post(\"/v1/audio/transcriptions\")` 接收 `UploadFile`、`model`、`language`、`response_format`；`/v1/models` 返回模型列表；`/health` 返回设备和已加载模型。"
        does_not_support: "示例服务本身不内置鉴权；安全指南要求在网关层补 TLS、鉴权、上传限制、限流。"
        threat: "直接暴露示例 API 会带来隐私、滥用和资源耗尽风险。"
      - claim: "MCP Server 可让 Claude/Cursor 一类工具调用本地转写。"
        plain_english: "它把转写包装成一个本地工具 `transcribe_audio`。"
        source: "examples/mcp_server/README.md Tools；examples/mcp_server/funasr_mcp.py handle_request"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`tools/list` 返回工具名 `transcribe_audio`，schema 要求 `audio_path`，可选 `language`；调用时检查 `os.path.exists(audio_path)`，然后 `model.generate(input=audio_path, batch_size=1)`。"
        does_not_support: "MCP 示例只处理文件路径，不是上传二进制流；权限边界由客户端和本机文件系统决定。"
        threat: "Agent 能访问的本地路径需要治理，否则可能转写不该读取的音频。"
      - claim: "核心抽象是 AutoModel + 注册表。"
        plain_english: "用户传模型名和子模型名，FunASR 下载模型、解析配置、组装 tokenizer/frontend/model，再加载权重。"
        source: "funasr/auto/auto_model.py build_model；docs/tutorial/Tables_zh.md 注册表"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`build_model` 注释列出 4 步：从 ModelScope/HuggingFace 下载、解析 `config.yaml`、通过 registry 实例化 tokenizer/frontend/model、从 `model.pt` 加载权重；教程列出 `model_classes`、`frontend_classes`、`tokenizer_classes` 等注册表。"
        does_not_support: "对每个远端模型的 config 兼容性没有逐一验证。"
        threat: "注册失败或可选依赖缺失会在运行期暴露；测试里专门覆盖了 import failure 报错。"
      - claim: "长音频流水线包含 VAD、ASR、标点、可选说话人分离。"
        plain_english: "先切语音片段，再识别，再合并时间戳和文本，最后加标点/说话人。"
        source: "funasr/auto/auto_model.py inference_with_vad"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`inference_with_vad` 注释列出 5 步；代码先调用 `self.vad_model`，再按片段长度排序批处理，使用 `slice_padding_audio_samples`，再可调用 `punc_model` 和 `spk_model`，最后写入 `sentence_info`。"
        does_not_support: "没有保证所有模型都支持同等时间戳和说话人输出；源码里对无 timestamp 会 fallback 到 `vad_segment`。"
        threat: "说话人分离依赖时间戳/标点/embedding 聚类，长会议和重叠说话仍需业务样本验证。"
      - claim: "vLLM 加速路径是真实代码路径。"
        plain_english: "Fun-ASR-Nano 在 GPU 服务里优先走 vLLM，引擎失败时回退 AutoModel。"
        source: "funasr/bin/_server_app.py _load_vllm_engine；docs/vllm_guide_zh_v2.md Benchmark/架构"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`_load_vllm_engine` 调用 `FunASRNanoVLLM.from_pretrained(model=\"FunAudioLLM/Fun-ASR-Nano-2512\", hub=\"hf\", dtype=\"bf16\", max_model_len=4096, gpu_memory_utilization=0.5)`；异常时设置 `use_vllm=False` 并加载 AutoModel fallback。"
        does_not_support: "本次没有安装 vLLM 或跑 GPU；docs 中 RTFx `340`、CER `8.20%` 属于项目自称 benchmark。"
        threat: "vLLM 依赖 GPU、CUDA、显存、模型格式转换；服务冷启动和显存碎片需要实测。"
      - claim: "部署材料覆盖 Docker Compose 和 Kubernetes。"
        plain_english: "仓库不只给 Python 脚本，还给容器和集群模板。"
        source: "examples/openai_api/docker-compose.yml；examples/openai_api/Dockerfile；examples/openai_api/kubernetes/funasr-api.yaml"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "Compose 暴露 `${FUNASR_HOST_PORT:-8000}:8000`，默认 `FUNASR_DEVICE=cpu`、`FUNASR_MODEL=sensevoice`，挂载 `funasr-cache:/root/.cache`；Kubernetes PVC 请求 `20Gi`，Deployment `replicas: 1`，Service 类型 `ClusterIP`。"
        does_not_support: "默认 Dockerfile 基于 `python:3.10-slim` 和 CPU；GPU 镜像需要另行适配。"
        threat: "生产上需要 CUDA 镜像、鉴权、TLS、上传限制、限流、日志和模型缓存策略。"
  how_it_works:
    summary: ""
    body_md: "人话流程：上传一段 `meeting.wav`，FunASR 先把音频里真正有人说话的段落找出来，再把每段送进识别模型，最后把文字、时间、说话人信息拼回一个结果。技术流程可以从两个真实入口看。\n\n入口一，Python API：README 的例子是 `AutoModel(model=\"iic/SenseVoiceSmall\", vad_model=\"fsmn-vad\", spk_model=\"cam++\", device=\"cuda\")` 后调用 `model.generate(input=\"meeting.wav\")`。（来源：README Quick Start）源码里 `AutoModel.generate` 会先判断有没有 `vad_model`：没有就走 `inference()`，有就走 `inference_with_vad()`；`inference_with_vad` 先调用 `self.vad_model` 得到 `vadsegments`，再按片段长度排序批处理，用 `slice_padding_audio_samples` 取音频片段，调用主 ASR 模型，必要时调用 `punc_model`，有 `spk_model` 时提取 `spk_embedding`、聚类并把结果写到 `sentence_info`。（来源：funasr/auto/auto_model.py generate/inference_with_vad）\n\n入口二，OpenAI 兼容服务：`funasr-server --model sensevoice --device cuda` 最终调用 `funasr.bin._server_app.create_app`。如果 `preload_model == \"auto\"`，GPU 默认选 `fun-asr-nano`，CPU 默认选 `sensevoice`；`/v1/audio/transcriptions` 接收 `file`、`model`、`language`、`response_format`、`spk`。当 `model == \"fun-asr-nano\"` 且 vLLM 可用时，代码用 `soundfile.read` 读 bytes，必要时 `librosa.resample` 到 16000Hz，调用 VAD 得到毫秒级 segments，再对每段 `engine.generate(inputs=seg_audios, max_new_tokens=500, repetition_penalty=1.3)`，最后返回 `text` 和 `segments`；如果不是 vLLM 路径，则写临时文件，调用 `_process_fallback`，也就是 `AutoModel.generate`。（来源：funasr/bin/server.py；funasr/bin/_server_app.py create_app/_process_vllm/_process_fallback）\n\n术语定义：RTFx 是“音频时长 / 推理耗时”的倍数；`response_format=verbose_json` 是返回分段细节；`spk` 是 speaker 参数；`hotwords` 是热词，用来把“张三、北京”这类词传给模型或 vLLM 解码。（来源：docs/vllm_guide_zh_v2.md 离线 SDK 推理/API 参考；examples/openai_api/README_zh.md 使用 OpenAI SDK）"
  reusable_abstractions:
    summary: ""
    body_md: "最值得复用的不是某个模型名，而是几层边界：模型别名、AutoModel 组装、兼容 API、Agent 工具、迁移 benchmark。"
    items:
      - name: "AutoModel 组件组装器"
        copy: "复制“主模型 + vad_model + punc_model + spk_model + kwargs”的组合方式，让应用代码只拿到一个 `generate()`。"
        skip: "如果团队只需要单一固定模型且无长音频、标点、说话人需求，直接调用底层模型更简单。"
        why_it_matters: "`AutoModel.build_model` 已处理 hub 下载、config、registry、frontend/tokenizer/model、权重加载，能降低多模型切换成本。（来源：funasr/auto/auto_model.py build_model）"
      - name: "模型 alias 层"
        copy: "像 `examples/openai_api/server.py` 一样把 `sensevoice`、`paraformer`、`paraformer-en`、`fun-asr-nano` 映射到真实模型配置。"
        skip: "如果用户必须直接选择完整 HuggingFace/ModelScope ID，alias 会隐藏必要细节。"
        why_it_matters: "alias 让客户端不依赖底层仓库 ID；`MODEL_CONFIGS` 里每个 alias 明确写 `model`、`vad_model`、`punc_model`、`hub`、`trust_remote_code`。（来源：examples/openai_api/server.py MODEL_CONFIGS）"
      - name: "OpenAI 兼容转写端点"
        copy: "保留 `/v1/audio/transcriptions`、`/v1/models`、`/health`，让 OpenAI SDK、Dify、n8n、LangChain 走同一接入路径。"
        skip: "如果产品需要完整权限、计费、审计、多租户，不要直接把示例服务当生产网关。"
        why_it_matters: "示例 API 可快速替换云端转写入口；安全文档明确说示例服务本身不内置鉴权，应在反向代理/API 网关补控制。（来源：examples/openai_api/README_zh.md API 端点；examples/openai_api/SECURITY_zh.md 对团队开放前的最低控制项）"
      - name: "MCP 本地工具包装"
        copy: "把语音文件路径包装成 MCP `transcribe_audio`，返回文本和 segments，适合作为桌面 Agent 的本地能力。"
        skip: "如果输入来自浏览器上传或移动端流，不适合只收本地路径的 MCP 示例。"
        why_it_matters: "`funasr_mcp.py` 展示了最小 MCP stdio 实现：`initialize`、`tools/list`、`tools/call`、Content-Length framing。（来源：examples/mcp_server/funasr_mcp.py）"
      - name: "迁移评测脚本"
        copy: "复用 `examples/migration/benchmark_funasr.py` 的输入目录扫描、音频时长、elapsed_seconds、realtime_factor、results.jsonl、summary.md。"
        skip: "不要用它单独证明准确率；README 明确要求旧方案也在同一批音频上跑，再用人工审阅或 WER/CER 对比。"
        why_it_matters: "它把迁移讨论从“一个 demo 好不好”变成可重复记录字段：模型、设备、语言、耗时、RTF、错误。（来源：examples/migration/README.md；examples/migration/benchmark_funasr.py）"
      - name: "部署选型表"
        copy: "把 Colab、Python API、OpenAI API、Docker Compose、Kubernetes、Runtime WebSocket、vLLM、MCP、Triton 分成不同路径。"
        skip: "不要让所有场景都从最重的 Kubernetes/vLLM 开始。"
        why_it_matters: "docs 明确建议“先选择能满足目标的最小方案”，只有吞吐、延迟或集成方式有明确要求时再切重运行时。（来源：docs/deployment_matrix_zh.md 快速决策表）"
  dependency_platform_risk:
    summary: ""
    body_md: "主要风险集中在模型权重、GPU/vLLM、服务安全、音频依赖和许可证边界。"
    items:
      - dependency: "PyTorch/CUDA/vLLM"
        what_if_change: "vLLM 或 CUDA 版本不匹配会导致 Fun-ASR-Nano 加速路径失败，服务代码会 fallback 到 AutoModel，但吞吐和延迟会变。"
        exposure: "high"
        mitigation_or_unknown: "docs 要求 `vllm>=0.12.0`、GPU ≥ 8GB VRAM、CUDA ≥ 11.8；生产前固定镜像 tag、CUDA/PyTorch/vLLM 版本并跑真实音频 benchmark。"
        source: "docs/vllm_guide_zh_v2.md 安装与环境；funasr/bin/_server_app.py _load_vllm_engine"
      - dependency: "ModelScope/HuggingFace 模型仓库"
        what_if_change: "模型下载失败、模型 revision 变化或远端代码要求变化会影响首次启动和复现。"
        exposure: "high"
        mitigation_or_unknown: "`AutoModel.build_model` 会从 hub 下载；上线清单要求记录模型版本和模型缓存。未在 README/docs/tree 看到统一 lockfile。"
        source: "funasr/auto/auto_model.py build_model；docs/deployment_matrix_zh.md 上线检查清单"
      - dependency: "示例 OpenAI API 安全边界"
        what_if_change: "直接暴露示例服务会接受任意 SDK api_key 占位符，音频上传可带来隐私和资源风险。"
        exposure: "high"
        mitigation_or_unknown: "安全指南要求在反向代理/API 网关/Ingress 加 TLS、鉴权、上传大小限制、超时、限流、私有 `/health`、日志与留存策略。"
        source: "examples/openai_api/SECURITY_zh.md 对团队开放前的最低控制项"
      - dependency: "FastAPI/uvicorn/python-multipart/soundfile/librosa/ffmpeg"
        what_if_change: "multipart 上传、音频解码、重采样或容器系统库缺失会导致服务不能处理文件。"
        exposure: "medium"
        mitigation_or_unknown: "Dockerfile 安装 `ffmpeg`、`libsndfile1`，pip 安装 `funasr fastapi uvicorn[standard] python-multipart`；vLLM 服务代码用 `soundfile` 和必要时 `librosa.resample`。"
        source: "examples/openai_api/Dockerfile；funasr/bin/_server_app.py _process_vllm"
      - dependency: "MODEL_LICENSE"
        what_if_change: "只按 MIT 使用模型权重会漏掉模型许可证要求。"
        exposure: "medium"
        mitigation_or_unknown: "代码 MIT；模型权重协议 v1.1 要求注明来源和作者信息、保留模型名称，并包含自动终止条款。企业采用前需要法务审查。"
        source: "LICENSE；MODEL_LICENSE；model_zoo/modelscope_models_zh.md 模型许可协议"
      - dependency: "Kubernetes/GPU 调度和模型缓存"
        what_if_change: "默认 K8s 模板是 CPU、ClusterIP、1 副本；直接扩展到 GPU 服务需要镜像和调度补齐。"
        exposure: "medium"
        mitigation_or_unknown: "模板 PVC `20Gi`、ConfigMap 默认 `FUNASR_DEVICE=cpu`、resources requests `cpu: 2` 和 memory `8Gi`；安全文档要求加 Ingress/网关前先完成 TLS、鉴权、NetworkPolicy、GPU 调度记录。"
        source: "examples/openai_api/kubernetes/funasr-api.yaml；examples/openai_api/SECURITY_zh.md Kubernetes 注意事项"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些点没有在本次 README/docs/tree/source inspection 中得到足够证据，不能写成事实。"
    items:
      - "未在本地复跑 README 的 `184 条长音频（共 192 分钟）` benchmark，也未复跑 docs/vLLM 的 `184 文件，11541 秒` benchmark。"
      - "未验证 `50+ languages` 的完整语言清单、每种语言质量、方言覆盖和失败样例。"
      - "未验证 OpenAI SDK 对所有参数的兼容度；源码主要覆盖 `file`、`model`、`language`、`response_format`、`spk`。"
      - "未验证 MCP 示例在 Claude Code、Claude Desktop、Cursor、Windsurf 的实际兼容；README 写了 Tested/Compatible，但本次未启动客户端。"
      - "未看到统一的生产鉴权实现；安全指南把鉴权放在网关层。"
      - "未看到固定模型 revision 的全局 lock 策略；部分旧 tests 使用 `model_revision`，README 示例多用 alias/latest。"
      - "未验证 Windows、macOS、Linux、NPU、MPS 的完整运行矩阵；setup classifiers 声称 POSIX Linux、MacOS、Microsoft Windows。"
      - "未评估 MODEL_LICENSE 与企业商用政策的法律充分性。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 4
    body_md: "结论：对做 AI 应用的工程团队，这是值得 clone-and-run 的项目，尤其是会议转写、Agent 语音输入、内部语音 API、批量归档、字幕和从 Whisper/云端 ASR 迁移的场景。先不要信性能表，按 `docs/model_selection_zh.md` 建议从 SenseVoice-Small 和 `examples/migration/benchmark_funasr.py` 开始，用 20-50 条代表性音频记录质量、速度、失败率和成本。技术词定义：clone-and-run 是下载源码并跑 smoke test；成熟度 4 是因为代码、docs、tests、服务模板齐全，但本次未复跑 benchmark，且生产鉴权/GPU 镜像/模型 revision 锁定需要使用方补齐。（来源：docs/model_selection_zh.md 上线前先 benchmark；examples/migration/README.md Quick start；examples/openai_api/SECURITY_zh.md 上线检查清单）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-2026-06-08T1732\\\\modelscope-funasr\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-2026-06-08T1732\\modelscope-funasr\\prompt.md"
  raw_response: "logs\\codex-deepdive-2026-06-08T1732\\modelscope-funasr\\codex-last-message.json"
  invoked_at: "2026-06-08T17:57:41.492Z"
  completed_at: "2026-06-08T18:02:28.758Z"
  repo: "modelscope/FunASR"
reasoning_trace:
  paper_type_decision: "project_type = model_infra; evidence from README/artifactAudit only."
  central_contribution: "Industrial-grade speech recognition toolkit: 170x realtime, 50+ languages, speaker diarization, emotion detection, streaming, and OpenAI-compatible API."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "“比 Whisper 快 170 倍、支持 50+ 语言”。"
    - "README benchmark 给出 SenseVoice-Small、Paraformer-Large、Whisper-large-v3-turbo、Fun-ASR-Nano、Whisper-large-v3 的速度表。"
    - "OpenAI 兼容 API 是真实实现，不只是文档。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "docs/vllm_guide_zh_v2.md 安装与环境；funasr/bin/_server_app.py _load_vllm_engine"
    - "funasr/auto/auto_model.py build_model；docs/deployment_matrix_zh.md 上线检查清单"
    - "examples/openai_api/SECURITY_zh.md 对团队开放前的最低控制项"
    - "examples/openai_api/Dockerfile；funasr/bin/_server_app.py _process_vllm"
    - "LICENSE；MODEL_LICENSE；model_zoo/modelscope_models_zh.md 模型许可协议"
    - "examples/openai_api/kubernetes/funasr-api.yaml；examples/openai_api/SECURITY_zh.md Kubernetes 注意事项"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 4
  main_risk: "结论：对做 AI 应用的工程团队，这是值得 clone-and-run 的项目，尤其是会议转写、Agent 语音输入、内部语音 API、批量归档、字幕和从 Whisper/云端 ASR 迁移的场景。先不要信性能表，按 `docs/model_selection_zh.md` 建议从 SenseVoice-Small 和 `examples/migration/benchmark_funasr.py` 开始，用 20-50 条代表性音频记录质量、速度、失败率和成本。技术词定义：clone-and-run 是下载源码并跑 smoke test；成熟度 4 是因为代码、docs、tests、服务模板齐全，但本次未复跑 benchmark，且生产鉴权/GPU 镜像/模型 revision 锁定需要使用方补齐。（来源：docs/model_selection_zh.md 上线前先 benchmark；examples/migration/README.md Quick start；examples/openai_api/SECURITY_zh.md 上线检查清单）"
next_actions:
  - "clone-and-run"
unknowns:
  - "未在本地复跑 README 的 `184 条长音频（共 192 分钟）` benchmark，也未复跑 docs/vLLM 的 `184 文件，11541 秒` benchmark。"
  - "未验证 `50+ languages` 的完整语言清单、每种语言质量、方言覆盖和失败样例。"
  - "未验证 OpenAI SDK 对所有参数的兼容度；源码主要覆盖 `file`、`model`、`language`、`response_format`、`spk`。"
  - "未验证 MCP 示例在 Claude Code、Claude Desktop、Cursor、Windsurf 的实际兼容；README 写了 Tested/Compatible，但本次未启动客户端。"
  - "未看到统一的生产鉴权实现；安全指南把鉴权放在网关层。"
  - "未看到固定模型 revision 的全局 lock 策略；部分旧 tests 使用 `model_revision`，README 示例多用 alias/latest。"
  - "未验证 Windows、macOS、Linux、NPU、MPS 的完整运行矩阵；setup classifiers 声称 POSIX Linux、MacOS、Microsoft Windows。"
  - "未评估 MODEL_LICENSE 与企业商用政策的法律充分性。"
builder_reuse:
  pattern: "AutoModel 组件组装器"
  copy: "复制“主模型 + vad_model + punc_model + spk_model + kwargs”的组合方式，让应用代码只拿到一个 `generate()`。"
  skip: "如果团队只需要单一固定模型且无长音频、标点、说话人需求，直接调用底层模型更简单。"
  why_it_matters: "`AutoModel.build_model` 已处理 hub 下载、config、registry、frontend/tokenizer/model、权重加载，能降低多模型切换成本。（来源：funasr/auto/auto_model.py build_model）"
dependency_platform_risk:
  dependency: "PyTorch/CUDA/vLLM"
  what_if_change: "vLLM 或 CUDA 版本不匹配会导致 Fun-ASR-Nano 加速路径失败，服务代码会 fallback 到 AutoModel，但吞吐和延迟会变。"
  exposure: "high"
  mitigation_or_unknown: "docs 要求 `vllm>=0.12.0`、GPU ≥ 8GB VRAM、CUDA ≥ 11.8；生产前固定镜像 tag、CUDA/PyTorch/vLLM 版本并跑真实音频 benchmark。"
claim_ledger:
  - claim: "“比 Whisper 快 170 倍、支持 50+ 语言”。"
    plain_english: "项目首页把 FunASR 定位成高吞吐、多语言的私有语音识别工具。"
    source: "README 顶部标语；README Why FunASR 表格"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 明确写 `170x faster than Whisper`、`50+ languages`，中文 README 写“比 Whisper 快 170 倍。支持 50+ 语言”。"
    does_not_support: "本次没有运行 benchmark，也没有核验 50+ 语言清单覆盖质量。"
    threat: "速度数字依赖硬件、模型、batch、warmup、音频分布；语言数量不等于每种语言质量一致。"
  - claim: "README benchmark 给出 SenseVoice-Small、Paraformer-Large、Whisper-large-v3-turbo、Fun-ASR-Nano、Whisper-large-v3 的速度表。"
    plain_english: "它提供了公开对比口径，但仍是项目方报告。"
    source: "README 性能评测"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "表格写：测试集为 `184 条长音频（共 192 分钟）`；SenseVoice-Small GPU `170 倍实时`、CPU `17 倍实时`；Paraformer-Large GPU `120 倍实时`、CPU `15 倍实时`；Whisper-large-v3 为 GPU `13 倍实时`。"
    does_not_support: "未提供本地复现实验日志；README 链接完整报告但本次未用同硬件重跑。"
    threat: "如果业务音频是噪声、多人重叠、方言或长静音，吞吐和质量都要重新测。"
  - claim: "OpenAI 兼容 API 是真实实现，不只是文档。"
    plain_english: "可以用 OpenAI 风格 SDK 或 multipart HTTP 上传音频。"
    source: "funasr/bin/_server_app.py create_app；examples/openai_api/server.py transcribe；examples/openai_api/README_zh.md API 端点"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`@app.post(\"/v1/audio/transcriptions\")` 接收 `UploadFile`、`model`、`language`、`response_format`；`/v1/models` 返回模型列表；`/health` 返回设备和已加载模型。"
    does_not_support: "示例服务本身不内置鉴权；安全指南要求在网关层补 TLS、鉴权、上传限制、限流。"
    threat: "直接暴露示例 API 会带来隐私、滥用和资源耗尽风险。"
  - claim: "MCP Server 可让 Claude/Cursor 一类工具调用本地转写。"
    plain_english: "它把转写包装成一个本地工具 `transcribe_audio`。"
    source: "examples/mcp_server/README.md Tools；examples/mcp_server/funasr_mcp.py handle_request"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`tools/list` 返回工具名 `transcribe_audio`，schema 要求 `audio_path`，可选 `language`；调用时检查 `os.path.exists(audio_path)`，然后 `model.generate(input=audio_path, batch_size=1)`。"
    does_not_support: "MCP 示例只处理文件路径，不是上传二进制流；权限边界由客户端和本机文件系统决定。"
    threat: "Agent 能访问的本地路径需要治理，否则可能转写不该读取的音频。"
  - claim: "核心抽象是 AutoModel + 注册表。"
    plain_english: "用户传模型名和子模型名，FunASR 下载模型、解析配置、组装 tokenizer/frontend/model，再加载权重。"
    source: "funasr/auto/auto_model.py build_model；docs/tutorial/Tables_zh.md 注册表"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`build_model` 注释列出 4 步：从 ModelScope/HuggingFace 下载、解析 `config.yaml`、通过 registry 实例化 tokenizer/frontend/model、从 `model.pt` 加载权重；教程列出 `model_classes`、`frontend_classes`、`tokenizer_classes` 等注册表。"
    does_not_support: "对每个远端模型的 config 兼容性没有逐一验证。"
    threat: "注册失败或可选依赖缺失会在运行期暴露；测试里专门覆盖了 import failure 报错。"
  - claim: "长音频流水线包含 VAD、ASR、标点、可选说话人分离。"
    plain_english: "先切语音片段，再识别，再合并时间戳和文本，最后加标点/说话人。"
    source: "funasr/auto/auto_model.py inference_with_vad"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`inference_with_vad` 注释列出 5 步；代码先调用 `self.vad_model`，再按片段长度排序批处理，使用 `slice_padding_audio_samples`，再可调用 `punc_model` 和 `spk_model`，最后写入 `sentence_info`。"
    does_not_support: "没有保证所有模型都支持同等时间戳和说话人输出；源码里对无 timestamp 会 fallback 到 `vad_segment`。"
    threat: "说话人分离依赖时间戳/标点/embedding 聚类，长会议和重叠说话仍需业务样本验证。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 69: 最值得复用的不是某个模型名，而是几层边界：模型别名、AutoModel 组装、兼容 API、Agent 工具、迁移 benchmark。 - AutoModel 组件组装器；复制“主模型 + vad_model + punc_model + spk_model + kwar..."
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

## [Tier 3｜数据不足]（来源：README/artifactAudit）

## 一句话定位

modelscope/FunASR: deep radar candidate with agent/tooling evidence

（来源：README/artifactAudit）

## 干什么

Industrial-grade speech recognition toolkit: 170x realtime, 50+ languages, speaker diarization, emotion detection, streaming, and OpenAI-compatible API.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 17029 |
| stars_in_period | 544 |
| author | modelscope |

## 标签

- agents（来源：数据不足）
- mcp（来源：数据不足）
- models（来源：数据不足）
- cli（来源：数据不足）
- docs（来源：数据不足）

## 解决什么痛点

值得看的是它把“模型调用”和“应用接入”同时做了。README 的最短路径是 `pip install funasr`，然后 `AutoModel(model="iic/SenseVoiceSmall", vad_model="fsmn-vad", spk_model="cam++", device="cuda")`，再 `model.generate(input="meeting.wav")`；服务路径则是 `funasr-server --model sensevoice --device cuda` 暴露 `POST /v1/audio/transcriptions`。（来源：README Quick Start/部署）

## 核心能力

- AutoModel 组件组装器（来源：数据不足）
- 模型 alias 层（来源：数据不足）
- OpenAI 兼容转写端点（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向判断：FunASR 更像“私有 ASR 工程套件”，不是纯模型论文仓库。 对 OpenAI Whisper：README 自称 FunASR 的 SenseVoice-Small 在 benchmark 中 GPU `170 倍实时`，Whisper-large-v3 为 GPU `13 倍实时`；迁移指南把 Whisper 文件转写映射到 FunASR 的 README 快速开始和模型选择，把 `Whisper + pyannote` 映射到 `VAD、标点和 spk_model="cam++"`。选 FunASR：需要私有部署、长音频吞吐、内置 VAD/标点/说话人、OpenAI 兼容服务。选 Whisper：已有 Whisper 质量基线、只做少量英文/多语种离线转写、团队不想引入 ModelScope/HuggingFace 多模型组合。速度差异为项目自称，未复跑。（来源：README 性能评测；docs/migration_from_whisper_zh.md 功能映射） 对 OpenAI Audio API/托管云 ASR：迁移指南明确把“OpenAI 音频 API 或云端批量 ASR”映射到 FunASR 的 OpenAI 兼容 API，并要求验证 `/v1/audio/transcriptions`、响应格式、客户端兼容性和上传限制。选 FunASR：音频不能出私有环境、需要本地成本控制、需要接 Dify/LangChain/AutoGen/内部 HTTP。选托管 API：需要厂商 SLA、弹性容量、少运维，或自有评测显示 FunASR 目标语言/领域还不够好。（来源：docs/migration_from_whisper_zh.md 什么时候值得评估/功能映射） 对 Whisper + pyannote + silero-vad + 标点等拼装栈：FunASR 的差异是把 `vad_model="fsmn-vad"`、`punc_model="ct-punc"`、`spk_model="cam++"` 放进同一个 AutoModel 调用和同一个服务 alias；拼装栈的优势是每个环节可替换、社区资料多。选 FunASR：先要一条可跑通的端到端路径。选拼装栈：对每个环节已有成熟模型选择和评测，且愿意维护多个依赖边界。（来源：README 使用示例；funasr/auto/auto_model.py inference_with_vad；docs/migration_from_whisper_zh.md 功能映射）

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话流程：上传一段 `meeting.wav`，FunASR 先把音频里真正有人说话的段落找出来，再把每段送进识别模型，最后把文字、时间、说话人信息拼回一个结果。技术流程可以从两个真实入口看。 入口一，Python API：README 的例子是 `AutoModel(model="iic/SenseVoiceSmall", vad_model="fsmn-vad", spk_model="cam++", device="cuda")` 后调用 `model.generate(input="meeting.wav")`。（来源：README Quick Start）源码里 `AutoModel.generate` 会先判断有没有 `vad_model`：没有就走 `inference()`，有就走 `inference_with_vad()`；`inference_with_vad` 先调用 `self.vad_model` 得到 `vadsegments`，再按片段长度排序批处理，用 `slice_padding_audio_samples` 取音频片段，调用主 ASR 模型，必要时调用 `punc_model`，有 `spk_model` 时提取 `spk_embedding`、聚类并把结果写到 `sentence_info`。（来源：funasr/auto/auto_model.py generate/inference_with_vad） 入口二，OpenAI 兼容服务：`funasr-server --model sensevoice --device cuda` 最终调用 `funasr.bin._server_app.create_app`。如果 `preload_model == "auto"`，GPU 默认选 `fun-asr-nano`，CPU 默认选 `sensevoice`；`/v1/audio/transcriptions` 接收 `file`、`model`、`language`、`response_format`、`spk`。当 `model == "fun-asr-nano"` 且 vLLM 可用时，代码用 `soundfile.read` 读 bytes，必要时 `librosa.resample` 到 16000Hz，调用 VAD 得到毫秒级 segments，再对每段 `engine.generate(inputs=seg_audios, max_new_tokens=500, repetition_penalty=1.3)`，最后返回 `text` 和 `segments`；如果不是 vLLM 路径，则写临时文件，调用 `_process_fallback`，也就是 `AutoModel.generate`。（来源：funasr/bin/server.py；funasr/bin/_server_app.py create_app/_process_vllm/_process_fallback） 术语定义：RTFx 是“音频时长 / 推理耗时”的倍数；`response_format=verbose_json` 是返回分段细节；`spk` 是 speaker 参数；`hotwords` 是热词，用来把“张三、北京”这类词传给模型或 vLLM 解码。（来源：docs/vllm_guide_zh_v2.md 离线 SDK 推理/API 参考；examples/openai_api/README_zh.md 使用 OpenAI SDK）

## 本质不同的设计取舍

最值得复用的不是某个模型名，而是几层边界：模型别名、AutoModel 组装、兼容 API、Agent 工具、迁移 benchmark。 - AutoModel 组件组装器；复制“主模型 + vad_model + punc_model + spk_model + kwargs”的组合方式，让应用代码只拿到一个 `generate()`。；如果团队只需要单一固定模型且无长音频、标点、说话人需求，直接调用底层模型更简单。；`AutoModel.build_model` 已处理 hub 下载、config、registry、frontend/tokenizer/model、权重加载，能降低多模型切换成本。（来源：funasr/auto/auto_model.py build_model） - 模型 alias 层；像 `examples/openai_api/server.py` 一样把 `sensevoice`、`paraformer`、`paraformer-en`、`fun-asr-nano` 映射到真实模型配置。；如果用户必须直接选择完整 HuggingFace/ModelScope ID，alias 会隐藏必要细节。；alias 让客户端不依赖底层仓库 ID；`MODEL_CONFIGS` 里每个 alias 明确写 `model`、`vad_model`、`punc_model`、`hub`、`trust_remote_code`。（来源：examples/openai_api/server.py MODEL_CONFIGS） - OpenAI 兼容转写端点；保留 `/v1/audio/transcriptions`、`/v1/models`、`/health`，让 OpenAI SDK、Dify、n8n、LangChain 走同一接入路径。；如果产品需要完整权限、计费、审计、多租户，不要直接把示例服务当生产网关。；示例 API 可快速替换云端转写入口；安全文档明确说示例服务本身不内置鉴权，应在反向代理/API 网关补控制。（来源：examples/openai_api/README_zh.md API 端点；examples/openai_api/SECURITY_zh.md 对团队开放前的最低控制项） - MCP 本地工具包装；把语音文件路径包装成 MCP `transcribe_audio`，返回文本和 segments，适合作为桌面 Agent 的本地能力。；如果输入来自浏览器上传或移动端流，不适合只收本地路径的 MCP 示例。；`funasr_mcp.py` 展示了最小 MCP stdio 实现：`initialize`、`tools/list`、`tools/call`、Content-Length framing。（来源：examples/mcp_server/funasr_mcp.py） - 迁移评测脚本；复用 `examples/migration/benchmark_funasr.py` 的输入目录扫描、音频时长、elapsed_seconds、realtime_factor、results.jsonl、summary.md。；不要用它单独证明准确率；README 明确要求旧方案也在同一批音频上跑，再用人工审阅或 WER/CER 对比。；它把迁移讨论从“一个 demo 好不好”变成可重复记录字段：模型、设备、语言、耗时、RTF、错误。（来源：examples/migration/README.md；examples/migration/benchmark_funasr.py） - 部署选型表；把 Colab、Python API、OpenAI API、Docker Compose、Kubernetes、Runtime WebSocket、vLLM、MCP、Triton 分成不同路径。；不要让所有场景都从最重的 Kubernetes/vLLM 开始。；docs 明确建议“先选择能满足目标的最小方案”，只有吞吐、延迟或集成方式有明确要求时再切重运行时。（来源：docs/deployment_matrix_zh.md 快速决策表）

## 对从业者意味着什么

结论：对做 AI 应用的工程团队，这是值得 clone-and-run 的项目，尤其是会议转写、Agent 语音输入、内部语音 API、批量归档、字幕和从 Whisper/云端 ASR 迁移的场景。先不要信性能表，按 `docs/model_selection_zh.md` 建议从 SenseVoice-Small 和 `examples/migration/benchmark_funasr.py` 开始，用 20-50 条代表性音频记录质量、速度、失败率和成本。技术词定义：clone-and-run 是下载源码并跑 smoke test；成熟度 4 是因为代码、docs、tests、服务模板齐全，但本次未复跑 benchmark，且生产鉴权/GPU 镜像/模型 revision 锁定需要使用方补齐。（来源：docs/model_selection_zh.md 上线前先 benchmark；examples/migration/README.md Quick start；examples/openai_api/SECURITY_zh.md 上线检查清单）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/automatic-speech-recognition]]、[[concepts/voice-activity-detection]]。另见 [[content/modelscope-funasr]]、[[claims/modelscope-funasr-main-claim]]。
