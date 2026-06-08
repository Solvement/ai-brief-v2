---
content: "nousresearch-hermes-agent"
kind: "evidence-pack"
title: "hermes-agent — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "Hermes Agent 是一个面向“长期使用的个人/团队代理”的开源 Agent 框架：它把 CLI、消息网关、模型切换、工具调用、技能、记忆、cron、MCP 和沙箱终端放在同一个 Python 项目里。"
    internal_logic: "一个真实流程可以这样走：先运行 `hermes` 进入 CLI，或者用 `hermes chat --query 'Reply exactly ok'` 做非交互测试；`pyproject.toml` 把 `hermes` 绑定到 `hermes_cli.main:main`（来源：README Getting Started；docs/middleware Enablement；pyproject.toml project.scripts）。模型侧，`cli-config.yaml.example` 默认模型写成 `anthropic/claude-opus-4.6`，provider 默认 `auto`，也可以配置 OpenRouter base_url `https://openrouter.ai/api/v1` 或本地/custom provider（来源：cli-config.yaml.example Model Configuration）。\n\n当模型要调用工具时，`agent/agent_runtime_helpers.py` 会按函数名分派：`delegate_task` 走 `agent._dispatch_delegate_task(next_args)`，普通工具走 `run_agent.handle_function_call(...)`，并在最后包一层 `run_tool_execution_middleware(...)`，这样插件中间件可以包裹工具执行（来源：agent/agent_runtime_helpers.py tool dispatch；docs/middleware Tool Calls）。\n\n如果模型选择 `execute_code`，它不是直接把一串 shell 命令塞回上下文。`tools/code_execution_tool.py` 会先用 `check_execute_code_guard(code, env_type)` 审批整段 Python，再按 terminal backend 选择 local RPC 或 remote file-based RPC。它生成 `hermes_tools.py`，脚本里可以 `from hermes_tools import terminal` 等，工具调用回到父进程统一分派；默认限制是 300 秒、最多 50 次工具调用、stdout 50KB、stderr 10KB（来源：tools/code_execution_tool.py execute_code / build_execute_code_schema）。\n\n如果用户让它“每天早上生成日报”，agent 可以通过 cron 工具创建 job。`cron/jobs.py` 把任务放在 `~/.hermes/cron/jobs.json`，输出写入 `~/.hermes/cron/output/{job_id}/{timestamp}.md`；`parse_schedule` 能解析 `every 30m`、`0 9 * * *`、ISO timestamp 等；`tools/cronjob_tools.py` 在创建/更新和运行时扫描 prompt，阻断 `ignore previous instructions`、读 `.env`、`rm -rf /`、curl/wget 携带 secret 等注入/外传模式（来源：cron/jobs.py Schedule Parsing；tools/cronjob_tools.py Cron prompt scanning）。\n\n如果它在 Telegram/Discord/Slack 等聊天平台工作，README 要求先 `hermes gateway setup` + `hermes gateway start`；MCP 侧则可运行 `hermes mcp serve`，让 Claude Code/Cursor/Codex 等 MCP client 用 stdio 调 Hermes 的会话工具，例如 `messages_read` 读历史、`messages_send` 发消息、`permissions_respond` 回复审批（来源：README CLI vs Messaging Quick Reference；mcp_serve.py Usage/create_mcp_server）。"
    failure_mode: "pyproject.toml build-system/project.dependencies"
    source_pointer: "https://github.com/nousresearch/hermes-agent"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/true/true/false/MIT/v2026.6.5"
experiments: []
claims:
  - "[[claims/nousresearch-hermes-agent-main-claim]]"
artifacts:
  - "[[artifacts/nousresearch-hermes-agent-repo]]"
metrics:
  - "stars=186796"
  - "forks=32137"
  - "open_issues=19381"
  - "latest_release=v2026.6.5"
  - "pushed_at=2026-06-08T11:59:34Z"
baselines: []
failure_modes:
  - "pyproject.toml build-system/project.dependencies"
  - "README model paragraph；cli-config.yaml.example Model Configuration"
  - "cli-config.yaml.example Terminal Tool Configuration；tools/terminal_tool.py _create_environment；tools/approval.py dangerous patterns"
  - "docker-compose.yml Security notes；docs/security/network-egress-isolation.md Compose Configuration"
  - "hermes_state.py _sqlite_supports_fts5/_warn_fts5_unavailable；tests/test_hermes_state.py FTS5 search"
  - "Dockerfile Node 22 source stage / npm install / Playwright install；package.json engines"
  - "optional-mcps/linear/manifest.yaml；optional-mcps/n8n/manifest.yaml"
missing_details: []
source_pointers:
  - "https://github.com/nousresearch/hermes-agent"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/nousresearch-hermes-agent-main-claim]],官方 artifact 落库为 [[artifacts/nousresearch-hermes-agent-repo]]。See [[content/nousresearch-hermes-agent]]。
