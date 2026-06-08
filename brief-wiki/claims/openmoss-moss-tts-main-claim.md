---
text: "MOSS-TTS-v1.5 支持 31 languages，并保留 MOSS-TTS 1.0 的 20 languages。"
slug: "openmoss-moss-tts-main-claim"
kind: "claim"
content: "openmoss-moss-tts"
source_pointer: "README Supported Languages；docs/moss_tts_model_card.md 1.5 Supported Languages"
evidence_strength: "medium"
supports:
  - "residual-vector-quantization"
  - "delay-pattern-scheduling"
contradicts: []
open_challenges:
  - "没有在仓库内看到逐语言测试集、复现实验脚本或每种语言的样例音频生成结果。"
  - "语言覆盖不等于每种语言质量相同；未跑权重。"
status: "supported"
---

## Claim

作者说 v1.5 覆盖 31 种语言，README 还列出了 zh、yue、en、ar、cs、da、nl、fi、fr、de、el、he、hi、hu、it、ja、ko、mk、ms、fa、pl、pt、ro、ru、es、sw、sv、tl、th、tr、vi。

证据:README 和 model card 的语言表与“31 languages”文字一致。。边界:没有在仓库内看到逐语言测试集、复现实验脚本或每种语言的样例音频生成结果。。风险:语言覆盖不等于每种语言质量相同；未跑权重。。See [[content/openmoss-moss-tts]]。
