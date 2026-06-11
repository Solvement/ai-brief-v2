# Loop-Engineering 协议 — 做事前先把 Kevin 的意图整理成"loop 设计"

> Kevin 2026-06-09 定，强制（UserPromptSubmit hook 每次注入提醒）。
> **v3（2026-06-10 Kevin 改）**：硬门从"等 Kevin 说对"改为"**展示 7 格 + 断层提问引发他思考补全 → 不等确认，自主推进到可运行交付**"。红线 🔴（schema/删除/密钥/上线策略/产品方向）仍停。大 loop/goal = 这 7 步；小 loop 怎么写由 Claude 自主决定。契约仍必填（机器可验的 loop 设计），由 Claude 自填，填齐即开闸——门拦"没设计就动手"，不再拦"Kevin 没批"。
> **深层目的（不是安全/对齐，是训练）**：这是 **Kevin 练 loop engineering 的脚手架**——他要锻炼"表述系统设计 + 写出完整可循环 loop"的能力；逼我把他的话整理成 loop 设计、在断层处让他补，他就在练把 loop 写完整；写完整了，**细节我去做**。hook 训练的是**设计者**，不是执行者。
> 背景：loop engineering = 不再逐轮 prompt agent，而是设计那个"发现工作→分派(子)agent→验证→持久化状态→决定下一步"的循环系统（承接 Prompt→Context→Harness→**Loop**）。

## 何时触发
- **要做实质事 / 起一个 loop 时** → 必走本协议。
- 闲聊 / 简单确认 / 纯事实回答（没 loop 可设计）→ 跳过。

## 触发时我必做（顺序）
1. **提取意图 → 写成 loop 设计（7 格）**，给 Kevin 看：
   1. **目的 / why** — 真正要达成什么 + 背后目的（不只字面要求）
   2. **触发 / 输入** — 什么启动这个 loop、处理什么
   3. **步骤 / 分派** — 怎么做、拆给谁（我 / codex / 子 agent）
   4. **验证** — 怎么算做对了（指标 / 门 / benchmark）
   5. **状态 / 持久化** — 中间状态记哪（task-board / memory / research-state）
   6. **停止 / 交付** — 何时停、交付什么
   7. **断层** — 上面哪格他没说清 → 列出来问他
2. **断层处提问引发 Kevin 思考补全**（训练目的不变——他练 loop 表述）。
3. **v3：不等确认，自主推进到可运行交付**。先自填契约（机器可验 loop 设计）→ 开闸 → 连续执行小 loop 直到验收门全绿。只在红线 🔴 处停下问。

### v3.1（2026-06-11 Kevin 修正）——why/验证前置，收尾精简
- **为什么 / 怎么验证 属于事前 loop，不留到收尾**。开头就把"逻辑链重现 + 7 格（含 why + 怎么验证）"讲清——前置的双重意义：① 检验 Kevin 有没有把项目**想透**（引导他深入理解，才写得出 loop）；② loop 要**够我自己循环到可运行完成**。
- **收尾精简、不重复**：完成汇报只给 ① 一句话产品级结果 + 怎么在产品里验证（变了什么、点哪看）；② memory 新模式；③ 契约晋升。**不再尾部重述 why / 7 格 / 6 问**（那是事前讲过的，重复＝噪声）。
- hook 已对齐（LIGHT_REMINDER 前置引导思考；CLOSURE_REMINDER 精简）。

## 内化（这才是重点）
- 每次走完，把他**反复出现的目的 + 逻辑模式**沉进 `[[kevin-purposes-and-loops]]`（auto-memory，自动进上下文）。
- 下次**用它预填** loop 设计（少让他重复说），并能**主动提醒 / 自主做 / 预防**同类事。

## loop engineering 的坑（设计本协议时已避）
- **无停止条件会死循环** → 硬门 = 他说"对"才停提问、才动手。
- **反思不持久则改进是临时的** → 沉进 memory。
- **会幻觉他的意图** → 7 格里不确定的标"断层"问他，不替他脑补。

## v3 升级：单一分类源 + 句级分类 + 契约库 + Stop 闭环（2026-06-10，Kevin 授权"按推荐改进"）

- **合并**：loop-protocol.mjs 已删，`loop_contract_gate.py` 是唯一 hook（UserPromptSubmit/PreToolUse/Stop 三事件）。未布防的真实用户消息发 1 行轻提醒；布防时发完整 v3 文案。
- **句级分类**：按句切分，实施词（EN 词边界正则 + ZH 扩词表含 改进/优化/重写/升级/补全/实施/落地/更改）只在**非疑问句**内才布防；疑问句 = 句尾 ?/？/吗/呢 或句内 是否/是不是/要不要/怎么/如何/为什么/哪些 等。保守偏向假阴（不布防的代价 < 误拦）。
- **契约库** `.agent/contracts/<type>.md`：契约新增 `Loop type:` / `Reuse triggers:` 字段；布防时触发词命中 → 复用库契约（换 hash）→ 首个工具调用验证即开闸，免重填。跑稳的 loop 类型由 Claude 在闭环时手动晋升入库（"skills compound, prompts burn"）。
- **冷却 180s**：state 创建 3 分钟内的新实施 prompt 不重布防（修 0610 一天 22 份契约归档 churn）。
- **Stop 闭环**：① armed 未实施 → 自动拆防（修陈旧 state 拦无关写入的事故类）；② 开闸过且未闭环 → block 一次提醒（6 问汇报 + memory 更新 + 契约晋升评估），置 closed 后放行，保证不死循环；payload.stop_hook_active 直接放行。
- **机器验收**：`python .claude/hooks/loop_gate_test.py`（29 case 全过 = 门行为正确）。plan：`docs/plans/2026-06-10-loop-hook-v3.md`。

## v2 升级：Loop Contract Gate（2026-06-09，Kevin 定）

7 格协议从"软提醒"加装**机器硬门**（`.claude/hooks/loop_contract_gate.py`，PreToolUse deny）：

- **两层不互替**：7 格对话 = Kevin 确认方向（训练他的设计表述）；contract 文件 = 机器可验的实施许可。流程：**7 格确认 → 把确认结果落进 `.agent/loop-contract.md` → 填齐才许写业务代码**。
- **机制**：实施类 prompt（实现/修复/部署/build/fix…）→ UserPromptSubmit 布防（state + 契约模板，prompt hash 绑定防陈旧复用）；契约填齐（无占位符 + `Ready to implement: yes` + 范围/验收/验证/迭代预算/停止/回滚全非空）前，PreToolUse 拒绝：业务 Write/Edit、副作用 Bash（rm/npm/git commit/python…）、ExitPlanMode；放行：读/搜、安全侦察命令、契约文件本身。契约齐 → 开闸（state.active=false）。
- **三处本地适配**（GPT 原稿直接装会出事故）：① **state 门**——只有布防后才拦，否则锁死一切会话；② **`LOOP_GATE=off` 旁路**——每日确定性管线（boot-daily.ps1 已设）的 headless `claude -p` 不走此门，否则深读死锁；③ Windows 用 `python` + 脚本内强制 UTF-8（否则中文关键词静默失配）。
- **逃生口**：状态文件 hook 托管不许 Claude 改；误布防时人工删 `.agent/` 即拆防。`.agent/` 已 gitignore（契约是任务级临时件，归档在 `.agent/archive/`）。
