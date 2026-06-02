---
name: "供应链加固 (supply-chain hardening)"
slug: supply-chain-hardening
kind: concept
tags:
  - security
  - dependency-management
maturity: stable
first_seen_in: pi-agent
related_content:
  - pi-agent
explanation: "通过依赖精确锁版本、锁文件锁定传递依赖(如 npm-shrinkwrap)、预提交锁文件校验、定时漏洞审计(npm audit)、隔离发布冒烟测试,降低『依赖被投毒/被篡改』的供应链风险。"
examples:
  - "pi:exact pinning + npm-shrinkwrap + scheduled npm audit + isolated release smoke test。出处:github.com/badlogic/pi-mono README。"
common_misunderstandings:
  - "锁版本 ≠ 绝对安全:仍需定时审计与升级;且执行不可信代码的 agent 另有运行时风险。"
open_questions:
  - "AI-Brief(目前仅依赖 react/yaml 等少量包)要不要也上 shrinkwrap + 定时 audit 作为基线纪律?"
---

## Explanation

对一个会执行代码、还可能引入大量依赖的 AI 项目,供应链加固是基线安全纪律。pi 把它做成了个人项目里少见的一等公民,值得 AI-Brief 借鉴(尤其当我们引入更多 npm 依赖时)。出处:github.com/badlogic/pi-mono。See [[content/pi-agent]]。
