---
name: "无分词器文本转语音"
slug: "tokenizer-free-tts"
kind: "concept"
tags:
  - "tts"
  - "architecture"
maturity: "active"
first_seen_in: "voxcpm"
related_content:
  - "voxcpm"
related_concepts: []
explanation: "直接生成连续语音表征，跳过将文本转换为离散音素、音调单元等中间步骤，以自然度换取计算复杂度。"
examples:
  - "VoxCPM 的扩散自回归架构"
common_misunderstandings:
  - "并不是完全不用分词，而是不将语音离散化，文本端可能仍使用语言模型 tokenizer。"
open_questions:
  - "如何在长文本上保持一致性？"
---

## Explanation

直接生成连续语音表征，跳过将文本转换为离散音素、音调单元等中间步骤，以自然度换取计算复杂度。 出处:https://github.com/openbmb/voxcpm。See [[content/voxcpm]]。

## Supported by
- [[claims/voxcpm-main-claim]]
