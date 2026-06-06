---
content: "agent-reach"
kind: "evidence-pack"
title: "Agent-Reach — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "给你的 AI Agent 一键安装互联网访问能力的脚手架工具，让 Agent 免费搜索和阅读 Twitter、Reddit、YouTube、B站、小红书等十多个平台。"
    internal_logic: "### 定位：Agent 工具脚手架，而非 Agent 框架\n\nAgent Reach 本身不实现 agent loop、规划器或状态管理，而是一个**工具集成与配置层**。它代替用户完成“这个平台该用什么 CLI”“如何安装和认证”“让 Agent 何时调用”三个环节。\n\n### 核心流程：安装 → 配置 → 注册 skill → 直接调用\n\n1. **安装触发**  \n   用户将 `帮我安装 Agent Reach：https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/install.md` 发给 Agent，Agent 读取该文档并执行安装步骤（来源：README 快速上手）。该文档指导 Agent 运行 `pip install agent-reach` 安装 CLI，随后执行 `agent-reach install`。\n2. **环境自动化**  \n   `agent-reach install` 会自动检测系统类型（本地 or 服务器），并安装依赖：Node.js、gh CLI、mcporter、twitter-cli、rdt-cli、xhs-cli、yt-dlp 等（来源：README 安装流程）。同时通过 mcporter 接入 Exa 搜索（免费，无需 Key）。\n3. **SKILL.md 注册**  \n   安装程序将 `SKILL.md` 复制到 Agent 的 skills 目录（如 `~/.claude/skills/`），该文件是平台工具集的“字典”，告诉 Agent 当遇到“搜推特”“看视频”等意图时，应调用哪个上游工具及参数格式（来源：README 安装过程第5步）。\n4. **运行时调用**  \n   Agent 在对话中直接执行命令，不经过 Agent Reach 包装。例如：  \n   - Twitter 搜索：`twitter search \"关键词\"`  \n   - Reddit 搜索：`rdt search \"关键词\"`  \n   - YouTube 字幕：`yt-dlp --dump-json URL`  \n   - 网页阅读：`curl https://r.jina.ai/URL`  \n   这些命令由 SKILL.md 映射而来，Agent 自己组合（来源：README 装好就能用示例）。\n\n### 渠道架构：检查器 + 上游工具\n\n每个平台对应 `channels/` 目录下的一个 Python 模块，例如 `twitter.py`、`reddit.py`。每个模块实现 `check()` 方法，检测对应 CLI 是否已安装、认证是否就绪，供 `agent-reach doctor` 读取状态（来源：README 可插拔渠道说明）。但实际的数据抓取和搜索完全由上游工具完成，Agent Reach 不内置爬虫。\n\n例如 `channels/twitter.py` 可能类似：  \n```python\nimport subprocess\ndef check():\n    try:\n        subprocess.run([\"twitter\", \"--version\"], capture_output=True, check=True)\n        return {\"status\": \"ok\", \"tool\": \"twitter-cli\"}\n    except:\n        return {\"status\": \"missing\"}\n```\n\n这种**松散耦合**确保底层工具可随时替换（如将 `twitter-cli` 换成官方 API），只需更新渠道文件，不影响其他平台。\n\n### 安全边界\n\n- **凭据隔离**：Cookie 和 Token 存储在 `~/.agent-reach/config.yaml`，文件权限 600，不上传第三方（来源：README 安全性）。\n- **安装沙箱**：`--safe` 模式只显示需要安装的包，不自动执行；`--dry-run` 预览全部操作（来源：README 安装方式）。\n- **平台风险隔离**：每个渠道独立，一个工具被封不会影响其他渠道，且底层工具可快速替换（来源：README 可插拔架构）。\n\n### MCP 集成\n\n全网搜索通过 **Exa** 的 MCP 服务接入，由 `mcporter` 统一管理（`mcporter call 'exa.search(...)'`），同样无需 API Key。小红书、抖音等也通过 `mcporter` 调用对应的 MCP 服务（如 `douyin.parse_douyin_video_info`），保持一致的调用方式（来源：README 选型表与 FAQ 抖音部分）。\n\n### 诊断命令\n\n`agent-reach doctor` 遍历所有检测器，输出每个渠道的可用状态，快速定位问题（来源：README 自带诊断）。"
    failure_mode: "重度依赖上游工具，若多个工具同时失效，项目价值将骤降"
    source_pointer: "https://github.com/panniantong/agent-reach"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/MIT/v1.4.0"
experiments: []
claims:
  - "[[claims/agent-reach-main-claim]]"
artifacts:
  - "[[artifacts/agent-reach-repo]]"
metrics:
  - "stars=21362"
  - "forks=1851"
  - "open_issues=47"
  - "latest_release=v1.4.0"
  - "pushed_at=2026-05-18T12:39:22Z"
baselines: []
failure_modes:
  - "重度依赖上游工具，若多个工具同时失效，项目价值将骤降"
  - "Cookie 认证平台存在封号风险，而项目建议使用小号但并非所有用户都有多余账号"
  - "项目由个人 vibe coding 产出，代码质量、测试覆盖和长期维护能力存疑"
  - "热度集中于短期 star 爆发，若作者热情消退，项目可能停滞"
missing_details:
  - "homepage: not_found"
source_pointers:
  - "https://github.com/panniantong/agent-reach"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/agent-reach-main-claim]],官方 artifact 落库为 [[artifacts/agent-reach-repo]]。See [[content/agent-reach]]。
