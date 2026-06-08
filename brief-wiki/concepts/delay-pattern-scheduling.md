---
name: "Delay-Pattern Scheduling"
slug: "delay-pattern-scheduling"
kind: "concept"
tags:
  - "autoregressive"
  - "rvq"
  - "inference"
maturity: "active"
first_seen_in: "openmoss-moss-tts"
related_content:
  - "openmoss-moss-tts"
related_concepts: []
explanation: "人话：不按 32 个码本一层层慢慢生成，而是把不同码本错开一个时间步，让 33 个 head 并行吐下一帧相关 token。技术定义：Head 1 预测 Frame t 的 Layer 1，Head 2 预测 Frame t-1 的 Layer 2，依此类推；代码里 `delay_step` 每次返回 `[text_token, audio_0, ..., audio_31]`。（来源：moss_tts_delay/README.md Prediction Topology；moss_tts_delay/llama_cpp/delay_state.py step）"
examples:
  - "`moss_tts_delay/llama_cpp/processor.py` 的 `apply_delay_pattern(codes, AUDIO_PAD_CODE)` 用于把参考音频 codes 放入 multi-channel prompt。"
  - "`AUDIO_ASSISTANT_DELAY_SLOT_TOKEN_ID` 用于音频结束后的 delay slot flush。（来源：moss_tts_delay/llama_cpp/delay_state.py）"
common_misunderstandings:
  - "Delay-pattern 不是音频播放延迟，而是训练/推理序列排布方式。"
  - "并行预测 RVQ heads 不等于整个音频非自回归；时间维仍是 autoregressive loop。"
open_questions:
  - "仓库未给出 delay-pattern 与 local architecture 在同一硬件同一输入上的独立可复现延迟日志。"
---

## Explanation

人话：不按 32 个码本一层层慢慢生成，而是把不同码本错开一个时间步，让 33 个 head 并行吐下一帧相关 token。技术定义：Head 1 预测 Frame t 的 Layer 1，Head 2 预测 Frame t-1 的 Layer 2，依此类推；代码里 `delay_step` 每次返回 `[text_token, audio_0, ..., audio_31]`。（来源：moss_tts_delay/README.md Prediction Topology；moss_tts_delay/llama_cpp/delay_state.py step） 出处:https://github.com/openmoss/moss-tts。See [[content/openmoss-moss-tts]]。

## Supported by
- [[claims/openmoss-moss-tts-main-claim]]
