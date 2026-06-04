---
name: "非自回归语音识别 (NAR ASR)"
slug: "non-autoregressive-asr"
kind: "concept"
tags:
  - "asr"
  - "inference-optimization"
maturity: "active"
first_seen_in: "funasr"
related_content:
  - "funasr"
related_concepts: []
explanation: "不同于传统逐帧生成文本的模型，Paraformer 使用并行解码，一次性输出整个序列，因此速度极快，适合实时场景。"
examples:
  - "Paraformer-zh 模型在 GPU 上达到 120x 实时速度，无需等待顺序生成。"
common_misunderstandings:
  - "非自回归并不牺牲精度，Paraformer 在中文任务上接近自回归模型效果。"
open_questions:
  - "NAR 模型在多长句子上会有性能下降？"
---

## Explanation

不同于传统逐帧生成文本的模型，Paraformer 使用并行解码，一次性输出整个序列，因此速度极快，适合实时场景。 出处:https://github.com/modelscope/funasr。See [[content/funasr]]。

## Supported by
- [[claims/funasr-main-claim]]
