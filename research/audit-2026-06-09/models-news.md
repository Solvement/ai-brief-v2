# 模型栏 + 新闻栏审计 (2026-06-09)

起因：今天模型栏漏掉 Anthropic Fable 5。Anthropic 条目当天已修（双源 releaseUrls + 开放正则）。
本次任务：把同样的病治到**其它厂商**和**新闻栏**。

---

## 1. models 其它厂商「同病同治」

「Fable 5 病」有两个独立病灶，二者都不只 Anthropic 有：
- **病灶 A（单源滞后）**：旗舰发布当天先上厂商 news 页，docs/API changelog 滞后一天。单源检测就瞎。
- **病灶 B（正则写死昨天的命名）**：正则把已知家族词写死，新品牌/新档位词不在表里就隐身。

### OpenAI (`openai-gpt`)
- **证据**：`scripts/columns/models/registry.mjs:43-51`（旧）单源 `platform.openai.com/docs/changelog`，正则 `o[0-9][A-Za-z0-9.-]*`。
- **病灶 A**：与 Anthropic docs 同理，旗舰先上 `openai.com/news/`。curl 验证 `openai.com/news/` 可抓且含最新 `GPT-5.5`。
- **病灶 B（更严重，OpenAI 独有）**：`o[0-9][A-Za-z0-9.-]*` 会匹配 **openai.com 压缩 JS 资源文件名**当成模型版本——实测 curl 抓到一堆假命中：`O5jmM3eTioFPvNvL6Bx`、`o9z4drghg2r.css`、`O2f42XPnm`、`o8w178.js`…。今天没炸只是因为页面同时有干净的 `GPT-5.5`（版本号 key 更高赢了）；**某天若发布页只有 o 系列新品而无干净 GPTx.y，就会把 JS 哈希当模型名**。
- **已修**：
  - 双源 `releaseUrls = [platform.openai.com/docs/changelog, openai.com/news/]`（最高版本胜，与 Anthropic 一致）。
  - o 系列正则收紧：`\bo[0-9]{1,2}(?:[-\s](?:mini|pro|preview))?(?:\.[0-9]+)?\b(?![A-Za-z0-9])`——锚定小写 o + 1~2 位数字 + 可选干净后缀，且**后面不能再跟字母/数字**，于是 `o3-mini`/`o4` 命中，`O5jmM3...`/`o9z4...css` 不命中。
- **实测**：`node -e fetchClosedModelStatus` → `GPT-5.5`（双源，无假命中）。

### Google Gemini (`google-gemini`)
- **证据**：`scripts/columns/models/registry.mjs:72-80`（旧）单源 `ai.google.dev/gemini-api/docs/changelog`，正则只认 `Pro|Flash|Flash-Lite`。
- **病灶 A**：curl 三页对比——`ai.google.dev` changelog 最新只到 **Gemini 3.5**（裸名），而 `deepmind.google/models/gemini/` 已有 **Gemini 3.5 Flash**（带档位变体），`blog.google/products/gemini/` 也确认 3.5。说明 API changelog 比模型发布页滞后/变体不全。
- **病灶 B**：档位词表缺 `Ultra/Nano`——新档位词会让旗舰隐身（同 Fable 5 的机理）。
- **已修**：
  - 三源 `releaseUrls = [ai.google.dev changelog, deepmind.google/models/gemini/, blog.google/products/gemini/]`（三页 curl 均可抓）。
  - 正则补 `Ultra|Nano`，数字与档位间允许连字符或空格：`\bGemini[\s-]*[0-9][0-9.]*(?:[\s-]*(?:Pro|Flash-Lite|Flash|Ultra|Nano))?\b`。
- **实测**：`Gemini 3.5`（裸旗舰名）。

### 共享逻辑改进：版本相同的「档位平手」破并
- **问题**：`releaseVersionKey` 只按数字版本排序（`sources.mjs:371`）。同为 3.5 的 Pro/Flash/Nano 平手 → 旧逻辑保留 DOM 里**先出现**的那个。首测时 Google 错挑成 `Gemini 3.5 Nano`（Nano 在 deepmind 页 DOM 里先出现）——版本对、档位错。
- **已修**：新增 `tierBonus()`，给旗舰档位（Pro/Opus/Ultra）一个 < 1 的小加成，平手时 Pro > Flash > Nano、裸家族名 > Nano。加成是亚版本级，**绝不会让低数字版本反超高数字版本**（已写回归测试断言 `3.5 Nano > 3.4 Pro`）。
- **实测**：Google 改挑回 `Gemini 3.5`（裸旗舰名，bonus 0.2 > Nano 0.02）。

### 回归保护
- `scripts/__tests__/models-version-detect.test.mjs` 原 4 测全绿；新增 4 测：① OpenAI 正则拒绝 JS 资源假名 ② OpenAI 仍认真 GPT/o 系列最高版本胜 ③ 档位平手破并 ④ Gemini 同版本优先旗舰档位。**8/8 绿**。
- Anthropic 回归：`Claude Fable 5` 仍正确检出（未被波及）。

### 改过的文件
| 文件 | 改动 | 验证 |
|---|---|---|
| `scripts/columns/models/registry.mjs` | OpenAI 双源+o 系列正则收紧；Google 三源+档位词补 Ultra/Nano | `node --check` 绿；live detect = GPT-5.5 / Gemini 3.5 |
| `scripts/columns/models/sources.mjs` | fallback patterns 同步收紧/补词；`releaseVersionKey` 加 `tierBonus()` 破平手 | `node --check` 绿；8/8 单测绿 |
| `scripts/__tests__/models-version-detect.test.mjs` | +4 回归测试 | 8/8 绿 |

---

## 2. 开源侧检测假设（task 2，报告 only）

`sources.mjs` 的 HF 开源检测（`displayHfModelName` `sources.mjs:282` / `relatedHfModels` `sources.mjs:261` / `fetchHuggingFaceOrgListing` `sources.mjs:214`）确有「旧命名规律当定义」隐患，但比闭源轻：

- **`familySearch` 是写死的家族字符串**（`registry.mjs`：`DeepSeek-V4` / `Qwen3.6` / `Llama-4` / `Mistral-Large-3`）。`relatedHfModels` 用 `normalizeFamily()`（去非字母数字后做 `includes` 子串匹配，`sources.mjs:275`）来筛同族。**风险**：厂商换代换了家族词（如 `DeepSeek-V5`、`Qwen4`、`Llama 5`），`includes("deepseekv4")` 就**完全筛不到新家族**——等于闭源「写死昨天命名」病的开源版。这正是 Fable 5 的同型病，只是闭源已治、开源未治。
- **缓解现状**：`fetchHuggingFaceOrgListing` 按 `lastModified` 倒序拿该 org 最近 20 个 repo（`sources.mjs:218-221`），即使 familySearch 落空，列表里仍可能有新模型；但 `relatedHfModels` 的 family 过滤又会把不含旧家族词的新模型**踢掉**（`sources.mjs:264-269`），所以缓解被自己的过滤抵消。
- **`displayHfModelName`**（`sources.mjs:282`）只是把 repo id 末段去连字符美化，不写死命名规律，无病。
- **建议（不在本次范围内动）**：开源侧也做「双信号取并」——family 子串命中 ∪ org 最近修改 top-N（即使不含家族词也保留，按 lastModified 选最新），避免换代家族词导致整族隐身。或把 `familySearch` 升级成「家族前缀正则」而非固定串（如 `DeepSeek-V[0-9]+`）。优先级：中（开源换代频率低于闭源旗舰，且 hfId 本身每代要人工更新，人会顺手发现）。

---

## 3. news 栏源覆盖 + 容错（task 3）

### 厂商官方博客覆盖：全齐
要求清单 vs 实际（`scripts/columns/news/sources.mjs`）：
| 厂商 | 在? | 位置 |
|---|---|---|
| OpenAI | ✅ | `RSS_SOURCES` `sources.mjs:42`（`openai.com/news/rss.xml`）|
| Anthropic | ✅ | `HTML_SOURCES` `sources.mjs:73`（`anthropic.com/news`）|
| Google DeepMind | ✅ | `sources.mjs:82`（`deepmind.google/blog/`）|
| Meta AI | ✅ | `sources.mjs:91`（`ai.meta.com/blog/`）|
| Mistral | ✅ | `sources.mjs:100`（`mistral.ai/news/`）|
| DeepSeek | ✅ | `sources.mjs:109`（`deepseek.com`）|
| Qwen | ✅ | `sources.mjs:117`（`qwenlm.github.io` RSS）|
| xAI | ✅ | `sources.mjs:127`（`x.ai/news` + rss fallback）|

**8/8 全覆盖，无缺口。** 另有 press 层（TechCrunch/VentureBeat/The Verge）+ HN + Reddit。

### 重试/容错健全度
- **单源瞬时失败不抛、跳过**：✅ 已健全。`discoverNews` 用 `Promise.all`，每个 source 在 `fetchRssSource`/`fetchHtmlSource`/… 内部 try/catch，失败走 `failedSource()` 返回空 items + `stat.ok=false`（`sources.mjs:181-226`），**绝不向上抛**。即「openai RSS 瞬时错误」绝不会让 `discoverNews` 整体失败。
- **重试**：`fetchWithRetry`（`scripts/lib/http.mjs`）默认 3 次指数退避，瞬时网络错误（`isTransientNetworkError`）才重试。
- **「今天 boot 死于 openai RSS 瞬时错误写 stderr」的真因 = 不在 news 脚本，已根治**：`scripts/boot-daily.ps1:10-15` 注释写明——PS 5.1 下 `native 2>&1 | Tee` 会把每行子进程 stderr 包成 ErrorRecord，旧的 `$ErrorActionPreference="Stop"` 把第一条（一句无害的 `transient fetch rss openai ... retry 1/3` 重试提示）变成终止错误，于是 09:15 boot 死。**今天已改 `$ErrorActionPreference = "Continue"` + 显式 `$LASTEXITCODE` 检查**（line 15）——真失败仍停，stderr 噪声不停。
- **关于「重试日志该去 stdout 不该 stderr」**：`fetchWithRetry` 用 `logger?.warn?.`，news 传的 logger 是 `console`，`console.warn` → stderr。理论上可改走 stdout，但**根因已在 boot 层用 `Continue` 解决**，无需再动库层 logger（动它会影响所有调用方的日志分流，风险大于收益）。**建议：不改**，除非将来要在非 PS 环境复现该问题。

### news 改动
- **本次 news 脚本未改**（覆盖全齐、容错健全、boot 根因今天已修）。仅 `node --check` 复核两脚本通过。

---

## 4. models↔news 联动建议（task 4，report only）

**场景**：今天 news 栏抓到了 Fable 5（Anthropic 官方博客在 news HTML_SOURCES 里），而 models 栏当时瞎。这是个现成的廉价交叉校验信号。

**值不值得做：值得，且最小版很便宜。** 理由：
- news 已每天抓 8 家官方博客（含 Anthropic/OpenAI/Google），数据已在手，零额外抓取成本。
- models 栏的失败模式是「静默落后一天」——没有任何告警，正是 Fable 5 漏掉的样子。news 命中是免费的「第二信源」。

**最小版设计（不引库、确定性、可加 boot）**：
1. news 跑完产出 `public/data/news.json` 后，加一个**确定性校验脚本** `scripts/columns/models/cross-check-news.mjs`（只读，不写 public/）：
   - 读 news.json 里 `sourceType==="official"` 且 source ∈ {OpenAI, Anthropic, Google DeepMind} 的当天条目；
   - 用各厂商 registry 的 `releaseNamePattern` 在 news 标题里抽模型名 + `releaseVersionKey`；
   - 与 models 栏当天检出的 `latestVersion` 的 key 比；
   - **若 news 里出现了比 models 栏更高版本的模型名 → 写一条告警**（stdout + 一个 visible health 文件，仿照 `papers-deepread-health.json` 的模式），boot 里 best-effort 调用、非阻塞。
2. **升级版（可选）**：告警时自动触发 models 栏对该厂商**复查一次**（强制带 `openai.com/news` 等 news 源 URL 重抓）。但有了本次双源/三源修复后，复查的边际收益下降——双源已直接读 news 页，多数情况 models 栏不会再落后于 news 栏。
3. **优先级**：双源修复落地后，联动从「补救漏报」降级为「兜底告警」。建议**先只做 step 1 的告警（最便宜、可见）**，step 2 暂不做——避免两套抓取逻辑漂移。
4. **红线**：这是新增「综合/联动」逻辑，若做成独立产物（如综合栏）需 Kevin 拍板（MEMORY 锚点：综合栏=单独 col 🔴）；但**纯内部告警 health 文件不算新栏目**，可直接做。

---

## 明天 6-10 产品级验证法（模型栏三家卡片该显示什么）

Kevin 6-10 boot 后打开 live 站 `/models`（或对应模型栏），三张闭源卡应显示：

| 厂商卡 | 「最新版本」字段应显示 | 双/多源生效的判据 |
|---|---|---|
| **Anthropic / Claude** | `Claude Fable 5`（**不是** Opus 4.x） | 卡上版本是 Fable 5 = news 页源被读到，回归未坏 |
| **OpenAI / GPT** | `GPT-5.5`（**绝不是** 形如 `O5jmM3...` 的乱码哈希） | 版本是干净 GPT-5.5 = JS 资源假名被正则挡住；若哪天只有 o 系列新品，应显示 `o4`/`o5-mini` 之类干净名 |
| **Google / Gemini** | `Gemini 3.5`（裸旗舰名，**不是** `Gemini 3.5 Nano`） | 版本是旗舰档位/裸名 = 三源并 + 档位破平手生效 |

**反例（说明没修好）**：任一卡显示过期版本（Opus 4.x / GPT-5.2 / Gemini 3.0）、或乱码哈希、或被小档位（Nano）压过旗舰 → 修复回退。
**最快人工核对**：卡上版本号 vs 当天各厂商 news 页头条的模型名一致即过。
