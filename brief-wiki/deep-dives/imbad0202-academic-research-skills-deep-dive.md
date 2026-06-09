---
content: "imbad0202-academic-research-skills"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "academic-research-skills — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "Imbad0202/academic-research-skills：GitHub 描述为“Academic Research Skills for Claude Code: research → write → review → revise → finalize”。"
  what_it_does: "Academic Research Skills for Claude Code: research → write → review → revise → finalize"
  metadata:
    language: "Python"
    total_stars: "28981"
    stars_in_period: "23725"
    author: "Imbad0202"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "agents"
    - "skills"
    - "models"
  pain_point: "适合关注“AI 研究助手如何不越权”的应用开发者。它把生成、审稿、引用核验、写入权限、评测 gold set 都落成文件协议，而不是只写 prompt。"
  core_capabilities:
    - "Material Passport"
    - "Scoped Write Guard"
    - "Narrowed False Reducer"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "和 PaperOrchestra 比：PaperOrchestra 面向“把非结构化预写材料转成可投稿 LaTeX 稿件”，并在 PaperWritingBench 上报告人评胜率优势；ARS 更像 Claude Code 内的人工在环研究工作台，强项是 checkpoint、Material Passport、citation gate、scope guard。要自动组稿和 benchmark 论文写作，选 PaperOrchestra；要在 Claude Code 里做可审计的人机协作，选 ARS。（来源：README v3.3/v3.7；PaperOrchestra arXiv https://arxiv.org/abs/2604.05018 Abstract） 和 ResearchPilot 比：ResearchPilot 是 local-first/self-hostable 文献综述系统，栈是 FastAPI、Next.js、DSPy、SQLite、Qdrant，侧重 Semantic Scholar/arXiv 检索、摘要抽取、related-work 草稿；其摘要自述限制包括 abstract-only extraction 和 lack of citation verification。ARS 不提供本地 Web UI/RAG 数据库，但有 claim/citation gate、论文写作/审稿/修订全流程。要本地可部署文献综述 app，选 ResearchPilot；要 Claude Code 内的长流程写作治理，选 ARS。（来源：ResearchPilot arXiv https://arxiv.org/abs/2603.14629 Abstract；docs/SETUP Method 0/1） 和 The AI Scientist 比：The AI Scientist 追求端到端自动科研，从想法、代码、实验、图表、论文到自审；ARS 明确不跑实验，`experiment_provenance[]` 只记录研究者外部完成的实验，并让 claim 对齐 provenance。要探索自主科研系统，The AI Scientist 更贴近；要减少论文写作中的引用幻觉、越权写入和审稿遗漏，ARS 的人工在环取舍更稳。（来源：Nature https://www.nature.com/articles/s41586-026-10265-5 Abstract；README Why human-in-the-loop；README Experiment Provenance Intake）"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "真实例子：`academic-pipeline/examples/full_pipeline_example.md` 里，用户从“台湾私校少子化招生策略”开始，orchestrator 识别从 Stage 1 进入，推荐 `deep-research socratic`、`academic-paper plan`、`academic-paper-reviewer full`、revision、finalize。这个流不是一个 agent 独跑，而是 skill/agent/sidecar/schema 交接。 ```mermaid flowchart TD A[用户目标] --> B[academic-pipeline 编排] B --> C[Stage 1 研究] C --> D[deep-research socratic] D --> E[RQ Brief 和文献矩阵] E --> F[Stage 2 写作] F --> G[academic-paper plan 或 full] G --> H[Material Passport] H --> I[Stage 2.5 integrity gate] I --> J{通过} J -->|否| K[修复后重验 最多 3 轮] J -->|是| L[Stage 3 peer review] L --> M[Stage 4 revise] M --> N[Stage 4.5 final integrity] N --> O[可选 claim audit] O --> P[formatter final output] ``` 两个关键实现点：第一，插件加载时 `SessionStart` 调 `scripts/announce-ars-loaded.sh`，把命令和 3 个 plugin agents 注入上下文；第二，写文件或 Bash 前 `PreToolUse` 调 `scripts/ars_write_scope_guard.py`，用 `scripts/ars_phase_scope_manifest.json` 判断 agent 能否写入目标路径。（来源：hooks/hooks.json；scripts/announce-ars-loaded.sh；scripts/ars_write_scope_guard.py） 最小入口只有两行： ```text /plugin marketplace add Imbad0202/academic-research-skills /plugin install academic-research-skills ``` 这会让 Claude Code 发现四个 skills；传统方式则要求四个 skill 分别位于 `.claude/skills/<skill-name>/SKILL.md`。（来源：README Quick install；QUICKSTART Step 1；docs/SETUP Method 0/1）"
  essential_design_difference: "最值得复用的不是“论文 prompt”，而是几个工程边界：状态账本、写入围栏、确定性 reducer、显式未知。 - Material Passport；把跨阶段状态、引用 provenance、实验 provenance、claim intent、verification status 放到一个可传递账本。；只做单轮聊天摘要、不需要跨 session 恢复时不用引入。；`examples/passport_with_experiment_provenance.yaml` 展示 `experiment_intake_declaration`、`experiment_provenance[]`、`claim_intent_manifests[]` 和 `experiment_alignment_results[]`，适合长链 AI 应用做责任边界。（来源：examples/passport_with_experiment_provenance.yaml；shared/handoff_schemas.md） - Scoped Write Guard；用 hook 拦截写工具，把不同子 agent 限定在自己的 phase 目录。；如果应用没有本地文件写入或没有多 agent 并发写，复杂度不值得。；`ars_phase_scope_manifest.json` 给 23 个 Bucket A agent 配 `allowed_write_globs`；`ars_write_scope_guard.py` 对 Bucket A agent 全拒 Bash，这是应用层防越权的可复用模板。（来源：scripts/ars_phase_scope_manifest.json；scripts/ars_write_scope_guard.py） - Narrowed False Reducer；把外部 resolver 的 matched/unmatched/unreachable/skipped 归约成 `true|false|unresolvable`，并规定只有 ID-keyed unmatched 才是 `false`。；如果只做召回型搜索、不做阻断型验证，可以不用这么保守。；它保护非英语/区域文献不被 title-only miss 误判为伪造；这是 AI 应用里“宁可不确定，不误杀”的实用策略。（来源：shared/contracts/passport/citation_verification_summary.schema.json；scripts/citation_verification_summary.py） - Gold Set + Lift Gate；把 prompt/排序/判断逻辑的质量回归做成 gold set、report schema 和 CI gate。；没有稳定标签或指标时不要假装有评测。；`evals/gold/citation_extraction/manifest.yaml` 明确 51 条、三类标签、0.90/0.85 阈值；`scripts/check_ranking_lift.py` 用 signed_lift < -0.05 阻断未确认回归。（来源：evals/README.md；evals/gold/citation_extraction/manifest.yaml；scripts/check_ranking_lift.py） - Prose Contract；对机器难验证但人需要看的结构，明说是 prose contract，而不是硬塞 JSON schema。；如果下游机器必须消费字段，就应上 schema/lint。；`examples/contradiction_pairs_example.md` 对 `cross_paper_tensions[]` 明说没有 JSON Schema 或 lint，因为目标是让 scholar 和下游 LLM 阅读，不是假装机器能验证矛盾真实性。（来源：examples/contradiction_pairs_example.md）"
  practitioner_meaning: "建议不要先把它当“论文自动生成器”用，而是抽它的治理模式：Material Passport、scope guard、citation reducer、gold-set gate、prose contract。若团队已经重度使用 Claude Code，可以 clone-and-run；若是做独立 SaaS，需要重写 runtime 层，因为核心能力绑定 Claude Code hooks/skills。成熟度高于普通 prompt repo：有 release tag v3.12.0、CI workflows、167 个 Python 脚本、evals gold set；但项目很新、许可证非商用、完整 pipeline 的独立效果评测仍不足。（来源：git log HEAD b5a3370；.github/workflows；evals/README.md；LICENSE）"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "给 Claude Code 用的学术研究工作流套件：把找文献、写论文、审稿、修订、终稿检查拆成可路由的 skills、slash commands、hooks 和校验脚本。"
    body_md: "人话：它不是一个可 pip install 的研究模型，而是一套 Claude Code 工作流包装。已核实仓库里有 4 个顶层 skill、14 个 `commands/ars-*.md`、39 个 agent prompt 文件、`hooks/hooks.json`、167 个顶层 Python 脚本；`pyproject.toml` 只配置 pytest path，不是产品入口。（来源：README Quick install；.claude-plugin/plugin.json；commands/；hooks/hooks.json；repo tree）"
  why_worth_attention:
    summary: ""
    body_md: "适合关注“AI 研究助手如何不越权”的应用开发者。它把生成、审稿、引用核验、写入权限、评测 gold set 都落成文件协议，而不是只写 prompt。"
    bullets:
      - "流程有硬门：Stage 2.5 和 Stage 4.5 做 7 类失败模式 integrity gate，Stage 4→5 可选 `ARS_CLAIM_AUDIT=1` 做 claim-faithfulness audit。（来源：docs/ARCHITECTURE Stage × Dimension Matrix）"
      - "Claude Code 集成是真入口：plugin 安装、SessionStart announce、PreToolUse 写入范围 guard、14 个 `/ars-*` 命令都在仓库里。（来源：.claude-plugin/plugin.json；hooks/hooks.json；commands/）"
      - "它把“引用是否存在”做成确定性接口：Crossref、OpenAlex、Semantic Scholar、arXiv 四路 resolver 输出 `lookup_verified` 三分类。（来源：scripts/verification_gate/__init__.py；shared/contracts/passport/citation_verification_summary.schema.json）"
      - "有可量化测试素材：citation_extraction gold set 是 51 条，阈值为 aggregate accuracy >= 0.90、per-class accuracy >= 0.85。（来源：evals/gold/citation_extraction/manifest.yaml）"
  key_claims_evidence:
    summary: ""
    body_md: "下面把 README/manifest 自称和代码树已核实分开。插件描述里的“35+ modes、38-agent ensemble”按自称处理；本次按文件树核到 39 个 agent prompt 文件。"
    items:
      - claim: "可通过 Claude Code plugin 安装，并提供 `/ars-*` 命令入口。"
        plain_english: "不是让用户手动复制一大堆 prompt；Claude Code 里可以装 plugin，然后用 slash command 触发具体模式。"
        source: "README Quick install；docs/SETUP Method 0；commands/ars-plan.md；commands/ars-full.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "仓库含 `.claude-plugin/plugin.json`，`commands/` 下有 14 个命令文件；`ars-full` frontmatter 固定 `model: opus`，`ars-plan` 固定 `model: sonnet`。"
        does_not_support: "未证明 Claude Code 当前 marketplace 在线安装一定成功；本次没有实际安装 plugin。"
        threat: "强绑定 Claude Code runtime；换到 claude.ai web 或普通 API 不等价。"
      - claim: "四个核心 skill 分工覆盖 research → write → review → pipeline。"
        plain_english: "它把研究、写作、审稿、总编排拆成四个 Claude Code skill，不是一个单体 agent。"
        source: "deep-research/SKILL.md；academic-paper/SKILL.md；academic-paper-reviewer/SKILL.md；academic-pipeline/SKILL.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`deep-research` 声明 7 modes 和 raw data access；`academic-paper` 声明 10 modes 和 redacted；`academic-paper-reviewer` 声明 verified_only；`academic-pipeline` 声明依赖前三者。"
        does_not_support: "没有证明每个 mode 在真实长论文上都稳定产出。"
        threat: "Skill frontmatter 是路由契约，最终质量仍依赖模型执行和用户材料质量。"
      - claim: "Stage 2.5 / 4.5 integrity gates 用 7 类 AI 研究失败模式阻断。"
        plain_english: "核心不是让 AI 一路写完，而是在论文完成前后插入强制核验关卡。"
        source: "docs/ARCHITECTURE §3 Stage × Dimension Matrix；academic-pipeline/references/ai_research_failure_modes.md"
        attribution: "已核实"
        evidence_strength: "medium"
        supports: "架构矩阵列出 M1 implementation bug、M2 hallucinated citation、M3 hallucinated result、M4 shortcut reliance、M5 bug-as-insight、M6 methodology fabrication、M7 frame-lock；Stage 4.5 写明 final-check mode: 100% of claims。"
        does_not_support: "这些 gate 多数仍是 LLM/流程层判断；不是形式化证明。"
        threat: "如果用户不给原始材料、数据 provenance 或完整引用，gate 会退化成不完整检查。"
      - claim: "PreToolUse scope guard 会限制 23 个单阶段 agent 的写入范围，并拒绝它们使用 Bash。"
        plain_english: "它试图防止子 agent 写到不属于自己阶段的文件夹，减少跨阶段污染。"
        source: "hooks/hooks.json；scripts/ars_write_scope_guard.py；scripts/ars_phase_scope_manifest.json"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`hooks/hooks.json` 对 `Write|Edit|MultiEdit|Bash` 调 `ars_write_scope_guard.py`；manifest 列出 23 个 Bucket A agent 的 `allowed_write_globs`，例如 `bibliography_agent` 只能写 `phase2_*/**`。"
        does_not_support: "不保护所有 agent；脚本自述同相位跨 skill 碰撞和相位内覆盖仍是已知边界。"
        threat: "这是 Claude Code hook 机制上的防线，离开该 runtime 就不存在。"
      - claim: "引用存在性验证有独立 schema 和 API。"
        plain_english: "它不是只让审稿 agent “看一眼引用”，而是把 resolver 结果汇总成结构化字段。"
        source: "scripts/verification_gate/__init__.py；shared/contracts/passport/citation_verification_summary.schema.json；commands/ars-cache-invalidate.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`verify_citation` 组合 crossref/openalex/semantic_scholar/arxiv；schema 定义 `lookup_verified` 为 `true|false|unresolvable` 字符串；cache 默认 `~/.cache/ars/verification.db`，TTL 90 天。"
        does_not_support: "不证明 claim 被引用内容支持；那是另一个 opt-in claim audit 层。"
        threat: "外部索引覆盖不全时会出现 `unresolvable`，尤其是人文、非英文、区域文献。"
      - claim: "评测 harness 已有 gold set 和回归门槛。"
        plain_english: "至少部分判断逻辑有可跑的离线基准，不完全靠 README 口号。"
        source: "evals/README.md；evals/gold/citation_extraction/manifest.yaml；scripts/check_ranking_lift.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "citation_extraction 样本数 51，标签为 `true,false,unresolvable`；`check_ranking_lift.py` 对 signed_lift < -0.05 的回归设阻断，除非 PR 明确确认。"
        does_not_support: "README 自称的整套 pipeline 质量没有等量真实世界评测。"
        threat: "citation gold set README 自述 fresh run 约 1.0，因为 expected outcomes 按同一 reducer 规则编写；这更像 reducer 回归测试，不是外部独立评测。"
  how_it_works:
    summary: ""
    body_md: "真实例子：`academic-pipeline/examples/full_pipeline_example.md` 里，用户从“台湾私校少子化招生策略”开始，orchestrator 识别从 Stage 1 进入，推荐 `deep-research socratic`、`academic-paper plan`、`academic-paper-reviewer full`、revision、finalize。这个流不是一个 agent 独跑，而是 skill/agent/sidecar/schema 交接。\n\n```mermaid\nflowchart TD\n  A[用户目标] --> B[academic-pipeline 编排]\n  B --> C[Stage 1 研究]\n  C --> D[deep-research socratic]\n  D --> E[RQ Brief 和文献矩阵]\n  E --> F[Stage 2 写作]\n  F --> G[academic-paper plan 或 full]\n  G --> H[Material Passport]\n  H --> I[Stage 2.5 integrity gate]\n  I --> J{通过}\n  J -->|否| K[修复后重验 最多 3 轮]\n  J -->|是| L[Stage 3 peer review]\n  L --> M[Stage 4 revise]\n  M --> N[Stage 4.5 final integrity]\n  N --> O[可选 claim audit]\n  O --> P[formatter final output]\n```\n\n两个关键实现点：第一，插件加载时 `SessionStart` 调 `scripts/announce-ars-loaded.sh`，把命令和 3 个 plugin agents 注入上下文；第二，写文件或 Bash 前 `PreToolUse` 调 `scripts/ars_write_scope_guard.py`，用 `scripts/ars_phase_scope_manifest.json` 判断 agent 能否写入目标路径。（来源：hooks/hooks.json；scripts/announce-ars-loaded.sh；scripts/ars_write_scope_guard.py）\n\n最小入口只有两行：\n```text\n/plugin marketplace add Imbad0202/academic-research-skills\n/plugin install academic-research-skills\n```\n这会让 Claude Code 发现四个 skills；传统方式则要求四个 skill 分别位于 `.claude/skills/<skill-name>/SKILL.md`。（来源：README Quick install；QUICKSTART Step 1；docs/SETUP Method 0/1）"
  reusable_abstractions:
    summary: ""
    body_md: "最值得复用的不是“论文 prompt”，而是几个工程边界：状态账本、写入围栏、确定性 reducer、显式未知。"
    items:
      - name: "Material Passport"
        copy: "把跨阶段状态、引用 provenance、实验 provenance、claim intent、verification status 放到一个可传递账本。"
        skip: "只做单轮聊天摘要、不需要跨 session 恢复时不用引入。"
        why_it_matters: "`examples/passport_with_experiment_provenance.yaml` 展示 `experiment_intake_declaration`、`experiment_provenance[]`、`claim_intent_manifests[]` 和 `experiment_alignment_results[]`，适合长链 AI 应用做责任边界。（来源：examples/passport_with_experiment_provenance.yaml；shared/handoff_schemas.md）"
      - name: "Scoped Write Guard"
        copy: "用 hook 拦截写工具，把不同子 agent 限定在自己的 phase 目录。"
        skip: "如果应用没有本地文件写入或没有多 agent 并发写，复杂度不值得。"
        why_it_matters: "`ars_phase_scope_manifest.json` 给 23 个 Bucket A agent 配 `allowed_write_globs`；`ars_write_scope_guard.py` 对 Bucket A agent 全拒 Bash，这是应用层防越权的可复用模板。（来源：scripts/ars_phase_scope_manifest.json；scripts/ars_write_scope_guard.py）"
      - name: "Narrowed False Reducer"
        copy: "把外部 resolver 的 matched/unmatched/unreachable/skipped 归约成 `true|false|unresolvable`，并规定只有 ID-keyed unmatched 才是 `false`。"
        skip: "如果只做召回型搜索、不做阻断型验证，可以不用这么保守。"
        why_it_matters: "它保护非英语/区域文献不被 title-only miss 误判为伪造；这是 AI 应用里“宁可不确定，不误杀”的实用策略。（来源：shared/contracts/passport/citation_verification_summary.schema.json；scripts/citation_verification_summary.py）"
      - name: "Gold Set + Lift Gate"
        copy: "把 prompt/排序/判断逻辑的质量回归做成 gold set、report schema 和 CI gate。"
        skip: "没有稳定标签或指标时不要假装有评测。"
        why_it_matters: "`evals/gold/citation_extraction/manifest.yaml` 明确 51 条、三类标签、0.90/0.85 阈值；`scripts/check_ranking_lift.py` 用 signed_lift < -0.05 阻断未确认回归。（来源：evals/README.md；evals/gold/citation_extraction/manifest.yaml；scripts/check_ranking_lift.py）"
      - name: "Prose Contract"
        copy: "对机器难验证但人需要看的结构，明说是 prose contract，而不是硬塞 JSON schema。"
        skip: "如果下游机器必须消费字段，就应上 schema/lint。"
        why_it_matters: "`examples/contradiction_pairs_example.md` 对 `cross_paper_tensions[]` 明说没有 JSON Schema 或 lint，因为目标是让 scholar 和下游 LLM 阅读，不是假装机器能验证矛盾真实性。（来源：examples/contradiction_pairs_example.md）"
  dependency_platform_risk:
    summary: ""
    body_md: "主要风险不是 Python 依赖，而是运行时和平台边界。离开 Claude Code，很多能力会退化成普通文档。"
    items:
      - dependency: "Claude Code plugin / skills runtime"
        what_if_change: "如果 Claude Code 改 plugin、hook、subagent 或 skills 发现机制，`commands/`、`hooks/`、`skills/` 的入口会受影响。"
        exposure: "high"
        mitigation_or_unknown: "docs/SETUP 提供 plugin、project skills、global skills、standalone、Cowork/claude.ai 等路径，但 full orchestrated experience 明确推荐 Claude Code。"
        source: "docs/SETUP Installation methods；hooks/hooks.json"
      - dependency: "Anthropic API / Claude model behavior"
        what_if_change: "长流程质量、routing、审稿判断和 claim audit 都依赖模型遵循 prompt。"
        exposure: "high"
        mitigation_or_unknown: "`ARS_CROSS_MODEL` 可选交叉验证；无该变量时功能照常但少一层独立检查。"
        source: "docs/SETUP Cross-model verification；shared/cross_model_verification.md"
      - dependency: "Crossref / OpenAlex / Semantic Scholar / arXiv"
        what_if_change: "API 限流、不可达、覆盖不全会让引用验证变慢或变成 `unresolvable`。"
        exposure: "medium"
        mitigation_or_unknown: "SQLite cache 默认 `~/.cache/ars/verification.db`、90-day TTL；`/ars-cache-invalidate` 可按 citation_key 清缓存。"
        source: "commands/ars-cache-invalidate.md；scripts/verification_gate/__init__.py；docs/PERFORMANCE v3.11 citation verification"
      - dependency: "Pandoc / tectonic / fonts"
        what_if_change: "没有 Pandoc 就不能直接产 DOCX；没有 tectonic 和字体就不能直接产 PDF。"
        exposure: "medium"
        mitigation_or_unknown: "Markdown 输出仍可用；DOCX/PDF 是 optional path。"
        source: "docs/SETUP DOCX output；docs/SETUP LaTeX / PDF output；README Quick install prerequisites"
      - dependency: "CC-BY-NC-4.0 license"
        what_if_change: "商业产品直接复用内容、prompt、schema 时会受 NonCommercial 限制。"
        exposure: "medium"
        mitigation_or_unknown: "可学习设计模式；商用复用需要单独确认授权。"
        source: "LICENSE；.claude-plugin/plugin.json license"
      - dependency: "Windows long path handling"
        what_if_change: "深层测试 fixture 在默认 Windows 路径下可能 checkout 失败。"
        exposure: "low"
        mitigation_or_unknown: "本次指定目录初次 clone 命中 Filename too long；主 README/scripts/examples 可读。短路径、启用 long paths 或 WSL 可缓解。"
        source: "本次 checkout 观察；tests/fixtures/v3_6_7_pattern_eval 深层路径"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些不是 README 可以替你证明的事，落地前要自己验。"
    items:
      - "本次未实际安装 Claude Code plugin，也未跑完整 10-stage pipeline；runnable 状态按文档可运行处理，但本地执行未确认。"
      - "README 明说 Zhao et al. 启发了 v3.7.x/v3.8，但 ARS 自身的 corpus-scale evaluation 仍是 future work。（来源：README Why human-in-the-loop）"
      - "claude.ai Custom Skill 上传路径在 docs/SETUP 中被标为不推荐；仓库说未实际 live upload characterise，因此 web 端执行效果未知。（来源：docs/SETUP Method 4a）"
      - "PaperOrchestra/ResearchPilot/The AI Scientist 的对比基于公开论文摘要和 ARS 文档；没有在同一任务上复现实测。"
      - "插件 manifest 自称 35+ modes、38-agent ensemble；本次按文件树核到 39 个 agent prompt 文件，计数口径未在 README/docs 中解释。"
  judgment:
    action: "extract-pattern"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 4
    body_md: "建议不要先把它当“论文自动生成器”用，而是抽它的治理模式：Material Passport、scope guard、citation reducer、gold-set gate、prose contract。若团队已经重度使用 Claude Code，可以 clone-and-run；若是做独立 SaaS，需要重写 runtime 层，因为核心能力绑定 Claude Code hooks/skills。成熟度高于普通 prompt repo：有 release tag v3.12.0、CI workflows、167 个 Python 脚本、evals gold set；但项目很新、许可证非商用、完整 pipeline 的独立效果评测仍不足。（来源：git log HEAD b5a3370；.github/workflows；evals/README.md；LICENSE）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-radar12-20260608\\\\imbad0202-academic-research-skills\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-radar12-20260608\\imbad0202-academic-research-skills\\prompt.md"
  raw_response: "logs\\codex-deepdive-radar12-20260608\\imbad0202-academic-research-skills\\codex-last-message.json"
  invoked_at: "2026-06-09T00:40:31.939Z"
  completed_at: "2026-06-09T00:45:25.594Z"
  repo: "Imbad0202/academic-research-skills"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "Academic Research Skills for Claude Code: research → write → review → revise → finalize"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "可通过 Claude Code plugin 安装，并提供 `/ars-*` 命令入口。"
    - "四个核心 skill 分工覆盖 research → write → review → pipeline。"
    - "Stage 2.5 / 4.5 integrity gates 用 7 类 AI 研究失败模式阻断。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "docs/SETUP Installation methods；hooks/hooks.json"
    - "docs/SETUP Cross-model verification；shared/cross_model_verification.md"
    - "commands/ars-cache-invalidate.md；scripts/verification_gate/__init__.py；docs/PERFORMANCE v3.11 citation verification"
    - "docs/SETUP DOCX output；docs/SETUP LaTeX / PDF output；README Quick install prerequisites"
    - "LICENSE；.claude-plugin/plugin.json license"
    - "本次 checkout 观察；tests/fixtures/v3_6_7_pattern_eval 深层路径"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "deep_dive"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 4
  main_risk: "建议不要先把它当“论文自动生成器”用，而是抽它的治理模式：Material Passport、scope guard、citation reducer、gold-set gate、prose contract。若团队已经重度使用 Claude Code，可以 clone-and-run；若是做独立 SaaS，需要重写 runtime 层，因为核心能力绑定 Claude Code hooks/skills。成熟度高于普通 prompt repo：有 release tag v3.12.0、CI workflows、167 个 Python 脚本、evals gold set；但项目很新、许可证非商用、完整 pipeline 的独立效果评测仍不足。（来源：git log HEAD b5a3370；.github/workflows；evals/README.md；LICENSE）"
next_actions:
  - "extract-pattern"
unknowns:
  - "本次未实际安装 Claude Code plugin，也未跑完整 10-stage pipeline；runnable 状态按文档可运行处理，但本地执行未确认。"
  - "README 明说 Zhao et al. 启发了 v3.7.x/v3.8，但 ARS 自身的 corpus-scale evaluation 仍是 future work。（来源：README Why human-in-the-loop）"
  - "claude.ai Custom Skill 上传路径在 docs/SETUP 中被标为不推荐；仓库说未实际 live upload characterise，因此 web 端执行效果未知。（来源：docs/SETUP Method 4a）"
  - "PaperOrchestra/ResearchPilot/The AI Scientist 的对比基于公开论文摘要和 ARS 文档；没有在同一任务上复现实测。"
  - "插件 manifest 自称 35+ modes、38-agent ensemble；本次按文件树核到 39 个 agent prompt 文件，计数口径未在 README/docs 中解释。"
builder_reuse:
  pattern: "Material Passport"
  copy: "把跨阶段状态、引用 provenance、实验 provenance、claim intent、verification status 放到一个可传递账本。"
  skip: "只做单轮聊天摘要、不需要跨 session 恢复时不用引入。"
  why_it_matters: "`examples/passport_with_experiment_provenance.yaml` 展示 `experiment_intake_declaration`、`experiment_provenance[]`、`claim_intent_manifests[]` 和 `experiment_alignment_results[]`，适合长链 AI 应用做责任边界。（来源：examples/passport_with_experiment_provenance.yaml；shared/handoff_schemas.md）"
dependency_platform_risk:
  dependency: "Claude Code plugin / skills runtime"
  what_if_change: "如果 Claude Code 改 plugin、hook、subagent 或 skills 发现机制，`commands/`、`hooks/`、`skills/` 的入口会受影响。"
  exposure: "high"
  mitigation_or_unknown: "docs/SETUP 提供 plugin、project skills、global skills、standalone、Cowork/claude.ai 等路径，但 full orchestrated experience 明确推荐 Claude Code。"
claim_ledger:
  - claim: "可通过 Claude Code plugin 安装，并提供 `/ars-*` 命令入口。"
    plain_english: "不是让用户手动复制一大堆 prompt；Claude Code 里可以装 plugin，然后用 slash command 触发具体模式。"
    source: "README Quick install；docs/SETUP Method 0；commands/ars-plan.md；commands/ars-full.md"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "仓库含 `.claude-plugin/plugin.json`，`commands/` 下有 14 个命令文件；`ars-full` frontmatter 固定 `model: opus`，`ars-plan` 固定 `model: sonnet`。"
    does_not_support: "未证明 Claude Code 当前 marketplace 在线安装一定成功；本次没有实际安装 plugin。"
    threat: "强绑定 Claude Code runtime；换到 claude.ai web 或普通 API 不等价。"
  - claim: "四个核心 skill 分工覆盖 research → write → review → pipeline。"
    plain_english: "它把研究、写作、审稿、总编排拆成四个 Claude Code skill，不是一个单体 agent。"
    source: "deep-research/SKILL.md；academic-paper/SKILL.md；academic-paper-reviewer/SKILL.md；academic-pipeline/SKILL.md"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`deep-research` 声明 7 modes 和 raw data access；`academic-paper` 声明 10 modes 和 redacted；`academic-paper-reviewer` 声明 verified_only；`academic-pipeline` 声明依赖前三者。"
    does_not_support: "没有证明每个 mode 在真实长论文上都稳定产出。"
    threat: "Skill frontmatter 是路由契约，最终质量仍依赖模型执行和用户材料质量。"
  - claim: "Stage 2.5 / 4.5 integrity gates 用 7 类 AI 研究失败模式阻断。"
    plain_english: "核心不是让 AI 一路写完，而是在论文完成前后插入强制核验关卡。"
    source: "docs/ARCHITECTURE §3 Stage × Dimension Matrix；academic-pipeline/references/ai_research_failure_modes.md"
    attribution: "已核实"
    evidence_strength: "medium"
    supports: "架构矩阵列出 M1 implementation bug、M2 hallucinated citation、M3 hallucinated result、M4 shortcut reliance、M5 bug-as-insight、M6 methodology fabrication、M7 frame-lock；Stage 4.5 写明 final-check mode: 100% of claims。"
    does_not_support: "这些 gate 多数仍是 LLM/流程层判断；不是形式化证明。"
    threat: "如果用户不给原始材料、数据 provenance 或完整引用，gate 会退化成不完整检查。"
  - claim: "PreToolUse scope guard 会限制 23 个单阶段 agent 的写入范围，并拒绝它们使用 Bash。"
    plain_english: "它试图防止子 agent 写到不属于自己阶段的文件夹，减少跨阶段污染。"
    source: "hooks/hooks.json；scripts/ars_write_scope_guard.py；scripts/ars_phase_scope_manifest.json"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`hooks/hooks.json` 对 `Write|Edit|MultiEdit|Bash` 调 `ars_write_scope_guard.py`；manifest 列出 23 个 Bucket A agent 的 `allowed_write_globs`，例如 `bibliography_agent` 只能写 `phase2_*/**`。"
    does_not_support: "不保护所有 agent；脚本自述同相位跨 skill 碰撞和相位内覆盖仍是已知边界。"
    threat: "这是 Claude Code hook 机制上的防线，离开该 runtime 就不存在。"
  - claim: "引用存在性验证有独立 schema 和 API。"
    plain_english: "它不是只让审稿 agent “看一眼引用”，而是把 resolver 结果汇总成结构化字段。"
    source: "scripts/verification_gate/__init__.py；shared/contracts/passport/citation_verification_summary.schema.json；commands/ars-cache-invalidate.md"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`verify_citation` 组合 crossref/openalex/semantic_scholar/arxiv；schema 定义 `lookup_verified` 为 `true|false|unresolvable` 字符串；cache 默认 `~/.cache/ars/verification.db`，TTL 90 天。"
    does_not_support: "不证明 claim 被引用内容支持；那是另一个 opt-in claim audit 层。"
    threat: "外部索引覆盖不全时会出现 `unresolvable`，尤其是人文、非英文、区域文献。"
  - claim: "评测 harness 已有 gold set 和回归门槛。"
    plain_english: "至少部分判断逻辑有可跑的离线基准，不完全靠 README 口号。"
    source: "evals/README.md；evals/gold/citation_extraction/manifest.yaml；scripts/check_ranking_lift.py"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "citation_extraction 样本数 51，标签为 `true,false,unresolvable`；`check_ranking_lift.py` 对 signed_lift < -0.05 的回归设阻断，除非 PR 明确确认。"
    does_not_support: "README 自称的整套 pipeline 质量没有等量真实世界评测。"
    threat: "citation gold set README 自述 fresh run 约 1.0，因为 expected outcomes 按同一 reducer 规则编写；这更像 reducer 回归测试，不是外部独立评测。"
render_warnings:
  - "faithfulness.high_risk_claim_attribution line 57: 和 PaperOrchestra 比：PaperOrchestra 面向“把非结构化预写材料转成可投稿 LaTeX 稿件”，并在 PaperWritingBench 上报告人评胜率优势；ARS 更像 Claude Code 内的人工在环研究工作台，强项是 checkpoin..."
  - "faithfulness.unknown_assertion line 57 term \"The AI Scientist\": 和 PaperOrchestra 比：PaperOrchestra 面向“把非结构化预写材料转成可投稿 LaTeX 稿件”，并在 PaperWritingBench 上报告人评胜率优势；ARS 更像 Claude Code 内的人工在环研究工作台，强项是 checkpoin..."
artifact_audit:
  official_repo: "https://github.com/Imbad0202/academic-research-skills"
  official_data: "not_found"
  evaluation_code: "artifactAudit.has_tests=true"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "NOASSERTION"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

Imbad0202/academic-research-skills：GitHub 描述为“Academic Research Skills for Claude Code: research → write → review → revise → finalize”。

（来源：README/artifactAudit）

## 干什么

Academic Research Skills for Claude Code: research → write → review → revise → finalize

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 28981 |
| stars_in_period | 23725 |
| author | Imbad0202 |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- agents（来源：数据不足）
- skills（来源：数据不足）
- models（来源：数据不足）

## 解决什么痛点

适合关注“AI 研究助手如何不越权”的应用开发者。它把生成、审稿、引用核验、写入权限、评测 gold set 都落成文件协议，而不是只写 prompt。

（来源：README/artifactAudit）

## 核心能力

- Material Passport（来源：数据不足）
- Scoped Write Guard（来源：数据不足）
- Narrowed False Reducer（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

和 PaperOrchestra 比：PaperOrchestra 面向“把非结构化预写材料转成可投稿 LaTeX 稿件”，并在 PaperWritingBench 上报告人评胜率优势；ARS 更像 Claude Code 内的人工在环研究工作台，强项是 checkpoint、Material Passport、citation gate、scope guard。要自动组稿和 benchmark 论文写作，选 PaperOrchestra；要在 Claude Code 里做可审计的人机协作，选 ARS。（来源：README v3.3/v3.7；PaperOrchestra arXiv https://arxiv.org/abs/2604.05018 Abstract） 和 ResearchPilot 比：ResearchPilot 是 local-first/self-hostable 文献综述系统，栈是 FastAPI、Next.js、DSPy、SQLite、Qdrant，侧重 Semantic Scholar/arXiv 检索、摘要抽取、related-work 草稿；其摘要自述限制包括 abstract-only extraction 和 lack of citation verification。ARS 不提供本地 Web UI/RAG 数据库，但有 claim/citation gate、论文写作/审稿/修订全流程。要本地可部署文献综述 app，选 ResearchPilot；要 Claude Code 内的长流程写作治理，选 ARS。（来源：ResearchPilot arXiv https://arxiv.org/abs/2603.14629 Abstract；docs/SETUP Method 0/1） 和 The AI Scientist 比：The AI Scientist 追求端到端自动科研，从想法、代码、实验、图表、论文到自审；ARS 明确不跑实验，`experiment_provenance[]` 只记录研究者外部完成的实验，并让 claim 对齐 provenance。要探索自主科研系统，The AI Scientist 更贴近；要减少论文写作中的引用幻觉、越权写入和审稿遗漏，ARS 的人工在环取舍更稳。（来源：Nature https://www.nature.com/articles/s41586-026-10265-5 Abstract；README Why human-in-the-loop；README Experiment Provenance Intake）

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

真实例子：`academic-pipeline/examples/full_pipeline_example.md` 里，用户从“台湾私校少子化招生策略”开始，orchestrator 识别从 Stage 1 进入，推荐 `deep-research socratic`、`academic-paper plan`、`academic-paper-reviewer full`、revision、finalize。这个流不是一个 agent 独跑，而是 skill/agent/sidecar/schema 交接。 ```mermaid flowchart TD A[用户目标] --> B[academic-pipeline 编排] B --> C[Stage 1 研究] C --> D[deep-research socratic] D --> E[RQ Brief 和文献矩阵] E --> F[Stage 2 写作] F --> G[academic-paper plan 或 full] G --> H[Material Passport] H --> I[Stage 2.5 integrity gate] I --> J{通过} J -->|否| K[修复后重验 最多 3 轮] J -->|是| L[Stage 3 peer review] L --> M[Stage 4 revise] M --> N[Stage 4.5 final integrity] N --> O[可选 claim audit] O --> P[formatter final output] ``` 两个关键实现点：第一，插件加载时 `SessionStart` 调 `scripts/announce-ars-loaded.sh`，把命令和 3 个 plugin agents 注入上下文；第二，写文件或 Bash 前 `PreToolUse` 调 `scripts/ars_write_scope_guard.py`，用 `scripts/ars_phase_scope_manifest.json` 判断 agent 能否写入目标路径。（来源：hooks/hooks.json；scripts/announce-ars-loaded.sh；scripts/ars_write_scope_guard.py） 最小入口只有两行： ```text /plugin marketplace add Imbad0202/academic-research-skills /plugin install academic-research-skills ``` 这会让 Claude Code 发现四个 skills；传统方式则要求四个 skill 分别位于 `.claude/skills/<skill-name>/SKILL.md`。（来源：README Quick install；QUICKSTART Step 1；docs/SETUP Method 0/1）

## 本质不同的设计取舍

最值得复用的不是“论文 prompt”，而是几个工程边界：状态账本、写入围栏、确定性 reducer、显式未知。 - Material Passport；把跨阶段状态、引用 provenance、实验 provenance、claim intent、verification status 放到一个可传递账本。；只做单轮聊天摘要、不需要跨 session 恢复时不用引入。；`examples/passport_with_experiment_provenance.yaml` 展示 `experiment_intake_declaration`、`experiment_provenance[]`、`claim_intent_manifests[]` 和 `experiment_alignment_results[]`，适合长链 AI 应用做责任边界。（来源：examples/passport_with_experiment_provenance.yaml；shared/handoff_schemas.md） - Scoped Write Guard；用 hook 拦截写工具，把不同子 agent 限定在自己的 phase 目录。；如果应用没有本地文件写入或没有多 agent 并发写，复杂度不值得。；`ars_phase_scope_manifest.json` 给 23 个 Bucket A agent 配 `allowed_write_globs`；`ars_write_scope_guard.py` 对 Bucket A agent 全拒 Bash，这是应用层防越权的可复用模板。（来源：scripts/ars_phase_scope_manifest.json；scripts/ars_write_scope_guard.py） - Narrowed False Reducer；把外部 resolver 的 matched/unmatched/unreachable/skipped 归约成 `true|false|unresolvable`，并规定只有 ID-keyed unmatched 才是 `false`。；如果只做召回型搜索、不做阻断型验证，可以不用这么保守。；它保护非英语/区域文献不被 title-only miss 误判为伪造；这是 AI 应用里“宁可不确定，不误杀”的实用策略。（来源：shared/contracts/passport/citation_verification_summary.schema.json；scripts/citation_verification_summary.py） - Gold Set + Lift Gate；把 prompt/排序/判断逻辑的质量回归做成 gold set、report schema 和 CI gate。；没有稳定标签或指标时不要假装有评测。；`evals/gold/citation_extraction/manifest.yaml` 明确 51 条、三类标签、0.90/0.85 阈值；`scripts/check_ranking_lift.py` 用 signed_lift < -0.05 阻断未确认回归。（来源：evals/README.md；evals/gold/citation_extraction/manifest.yaml；scripts/check_ranking_lift.py） - Prose Contract；对机器难验证但人需要看的结构，明说是 prose contract，而不是硬塞 JSON schema。；如果下游机器必须消费字段，就应上 schema/lint。；`examples/contradiction_pairs_example.md` 对 `cross_paper_tensions[]` 明说没有 JSON Schema 或 lint，因为目标是让 scholar 和下游 LLM 阅读，不是假装机器能验证矛盾真实性。（来源：examples/contradiction_pairs_example.md）

## 对从业者意味着什么

建议不要先把它当“论文自动生成器”用，而是抽它的治理模式：Material Passport、scope guard、citation reducer、gold-set gate、prose contract。若团队已经重度使用 Claude Code，可以 clone-and-run；若是做独立 SaaS，需要重写 runtime 层，因为核心能力绑定 Claude Code hooks/skills。成熟度高于普通 prompt repo：有 release tag v3.12.0、CI workflows、167 个 Python 脚本、evals gold set；但项目很新、许可证非商用、完整 pipeline 的独立效果评测仍不足。（来源：git log HEAD b5a3370；.github/workflows；evals/README.md；LICENSE）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/claude-code-skill-suite]]、[[concepts/material-passport]]。另见 [[content/imbad0202-academic-research-skills]]、[[claims/imbad0202-academic-research-skills-main-claim]]。
