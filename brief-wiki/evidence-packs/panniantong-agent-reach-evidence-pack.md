---
content: "panniantong-agent-reach"
kind: "evidence-pack"
title: "Agent-Reach — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "tool"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Agent Reach 是给 AI Agent 装互联网工具箱的安装器和健康检查 CLI，不是把所有平台重新封装成一个 SDK。"
    internal_logic: "真实流：用户让 Agent 查 Reddit bug 讨论时，Skill 先路由到 social 文档；Agent 调 `rdt search` 找帖子，再用 `rdt read POST_ID` 读全文和评论；`agent-reach doctor` 只负责检查 `rdt status --json` 是否已认证（来源：agent_reach/skill/references/social.md Reddit；来源：agent_reach/channels/reddit.py）。\n\n```mermaid\nflowchart TD\n  A[用户问题] --> B[SKILL 路由]\n  B --> C[social 文档]\n  C --> D[上游命令 rdt search]\n  D --> E[上游命令 rdt read]\n  E --> F[Agent 总结]\n  G[agent reach doctor] --> H[Channel check]\n  H --> I[rdt status json]\n  I --> J[ok warn off]\n  K[config yaml] --> H\n```\n\n最小命令是两步：\n`rdt search \"query\" --limit 10`\n`rdt read POST_ID`\n第一行找帖子，第二行读正文和评论；如果未登录，代码提示写入 `~/.config/rdt-cli/credential.json` 或运行 `rdt login`（来源：agent_reach/channels/reddit.py）。\n\n同一模式也用于别的平台：YouTube 检测 `yt-dlp` 和 Node/Deno JS runtime，小红书检测 `xhs status`，抖音检测 `mcporter list douyin`，V2EX 直接请求公开 JSON API（来源：agent_reach/channels/youtube.py；来源：agent_reach/channels/xiaohongshu.py；来源：agent_reach/channels/douyin.py；来源：agent_reach/channels/v2ex.py）。"
    failure_mode: "agent_reach/channels/twitter.py；agent_reach/skill/references/social.md Twitter"
    source_pointer: "https://github.com/panniantong/agent-reach"
pipeline_steps:
  - "project_type 分诊:devtool_cli"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/MIT/v1.4.0"
experiments: []
claims:
  - "[[claims/panniantong-agent-reach-main-claim]]"
artifacts:
  - "[[artifacts/panniantong-agent-reach-repo]]"
metrics:
  - "stars=24071"
  - "forks=2030"
  - "open_issues=70"
  - "latest_release=v1.4.0"
  - "pushed_at=2026-05-18T12:39:22Z"
baselines: []
failure_modes:
  - "agent_reach/channels/twitter.py；agent_reach/skill/references/social.md Twitter"
  - "agent_reach/channels/reddit.py；README FAQ Reddit"
  - "agent_reach/channels/youtube.py；agent_reach/skill/references/video.md"
  - "agent_reach/channels/exa_search.py；config/mcporter.json；agent_reach/guides/setup-exa.md"
  - "agent_reach/skill/references/social.md 小红书；agent_reach/channels/xiaohongshu.py"
  - "docs/install.md 抖音；agent_reach/skill/references/social.md 抖音"
  - "agent_reach/cli.py _ensure_utf8_console；本地 pytest 结果"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/panniantong/agent-reach"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/panniantong-agent-reach-main-claim]],官方 artifact 落库为 [[artifacts/panniantong-agent-reach-repo]]。See [[content/panniantong-agent-reach]]。
