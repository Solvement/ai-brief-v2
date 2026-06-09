---
name: "统一读取路径"
slug: "unified-read-path"
kind: "concept"
tags:
  - "tool-design"
  - "retrieval"
  - "agent-runtime"
maturity: "active"
first_seen_in: "can1357-oh-my-pi"
related_content:
  - "can1357-oh-my-pi"
related_concepts: []
explanation: "`read({path})` 统一处理本地文件、URL、SQLite、归档和内部协议；白话说，模型只学一个读取动作。"
examples:
  - "`memory://root/MEMORY.md` 读取长期记忆。"
  - "`agent://<id>/<path>` 从子代理 JSON 输出里抽字段。"
common_misunderstandings:
  - "统一 path 不等于所有格式都可靠；转换失败仍会返回不可读提示。"
open_questions:
  - "URL/PDF/Office 转换在生产数据上的失败率未知。"
---

## Explanation

`read({path})` 统一处理本地文件、URL、SQLite、归档和内部协议；白话说，模型只学一个读取动作。 出处:https://github.com/can1357/oh-my-pi。See [[content/can1357-oh-my-pi]]。

## Supported by
- [[claims/can1357-oh-my-pi-main-claim-2]]
