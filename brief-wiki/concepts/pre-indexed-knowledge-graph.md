---
name: "预索引知识图谱"
slug: "pre-indexed-knowledge-graph"
kind: "concept"
tags:
  - "code-intelligence"
  - "performance-optimization"
  - "agent-tool"
maturity: "active"
first_seen_in: "codegraph"
related_content:
  - "codegraph"
related_concepts: []
explanation: "在 AI 助手开始工作前，先对整个代码库做静态分析，生成包含符号、调用关系、路由等的结构化图谱并存入数据库。后续查询时无需扫描文件，直接检索图谱，大幅降低 token 和工具调用。"
examples:
  - "CodeGraph 在 VS Code 仓库上，agent 用 `codegraph_explore` 一次性获得扩展宿主通信的完整调用链，0 次文件读取。"
common_misunderstandings:
  - "不是代码生成，不修改源码；不替代 agent 的推理，只提供上下文。"
  - "索引是本地独立进程，不依赖外部服务。图谱可能不是实时，依赖于同步机制。"
open_questions:
  - "对于动态类型语言或大量运行时反射的代码，静态解析的图谱能覆盖多少真实调用关系？"
  - "如何评估图谱的召回率与准确率对 agent 最终回答质量的影响？"
---

## Explanation

在 AI 助手开始工作前，先对整个代码库做静态分析，生成包含符号、调用关系、路由等的结构化图谱并存入数据库。后续查询时无需扫描文件，直接检索图谱，大幅降低 token 和工具调用。 出处:https://github.com/colbymchenry/codegraph。See [[content/codegraph]]。

## Supported by
- [[claims/codegraph-main-claim]]
