---
content: "rohitg00-ai-engineering-from-scratch"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "install"
project_type: "template_boilerplate"
title: "ai-engineering-from-scratch — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "rohitg00/ai-engineering-from-scratch：GitHub 描述为“Learn it. Build it. Ship it for others”。"
  what_it_does: "Learn it. Build it. Ship it for others."
  metadata:
    language: "Python"
    total_stars: "30340"
    stars_in_period: "23390"
    author: "rohitg00"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "mcp"
    - "skills"
  pain_point: "值得看，不是因为它声称“从零学 AI”，而是因为 repo 里确实有大量可运行小样例和可迁移的 agent 工程模板。对做 AI 应用的人，最有价值的是 Phase 13/14/19：MCP、agent loop、sandbox、rules engine、workbench。"
  core_capabilities:
    - "ReAct loop 教学骨架"
    - "MCP notes server 形状"
    - "Agent Workbench pack"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "横向看，它不是 LangGraph/CrewAI 这类运行时，而是课程 + 模板库。 对比 Hugging Face Agents Course：HF 官方页自称覆盖 smolagents、LlamaIndex、LangGraph，并强调把 agents 分享到 Hugging Face Hub。选 HF：想快学现成 agent library 和 Hub 工作流；选本 repo：想从 ToolRegistry、ReAct loop、MCP stdio 这些底层形状自己写一遍。HF 能力为官方自称，未在本 repo 中核验。（外部来源：https://huggingface.co/learn/agents-course/en） 对比 Full Stack Deep Learning：FSDL 官方页强调从 2018 年起的 full-stack deep learning bootcamp/课程。选 FSDL：想系统学产品化 deep learning 与生产课程；选本 repo：想要 503 个目录化 lesson、agent/MCP/safety 代码样例，以及可安装 skills。FSDL 课程范围为官方自称。（外部来源：https://fullstackdeeplearning.com/course/） 对比 GokuMohandas/mlops-course：该 repo 描述是设计、开发、部署、迭代 production-grade ML applications。选 Made With ML/mlops-course：想沿一个 MLOps 应用路径做测试、数据、部署；选本 repo：想横跨 math、LLM、MCP、agents、safety，并抽取很多小模板。该替代项能力来自其 GitHub 描述，未在本次本地核验。（外部来源：https://github.com/GokuMohandas/mlops-course）"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "```mermaid flowchart TD A[README 选路径] --> B[phase lesson] B --> C[docs en] B --> D[code main] B --> E[quiz json] B --> F[outputs skill prompt] F --> G[install skills] B --> H[build catalog] I[workbench pack] --> J[scaffold repo] D --> K[本地运行验证] ``` 真实流：读者从 README 选 phase，进入某个 lesson；每课通常有 `docs/en.md`、`code/`、`quiz.json`、`outputs/`。（来源：README The shape of a lesson） Phase 14 Lesson 01 的实际例子： ```bash python phases/14-agent-engineering/01-the-agent-loop/code/main.py ``` 这次运行得到 5 次工具调用：先 `kv_set base=120`，再 `calculator 120 * 0.15` 得 18.0，再算 `120 + 18.0` 得 138.0，最后 `kv_get base` 后 finish。（来源：phases/14-agent-engineering/01-the-agent-loop/code/main.py；本地运行） MCP 例子走另一条线：Phase 13 Lesson 07 的 server 从 stdin 读 JSON-RPC，一行一个 request；`tools/call` 调 `notes_create` 后返回 text block 和 `notes://...` resource。（来源：phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py） 可复用交付物走安装线： ```bash python3 scripts/install_skills.py <target> --phase 14 ``` 脚本按前缀识别 `skill-`、`prompt-`、`agent-`，默认写成 `<target>/<name>/SKILL.md` 并生成 manifest。（来源：scripts/install_skills.py target_path/write_manifest）"
  essential_design_difference: "最值得抽的不是课程文本，而是这些小而完整的工程形状。 - ReAct loop 教学骨架；`AgentLoop` + `ToolRegistry.dispatch()` + `max_turns` + trace；适合拿来写内部 agent loop review checklist。；不要直接拿 ToyLLM 当真实 provider adapter。；它把 agent 可靠性的底线讲清楚：工具错误要变成 observation，循环要有预算。（来源：phases/14-agent-engineering/01-the-agent-loop/code/main.py；outputs/skill-agent-loop.md） - MCP notes server 形状；stdlib stdio JSON-RPC dispatcher、tools/resources/prompts 三类 registry、structured error。；生产环境不要跳过 auth、remote transport、subscriptions。；适合作为 MCP 概念最小样例，比直接上 SDK 更容易看清 wire protocol。（来源：phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py） - Agent Workbench pack；`AGENTS.md`、`task_board.schema.json`、`agent_state.schema.json`、`init_agent.py`、`verify_agent.py`、handoff docs。；不要把它当成熟产品；它是 repo 工作流模板。；对 coding agent 团队，任务边界、状态、验证、handoff 比单次 prompt 更可复用。（来源：phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/） - Catalog-as-truth；`scripts/build_catalog.py` 从目录树生成 totals 和 lesson records。；不要用 README 手写数字做自动化输入。；README 已出现 skill 数和时长漂移；catalog 才适合下游站点或 dashboard。（来源：scripts/build_catalog.py；README The toolkit） - Rules engine 示例；YAML constitution + regex predicate + violation report + fixer；如 `no-pii-in-examples`、`bounded-length`。；不要把 regex safety 当完整安全策略。；能快速做输出风格/合规检查的本地 prototype。（来源：phases/19-capstone-projects/86-constitutional-rules-engine/code/rules.yml）"
  practitioner_meaning: "建议抽模式，不建议当框架接入。优先读 Phase 13/14/19，复制 agent loop、MCP server、workbench pack、sandbox、rules engine 的形状；README 的大数字和时长不要直接引用为事实。成熟度给 3：文件量和 CI 存在，但统计漂移、长路径、无 release、lesson_run 在本机失败，说明它仍像高速迭代中的课程仓库。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "这是一个从数学、模型、LLM 到 Agent/MCP/安全的开源 AI 工程课程仓库，不是一个可直接接入生产的 agent framework。"
    body_md: "人话：它更像“AI 工程训练场 + 可复制工具箱”，每课有 docs、code、quiz、outputs。术语上，它把 curriculum、agent skills、MCP 示例、agent workbench pack 放在一个 repo 里。（来源：README How this works；scripts/build_catalog.py totals）"
  why_worth_attention:
    summary: ""
    body_md: "值得看，不是因为它声称“从零学 AI”，而是因为 repo 里确实有大量可运行小样例和可迁移的 agent 工程模板。对做 AI 应用的人，最有价值的是 Phase 13/14/19：MCP、agent loop、sandbox、rules engine、workbench。"
    bullets:
      - "已核实：本地 catalog 统计为 20 phases、503 lessons、385 skills、99 prompts、0 agents、740 code_files；README 的“388 skills”与本次 catalog 结果不一致。（来源：scripts/build_catalog.py compute_totals；README The toolkit）"
      - "已核实：Phase 14 Lesson 01 的 `code/main.py` 是 stdlib Toy ReAct loop，注册 `calculator`、`kv_get`、`kv_set`，本次运行输出 5 次 action，最终答案 138.0。（来源：phases/14-agent-engineering/01-the-agent-loop/code/main.py）"
      - "已核实：Phase 13 Lesson 07 有 stdio JSON-RPC MCP server，覆盖 `initialize`、`tools/list`、`tools/call`、`resources/list/read`、`prompts/list/get`。（来源：phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py）"
      - "已核实：Phase 14 capstone 输出 Agent Workbench pack，包含 `AGENTS.md`、schemas、scripts、docs，并可用 `scripts/scaffold_workbench.py` 复制到其他 repo。（来源：README Drop the agent workbench；scripts/scaffold_workbench.py）"
  key_claims_evidence:
    summary: ""
    body_md: "核心判断：课程广度是真的；“每课都 ship 一个 artifact”的营销说法需要按仓库实际输出重新解释；工程模板比课程口号更值得抽取。"
    items:
      - claim: "仓库覆盖 20 phases、503 lessons。"
        plain_english: "不是 README 单说；本次调用 `scripts.build_catalog.build_catalog()` 也得到 phases=20、lessons=503。"
        source: "README badges/hero；scripts/build_catalog.py compute_totals；本地运行 2026-06-09"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "目录树和 catalog 构建逻辑按 `phases/NN/MM` 扫描，结果为 20/503。"
        does_not_support: "不证明每课质量一致，也不证明总学习时长准确。"
        threat: "ROADMAP 顶部写 ~314 hours，底部写 ~1,050 hours，README 写 ~320 hours，时长口径冲突。"
      - claim: "README 称每课都会产出 prompt、skill、agent 或 MCP server。"
        plain_english: "repo 里确实有大量 outputs，但本次 catalog 只识别到 385 skills、99 prompts、0 agents；README 同页又写 388 skills。"
        source: "README Every lesson ships something；README The toolkit；scripts/build_catalog.py ARTIFACT_TYPES"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "大量 `phases/**/outputs/*.md` 存在，安装脚本也只扫描 `skill-`、`prompt-`、`agent-` 前缀 markdown。"
        does_not_support: "不支持“503 个已分类可安装 artifact”这个强说法。"
        threat: "README、AGENTS.md、catalog 统计存在漂移；读者应以 `scripts/build_catalog.py` 的本地结果为准。"
      - claim: "Phase 14 Lesson 01 展示了最小 agent loop。"
        plain_english: "它不是调用 LangGraph/CrewAI，而是用 ToyLLM 脚本、ToolRegistry、max_turns、history 自己跑一遍。"
        source: "phases/14-agent-engineering/01-the-agent-loop/code/main.py；README FIG_002"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "本次运行 `python phases/14-agent-engineering/01-the-agent-loop/code/main.py` 成功，trace 包含 `kv_set`、`calculator`、`kv_get`。"
        does_not_support: "不证明它能直接接真实模型 provider；ToyLLM 是确定性脚本。"
        threat: "用于教学很好；用于生产要补 provider schema、重试、持久化、权限、观测。"
      - claim: "仓库内置 MCP server 教学样例。"
        plain_english: "Phase 13 Lesson 07 的 notes server 用 stdio + JSON-RPC，暴露 tools、resources、prompts 三类 MCP primitive。"
        source: "phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py；docs/en.md Build It"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`PROTOCOL_VERSION='2025-11-25'`，工具包括 `notes_list`、`notes_search`、`notes_create`。"
        does_not_support: "源码注释明确说不是生产 server：无 auth、无 Streamable HTTP、无 subscriptions。"
        threat: "MCP spec 与 SDK 变化会让教学实现过时。"
      - claim: "可以把课程 skills 安装到 agent 工具目录。"
        plain_english: "`scripts/install_skills.py` 会扫描 `phases/**/outputs`，支持 `--phase`、`--tag`、`--layout`、`--dry-run`、`--force`。"
        source: "README Install every course skill；scripts/install_skills.py argparse/build_plan"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "默认 layout 为 `<target>/<name>/SKILL.md`，并写 `manifest.json`。"
        does_not_support: "不证明所有 agent 客户端都兼容这些 skill frontmatter。"
        threat: "Skill 目录约定仍是工具生态约定，不是跨厂商标准。"
      - claim: "网站有 30 天 reader/page view 数据。"
        plain_english: "`site/stats.json` 写着 150,639 readers、241,669 page views、updated 2026-06-07，但 note 说明 Vercel 没有 public analytics API。"
        source: "site/stats.json；README STATS block"
        attribution: "自称"
        evidence_strength: "low"
        supports: "repo 文件内存在该数字。"
        does_not_support: "无法从 repo 独立验证 Vercel Analytics 后台数据。"
        threat: "作为热度信号可参考，不能当第三方验证。"
  how_it_works:
    summary: ""
    body_md: "```mermaid\nflowchart TD\n  A[README 选路径] --> B[phase lesson]\n  B --> C[docs en]\n  B --> D[code main]\n  B --> E[quiz json]\n  B --> F[outputs skill prompt]\n  F --> G[install skills]\n  B --> H[build catalog]\n  I[workbench pack] --> J[scaffold repo]\n  D --> K[本地运行验证]\n```\n\n真实流：读者从 README 选 phase，进入某个 lesson；每课通常有 `docs/en.md`、`code/`、`quiz.json`、`outputs/`。（来源：README The shape of a lesson）\n\nPhase 14 Lesson 01 的实际例子：\n```bash\npython phases/14-agent-engineering/01-the-agent-loop/code/main.py\n```\n这次运行得到 5 次工具调用：先 `kv_set base=120`，再 `calculator 120 * 0.15` 得 18.0，再算 `120 + 18.0` 得 138.0，最后 `kv_get base` 后 finish。（来源：phases/14-agent-engineering/01-the-agent-loop/code/main.py；本地运行）\n\nMCP 例子走另一条线：Phase 13 Lesson 07 的 server 从 stdin 读 JSON-RPC，一行一个 request；`tools/call` 调 `notes_create` 后返回 text block 和 `notes://...` resource。（来源：phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py）\n\n可复用交付物走安装线：\n```bash\npython3 scripts/install_skills.py <target> --phase 14\n```\n脚本按前缀识别 `skill-`、`prompt-`、`agent-`，默认写成 `<target>/<name>/SKILL.md` 并生成 manifest。（来源：scripts/install_skills.py target_path/write_manifest）"
  reusable_abstractions:
    summary: ""
    body_md: "最值得抽的不是课程文本，而是这些小而完整的工程形状。"
    items:
      - name: "ReAct loop 教学骨架"
        copy: "`AgentLoop` + `ToolRegistry.dispatch()` + `max_turns` + trace；适合拿来写内部 agent loop review checklist。"
        skip: "不要直接拿 ToyLLM 当真实 provider adapter。"
        why_it_matters: "它把 agent 可靠性的底线讲清楚：工具错误要变成 observation，循环要有预算。（来源：phases/14-agent-engineering/01-the-agent-loop/code/main.py；outputs/skill-agent-loop.md）"
      - name: "MCP notes server 形状"
        copy: "stdlib stdio JSON-RPC dispatcher、tools/resources/prompts 三类 registry、structured error。"
        skip: "生产环境不要跳过 auth、remote transport、subscriptions。"
        why_it_matters: "适合作为 MCP 概念最小样例，比直接上 SDK 更容易看清 wire protocol。（来源：phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py）"
      - name: "Agent Workbench pack"
        copy: "`AGENTS.md`、`task_board.schema.json`、`agent_state.schema.json`、`init_agent.py`、`verify_agent.py`、handoff docs。"
        skip: "不要把它当成熟产品；它是 repo 工作流模板。"
        why_it_matters: "对 coding agent 团队，任务边界、状态、验证、handoff 比单次 prompt 更可复用。（来源：phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/）"
      - name: "Catalog-as-truth"
        copy: "`scripts/build_catalog.py` 从目录树生成 totals 和 lesson records。"
        skip: "不要用 README 手写数字做自动化输入。"
        why_it_matters: "README 已出现 skill 数和时长漂移；catalog 才适合下游站点或 dashboard。（来源：scripts/build_catalog.py；README The toolkit）"
      - name: "Rules engine 示例"
        copy: "YAML constitution + regex predicate + violation report + fixer；如 `no-pii-in-examples`、`bounded-length`。"
        skip: "不要把 regex safety 当完整安全策略。"
        why_it_matters: "能快速做输出风格/合规检查的本地 prototype。（来源：phases/19-capstone-projects/86-constitutional-rules-engine/code/rules.yml）"
  dependency_platform_risk:
    summary: ""
    body_md: "主要风险不是“跑不起来”，而是口径漂移、长路径、生态 API 变化。"
    items:
      - dependency: "Windows 文件路径长度"
        what_if_change: "本次 clone 初次 checkout 因长路径失败，需要 `git config core.longpaths true` 后恢复。"
        exposure: "medium"
        mitigation_or_unknown: "Windows 用户应先启用 longpaths；README 未看到专门说明。"
        source: "本地 clone 过程 2026-06-09；repo 深层路径如 phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/schemas/scope_contract.schema.json"
      - dependency: "README/ROADMAP 手写数字"
        what_if_change: "README 写 388 skills，catalog 本次算 385；ROADMAP 顶部 ~314 hours，底部 ~1,050 hours，README ~320 hours。"
        exposure: "medium"
        mitigation_or_unknown: "以下游自动化使用 `scripts/build_catalog.py` 为准；README 数字只当展示。"
        source: "README The toolkit；ROADMAP top/total；scripts/build_catalog.py"
      - dependency: "MCP spec / provider SDK"
        what_if_change: "Phase 13 Lesson 07 写死 `PROTOCOL_VERSION='2025-11-25'`，且源码注释说明无 auth、无 Streamable HTTP、无 subscriptions。"
        exposure: "medium"
        mitigation_or_unknown: "把它当 wire-format 教学样例；生产 MCP server 应跟官方 SDK/spec 更新。"
        source: "phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py"
      - dependency: "Python/ML 依赖"
        what_if_change: "requirements 包括 torch、transformers、datasets、openai、anthropic；不同 lesson 的运行成本差异很大。"
        exposure: "medium"
        mitigation_or_unknown: "`scripts/lesson_run.py` 默认只 py_compile，不执行；重型 lesson 需按需安装。"
        source: "requirements.txt；scripts/lesson_run.py"
      - dependency: "Vercel 静态站点构建"
        what_if_change: "`vercel.json` 用 `node site/build.js`，installCommand 是 `echo skip`；没有看到根 package.json 作为正式 Node 包入口。"
        exposure: "low"
        mitigation_or_unknown: "站点构建是静态脚本，不影响课程代码；但贡献者需保持 README/ROADMAP parser shape。"
        source: "vercel.json；site/build.js；CONTRIBUTING.md"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些不是 repo 文件能完全证明的事。"
    items:
      - "README 的 150,639 readers / 241,669 page views 来自 `site/stats.json` 自填数据；Vercel 后台未公开验证。"
      - "未看到正式 release tag；长期版本兼容策略未知。"
      - "未看到统一 pyproject.toml；课程级代码依赖与 lesson-by-lesson 运行矩阵需要逐课确认。"
      - "README 称 Claude、Cursor、Codex、OpenClaw、Hermes 都能读取 skills；各客户端的实际兼容性未逐一验证。"
      - "本次 `scripts/lesson_run.py --phase 14 --json` 在 Windows Python 3.14 下因 py_compile 写入 __pycache__ 路径失败中断；Ubuntu CI 上是否通过以 GitHub Actions 为准。"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 5
      工程深度: 4
      复用价值: 4
      成熟度: 3
    body_md: "建议抽模式，不建议当框架接入。优先读 Phase 13/14/19，复制 agent loop、MCP server、workbench pack、sandbox、rules engine 的形状；README 的大数字和时长不要直接引用为事实。成熟度给 3：文件量和 CI 存在，但统计漂移、长路径、无 release、lesson_run 在本机失败，说明它仍像高速迭代中的课程仓库。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-radar12-20260608\\\\rohitg00-ai-engineering-from-scratch\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-radar12-20260608\\rohitg00-ai-engineering-from-scratch\\prompt.md"
  raw_response: "logs\\codex-deepdive-radar12-20260608\\rohitg00-ai-engineering-from-scratch\\codex-last-message.json"
  invoked_at: "2026-06-09T00:51:06.859Z"
  completed_at: "2026-06-09T00:58:09.381Z"
  repo: "rohitg00/ai-engineering-from-scratch"
reasoning_trace:
  paper_type_decision: "project_type = template_boilerplate; evidence from README/artifactAudit only."
  central_contribution: "Learn it. Build it. Ship it for others."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "仓库覆盖 20 phases、503 lessons。"
    - "README 称每课都会产出 prompt、skill、agent 或 MCP server。"
    - "Phase 14 Lesson 01 展示了最小 agent loop。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "本地 clone 过程 2026-06-09；repo 深层路径如 phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/schemas/scope_contract.schema.json"
    - "README The toolkit；ROADMAP top/total；scripts/build_catalog.py"
    - "phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py"
    - "requirements.txt；scripts/lesson_run.py"
    - "vercel.json；site/build.js；CONTRIBUTING.md"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 4
  reuse_value: 4
  maturity: 3
  main_risk: "建议抽模式，不建议当框架接入。优先读 Phase 13/14/19，复制 agent loop、MCP server、workbench pack、sandbox、rules engine 的形状；README 的大数字和时长不要直接引用为事实。成熟度给 3：文件量和 CI 存在，但统计漂移、长路径、无 release、lesson_run 在本机失败，说明它仍像高速迭代中的课程仓库。"
next_actions:
  - "extract-pattern"
unknowns:
  - "README 的 150,639 readers / 241,669 page views 来自 `site/stats.json` 自填数据；Vercel 后台未公开验证。"
  - "未看到正式 release tag；长期版本兼容策略未知。"
  - "未看到统一 pyproject.toml；课程级代码依赖与 lesson-by-lesson 运行矩阵需要逐课确认。"
  - "README 称 Claude、Cursor、Codex、OpenClaw、Hermes 都能读取 skills；各客户端的实际兼容性未逐一验证。"
  - "本次 `scripts/lesson_run.py --phase 14 --json` 在 Windows Python 3.14 下因 py_compile 写入 __pycache__ 路径失败中断；Ubuntu CI 上是否通过以 GitHub Actions 为准。"
builder_reuse:
  pattern: "ReAct loop 教学骨架"
  copy: "`AgentLoop` + `ToolRegistry.dispatch()` + `max_turns` + trace；适合拿来写内部 agent loop review checklist。"
  skip: "不要直接拿 ToyLLM 当真实 provider adapter。"
  why_it_matters: "它把 agent 可靠性的底线讲清楚：工具错误要变成 observation，循环要有预算。（来源：phases/14-agent-engineering/01-the-agent-loop/code/main.py；outputs/skill-agent-loop.md）"
dependency_platform_risk:
  dependency: "Windows 文件路径长度"
  what_if_change: "本次 clone 初次 checkout 因长路径失败，需要 `git config core.longpaths true` 后恢复。"
  exposure: "medium"
  mitigation_or_unknown: "Windows 用户应先启用 longpaths；README 未看到专门说明。"
claim_ledger:
  - claim: "仓库覆盖 20 phases、503 lessons。"
    plain_english: "不是 README 单说；本次调用 `scripts.build_catalog.build_catalog()` 也得到 phases=20、lessons=503。"
    source: "README badges/hero；scripts/build_catalog.py compute_totals；本地运行 2026-06-09"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "目录树和 catalog 构建逻辑按 `phases/NN/MM` 扫描，结果为 20/503。"
    does_not_support: "不证明每课质量一致，也不证明总学习时长准确。"
    threat: "ROADMAP 顶部写 ~314 hours，底部写 ~1,050 hours，README 写 ~320 hours，时长口径冲突。"
  - claim: "README 称每课都会产出 prompt、skill、agent 或 MCP server。"
    plain_english: "repo 里确实有大量 outputs，但本次 catalog 只识别到 385 skills、99 prompts、0 agents；README 同页又写 388 skills。"
    source: "README Every lesson ships something；README The toolkit；scripts/build_catalog.py ARTIFACT_TYPES"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "大量 `phases/**/outputs/*.md` 存在，安装脚本也只扫描 `skill-`、`prompt-`、`agent-` 前缀 markdown。"
    does_not_support: "不支持“503 个已分类可安装 artifact”这个强说法。"
    threat: "README、AGENTS.md、catalog 统计存在漂移；读者应以 `scripts/build_catalog.py` 的本地结果为准。"
  - claim: "Phase 14 Lesson 01 展示了最小 agent loop。"
    plain_english: "它不是调用 LangGraph/CrewAI，而是用 ToyLLM 脚本、ToolRegistry、max_turns、history 自己跑一遍。"
    source: "phases/14-agent-engineering/01-the-agent-loop/code/main.py；README FIG_002"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "本次运行 `python phases/14-agent-engineering/01-the-agent-loop/code/main.py` 成功，trace 包含 `kv_set`、`calculator`、`kv_get`。"
    does_not_support: "不证明它能直接接真实模型 provider；ToyLLM 是确定性脚本。"
    threat: "用于教学很好；用于生产要补 provider schema、重试、持久化、权限、观测。"
  - claim: "仓库内置 MCP server 教学样例。"
    plain_english: "Phase 13 Lesson 07 的 notes server 用 stdio + JSON-RPC，暴露 tools、resources、prompts 三类 MCP primitive。"
    source: "phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py；docs/en.md Build It"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`PROTOCOL_VERSION='2025-11-25'`，工具包括 `notes_list`、`notes_search`、`notes_create`。"
    does_not_support: "源码注释明确说不是生产 server：无 auth、无 Streamable HTTP、无 subscriptions。"
    threat: "MCP spec 与 SDK 变化会让教学实现过时。"
  - claim: "可以把课程 skills 安装到 agent 工具目录。"
    plain_english: "`scripts/install_skills.py` 会扫描 `phases/**/outputs`，支持 `--phase`、`--tag`、`--layout`、`--dry-run`、`--force`。"
    source: "README Install every course skill；scripts/install_skills.py argparse/build_plan"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "默认 layout 为 `<target>/<name>/SKILL.md`，并写 `manifest.json`。"
    does_not_support: "不证明所有 agent 客户端都兼容这些 skill frontmatter。"
    threat: "Skill 目录约定仍是工具生态约定，不是跨厂商标准。"
  - claim: "网站有 30 天 reader/page view 数据。"
    plain_english: "`site/stats.json` 写着 150,639 readers、241,669 page views、updated 2026-06-07，但 note 说明 Vercel 没有 public analytics API。"
    source: "site/stats.json；README STATS block"
    attribution: "自称"
    evidence_strength: "low"
    supports: "repo 文件内存在该数字。"
    does_not_support: "无法从 repo 独立验证 Vercel Analytics 后台数据。"
    threat: "作为热度信号可参考，不能当第三方验证。"
artifact_audit:
  official_repo: "https://github.com/rohitg00/ai-engineering-from-scratch"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "not_found"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

rohitg00/ai-engineering-from-scratch：GitHub 描述为“Learn it. Build it. Ship it for others”。

（来源：README/artifactAudit）

## 干什么

Learn it. Build it. Ship it for others.

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 30340 |
| stars_in_period | 23390 |
| author | rohitg00 |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- mcp（来源：数据不足）
- skills（来源：数据不足）

## 解决什么痛点

值得看，不是因为它声称“从零学 AI”，而是因为 repo 里确实有大量可运行小样例和可迁移的 agent 工程模板。对做 AI 应用的人，最有价值的是 Phase 13/14/19：MCP、agent loop、sandbox、rules engine、workbench。

（来源：README/artifactAudit）

## 核心能力

- ReAct loop 教学骨架（来源：数据不足）
- MCP notes server 形状（来源：数据不足）
- Agent Workbench pack（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

横向看，它不是 LangGraph/CrewAI 这类运行时，而是课程 + 模板库。 对比 Hugging Face Agents Course：HF 官方页自称覆盖 smolagents、LlamaIndex、LangGraph，并强调把 agents 分享到 Hugging Face Hub。选 HF：想快学现成 agent library 和 Hub 工作流；选本 repo：想从 ToolRegistry、ReAct loop、MCP stdio 这些底层形状自己写一遍。HF 能力为官方自称，未在本 repo 中核验。（外部来源：https://huggingface.co/learn/agents-course/en） 对比 Full Stack Deep Learning：FSDL 官方页强调从 2018 年起的 full-stack deep learning bootcamp/课程。选 FSDL：想系统学产品化 deep learning 与生产课程；选本 repo：想要 503 个目录化 lesson、agent/MCP/safety 代码样例，以及可安装 skills。FSDL 课程范围为官方自称。（外部来源：https://fullstackdeeplearning.com/course/） 对比 GokuMohandas/mlops-course：该 repo 描述是设计、开发、部署、迭代 production-grade ML applications。选 Made With ML/mlops-course：想沿一个 MLOps 应用路径做测试、数据、部署；选本 repo：想横跨 math、LLM、MCP、agents、safety，并抽取很多小模板。该替代项能力来自其 GitHub 描述，未在本次本地核验。（外部来源：https://github.com/GokuMohandas/mlops-course）

（来源：README/artifactAudit）

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

```mermaid flowchart TD A[README 选路径] --> B[phase lesson] B --> C[docs en] B --> D[code main] B --> E[quiz json] B --> F[outputs skill prompt] F --> G[install skills] B --> H[build catalog] I[workbench pack] --> J[scaffold repo] D --> K[本地运行验证] ``` 真实流：读者从 README 选 phase，进入某个 lesson；每课通常有 `docs/en.md`、`code/`、`quiz.json`、`outputs/`。（来源：README The shape of a lesson） Phase 14 Lesson 01 的实际例子： ```bash python phases/14-agent-engineering/01-the-agent-loop/code/main.py ``` 这次运行得到 5 次工具调用：先 `kv_set base=120`，再 `calculator 120 * 0.15` 得 18.0，再算 `120 + 18.0` 得 138.0，最后 `kv_get base` 后 finish。（来源：phases/14-agent-engineering/01-the-agent-loop/code/main.py；本地运行） MCP 例子走另一条线：Phase 13 Lesson 07 的 server 从 stdin 读 JSON-RPC，一行一个 request；`tools/call` 调 `notes_create` 后返回 text block 和 `notes://...` resource。（来源：phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py） 可复用交付物走安装线： ```bash python3 scripts/install_skills.py <target> --phase 14 ``` 脚本按前缀识别 `skill-`、`prompt-`、`agent-`，默认写成 `<target>/<name>/SKILL.md` 并生成 manifest。（来源：scripts/install_skills.py target_path/write_manifest）

## 本质不同的设计取舍

最值得抽的不是课程文本，而是这些小而完整的工程形状。 - ReAct loop 教学骨架；`AgentLoop` + `ToolRegistry.dispatch()` + `max_turns` + trace；适合拿来写内部 agent loop review checklist。；不要直接拿 ToyLLM 当真实 provider adapter。；它把 agent 可靠性的底线讲清楚：工具错误要变成 observation，循环要有预算。（来源：phases/14-agent-engineering/01-the-agent-loop/code/main.py；outputs/skill-agent-loop.md） - MCP notes server 形状；stdlib stdio JSON-RPC dispatcher、tools/resources/prompts 三类 registry、structured error。；生产环境不要跳过 auth、remote transport、subscriptions。；适合作为 MCP 概念最小样例，比直接上 SDK 更容易看清 wire protocol。（来源：phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py） - Agent Workbench pack；`AGENTS.md`、`task_board.schema.json`、`agent_state.schema.json`、`init_agent.py`、`verify_agent.py`、handoff docs。；不要把它当成熟产品；它是 repo 工作流模板。；对 coding agent 团队，任务边界、状态、验证、handoff 比单次 prompt 更可复用。（来源：phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/） - Catalog-as-truth；`scripts/build_catalog.py` 从目录树生成 totals 和 lesson records。；不要用 README 手写数字做自动化输入。；README 已出现 skill 数和时长漂移；catalog 才适合下游站点或 dashboard。（来源：scripts/build_catalog.py；README The toolkit） - Rules engine 示例；YAML constitution + regex predicate + violation report + fixer；如 `no-pii-in-examples`、`bounded-length`。；不要把 regex safety 当完整安全策略。；能快速做输出风格/合规检查的本地 prototype。（来源：phases/19-capstone-projects/86-constitutional-rules-engine/code/rules.yml）

## 对从业者意味着什么

建议抽模式，不建议当框架接入。优先读 Phase 13/14/19，复制 agent loop、MCP server、workbench pack、sandbox、rules engine 的形状；README 的大数字和时长不要直接引用为事实。成熟度给 3：文件量和 CI 存在，但统计漂移、长路径、无 release、lesson_run 在本机失败，说明它仍像高速迭代中的课程仓库。

（来源：README/artifactAudit）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/from-scratch-ai-curriculum]]、[[concepts/react-agent-loop]]。另见 [[content/rohitg00-ai-engineering-from-scratch]]、[[claims/rohitg00-ai-engineering-from-scratch-main-claim]]。
