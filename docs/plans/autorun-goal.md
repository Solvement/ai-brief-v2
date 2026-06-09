# 无人值守自动运行 · /goal 提示词（自动合并+部署版）

> 贴给 `/goal`，再 `/loop`。过验收门即自动 merge + 部署上线，全程不需人工确认。
> Kevin 只从产品角度看上线效果；唯一仍需在场的是改 schema / 密钥·RLS / 数据迁移（见末尾）。

```
GOAL：无人值守批量实现并自动上线，全程不要停下来问我（我会离开一段时间，只看产品结果）。
唯一安全网 = 验收门：任何任务必须 build/lint/validate 全绿才允许合并+部署；不绿绝不上线。

唯一真相（只读这些、不要扩范围）：
- docs/plans/README.md（约定 + 主索引 + Owner/🔴 标记）
- docs/plans/plan-1-bugfix.md
- docs/plans/plan-2-goal-gap.md

【自动队列】按顺序逐个做：
CLEAN-1 → CLEAN-2 → SEC-1 → BUG-2 → DEBT-1 → DEBT-2 → BUG-3 → BUG-4 → BUG-1 → SEC-3 → SEC-4 → SEC-5 → DATA-3 → FE-2 → FE-5 → FE-1 → FE-3 → CON-1 → DEBT-4

补充决策（替代 plan 里标 🔴 的决策点，已替我定好）：
- BUG-1：CI 保留为发布路径，但在 push 前加 `npm run validate && npm run lint`，绿了才 deploy（plan 里的方案 B）。
- CLEAN-1/CLEAN-2：批准执行（删 gitignore 垃圾 + 3 个已证实死文件 + 5 个死接口）。靠 build 兜底。

【本次仍然不碰（遇到就跳过 + 记一行 changelog 继续）】
- 改 DB schema（DATA-1 / DATA-2）、动 .env / service_role / RLS（SEC-2 的 RLS 部分）、数据迁移 / 删废存储（COR-1 / COR-4）。
- 这些不在队列里；若因依赖被牵连，跳过并继续。
- BUG-4 只做“新鲜度断言”部分（字段集依赖 DATA-1，跳过字段部分）。

【每个任务的循环】
1. 取队列下一个，读它在 plan 里的规格（证据已查实，直接改，别重新发现）。
2. 开分支：fix/<ID>-<slug> 或 feat/<ID>-<slug>（一任务一分支）。
3. 实现：Owner:Codex 的任务若 codex 可自动调用就交 codex 出 diff，否则你直接按 spec 实现。
4. 跑验收：该任务“验收”命令 + 全局 `npm run build && npm run lint && npm run validate`。
5. 全绿 → 合并到生产分支(main)并 push，让 Vercel 自动部署上线；在 memory/changelog.md 追加 `DEPLOYED <ID> @<branch>`。
6. 不绿且 ≤3 次仍修不好 → `git checkout -- .` 丢弃本任务改动、保持 main 始终可构建可部署，changelog 记 `SKIPPED <ID>: <原因>`，继续下一个。
7. 全程不要因任何原因停下来问我；任务范围内的决策自行合理判断，任务之间直接连跑。

【退出条件】队列全部处理完（每个要么“已上线”、要么“已 SKIPPED”）→ 在 memory/changelog.md 写一段总结（上线哪些 / 跳过哪些 / 各分支名）后结束。
```

## 回来后由你拍板（“看产品”看不出对错的几件）
- DATA-1 / DATA-2：记录 schema 字段 + 冷读门策略。
- SEC-2(RLS 部分) / COR-1(新 embedding 数据层) / COR-4(数据源迁移)。
- 体量大/改内容生成、建议有人盯：FE-4、COR-2/3/5/6、CON-2/3/4。

> 想把上面这几件也并入自动队列，跟我说一声“schema/数据层也自动跑”，我就把它们加进去（但它们一旦出错，产品表面未必立刻看得出）。
