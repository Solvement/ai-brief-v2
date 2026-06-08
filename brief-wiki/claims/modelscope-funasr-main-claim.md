---
text: "“比 Whisper 快 170 倍、支持 50+ 语言”。"
slug: "modelscope-funasr-main-claim"
kind: "claim"
content: "modelscope-funasr"
source_pointer: "README 顶部标语；README Why FunASR 表格"
evidence_strength: "medium"
supports:
  - "automatic-speech-recognition"
  - "voice-activity-detection"
contradicts: []
open_challenges:
  - "本次没有运行 benchmark，也没有核验 50+ 语言清单覆盖质量。"
  - "速度数字依赖硬件、模型、batch、warmup、音频分布；语言数量不等于每种语言质量一致。"
status: "supported"
---

## Claim

项目首页把 FunASR 定位成高吞吐、多语言的私有语音识别工具。

证据:README 明确写 `170x faster than Whisper`、`50+ languages`，中文 README 写“比 Whisper 快 170 倍。支持 50+ 语言”。。边界:本次没有运行 benchmark，也没有核验 50+ 语言清单覆盖质量。。风险:速度数字依赖硬件、模型、batch、warmup、音频分布；语言数量不等于每种语言质量一致。。See [[content/modelscope-funasr]]。
