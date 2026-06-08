---
name: "Agent skill command router"
slug: "pbakaus-impeccable-agent-skill-command-router"
kind: "concept"
tags:
  - "agent-workflow"
  - "skills"
  - "prompt-architecture"
maturity: "active"
first_seen_in: "pbakaus-impeccable"
related_content:
  - "pbakaus-impeccable"
related_concepts: []
explanation: "人话：一个 skill 入口承接多个用户动作，先统一做上下文加载，再按第一个词路由到具体参考文件。术语：`skill/SKILL.src.md` 的 Routing rules 把 `craft/audit/polish/live` 等子命令映射到 `reference/<command>.md`。"
examples:
  - "`/impeccable audit the header` 读取 `reference/audit.md`"
  - "`/impeccable pin audit` 调用 `node {{scripts_path}}/pin.mjs <pin|unpin> <command>`"
common_misunderstandings:
  - "不是每个命令都是独立二进制程序；很多命令是 agent workflow reference。"
  - "不是 UI 组件库。"
open_questions:
  - "不同 harness 对同一个 routing prompt 的执行一致性如何量化，repo 未给 benchmark。"
---

## Explanation

人话：一个 skill 入口承接多个用户动作，先统一做上下文加载，再按第一个词路由到具体参考文件。术语：`skill/SKILL.src.md` 的 Routing rules 把 `craft/audit/polish/live` 等子命令映射到 `reference/<command>.md`。 出处:https://github.com/pbakaus/impeccable。See [[content/pbakaus-impeccable]]。

## Supported by
- [[claims/pbakaus-impeccable-main-claim]]
