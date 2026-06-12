# AI Brief · RULES（底线）

底线，不是流程说明。短、硬、少。细节在 [SPEC.md](./SPEC.md) 和 [dev-map.md](./dev-map.md)。

1. **完成 = 门禁过。** 改完代码必须过 `npm run verify`（= `lint && test && build`，含 `validate`）才算完成。没过不准声称完成。依赖网络/API key 的检查（ingest、papers live、模型核验）不进默认门禁。
2. **分工不越界。** 后端/脚本/数据/管线 → Codex；前端/视觉 → Claude。内容文案质量 = Codex。各干各的，不互相私改。
3. **"好"分品类，不压成统一格式。** 新闻/模型(开闭源)/项目/学术 各有各的尺（见 SPEC 第 3 节）。
4. **投递必须渐进式。** 先给一句大判断，再核心洞见，再一个例子；更深的收成可点线头。术语用"例子+大白话"，不给干定义。砍掉部署/使用/代码指令这类操作内容。
5. **视觉以 B「Focus Console」为基调。** 排版劝退 = 未完成。视觉是硬验收。
6. **不编事实。** 模型"最新"声明必须当天官方来源核验并记录核验日期，否则显式标注为推断。生成/策展声明要有来源支撑。
7. **下游不改上游。** 实现不私改 SPEC；要改，提请 Kevin 拍板（产品方向/范围/风险/门禁松紧/对外发布/最终验收 = Kevin）。
8. **不过早加重资产。** 后端重写、数据库、鉴权、K8s/队列、重框架迁移、通用 agent 平台——见 SPEC 非目标，别提前上。
9. **中文无乱码。** 注意 PowerShell here-string 写中文会把字符写坏；公共 JSON / 数据不许出现替换字符或可疑连续问号（`validate-text-encoding` 会查）。
10. **改了就更新地图。** 改目录结构/数据契约/路由 → 同步更新 dev-map.md。

## 工作流红线（Kevin 2026-06-09 · Claude + Codex 同等）

接力规则 [docs/workflow/](./docs/workflow/)，角色契约 [docs/agents/README.md](./docs/agents/README.md)，态势 [task-board.md](./task-board.md)。

11. **>100 行改动先写 plan。** 用 `docs/plans/_TEMPLATE.md`；plan 必含 大方向/小方向 + eval 方式 + tool 调用 + 编排方式（是否子 agent + 角色/模型/effort）。无 plan 不动 >100 行 / schema·数据契约·路由变更 / 新栏目·新范式 / 批量生成。
12. **不自审。** 任何大改完成后必须**独立 agent**审（generator≠critic），按 plan 的大/小方向为标的验收。生成与审核不可同一 agent。
13. **只在三种情况停下找 Kevin：** ① 产品大方向决策（范式/栏目/"好"的定义）② 需人权限的安全问题（schema/删除/密钥/上线）③ 完成到需人视觉验收。其余连续推进，不在每个小修后停；中途决策回读目标方向再定。
14. **每次交付 = 可运行、Kevin 能看到实际效果**的版本，否则不停。
15. **活文档随时更新。** 任务态势写 `task-board.md`（人+AI 可读：大/小方向 + 阶段 + 阻塞 + 交付结论）；接力规则在 `docs/workflow/`（人版 + AI 版同步）。
16. **子 agent 派发必带四件：** 角色分工 / eval 方式 / 模型选择 / effort（见 docs/agents 派发模板）。
17. **编排分两层**（研究 CMU+腾讯 / LangGraph / CrewAI / AutoGen 后定，2026-06-09，详见 docs/agents/README.md §编排决策）：① **开发期**多 agent（建造/审计/研究）= Claude sub-agent + dynamic workflow + codex，**采纳模式不引运行时库**（我们的 agent 是订阅 CLI 非 API model-client）；② **每日管线 = LangGraph (Python)**——管线=带条件门+有界循环的状态图，要 checkpoint/断点续跑/可观测/HITL。**不引 AutoGen/CrewAI 运行时。**

18. **找问题/优化结构用 research-loop（科研不照抄）**，详见 [docs/method/research-loop.md](./docs/method/research-loop.md)：读论文/项目**当镜子照自己**（不只找有用，问"我们结构有没有它治的病/适不适合我们"）；**自审找不出问题** → 真跑真测(对抗) + **跨模型对抗审(codex⇄claude 升到架构层)**；同一问题**多法竞赛、指标当裁判**，选最适合我们的（**不照抄** papers 的栈）；**先把 benchmark 做强**再比方法（弱测试给假绿）。

19. **closeout 必须引用验证证据（CMU 第 8 章验收清单）。** task-board 的 `交付结论：` 不许只写"做完了"——要带 verify/冷审/commit/门 等可追溯证据，否则只是完成幻觉。空/待办用 `交付结论：—` 或 `待…` 显式标注。`npm run ops:harness`（已接进 `validate`）机器检查此条 + workflow.yaml stage 完整性 + 跨文件引用不悬空 = 可判定 Rule 下沉成脚本（CMU「能判定就不要停在自然语言 Rule」）。
20. **责任靠前后报告对比，不靠叙述（CMU 六轮补稳 #5）。** 大改动前 `npm run ops:baseline`（存 validate 套件基线），改完 `npm run ops:baseline:diff` 自证哪些 validator 是本次新引入失败的——"这不是我引入的"必须用 diff 证明，不能口头。

21. **记忆要 compound，不要只长大（Boris/Fable 镜子，2026-06-12）。** session 收尾**必更** `task-board.md` 接力指针（上一跑 / 下一跑，write-before-walk-away）；动手前**先查失败登记**别重试踩过的坑；一条教训按 5 阶（Fail→Investigate→Verify→Distill→Consult）往上走，**确认的失败模式写回相关 paradigm/prompt 的「已知失败模式」段**（程序记忆、跨任务存活），不只写 task-board（项目记忆、随任务死）。详见 [docs/method/research-loop.md](./docs/method/research-loop.md) §记忆怎么 compound。
