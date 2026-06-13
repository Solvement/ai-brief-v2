# KG-5 · 表达分层 + 受众分离人读层（Kevin 2026-06-12 拍板）

## 依据
GPT 分析4 + Kevin：后端对象库方向对，错在**前台表达层**——默认把 AI 内部认知记账（claim 分型/逐字锚点/cannot_prove/object ID/derived_by/boundary）直接铺给用户。解法=**表达分层（不删内容）**：加人读层 + 渐进展开。Kevin 决策：① 先做静态分层+人话层（可立即上线），问题导向问答助手作下一独立轨（云端）；② 人话用「扩对象加 `human` 块，Claude 重蒸馏写」=真受众分离。

## 范围（本轮，静态可上线）
1. **schema**：ROS 对象加 `human` 块（正典已写，§1）。validator 要求 human 块非空 + use_type ∈ enum。
2. **人话内容**：12 文章对象各写 `human` 块（4 sub-agent 并行，从已冷审对象重述，禁引新事实）；4 命题写人话框；25 聚合边写人话 gloss（我写，需跨对象一致）。
3. **投影**：build-ros-projection 透传 human 块进 ros-objects/{slug}.json + node；命题透传人话字段；边透传 gloss。
4. **前端分层**：
   - RosObjectPanel 默认=human（headline/use_type chip/plain_summary/how_to_use/can_borrow/cannot_borrow/maturity）；展开「详情」=claims/mechanism/failure；再展开「审计」=evidence anchors/canonical/cannot_prove。
   - 命题卡默认=结论+为什么(≤3 bullet)+第三条路+对我有什么用；按钮展开证据数字/原文锚点/反方。
   - 关系卡默认=人话 gloss 一句；展开=reason/boundary/object pair/derived_by（审计）。
   - 检索区卡片默认=human summary + use_type chip + 怎么用（few lines），不堆 substance counts。
5. **验收**：validator 全过 + test + build 绿 + /browse 实测默认视图无调试文字（无 object ID / derived_by / canonical / cannot_prove 裸露）。
6. **独立冷审**：human 块忠实于对象（无新事实/无幻觉）+ 默认视图无 AI-内部文字泄露。
7. **部署**：一次部署（不新旧并存）。

## human 块 schema（sub-agent 必须照此）
```yaml
human:
  headline: ""          # 一句人话：这篇到底干了件什么事（不堆术语，必要英文名可留）
  plain_summary: ""     # 2-4 句人话：在讲什么、为什么值得想起（说给"想做 agent 系统的人"听）
  use_type: directly_usable | design_inspiration | background_reference
  use_type_reason: ""
  how_to_use: ""        # 项目无关：能落到哪、最小可借的形态
  can_borrow: []        # 2-4 条人话
  cannot_borrow: []     # 1-3 条人话
  maturity: ""          # 自报 vs 实测、门槛如"需自有可训练模型"
```
纪律：**只从本对象已冷审的 claims/mechanisms/self_evo_verdict 重述**，禁引入对象里没有的事实；禁出现 object ID/canonical ID/derived_by/confidence/内部术语。use_type 三档见正典 §1。

## 不在本轮（下一轨）
- 云端问题导向问答助手（输入任意问题→拆解→召回→综合判断+怎么用+下一步验证）。query-specific 的 sharp use-tag（直接可用 vs 设计启发，相对用户项目）属此轨。

## 编排
- 我：schema/validator/投影/前端/命题人话/边 gloss（确定性+前端=我的活）。
- 4 sub-agent（背景并行）：12 对象 human 块。
- 独立冷审 agent：忠实性 + 无泄露。
