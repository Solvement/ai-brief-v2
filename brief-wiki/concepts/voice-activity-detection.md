---
name: "VAD / 语音端点检测"
slug: "voice-activity-detection"
kind: "concept"
tags:
  - "speech"
  - "segmentation"
  - "long-audio"
maturity: "stable"
first_seen_in: "modelscope-funasr"
related_content:
  - "modelscope-funasr"
related_concepts: []
explanation: "人话：先找音频里哪些时间段有人说话，避免把整段长音频一次塞给识别模型。技术定义：FunASR 用 `vad_model=\"fsmn-vad\"`，`inference_with_vad` 先得到 `vadsegments`，再切片识别。"
examples:
  - "README 使用示例: `AutoModel(model=\"paraformer-zh\", vad_model=\"fsmn-vad\", punc_model=\"ct-punc\", spk_model=\"cam++\")`"
  - "funasr/bin/_server_app.py: `vad_res = app.state.vad_model.generate(input=audio_data, fs=sr)`"
common_misunderstandings:
  - "VAD 不是识别文字，它只决定哪些片段送去 ASR。"
  - "VAD 参数会影响长句切分、静音处理和后续说话人分离。"
open_questions:
  - "README/docs 没有给所有场景的 VAD 参数推荐表。"
---

## Explanation

人话：先找音频里哪些时间段有人说话，避免把整段长音频一次塞给识别模型。技术定义：FunASR 用 `vad_model="fsmn-vad"`，`inference_with_vad` 先得到 `vadsegments`，再切片识别。 出处:https://github.com/modelscope/funasr。See [[content/modelscope-funasr]]。

## Supported by
- [[claims/modelscope-funasr-main-claim]]
