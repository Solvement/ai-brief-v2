# Codex 工单 · 项目深扒选择(C v2):新 + 高质量 + star 作验证信号 + 按 type 产 AutoSci 原语

**作者** Claude(路由) · **执行** Codex · **分支** feat/nextjs-migration · **日期** 2026-06-04
**背景(已修订)** Kevin 要的是**新 + 高质量 + 有可学系统/思路的好项目**;star(收藏量)是**有信号的**(被很多人验证=真东西、大概率能跑),但**不能当唯一选择器**(否则 awesome-list/教学/换皮霸榜)。废弃旧的"月榜 top10 by star"。当前 T3=0/T2≈1 太严也要松。

## 改动 1 — 深扒选择门(替换"top10 by star")
深扒资格 = 同时满足:
1. **类型门(质量/学习价值,必要)**:`project_type` 属架构/思路型(agent-infra / functional / finance_agent / research / devtool);**排除** awesome-list / 教学 / book / roadmap / dotfiles / 纯 skill 类。需有真实代码(`has_src` 等),非纯文档。
2. **验证信号门(star=必要不充分)**:**本月新增 star(velocity)≥ 阈值**(不是累计总 star —— 累计会让 react/vue 这种万年老项目霸榜、永不刷新)。star 高=被验证,作为**门槛 + 排序权重**,不作为选择器。
3. **新颖性 + 相关性门**:用现有 6 维 ranking(`scripts/lib/project-ranking.mjs`:相关性/新颖性/工程深度/成熟度/热度/背书)综合打分过线。偏好**近期创建或新近 trending**(stars-gained velocity 高、相对总 star 占比高 = 真"新")。
- **不设固定 10 名额**(呼应你自己的 project-radar-paradigm:质量门而非名额);但深扒很贵(强模型读全仓),设**成本软上限 ~12/窗口**:过门者按 composite 排序,超出软上限取 top。
- 全程**确定性**(project_type / stars-gained / BOOST_TERMS / 现有 ranking 都是确定性,无开放式 agent —— 守红线)。
- 把窗口成员 + 各窗口 stars-gained velocity 穿进候选,供门判定。

**一句话规则**:`深扒 = 架构型 type ∧ 本月新增star≥阈值(验证信号) ∧ 过相关性/新颖性质量门 → 深扒;按 composite 排序,成本软封顶 ~12,无硬 top10。`

## 改动 2 — 按 project_type 选择性产 AutoSci 原语(不变)
- 仅当项目被 deep 分析且 `project_type` ∈ 架构型(finance_agent/functional/research/devtool/agent-infra;**非** skill/teaching)→ 产 `data/autosci/primitives/proj-<owner>-<name>.{yaml,md}`,复用 `data/autosci/primitives/2605.30611.yaml` 的 schema(`audience: ai_only`),`core_pattern` 抽**底层可复用架构/工程模式**(非 README 翻译)。skill/教学跳过。
- 受众分离:此原语不进前端项目卡,只给 AutoSci。

## 不要做
- 不动前端 RepoCard / 项目卡视觉(Kevin 已验收)。
- 不放开每日开放式 agent(红线)。不要用"累计总 star"做门(要 stars-gained velocity)。

## 验收门
`npm run lint && npm run validate && npm run build` 全绿;trending.json 校验过。
**效果验收**:深扒集里**没有 awesome-list/教学/换皮**;入选的是架构/思路型且本月有真实 star 增长的新项目;深扒数由质量门决定(不是恒为 10)。产出 diff + before/after tier 分布 + 入选清单,Claude review 后合。
