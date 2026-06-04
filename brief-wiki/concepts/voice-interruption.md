---
name: "语音打断"
slug: "voice-interruption"
kind: "concept"
tags:
  - "voice"
  - "interaction"
  - "real-time"
maturity: "active"
first_seen_in: "open-llm-vtuber"
related_content:
  - "open-llm-vtuber"
related_concepts: []
explanation: "AI 在说话时能够被用户语音输入打断，无需物理按钮或关键词，类似人与人对话的自然打断。实现需处理音频流回波消除和状态机。"
examples:
  - "Open-LLM-VTuber 支持 voice interruption without headphones"
common_misunderstandings:
  - "不是简单地静音麦克风，而是需要复杂的音频处理来避免 AI 听见自己"
open_questions:
  - "如何在不使用耳机的情况下避免自反馈？"
---

## Explanation

AI 在说话时能够被用户语音输入打断，无需物理按钮或关键词，类似人与人对话的自然打断。实现需处理音频流回波消除和状态机。 出处:https://github.com/open-llm-vtuber/open-llm-vtuber。See [[content/open-llm-vtuber]]。

## Supported by
- [[claims/open-llm-vtuber-main-claim]]
