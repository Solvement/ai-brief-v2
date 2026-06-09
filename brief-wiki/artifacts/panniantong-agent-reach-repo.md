---
slug: "panniantong-agent-reach-repo"
kind: "artifact"
content: "panniantong-agent-reach"
artifact_type: "repo"
url: "https://github.com/Panniantong/Agent-Reach"
official_or_third_party: "official"
status: "partial"
license: "MIT"
runnable: "yes"
missing_parts:
  - "当前 checkout 直接跑 `python -m pytest -q` 为 78 passed, 7 failed；未在按 constraints 安装的干净虚拟环境复测。"
  - "多个可选渠道需要用户 cookie、Groq Key、代理、ffmpeg、Node/Deno、mcporter 或第三方 MCP 服务。"
  - "README/Skill 平台数量与代码注册数量不一致。"
  - "Douyin 的 install 文档和 Skill 参考对 HTTP/stdio 配置说法冲突。"
last_checked: "2026-06-08"
---

## Artifact audit

已克隆真实上游仓库到指定 checkout，并检查 README、docs、pyproject、config、agent_reach 源码、Skill references 和 tests。该项目适合作为 AI Agent 多平台工具接入脚手架参考，但不应按“稳定统一互联网 API”理解。

出处:https://github.com/panniantong/agent-reach。See [[content/panniantong-agent-reach]]。
