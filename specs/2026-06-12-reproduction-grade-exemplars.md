# SPEC: 复现级精读样板 ×3 + 关系引擎显式引用规则 + 边文案中文化（Kevin 2026-06-12 凌晨）

> 执行者：codex（gpt-5.5 high）。前置：必须先读 `docs/paradigms/projects.md` v3 段（复现级四问）。
> **红线（动作禁令）**：禁 git reset/checkout/stash/clean 任何形式；不碰 src/ app/；树中他人工作保持原样。验证只用数据侧命令。
> 进度 `logs/exemplar-progress.md`；总结 `logs/exemplar-summary.md`。

## A — 复现级精读样板（只做 3 篇，Kevin 验过再批量——iterate-point-to-point）
对以下三个项目，**真 clone 读源码/架构目录**后按 v3「复现级四问」重写 light_spine（结构映射：四问→ why_worth_attention(锚点对比)/how_it_works(机制级架构+Mermaid)/reusable_abstractions(可拆可换可偷)/one_sentence；risk+unknowns 合计 ≤15% 篇幅）：
1. **nousresearch/hermes-agent** —— 锚点=OpenClaw（Kevin 点名）：为什么 Hermes 比 OpenClaw 好？区别？多 agent 怎么编排、harness 怎么搭？
2. **can1357/oh-my-pi**（oh-my-claude-code 类）—— 核心洞察=Claude Code 壳与内核模型可分离：为什么可以？怎么实现的（API 层拦截/协议适配在哪个模块）？Claude Code 壳子好在什么？
3. **nesquena/hermes-webui** —— 和 Hermes Agent 的配套关系显式写出；WebUI 火点是什么？和其他 agent WebUI 区别？能不能换成别的 web 前端（可替换性）？
全中文正文（三铁律照旧：不堆砌/不夹生/正文无指令代码）。claims 带自报/已核实。

## B — 关系引擎补"显式引用"候选规则（修 Hermes↔Hermes-WebUI 漏连事故）
- 候选生成加规则：A 项目的 README/描述/facet 里**点名** B（仓库名/产品名匹配，归一化大小写与连字符）→ 必须成为候选对（绕过向量重叠门）。
- 用新规则重跑候选→判边→重建图。预期至少补上 hermes-agent↔hermes-webui（depends_on/composes_with 类）；其它显式引用对一并入候选。
- NO_EDGE 默认与证据逐字门不变。

## C — typed 边文案中文化（修 33 条英文模板 use）
- 现状：33 条边的 `use` 全是按边型套的英文模板句（"Read the target first..."）——既非中文也非分析。
- 在边的源文件（facet yaml / relation 决策文件）里把每条 `use` 重写为**该具体配对**的中文动作建议（这两个东西放在一起你该干什么：如「做 agent 记忆选型时先用 MemoryAgentBench 的维度评 AgeMem 的策略动作设计」），evidence 保持逐字引用原文（原文是中文引中文）。
- 重建 graph.json 后抽 5 条人检：use 全中文、具体到配对、非模板。

## 验证
`npm run validate` + `node scripts/eval-relation-engine.mjs` 绿 + recall 不退；summary 报：3 样板字数/架构图有无/risk 占比、新增显式引用边列表、use 中文化 33/33。
