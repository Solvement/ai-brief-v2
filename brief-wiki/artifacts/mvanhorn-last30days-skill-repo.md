---
slug: "mvanhorn-last30days-skill-repo"
kind: "artifact"
content: "mvanhorn-last30days-skill"
artifact_type: "repo"
url: "https://github.com/mvanhorn/last30days-skill"
official_or_third_party: "official"
status: "available"
license: "MIT"
runnable: "yes"
missing_parts:
  - "真实全源运行需要外部 API keys、browser cookies、yt-dlp、Node 或 gh 等条件；本次只运行了 `--help` 和测试。"
  - "Windows/Python 3.14.3 下完整 pytest 未全绿：1602 passed, 15 failed, 4 skipped。"
  - "README 的部分源优先级/架构说明与当前代码存在轻微不一致，需要维护者确认。"
last_checked: "2026-06-09"
---

## Artifact audit

已克隆并检查真实上游 checkout `122158415ae421da83e739f2668032f6bc78d39c`，版本 `3.3.2`。这是一个 MIT 许可的多源 agent research skill，工程结构完整、可运行入口存在，但生产可靠性受外部平台和宿主 agent 行为影响较大。

出处:https://github.com/mvanhorn/last30days-skill。See [[content/mvanhorn-last30days-skill]]。
