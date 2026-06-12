# SPEC: 白板测试级精读样板 ×3 + 关系引擎显式引用规则 + 边文案中文化（Kevin 2026-06-12 凌晨，二次修正版）

> 执行者：codex（gpt-5.5 high）。前置：必须先读 `docs/paradigms/projects.md` v3 段（白板测试 eval + 导师式生成）。
> **红线（动作禁令）**：禁 git reset/checkout/stash/clean 任何形式；不碰 src/ app/；树中他人工作保持原样。验证只用数据侧命令。
> 进度 `logs/exemplar-progress.md`；总结 `logs/exemplar-summary.md`。

## A — 白板测试级精读样板（只做 3 篇，Kevin 验过再批量——iterate-point-to-point）
**DONE 定义（eval，非大纲）**：读完分析的人不看项目，能在白板上画出——项目结构、优势区间、自己的理解、创新点、解决了什么问题、用了什么方法。
**生成方法（导师式，禁填表式）**：每篇先**真 clone 读源码/架构目录**，然后第一步判断"这个项目该从什么角度讲"（它的灵魂在哪），再以「带我读懂 xxx 项目，读完要能过白板测试」的导师框架让 gpt-5.5 high 生成正文，最后才映射进 light_spine 字段做渲染容器。**不同项目不同角度，不适用的角度不硬写。**
三个样板（各自的灵魂仅供启发，由你读源码后自判）：
1. **nousresearch/hermes-agent** —— 它活在与 OpenClaw 的对比里（Kevin 锚点）：编排、harness 怎么搭、凭什么更好。
2. **can1357/oh-my-pi**（oh-my-claude-code 类）—— 灵魂=Claude Code 壳与内核模型可分离：为什么可以、在哪个模块实现、壳子好在哪。
3. **nesquena/hermes-webui** —— 配套关系显式写出；火点、与其他 WebUI 区别、可替换性。
硬纪律：优势/实现为主（risk+unknowns ≤15%）；全中文正文（三铁律：不堆砌/不夹生/正文无指令代码）；claims 带自报/已核实；结构复杂配 Mermaid。

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
