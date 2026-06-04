---
text: "SenseVoice-Small 模型在 GPU 上达到 170 倍实时速度"
slug: "funasr-main-claim"
kind: "claim"
content: "funasr"
source_pointer: "README Benchmark 表格"
evidence_strength: "high"
supports:
  - "automodel-pipeline"
  - "non-autoregressive-asr"
contradicts: []
open_challenges:
  - "未说明具体 GPU 型号、CPU 型号、音频采样率、批次大小等条件"
  - "测试环境可能非典型，实际应用场景速度可能低于宣称；未提供端到端延迟（包括模型加载）"
status: "supported"
---

## Claim

处理 1 小时的音频，该模型仅需要 21 秒（60×60/170）

证据:表格中给出 GPU Speed 为 170x realtime，且注明对比 Whisper-large-v3 的 baseline 13x 快 13 倍。边界:未说明具体 GPU 型号、CPU 型号、音频采样率、批次大小等条件。风险:测试环境可能非典型，实际应用场景速度可能低于宣称；未提供端到端延迟（包括模型加载）。See [[content/funasr]]。
