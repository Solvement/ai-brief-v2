---
slug: "openmoss-moss-tts-repo"
kind: "artifact"
content: "openmoss-moss-tts"
artifact_type: "repo"
url: "https://github.com/OpenMOSS/MOSS-TTS"
official_or_third_party: "official"
status: "available"
license: "Apache-2.0"
runnable: "unknown"
missing_parts:
  - "未下载 Hugging Face/ModelScope 模型权重、GGUF 权重或 ONNX tokenizer 权重。"
  - "未初始化 `moss_audio_tokenizer` git submodule；`.gitmodules` 指向 https://github.com/OpenMOSS/MOSS-Audio-Tokenizer。"
  - "未编译 llama.cpp C bridge，未构建 TensorRT engines。"
  - "未运行推理、微调或 benchmark；README/model card 性能数字按自称处理。"
  - "仓库树未见项目级 `tests/`、`.github/`、Dockerfile。"
last_checked: "2026-06-08"
---

## Artifact audit

已按要求 clone 到 `logs/codex-deepdive-2026-06-08T1732/openmoss-moss-tts/checkout` 并读取 README、docs、pyproject、configs、llama.cpp backend、Realtime 示例、SoundEffect-v2 pipeline 与 fine-tuning 文档。仓库有具体推理和训练入口，但实际可运行性取决于外部权重、CUDA/FFmpeg/Transformers/PyTorch 版本、子模块和硬件。

出处:https://github.com/openmoss/moss-tts。See [[content/openmoss-moss-tts]]。
