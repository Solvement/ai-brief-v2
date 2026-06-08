---
name: "ASR / 自动语音识别"
slug: "automatic-speech-recognition"
kind: "concept"
tags:
  - "speech"
  - "model-inference"
  - "funasr"
maturity: "active"
first_seen_in: "modelscope-funasr"
related_content:
  - "modelscope-funasr"
related_concepts: []
explanation: "人话：把音频里的话转成文字。技术定义：FunASR 通过 `AutoModel.generate(input=...)` 接收文件路径、URL、numpy array、bytes 或列表，返回含 `text`、`timestamp`、`sentence_info` 的 dict 列表。"
examples:
  - "README Quick Start: `model.generate(input=\"meeting.wav\")`"
  - "examples/openai_api/server.py: `client.audio.transcriptions.create(model=\"sensevoice\", file=open(\"meeting.wav\", \"rb\"))`"
common_misunderstandings:
  - "ASR 只等于转文字；在 FunASR 里常和 VAD、标点、时间戳、说话人一起组成流水线。"
  - "支持某语言数量不等于业务音频质量已达标。"
open_questions:
  - "本次未复跑不同语言和方言质量。"
---

## Explanation

人话：把音频里的话转成文字。技术定义：FunASR 通过 `AutoModel.generate(input=...)` 接收文件路径、URL、numpy array、bytes 或列表，返回含 `text`、`timestamp`、`sentence_info` 的 dict 列表。 出处:https://github.com/modelscope/funasr。See [[content/modelscope-funasr]]。

## Supported by
- [[claims/modelscope-funasr-main-claim]]
