---
content: "microsoft-agent-governance-toolkit"
kind: "deep-dive"
schema_version: "project-light-spine/v1"
shape: "agent-build"
project_type: "agent_framework"
title: "agent-governance-toolkit — 深度拆解"
light_spine:
  schema_version: "project-light-spine/v1"
  one_sentence:
    summary: "Agent Governance Toolkit 是一个面向 AI Agent 的运行时治理工具集，用策略引擎、身份、审计、MCP/框架适配和 SRE 组件在工具调用前做 allow/deny/escalate/transform 决策。"
    body_md: "人话：它解决的不是“让模型听话”，而是在 agent 真正调用工具、发消息、访问资源之前，加一层应用代码里的检查门。\n\n技术词：这是 application-layer interception，也就是在 agent 框架/中间件/sidecar 层拦截动作；策略可来自 YAML、OPA/Rego、Cedar 或 ACS manifest；决策结果由宿主代码执行。（来源：README How It Works；来源：policy-engine README What ACS is）"
  why_worth_attention:
    summary: ""
    body_md: "人话：这个仓库值得看，不是因为 README 写得很满，而是因为树里确实有多语言 SDK、policy-engine、examples、docs/specs、tests、Docker 开发环境和 CI。它把“agent 安全”拆成了可落地的工程接口：动作前检查、身份、审计、MCP 网关、框架适配、运行时限制。\n\n技术词：它更像 governance runtime / policy enforcement point，而不是普通 prompt guardrail。Policy Enforcement Point 是执行拦截的一侧；Policy Decision Point 是返回 allow/deny 等 verdict 的一侧。（来源：README Packages；来源：policy-engine README How ACS integrates with AGT）"
    bullets:
      - "已核实：仓库包含 Python、TypeScript、.NET、Go、Rust 相关目录和包配置，不是单 README 项目。（来源：repo tree；来源：agent-governance-typescript/package.json；来源：agent-governance-golang/go.mod；来源：agent-governance-rust/Cargo.toml）"
      - "已核实：policy-engine 是 Rust workspace，并提供 Python SDK 绑定，README 描述其为 stateless、deterministic、fail closed policy decision runtime。（来源：policy-engine/README Core properties；来源：policy-engine/Cargo.toml；来源：policy-engine/sdk/python/pyproject.toml）"
      - "已核实：examples/quickstart 下有无需 API key 的基础示例，展示 allow/deny 动作检查。（来源：examples/quickstart README；来源：examples/quickstart/govern_in_60_seconds.py）"
      - "需谨慎：README 和 docs 中有大量性能、覆盖率、支持范围主张；其中部分是项目自称，部分文件之间存在版本/数量口径不一致。（来源：README Specifications；来源：VERSION；来源：docs/ROADMAP.md；来源：docs/LIMITATIONS.md）"
  key_claims_evidence:
    summary: ""
    body_md: "人话：最可靠的证据是文件树、包配置、示例代码和 policy-engine 的实现边界。README 中“Public Preview”“any framework”“<0.1ms”“992 conformance tests”等属于项目自称，不能直接当第三方验证结论。\n\n技术词：证据强度 high 表示我能从仓库文件/配置直接确认；medium 表示有文档和部分结构支撑但未运行验证；low 表示主要是 README/docs 自述；none 表示没有足够证据。"
    items:
      - claim: "Public Preview；production-quality, Microsoft-signed releases；GA 前可能有 breaking changes。"
        plain_english: "这是公开预览，不应按稳定 GA 组件对待。"
        source: "README Important block"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "README 明确写 Public Preview 和 may have breaking changes before GA。"
        does_not_support: "没有证明所有发布包都已经稳定、全部签名或适合生产无风险使用。"
        threat: "版本和 API 仍会变，企业集成要锁版本并做回归测试。"
      - claim: "提供 policy enforcement、identity、sandboxing、SRE for autonomous AI agents。"
        plain_english: "它试图覆盖 agent 的动作授权、身份、隔离和可靠性治理。"
        source: "README intro；README Packages；agent-governance-python/*/pyproject.toml"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "仓库中存在 Agent OS、Agent Mesh、Agent Runtime/Hypervisor、Agent SRE、Agent Compliance、Agent Marketplace、Agent Lightning 等目录和 Python 包配置。"
        does_not_support: "不代表每个子模块都达到同等成熟度或生产完备。"
        threat: "范围很大，采用时应先选最小治理层，不要一次引入全栈。"
      - claim: "One pip install, any framework。"
        plain_english: "README 说一个 pip 包可以接入任意框架。"
        source: "README intro；README Install；README Framework Support；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "仓库有 integrations 包，optional extras 包含 langchain、crewai、openai-agents、langgraph、llamaindex、haystack、pydantic-ai、adk 等。"
        does_not_support: "“any framework”没有被穷尽证明；不同框架适配深度也未在本次运行验证。"
        threat: "实际接入前必须跑目标框架的 example 或 adapter tests。"
      - claim: "Policy evaluation <0.1 ms / sub-millisecond。"
        plain_english: "项目声称策略评估很快，但这个数字只适用于策略引擎本身或特定部署。"
        source: "docs/LIMITATIONS Performance；docs/ARCHITECTURE Overview；README Security"
        attribution: "自称"
        evidence_strength: "low"
        supports: "docs/LIMITATIONS 明确说 published benchmark (<0.1ms policy evaluation) measures the policy engine only，并列出多 agent 部署会有 5-50ms 级额外开销。"
        does_not_support: "没有证明所有集成、sidecar、网络、多 agent 场景都低于 0.1ms。"
        threat: "把策略引擎延迟误当端到端延迟，会低估生产成本。"
      - claim: "10 formal specs、992 conformance tests、29 ADR。"
        plain_english: "README 给了规格和测试数量，但本次文件树计数发现 ADR 口径不完全一致。"
        source: "README Specifications；docs/specs；docs/adr；local tree count"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "已核实 docs/specs 下有 10 个 md spec 文件；本次 `docs/adr/*.md` 计数为 32；测试相关文件粗计为 786 个。"
        does_not_support: "未核实“992 conformance tests”的精确定义；README 写 29 ADR，docs/ARCHITECTURE 写 25 ADR，本地文件数为 32，口径未说明。"
        threat: "治理/合规叙述依赖精确口径，数量不一致会影响采购或安全评审可信度。"
      - claim: "AGT enforces governance at application middleware layer, not OS kernel level；policy engine and agents share the same process boundary。"
        plain_english: "它不是操作系统级沙箱；被治理代码和治理层通常在同一进程边界内。"
        source: "README Security；docs/ARCHITECTURE Security Model & Boundaries；docs/LIMITATIONS What AGT Is Not"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "README 和 Architecture 明确写不是 OS kernel level，并建议高安全环境中每个 agent 单独容器化。"
        does_not_support: "不支持把它当硬隔离、硬件隔离或完整沙箱逃逸防护。"
        threat: "被治理 agent 若能执行任意代码，可能绕过同进程中间件；需要容器/VM/网络策略叠加。"
      - claim: "ACS 是 stateless、deterministic、fail closed policy decision runtime。"
        plain_english: "policy-engine 的核心设计是每次由宿主传完整快照，运行时不靠可变历史状态，失败时 deny。"
        source: "policy-engine README Core properties；policy-engine README Intervention points；policy-engine/spec/SPECIFICATION.md"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "policy-engine README 明确列出 Stateless、Deterministic、Fail closed，并列出 agent_startup/input/pre_model_call/post_model_call/pre_tool_call/post_tool_call/output/agent_shutdown 八个 intervention points。"
        does_not_support: "未证明所有宿主 adapter 都严格按 ACS contract 实现。"
        threat: "真正的安全性取决于 host adapter 是否完整拦截、是否正确执行 verdict。"
      - claim: "Quickstart demo 不需要 API key，可以在动作列表上做 allowed/BLOCKED 检查。"
        plain_english: "最小示例是本地规则检查，不依赖 LLM 服务。"
        source: "examples/quickstart README；examples/quickstart/govern_in_60_seconds.py"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "README 写 core demos no API keys required；代码中 `govern(allow=[...], deny=[...])` 检查 web_search/read_file/execute_code/delete_file/send_email。"
        does_not_support: "未运行该示例；不代表完整框架集成无需 API key。"
        threat: "演示的治理面很窄，生产系统还要检查参数、身份、审计和失败路径。"
  how_it_works:
    summary: ""
    body_md: "人话：AGT 的核心流程是：agent 想做一件事；治理层先拿到动作上下文；策略引擎判断允许、拒绝、警告、升级审批或改写；宿主代码按结果执行或拦下；同时写审计记录。最小用法可以只是 `govern()` 包一个工具函数，复杂用法可以把策略、身份、信任分数、MCP 网关、OpenTelemetry、SRE 和运行时限制都加上。\n\n技术词：\n- Policy：一组规则，决定某个 action 是否能执行。（来源：docs/tutorials/policy-as-code/01-your-first-policy.md What is a policy）\n- PEP/PDP：宿主 adapter 是 Policy Enforcement Point；ACS/runtime 是 Policy Decision Point。（来源：policy-engine README Agent Control Specification）\n- Intervention point：agent 生命周期里的拦截点，包括 `agent_startup`、`input`、`pre_model_call`、`post_model_call`、`pre_tool_call`、`post_tool_call`、`output`、`agent_shutdown`。（来源：policy-engine README Intervention points）\n- Fail closed：策略运行失败时返回 deny，而不是默认放行。（来源：policy-engine README Core properties）\n- 同进程边界：AGT 文档明确说 policy engine 和 agent 共享进程边界；高安全场景要加容器/VM 隔离。（来源：README Security；docs/ARCHITECTURE Security Model & Boundaries）"
  reusable_abstractions:
    summary: ""
    body_md: "人话：最值得复用的不是具体包名，而是它把 agent 治理拆成几个清楚边界：动作前策略、完整快照、统一 verdict、审计证据、框架 adapter、最小到全栈的渐进路径。\n\n技术词：这些抽象可以迁移到别的 agent 平台，即使不采用 AGT 本身。"
    items:
      - name: "Intervention-point contract"
        copy: "把 agent 生命周期拆成固定拦截点：输入前、模型调用前后、工具调用前后、输出前、启动/关闭。"
        skip: "不要只在 prompt 层写规则，也不要只在最终输出层过滤。"
        why_it_matters: "危险动作通常发生在工具调用前；拦截点定义清楚，adapter 才能测试和审计。（来源：policy-engine README Intervention points）"
      - name: "Normalized verdict"
        copy: "统一返回 `allow`、`deny`、`warn`、`escalate`、`transform`，宿主只执行这个小状态机。"
        skip: "不要让每个 adapter 自己发明一套返回值。"
        why_it_matters: "统一 verdict 让多语言 SDK、审计、测试和策略迁移更容易。（来源：policy-engine README Verdict member）"
      - name: "Fail-closed runtime"
        copy: "策略解析、后端调用或运行时失败时默认 deny，并带 reserved runtime error reason。"
        skip: "不要把策略服务不可用当成 allow。"
        why_it_matters: "安全系统最常见的洞是异常路径放行。（来源：policy-engine README Core properties；policy-engine README Reserved reasons）"
      - name: "Progressive governance"
        copy: "先用本地 allow/deny 或 YAML policy，再加身份、审计、SRE、mesh、sandbox。"
        skip: "不要把全栈治理作为第一步接入门槛。"
        why_it_matters: "AGT 文档自己也说每层 optional，多数团队可能只需要 policy enforcement + audit logging。（来源：README How It Works；docs/LIMITATIONS Complexity Spectrum）"
      - name: "Evidence-aware audit"
        copy: "每次决策记录 active policy、action、decision、reason、evidence，而不是只写“blocked”。"
        skip: "不要只记录最终业务结果。"
        why_it_matters: "审计要证明当时为什么允许或拒绝；但 AGT 限制文档也提醒它记录 attempt，不验证外部世界 outcome。（来源：README The Problem；docs/LIMITATIONS Audit Logs Record Attempts, Not Outcomes）"
  dependency_platform_risk:
    summary: ""
    body_md: "人话：这个项目依赖面很宽。它的好处是覆盖很多生态；风险是每个生态都有自己的版本、构建、发布和安全维护成本。\n\n技术词：这是 multi-runtime governance stack，不是单语言 library。"
    items:
      - dependency: "Python 3.10+/3.11+ 包生态"
        what_if_change: "不同子包 requires-python 不完全一致；核心包要求 >=3.11，integrations/protocols 要求 >=3.10。"
        exposure: "medium"
        mitigation_or_unknown: "生产环境要按实际子包锁 Python 版本；README Quick Start 写 Python 3.10+，但 consolidated core pyproject 写 >=3.11。"
        source: "README Prerequisites；agent-governance-python/agent-governance-toolkit-core/pyproject.toml；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml"
      - dependency: "Node.js/npm TypeScript SDK"
        what_if_change: "TypeScript SDK 要 Node >=18.0.0，devDependencies 使用较新的 TypeScript/Jest/ESLint 版本。"
        exposure: "medium"
        mitigation_or_unknown: "锁 package-lock；在目标 Node 版本上跑 `npm test` 和 build。"
        source: "agent-governance-typescript/package.json engines/scripts/dependencies"
      - dependency: "Rust + maturin + native ACS binding"
        what_if_change: "policy-engine Python SDK 通过 maturin/PyO3 构建原生扩展；构建链或 ABI 变动会影响安装。"
        exposure: "medium"
        mitigation_or_unknown: "使用预构建 wheel 或固定 Rust/maturin；Dockerfile 使用 maturin==1.8.7 并从本地 policy-engine/sdk/python 安装。"
        source: "policy-engine/sdk/python/pyproject.toml；Dockerfile Stage 4"
      - dependency: "OPA/Rego 与 Cedar policy backend"
        what_if_change: "OPA CLI、Cedar 库或策略语义变化会影响决策结果。"
        exposure: "medium"
        mitigation_or_unknown: "固定 OPA/Cedar 版本并加入策略回归测试；Dockerfile 下载 OPA v1.4.2 并校验 sha256。"
        source: "Dockerfile OPA CLI；policy-engine README Policies；agent-governance-rust/Cargo.toml"
      - dependency: "第三方 agent 框架适配"
        what_if_change: "LangChain、CrewAI、OpenAI Agents、Google ADK 等框架 API 改动会破坏 adapter。"
        exposure: "high"
        mitigation_or_unknown: "把 adapter 当作目标框架版本的一部分锁定；仓库提供 optional extras，但未在本次运行验证每个 adapter。"
        source: "README Framework Support；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml"
      - dependency: "同进程执行边界"
        what_if_change: "如果 agent 代码被攻破并能在同进程任意执行，应用层中间件可能被绕过。"
        exposure: "high"
        mitigation_or_unknown: "AGT 文档建议高安全部署中每个 agent 单独容器化；还需网络策略、IAM、外部审计 sink。"
        source: "README Security；docs/ARCHITECTURE Security Model & Boundaries；docs/LIMITATIONS What AGT Is Not"
      - dependency: "发布版本口径"
        what_if_change: "根 VERSION、README、Python/TS/Rust/agt-policies 版本不一致会影响依赖解析和升级判断。"
        exposure: "medium"
        mitigation_or_unknown: "采用前以 package registry 和 release tag 为准；本次未联网核验 registry。"
        source: "VERSION；README Python distributions；agent-governance-python/agt-policies/pyproject.toml"
  unknowns_to_confirm:
    summary: ""
    body_md: "人话：这个仓库资料非常多，但仍有几件事不能从 README/docs/tree 直接当事实。"
    items:
      - "未运行完整测试、benchmark 或 Docker dev image；只能确认测试/CI/benchmark 文件存在。"
      - "未核验 PyPI/npm/NuGet/crates.io 上实际发布包是否与仓库版本完全一致。"
      - "未确认 README 所称 `992 conformance tests` 的计数口径；本地粗计测试相关文件为 786 个，docs/specs 文件为 10 个，docs/adr/*.md 为 32 个。"
      - "未确认 `0% bypass rate`、`26.67% violation rate` 等红队数字的可复现实验；docs/BENCHMARKS 明确提醒旧的 `26.67% / 0.00%` pair 尚无 published methodology。"
      - "未确认所有 framework adapter 在当前上游框架版本下都可运行。"
      - "未确认 Public Preview 中哪些 API 是占位、no-op、stub 或 Enterprise-only；docs 中存在多处 Public Preview 限制说明。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 5
      工程深度: 5
      复用价值: 5
      成熟度: 3
    body_md: "判断：值得 clone-and-run，但不建议只读 README 后直接生产接入。\n\n原因：它的工程面很实，目录和配置证明它覆盖 policy runtime、多语言 SDK、MCP、examples、CI、Docker 和文档规范；对于做 agent 平台、安全网关、工具调用治理的人，抽象复用价值很高。成熟度扣分来自 Public Preview、版本口径不一致、同进程边界、性能/覆盖率数字需要自测、以及 docs/LIMITATIONS 中列出的行动治理盲区。\n\n建议路径：先跑 `examples/quickstart/govern_in_60_seconds.py` 和一个目标框架 adapter；再验证 policy-engine 的 fail-closed 行为；最后才考虑身份、mesh、SRE、dashboard 或 ACS manifest。（来源：examples/quickstart README；来源：policy-engine README Build；来源：docs/LIMITATIONS）"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "medium"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"medium\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-p2p-20260603-authoring\\\\microsoft-agent-governance-toolkit\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-p2p-20260603-authoring\\microsoft-agent-governance-toolkit\\prompt.md"
  raw_response: "logs\\codex-deepdive-p2p-20260603-authoring\\microsoft-agent-governance-toolkit\\codex-last-message.json"
  invoked_at: "2026-06-03T21:28:51.786Z"
  completed_at: "2026-06-03T21:33:11.818Z"
  repo: "microsoft/agent-governance-toolkit"
reasoning_trace:
  paper_type_decision: "project_type = agent_framework; evidence from README/artifactAudit only."
  central_contribution: "AI Agent Governance Toolkit — Policy enforcement, zero-trust identity, execution sandboxing, and reliability engineering for autonomous AI agents. Covers 10/10 OWASP Agentic Top 10."
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "Public Preview；production-quality, Microsoft-signed releases；GA 前可能有 breaking changes。"
    - "提供 policy enforcement、identity、sandboxing、SRE for autonomous AI agents。"
    - "One pip install, any framework。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - "README Prerequisites；agent-governance-python/agent-governance-toolkit-core/pyproject.toml；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml"
    - "agent-governance-typescript/package.json engines/scripts/dependencies"
    - "policy-engine/sdk/python/pyproject.toml；Dockerfile Stage 4"
    - "Dockerfile OPA CLI；policy-engine README Policies；agent-governance-rust/Cargo.toml"
    - "README Framework Support；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml"
    - "README Security；docs/ARCHITECTURE Security Model & Boundaries；docs/LIMITATIONS What AGT Is Not"
    - "VERSION；README Python distributions；agent-governance-python/agt-policies/pyproject.toml"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 5
  engineering_depth: 5
  reuse_value: 5
  maturity: 3
  main_risk: "判断：值得 clone-and-run，但不建议只读 README 后直接生产接入。 原因：它的工程面很实，目录和配置证明它覆盖 policy runtime、多语言 SDK、MCP、examples、CI、Docker 和文档规范；对于做 agent 平台、安全网关、工具调用治理的人，抽象复用价值很高。成熟度扣分来自 Public Preview、版本口径不一致、同进程边界、性能/覆盖率数字需要自测、以及 docs/LIMITATIONS 中列出的行动治理盲区。 建议路径：先跑 `examples/quickstart/govern_in_60_seconds.py` 和一个目标框架 adapter；再验证 policy-engine 的 fail-closed 行为；最后才考虑身份、mesh、SRE、dashboard 或 ACS manifest。（来源：examples/quickstart README；来源：policy-engine README Build；来源：docs/LIMITATIONS）"
next_actions:
  - "clone-and-run"
unknowns:
  - "未运行完整测试、benchmark 或 Docker dev image；只能确认测试/CI/benchmark 文件存在。"
  - "未核验 PyPI/npm/NuGet/crates.io 上实际发布包是否与仓库版本完全一致。"
  - "未确认 README 所称 `992 conformance tests` 的计数口径；本地粗计测试相关文件为 786 个，docs/specs 文件为 10 个，docs/adr/*.md 为 32 个。"
  - "未确认 `0% bypass rate`、`26.67% violation rate` 等红队数字的可复现实验；docs/BENCHMARKS 明确提醒旧的 `26.67% / 0.00%` pair 尚无 published methodology。"
  - "未确认所有 framework adapter 在当前上游框架版本下都可运行。"
  - "未确认 Public Preview 中哪些 API 是占位、no-op、stub 或 Enterprise-only；docs 中存在多处 Public Preview 限制说明。"
builder_reuse:
  pattern: "Intervention-point contract"
  copy: "把 agent 生命周期拆成固定拦截点：输入前、模型调用前后、工具调用前后、输出前、启动/关闭。"
  skip: "不要只在 prompt 层写规则，也不要只在最终输出层过滤。"
  why_it_matters: "危险动作通常发生在工具调用前；拦截点定义清楚，adapter 才能测试和审计。（来源：policy-engine README Intervention points）"
dependency_platform_risk:
  dependency: "Python 3.10+/3.11+ 包生态"
  what_if_change: "不同子包 requires-python 不完全一致；核心包要求 >=3.11，integrations/protocols 要求 >=3.10。"
  exposure: "medium"
  mitigation_or_unknown: "生产环境要按实际子包锁 Python 版本；README Quick Start 写 Python 3.10+，但 consolidated core pyproject 写 >=3.11。"
claim_ledger:
  - claim: "Public Preview；production-quality, Microsoft-signed releases；GA 前可能有 breaking changes。"
    plain_english: "这是公开预览，不应按稳定 GA 组件对待。"
    source: "README Important block"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "README 明确写 Public Preview 和 may have breaking changes before GA。"
    does_not_support: "没有证明所有发布包都已经稳定、全部签名或适合生产无风险使用。"
    threat: "版本和 API 仍会变，企业集成要锁版本并做回归测试。"
  - claim: "提供 policy enforcement、identity、sandboxing、SRE for autonomous AI agents。"
    plain_english: "它试图覆盖 agent 的动作授权、身份、隔离和可靠性治理。"
    source: "README intro；README Packages；agent-governance-python/*/pyproject.toml"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "仓库中存在 Agent OS、Agent Mesh、Agent Runtime/Hypervisor、Agent SRE、Agent Compliance、Agent Marketplace、Agent Lightning 等目录和 Python 包配置。"
    does_not_support: "不代表每个子模块都达到同等成熟度或生产完备。"
    threat: "范围很大，采用时应先选最小治理层，不要一次引入全栈。"
  - claim: "One pip install, any framework。"
    plain_english: "README 说一个 pip 包可以接入任意框架。"
    source: "README intro；README Install；README Framework Support；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "仓库有 integrations 包，optional extras 包含 langchain、crewai、openai-agents、langgraph、llamaindex、haystack、pydantic-ai、adk 等。"
    does_not_support: "“any framework”没有被穷尽证明；不同框架适配深度也未在本次运行验证。"
    threat: "实际接入前必须跑目标框架的 example 或 adapter tests。"
  - claim: "Policy evaluation <0.1 ms / sub-millisecond。"
    plain_english: "项目声称策略评估很快，但这个数字只适用于策略引擎本身或特定部署。"
    source: "docs/LIMITATIONS Performance；docs/ARCHITECTURE Overview；README Security"
    attribution: "自称"
    evidence_strength: "low"
    supports: "docs/LIMITATIONS 明确说 published benchmark (<0.1ms policy evaluation) measures the policy engine only，并列出多 agent 部署会有 5-50ms 级额外开销。"
    does_not_support: "没有证明所有集成、sidecar、网络、多 agent 场景都低于 0.1ms。"
    threat: "把策略引擎延迟误当端到端延迟，会低估生产成本。"
  - claim: "10 formal specs、992 conformance tests、29 ADR。"
    plain_english: "README 给了规格和测试数量，但本次文件树计数发现 ADR 口径不完全一致。"
    source: "README Specifications；docs/specs；docs/adr；local tree count"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "已核实 docs/specs 下有 10 个 md spec 文件；本次 `docs/adr/*.md` 计数为 32；测试相关文件粗计为 786 个。"
    does_not_support: "未核实“992 conformance tests”的精确定义；README 写 29 ADR，docs/ARCHITECTURE 写 25 ADR，本地文件数为 32，口径未说明。"
    threat: "治理/合规叙述依赖精确口径，数量不一致会影响采购或安全评审可信度。"
  - claim: "AGT enforces governance at application middleware layer, not OS kernel level；policy engine and agents share the same process boundary。"
    plain_english: "它不是操作系统级沙箱；被治理代码和治理层通常在同一进程边界内。"
    source: "README Security；docs/ARCHITECTURE Security Model & Boundaries；docs/LIMITATIONS What AGT Is Not"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "README 和 Architecture 明确写不是 OS kernel level，并建议高安全环境中每个 agent 单独容器化。"
    does_not_support: "不支持把它当硬隔离、硬件隔离或完整沙箱逃逸防护。"
    threat: "被治理 agent 若能执行任意代码，可能绕过同进程中间件；需要容器/VM/网络策略叠加。"
artifact_audit:
  official_repo: "https://github.com/microsoft/agent-governance-toolkit"
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

## 一句话

人话：它解决的不是“让模型听话”，而是在 agent 真正调用工具、发消息、访问资源之前，加一层应用代码里的检查门。

技术词：这是 application-layer interception，也就是在 agent 框架/中间件/sidecar 层拦截动作；策略可来自 YAML、OPA/Rego、Cedar 或 ACS manifest；决策结果由宿主代码执行。（来源：README How It Works；来源：policy-engine README What ACS is）

## 为什么值得看

人话：这个仓库值得看，不是因为 README 写得很满，而是因为树里确实有多语言 SDK、policy-engine、examples、docs/specs、tests、Docker 开发环境和 CI。它把“agent 安全”拆成了可落地的工程接口：动作前检查、身份、审计、MCP 网关、框架适配、运行时限制。

技术词：它更像 governance runtime / policy enforcement point，而不是普通 prompt guardrail。Policy Enforcement Point 是执行拦截的一侧；Policy Decision Point 是返回 allow/deny 等 verdict 的一侧。（来源：README Packages；来源：policy-engine README How ACS integrates with AGT）

## 关键主张与证据

| 主张 | 大白话 | 来源 | 归因 | 强度 |
| --- | --- | --- | --- | --- |
| Public Preview；production-quality, Microsoft-signed releases；GA 前存在风险有 breaking changes。（来源：README/artifactAudit） | 这是公开预览，不应按稳定 GA 组件对待。（来源：README/artifactAudit） | README Important block | 自称 | medium |
| 提供 policy enforcement、identity、sandboxing、SRE for autonomous AI agents。（来源：README/artifactAudit） | 它试图覆盖 agent 的动作授权、身份、隔离和可靠性治理。（来源：README/artifactAudit） | README intro；README Packages；agent-governance-python/*/pyproject.toml | 已核实 | high |
| One pip install, any framework。（来源：README/artifactAudit） | README 说一个 pip 包可以接入任意框架。（来源：README/artifactAudit） | README intro；README Install；README Framework Support；agent-governance-python/agent-governance-toolkit-integrations/pyproject.toml | 自称 | medium |
| Policy evaluation <0.1 ms / sub-millisecond。（来源：README/artifactAudit） | 项目声称策略评估很快，但这个数字只适用于策略引擎本身或特定部署。（来源：README/artifactAudit） | docs/LIMITATIONS Performance；docs/ARCHITECTURE Overview；README Security | 自称 | low |
| 10 formal specs、992 conformance tests、29 ADR。（来源：README/artifactAudit） | README 给了规格和测试数量，但本次文件树计数发现 ADR 口径不完全一致。（来源：README/artifactAudit） | README Specifications；docs/specs；docs/adr；local tree count | 自称 | medium |
| AGT enforces governance at application middleware layer, not OS kernel level；policy engine and agents share the same process boundary。（来源：README/artifactAudit） | 它不是操作系统级沙箱；被治理代码和治理层通常在同一进程边界内。（来源：README/artifactAudit） | README Security；docs/ARCHITECTURE Security Model & Boundaries；docs/LIMITATIONS What AGT Is Not | 已核实 | high |
| ACS 是 stateless、deterministic、fail closed policy decision runtime。（来源：README/artifactAudit） | policy-engine 的核心设计是每次由宿主传完整快照，运行时不靠可变历史状态，失败时 deny。（来源：README/artifactAudit） | policy-engine README Core properties；policy-engine README Intervention points；policy-engine/spec/SPECIFICATION.md | 已核实 | high |
| Quickstart demo 不需要 API key，可以在动作列表上做 allowed/BLOCKED 检查。（来源：README/artifactAudit） | 最小示例是本地规则检查，不依赖 LLM 服务。（来源：README/artifactAudit） | examples/quickstart README；examples/quickstart/govern_in_60_seconds.py | 已核实 | high |


人话：最可靠的证据是文件树、包配置、示例代码和 policy-engine 的实现边界。README 中“Public Preview”“any framework”“<0.1ms”“992 conformance tests”等属于项目自称，不能直接当第三方验证结论。

技术词：证据强度 high 表示我能从仓库文件/配置直接确认；medium 表示有文档和部分结构支撑但未运行验证；low 表示主要是 README/docs 自述；none 表示没有足够证据。

（来源：README/artifactAudit）

## 它怎么work

人话：AGT 的核心流程是：agent 想做一件事；治理层先拿到动作上下文；策略引擎判断允许、拒绝、警告、升级审批或改写；宿主代码按结果执行或拦下；同时写审计记录。最小用法可以只是 `govern()` 包一个工具函数，复杂用法可以把策略、身份、信任分数、MCP 网关、OpenTelemetry、SRE 和运行时限制都加上。

技术词：
- Policy：一组规则，决定某个 action 是否能执行。（来源：docs/tutorials/policy-as-code/01-your-first-policy.md What is a policy）
- PEP/PDP：宿主 adapter 是 Policy Enforcement Point；ACS/runtime 是 Policy Decision Point。（来源：policy-engine README Agent Control Specification）
- Intervention point：agent 生命周期里的拦截点，包括 `agent_startup`、`input`、`pre_model_call`、`post_model_call`、`pre_tool_call`、`post_tool_call`、`output`、`agent_shutdown`。（来源：policy-engine README Intervention points）
- Fail closed：策略运行失败时返回 deny，而不是默认放行。（来源：policy-engine README Core properties）
- 同进程边界：AGT 文档明确说 policy engine 和 agent 共享进程边界；高安全场景要加容器/VM 隔离。（来源：README Security；docs/ARCHITECTURE Security Model & Boundaries）

## 复用什么抽象

人话：最值得复用的不是具体包名，而是它把 agent 治理拆成几个清楚边界：动作前策略、完整快照、统一 verdict、审计证据、框架 adapter、最小到全栈的渐进路径。

技术词：这些抽象可以迁移到别的 agent 平台，即使不采用 AGT 本身。

（来源：README/artifactAudit）

## 依赖平台风险

人话：这个项目依赖面很宽。它的好处是覆盖很多生态；风险是每个生态都有自己的版本、构建、发布和安全维护成本。

技术词：这是 multi-runtime governance stack，不是单语言 library。

（来源：README/artifactAudit）

## 未知与待确认

人话：这个仓库资料非常多，但仍有几件事不能从 README/docs/tree 直接当事实。

（来源：README/artifactAudit）

## 判断

| 项 | 值 |
| --- | --- |
| action | clone-and-run |
| 相关度 | 5/5 |
| 工程深度 | 5/5 |
| 复用价值 | 5/5 |
| 成熟度 | 3/5 |

判断：值得 clone-and-run，但不建议只读 README 后直接生产接入。

原因：它的工程面很实，目录和配置证明它覆盖 policy runtime、多语言 SDK、MCP、examples、CI、Docker 和文档规范；对于做 agent 平台、安全网关、工具调用治理的人，抽象复用价值很高。成熟度扣分来自 Public Preview、版本口径不一致、同进程边界、性能/覆盖率数字需要自测、以及 docs/LIMITATIONS 中列出的行动治理盲区。

建议路径：先跑 `examples/quickstart/govern_in_60_seconds.py` 和一个目标框架 adapter；再验证 policy-engine 的 fail-closed 行为；最后才考虑身份、mesh、SRE、dashboard 或 ACS manifest。（来源：examples/quickstart README；来源：policy-engine README Build；来源：docs/LIMITATIONS）

可复用范式落库:[[concepts/policy-enforcement-point]]、[[concepts/policy-decision-point]]。另见 [[content/microsoft-agent-governance-toolkit]]、[[claims/microsoft-agent-governance-toolkit-main-claim]]。
