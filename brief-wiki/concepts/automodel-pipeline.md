---
name: "AutoModel 自动组装流水线"
slug: "automodel-pipeline"
kind: "concept"
tags:
  - "api-design"
  - "pipeline"
  - "model-management"
maturity: "stable"
first_seen_in: "funasr"
related_content:
  - "funasr"
related_concepts: []
explanation: "通过一个简洁的 API 调用，自动加载指定模型和可选辅助模型，构建完整的语音处理管道。用户无需手动配置各组件。"
examples:
  - "model = AutoModel(model='iic/SenseVoiceSmall', vad_model='fsmn-vad', spk_model='cam++')"
common_misunderstandings:
  - "AutoModel 不能任意组合所有模型，参数需受支持的模型名称"
open_questions:
  - "如何动态注册自定义模型到 AutoModel 体系中？"
---

## Explanation

通过一个简洁的 API 调用，自动加载指定模型和可选辅助模型，构建完整的语音处理管道。用户无需手动配置各组件。 出处:https://github.com/modelscope/funasr。See [[content/funasr]]。

## Supported by
- [[claims/funasr-main-claim]]
