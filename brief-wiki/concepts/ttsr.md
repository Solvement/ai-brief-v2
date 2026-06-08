---
name: "Time Traveling Stream Rules"
slug: "ttsr"
kind: "concept"
tags:
  - "runtime-guardrail"
  - "streaming"
  - "rules"
maturity: "emerging"
first_seen_in: "can1357-oh-my-pi"
related_content:
  - "can1357-oh-my-pi"
related_concepts: []
explanation: "人话：模型刚开始写错方向时就拦截并提醒，而不是等错误生成完。术语：规则有 `condition`、`scope`、`interruptMode`；stream delta 命中后可 abort、插入 `<system-interrupt>` 或 `<system-reminder>`，再继续生成。"
examples:
  - "`.omp/rules/ts-hook-fetch.md` 禁止在测试里 `globalThis.fetch =` 或 `vi.spyOn(globalThis, \"fetch\")`"
  - "`docs/ttsr-injection-lifecycle.md` 的 50ms retry injection flow"
common_misunderstandings:
  - "不是静态 lint；它运行在 assistant/token/tool stream 上。"
  - "不是所有规则都会进 `rule://`，TTSR-only 规则不在 rulebook URL 中。"
open_questions:
  - "`TtsrSettings.enabled` 未 gating 的 caveat 是否会改变。"
---

## Explanation

人话：模型刚开始写错方向时就拦截并提醒，而不是等错误生成完。术语：规则有 `condition`、`scope`、`interruptMode`；stream delta 命中后可 abort、插入 `<system-interrupt>` 或 `<system-reminder>`，再继续生成。 出处:https://github.com/can1357/oh-my-pi。See [[content/can1357-oh-my-pi]]。

## Supported by
- [[claims/can1357-oh-my-pi-main-claim]]
