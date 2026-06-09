---
name: "Channel 健康检查"
slug: "panniantong-agent-reach-channel-health-check"
kind: "concept"
tags:
  - "observability"
  - "integration"
  - "platform-risk"
maturity: "active"
first_seen_in: "panniantong-agent-reach"
related_content:
  - "panniantong-agent-reach"
related_concepts: []
explanation: "先人话：每个平台先问“能不能用”，再决定怎么用。术语：每个 channel 实现 `check(config)`，返回 ok、warn、off、error。"
examples:
  - "Twitter channel 调 `twitter status`"
  - "Reddit channel 调 `rdt status --json`"
  - "Douyin channel 调 `mcporter list douyin`"
common_misunderstandings:
  - "健康检查通过不等于平台所有动作都稳定"
  - "warn 不是失败，通常表示需登录或配置"
open_questions:
  - "是否需要真实端到端 smoke test 覆盖外部平台"
---

## Explanation

先人话：每个平台先问“能不能用”，再决定怎么用。术语：每个 channel 实现 `check(config)`，返回 ok、warn、off、error。 出处:https://github.com/panniantong/agent-reach。See [[content/panniantong-agent-reach]]。

## Supported by
- [[claims/panniantong-agent-reach-main-claim]]
