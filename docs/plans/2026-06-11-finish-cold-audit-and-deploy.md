# Plan: 6/9-6/10 冷审收尾、Mind Palace 更新与上线 (2026-06-11)

> 触发：用户要求接手 Claude Code 未完成任务；涉及批量冷审、发布索引、Mind Palace 入图、任务态势与上线，超过 100 行且触及发布链，按 RULES #11 先写 plan。

## 1. 大方向 / 小方向（验收标的）
- **大方向**：把 6/9-6/10 的每日链补成一个可发布、可审计、可回滚的版本，保证「中午打开=最新+精读+Mind Palace」这条北极星路径在生产可见。
- **小方向**：
  - 完成 6 篇重审状态核验：GrepSeek、LatentSkill、FlashMemory、SoCRATES、AdaPlanBench、SpatialWorld。
  - 不发布未通过独立冷审的论文；过审论文进入文章索引，并按精读发布日出现在当天标签。
  - Mind Palace 自动入图阶段输出可验证，至少确认已入图与失败项的真实状态。
  - 补全 task-board 中 6/9、6/10 和 Mind Palace 的交付结论。
  - `npm run verify` 通过后提交、推送，并完成线上部署/可访问验证。

## 2. 需求（目标 / 非目标 / 影响范围 / 验收）
- 目标：
  - 接手并完成 Claude 未完成的重审链收尾。
  - 补全 6/9、6/10 更新和 Mind Palace 更新。
  - 部署上线。
- 非目标：
  - 不绕过冷审门强行发布 `needs_human` / `audit_error` / `hold` 内容。
  - 不重写论文范式、不新增模型/数据库/鉴权/重依赖。
  - 不替 Kevin 做产品方向变更。
- 影响范围（模块/数据/路由/用户）：
  - `content/papers/*/metadata.json`、`paper.mdx`、`career.mdx`
  - `data/autosci/primitives/*.yaml`
  - `public/data/papers-index.json`
  - `scripts/columns/papers/*`
  - `scripts/kg/*`、`data/knowledge-graph/*`、`public/data/*graph*`
  - `src/components/PapersPage.tsx`、`src/lib/data.ts`
  - `task-board.md`
- 验收标准（可观察）：
  - 六篇重审状态有当前日志或 metadata 证据。
  - 文章索引中的精读日期分组符合发布日逻辑。
  - Mind Palace 验证脚本通过，入图日志状态清楚。
  - `npm run verify` 绿。
  - git commit + push 成功。
  - 生产 URL 可访问，关键页面无明显错误。

## 3. 方案（怎么做）
- 改动点：
  - 先读取日志和 metadata，区分已完成、失败、待跑。
  - 若 Claude quota 已恢复，重跑 `scripts/columns/papers/cold-audit/run-daily.mjs` 的未完成候选；若仍 429，则保留 `audit_error`，不得发布。
  - 跑 `node scripts/columns/papers/build-index.mjs` 和 `npm run kg:build` / `npm run kg:ingest` 的必要子集，生成索引和图谱。
  - 更新 `task-board.md` 的 6/9、6/10、Mind Palace 和冷审收尾状态。
  - 部署路径按当前仓库实际配置判断，优先 git push 触发线上部署，再做 canary。
- 数据契约/schema 变化（有则标 🔴 需 Kevin 签字）：
  - 当前只使用已出现的 `deep_read_date` 字段，不新增公共 schema；若发现 validator 未覆盖，补最小类型/校验。

## 4. eval 方式（机器 DONE 怎么定义）
- 结构门（脚本/断言，免费）：
  - `node scripts/columns/papers/build-index.mjs`
  - `node scripts/validate-papers-deepread.mjs`
  - `node scripts/validate-mind-palace.mjs`
  - `npm run verify`
- 内容门（独立 agent + rubric）：
  - 冷审必须由 Claude cold-audit 链完成，Codex 不自审放行。
  - 若 Claude CLI 返回 429，记录为阻塞/未完成，不伪造 PASS。
- 成功指标（真正证明"做对了"的 holdout/查询）：
  - metadata `cold_audit.status` 与 logs/status.json 一致。
  - `public/data/papers-index.json` 只收录 `ready_to_publish` 或 grandfathered/legacy 允许项。
  - Mind Palace 验证报告显示 facets/vectors 正常。
  - 线上 `/articles`、`/mind-palace` 可访问。

## 5. tool 调用（种类 + 方式）
- 用哪些 tool / 脚本 / MCP：
  - PowerShell + Node scripts
  - codegraph 查询相关脚本结构
  - git / gh / platform CLI 或 production URL canary
  - Browser 或 Web 请求做线上健康检查
- 是否新增依赖（默认不加重资产，RULES/SPEC）：
  - 不新增依赖。

## 6. 编排方式（需不需要子 agent / 框架）
- 单主控够不够？需要拆角色吗（需求/方案/开发/审查/测试）？
  - Codex 主控负责工程收尾、脚本验证、提交部署。
  - 冷审角色必须保持独立，由现有 Claude cold-audit 链承担。
- **不上 langraph/CrewAI/AutoGen**，除非要发线上自主多 agent 产品——本次只跑既有 deterministic scripts + Claude CLI。
- 若用子 agent，列派发表：
  - 角色：代码审查 / 内容冷审；eval：冷审五标准 + 引证纪律；模型：Claude CLI；effort：现有脚本配置。
- 是否用 dynamic workflow：
  - 是，冷审批处理和 KG ingest 走现有批量工作流。

## 7. 切片（每片=可运行交付）
- 片 1（先证小样）：
  - 审计当前状态，确认哪些论文已过、哪些 429、哪些索引/入图已落盘。
- 片 2：
  - 重跑未完成冷审或记录 quota 阻塞；只发布已过审项。
- 片 3：
  - 生成文章索引与 Mind Palace 图谱，补 task-board。
- 片 4：
  - `npm run verify`，提交、推送、部署验证。
- 每片的"可运行、Kevin 能看到"是什么：
  - 本地索引/图谱/文章页可构建；最终生产站可访问。

## 8. 风险 / 回退
- 风险点：
  - Claude CLI quota 继续 429，无法完成独立冷审。
  - 未过审内容被误发布。
  - OneDrive/.next 文件锁导致 build 偶发失败。
  - 线上部署不是简单 push 或需要 Vercel 权限。
- 回退方式（保留上一版）：
  - 不改未过审内容的发布状态。
  - git commit 前保持 diff 可审；若部署后异常，用 git revert 当前提交并推送回滚。
