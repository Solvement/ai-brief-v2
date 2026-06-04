---
name: "语音设计"
slug: "voice-design"
kind: "concept"
tags:
  - "tts"
  - "voice-cloning"
maturity: "active"
first_seen_in: "voxcpm"
related_content:
  - "voxcpm"
related_concepts: []
explanation: "无需参考音频，仅通过自然语言描述（如年龄、性别、语气、语速等）生成特定音色。"
examples:
  - "在 text 中以括号包含描述：\"(a deep male voice)Hello.\""
common_misunderstandings:
  - "不是简单的音色叠加，而是从训练数据中学习到的声音属性映射。"
open_questions:
  - "如何量化和控制声音设计中的细微情感变化？"
---

## Explanation

无需参考音频，仅通过自然语言描述（如年龄、性别、语气、语速等）生成特定音色。 出处:https://github.com/openbmb/voxcpm。See [[content/voxcpm]]。

## Supported by
- [[claims/voxcpm-main-claim]]
