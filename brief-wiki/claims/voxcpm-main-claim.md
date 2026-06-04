---
text: "VoxCPM 是无 tokenizer 的端到端 TTS"
slug: "voxcpm-main-claim"
kind: "claim"
content: "voxcpm"
source_pointer: "README 第一段"
evidence_strength: "high"
supports:
  - "tokenizer-free-tts"
  - "voice-design"
contradicts: []
open_challenges:
  - "未提供与传统 TTS 的主观对比实验"
  - "未公开详细架构和数据可能导致他人无法复现"
status: "supported"
---

## Claim

直接生成连续语音，不经过离散音素等中间表示，语音更自然。

证据:技术报告和架构描述（未在 README 详细给出，但提及 diffusion autoregressive 和 tokenizer-free）。边界:未提供与传统 TTS 的主观对比实验。风险:未公开详细架构和数据可能导致他人无法复现。See [[content/voxcpm]]。
