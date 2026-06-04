---
name: "技能目录"
slug: "agent-skills-catalog"
kind: "concept"
tags:
  - "tool-use"
  - "modularity"
maturity: "stable"
first_seen_in: "ecc"
related_content:
  - "ecc"
related_concepts: []
explanation: "将常见任务封装为独立的、可调用的技能文件，通过 slash 命令触发，可组合成复杂工作流。"
examples:
  - "search-first 技能指导助手优先搜索现有代码而非从头编写"
  - "parallel-execution-optimizer 将重复的优化提示转为基准工作流"
common_misunderstandings:
  - "技能并非微服务或独立进程，它只是一组指令和脚本，运行时受宿主助手解释。"
open_questions:
  - "技能之间如何传递数据和状态？"
  - "技能的使用是否有权限控制和成本限制？"
---

## Explanation

将常见任务封装为独立的、可调用的技能文件，通过 slash 命令触发，可组合成复杂工作流。 出处:https://github.com/affaan-m/ecc。See [[content/ecc]]。

## Supported by
- [[claims/ecc-main-claim]]
