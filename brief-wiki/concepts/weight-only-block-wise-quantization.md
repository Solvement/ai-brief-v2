---
name: "Weight-only Block-wise Quantization"
slug: "weight-only-block-wise-quantization"
kind: "concept"
tags:
  - "quantization"
  - "compression"
maturity: "active"
first_seen_in: "airllm"
related_content:
  - "airllm"
related_concepts: []
explanation: "只对权重进行分块量化（将权重矩阵分成小块，每块独立量化），不量化激活值，以降低磁盘加载量和内存占用，同时避免激活量化带来的精度损失。"
examples:
  - "AirLLM 通过 compression='4bit' 启用此功能，依赖 bitsandbytes 实现。"
common_misunderstandings:
  - "并不等同于传统量化推理（需要 kernel 支持），它主要加速磁盘 I/O，计算仍在浮点精度下进行。"
open_questions:
  - "块大小如何选择？误差与速度的 trade-off 如何？"
  - "与 GPTQ、AWQ 等方法的比较？"
---

## Explanation

只对权重进行分块量化（将权重矩阵分成小块，每块独立量化），不量化激活值，以降低磁盘加载量和内存占用，同时避免激活量化带来的精度损失。 出处:https://github.com/lyogavin/airllm。See [[content/airllm]]。

## Supported by
- [[claims/airllm-main-claim]]
