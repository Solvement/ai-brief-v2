---
content: "modelscope-funasr"
kind: "evidence-pack"
title: "FunASR — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "component"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "FunASR 是一个把离线/流式语音识别、VAD、标点、说话人分离、OpenAI 兼容 API、MCP 工具和 vLLM 加速放在同一套 Python/部署栈里的 ASR 工具箱。"
    internal_logic: "人话流程：上传一段 `meeting.wav`，FunASR 先把音频里真正有人说话的段落找出来，再把每段送进识别模型，最后把文字、时间、说话人信息拼回一个结果。技术流程可以从两个真实入口看。\n\n入口一，Python API：README 的例子是 `AutoModel(model=\"iic/SenseVoiceSmall\", vad_model=\"fsmn-vad\", spk_model=\"cam++\", device=\"cuda\")` 后调用 `model.generate(input=\"meeting.wav\")`。（来源：README Quick Start）源码里 `AutoModel.generate` 会先判断有没有 `vad_model`：没有就走 `inference()`，有就走 `inference_with_vad()`；`inference_with_vad` 先调用 `self.vad_model` 得到 `vadsegments`，再按片段长度排序批处理，用 `slice_padding_audio_samples` 取音频片段，调用主 ASR 模型，必要时调用 `punc_model`，有 `spk_model` 时提取 `spk_embedding`、聚类并把结果写到 `sentence_info`。（来源：funasr/auto/auto_model.py generate/inference_with_vad）\n\n入口二，OpenAI 兼容服务：`funasr-server --model sensevoice --device cuda` 最终调用 `funasr.bin._server_app.create_app`。如果 `preload_model == \"auto\"`，GPU 默认选 `fun-asr-nano`，CPU 默认选 `sensevoice`；`/v1/audio/transcriptions` 接收 `file`、`model`、`language`、`response_format`、`spk`。当 `model == \"fun-asr-nano\"` 且 vLLM 可用时，代码用 `soundfile.read` 读 bytes，必要时 `librosa.resample` 到 16000Hz，调用 VAD 得到毫秒级 segments，再对每段 `engine.generate(inputs=seg_audios, max_new_tokens=500, repetition_penalty=1.3)`，最后返回 `text` 和 `segments`；如果不是 vLLM 路径，则写临时文件，调用 `_process_fallback`，也就是 `AutoModel.generate`。（来源：funasr/bin/server.py；funasr/bin/_server_app.py create_app/_process_vllm/_process_fallback）\n\n术语定义：RTFx 是“音频时长 / 推理耗时”的倍数；`response_format=verbose_json` 是返回分段细节；`spk` 是 speaker 参数；`hotwords` 是热词，用来把“张三、北京”这类词传给模型或 vLLM 解码。（来源：docs/vllm_guide_zh_v2.md 离线 SDK 推理/API 参考；examples/openai_api/README_zh.md 使用 OpenAI SDK）"
    failure_mode: "docs/vllm_guide_zh_v2.md 安装与环境；funasr/bin/_server_app.py _load_vllm_engine"
    source_pointer: "https://github.com/modelscope/funasr"
pipeline_steps:
  - "project_type 分诊:model_infra"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/true/MIT/v1.3.9"
experiments: []
claims:
  - "[[claims/modelscope-funasr-main-claim]]"
artifacts:
  - "[[artifacts/modelscope-funasr-repo]]"
metrics:
  - "stars=17029"
  - "forks=1735"
  - "open_issues=19"
  - "latest_release=v1.3.9"
  - "pushed_at=2026-05-30T16:19:19Z"
baselines: []
failure_modes:
  - "docs/vllm_guide_zh_v2.md 安装与环境；funasr/bin/_server_app.py _load_vllm_engine"
  - "funasr/auto/auto_model.py build_model；docs/deployment_matrix_zh.md 上线检查清单"
  - "examples/openai_api/SECURITY_zh.md 对团队开放前的最低控制项"
  - "examples/openai_api/Dockerfile；funasr/bin/_server_app.py _process_vllm"
  - "LICENSE；MODEL_LICENSE；model_zoo/modelscope_models_zh.md 模型许可协议"
  - "examples/openai_api/kubernetes/funasr-api.yaml；examples/openai_api/SECURITY_zh.md Kubernetes 注意事项"
missing_details: []
source_pointers:
  - "https://github.com/modelscope/funasr"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/modelscope-funasr-main-claim]],官方 artifact 落库为 [[artifacts/modelscope-funasr-repo]]。See [[content/modelscope-funasr]]。
