# 项目栏全覆盖 + 真·L1 自进化闭环（多 loop plan）

> 2026-06-11 Kevin 批准。问题：项目栏精英过滤导致 trending 看着冻住、想看的项目(多为 skills)被丢；且"蒸馏"只入图(记忆/检索)，深读后**没有拿知识反过来改造自己**的闭环。
> 决策(Kevin)：① 全覆盖+分挡；② skills 双轴(给你读/给我进化)；③ 自进化非红线改动=直接改+verify+汇报周审，红线排队(选项①)。
> 分工：Claude=本 plan + 全部 eval 规格(审核前先写) + 范式 + 审核；codex=工程实现(普通模型 gpt-5.5)。
> 模型红线：每日管线禁 Fable、禁开放式 agent；judge/深读便宜层 DeepSeek + 强 authoring 用 codex gpt-5.5。

## 大方向
项目栏：`精英过滤(只深读最好)` → `全覆盖(入榜全给 light 兜底) + 两轴分挡深读`。
新增层：深读不止产 facet(记忆)，deep 挡额外产**进化候选**→ judge(竞赛/批判)判适用 → verify 门 → 非红线应用+日志(给我进化) / 红线排队(给 Kevin 周审)。让"深读"真连上"进化"，不是更大的记忆机器。

---

## Loop A — 类型分类器加固 + 新增 agent_skill 品类（codex medium，机械+少量判断）
**目的**：修 trending 冻住的部分根因——分类噪声(maigret/chatwoot 误标 agent_framework)+ skills 无独立品类被塞进框架。
**步骤**：
- 新增 `project_type = "agent_skill"`（skill/plugin/prompt 合集/meta-skill：名或 README 含 skill/plugin/prompt collection/.claude/agent skill/skills marketplace）。
- 修 `agent` 歧义：客服/IM agent(live-chat/support/omni-channel/helpdesk) → 不判 agent_framework；AI agent 需伴随 LLM/autonomous/tool-calling/multi-agent 语境。
- 修 non_ai 漏网：OSINT/VPN/backup/教材/容器/IM 平台 → non_ai_eng。
**eval**(`scripts/eval-projects-coverage.mjs` 的分类断言部分)：手标 fixture(今日 trending ~30 repo，Claude 标注 golden label) → 分类准确率 ≥ 0.85，且 0 个 skill 被标 agent_framework、0 个非 AI 被标 AI 品类。
**停止**：fixture 准确率过线。

## Loop B — 覆盖挡位（codex medium）
**目的**：入榜即至少一张 light 卡，trending 不再几个老面孔冻住。
**步骤**：
- 挡位重定义：`list_only` 仅留给 non_ai_eng/跑题；所有 AI 相关入榜 repo ≥ `light`(DeepSeek README 翻译+功能介绍)。
- 两轴挑 standard/deep：轴1=架构价值(signal_score × project_type，既有)；轴2=**对我们自己有用**(north-star 主题契合 + 是否 informs-our-structure)。
- skills 双轴分流：`agent_skill` 默认 light(给 Kevin 读)；但若 informs-our-structure(harness/memory/taste/eval 类) → 升 deep + 进自进化队列(给我进化)。教学/课程/纯资源仍封顶 light、不入图。
- 量：light 放宽到数十/天(便宜层)；deep 仍 0-2/天质量线、不硬凑。
**eval**(coverage 部分)：AI 相关入榜 repo 中有 ≥light 卡的比例 = 100%；deep/天 ∈ [0,2]；list_only 中 0 个 AI 品类。
**停止**：覆盖率门 + 挡位分布门过。

## Loop C — 自进化闭环（Claude 设计 eval+schema，codex 实现 scaffold）
**目的**：深读 deep 挡的知识被**用来判断和改造我们自己**，不只躺成 facet。
**步骤**：
- deep 深读产物除 facet 外，额外产 **evolution_candidate**：`{source, claim, our_current(我们现在怎么做), proposed_change(具体改我们哪个文件/机制), applies_to(harness|memory|writing|eval|paradigm|...), red_line(bool), evidence}` → 写 `data/knowledge-graph/self-evo-queue.jsonl`。
- **judge 步**(竞赛/批判，不依赖 Kevin 高频)：对每条候选，便宜层多路判"这方法在 applies_to 维度上比我们现在强吗"——要有可判定信号(若 applies_to=memory 且有 benchmark → 跑我们 recall-bench 比对；否则批判 agent 给 stronger/weaker/unclear + 理由)。
- **门 + 应用**：verdict=stronger 且 red_line=false → 生成改动 → `npm run verify`；绿 → 应用 + 写 `data/knowledge-graph/self-evo-applied.jsonl`(from 哪篇/改了什么/verify 证据)；红 → 回退不应用。red_line=true 或 verdict=unclear → 排队 `self-evo-review.jsonl` 等 Kevin 周审。
- **绝不**：自动改 schema/删数据/密钥/范式方向(红线，无论 verdict)；不放松锁定 bench。
**eval**(`scripts/eval-self-evo-loop.mjs`)：候选 schema 校验；judge 对合成 case 产 verdict；应用必经 verify 门(注入一个会让 verify 红的假改动 → 断言它被回退不应用)；红线候选断言进 review 队列不自动应用；应用日志可追溯(from→change→evidence)。
**停止**：eval 全绿 + 至少 1 条真实候选走完闭环(今日 agentmemory→recall-bench 比对为首例)。

## Loop D — PR 式 review 循环（Claude 自管，复用契约 codex-diff-review）
codex 每个交付：diff → Claude 对照 eval 审 → 不达标写回执 → codex 修 → 重审 → 达标合。每个 codex 任务一轮，最多 3 轮(契约预算)。这是我的小 loop，不问 Kevin。

---

## 实施顺序与编排
1. **Claude 先写 eval(审核前)**：`scripts/eval-projects-coverage.mjs`(A+B) + `scripts/eval-self-evo-loop.mjs`(C) + fixture golden labels。= 机器 DONE 定义。
2. **派 codex**(普通模型)：任务 A+B(分类器+覆盖管线) 一个 brief；任务 C(自进化 scaffold) 一个 brief。可并行(worktree 隔离若冲突)。
3. **Claude review**(Loop D) 对照 eval 迭代到绿。
4. **范式微调**(Claude)：projects.md 加 agent_skill 品类 + informs-our-structure 轴 + 覆盖挡位说明。
5. **verify 全绿 → 提交 → push main**。

## 全局 eval / DONE 定义
- `node scripts/eval-projects-coverage.mjs` 绿(分类准确 + 覆盖率 + 挡位分布)。
- `node scripts/eval-self-evo-loop.mjs` 绿(候选/judge/verify门/红线排队/日志)。
- `npm run verify` 全绿。
- 产品级：trending 三窗不再冻住、light 覆盖到位、deep 页渲染正常、self-evo-applied 日志可周审。

## 非目标
- 不动论文栏深读逻辑、前端视觉；不引重依赖/DB；不放松锁定 bench；自进化不碰红线。
