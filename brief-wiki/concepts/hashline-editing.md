---
name: "Hashline 编辑"
slug: "hashline-editing"
kind: "concept"
tags:
  - "editing"
  - "agent"
  - "token-optimization"
maturity: "active"
first_seen_in: "oh-my-pi"
related_content:
  - "oh-my-pi"
related_concepts: []
explanation: "一种编辑格式，模型通过提供待修改行的内容哈希（锚点）而不是完整行内容来定位修改位置。代理在应用前验证哈希，避免因文件并发修改导致的错误。"
examples:
  - "README 提到 Grok 4 Fast 使用后输出 token 减少 61%"
  - "传统 diff 格式匹配失败时 hashline 可以快速拒绝过期锚点"
common_misunderstandings:
  - "不是用哈希唯一标识行，而是在生成的编辑命令中引用现有多行内容哈希来定位；仍需要模型输出替换内容。"
  - "依赖文件内容稳定，频繁变更的文件可能导致锚点频繁失效。"
open_questions:
  - "如何处理同一哈希对应多行的情况？"
  - "在大规模重构中锚点失效比例如何？"
---

## Explanation

一种编辑格式，模型通过提供待修改行的内容哈希（锚点）而不是完整行内容来定位修改位置。代理在应用前验证哈希，避免因文件并发修改导致的错误。 出处:https://github.com/can1357/oh-my-pi。See [[content/oh-my-pi]]。

## Supported by
- [[claims/oh-my-pi-main-claim]]
