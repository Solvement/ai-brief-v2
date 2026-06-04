---
text: "完整的 MVC 架构，代码结构清晰，易于维护，支持 API 和 Web 界面。"
slug: "moneyprinterturbo-main-claim"
kind: "claim"
content: "moneyprinterturbo"
source_pointer: "README 功能特性。"
evidence_strength: "medium"
supports:
  - "video-generation-pipeline"
  - "llm-provider-adaptation"
contradicts: []
open_challenges:
  - "未在 README/artifact 中看到关于 MVC 架构的具体模块说明或代码示例。"
  - "架构清晰性无法仅从 README 验证，需审查 app/ 内模块划分是否真正遵从 MVC。"
status: "supported"
---

## Claim

项目代码组织良好，提供 Web 界面和编程接口两种使用方式。

证据:源码目录存在 app/、webui/ 等，README 有 WebUI 和 API 截图。。边界:未在 README/artifact 中看到关于 MVC 架构的具体模块说明或代码示例。。风险:架构清晰性无法仅从 README 验证，需审查 app/ 内模块划分是否真正遵从 MVC。。See [[content/moneyprinterturbo]]。
