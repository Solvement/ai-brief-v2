---
name: "可插拔数据丰富器"
slug: "enricher-pattern"
kind: "concept"
tags:
  - "agent-tools"
  - "modularity"
  - "pipeline"
maturity: "active"
first_seen_in: "flowsint"
related_content:
  - "flowsint"
related_concepts: []
explanation: "将数据转换步骤封装为独立模块，遵循统一接口（如接收实体，返回新实体或关系），由中心调度器自动调用，实现探索流水线的可扩展性。"
examples:
  - "Domain to IP enricher: 输入 domain，查询 DNS，输出 IP 实体并建立 'points_to' 关系。"
common_misunderstandings:
  - "enricher 不是一次性脚本，它是集成到工作流中的可复用组件，需要处理错误和限流。"
open_questions:
  - "如何标准化 enricher 的输入上下文（如调查会话）？"
  - "失败重试、速率限制的最佳实现模式？"
---

## Explanation

将数据转换步骤封装为独立模块，遵循统一接口（如接收实体，返回新实体或关系），由中心调度器自动调用，实现探索流水线的可扩展性。 出处:https://github.com/reconurge/flowsint。See [[content/flowsint]]。

## Supported by
- [[claims/flowsint-main-claim]]
