# SPEC: 今日三榜暴涨归因 + 精读决策 + 薄 spine 补厚 + 孤点无边理由（Kevin 2026-06-11 深夜）

> 执行者：codex。归因/深读用 gpt-5.5 high；机械步骤确定性脚本。可自派 sub-agent 并行 per-repo，聚合 JSON 单写者最后写。
> **红线（动作禁令，逐字遵守）**：禁止运行 `git reset` / `git checkout` / `git stash` / `git clean` 任何形式；工作树里可能存在其他 agent 的未提交工作，**保持原样不动**；不修改 `src/` 与 `app/` 下任何文件；不改 eval/fixture。验证只用数据侧命令（validate / eval-relation-engine / recall），不跑 next build。
> 进度：`logs/remine2-progress.md` 每阶段一行；总结 `logs/remine2-summary.md`。

## B1 — 暴涨归因调查（核心新增，Kevin 定的缺失环节）
对 `public/data/trending.json` 今日三榜（daily 19 / weekly 15 / monthly 16）每个 repo：
1. **查为什么暴涨/高收藏**，证据源（按性价比顺序，查到即停）：
   - GitHub：最近 release/重大 commit/README 重写时间 vs star 曲线窗口（`gh api`）；
   - Hacker News：Algolia API `hn.algolia.com/api/v1/search?query=<repo>`（标题/链接匹配，取分数+日期+链接）；
   - Reddit：`reddit.com/search.json?q=<repo>`（subreddit+ups+链接）；
   - 都查不到 → 诚实写「原因未明：仅 star 动量，未发现讨论事件」，**不编造**。
2. 写入该 repo 记录新字段：
   ```json
   "trending_cause": { "summary": "一句话中文原因", "kind": "release|hn|reddit|influencer|organic|unknown", "evidence": [{"source":"hn","url":"...","note":"480分, 2026-06-10"}] }
   ```
3. **据因+现行门重判精读价值**（筛选方式不变，归因只是补证据）：
   - 值得精读（AI/agent 方法论价值 + 归因显示真实需求/技术突破）→ 真 clone 读源码，产 RuView 式 `light_spine` 深读（schema 同前 spec，大白话、claims 带自报/已核实、禁代码堆）+ facet；
   - 不值得精读 → light 卡补 `highlights`: ["优点1","优点2","优点3"]（具体优点，来自 README/归因证据，禁模板话），并在 light 文案里带上暴涨原因。

## B2 — 薄 spine 补厚（昨晚批次的质量债）
昨晚保守重写的薄条目（已知：tinyhumansai-openhuman、understand-anything；自查 how_it_works < 400 字的全部）→ **真 clone 仓库读源码**重写 light_spine（具体架构/真实模块名/数字），不确定仍标「数据不足」。

## B3 — 孤点无边理由（前端 3D 星图要用）
graph.json 里 0 typed 边的 faceted 节点，补字段：
```json
"no_edge_reason": { "kind": "no_real_relation|not_yet_compared", "note": "中文一句话：判过 N 个候选全 NO_EDGE / 候选生成未覆盖它" }
```
依据 relation engine 决策文件实情（判过=no_real_relation 列判过谁；没进候选=not_yet_compared）。诚实，不硬凑。

## 验证
`npm run validate` + `node scripts/eval-relation-engine.mjs` + recall 不退；summary 报：归因分布(kind 直方图)、新精读数、补厚数、no_edge_reason 分布。
