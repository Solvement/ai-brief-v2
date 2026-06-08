---
slug: "yikart-aitoearn-repo"
kind: "artifact"
content: "yikart-aitoearn"
artifact_type: "repo"
url: "https://github.com/yikart/AiToEarn"
official_or_third_party: "official"
status: "available"
license: "MIT"
runnable: "unknown"
missing_parts:
  - "未实际运行 Docker Compose 或测试套件"
  - "AI 功能需要真实 OPENAI/ANTHROPIC/GROK/GEMINI/VOLCENGINE/DASHSCOPE 等密钥"
  - "自部署社交账号授权需要 Relay 或各平台 OAuth client_id/secret"
  - "商业结算闭环、平台发布成功率和线上 MCP 可用性未在本次源码检查中验证"
last_checked: "2026-06-08"
---

## Artifact audit

已按要求 clone/read 真实上游仓库到 `logs/codex-deepdive-20260608-backlog-12/yikart-aitoearn/checkout`。本次检查覆盖 README、Docker 部署文档、docker-compose、package.json、Agent runtime、MCP controllers、平台配置、技能文件和测试文件；未编辑 AI-Brief workspace。

出处:https://github.com/yikart/aitoearn。See [[content/yikart-aitoearn]]。
