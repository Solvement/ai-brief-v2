# KG-4 · Research Object Store（记忆本体重构）

> 2026-06-12 Kevin 拍板：以高质量为唯一标准，**重构记忆本体、保留基础设施**。
> 依据：GPT《AI理解文章能力分析》1/2/3 + Claude 架构共识（三方收敛，无分歧残留）。
> 契约：`.agent/loop-contract.md`（hash 9cb1893f3f68）。正典：`docs/paradigms/research-object-store.md`。

## 大方向

现有"论文级 facet + 论文级 typed 边"撑不起举一反三：一条边是**结论**不是**证据**，链不起来；
关系真值锚在子对象上（claim/mechanism/assumption/benchmark），不拆出子对象，边永远是猜测的压缩。
重构为 **Research Object Store**：

```
L0 原文锚点  → L1 对象层（claims/mechanisms/assumptions/failure_modes/trigger_hooks/exam_questions）
            → L2 正典注册层（problem/concept/benchmark/proposition）
            → L3 关系层（结构 join 推导为主 + LLM 残差判定为辅，NO_EDGE 默认）
            → L4 视图层（星图=投影，下一切片切数据源）
            → L5 验收层（考题 benchmark + 盲测定字段去留）
            → L6 迁移层（只存 trigger_hooks/transfer 接口，runtime 不建）
```

核心原则（三方共识）：
1. 论文不是推理基本单位，claim/mechanism/assumption/failure_mode 才是。
2. 图不是数据本体，图只是对象库的投影。
3. 关系优先结构推导，LLM 只判残差；无锚点的关系=假设，必须标 speculative。
4. 正典层必须存在，否则 claim 级对象碎成本体蔓延（40 篇 × 私有"memory"定义）。
5. wide schema, sparse objects, progressive deepening——对象类型完整、填写稀疏，重要论文深挖、普通轻量，**每个字段必须有消费方**。
6. 理解用考题闭环验收（摘要版 vs 对象库版盲测），否则模板无法证伪。

## 小方向（本轮切片）

1. **正典文档**：`docs/paradigms/research-object-store.md`（schema + 注册层规则 + 四轮生成流程 + 验收）。
2. **文档清理**：旧正典标 superseded（mind-palace-content / relation-taxonomy 动词表收编）、CLAUDE.md/task-board 指针更新；新旧不并存，旧 facets 降级为草稿输入、退役钉在全量回填完成时。
3. **试点**：memory 簇 5 篇（agemem / memoryagentbench / supermemory / mempalace / rohitg00-agentmemory）四轮蒸馏 → `data/knowledge-graph/objects/*.yaml`。
4. **正典注册层**：`data/knowledge-graph/registry/{problems,concepts,benchmarks,propositions}.yaml`，私有概念 100% 挂接，孤儿术语=0。
5. **关系推导**：codex 写 `derive-relations.mjs`（join 规则）+ `validate-objects.mjs`（硬门）+ `exam-blindtest.mjs`（盲测）。
6. **命题节点**：≥3 个 proposition（正反证据挂对象，宁缺毋滥）。
7. **验收**：validator 绿 + 独立冷审 ≥2 篇 + 盲测 1 组对比。

## 非目标
前端渲染（下一切片：星图/面板切到对象库投影，同时退役旧投影）；AutoSci runtime；删旧 facets（🔴 留 Kevin 确认）；动 boot 管线。

## eval 方式
- 机器门：`node scripts/kg/validate-objects.mjs`（锚点必填/正典挂接/cannot_prove 非空/考题≥3）。
- 关系门：derive 幂等可复跑；judged 边必带证据锚点+置信度依据。
- 理解门：盲测脚本——同一考题，A=只给摘要、B=给对象库，比准确性/边界意识/幻觉。
- 冷审：独立 agent 抽审 2 篇，锚点真实性逐字核（继承冷审三事故纪律）。

## 编排
- **Claude（我）**：架构/正典/registry 种子/命题/审核/派单。
- **5× opus 子 agent 并行**：每篇四轮蒸馏（读全文/repo + 旧 facet 作草稿，锚点指原文非 facet）。
- **codex（gpt-5.5）**：三个后端脚本 + npm scripts 接入（任务书 `.agent/codex-task-kg4-backend.md`）。
- generator≠critic：冷审独立 agent。

## 风险
- OneDrive 并发：本会话单分支 feat 操作，不切分支。
- 配额：蒸馏走 opus 子 agent + codex 后端，避免 Fable 主窗耗尽；codex 有一次额度重置可用。
- 概念蔓延：registry 由主控统一收口（子 agent 只能提 proposed 候选）。
