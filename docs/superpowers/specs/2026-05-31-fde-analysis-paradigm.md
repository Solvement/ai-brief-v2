# AI Brief · FDE 分析范式 (定版) — Find + Analyze

日期：2026-05-31 · 决策人：Kevin · 由三份 GPT-Pro 范例(Orchard / ABA / OpenAPI-Hermes)+ Kevin 定稿。

> **北极星**:AI Brief 不是"学术文章分析器",是 **Kevin 的 FDE / AI 应用落地能力训练器**。目标=找能长"把 AI 接进真实客户业务/API/权限/workflow/eval/部署/治理"能力的东西,**不是纯算法/scaling/刷榜**。
> **两条铁律**:(1) 策展号只负责发现,一切事实回 primary source 核验;(2) 每篇产**双输出**——审稿式 critique + FDE 项目化 memo,且必须落到客户项目。

---

## 范式一:从哪里找(FDE 导向发现 + 选择)

### 1. 来源分层
- **A. 证据源(primary,可作事实依据)**:arXiv / OpenReview / ACL Anthology / ACM DL / IEEE;会议官方 program;paper PDF/HTML/appendix;官方 code repo;项目网站;HF model/dataset 页;benchmark 官方 leaderboard;官方文档/issue tracker/release notes。
- **B. FDE 高价值工程源**:公司工程博客;OSS 的 issues/PRs/release notes;incident reports/postmortems;LangChain/LlamaIndex/Vercel/Datadog/Honeycomb/Temporal/Supabase/云厂商 docs;production AI case studies。
- **C. 发现源(只发现,不作事实依据)**:Datawhale、机器之心、AIGC深一度、Papers with Code、HF Daily、Hacker News、Twitter/X、aibestpape.rs。

### 2. arXiv 扫描范围(广,FDE 论文常不在 AI 类)
`cs.SE`(软工/API/测试/工业)、`cs.AI`(agent/planning/tool use)、`cs.CL`(LLM 应用/RAG)、`cs.LG`(训练/eval/RL)、`cs.IR`(检索/RAG/搜索)、`cs.DB`(数据库/企业数据)、`cs.CR`(安全/隐私/权限)、`cs.DC`(部署/分布式/云)、`cs.HC`(human-AI/workflow/UX)。

### 3. 会议 / track
AI/NLP(NeurIPS/ICML/ICLR/ACL/EMNLP/NAACL/AAAI)· 软工(ICSE/FSE/ASE/EASE/MSR)· 系统数据(SIGMOD/VLDB/CIDR/SoCC/OSDI/SOSP/MLSys)· 检索(SIGIR/CIKM/WWW/WSDM)· HCI(CHI/UIST/CSCW)· 安全(USENIX Security/IEEE S&P/CCS/NDSS)。**优先 Industry / Systems / Demo / Artifact-evaluated / Best / real-world deployment track。**

### 4. FDE 选题评分(100)
真实系统相关性 /20 · 集成复杂度(API/tool/MCP/workflow/RAG/db/auth/permission/deploy)/15 · Artifact 质量(code/data/site/demo/logs/appendix)/15 · 证据强度(数字/ablation/user study/manual validation/production/cost)/20 · **FDE 方法论价值(能否转成客户 checklist/solution design/eval plan/ROI memo/risk)/20** · 新鲜度与影响 /10。

### 5. 降权
只有模型分无 artifact;只有 synthetic benchmark 无真实约束;只有 prompt trick 无系统设计;无成本/延迟/权限/安全/失败案例;无 repo/数据/appendix/复现;标题有 agent 但无真实 tool-use/workflow/deployment;只说 framework 但无明确任务/接口/用户/评估。

### 6. 抓取铁律(绝不只读 abstract)
每篇读:① abs 页(标题/作者/日期/版本/abstract/comments/subjects/code-website 链接);② HTML/PDF(intro/method/experiment setup/results/validation/limitations/appendix);③ repo README(是否真 release/安装/demo 命令/config/license/issues 状态);④ 项目网站(leaderboard/demo/data browser/artifact/case studies);⑤ appendix(prompt/rubric/超参/cost/failure cases/复现设置)。

### 7. 核验铁律
论文说开源 ≠ 可复现;说有数据 ≠ 可下载;说 SOTA ≠ 比较公平;说 production ≠ 有真实流量;说 agent ≠ 有真实 tool-use;说 low cost ≠ 含工程/人审/维护/安全成本。必核:repo 在否/release/license/dataset/setup 命令/最小可运行 demo/是否依赖闭源/成本/失败案例/能否小样本复现。

---

## 范式二:如何分析(审稿式 critique + FDE memo 双输出)

1. **真实定位**:自称是什么 vs 实际更像什么(算法/系统/工具/benchmark/数据/industry case/eval-audit/product-UX);主要价值在哪(novelty/recipe/artifact/benchmark/methodology/production lesson)。
2. **承重主张**:真正想证明的**因果主张** + 依赖什么假设 + 改变了哪个工程判断 + 哪些证据支撑/还不够。
3. **贡献分层(四列表)**:`论文主张 | 证据 | 我的判断 | FDE 意义`。分清:声称的贡献 / 证据真正支持的 / 还没证明的推论 / 对 FDE 有用的部分。
4. **关键机制**:为什么可能有效(技术 + 工程机制 + 大白话)、哪些组件真关键 vs 只是包装。
5. **证据链**:数据来源/样本/baseline/eval protocol/ablation/人工验证/runtime-latency-cost/failure cases/安全权限合规/是否真实用户或生产。分清 **headline 分数 vs 真正驱动因素**(模型能力 vs 数据 vs harness vs prompt/tool-schema vs eval 设置 vs 工程资源优势)。
6. **外部核验**:repo/website/dataset/benchmark/HF/release/license/issues/README/demo/config/version → 输出开源状态(完整可复现/部分/只有论文/空壳/release-on-hold/数据不可访问/依赖闭源)。
7. **FDE 方法论提取(核心,= `fdeTakeaways` 富结构)**:
   - `customerProblem`:对应什么客户痛点。
   - `customerQuestions`:discovery 时该问客户的 5–10 个问题。
   - `artifactsToAudit`:API spec / db schema / logs / prompts / eval set / workflow docs / auth-RBAC / monitoring / SLAs / human-approval flow。
   - `implementationChecklist`:可直接复用的工程 checklist。
   - `evalPlan`:offline/online eval / golden tasks / human review / latency-cost-error budget。
   - `rolloutPlan`:PoC → pilot → limited prod → full,每阶段验收标准。
   - `riskRegister`:技术/数据/权限/安全/成本/用户采用 风险。
   - `roiHypothesis`:能省什么/降低什么失败率/提升什么业务指标/需要什么证据验证。
   - `interviewStory`:能转成什么 FDE 面试故事(technical depth + business impact)。
8. **审稿式评分(10 维,每维一句理由)**:FDE 相关性 / 工程现实感 / 问题重要性 / 方法新颖性 / 证据强度 / 可复现性 / 可部署性 / 安全治理意识 / ROI 可解释性 / 职业训练价值。
9. **局限 + 该补的实验**:证据最强在哪 / 因果链哪没闭合 / 泛化边界 / 哪些可能被 benchmark-harness-prompt-数据污染 / 我作为客户会怎么验证 / 作为 FDE 先做什么 PoC / 上线还缺什么。
10. **引用规则**:所有事实/数字/日期/版本/venue/repo 状态带引用;区分"论文声称 / 作者报告 / repo 显示 / 官网显示";判断可不带引用但必须明确是判断、不伪装成事实。

### 默认加重方向
API/MCP/tool-use readiness · RAG/enterprise search/data integration · evaluation/observability/monitoring · security/auth/governance · workflow automation/human-in-the-loop · 成本/latency/reliability · failure analysis/benchmark audit。
**相对降权**:纯 architecture / 纯 scaling law / 纯刷分 / 无 artifact 的 agent 概念论文 / 无真实约束的 toy workflow。

---

## 落地映射(本仓库)
- 选择(`scripts/columns/papers/evaluate.mjs`):FDE 信号打分 + 源分层 + 降权。
- 全文抓取(`sources.mjs`):读全文 + repo/site 核验。
- 审稿式 critique = `deepDive`(types.ts:PaperDeepDive)+ 10 维 `scorecard`。
- FDE memo = `deepDive.fdeTakeaways`(types.ts:FdeTakeaways)——需扩到上面 §7 的富结构。
- 贡献分层需扩到四列(claim/evidence/judgment/fdeMeaning)。
