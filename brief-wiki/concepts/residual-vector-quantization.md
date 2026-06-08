---
name: "RVQ（Residual Vector Quantization）"
slug: "residual-vector-quantization"
kind: "concept"
tags:
  - "audio-tokenizer"
  - "tts"
  - "discrete-audio"
maturity: "active"
first_seen_in: "openmoss-moss-tts"
related_content:
  - "openmoss-moss-tts"
related_concepts: []
explanation: "人话：把连续音频压成多层离散编号，模型生成编号，再由 codec 还原成波形。技术定义：MossTTSDelay 文档写 `Codebooks` 为 32 RVQ layers，10-bit each；frame rate 12.5 Hz，所以 README 的 `tokens` 时长控制使用 `1s ≈ 12.5 tokens`。（来源：moss_tts_delay/README.md Technical Specifications；docs/moss_tts_model_card.md Input Types）"
examples:
  - "`tokens=325` 和 `tokens=600` 控制同一段英文生成不同目标 token 数。（来源：README MOSS-TTS Basic Usage）"
  - "`n_vq_for_inference=4` 或 32 在 MossTTSLocal 中控制低/高 bitrate。（来源：moss_tts_local/README.md Progressive Sequence Dropout）"
common_misunderstandings:
  - "RVQ token 不是文本 token；它是音频 tokenizer 的离散码。"
  - "12.5 tokens/s 是该 tokenizer/模型文档中的换算，不是所有 TTS 的通用规律。"
open_questions:
  - "MOSS-Audio-Tokenizer 子模块未初始化，tokenizer 的完整训练/评估实现需另查。"
---

## Explanation

人话：把连续音频压成多层离散编号，模型生成编号，再由 codec 还原成波形。技术定义：MossTTSDelay 文档写 `Codebooks` 为 32 RVQ layers，10-bit each；frame rate 12.5 Hz，所以 README 的 `tokens` 时长控制使用 `1s ≈ 12.5 tokens`。（来源：moss_tts_delay/README.md Technical Specifications；docs/moss_tts_model_card.md Input Types） 出处:https://github.com/openmoss/moss-tts。See [[content/openmoss-moss-tts]]。

## Supported by
- [[claims/openmoss-moss-tts-main-claim]]
