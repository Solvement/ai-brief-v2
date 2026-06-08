# CON-3(B)=乙 spec · 让强模型(Claude)替便宜层著开源模型应用卡

> Owner: Codex(后端接线). Kevin 决策 = 乙:开源模型卡由**强模型(Claude CLI)**著、写**更深一档的应用判断**(不是机制)。范式 prompt 已由 Claude 在 `scripts/columns/models/prompts.mjs` 改深(openModelSystemPrompt + openModelUserPrompt,定义"深=应用判断厚度,禁内部机制")。本 spec 只接线 + 跑,不改范式语气。

## 现状(已看过,按此改)
- `scripts/columns/models/generate.mjs:generateModelEntry` 已有 seam:`const chatJson = options.chatJson || createDeepSeekClient(...).chatJson;`。开源走 `openModelSystemPrompt()` + `openModelUserPrompt()`,闭源走 changelog。
- 论文深读已有现成范式:`scripts/columns/papers/codex-deepdive.mjs` 用 `spawn` 跑 `codex exec ... --output-last-message <file> -` 把 strong model 当确定性脚本调用,再 `parseJson`。**本任务照这个模式,但换成 Claude CLI 作者。**
- 红线:每日流水线必须是确定性脚本,不能放开放式 agent。`claude -p`(print/headless 模式,固定 prompt,一次性返回)= 确定性 CLI 调用,**不是** open-ended agent,允许。

## 改动
1. 新建 `scripts/lib/claude-author.mjs`,导出 `createClaudeAuthorClient({ binPath?, model?, timeoutMs?, logger? })`,返回 `{ chatJson }`,签名与 DeepSeek 的 `chatJson({ system, user, model, maxTokens })` 兼容(供 seam 直接注入):
   - 内部 `spawn` `claude`(headless):`claude -p --output-format json`(或等价的非交互 print 模式;Windows 解析参照 codex-deepdive 的 `resolveCodexCommand`,APPDATA\npm 下找 claude 的 .js 入口,失败回退 `claude`)。把 `system + "\n\n" + user` 从 stdin 喂入(或用 `--system-prompt`/`--append-system-prompt` 若可用),`windowsHide`,超时 SIGTERM。
   - 解析:`--output-format json` 的外层是 Claude Code 的会话 JSON,取其中 assistant 最终文本字段,再用 `parseJson`(来自 `scripts/lib/llm.mjs`,已有 fence/balanced/repair 容错)抽出模型那一段严格 JSON。失败重试 1 次(追加"上次不是合法JSON"的纠正语,照 DeepSeek chatJson 的两段式)。
   - 不写任何密钥;用本地 Claude 订阅。
2. 在 models 生成路径加**闸门(默认关)**:env `MODEL_OPEN_AUTHOR`(`deepseek`|`claude`,默认 `deepseek`)。仅当 `=claude` 且 `model.kind==="open"` 且非 offline 时,把 `options.chatJson` 注入为 claude-author 的 `chatJson`,并把 `analysisAuthor` 标成 `Claude:<model>`(改 generate.mjs 里 analysisAuthor 那行,使其在用 claude 作者时反映真实作者,而不是写死 `DeepSeek:`)。闭源仍走 DeepSeek/changelog 不变。
   - 接线点选 `scripts/columns/models/daily.mjs`(每日编排)读 env 决定注入,或在 generate.mjs 内按 env 选 client——二选一,保持 generate.mjs 的 offline/stub 分支不动。
3. 不改 `OPEN_MODEL_OUTPUT_SCHEMA` 字段、不改前端 ModelCard、不改 validators(范式深化是在既有字段里写厚,无新字段)。

## 跑 + 验收(产品可见结果)
- 用 `MODEL_OPEN_AUTHOR=claude` 对 4 个开源模型(deepseek-v4 / qwen / llama / mistral)各重生成一次卡(走 `daily.mjs` 的 stage-2 或直接 `generate.mjs <id>`),要求:
  - 产出 JSON 过现有 models validator + `npm run validate`;`analysisAuthor` 显示 `Claude:...`;
  - 与旧 DeepSeek 版对比,whatItUnlocks ≥4 条且每条落到具体产品/工作流,whenToUse 是三支取舍(自托管/试水/别用),cost_caveats 有具体硬件账——即"更深一档应用判断"肉眼可见;
  - benchmark 数字不许新增/编造,只能沿用已核验事实(无新一手证据就保留旧值/标 caveat)。
- 把重生成的 4 张卡写进 `public/data/models.json`(其余闭源卡不动),`npm run build` + `npm test` 全绿。
- 加一个轻测:claude-author 的 `chatJson` 给定 mock spawn 输出能正确抽出内层 JSON(不真调 CLI)。

## 禁止
- 不改范式 prompt 语气(已定稿)。不改闭源路径。不动 schema/前端/validator 字段。不引第三方依赖。不跑全量历史重生成(只这 4 个开源家族)。不 git add/commit/push(只产 diff,Claude review 后再上线)。

## 备选 lever(可选,不强制)
- 若想抬高 few-shot 下限,可由 Claude 另行把 gold 例 `docs/superpowers/specs/2026-06-02-models-gold-deepseek-v4-pro.json` 的**应用文字字段**(whatItUnlocks/whenToUse/openSourceMeaning/cost_caveats)写深(保留其已核验 benchmark/license 事实不变)。这步归 Claude(文字生成),不在本 codex 任务内。
