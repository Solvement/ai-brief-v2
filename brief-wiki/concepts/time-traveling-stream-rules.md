---
name: "流式规则注入"
slug: "time-traveling-stream-rules"
kind: "concept"
tags:
  - "safety"
  - "prompt-engineering"
  - "streaming"
maturity: "active"
first_seen_in: "oh-my-pi"
related_content:
  - "oh-my-pi"
related_concepts: []
explanation: "在模型生成输出过程中实时监测 token 流，一旦匹配到用户定义的正则规则，立即中断生成，注入系统提醒，然后从断点重试。规则在上下文压缩后仍保留。"
examples:
  - "README 示例：代理想写 Box::leak 时被规则拦截并引导改用 Arc<str>"
  - "避免每次对话都携带冗长的规则描述，只按需触发"
common_misunderstandings:
  - "并不是在事后审查，而是在生成过程中实时打断，所以能影响当前输出。"
  - "规则只作用于模型输出，不能阻止用户输入的不安全操作。"
open_questions:
  - "正则匹配对多语言代码的覆盖度如何？"
  - "中断重试在响应延迟上的额外开销多大？"
---

## Explanation

在模型生成输出过程中实时监测 token 流，一旦匹配到用户定义的正则规则，立即中断生成，注入系统提醒，然后从断点重试。规则在上下文压缩后仍保留。 出处:https://github.com/can1357/oh-my-pi。See [[content/oh-my-pi]]。

## Supported by
- [[claims/oh-my-pi-main-claim]]
