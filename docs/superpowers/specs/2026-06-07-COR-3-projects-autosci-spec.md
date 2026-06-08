# COR-3 spec · 修 projects→AutoSci 零产出

> Owner: Codex. 来源 plan-2 COR-3。projects deep-dive 跑了 259 次但 `data/autosci/primitives/` 里 `proj-*` 原语 = 0，闸门从没触发。

## 诊断要点（按此查，勿乱改）
- `autosci-primitives.mjs` 被 `deepdive.mjs:~173` / `codex-deepdive.mjs:~238` 引用,但产出 0 个 `proj-*`。
- 闸门条件:`finalDepth==="deep"` ∧ 架构型 project_type ∧ 非教学。核对:① 深读实际产出的对象形状(是 `deepDive.tier_template.*` 还是别的键?)是否匹配 emitter 期望的取数路径;② project_type 集合判断是否过严/键名漂移;③ finalDepth 值实际是什么(deep / analysis / tier3?)。
- 大概率是**形状/键名漂移**导致 emitter 取不到数据、或闸门 project_type 集合不匹配。

## 改动
- 修正 emitter 的取数路径 + 闸门判断,使架构型项目深读能真的抽出 ≥1 个 `proj-*` 原语。
- 加 run 级日志:每次项目深读后打印「本次抽取 N 条原语」,0 抽取要可见(便于以后发现回归)。
- 原语 yaml 要带 `design_principles`(COR-2 已设为必填,否则 validate fail)。

## 验收
- 对一个**架构型**项目(如 finance/agent 类)跑一次 deep-dive(可用现有 sqlite runs 里的样本或 mock 深读对象),产出 ≥1 个 `data/autosci/primitives/proj-*.yaml`(带 design_principles)。
- 日志打印抽取数。`npm run validate` + `npm test` 全绿(新原语过 design_principles 必填)。
- 不破坏 papers 原语/其它 column。补/扩一个单测覆盖「架构型→抽取≥1」与「教学型→抽取0」。

## 禁止
- 不跑全量重生成。不改 papers 侧。不引第三方依赖。
