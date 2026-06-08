---
name: "GUI Agent"
slug: "gui-agent"
kind: "concept"
tags:
  - "agent"
  - "multimodal"
  - "automation"
maturity: "active"
first_seen_in: "bytedance-ui-tars-desktop"
related_content:
  - "bytedance-ui-tars-desktop"
related_concepts: []
explanation: "人话：让模型像人一样看屏幕、点按钮、输入文字。技术定义：一个循环系统，输入用户任务和截图，模型输出动作，operator 把动作映射到鼠标/键盘/浏览器/设备 API。"
examples:
  - "UI-TARS `GUIAgent.run()` 调截图、VLM、action parser、operator.execute。"
common_misunderstandings:
  - "不是只靠 prompt；坐标转换、权限、动作解析和执行器同样关键。"
open_questions:
  - "不同 VLM provider 的动作格式兼容性如何长期维护？"
---

## Explanation

人话：让模型像人一样看屏幕、点按钮、输入文字。技术定义：一个循环系统，输入用户任务和截图，模型输出动作，operator 把动作映射到鼠标/键盘/浏览器/设备 API。 出处:https://github.com/bytedance/ui-tars-desktop。See [[content/bytedance-ui-tars-desktop]]。

## Supported by
- [[claims/bytedance-ui-tars-desktop-main-claim]]
