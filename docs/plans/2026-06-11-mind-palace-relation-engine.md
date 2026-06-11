# Mind Palace 关系引擎 + 可视化（KG-3，多 loop plan）

> Kevin 2026-06-11 批准。目标：Mind Palace 从"记忆机器"→"关系推理"(北极星 L1 理解)。关系类型学见 `docs/paradigms/relation-taxonomy.md`(从语料实挖)。
> 分工：Claude=taxonomy(已done)+eval+前端+审；codex=边引擎/抽取/图重建后端(普通模型)。

## 现状(已查)
- 图 625 节点/1489 边,但 98% 是机械边(references 1395 + same_track 68),真 typed 关系边仅 ~26。
- 丰富关系**已在 facet 散文里**(取长补短/底座+表现层/替代/互证…),只是没结构化、边型表太窄。

## Loop A — 关系类型学(✅ done)
`docs/paradigms/relation-taxonomy.md`：8 组按"怎么利用"归类(接在一起/取长补短/替代/对比/张力/谱系/互证/评测),每型带触发判据+证据要求+用法动作；NO_EDGE 默认。

## Loop B — typed 边引擎(codex 后端)
- 候选生成：对每个 facet,用 hybrid 召回 + 共享 core_concept 找出 top-K 邻居候选(不全连,控候选量)。
- 判边：本地 LLM(DeepSeek/codex,**禁 Fable**)按 taxonomy 判每对：`{type, dominance?, evidence(出处), use(动作)}` 或 NO_EDGE。子字段层连接(method↔method)。
- 门：证据不指出处/对比方向→拒;类目级配对→拒。产物写 typed 边集。
- 验证：recall-bench 不退 + 边精度(抽样人/冷审判真假边)。

## Loop C — 机械边删/降级(Kevin 授权删,facet 源不动)
- 改图构建：references/same_track 不再当**主边**(隐藏或移到 secondary 层),图主体=typed 边。可重建(改 build 脚本,源不动)→ 可回退。
- 验证：图边型分布机械边降为隐藏层,typed 边成主体;节点数不变。

## Loop D — 前端(Claude,视觉和 UI 会话协调)
- 脑图=Obsidian local graph：选节点→只显 typed 邻居网,hover 高亮,边按型上色+标签,**默认隐藏机械边**(治毛球);点边→关系+怎么利用。
- 搜索框保留,**搜索结果走独立新页**(不和脑图重叠,Kevin 约束)。
- 借 MiroFish"点击探索"交互,不借仿真引擎。

## eval / DONE
- `scripts/eval-relation-engine.mjs`：① taxonomy 覆盖(边型 ∈ 8 组)② 每边有 type+evidence+use ③ NO_EDGE 默认(无证据边=0)④ 机械边不在主边层 ⑤ recall-bench 不退。
- `npm run verify` 全绿；前端渲染检查。
- 产品级：/mind-palace 选一篇出 typed 关系网(相似/对比/替代),搜索独立页,图不毛球。

## 非目标
- 不引群体仿真;不本地 GPU 训练;不删 facet 源;前端视觉皮肤和 UI 会话协调不硬撞。
