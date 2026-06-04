---
name: "实时目录"
slug: "live-catalog"
kind: "concept"
tags:
  - "discovery"
  - "runtime"
maturity: "active"
first_seen_in: "iii"
related_content:
  - "iii"
related_concepts: []
explanation: "所有注册的 Worker 及其 Function 组成一个动态更新的目录。当新 Worker 加入或离开，所有其它 Worker 都能感知并立即调用其函数。代理也使用同一目录发现能力。"
examples:
  - "添加一个队列 Worker 后，其他 Worker 可以直接调用其入队函数"
common_misunderstandings:
  - "目录是运行时的，不是静态配置，Worker 可动态增删"
  - "目录不仅包含函数签名，还可能包含触发条件、状态等元数据"
open_questions:
  - "目录如何实现（广播、集中注册？）"
  - "大数量 Worker 下的性能如何？"
---

## Explanation

所有注册的 Worker 及其 Function 组成一个动态更新的目录。当新 Worker 加入或离开，所有其它 Worker 都能感知并立即调用其函数。代理也使用同一目录发现能力。 出处:https://github.com/iii-hq/iii。See [[content/iii]]。

## Supported by
- [[claims/iii-main-claim]]
