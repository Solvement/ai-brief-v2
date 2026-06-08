---
content: "nousresearch-hermes-agent"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "hermes-agent — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "NousResearch/hermes-agent：GitHub 描述为“The agent that grows with you”。"
  what_it_does: "The agent that grows with you"
  metadata:
    language: "Python"
    total_stars: "186796"
    stars_in_period: "11427"
    author: "NousResearch"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "它值得看，不是因为 README 说自己“only agent with a built-in learning loop”，这句话只能算自称；真正值得看的，是仓库里已经把很多长期代理会踩到的工程面具体化了：终端后端、危险命令审批、跨会话 SQLite 检索、技能文件结构、cron 注入扫描、MCP 消息桥、Docker 网络隔离文档、插件观察/中间件契约。对 AI 工程师来说，这比单纯的 agent demo 更像“代理运行时”的参考实现。"
  core_capabilities:
    - "Programmatic Tool Calling RPC"
    - "SKILL.md procedural memory"
    - "Observer hooks + middleware split"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "和 OpenAI Agents SDK 比：OpenAI 官方文档把 Agents SDK 定位为代码优先的 agent app 开发工具，应用自己拥有 orchestration、tool execution、approvals、state，并支持 tools、MCP、handoffs、tracing（来源：https://developers.openai.com/api/docs/guides/agents）。如果你在产品后端里嵌入 agent，想用 typed Python/TypeScript 和自有状态存储，选 Agents SDK；如果你要一个开箱即用、能在 CLI/消息平台长期运行、带终端后端和 skills/cron 的个人代理运行时，Hermes 更贴近需求。 和 LangGraph 比：LangGraph 官方文档定位为 orchestration runtime，核心是 durable execution、streaming、human-in-the-loop、persistence；它不抽象 prompts 或 architecture（来源：https://docs.langchain.com/oss/python/langgraph/overview）。如果你要构建自己的图式工作流、检查点和恢复逻辑，选 LangGraph；如果你要现成 agent 工具面、消息网关、MCP 消息桥和技能系统，Hermes 更省集成工作，但图控制能力不如 LangGraph 明确。 和 Claude Code 比：Claude Code 官方文档说它是 agentic coding tool，可读代码库、改文件、跑命令，并覆盖 terminal、IDE、desktop、browser；多数 surface 需要 Claude subscription 或 Anthropic Console，Terminal CLI/VS Code 也支持 third-party providers（来源：https://code.claude.com/docs）。如果主要目标是成熟代码助手体验，Claude Code 更直接；如果要开源 MIT 源码、Python 可改、模型/provider 可配置、消息网关和 cron/skills 可研究，Hermes 更适合作为可拆解的工程样本。以上替代项能力均按各自官方文档自称处理，未在本仓库中独立验证。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "一个真实流程可以这样走：先运行 `hermes` 进入 CLI，或者用 `hermes chat --query 'Reply exactly ok'` 做非交互测试；`pyproject.toml` 把 `hermes` 绑定到 `hermes_cli.main:main`（来源：README Getting Started；docs/middleware Enablement；pyproject.toml project.scripts）。模型侧，`cli-config.yaml.example` 默认模型写成 `anthropic/claude-opus-4.6`，provider 默认 `auto`，也可以配置 OpenRouter base_url `https://openrouter.ai/api/v1` 或本地/custom provider（来源：cli-config.yaml.example Model Configuration）。 当模型要调用工具时，`agent/agent_runtime_helpers.py` 会按函数名分派：`delegate_task` 走 `agent._dispatch_delegate_task(next_args)`，普通工具走 `run_agent.handle_function_call(...)`，并在最后包一层 `run_tool_execution_middleware(...)`，这样插件中间件可以包裹工具执行（来源：agent/agent_runtime_helpers.py tool dispatch；docs/middleware Tool Calls）。 如果模型选择 `execute_code`，它不是直接把一串 shell 命令塞回上下文。`tools/code_execution_tool.py` 会先用 `check_execute_code_guard(code, env_type)` 审批整段 Python，再按 terminal backend 选择 local RPC 或 remote file-based RPC。它生成 `hermes_tools.py`，脚本里可以 `from hermes_tools import terminal` 等，工具调用回到父进程统一分派；默认限制是 300 秒、最多 50 次工具调用、stdout 50KB、stderr 10KB（来源：tools/code_execution_tool.py execute_code / build_execute_code_schema）。 如果用户让它“每天早上生成日报”，agent 可以通过 cron 工具创建 job。`cron/jobs.py` 把任务放在 `~/.hermes/cron/jobs.json`，输出写入 `~/.hermes/cron/output/{job_id}/{timestamp}.md`；`parse_schedule` 能解析 `every 30m`、`0 9 * * *`、ISO timestamp 等；`tools/cronjob_tools.py` 在创建/更新和运行时扫描 prompt，阻断 `ignore previous instructions`、读 `.env`、`rm -rf /`、curl/wget 携带 secret 等注入/外传模式（来源：cron/jobs.py Schedule Parsing；tools/cronjob_tools.py Cron prompt scanning）。 如果它在 Telegram/Discord/Slack 等聊天平台工作，README 要求先 `hermes gateway setup` + `hermes gateway start`；MCP 侧则可运行 `hermes mcp serve`，让 Claude Code/Cursor/Codex 等 MCP client 用 stdio 调 Hermes 的会话工具，例如 `messages_read` 读历史、`messages_send` 发消息、`permissions_respond` 回复审批（来源：README CLI vs Messaging Quick Reference；mcp_serve.py Usage/create_mcp_server）。"
  essential_design_difference: "最可复用的不是“某个 agent prompt”，而是几个工程边界：工具 RPC、技能文件、观测/中间件、终端后端、无人值守任务安全扫描。 - Programmatic Tool Calling RPC；把长工具链封装成子进程脚本，通过 stub 调父进程工具；限制工具白名单、调用次数、stdout/stderr 大小。；如果你的 agent 每步都需要让模型重新判断，或工具结果本身必须进上下文，就不要照搬。；`execute_code` 的设计把中间工具结果留在 RPC 层，可以降低上下文污染，但必须配套审批和资源限制（来源：tools/code_execution_tool.py Programmatic Tool Calling）。 - SKILL.md procedural memory；用 `SKILL.md` + references/templates/scripts/assets 表示可复用流程；`skill_view` 渐进加载，`skill_manage` 支持 create/edit/patch/write_file。；如果只是偏好或事实记忆，用普通 memory；skill 适合“怎么做某类任务”。；Hermes 对 skill name 长度、内容大小、frontmatter、支持文件目录做了约束：`MAX_NAME_LENGTH = 64`、`MAX_SKILL_CONTENT_CHARS = 100_000`、支持目录只有 references/templates/scripts/assets（来源：tools/skill_manager_tool.py validation；tools/skills_tool.py SKILL.md Format）。 - Observer hooks + middleware split；把只读 telemetry hook 和会改写行为的 middleware 分离；hook 负责记录，middleware 负责改写请求或包裹执行。；如果插件没有改变请求/执行的需求，只用 observer hooks，避免引入行为副作用。；docs 明确 observer hooks fail-open，middleware 可以处理 `llm_request`、`llm_execution`、`tool_request`、`tool_execution`，并记录 `middleware_trace`（来源：docs/observability/README.md Contract；docs/middleware/README.md Contract）。 - Terminal backend abstraction；把命令执行后端抽象成 `env_type`，支持本机、SSH、Docker、Singularity、Modal、Daytona，并把 cwd、镜像、资源、持久化、env forward 放进配置。；如果你的产品不能接受命令执行风险，先不要开放 local backend。；长期 agent 的最大风险面通常是 shell；Hermes 至少把隔离策略变成了配置面，而不是散落在 prompt 里（来源：cli-config.yaml.example Terminal Tool Configuration；tools/terminal_tool.py _create_environment）。 - Cron prompt scanner；为无人值守任务单独做严格 prompt 扫描；对附加 skill 内容使用更窄扫描，避免安全文档中的攻击样例误报。；如果任务从不自动执行或从不拿到凭据，复杂扫描收益较低。；`tools/cronjob_tools.py` 明确区分 user-supplied cron prompt 和 assembled prompt with skill content，是处理 prompt 注入误报/漏报的实用模式（来源：tools/cronjob_tools.py Cron prompt scanning）。"
  practitioner_meaning: "建议不是马上把 Hermes 当生产底座全盘采用，而是优先抽模式：`execute_code` RPC、skills 文件系统、observer/middleware 契约、cron scanner、terminal backend 配置、安全文档。它的代码量和依赖面很大，成熟度不能只看 README；但对正在做长期 agent、消息平台 agent、自治工具调用或代理可观测性的工程师，这是一个很值得拆读的样本。下一步最合理是 clone-and-run 一个最小 `hermes chat --query`，再挑 `execute_code`、cron、MCP bridge 三条链路做实测。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "Hermes Agent 是一个面向“长期使用的个人/团队代理”的开源 Agent 框架：它把 CLI、消息网关、模型切换、工具调用、技能、记忆、cron、MCP 和沙箱终端放在同一个 Python 项目里。"
    body_md: "普通话说：它不是只帮你写一次代码的聊天壳，而是试图成为一个可以长期运行、跨终端和聊天平台接任务、保存经验、再用经验改进工作的代理。技术上，它用 Python 包 `hermes-agent` 提供 `hermes`、`hermes-agent`、`hermes-acp` 三个 console scripts；README 给出的入口包括 `hermes`、`hermes model`、`hermes tools`、`hermes gateway`、`hermes setup`、`hermes update`、`hermes doctor`（来源：README Getting Started；pyproject.toml project.scripts）。"
  why_worth_attention:
    summary: ""
    body_md: "它值得看，不是因为 README 说自己“only agent with a built-in learning loop”，这句话只能算自称；真正值得看的，是仓库里已经把很多长期代理会踩到的工程面具体化了：终端后端、危险命令审批、跨会话 SQLite 检索、技能文件结构、cron 注入扫描、MCP 消息桥、Docker 网络隔离文档、插件观察/中间件契约。对 AI 工程师来说，这比单纯的 agent demo 更像“代理运行时”的参考实现。"
    bullets:
      - "已核实：`pyproject.toml` 要求 Python `>=3.11,<3.14`，核心依赖大量精确 pin 到 `==X.Y.Z`，并把 provider/search/TTS/image/messaging/sandbox 等拆到 extras 或 lazy install 策略中（来源：pyproject.toml project.dependencies / optional-dependencies）。"
      - "已核实：`cli-config.yaml.example` 展示 6 类 terminal backend：local、ssh、docker、singularity、modal、daytona；`tools/terminal_tool.py` 也按这些 `env_type` 创建环境（来源：cli-config.yaml.example Terminal Tool Configuration；tools/terminal_tool.py _get_env_config/_create_environment）。"
      - "已核实：`tools/code_execution_tool.py` 的 `execute_code` 会生成 `hermes_tools.py` RPC stub，默认 timeout `300` 秒、`DEFAULT_MAX_TOOL_CALLS = 50`、stdout cap `50_000` bytes、stderr cap `10_000` bytes，并只允许 sandbox 内调用 7 个工具：`web_search`、`web_extract`、`read_file`、`write_file`、`search_files`、`patch`、`terminal`（来源：tools/code_execution_tool.py Programmatic Tool Calling / SANDBOX_ALLOWED_TOOLS）。"
      - "已核实：`mcp_serve.py` 不是泛泛“支持 MCP”，而是把 Hermes 的消息会话暴露成 MCP stdio server，工具包括 `conversations_list`、`conversation_get`、`messages_read`、`attachments_fetch`、`events_poll`、`events_wait`、`messages_send`、`channels_list`、`permissions_list_open`、`permissions_respond`（来源：mcp_serve.py create_mcp_server）。"
  key_claims_evidence:
    summary: ""
    body_md: "下面把 README 自称和源码/配置已核实的事实分开。凡是“only / fastest / no lock-in / costs nearly nothing”这类表达，只按 README 自称处理，不当成已验证结论。"
    items:
      - claim: "Hermes 是“self-improving AI agent”，并且 README 称它是“only agent with a built-in learning loop”。"
        plain_english: "项目定位是会保存经验、生成/改进 skills、检索过去会话、建模用户的长期代理；但“only”没有在仓库中给出对照证明。"
        source: "README opening positioning"
        attribution: "自称"
        evidence_strength: "low"
        supports: "README 明确写到 creates skills from experience、improves them during use、searches its own past conversations、Honcho user modeling。"
        does_not_support: "没有 benchmark、竞品矩阵或独立验证来支持“only”。"
        threat: "容易把营销语误读成已证明的技术优势。"
      - claim: "CLI 有真实安装/运行入口。"
        plain_english: "用户可以从 `hermes` 命令启动交互 CLI，也可以用 `hermes model/tools/gateway/setup/update/doctor` 做配置和维护。"
        source: "README Getting Started；pyproject.toml project.scripts"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`pyproject.toml` 定义 `hermes = hermes_cli.main:main`、`hermes-agent = run_agent:main`、`hermes-acp = acp_adapter.entry:main`。"
        does_not_support: "本次没有实际执行 `hermes setup` 或完成端到端聊天。"
        threat: "包可运行性还依赖本机 Python、uv/pip、API key 和可选平台配置。"
      - claim: "README 称可用任意模型，并用 `hermes model` 切换，无需改代码。"
        plain_english: "配置文件确实暴露了很多 provider 选项，但“任意模型”和“no lock-in”仍是 README 自称。"
        source: "README model paragraph；cli-config.yaml.example Model Configuration"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "`cli-config.yaml.example` 列出 provider：auto、openrouter、nous、nous-api、anthropic、openai-codex、copilot、gemini、zai、kimi-coding、minimax、minimax-cn、huggingface、nvidia、xiaomi、arcee、ollama-cloud、kilocode、azure-foundry、lmstudio、custom。"
        does_not_support: "没有逐一验证每个 provider 当前可用、鉴权成功或 tool-calling 兼容。"
        threat: "不同 provider 的工具调用协议、上下文长度、价格和限流不同，迁移并非纯配置无成本。"
      - claim: "支持多种终端执行环境。"
        plain_english: "Hermes 的 terminal tool 可以把命令发到本机、SSH、Docker、Singularity、Modal、Daytona 等后端。"
        source: "cli-config.yaml.example Terminal Tool Configuration；tools/terminal_tool.py _get_env_config/_create_environment"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`terminal.backend` 示例包括 `local`、`ssh`、`docker`、`singularity`、`modal`、`daytona`；源码根据 `env_type` 分派到 LocalEnvironment、DockerEnvironment、SingularityEnvironment、ModalEnvironment、DaytonaEnvironment、SSHEnvironment。"
        does_not_support: "没有实际启动每一种 backend。"
        threat: "隔离强度取决于 backend 配置；默认 local 仍在本机执行。"
      - claim: "`execute_code` 可以把多步工具链压成一个推理轮次。"
        plain_english: "模型生成 Python 脚本，脚本通过 RPC 调 Hermes 工具，中间工具结果不进入 LLM 上下文，只把 stdout 返回给模型。"
        source: "tools/code_execution_tool.py Programmatic Tool Calling"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "源码注释写明 local backend 用 Unix domain socket/TCP RPC，remote backend 用 file-based RPC；默认 `DEFAULT_TIMEOUT = 300`、`DEFAULT_MAX_TOOL_CALLS = 50`，sandbox 允许 7 个工具。"
        does_not_support: "不能说明这对所有任务都更便宜或更可靠。"
        threat: "脚本能运行任意 Python，因此源码在 `check_execute_code_guard` 前置审批，但风险仍高于只读工具。"
      - claim: "支持 subagent 并行/委派。"
        plain_english: "父 agent 可以 spawn 子 agent；子 agent 有独立上下文、task_id、受限工具集，父上下文只看到总结。"
        source: "tools/delegate_tool.py Subagent Architecture / DELEGATE_BLOCKED_TOOLS"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`DELEGATE_BLOCKED_TOOLS` 默认移除 `delegate_task`、`clarify`、`memory`、`send_message`、`execute_code`；注释说明父上下文不包含子 agent 中间工具调用或推理。"
        does_not_support: "没有验证实际并发性能或成本。"
        threat: "并行子 agent 会线性放大 API 成本；配置中也警告并发值超过 10 会放大成本（来源：cli-config.yaml.example delegation）。"
      - claim: "cron 能做自然语言定时任务。"
        plain_english: "仓库有 cron job 存储、调度和工具 schema；任务存到 `~/.hermes/cron/jobs.json`，输出写到 `~/.hermes/cron/output/{job_id}/{timestamp}.md`。"
        source: "cron/jobs.py Cron job storage and management；tools/cronjob_tools.py Cron prompt scanning"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`parse_schedule` 支持 `30m`、`2h`、`every 30m`、`every 2h`、5/6 字段 cron expression、ISO timestamp；cron prompt scanner 阻断 `ignore previous instructions`、`cat ... .env`、`rm -rf /`、Authorization exfil 等模式。"
        does_not_support: "没有实际运行 scheduler 或验证平台投递。"
        threat: "定时任务是无人值守执行面，prompt 注入和凭据外泄风险高。"
      - claim: "支持 MCP。"
        plain_english: "Hermes 同时有 MCP server 消息桥，也有 optional MCP catalog，例如 Linear 和 n8n。"
        source: "mcp_serve.py create_mcp_server；optional-mcps/linear/manifest.yaml；optional-mcps/n8n/manifest.yaml"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`mcp_serve.py` 用 FastMCP 注册消息/审批工具；Linear manifest 使用 HTTP `https://mcp.linear.app/mcp` + OAuth；n8n manifest 使用 stdio、git clone、venv bootstrap，并默认启用 read-mostly 工具如 `health`、`list_workflows`、`get_workflow`。"
        does_not_support: "没有验证每个 MCP server 当前在线或 OAuth 成功。"
        threat: "MCP 扩大工具面；安装时默认工具选择和鉴权策略要审。"
  how_it_works:
    summary: ""
    body_md: "一个真实流程可以这样走：先运行 `hermes` 进入 CLI，或者用 `hermes chat --query 'Reply exactly ok'` 做非交互测试；`pyproject.toml` 把 `hermes` 绑定到 `hermes_cli.main:main`（来源：README Getting Started；docs/middleware Enablement；pyproject.toml project.scripts）。模型侧，`cli-config.yaml.example` 默认模型写成 `anthropic/claude-opus-4.6`，provider 默认 `auto`，也可以配置 OpenRouter base_url `https://openrouter.ai/api/v1` 或本地/custom provider（来源：cli-config.yaml.example Model Configuration）。\n\n当模型要调用工具时，`agent/agent_runtime_helpers.py` 会按函数名分派：`delegate_task` 走 `agent._dispatch_delegate_task(next_args)`，普通工具走 `run_agent.handle_function_call(...)`，并在最后包一层 `run_tool_execution_middleware(...)`，这样插件中间件可以包裹工具执行（来源：agent/agent_runtime_helpers.py tool dispatch；docs/middleware Tool Calls）。\n\n如果模型选择 `execute_code`，它不是直接把一串 shell 命令塞回上下文。`tools/code_execution_tool.py` 会先用 `check_execute_code_guard(code, env_type)` 审批整段 Python，再按 terminal backend 选择 local RPC 或 remote file-based RPC。它生成 `hermes_tools.py`，脚本里可以 `from hermes_tools import terminal` 等，工具调用回到父进程统一分派；默认限制是 300 秒、最多 50 次工具调用、stdout 50KB、stderr 10KB（来源：tools/code_execution_tool.py execute_code / build_execute_code_schema）。\n\n如果用户让它“每天早上生成日报”，agent 可以通过 cron 工具创建 job。`cron/jobs.py` 把任务放在 `~/.hermes/cron/jobs.json`，输出写入 `~/.hermes/cron/output/{job_id}/{timestamp}.md`；`parse_schedule` 能解析 `every 30m`、`0 9 * * *`、ISO timestamp 等；`tools/cronjob_tools.py` 在创建/更新和运行时扫描 prompt，阻断 `ignore previous instructions`、读 `.env`、`rm -rf /`、curl/wget 携带 secret 等注入/外传模式（来源：cron/jobs.py Schedule Parsing；tools/cronjob_tools.py Cron prompt scanning）。\n\n如果它在 Telegram/Discord/Slack 等聊天平台工作，README 要求先 `hermes gateway setup` + `hermes gateway start`；MCP 侧则可运行 `hermes mcp serve`，让 Claude Code/Cursor/Codex 等 MCP client 用 stdio 调 Hermes 的会话工具，例如 `messages_read` 读历史、`messages_send` 发消息、`permissions_respond` 回复审批（来源：README CLI vs Messaging Quick Reference；mcp_serve.py Usage/create_mcp_server）。"
  reusable_abstractions:
    summary: ""
    body_md: "最可复用的不是“某个 agent prompt”，而是几个工程边界：工具 RPC、技能文件、观测/中间件、终端后端、无人值守任务安全扫描。"
    items:
      - name: "Programmatic Tool Calling RPC"
        copy: "把长工具链封装成子进程脚本，通过 stub 调父进程工具；限制工具白名单、调用次数、stdout/stderr 大小。"
        skip: "如果你的 agent 每步都需要让模型重新判断，或工具结果本身必须进上下文，就不要照搬。"
        why_it_matters: "`execute_code` 的设计把中间工具结果留在 RPC 层，可以降低上下文污染，但必须配套审批和资源限制（来源：tools/code_execution_tool.py Programmatic Tool Calling）。"
      - name: "SKILL.md procedural memory"
        copy: "用 `SKILL.md` + references/templates/scripts/assets 表示可复用流程；`skill_view` 渐进加载，`skill_manage` 支持 create/edit/patch/write_file。"
        skip: "如果只是偏好或事实记忆，用普通 memory；skill 适合“怎么做某类任务”。"
        why_it_matters: "Hermes 对 skill name 长度、内容大小、frontmatter、支持文件目录做了约束：`MAX_NAME_LENGTH = 64`、`MAX_SKILL_CONTENT_CHARS = 100_000`、支持目录只有 references/templates/scripts/assets（来源：tools/skill_manager_tool.py validation；tools/skills_tool.py SKILL.md Format）。"
      - name: "Observer hooks + middleware split"
        copy: "把只读 telemetry hook 和会改写行为的 middleware 分离；hook 负责记录，middleware 负责改写请求或包裹执行。"
        skip: "如果插件没有改变请求/执行的需求，只用 observer hooks，避免引入行为副作用。"
        why_it_matters: "docs 明确 observer hooks fail-open，middleware 可以处理 `llm_request`、`llm_execution`、`tool_request`、`tool_execution`，并记录 `middleware_trace`（来源：docs/observability/README.md Contract；docs/middleware/README.md Contract）。"
      - name: "Terminal backend abstraction"
        copy: "把命令执行后端抽象成 `env_type`，支持本机、SSH、Docker、Singularity、Modal、Daytona，并把 cwd、镜像、资源、持久化、env forward 放进配置。"
        skip: "如果你的产品不能接受命令执行风险，先不要开放 local backend。"
        why_it_matters: "长期 agent 的最大风险面通常是 shell；Hermes 至少把隔离策略变成了配置面，而不是散落在 prompt 里（来源：cli-config.yaml.example Terminal Tool Configuration；tools/terminal_tool.py _create_environment）。"
      - name: "Cron prompt scanner"
        copy: "为无人值守任务单独做严格 prompt 扫描；对附加 skill 内容使用更窄扫描，避免安全文档中的攻击样例误报。"
        skip: "如果任务从不自动执行或从不拿到凭据，复杂扫描收益较低。"
        why_it_matters: "`tools/cronjob_tools.py` 明确区分 user-supplied cron prompt 和 assembled prompt with skill content，是处理 prompt 注入误报/漏报的实用模式（来源：tools/cronjob_tools.py Cron prompt scanning）。"
  dependency_platform_risk:
    summary: ""
    body_md: "Hermes 的能力来自很多外部面：模型 provider、消息平台、MCP server、Docker/Modal/Daytona、SQLite FTS5、Node/browser/TUI 资产。它的工程深度也意味着部署风险不是单点。"
    items:
      - dependency: "Python runtime and pinned PyPI dependencies"
        what_if_change: "Python 3.14 或某些 Rust-backed wheel 生态变化会让安装失败；项目已经把 `requires-python` cap 到 `<3.14`。"
        exposure: "high"
        mitigation_or_unknown: "已在 pyproject 注释中说明 cap 原因；依赖精确 pin 并要求更新时 regenerate `uv.lock`。"
        source: "pyproject.toml build-system/project.dependencies"
      - dependency: "Model providers and credentials"
        what_if_change: "OpenRouter、Nous Portal、Anthropic、OpenAI Codex、Gemini、z.ai、Kimi、MiniMax、Hugging Face、NVIDIA、Xiaomi、Azure Foundry、本地服务等任何一个协议/鉴权变化都会影响对应 provider。"
        exposure: "high"
        mitigation_or_unknown: "配置支持 provider 切换；但本次未验证所有 provider 当前可用。"
        source: "README model paragraph；cli-config.yaml.example Model Configuration"
      - dependency: "Terminal backend isolation"
        what_if_change: "local backend 直接在宿主机执行；Docker/Modal/Daytona/Singularity/SSH 需要对应平台、镜像、凭据和资源配置。"
        exposure: "high"
        mitigation_or_unknown: "可切换后端，并有 dangerous command approval；但默认 local 风险仍由用户环境承担。"
        source: "cli-config.yaml.example Terminal Tool Configuration；tools/terminal_tool.py _create_environment；tools/approval.py dangerous patterns"
      - dependency: "Docker networking"
        what_if_change: "默认 `docker-compose.yml` 使用 `network_mode: host`，agent/gateway 可有较大出站网络面。"
        exposure: "high"
        mitigation_or_unknown: "docs/security/network-egress-isolation.md 给出 internal/egress 双网络和 squid allowlist 示例，要求显式 override。"
        source: "docker-compose.yml Security notes；docs/security/network-egress-isolation.md Compose Configuration"
      - dependency: "SQLite FTS5"
        what_if_change: "如果 Python/SQLite 缺少 FTS5，全文 session search 会被禁用或降级。"
        exposure: "medium"
        mitigation_or_unknown: "`SessionDB` 会 probe `CREATE VIRTUAL TABLE ... USING fts5`，不可用时 warning 并禁用 FTS；测试也覆盖 no-fts5 场景。"
        source: "hermes_state.py _sqlite_supports_fts5/_warn_fts5_unavailable；tests/test_hermes_state.py FTS5 search"
      - dependency: "Node/browser assets"
        what_if_change: "TUI/web/dashboard/browser tool 依赖 Node/npm/Playwright；Dockerfile 固定 uv、Node 22 source stage、Playwright chromium shell。"
        exposure: "medium"
        mitigation_or_unknown: "Dockerfile 把 npm install、Playwright install、web/ui-tui build 做进镜像；本地源码运行仍依赖本机 Node/npm。"
        source: "Dockerfile Node 22 source stage / npm install / Playwright install；package.json engines"
      - dependency: "MCP servers and optional catalog"
        what_if_change: "Linear remote MCP、n8n stdio bridge等外部 server/API 改变会影响工具可用性和安全面。"
        exposure: "medium"
        mitigation_or_unknown: "optional-mcps manifests 写明 transport/auth/default_enabled；本次未实际连接。"
        source: "optional-mcps/linear/manifest.yaml；optional-mcps/n8n/manifest.yaml"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些不是仓库文件能直接证明的，需要运行或外部验证。"
    items:
      - "未实际执行 `uv sync`、`hermes setup`、`hermes chat --query`，所以 runnable 只按源码/配置判断，不能写成已跑通。"
      - "README 的“only agent with a built-in learning loop”“no lock-in”“costs nearly nothing when idle”等表述未找到独立证明，只能保留为自称。"
      - "README 说 FTS5 session search with LLM summarization，但 `tools/session_search_tool.py` 当前写明 no LLM calls anywhere；需要运行具体命令确认是否另有 summarization 路径。"
      - "各 provider 的实际 tool-calling 兼容性、上下文长度、限流、价格、OAuth 流程未逐一验证。"
      - "消息平台 Telegram/Discord/Slack/WhatsApp/Signal/Email/Matrix 等适配器未实际连接测试。"
      - "安全扫描/approval 是否覆盖所有 prompt-injection 和 shell escape 场景未知；源码显示有防护，但不能等价为安全证明。"
      - "仓库 Git status 在 Windows 长路径初次 checkout 后出现索引/工作区状态异常；文件内容已可读，但未做干净 reset。"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 3
    body_md: "建议不是马上把 Hermes 当生产底座全盘采用，而是优先抽模式：`execute_code` RPC、skills 文件系统、observer/middleware 契约、cron scanner、terminal backend 配置、安全文档。它的代码量和依赖面很大，成熟度不能只看 README；但对正在做长期 agent、消息平台 agent、自治工具调用或代理可观测性的工程师，这是一个很值得拆读的样本。下一步最合理是 clone-and-run 一个最小 `hermes chat --query`，再挑 `execute_code`、cron、MCP bridge 三条链路做实测。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\nousresearch-hermes-agent\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\nousresearch-hermes-agent\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\nousresearch-hermes-agent\\codex-last-message.json"
  invoked_at: "2026-06-08T14:18:49.490Z"
  completed_at: "2026-06-08T14:24:17.752Z"
  repo: "NousResearch/hermes-agent"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "The agent that grows with you"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "Hermes 是“self-improving AI agent”，并且 README 称它是“only agent with a built-in learning loop”。"
    - "CLI 有真实安装/运行入口。"
    - "README 称可用任意模型，并用 `hermes model` 切换，无需改代码。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "pyproject.toml build-system/project.dependencies"
    - "README model paragraph；cli-config.yaml.example Model Configuration"
    - "cli-config.yaml.example Terminal Tool Configuration；tools/terminal_tool.py _create_environment；tools/approval.py dangerous patterns"
    - "docker-compose.yml Security notes；docs/security/network-egress-isolation.md Compose Configuration"
    - "hermes_state.py _sqlite_supports_fts5/_warn_fts5_unavailable；tests/test_hermes_state.py FTS5 search"
    - "Dockerfile Node 22 source stage / npm install / Playwright install；package.json engines"
    - "optional-mcps/linear/manifest.yaml；optional-mcps/n8n/manifest.yaml"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 3
  main_risk: "建议不是马上把 Hermes 当生产底座全盘采用，而是优先抽模式：`execute_code` RPC、skills 文件系统、observer/middleware 契约、cron scanner、terminal backend 配置、安全文档。它的代码量和依赖面很大，成熟度不能只看 README；但对正在做长期 agent、消息平台 agent、自治工具调用或代理可观测性的工程师，这是一个很值得拆读的样本。下一步最合理是 clone-and-run 一个最小 `hermes chat --query`，再挑 `execute_code`、cron、MCP bridge 三条链路做实测。"
next_actions:
  - "extract-pattern"
unknowns:
  - "未实际执行 `uv sync`、`hermes setup`、`hermes chat --query`，所以 runnable 只按源码/配置判断，不能写成已跑通。"
  - "README 的“only agent with a built-in learning loop”“no lock-in”“costs nearly nothing when idle”等表述未找到独立证明，只能保留为自称。"
  - "README 说 FTS5 session search with LLM summarization，但 `tools/session_search_tool.py` 当前写明 no LLM calls anywhere；需要运行具体命令确认是否另有 summarization 路径。"
  - "各 provider 的实际 tool-calling 兼容性、上下文长度、限流、价格、OAuth 流程未逐一验证。"
  - "消息平台 Telegram/Discord/Slack/WhatsApp/Signal/Email/Matrix 等适配器未实际连接测试。"
  - "安全扫描/approval 是否覆盖所有 prompt-injection 和 shell escape 场景未知；源码显示有防护，但不能等价为安全证明。"
  - "仓库 Git status 在 Windows 长路径初次 checkout 后出现索引/工作区状态异常；文件内容已可读，但未做干净 reset。"
builder_reuse:
  pattern: "Programmatic Tool Calling RPC"
  copy: "把长工具链封装成子进程脚本，通过 stub 调父进程工具；限制工具白名单、调用次数、stdout/stderr 大小。"
  skip: "如果你的 agent 每步都需要让模型重新判断，或工具结果本身必须进上下文，就不要照搬。"
  why_it_matters: "`execute_code` 的设计把中间工具结果留在 RPC 层，可以降低上下文污染，但必须配套审批和资源限制（来源：tools/code_execution_tool.py Programmatic Tool Calling）。"
dependency_platform_risk:
  dependency: "Python runtime and pinned PyPI dependencies"
  what_if_change: "Python 3.14 或某些 Rust-backed wheel 生态变化会让安装失败；项目已经把 `requires-python` cap 到 `<3.14`。"
  exposure: "high"
  mitigation_or_unknown: "已在 pyproject 注释中说明 cap 原因；依赖精确 pin 并要求更新时 regenerate `uv.lock`。"
claim_ledger:
  - claim: "Hermes 是“self-improving AI agent”，并且 README 称它是“only agent with a built-in learning loop”。"
    plain_english: "项目定位是会保存经验、生成/改进 skills、检索过去会话、建模用户的长期代理；但“only”没有在仓库中给出对照证明。"
    source: "README opening positioning"
    attribution: "自称"
    evidence_strength: "low"
    supports: "README 明确写到 creates skills from experience、improves them during use、searches its own past conversations、Honcho user modeling。"
    does_not_support: "没有 benchmark、竞品矩阵或独立验证来支持“only”。"
    threat: "容易把营销语误读成已证明的技术优势。"
  - claim: "CLI 有真实安装/运行入口。"
    plain_english: "用户可以从 `hermes` 命令启动交互 CLI，也可以用 `hermes model/tools/gateway/setup/update/doctor` 做配置和维护。"
    source: "README Getting Started；pyproject.toml project.scripts"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`pyproject.toml` 定义 `hermes = hermes_cli.main:main`、`hermes-agent = run_agent:main`、`hermes-acp = acp_adapter.entry:main`。"
    does_not_support: "本次没有实际执行 `hermes setup` 或完成端到端聊天。"
    threat: "包可运行性还依赖本机 Python、uv/pip、API key 和可选平台配置。"
  - claim: "README 称可用任意模型，并用 `hermes model` 切换，无需改代码。"
    plain_english: "配置文件确实暴露了很多 provider 选项，但“任意模型”和“no lock-in”仍是 README 自称。"
    source: "README model paragraph；cli-config.yaml.example Model Configuration"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "`cli-config.yaml.example` 列出 provider：auto、openrouter、nous、nous-api、anthropic、openai-codex、copilot、gemini、zai、kimi-coding、minimax、minimax-cn、huggingface、nvidia、xiaomi、arcee、ollama-cloud、kilocode、azure-foundry、lmstudio、custom。"
    does_not_support: "没有逐一验证每个 provider 当前可用、鉴权成功或 tool-calling 兼容。"
    threat: "不同 provider 的工具调用协议、上下文长度、价格和限流不同，迁移并非纯配置无成本。"
  - claim: "支持多种终端执行环境。"
    plain_english: "Hermes 的 terminal tool 可以把命令发到本机、SSH、Docker、Singularity、Modal、Daytona 等后端。"
    source: "cli-config.yaml.example Terminal Tool Configuration；tools/terminal_tool.py _get_env_config/_create_environment"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`terminal.backend` 示例包括 `local`、`ssh`、`docker`、`singularity`、`modal`、`daytona`；源码根据 `env_type` 分派到 LocalEnvironment、DockerEnvironment、SingularityEnvironment、ModalEnvironment、DaytonaEnvironment、SSHEnvironment。"
    does_not_support: "没有实际启动每一种 backend。"
    threat: "隔离强度取决于 backend 配置；默认 local 仍在本机执行。"
  - claim: "`execute_code` 可以把多步工具链压成一个推理轮次。"
    plain_english: "模型生成 Python 脚本，脚本通过 RPC 调 Hermes 工具，中间工具结果不进入 LLM 上下文，只把 stdout 返回给模型。"
    source: "tools/code_execution_tool.py Programmatic Tool Calling"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "源码注释写明 local backend 用 Unix domain socket/TCP RPC，remote backend 用 file-based RPC；默认 `DEFAULT_TIMEOUT = 300`、`DEFAULT_MAX_TOOL_CALLS = 50`，sandbox 允许 7 个工具。"
    does_not_support: "不能说明这对所有任务都更便宜或更可靠。"
    threat: "脚本能运行任意 Python，因此源码在 `check_execute_code_guard` 前置审批，但风险仍高于只读工具。"
  - claim: "支持 subagent 并行/委派。"
    plain_english: "父 agent 可以 spawn 子 agent；子 agent 有独立上下文、task_id、受限工具集，父上下文只看到总结。"
    source: "tools/delegate_tool.py Subagent Architecture / DELEGATE_BLOCKED_TOOLS"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`DELEGATE_BLOCKED_TOOLS` 默认移除 `delegate_task`、`clarify`、`memory`、`send_message`、`execute_code`；注释说明父上下文不包含子 agent 中间工具调用或推理。"
    does_not_support: "没有验证实际并发性能或成本。"
    threat: "并行子 agent 会线性放大 API 成本；配置中也警告并发值超过 10 会放大成本（来源：cli-config.yaml.example delegation）。"
render_warnings:
  - "faithfulness.unknown_assertion line 67 term \"hermes chat --query\": 一个真实流程可以这样走：先运行 `hermes` 进入 CLI，或者用 `hermes chat --query 'Reply exactly ok'` 做非交互测试；`pyproject.toml` 把 `hermes` 绑定到 `hermes_cli.main:main..."
artifact_audit:
  official_repo: "https://github.com/NousResearch/hermes-agent"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

NousResearch/hermes-agent：GitHub 描述为“The agent that grows with you”。

（来源：README/artifactAudit）

## 干什么

The agent that grows with you

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 186796 |
| stars_in_period | 11427 |
| author | NousResearch |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

它值得看，不是因为 README 说自己“only agent with a built-in learning loop”，这句话只能算自称；真正值得看的，是仓库里已经把很多长期代理会踩到的工程面具体化了：终端后端、危险命令审批、跨会话 SQLite 检索、技能文件结构、cron 注入扫描、MCP 消息桥、Docker 网络隔离文档、插件观察/中间件契约。对 AI 工程师来说，这比单纯的 agent demo 更像“代理运行时”的参考实现。

（来源：README/artifactAudit）

## 核心能力

- Programmatic Tool Calling RPC（来源：数据不足）
- SKILL.md procedural memory（来源：数据不足）
- Observer hooks + middleware split（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

和 OpenAI Agents SDK 比：OpenAI 官方文档把 Agents SDK 定位为代码优先的 agent app 开发工具，应用自己拥有 orchestration、tool execution、approvals、state，并支持 tools、MCP、handoffs、tracing（来源：https://developers.openai.com/api/docs/guides/agents）。如果你在产品后端里嵌入 agent，想用 typed Python/TypeScript 和自有状态存储，选 Agents SDK；如果你要一个开箱即用、能在 CLI/消息平台长期运行、带终端后端和 skills/cron 的个人代理运行时，Hermes 更贴近需求。 和 LangGraph 比：LangGraph 官方文档定位为 orchestration runtime，核心是 durable execution、streaming、human-in-the-loop、persistence；它不抽象 prompts 或 architecture（来源：https://docs.langchain.com/oss/python/langgraph/overview）。如果你要构建自己的图式工作流、检查点和恢复逻辑，选 LangGraph；如果你要现成 agent 工具面、消息网关、MCP 消息桥和技能系统，Hermes 更省集成工作，但图控制能力不如 LangGraph 明确。 和 Claude Code 比：Claude Code 官方文档说它是 agentic coding tool，可读代码库、改文件、跑命令，并覆盖 terminal、IDE、desktop、browser；多数 surface 需要 Claude subscription 或 Anthropic Console，Terminal CLI/VS Code 也支持 third-party providers（来源：https://code.claude.com/docs）。如果主要目标是成熟代码助手体验，Claude Code 更直接；如果要开源 MIT 源码、Python 可改、模型/provider 可配置、消息网关和 cron/skills 可研究，Hermes 更适合作为可拆解的工程样本。以上替代项能力均按各自官方文档自称处理，未在本仓库中独立验证。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

一个真实流程可以这样走：先运行 `hermes` 进入 CLI，或者用 `hermes chat --query 'Reply exactly ok'` 做非交互测试；`pyproject.toml` 把 `hermes` 绑定到 `hermes_cli.main:main`（来源：README Getting Started；docs/middleware Enablement；pyproject.toml project.scripts）。模型侧，`cli-config.yaml.example` 默认模型写成 `anthropic/claude-opus-4.6`，provider 默认 `auto`，也可以配置 OpenRouter base_url `https://openrouter.ai/api/v1` 或本地/custom provider（来源：cli-config.yaml.example Model Configuration）。 当模型要调用工具时，`agent/agent_runtime_helpers.py` 会按函数名分派：`delegate_task` 走 `agent._dispatch_delegate_task(next_args)`，普通工具走 `run_agent.handle_function_call(...)`，并在最后包一层 `run_tool_execution_middleware(...)`，这样插件中间件可以包裹工具执行（来源：agent/agent_runtime_helpers.py tool dispatch；docs/middleware Tool Calls）。 如果模型选择 `execute_code`，它不是直接把一串 shell 命令塞回上下文。`tools/code_execution_tool.py` 会先用 `check_execute_code_guard(code, env_type)` 审批整段 Python，再按 terminal backend 选择 local RPC 或 remote file-based RPC。它生成 `hermes_tools.py`，脚本里可以 `from hermes_tools import terminal` 等，工具调用回到父进程统一分派；默认限制是 300 秒、最多 50 次工具调用、stdout 50KB、stderr 10KB（来源：tools/code_execution_tool.py execute_code / build_execute_code_schema）。 如果用户让它“每天早上生成日报”，agent 可以通过 cron 工具创建 job。`cron/jobs.py` 把任务放在 `~/.hermes/cron/jobs.json`，输出写入 `~/.hermes/cron/output/{job_id}/{timestamp}.md`；`parse_schedule` 能解析 `every 30m`、`0 9 * * *`、ISO timestamp 等；`tools/cronjob_tools.py` 在创建/更新和运行时扫描 prompt，阻断 `ignore previous instructions`、读 `.env`、`rm -rf /`、curl/wget 携带 secret 等注入/外传模式（来源：cron/jobs.py Schedule Parsing；tools/cronjob_tools.py Cron prompt scanning）。 如果它在 Telegram/Discord/Slack 等聊天平台工作，README 要求先 `hermes gateway setup` + `hermes gateway start`；MCP 侧则可运行 `hermes mcp serve`，让 Claude Code/Cursor/Codex 等 MCP client 用 stdio 调 Hermes 的会话工具，例如 `messages_read` 读历史、`messages_send` 发消息、`permissions_respond` 回复审批（来源：README CLI vs Messaging Quick Reference；mcp_serve.py Usage/create_mcp_server）。

## 本质不同的设计取舍

最可复用的不是“某个 agent prompt”，而是几个工程边界：工具 RPC、技能文件、观测/中间件、终端后端、无人值守任务安全扫描。 - Programmatic Tool Calling RPC；把长工具链封装成子进程脚本，通过 stub 调父进程工具；限制工具白名单、调用次数、stdout/stderr 大小。；如果你的 agent 每步都需要让模型重新判断，或工具结果本身必须进上下文，就不要照搬。；`execute_code` 的设计把中间工具结果留在 RPC 层，可以降低上下文污染，但必须配套审批和资源限制（来源：tools/code_execution_tool.py Programmatic Tool Calling）。 - SKILL.md procedural memory；用 `SKILL.md` + references/templates/scripts/assets 表示可复用流程；`skill_view` 渐进加载，`skill_manage` 支持 create/edit/patch/write_file。；如果只是偏好或事实记忆，用普通 memory；skill 适合“怎么做某类任务”。；Hermes 对 skill name 长度、内容大小、frontmatter、支持文件目录做了约束：`MAX_NAME_LENGTH = 64`、`MAX_SKILL_CONTENT_CHARS = 100_000`、支持目录只有 references/templates/scripts/assets（来源：tools/skill_manager_tool.py validation；tools/skills_tool.py SKILL.md Format）。 - Observer hooks + middleware split；把只读 telemetry hook 和会改写行为的 middleware 分离；hook 负责记录，middleware 负责改写请求或包裹执行。；如果插件没有改变请求/执行的需求，只用 observer hooks，避免引入行为副作用。；docs 明确 observer hooks fail-open，middleware 可以处理 `llm_request`、`llm_execution`、`tool_request`、`tool_execution`，并记录 `middleware_trace`（来源：docs/observability/README.md Contract；docs/middleware/README.md Contract）。 - Terminal backend abstraction；把命令执行后端抽象成 `env_type`，支持本机、SSH、Docker、Singularity、Modal、Daytona，并把 cwd、镜像、资源、持久化、env forward 放进配置。；如果你的产品不能接受命令执行风险，先不要开放 local backend。；长期 agent 的最大风险面通常是 shell；Hermes 至少把隔离策略变成了配置面，而不是散落在 prompt 里（来源：cli-config.yaml.example Terminal Tool Configuration；tools/terminal_tool.py _create_environment）。 - Cron prompt scanner；为无人值守任务单独做严格 prompt 扫描；对附加 skill 内容使用更窄扫描，避免安全文档中的攻击样例误报。；如果任务从不自动执行或从不拿到凭据，复杂扫描收益较低。；`tools/cronjob_tools.py` 明确区分 user-supplied cron prompt 和 assembled prompt with skill content，是处理 prompt 注入误报/漏报的实用模式（来源：tools/cronjob_tools.py Cron prompt scanning）。

## 对从业者意味着什么

建议不是马上把 Hermes 当生产底座全盘采用，而是优先抽模式：`execute_code` RPC、skills 文件系统、observer/middleware 契约、cron scanner、terminal backend 配置、安全文档。它的代码量和依赖面很大，成熟度不能只看 README；但对正在做长期 agent、消息平台 agent、自治工具调用或代理可观测性的工程师，这是一个很值得拆读的样本。下一步最合理是 clone-and-run 一个最小 `hermes chat --query`，再挑 `execute_code`、cron、MCP bridge 三条链路做实测。

（来源：README/artifactAudit）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/procedural-memory-skills]]、[[concepts/terminal-backend]]。另见 [[content/nousresearch-hermes-agent]]、[[claims/nousresearch-hermes-agent-main-claim]]。
