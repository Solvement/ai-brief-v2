---
name: "Mandate-Gated Trading"
slug: "mandate-gated-trading"
kind: "concept"
tags:
  - "agent"
  - "safety"
  - "trading"
maturity: "active"
first_seen_in: "vibe-trading"
related_content:
  - "vibe-trading"
related_concepts: []
explanation: "用户在代理执行交易前预先提交一份结构化授权（mandate），指定允许的交易标的、单笔规模、总敞口、杠杆倍数、日交易上限。代理所有交易请求必须通过 mandate 检查，同时设有文件系统 kill switch 和审计日志。这实现了 LLM 代理的约束自主。"
examples:
  - "用户设定 mandate：symbols=[AAPL, TSLA], max_order_size=10, max_exposure=100000, leverage=1, daily_cap=5000。代理试图下单 20 股 TSLA 会被拒绝。"
common_misunderstandings:
  - "mandate 不是法律约束，仍依赖软件实现正确性；"
  - "不能防止所有意外损失，如市场闪崩时仍可能在 mandate 内亏损。"
open_questions:
  - "mandate 配置错误（如限制过宽）的检测与提醒机制？"
  - "在多个代理同时运行时，mandate 如何聚合？"
---

## Explanation

用户在代理执行交易前预先提交一份结构化授权（mandate），指定允许的交易标的、单笔规模、总敞口、杠杆倍数、日交易上限。代理所有交易请求必须通过 mandate 检查，同时设有文件系统 kill switch 和审计日志。这实现了 LLM 代理的约束自主。 出处:https://github.com/hkuds/vibe-trading。See [[content/vibe-trading]]。

## Supported by
- [[claims/vibe-trading-main-claim]]
