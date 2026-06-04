---
name: "人性化行为模拟"
slug: "humanize"
kind: "concept"
tags:
  - "humanization"
  - "anti-bot"
maturity: "active"
first_seen_in: "cloakbrowser"
related_content:
  - "cloakbrowser"
related_concepts: []
explanation: "在自动化操作中加入人类用户的典型行为模式，如贝塞尔曲线鼠标移动、随机键盘延迟、真实滚动模式，以规避行为分析。"
examples:
  - "CloakBrowser 的 humanize=True 自动实现所有交互人性化。"
common_misunderstandings:
  - "简单随机延迟不足以对抗机器学习行为模型。"
open_questions:
  - "行为模拟是否能持续对抗不断进化的检测算法？"
---

## Explanation

在自动化操作中加入人类用户的典型行为模式，如贝塞尔曲线鼠标移动、随机键盘延迟、真实滚动模式，以规避行为分析。 出处:https://github.com/cloakhq/cloakbrowser。See [[content/cloakbrowser]]。

## Supported by
- [[claims/cloakbrowser-main-claim]]
