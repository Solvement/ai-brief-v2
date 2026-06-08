---
content: "openmoss-moss-tts"
kind: "evidence-pack"
title: "MOSS-TTS — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "component"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "MOSS-TTS 是一个开源语音/声音生成模型家族仓库，把长文本 TTS、音色克隆、实时流式 TTS、多人对话语音、音效生成和本地/边缘推理放在同一个工程里。"
    internal_logic: "人话：以 README 的 MOSS-TTS-v1.5 例子为真实流程：先建 Python 3.12 环境并安装 `pip install --extra-index-url https://download.pytorch.org/whl/cu128 -e \".[torch-runtime]\"`；代码选择 `device = \"cuda\" if torch.cuda.is_available() else \"cpu\"`，CUDA 上用 `torch.bfloat16`，并通过 `resolve_attn_implementation()` 在 FlashAttention 2、SDPA、eager 之间选后端。接着 `AutoProcessor.from_pretrained(\"OpenMOSS-Team/MOSS-TTS-v1.5\", trust_remote_code=True)` 加载 processor，把 `processor.audio_tokenizer` 移到 device；输入不是裸字符串，而是消息：例如法语 `processor.build_user_message(text=text_7, language=\"French\")`，克隆声音 `processor.build_user_message(text=text_1, reference=[ref_audio_1])`，控时长 `processor.build_user_message(text=text_2, tokens=325)`，显式停顿 `我今天学习了一首中国的古诗，它的名字是[pause 3.2s]静夜思！`。这些 conversation 送进 `processor(batch_conversations, mode=\"generation\")` 变成 `input_ids` 和 `attention_mask`，再由 `model.generate(..., max_new_tokens=4096)` 生成；`processor.decode(outputs)` 得到 `message.audio_codes_list[0]`，最后 `torchaudio.save(out_path, audio.unsqueeze(0), processor.model_config.sampling_rate)` 写 WAV。（来源：README Environment Setup；来源：README MOSS-TTS Basic Usage）\n\n术语层：MossTTSDelay 的底层不是直接预测波形，而是预测 MOSS-Audio-Tokenizer 的离散音频 tokens。`moss_tts_delay/README.md` 写明采样率 24,000 Hz、frame rate 12.5 Hz、32 个 RVQ layers、33 个 LM heads；`moss_tts_delay/llama_cpp/processor.py` 还展示了 prompt 被打包成 `(S, 33)` 的 multi-channel `input_ids`，第 0 列是文本 token，后 32 列是音频 codebook。llama.cpp 路径中，`build_generation_prompt(...)` 把 `Reference(s)`、`Instruction`、`Tokens`、`Quality`、`Sound Event`、`Ambient Sound`、`Language`、`Text` 写入 `<user_inst>...</user_inst>`；`LlamaCppPipeline.generate(...)` 先 `_prepare_reference()` 把参考音频编码为 codes，再 prefill backbone，然后在 `_autoregressive_loop()` 中每步取 `text_logits`、`hs = backbone.get_hidden_state(-1)`、`audio_logits = lm_heads.audio_all(hs)`，交给 `delay_step(...)` 采样下一个 `[text_token, audio_0..audio_31]`，循环结束后 `parse_generation_output(...)` 取音频 codes，再用 ONNX/TRT/Torch audio tokenizer decode 成 waveform。（来源：moss_tts_delay/README.md Technical Specifications；来源：moss_tts_delay/llama_cpp/processor.py build_generation_prompt；来源：moss_tts_delay/llama_cpp/pipeline.py generate and _autoregressive_loop）"
    failure_mode: "README MOSS-TTS Basic Usage；docs/moss_tts_realtime_model_card.md Basic Usage"
    source_pointer: "https://github.com/openmoss/moss-tts"
pipeline_steps:
  - "project_type 分诊:model_infra"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/false/Apache-2.0/not_found"
experiments: []
claims:
  - "[[claims/openmoss-moss-tts-main-claim]]"
artifacts:
  - "[[artifacts/openmoss-moss-tts-repo]]"
metrics:
  - "stars=3071"
  - "forks=273"
  - "open_issues=6"
  - "latest_release=not_found"
  - "pushed_at=2026-06-04T09:08:01Z"
baselines: []
failure_modes:
  - "README MOSS-TTS Basic Usage；docs/moss_tts_realtime_model_card.md Basic Usage"
  - "pyproject.toml torch-runtime；README Environment Setup"
  - ".gitmodules；README llama.cpp Backend Model Weights"
  - "moss_tts_delay/llama_cpp/README.md Weight Preparation；README llama.cpp Backend Configuration"
  - "README SGLang Backend Quick Start"
  - "README Optional Install FlashAttention 2；docs/moss_tts_realtime_model_card.md TTFB and RTF"
  - "moss_soundeffect_v2/README.md Environment Setup；moss_soundeffect_v2/pyproject.toml"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
source_pointers:
  - "https://github.com/openmoss/moss-tts"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/openmoss-moss-tts-main-claim]],官方 artifact 落库为 [[artifacts/openmoss-moss-tts-repo]]。See [[content/openmoss-moss-tts]]。
