---
content: qwen3-coder-next
kind: deep-dive
shape: paper
paper_type: model
title: "Qwen3-Coder-Next — 深度拆解"
reasoning_trace:
  paper_type_decision: "primary = model(技术报告:引入模型 + 完整训练配方 + 基准对比)。无 secondary。"
  central_contribution: "agentic 训练栈——可验证编码任务合成 + 可执行环境反馈——让 80A3 以小激活足迹逼近更大对手。"
  inspected:
    - "§3 架构/预训练(80A3、262K、FIM、370语言、600B 仓库代码)"
    - "§2.1 任务合成(~800K)/§4 后训练(SFT+4专家+RL+蒸馏)"
    - "Table 3-6 基准 / §5.1 baseline 公平性 / §6 局限"
  top_claims:
    - "80A3 以小激活足迹达 SWE-Bench Verified ~71%"
    - "增益来自 agentic 训练栈,非评测取巧"
    - "与前沿闭源仍有明确差距(自承)"
  evidence_needed:
    - "SWE-Bench 三 scaffold 分数 + 对手激活参数(Table 3)"
    - "baseline 复现方式是否公平(§5.1)"
    - "与 Claude-Opus-4.5 的差距数字(Table 3/§6)"
  main_threats:
    - "训练数据/合成细节专有 → 无法独立复核增益归因"
    - "硬件/算力/license 未明示"
  transfer_decision: "作为 FDE coding-agent 选型候选(80A3 可本地部署);借鉴『可验证任务+执行反馈』范式到 BriefMem 的 evaluator;不复现训练。"
claim_ledger:
  - claim: "80A3(仅激活 3B)在 SWE-Bench Verified 达 ~71%,相对激活参数足迹效率很高。"
    plain_english: "每次干活只点亮 3B 参数,却能逼近那些每次点亮几百亿的大模型——以小博大。"
    source: "arxiv:2603.00729 Table 3"
    evidence_strength: high
    supports: "71.3%(OpenHands scaffold)逼近 DeepSeek-V3.2 671A37 的 70.2%、GLM-4.7 358A32 的 74.2%,而激活参数小一个量级。"
    does_not_support: "总参仍 80B;『激活小』不等于部署便宜(需载入全部专家)。"
    threat: "active≠total,显存与吞吐成本要看实际部署。"
  - claim: "性能增益主要来自 agentic 训练栈(可验证任务合成 + 执行反馈),而非评测取巧。"
    plain_english: "它强,主要是因为拿『能自动判对错的真实编程任务』反复练,而不是把考题挑软的。"
    source: "arxiv:2603.00729 §1 / §2.1 / §5.1"
    evidence_strength: medium
    supports: "~800K 可验证 SWE 任务 + 多框架 agentic 轨迹;且 §5.1 对所有 baseline 同 scaffold 复现、hacking-free、去 commit 泄漏。"
    does_not_support: "无法把增益单独归到『训练栈』而非数据规模/退火等其他因素。"
    threat: "训练数据与合成流程专有,外部无法独立复核归因。"
  - claim: "与前沿闭源模型仍有明确、被作者坦承的差距。"
    plain_english: "它没赢 Claude-Opus-4.5,作者也大方承认——但它的主场是『能自托管、便宜』。"
    source: "arxiv:2603.00729 Table 3 / §6"
    evidence_strength: high
    supports: "Claude-Opus-4.5 78.2% > 本模型 71.3%;作者自承复杂任务、UI、安全场景弱,且常需更多交互轮次。"
    does_not_support: "不代表在『性价比/可自托管』维度上输——那是它的主场。"
    threat: "差距随对手迭代变化,结论有时效。"
  - claim: "baseline 公平性做得比多数模型报告更干净。"
    plain_english: "它没抄别人论文里的分数,而是把对手放进同一套环境重新跑、还堵了作弊空间。"
    source: "arxiv:2603.00729 §5.1"
    evidence_strength: medium
    supports: "同 scaffold 复现所有 baseline、统一 max 300 turns、移除 remote/branch/tag 防 commit 泄漏。"
    does_not_support: "仍是作者自评环境,无第三方仲裁。"
    threat: "评测仍在作者侧执行,存在未察觉的实现偏差。"
evidence_matrix:
  - experiment: "SWE-Bench Verified(三 scaffold)"
    dataset: "SWE-Bench Verified"
    baseline: "Claude-Opus-4.5 78.2% / DeepSeek-V3.2(671A37) 70.2% / GLM-4.7(358A32) 74.2%"
    metric: "解决率(%)"
    result: "70.6%(SWE-Agent)/ 71.1%(MiniSWE)/ 71.3%(OpenHands)"
    sample_size: "80A3 激活 3B"
    exactness: exact
    source: "arxiv:2603.00729 Table 3"
    limitation: "低于前沿闭源;作者侧复现环境"
  - experiment: "SWE-Bench 扩展"
    dataset: "Multilingual / Pro"
    baseline: "同表"
    metric: "解决率(%)"
    result: "Multilingual 62.8% / Pro 56.2%(SWE-Agent)"
    exactness: exact
    source: "arxiv:2603.00729 Table 4"
    limitation: "Pro 难度高,绝对值偏低"
  - experiment: "函数级 / 竞赛"
    dataset: "EvalPlus / MultiPL-E / CRUXEval / LiveCodeBench v6 / Codeforces"
    baseline: "—"
    metric: "pass / rating"
    result: "86.56% / 88.23% / 95.88% / 58.93% / 2100"
    exactness: exact
    source: "arxiv:2603.00729 Table 6"
    limitation: "函数级强,真实仓库级仍是难点"
  - experiment: "终端/CLI"
    dataset: "Terminal-Bench 2.0"
    baseline: "多 scaffold"
    metric: "解决率(%)"
    result: "34.2–36.2%"
    exactness: exact
    source: "arxiv:2603.00729 Table 5"
    limitation: "终端 agentic 任务普遍偏低"
artifact_audit:
  official_repo: "开源权重发布(base + instruct);抓取正文未给出具体 HF/repo 链接"
  official_data: "训练数据未发布(专有语料 + 合成任务)"
  evaluation_code: "标准基准(SWE-Bench/Terminal-Bench 等)+ Mini-SWE-Agent 执行验证"
  prompts_or_rubrics: "21 套工具 chat 模板(§4.2.2)"
  appendix: "Table 10/11 任务规模;§2.2 MegaFlow 编排"
  license: "正文未明示(arXiv 许可;Qwen 系列通常 Apache-2.0,待核实)"
  closed_dependencies: []
  third_party_dependencies:
    - "agentic 轨迹来源:SWE-Agent / OpenHands / Claude-Code / Qwen-Code"
    - "Alibaba Cloud Kubernetes(训练编排,§2.2)"
  hardware: "GPU 数量/算力/FLOPs/成本均未在正文给出(无法证实)"
  broken_links: []
  reproducibility_status: partial
quality_report:
  verdict: pass
  flags:
    - "proprietary-training-data:数据与合成流程未公开,增益归因无法独立复核"
    - "compute-undisclosed:算力/硬件/成本未给"
    - "self-run-eval:基准在作者侧复现(虽已做去泄漏与统一 scaffold)"
  grounded_score: 0.85
  transfer_value: high
  main_risk: "开源的是权重而非训练数据/算力;『增益来自训练栈』这一核心归因只能采信作者方法描述,无法外部验证。"
---

## 一句话定位

这是一篇**模型技术报告**:80B 总参、仅激活 3B(80A3)的 MoE coding 模型。真正的卖点**不是参数规模,而是一套 agentic 训练栈**——大规模合成『可验证编码任务 + 可执行环境』,让模型直接从环境反馈学;并坦诚地把 baseline 复现做干净。出处:arxiv:2603.00729 §1。

> 核心问题(model 论文必答):**它为什么强?来自架构、数据、训练,还是评测选择?** 这篇的答案是『训练栈 + 激活参数效率』,且作者用干净的 baseline 复现压低了『评测选择』的嫌疑。

## 为什么值得看

直接砸中你的 **FDE 北极星**(把 AI 接进真实软件工程)。它是个**能自托管、开源权重**的 coding 模型,是『不想全靠闭源 API』那条路线的现实候选。更值钱的是它的两个工程范式:**用『能自动判对错的任务』来训练**、以及**把对手放进同一环境公平重测**——这两点都能直接搬进 BriefMem 的评测设计。

## 大白话带读

- **它反对什么?** 反对『靠堆参数和挑软考题刷榜』。它走的是小激活 + 真实任务训练的路子,还主动把 baseline 重测干净。
- **它提出什么?** 一个 80B 总参、**每次只点亮 3B**(论文叫 80A3,A=activated 激活)的稀疏模型;配一套『**可验证任务**』训练栈——任务自带可运行的判分环境,对错由程序说了算,不靠人或大模型猜。
- **它怎么做?** 海量爬代码(370 种语言)+ 合成约 80 万个『能自动判分』的修 bug 任务 + 收集多个编程 agent 的操作轨迹;再分『网页/UX/单轮问答/软件工程』四个方向各练一个专家,最后**蒸馏**(把几个专家的本事压回一个模型)。
- **它测出什么?** 在 SWE-Bench(真实改 GitHub issue 的考试)上约 71%,逼近激活参数大它十几倍的开源对手;但没追上 Claude-Opus-4.5(78.2%)。
- **它哪里不可靠?** **训练数据和算力都没公开**,所以『强是因为训练栈』这个说法只能信作者的描述,外人没法独立验证;复杂大任务、前端 UI、安全场景它也承认偏弱。

## 架构

- **80A3 MoE**:80B 总参、3B 激活,基于 Qwen3-Next 的 hybrid attention。(§3)
- **262K 上下文**:支撑多轮 agentic 轨迹与仓库级代码。(§3.2)
- **FIM + Best-Fit Packing**:支持中间填充补全;BFP 打包避免上下文幻觉。(§3.1.4 / §3.2)

## 训练数据与配方

- **继续预训练**:trillions token;GitHub 覆盖 **370 种语言**(Qwen2.5-Coder 为 92)+ ~**600B 仓库级**代码;Common Crawl 文本-代码对齐数据自动重排(Table 1:EvalPlus +8.7、MultiPL-E +12.3)。(§3.1.1)
- **可验证任务合成**:跨 9 种语言 bug 合成,~**800K** 可验证 SWE 任务;~807.7K 真实 GitHub PR + ~851.9K 合成(Table 10/11)。(§2.1)
- **agentic 轨迹**:来自 SWE-Agent / OpenHands / Claude-Code / Qwen-Code 等多框架。(§3.1.2)

## 后训练

```text
SFT:        执行验证过滤(Mini-SWE-Agent)+ 文档接地 QA + 成对偏好建模
专家模型:    Web 开发(VLM+浏览器验证)/ UX(21 套工具模板)/
            单轮 QA(可执行 RL,含安全场景)/ 软件工程(多轮 RL+奖励塑形)
蒸馏:        把各领域专家合并回单一统一模型
编排:        MegaFlow 系统(§2.2)
```

承重点:**软件工程专家用多轮 RL + 奖励塑形(未完成轨迹惩罚、轮级工具格式惩罚)**——这是 coding agent 能力的主要来源。(§4.2)

## 基准结果

| 基准 | 分数 |
| --- | --- |
| SWE-Bench Verified | 70.6 / 71.1 / 71.3%(三 scaffold) |
| SWE-Bench Multilingual / Pro | 62.8% / 56.2% |
| EvalPlus / MultiPL-E / CRUXEval | 86.56 / 88.23 / 95.88% |
| LiveCodeBench v6 / Codeforces | 58.93% / 2100 |
| Terminal-Bench 2.0 | 34.2–36.2% |

## baseline 公平性(model 论文核心审稿点)

这是评判一篇模型报告"强得是否诚实"的关键,而这篇做得**比多数模型报告干净**:

- **同 scaffold 复现所有 baseline**,不是抄别人论文里的分数。(§5.1)
- **hacking-free + 统一 max 300 turns**:消除 turn 预算不公平。
- **移除 remote/branch/tag 防 commit 泄漏**:堵住 SWE-Bench 常见的『偷看答案』漏洞。(§5.1 / §4.2.4)

对照诚实:**Claude-Opus-4.5 78.2% > 本模型 71.3%**,作者主动把差距摆出来。→ 『强来自评测选择』的嫌疑被有效压低;增益更可信地归于训练栈 + 激活效率。

## 强从哪来(因果)

- **不是评测取巧**:baseline 复现干净(见上),排除了这条替代解释。
- **不是单纯堆参数**:激活仅 3B,却逼近 671A37 的 DeepSeek-V3.2——效率来自 MoE + 训练,而非规模。
- **主要是训练栈**:可验证任务 + 执行反馈 + 多轮 RL,是作者反复强调、也最自洽的归因。**但**:训练数据/合成流程专有,这条归因只能采信方法描述,无法外部独立复核(见威胁)。

## 发布与复现审计

| 维度 | 状态 |
| --- | --- |
| 权重 | ✅ 开源 base + instruct(正文未给具体链接) |
| 训练数据 | ❌ 未发布(专有 + 合成) |
| 评测 | ✅ 标准基准 + Mini-SWE-Agent 执行验证 |
| 硬件/算力/成本 | ❓ 未给(无法证实) |
| License | ❓ 正文未明示(Qwen 系列通常 Apache-2.0,待核) |
| 结论 | **partial** —— 权重可用于部署,但训练不可复现(数据+算力未放) |

## 局限与威胁模型

- **归因不可外部验证:** 增益归于训练栈,但训练数据/合成专有 → 无法独立复核(最大保留)。
- **与前沿仍有差距(自承):** 复杂大规模 SWE、UI、安全场景弱,常需更多交互轮次。(§6)
- **成本不透明:** 算力/硬件未公开,『性价比』主张缺成本面证据。
- **自评环境:** 基准虽做了去泄漏与统一 scaffold,仍在作者侧执行。
- **active≠部署便宜:** 激活 3B 不代表显存小,80B 专家需全载入。

## 迁移到 AI-Brief / BriefMem

这篇最直接砸中你的 **FDE 北极星**(把 AI 接进真实软件工程):

| 这篇的东西 | 怎么用 |
| --- | --- |
| 80A3 开源 coding 模型 | FDE coding-agent **选型候选**:可自托管、性价比路线;真实复杂任务前先验证差距 |
| 可验证任务 + 执行反馈范式 | 借鉴到 **BriefMem 的 evaluator**:给『记忆动作/分析结论』配可执行/可验证的检查,而非纯 LLM 自评 |
| baseline 公平性清单 | 直接变成我们评测任何系统的**反作弊检查表**(同 scaffold / 去泄漏 / 统一预算) |

**路线建议:**

```text
可直接复用:   baseline 公平性清单(去泄漏/同 scaffold/统一 turn 预算)→ BriefMem 自测铁律
不可直接复用: 训练栈本身(数据/算力门槛太高)
落成:        一个『可验证检查 > LLM 自评』的 evaluator 原则,写进 schema
下一步:      选型时把它和闭源前沿做一次 FDE 场景实测对照(成本 vs 能力)
```

## Memory card

```text
problem_pattern:        小激活足迹要逼近大模型的 coding 能力
mechanism_or_protocol_pattern: 可验证任务合成 + 可执行环境反馈 + 多轮 RL(领域专家→蒸馏)
evidence_pattern:       同 scaffold 复现所有 baseline + 去 commit 泄漏 + 坦承与前沿差距
implementation_pattern: MoE(80A3)+ 262K + FIM + 领域专家蒸馏成单模型
risk_pattern:           训练数据/算力专有 → 增益归因不可外部复核;自评环境
```

可复用范式落库:[[concepts/verifiable-task-synthesis]](可验证任务合成)、[[methods/agentic-rl-from-execution]](执行反馈的 agentic RL)。另见 [[content/qwen3-coder-next]]、[[claims/qwen3-coder-next-training-over-size]]。
