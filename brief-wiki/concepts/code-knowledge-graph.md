---
name: "代码知识图谱"
slug: "code-knowledge-graph"
kind: "concept"
tags:
  - "static-analysis"
  - "agent-context"
  - "sqlite"
maturity: "active"
first_seen_in: "colbymchenry-codegraph"
related_content:
  - "colbymchenry-codegraph"
related_concepts: []
explanation: "人话：把代码里的函数、类、文件和调用关系做成可查询的图。术语：CodeGraph 用 nodes/edges/files/unresolved_refs 表表达 symbol、依赖、调用和待解析引用。"
examples:
  - "codegraph_callers 查询谁调用某个函数"
  - "codegraph_impact 查询改一个 symbol 会影响哪些节点"
common_misunderstandings:
  - "不是向量库同义词；它强调结构边而不是只做相似度。"
  - "不是类型检查器；源码限制里写明正确性仍要靠编译器、测试和 lint。"
open_questions:
  - "动态语言和框架反射场景的覆盖边界需要按项目复测。"
---

## Explanation

人话：把代码里的函数、类、文件和调用关系做成可查询的图。术语：CodeGraph 用 nodes/edges/files/unresolved_refs 表表达 symbol、依赖、调用和待解析引用。 出处:https://github.com/colbymchenry/codegraph。See [[content/colbymchenry-codegraph]]。

## Supported by
- [[claims/colbymchenry-codegraph-main-claim-2]]
