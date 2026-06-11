# 项目栏 v2 — 抓取源头 + 筛选规则 + Mind Palace 取向深读（架构 plan）

> 2026-06-10 Kevin 指令："重写项目栏目抓取源头、抓取筛选规则；从 Mind Palace 角度重写项目精读内容，判断每日更新哪些项目，分析的挡位如何。"
> 分工：Claude=本架构 + 范式正文（docs/paradigms/projects.md 后续由 Claude 改，codex 不动）+ 审核；codex=管线工程实现。

## 大方向
项目栏从「trending 榜单搬运 + 人工感选深读」升级为「多信号源 → 确定性 rank → 挡位门 → 深读产 Mind Palace 原语」。
项目和论文在 L0 语料里同构：每个深读项目也要产 problem_solved / discovery_trace / method 三元组 + self_evo_use 三段（记忆/理解/自进化）+ core_concepts(3-5)，过同一套 KG 门入图。

## ① 抓取源头（全免费 API，确定性脚本，禁开放式 agent）
- 保留：GitHub Trending 日/周/月三窗真实榜（现有，去重逻辑保留）。
- 新增 A：**HN 信号源**（Algolia API，免费无 key）——Show HN + 高分帖里出现的 GitHub repo 链接 → 候选 + `hn_points/hn_comments` 证据。把精英制的「跨站验证」从人工变成确定性信号。
- 新增 B：**GitHub Search 增速补盲**——`created:>{90d} stars:>{300}` 类查询补 trending 头部偏置（trending 看绝对热度，漏快速爬升的新 repo）。
- 新增 C（可选，量力）：HF trending models/spaces 关联的 GitHub repo（hf CLI 已装）。
- 每源产 candidate 带 provenance（source/seen_at/原始指标），统一进 ledger（repo full_name 主键；`analyzed/deep_dived` 状态不再作为新候选）。幂等可重入（死了能廉价重入）。

## ② 筛选规则（确定性 rank + depth-gate）
信号分（加权和，权重常量化便于调）：
- star 月增速（log 归一）+ 总 star 档位
- 跨源出现数（trending∩HN∩HF）≥2 强加分
- 主题契合（agent/自进化/记忆/评测 关键词 × project_type）——north-star bias
- 成熟度（有 tests/CI/release/docs → 工程可信度，README-only 降权）
- 黑名单沿用：non_ai_eng、awesome/list 类、课程教学类降权（skill/教学不抽或少抽原语——既有决策）
挡位门（分析挡位 = project_type × 信号分）：
- **deep**（clone 全源码，codex gpt-5.5 high）：架构型（agent_framework/model_infra/ai_app 复杂系统）且信号分过线；月榜前 10 默认 deep（既有决策保留）。日常新增 deep 0-2 个/天，质量线优先、不硬凑。
- **standard**（README+核心模块，codex gpt-5.5 medium）：工具型/library_sdk 过线者。
- **light**（卡片，DeepSeek 便宜层）：其余入榜项目。教学/skill 类最高 light，不入图。

## ③ Mind Palace 取向的深读输出（管线钩子，范式正文 Claude 后续写）
- deep/standard 深读产出新增结构化块：problem_solved / discovery_trace（设计动机轨迹：从 README 设计章节、关键 issue/PR 讨论、作者 blog 找「为什么这么设计、否决了什么方案」，找不到就空+标注，**禁编造**）/ method(机制链+Mermaid) / self_evo_use 三段（记忆/理解/自进化，硬门同 ingest-daily precheckFacet）/ core_concepts 3-5。
- 深读完成 → 排队 `kg:ingest`（项目与论文同门：precheck + validate-mind-palace + edges=[] NO_EDGE 默认 + 冷审）。
- 每日更新判断：rank 输出 top 榜单全量更新（卡片层），deep 名额按挡位门，无合格者当日空着。

## 模型路由（Kevin 2026-06-10 红线：每日管线禁 Fable）
- light/聚合 = DeepSeek；standard = codex gpt-5.5 medium；deep = codex gpt-5.5 high；任何 `claude -p` 必须显式 `--model`（sonnet-4-6 普通 / opus-4-8 判断），禁裸调用。

## eval / DONE 定义
- 新增/改动脚本全部带 node --test 测试；ledger 幂等测试（重跑无重复）；rank 可解释（每个 candidate 输出分项得分）。
- `npm run verify` 全绿；validator 扩展覆盖新字段。
- 产品级验证：trending 页面三窗榜单正常 + 新 deep-dive 渲染正常（spine→页面字段映射，防 key-drift 旧伤复发）。

## 非目标
- 不动 docs/paradigms/*（Claude 写）；不动论文栏；不引重依赖/DB；不动 task-board.md（Claude 更新）；不 deploy。
