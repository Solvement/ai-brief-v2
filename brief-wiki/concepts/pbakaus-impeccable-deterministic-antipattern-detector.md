---
name: "Deterministic anti-pattern detector"
slug: "pbakaus-impeccable-deterministic-antipattern-detector"
kind: "concept"
tags:
  - "lint"
  - "frontend"
  - "design-quality"
maturity: "active"
first_seen_in: "pbakaus-impeccable"
related_content:
  - "pbakaus-impeccable"
related_concepts: []
explanation: "人话：不用 LLM，直接扫描源码或渲染页面，找作者定义的设计坏味道。术语：registry 中的 `ANTIPATTERNS` 定义 rule id/category/name/description，CLI 用 static HTML、regex、browser engines 产生 findings。"
examples:
  - "`overused-font` 检测 Inter/Roboto/Fraunces/Geist/Plus Jakarta Sans/Space Grotesk"
  - "`flat-type-hierarchy` 输出 `Sizes: 13px, 14px, 15px, 16px, 18px (ratio 1.4:1)`"
common_misunderstandings:
  - "detector findings 不是审美真理，只是项目作者定义的规则命中。"
  - "README 的 24/27 规则数不是当前 registry 的真实数量。"
open_questions:
  - "真实项目误报/漏报率未在 README/docs/tree 说明。"
---

## Explanation

人话：不用 LLM，直接扫描源码或渲染页面，找作者定义的设计坏味道。术语：registry 中的 `ANTIPATTERNS` 定义 rule id/category/name/description，CLI 用 static HTML、regex、browser engines 产生 findings。 出处:https://github.com/pbakaus/impeccable。See [[content/pbakaus-impeccable]]。

## Supported by
- [[claims/pbakaus-impeccable-main-claim]]
