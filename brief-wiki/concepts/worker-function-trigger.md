---
name: "Worker-Function-Trigger 原语"
slug: "worker-function-trigger"
kind: "concept"
tags:
  - "architecture"
  - "abstraction"
  - "backend"
maturity: "active"
first_seen_in: "iii"
related_content:
  - "iii"
related_concepts: []
explanation: "将后端任意能力抽象为三个概念：Worker（进程，负责注册）、Function（工作单元，有唯一标识）、Trigger（触发条件，声明式）。所有服务都通过这套原语接入运行时，实现零集成组合。"
examples:
  - "一个 TypeScript API 服务可以是一个 Worker，内部注册了 `content::classify` 函数，通过 HTTP 端点触发"
common_misunderstandings:
  - "Worker 不是微服务，不强制独立部署，可以是一个进程内的组件"
  - "Trigger 类型很多，但 iii 仅承诺统一路由和交付，不负责实现具体触发逻辑"
open_questions:
  - "是否支持流式输出和 Server-Sent Events？"
  - "如何保证跨 Worker 调用的顺序性？"
---

## Explanation

将后端任意能力抽象为三个概念：Worker（进程，负责注册）、Function（工作单元，有唯一标识）、Trigger（触发条件，声明式）。所有服务都通过这套原语接入运行时，实现零集成组合。 出处:https://github.com/iii-hq/iii。See [[content/iii]]。

## Supported by
- [[claims/iii-main-claim]]
