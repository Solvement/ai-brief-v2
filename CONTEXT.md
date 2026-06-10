# AI Brief — Product Context (glossary + locked decisions)

> 术语表 + 已锁定的产品方向决策。实现细节不进本文件,只记"是什么/为什么"。

## 受众与定位（2026-05-31 Kevin 亲自定，覆盖一切外部模板）

- **用户 = Kevin 本人**,一个**尚未定型职业方向**的研究者/学习者。目标:**看到真正的好论文,拓宽思维**。
- **不绑任何职业 lens**(不是 FDE、不是 AI PM、不是某岗位)。
- **"好"的第一性原理 = 学术信誉**:顶会评选(best paper / oral / spotlight)、跨平台被引、多源汇聚推荐(多人/多平台收敛)、新颖性、证据强度。
- 这条**优先级高于** 2026-05-31 那份 GPT「FDE 决策工作台」权威稿。两者冲突处,以本文件为准。

## 产量与更新节奏

- **每天 1–3 篇,宁缺毋滥**。取综合分最高的几篇。
- **阈值可配置**(写 config / env,不写死在代码)。不到阈值就**不更新**,允许两三天空窗。空窗时整批记 `rejectedReasonIfAny`。

## 适用边界（重要）

- 本轮全部改动**只作用于「学术论文」栏目(前端 `src/pages/Articles.tsx` + 后端 `scripts/columns/papers/*`)**。
- **不碰** Projects / Models / Podcast 等其它栏目的数据流、schema、前端。

## 产品形态（2026-05-31 Kevin 定，再次推翻 GPT 决策稿）

学术论文栏目 = **精读伴读 / 论文解读**,核心体验是「**先让我自己想,再看 AI 的**」。不是"研究决策工作台"。
- **学术论文只有一档:deep dive**。没有 light/速览。
- **没有"读不读"的决策层**:值不值得深读的判断**前移到选题闸门**,机器筛选时已替 Kevin 判断过——能进详情页的就是值得的。所以详情页**不含任何"判断要不要读"的东西**。
  - **删除**:Verdict / decision card / readDecision / fdeFit / 一句话判断 / whyNow / whyNotOverclaim / readFor / doNotUseFor。
- **删除评分**:scorecard(含学术 8 维)整个删掉,Kevin 不看分。
- 点开论文 = **直接进深度内容**,两段式:

### 第一段 · 原文(忠实,克制,不掺 AI 观点)
- 尽量**维持论文原文 section 结构**,逐节 **翻译 + 总结**。
- **关键图/表/结果**:本轮按文字 + 数据表精确罗列(如「图3:pass rate 随步数先升后降,峰值 0.66@4步」)。**不抓真实图片**(现管线只抓文本);真实图片渲染留作下一步增强,不在本轮。
- **硬约束**:这一段**禁止评价词 / 禁止 AI 判断 / 禁止"值得/推荐/强/弱"这类结论**。目的是让 Kevin 读原文时**先形成自己的判断**,不被 AI 带跑。

### 视觉分隔
- 明确标出「**以下是 AI 的分析,非原文**」,把两段隔开。

### 第二段 · AI 的深度分析(在后,可有分量、可批判)
- **自由评论行文(B)**——像一个懂行的人写的深度短评,不套固定小标题、不填表。
- 可以有洞察、有批判:承重主张、证据强弱、哪里站得住/哪里存疑、启发与迁移。
- **不打分**。
- 因为是自由行文,**风险是观点渗回第一段** → 规格须对第一段下忠实硬约束、对第二段放开,二者物理隔离。

### 删除的重型审稿模块（本轮不做）
claimLedger / evidenceMatrix / artifactAudit 拆分块 / falsification / minimumDecisiveExperiment / scorecard。
（reframe、mechanism 的内容若有价值,并入第二段自由行文,不单列。）

## FDE 的处置（已定:彻底移除主轴）

- `verdict.fdeFit`、scorecard「FDE相关性」维、**整个 FDE memo 块(客户痛点/discovery questions/rollout/ROI)** → **彻底删除**,不保留折叠。
- **scorecard 整个删掉**(Kevin 不看分,见上)。学术 8 维方案作废。
- selectionAudit 的 weightedFactors 用**学术因子**,不用 GPT 的 FDE 因子:
  `venuePrestige`(顶会/评奖档次)、`citationConvergence`(跨平台被引/多源汇聚)、`novelty`、`evidenceStrength`(深析后回填)、`recency`、`reproducibility`(深析后回填)。
  注:这套学术因子是**选题闸门**用的(机器替 Kevin 判断"够不够好"),不展示给用户当评分。

## selectionAudit 的合成方式（已定:A）

- selectionAudit 是**选题阶段 + 深析阶段合成块**。
- 选题阶段能测准的因子(venuePrestige / citationConvergence / novelty / recency)→ 选题分映射。
- 测不准的因子(evidenceStrength / reproducibility)→ **深析跑完后回填真实值**,不在选题阶段瞎填。
- 关键:这**不增加选题阶段成本**——全文本来就在深析阶段读、值本来就要算,回填只是把已算好的值抄进 selectionAudit。被淘汰的论文不进深析、也不发布,前端永远不会遇到半截 selectionAudit。

## 三篇样本的角色

- DistractionIF (2605-29491) / VikingMem (2605-29640) / SkillNet (2603-04448) = **回归集**,降级为 lint 单测的构造 fixture。不要求它们出现在真实重跑里;**禁止**用其 title/arxivId/作者名写特判逻辑。

## 选题闸门（已定 9C:调权重，不重写）

- 不重写 `evaluate.mjs` 整个打分器。**只调权重**:放大学术信誉信号(`source_quality` = 顶会/OpenReview/best-paper 加分、convergence = 多源汇聚、novelty),把 FDE/customer/production/workflow 那套信号权重**调到很低**。
- 目的:让选出来的偏「顶会理论好作 / 多源推荐」,而不是「工程落地味重」的论文。
- 风险:小,因为现有打分器里已有 source_quality + convergence 这两个学术信号,只是权重要往上提。

## 图表罗列上限（已定 10A）

- 每篇详情页第一段只罗列**最关键的 3–5 个**图/表/结果,设上限,保持简洁。

## 仍待定（grill 已收尾，留给实现期）

- 选题阈值的默认数字(`PAPERS_DEEP_CAP` 1–3、`PAPERS_MIN_SCORE`),实现时给保守默认,Kevin 随时调。
- 定向重析入口(保证某篇能进回归)——需要的话实现期再加。
- 本次回归跑几篇(默认 1–3 篇精品)。
