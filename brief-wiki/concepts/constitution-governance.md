---
name: "宪法治理"
slug: "constitution-governance"
kind: "concept"
tags:
  - "prompt-engineering"
  - "safety"
  - "governance"
maturity: "emerging"
first_seen_in: "codewhale"
related_content:
  - "codewhale"
related_concepts: []
explanation: "通过在系统提示中嵌入一个具有明确法律优先级的宪法文本，解决 LLM 代理在多轮交互中指令冲突的问题。宪法规定不同信息来源（用户、系统、工具输出等）的权威层级，保证模型遵循正确的指令。"
examples:
  - "CodeWhale 的 prompts/base.md 定义了九级法律体系，Article II 甚至规定真理优先于用户请求。"
common_misunderstandings:
  - "宪法只是静态系统提示，并不能适应动态环境；宪法需要严格的设计和模型配合，否则可能被忽略。"
open_questions:
  - "宪法的有效性能否在公开基准上量化？"
  - "如何平衡宪法的详尽程度与上下文窗口限制？"
---

## Explanation

通过在系统提示中嵌入一个具有明确法律优先级的宪法文本，解决 LLM 代理在多轮交互中指令冲突的问题。宪法规定不同信息来源（用户、系统、工具输出等）的权威层级，保证模型遵循正确的指令。 出处:https://github.com/hmbown/codewhale。See [[content/codewhale]]。

## Supported by
- [[claims/codewhale-main-claim]]
