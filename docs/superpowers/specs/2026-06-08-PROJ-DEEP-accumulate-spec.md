# PROJ-DEEP-ACCUMULATE spec · 修"deep 累积" + 收尾填满项目深读

> Owner: Codex. Kevin 2026-06-08 决策:先修 deep 累积(durable),再用现成深读内容填满 + 补缺,一次做对。

## 背景(已查实)
- 范式说"**deep 累积 / light 滚动**",但实现没做到:`scripts/columns/projects/index.mjs` 的 `makeRadar` 每次按当前 GitHub trending 重选 radar 成员(30 cap),**已深读的项目会被新 trending 挤出去**。
- 后果:本会话 codex 已把 06-07 那批 ~14 个项目深读了(brief-wiki/deep-dives/*.md + 结构化 payload 已生成),但重建时抓了 06-08 新鲜 trending(langchain/dify/n8n/mem0/open-webui…),那 14 个大多被挤出 radar,只剩 agentmemory/markitdown/turbovec 还在且填上。当前 radar 7 个 deep 里 4 个(bytedance/UI-TARS-desktop、OpenMOSS/MOSS-TTS、jamwithai/production-agentic-rag-course、modelscope/FunASR)还没深读=数据不足。
- codex 上轮报告:ViMax / 9router 重跑失败(仍旧单条)。
- 渲染映射(spine→tier_template 页面字段)+ comparison 必填,已在 `brief-writer.mjs`/`codex-deepdive.mjs` 修好(commit d563c04);`index.mjs` 已有 `radarRequiredRepos` force-include 机制 + `mergeAuthoredTierTemplate`。

## 目标(durable)
项目 radar 变成「**当前 trending light 卡 + 累积的全部已深读项目(pinned,不被 trending 挤掉)**」,每个 deep 项目都有真实 tier_template(不再数据不足),无重复条目。

## 改动
1. **自动累积 deep(核心)**:改 `makeRadar`/radar 构建,**自动把"有完成深读(tier_template 判断字段非空)的所有项目"force-include 进 radar 并 pin 住**,不被新 trending 挤出 30 cap。实现可:从深读清单(sqlite `analyses` tier='brief-wiki'/'deep' 有真实内容、或 brief-wiki/deep-dives/*、或带非空 tier_template 的 repo)收集已深读 repo 集合 → 自动塞进 `radarRequiredRepos`(取代手填)。deep 项目允许超出/优先于 light 的 30 cap(deep 全保留,light 填剩余额度)。合理保留:保留当前所有已深读项目即可(规模 ~14-20,不用复杂淘汰)。
2. **填满**:用已生成的深读内容把累积进来的每个 deep 项目的 tier_template 判断字段填上(映射已修)。本会话已深读的那 ~14 个必须全部出现且填满。
3. **补缺 + 修失败**:当前 radar 里仍 数据不足 的 deep 项目(UI-TARS-desktop、MOSS-TTS、production-agentic-rag-course、FunASR)用修好的强模型深读路径深读;ViMax、9router 重跑修复。
4. **去重**:每个项目 brief-wiki 只留一份(owner-prefixed canonical),删旧非前缀孤儿文件;重建 brief 索引(public/data/brief/*.json)无重复。

## 验收(报数)
- `trending.json` radar 里:**所有已深读项目都在**(累积生效——本会话深读的 ~14 个 + 当前 trending 的 deep 都在),且每个 deep 项目 tier_template 的 comparison(≥2 点名同类)/practitioner_meaning/how_it_works_with_analogy/essential_design_difference **全部非 数据不足**;light 卡仍是当前真实 trending。
- 验证累积:模拟一次"新 trending 来了"重建,已深读项目**不掉出** radar。
- brief deep-dives.json 每项目仅 1 条,无重复;ViMax/9router 不再是失败旧单条。
- `npm run build` + `npm run validate` + `npm test` 全绿。
- 报告:radar 最终 deep 项目清单 + 各是否填满;补深读了哪几个、各耗时;ViMax/9router 修复结果;删了哪些重复文件;有没有失败(失败就明说卡哪)。

## 禁止
- 只动 projects 相关(scripts/columns/projects、public/data/trending.json、public/data/brief、brief-wiki、data/agent-memory/projects.json)。**不要动 news/papers/models 数据**(news.json、papers-index.json、ledger.jsonl、models.json 等保持现状别碰)。
- 不引第三方依赖。不 git add/commit/push(产 diff + 改数据,Claude review 后选择性提交)。
- 累积别无限膨胀到几百个;保留当前已深读集合即可。
