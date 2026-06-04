---
name: "Layer-wise Model Loading"
slug: "layer-wise-model-loading"
kind: "concept"
tags:
  - "memory-optimization"
  - "inference"
maturity: "active"
first_seen_in: "airllm"
related_content:
  - "airllm"
related_concepts: []
explanation: "将大模型的权重按层拆分成多个文件，推理时只加载当前计算所需的一层到 GPU，其他层保留在磁盘或内存中，从而降低峰值显存。"
examples:
  - "AirLLM 的 AutoModel 初始化过程会将 HF 模型拆分保存到磁盘，并在 generate 时逐层加载。"
common_misunderstandings:
  - "并不是所有模型都适合逐层加载，比如带有跨层 attention 的模型可能无法正常工作。"
open_questions:
  - "如何处理模型中的共享权重（如 embedding 层）？"
  - "当模型有残差连接时，是否需要缓存中间激活？"
---

## Explanation

将大模型的权重按层拆分成多个文件，推理时只加载当前计算所需的一层到 GPU，其他层保留在磁盘或内存中，从而降低峰值显存。 出处:https://github.com/lyogavin/airllm。See [[content/airllm]]。

## Supported by
- [[claims/airllm-main-claim]]
