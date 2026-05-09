# Codex Next Tasks — AI-brief v2

You (Codex) are continuing work on AI-brief, a Chinese-first AI intelligence product. Read these files **before** doing anything in this document:

1. `AGENTS.md` — product principles + engineering rules + Done means.
2. `docs/product-model.md` — product thesis. Do not break it.
3. `docs/evaluation-rubrics.md` — schema is canonical.
4. `docs/handoff/README.md` — execution constraints (re-read every Phase).
5. `docs/handoff/api-procurement.md` — environment variables you can rely on.

Three Phases. Do them in order. **One Phase per PR.** Mark a Phase done by changing `Status: not started` to `Status: done @ <ISO date> by codex` at the top of the section, plus a one-line note in the changelog at the bottom.

If a Phase blocks because an env var is missing, **stop and report**, don't fake the integration with mocks.

---

## Phase 1 — Replace deterministic evaluator with LLM-backed evaluator

**Status: done @ 2026-05-07T18:29:00-04:00 by codex**

### Why

`src/lib/ai/evaluation/index.ts::evaluateContent` is a placeholder. `summary` is `raw_text.slice(0, 180)`. `one_sentence_takeaway` is `${title} needs judgment before action`. Scores are formulas. Nothing in the product fulfills the "AI evaluates every item" promise. This Phase fixes that, and **only** that. Do not touch UI, do not touch ingestion shape, do not refactor unrelated code.

### Files to add

```
src/lib/ai/evaluation/
  llm-client.ts        # thin wrapper around fetch() to LLM provider
  prompt.ts            # builds the per-content-type evaluation prompt
  evaluator.ts         # new public entry: async evaluateContentWithLLM(input)
  cache.ts             # content-hash → EvaluationResult, in-memory + JSON file
  __snapshots__/       # golden outputs from 5 fixture items per content_type
```

### Files to modify

- `src/lib/ai/evaluation/index.ts`:
  - Keep `evaluateContent` (the deterministic version) **as-is**, rename it to `evaluateContentDeterministic` and re-export.
  - Add a new top-level `evaluateContent(input)` that is **async** and:
    1. computes `content_hash = sha256(content_type + title + raw_text)`
    2. checks cache, returns if hit
    3. calls `evaluateContentWithLLM(input)`; on success, stores in cache
    4. on failure (timeout / non-2xx / JSON-validation fail), logs warning, returns `evaluateContentDeterministic(input)` as fallback
  - Both signatures must keep the original `EvaluationInput → EvaluationResult` shape so callers don't change.
- `src/lib/ai/evaluation/schema.ts`:
  - Strengthen `validateEvaluationResult`. Add these checks:
    - All four score fields are integers 0–100 (already there, keep).
    - At least one of `impact_score`, `actionability_score`, `confidence_score` is **not** equal to the others (rejects "model returned 75/75/75/75" lazy outputs).
    - `summary` length: 60–600 chars (Chinese chars count as 1).
    - `one_sentence_takeaway` length: 15–120 chars, must end with `。`, `？`, `！`, `.`, `?`, or `!`.
    - `key_facts` / `opportunities` / `risks` / `next_steps` each have 2–6 items, each item 8–200 chars.
    - At least 30% of `summary` characters are CJK (`/[一-鿿]/`) — guards against the model accidentally responding in English.

### `llm-client.ts`

```ts
export interface LlmRequest {
  model: string;            // e.g. "deepseek-chat", "claude-haiku-4-5-20251001"
  system: string;
  user: string;
  response_format: "json";  // enforce JSON mode where provider supports it
  max_tokens: number;
  temperature: number;
  timeout_ms: number;
}

export interface LlmResponse {
  text: string;             // raw model output (expected to be a JSON string)
  prompt_tokens: number;
  completion_tokens: number;
  provider: "deepseek" | "anthropic" | "openai";
}

export async function callLlm(req: LlmRequest): Promise<LlmResponse>;
```

Implementation rules:

- Read `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `ANTHROPIC_API_KEY` from `process.env`.
- Provider is **inferred from `req.model`**: `deepseek-*` → DeepSeek, `claude-*` → Anthropic, `gpt-*` → OpenAI.
- Use Node's built-in `fetch` (Node 18+; `package.json` doesn't pin yet — add `"engines": { "node": ">=20" }`). Do not add `node-fetch` or `axios`.
- Implement `AbortController` with `req.timeout_ms`. Default 30000. On timeout, throw `LlmTimeoutError`.
- Retry policy: max 2 retries on 429 / 5xx, exponential backoff 500ms → 1500ms. **Do not retry** on 4xx other than 429.
- On non-2xx after retries: throw `LlmRequestError` with status code and short body (cap body to 500 chars in error message).
- DeepSeek + OpenAI: use `/chat/completions` with `response_format: { type: "json_object" }`.
- Anthropic: use `/v1/messages`, no native JSON mode, but include `"You must respond with a single JSON object and nothing else."` in the system prompt; parse the first `{...}` block from output.

### `prompt.ts`

Exposes one function:

```ts
import type { EvaluationInput, EvaluationResult } from "./schema";
import type { ContentType } from "../../content/types";
import { evaluationRubrics } from "./rubrics";

export function buildEvaluationPrompt(input: EvaluationInput): { system: string; user: string };
```

`system` is fixed — defines the role, output schema, hard rules. `user` is per-input.

#### `system` template (exact text; do not paraphrase loosely)

```
你是 AI-brief 的资深内容评估员，AI-brief 是面向中文 AI 从业者的"信息 → 判断 → 行动"决策工作台。

你的任务：对一条 AI 内容做结构化评估，输出**一个**严格符合下方 schema 的 JSON 对象，**不要**输出任何 JSON 之外的字符（不要 markdown 代码块、不要解释）。

输出 schema（所有字段必填，类型严格匹配）：
{
  "summary": string,                       // 80-300 中文字，覆盖事实层
  "one_sentence_takeaway": string,         // 一句话给从业者的判断，30-80 中文字，以中文标点结尾
  "why_it_matters": string,                // 为什么重要，60-200 字，要具体不要套话
  "readability_score": int 0-100,          // 行文清晰度
  "impact_score": int 0-100,               // 对中文 AI 从业者的影响力
  "actionability_score": int 0-100,        // 是否可被立刻使用 / 验证 / 落地
  "confidence_score": int 0-100,           // 信息可信度（**这一项后面会被规则覆盖，但仍要尽力给出**）
  "difficulty": "beginner" | "intermediate" | "advanced",
  "recommended_action": "know" | "read" | "try" | "save" | "use_now" | "monitor" | "avoid",
  "target_audience": Audience[],           // 至少 1 个，最多 4 个，从 ["developer","pm","founder","creator","operator","researcher","enterprise"] 选
  "key_facts": string[],                   // 3-5 条，每条 ≤ 60 字
  "opportunities": string[],               // 2-4 条
  "risks": string[],                       // 2-4 条
  "next_steps": string[]                   // 2-4 条，必须是动词开头的可执行动作
}

硬规则：
1. 全部用简体中文（除非内容是模型名 / 工具名 / 代码 / URL）。
2. 不要重复 title 的内容当作 summary。
3. 不要使用"具有里程碑意义"、"标志着"、"开启了"等空套话。判断要具体到数字、版本、名称、做法。
4. 给出真实的 score 分布，不要四个分数都给同一个值。
5. 如果信息不足以判断某一项，宁可降低 confidence_score，也不要编造细节。
6. recommended_action 必须和 actionability_score / confidence_score 一致：
   - confidence_score < 45 → 强制 "monitor"
   - 是 guide / playbook 且 actionability ≥ 80 → "use_now"
   - 是 tool/project/model/integration 且 actionability ≥ 70 → "try"
```

#### `user` template

```
[内容类型] {{content_type}}
[评估目标] {{rubric.goal}}
[评估维度] {{rubric.criteria.join("、")}}
[来源类型] {{source_type}}
[来源数量] {{source_count}}
[是否有官方源] {{has_official_source}}

[标题] {{title}}

[正文]
{{raw_text （截断到 EVALUATOR_MAX_INPUT_TOKENS / 2 字符）}}

请按 system 中的 schema 输出 JSON。
```

### `evaluator.ts`

```ts
export interface EvaluatorOptions {
  primaryModel?: string;     // default: process.env.EVALUATOR_PRIMARY_MODEL ?? "deepseek-chat"
  fallbackModel?: string;    // default: process.env.EVALUATOR_FALLBACK_MODEL ?? "claude-haiku-4-5-20251001"
  timeoutMs?: number;        // default: process.env.EVALUATOR_TIMEOUT_MS ?? 30000
}

export async function evaluateContentWithLLM(
  input: EvaluationInput,
  options?: EvaluatorOptions,
): Promise<EvaluationResult>;
```

Flow:

1. Build prompt via `buildEvaluationPrompt(input)`.
2. Call `callLlm` with `primaryModel`. On `LlmTimeoutError` or `LlmRequestError`, call once more with `fallbackModel`. Two failures total = throw.
3. Parse `response.text` as JSON. If `JSON.parse` throws, attempt to extract first `{...}` block and re-parse. If still fails → throw `EvaluatorOutputError`.
4. **Hybrid scoring**: replace LLM-returned `confidence_score` with the deterministic formula from `evaluateContentDeterministic` (LLM is bad at confidence; rule is better). Keep all other fields from LLM.
5. Run `validateEvaluationResult(parsed)`. If issues, throw `EvaluatorOutputError(issues)`.
6. Return.

### `cache.ts`

Simple, no dependency:

```ts
export interface CacheEntry { key: string; value: EvaluationResult; cached_at: string; }
export async function readCache(key: string): Promise<EvaluationResult | null>;
export async function writeCache(key: string, value: EvaluationResult): Promise<void>;
```

Storage: `.cache/evaluations.json` (gitignored, create dir if missing). In-memory map kept hot during a process. Cache by SHA-256 of `content_type|title|raw_text|EVALUATOR_PRIMARY_MODEL`.

### Tests (`tests/llm-evaluator.test.ts`)

Covered cases:

1. `validateEvaluationResult` rejects: all-equal scores; English-only `summary`; missing `next_steps`; takeaway without final punctuation; takeaway > 120 chars.
2. `evaluateContentWithLLM` returns deterministic fallback when `DEEPSEEK_API_KEY` is unset (mock by setting env to empty in test setup).
3. Cache hit avoids LLM call (use a fake `callLlm` injected via dependency rewrite or env-gated stub).
4. Hybrid scoring: confidence is overwritten by rule even if LLM returns 99.
5. Snapshot test: 3 fixture items pulled from `src/lib/content/seed.ts` (1 news, 1 model, 1 paper — pick the first of each `content_type`). Run with `process.env.EVALUATOR_LIVE=1` to actually call DeepSeek; default is offline using a deterministic mock. CI stays offline.

Use the existing test runner (`scripts/run-tests.mjs`). Do not introduce vitest or jest.

### Definition of Done — Phase 1

All of the below must hold:

- [ ] `npm run typecheck` clean.
- [ ] `npm run lint` clean.
- [ ] `npm test` passes (offline). No real network in CI.
- [ ] `npm run validate` clean.
- [ ] Live smoke run documented: `EVALUATOR_LIVE=1 node scripts/eval-smoke.mjs` evaluates 3 fixture items and prints output. (Create the smoke script under `scripts/`. ~30 lines.)
- [ ] PR description lists: every file added/changed, the live smoke output (full JSON of 3 items), failures encountered, and known limitations.
- [ ] No new dependency added. (Native fetch + crypto are sufficient.)
- [ ] `.env.example` created at repo root with the variables listed in `docs/handoff/api-procurement.md`.
- [ ] `.gitignore` updated to include `.env`, `.env.local`, `.cache/` (the current `.gitignore` does NOT have these — verify before pushing any commit that touches secrets).
- [ ] `evaluateContentDeterministic` still exported and tested as a fallback path.

---

## Phase 2 — GitHub API enrichment for tool / project / integration

**Status: done @ 2026-05-07T18:43:50-04:00 by codex**

### Why

For `content_type` in `tool`, `project`, `integration`, the most useful evaluation signals are objective: stars, recent commits, release cadence, contributor count, license, open-issue / PR ratio. Letting the LLM guess these wastes tokens and produces wrong numbers. Pull from GitHub directly; feed the LLM only the qualitative judgement task.

### Files to add

```
src/lib/ingestion/
  github.ts            # GitHubRepoStats fetch + cache
  url-router.ts        # decides if a URL is a github repo, returns owner/repo
```

### Files to modify

- `src/lib/ingestion/index.ts::makeDraftItem`:
  - When `row.url` is a GitHub repo and `content_type` is `tool` / `project` / `integration`, call `fetchGitHubRepoStats(owner, repo)` and pre-fill: `maturity`, `installation_minutes` heuristic, attach raw stats to a new optional field `github_stats` on `ContentItem`.
- `src/lib/content/types.ts`:
  - Add optional `github_stats?: GitHubRepoStats` to `ContentItem` base. Do not break existing types.
- `src/lib/ai/evaluation/prompt.ts`:
  - When `github_stats` is present, append a `[仓库客观数据]` block to the user prompt with stars, recent_commit_days_ago, releases_last_90d, contributors_count, license, open_issues, open_prs.

### `github.ts`

```ts
export interface GitHubRepoStats {
  full_name: string;
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  open_prs: number;
  contributors_count: number;
  license: string | null;
  default_branch: string;
  last_commit_iso: string;
  last_commit_days_ago: number;
  releases_last_90d: number;
  primary_language: string | null;
  archived: boolean;
  fetched_at: string;
}

export async function fetchGitHubRepoStats(owner: string, repo: string): Promise<GitHubRepoStats>;
```

Rules:

- Auth: `Authorization: Bearer ${process.env.GITHUB_TOKEN}` if set; otherwise unauthenticated (60 req/h limit; log warning).
- Endpoints to combine:
  - `GET /repos/{o}/{r}` for core stats
  - `GET /repos/{o}/{r}/contributors?per_page=1` and read `Link: ...&page=N>; rel="last"` header for `contributors_count`
  - `GET /repos/{o}/{r}/releases?per_page=100` and count those within 90 days
  - `GET /repos/{o}/{r}/pulls?state=open&per_page=1` similar header trick for `open_prs`
- Cache results in `.cache/github/{owner}__{repo}.json` for 24h. Re-fetch only if `Date.now() - fetched_at > 86400000`.
- Handle 404 (deleted/private repo) by returning `null`-equivalent — change return type to `Promise<GitHubRepoStats | null>` and update callers.

### Tests (`tests/github-enrichment.test.ts`)

- `url-router.ts` correctly extracts owner/repo from `https://github.com/foo/bar`, `https://github.com/foo/bar/`, `https://github.com/foo/bar/tree/main`, rejects non-github URLs.
- `fetchGitHubRepoStats` honours cache (mock filesystem time forward, second call reads cache).
- Prompt builder includes `[仓库客观数据]` block iff `github_stats` present.

### Definition of Done — Phase 2

- [ ] All tests pass; lint + typecheck clean; validate clean.
- [ ] Live smoke: `node scripts/github-smoke.mjs <owner>/<repo>` prints full stats for `anthropics/anthropic-cookbook` (or any pinned public repo).
- [ ] PR description shows before/after: same item evaluated without and with github_stats, demonstrating concrete factual fields filled in.

---

## Phase 3 — Embedding-based dedup + event clustering

**Status: done @ 2026-05-07T19:18:00-04:00 by codex**

### Why

`dedupeImportedItems` only matches by canonical URL. The same model release will arrive 5 times: official blog, jiqizhixin, qbitai, HN thread, GitHub release. These need to be **clustered into one event**, not deduped to one survivor. The Brief surface should show the event with all its sources, not pick one.

### Files to add

```
src/lib/ingestion/
  embedding.ts         # embed(text) → number[]; provider-agnostic
  cluster.ts           # clusterByEvent(items, opts) → EventCluster[]
src/lib/content/
  events.ts            # EventCluster type + helpers
```

### Files to modify

- `src/lib/ingestion/index.ts`:
  - Replace `dedupeImportedItems` callers with `clusterByEvent`. Keep the URL-dedupe inside cluster as a pre-pass (cheap).
- `src/lib/content/queries.ts`:
  - Add a query that returns latest events (a cluster surface) for the Brief page.

Implementation note: the original instruction to replace `dedupeImportedItems` callers was intentionally not applied after audit review. `ImportResult.items` remains `ContentItem[]`; event clustering is implemented as a separate event-index/query layer so ingestion does not lose item-level evidence.

### `embedding.ts`

```ts
export async function embed(text: string): Promise<number[]>;  // 1536-dim for openai 3-small
export function cosineSimilarity(a: number[], b: number[]): number;
```

Cache: `.cache/embeddings.json` keyed by SHA-256 of `text + EMBEDDING_MODEL`. Embeddings are deterministic per model, so cache forever within a model.

### `cluster.ts`

```ts
export interface EventCluster {
  id: string;
  representative_id: string;        // highest-confidence item in the cluster
  member_ids: string[];
  centroid_keywords: string[];      // top-3 nouns from titles, simple frequency
  earliest_at: string;
  latest_at: string;
  source_diversity: number;         // distinct source_name count
}

export async function clusterByEvent(
  items: ContentItem[],
  opts?: { similarityThreshold?: number; timeWindowHours?: number; },
): Promise<EventCluster[]>;
```

Algorithm (single-pass, online clustering):

1. Sort items by `collected_at` ascending.
2. For each item, embed `title + " " + (one_sentence_takeaway || summary).slice(0, 200)`.
3. Match against existing clusters: include if **all** of these hold:
   - cosine similarity to cluster centroid ≥ `similarityThreshold` (default 0.78)
   - `|item.collected_at - cluster.latest_at| <= timeWindowHours` (default 48)
   - `content_type` matches cluster's content_type
4. Otherwise start a new cluster.
5. Re-pick `representative_id` after each insertion: highest `confidence_score`, tie-break by lowest `collected_at`.

### Tests (`tests/event-cluster.test.ts`)

- Three fixture items about "GPT-5 release" from different sources cluster together.
- A `news` item and a `tool` item with similar wording do NOT cluster (different `content_type`).
- Items > 48h apart do not cluster.
- Cluster representative is the one with highest confidence_score.

### Definition of Done — Phase 3

- [ ] Tests + lint + typecheck + validate all clean.
- [ ] Live smoke: `node scripts/cluster-smoke.mjs` ingests 20 fixture items spanning 3 simulated events, prints clusters with member counts.
- [ ] Home / Briefs page wiring is **not** required in this Phase. Just the data layer. UI integration is a follow-up Phase.

---

## Phase 4 — Retrofit `prompt_version` into evaluation pipeline

**Status: not started**

### Why

Phase 1 shipped without a `prompt_version` field on `EvaluationResult`. Right now if we change the evaluation prompt — which we will — there is no way to tell which items were evaluated under the old prompt and need re-evaluation, and no way to A/B two prompt variants because their outputs are indistinguishable in storage. This is a small surgical retrofit that pays off every time we tweak the prompt.

This Phase is **not** a re-do of Phase 1. The existing implementation stays. We add one field, stamp it, validate it, include it in the cache key.

### Files to modify

- `src/lib/ai/evaluation/prompt.ts`:
  - Export `export const PROMPT_VERSION = "eval-v1";` as the source of truth. Bumping this constant will be the one-line change that invalidates cache + lets evaluators distinguish output generations.
- `src/lib/ai/evaluation/schema.ts`:
  - Add required field `prompt_version: string` to `EvaluationResult`.
  - In `validateEvaluationResult`, add: `if (!/^eval-v\d+$/.test(result.prompt_version)) issues.push("prompt_version must match /^eval-v\\d+$/.");`
- `src/lib/ai/evaluation/evaluator.ts`:
  - After parsing the LLM output and applying hybrid scoring, before validation: stamp `parsed.prompt_version = PROMPT_VERSION`. The LLM is **not** asked to output it; the evaluator stamps it server-side. This avoids the LLM lying about which version it used.
- `src/lib/ai/evaluation/deterministic.ts`:
  - The deterministic fallback also returns an `EvaluationResult`; stamp its output with `prompt_version: "deterministic-v1"`. This way every result in the system has a traceable origin, including fallbacks. (Update the regex above to also accept `/^(eval-v\d+|deterministic-v\d+)$/`.)
- `src/lib/ai/evaluation/cache.ts`:
  - Cache key becomes SHA-256 of `content_type|title|raw_text|EVALUATOR_PRIMARY_MODEL|PROMPT_VERSION`. Old cache entries created without prompt_version should be treated as cache misses (do not crash; just re-evaluate). Add a one-time migration log: `console.warn("Evaluation cache key format changed; previous entries will be regenerated on first access.")`.
- `src/lib/ingestion/index.ts::makeDraftItem`:
  - The hardcoded scaffolded EvaluationResult in `makeDraftItem` (or wherever drafted items are stamped) needs `prompt_version: "deterministic-v1"` filled in.
- All test fixtures that construct an `EvaluationResult` literal must add `prompt_version`.

### Tests

- Update `tests/llm-evaluator.test.ts`: assert the returned result carries `prompt_version: "eval-v1"` (live path) or `"deterministic-v1"` (fallback path).
- Add a test: changing `PROMPT_VERSION` to `"eval-v2"` (via dependency injection or test stub) causes the cache to miss and re-evaluate even with identical input.
- Update validation tests: an `EvaluationResult` missing `prompt_version` or with malformed version string fails validation.

### Definition of Done — Phase 4

- [ ] Typecheck, lint, validate, test all clean.
- [ ] `npm run build` clean (Phase 1's strict TS may fail until literals are updated).
- [ ] Smoke run: re-evaluate one item, confirm `prompt_version: "eval-v1"` appears in the JSON output.
- [ ] Cache file shows new keys; old entries (if any) silently re-evaluated.
- [ ] PR description: list every file touched + a one-line note about why each touch was needed.

---

## Phase 5 — Personal feedback layer (`personal_signals`)

**Status: not started**

### Why

AI-brief is currently used by a single user (Kevin) for himself. He needs to:

- override an evaluation he disagrees with and write the correct judgment;
- mark items he's actually going to act on (vs only intended);
- come back 7-30 days later and see "did I do what I planned?";
- attach personal notes to items beyond the AI evaluation.

This Phase adds the smallest viable feedback layer. It is **not** about future self-evolution (that is much later); it is about making the tool more useful to its single user today. As a side effect, the data accumulates and becomes the substrate for future training/calibration — but do not over-engineer for that future. Keep it simple.

### Files to add

```
src/lib/personal/
  signals.ts           # types + read/write API
  storage.ts           # localStorage adapter + JSON export/import
src/components/personal/
  SignalPanel.tsx      # the UI block on detail pages
```

### Files to modify

- `src/lib/content/types.ts`:
  - Add a new optional field on `ContentItem`:
    ```ts
    personal_signals?: PersonalSignals;
    ```
  - Define `PersonalSignals`:
    ```ts
    export interface PersonalSignals {
      evaluation_rating?: "accurate" | "wrong" | "shallow" | "insightful";
      override_takeaway?: string;       // user's own one-sentence judgment
      override_action?: ActionLabel;    // user disagrees with recommended_action
      saved_to_kb: boolean;             // mark for eventual wiki export
      acted_on_at?: string;             // ISO timestamp of when user actually used / read / tried
      notes?: string;                   // free-form, markdown allowed, no length cap in MVP
      updated_at: string;               // last write timestamp
    }
    ```
  - Do NOT make this required. Items without signals just have the field absent.

- `src/pages/BriefIssuePage.tsx` and any content detail page:
  - Mount `<SignalPanel itemId={...} />` near the bottom of the page (after `next_steps`, before `related_ids`).

### `signals.ts`

```ts
export function readSignals(itemId: string): PersonalSignals | null;
export function writeSignals(itemId: string, partial: Partial<PersonalSignals>): PersonalSignals;
export function listAllSignals(): Record<string, PersonalSignals>;
export function exportSignalsAsJson(): string;     // pretty-printed
export function importSignalsFromJson(json: string, mode: "merge" | "replace"): { imported: number; skipped: number };
```

Rules:

- Every write stamps `updated_at = new Date().toISOString()`.
- `writeSignals` does a partial merge — passing `{ notes: "x" }` does not erase the existing `evaluation_rating`.
- Import in `merge` mode: for each itemId, keep whichever record has the later `updated_at`.
- Import in `replace` mode: nuke and reload.

### `storage.ts`

- Primary: `localStorage` under key `aibrief.personal_signals.v1` (a single JSON object keyed by itemId).
- Fail-safe: if `localStorage` is unavailable (SSR, restricted iframe), fall back to in-memory map and warn in console once.
- Provide `subscribe(callback)` so React components re-render when signals change in another tab. Use the `storage` event.

### `SignalPanel.tsx`

Minimal layout. Do not over-design. Three rows:

Row 1 — evaluation rating: 4 small toggleable chips (`准 / 错 / 浅 / 有启发` mapped to `accurate / wrong / shallow / insightful`). Click toggles; clicking the active one clears.

Row 2 — override: one collapsed details element labeled `修正判断`. Expanded reveals a textarea (override_takeaway, max 200 chars) and a select (override_action, options from `actionLabels`).

Row 3 — action tracking: a checkbox `我打算做这件事` (writes `saved_to_kb = true`); a button `标记为已执行` (writes `acted_on_at = now`); a textarea `notes` for free-form notes. All saved on blur with 300ms debounce.

Also add a small text link at the top right of the panel: `导出 / 导入` — opens a tiny modal that shows the JSON export, lets user copy or paste-and-import. No backup automation; user takes a snapshot manually.

Visual: keep it dense, not a glamorous form. This is a personal tool. Use existing CSS variables; do not introduce new design tokens.

### Tests (`tests/personal-signals.test.ts`)

- `writeSignals` partial merge preserves existing fields.
- `readSignals` returns null for unknown itemId.
- `exportSignalsAsJson` round-trips through `importSignalsFromJson` (merge mode) without data loss.
- Import in `merge` mode keeps the entry with later `updated_at`.
- Import in `replace` mode discards existing entries not in the imported payload.

Use a simple `localStorage` mock (assign `globalThis.localStorage = { ... }` in test setup). Do not introduce jsdom or testing-library.

### Definition of Done — Phase 5

- [ ] All tests pass; lint + typecheck + validate clean.
- [ ] `SignalPanel` renders on at least one detail page (smoke screenshot saved to `docs/handoff/screenshots/phase-5-signal-panel.png`).
- [ ] Manual test: rate an item `准`, override its takeaway, mark `saved_to_kb`, refresh the page → all values persist. Export JSON, paste it into a sibling tab's import box → values appear.
- [ ] No new dependency added.
- [ ] PR description shows: file diff list, the smoke screenshot, the manual test checklist marked off.

### What this Phase explicitly does NOT do

- No server-side persistence. localStorage is enough for MVP single-user.
- No syncing across devices. JSON export/import is the manual escape hatch.
- No metrics dashboard summarizing signals. Future phase.
- No automatic prompt few-shot harvesting from `insightful`-rated items. Future phase.
- No wiki export of saved items. Future phase.

---

## Out of scope (do NOT touch in these Phases)

- Major UI redesigns, route changes, styling overhauls. (Phase 5 adds a single small panel; that's it.)
- New `content_type` values; existing 9 types (`news / model / tool / project / integration / article / paper / guide / course`) all stay — Kevin uses each for himself.
- Subscriptions, login, paid membership, public sharing surfaces.
- Image generation pipeline (`src/lib/media`) — frozen.
- Hermes / llm-wiki export — explicitly deferred until Phases 1-5 are stable and Kevin has used the product daily for 4+ weeks.
- Self-evolution / few-shot harvesting / fine-tuning — deferred until enough `personal_signals` data accumulates (target: 200+ rated items).
- Full ingestion scheduler / cron — on-demand callers are fine for now.

---

## Reporting back

When you finish a Phase, **post the following back to Kevin** in the PR description:

1. **What changed** (file-by-file, one line each).
2. **How to verify** (exact commands; expected output).
3. **Live evidence** (paste output of the smoke script and one sample LLM evaluation).
4. **Known limitations** (anything you noticed but did not fix).
5. **Cost so far** (rough token spend during your dev + smoke run).

Then update the `Status:` line and changelog at the top of the relevant section in this file.

---

## Changelog

- 2026-05-07: handoff package authored. Phase 1 / 2 / 3 specified. Awaiting Kevin's P0 keys before Phase 1 kickoff.
- 2026-05-07: Phase 1 completed with live DeepSeek smoke for 3 fixture items; Anthropic fallback remains optional and unset for now.
- 2026-05-07: Phase 2 completed with GitHub repo URL parsing, cached repo stats, prompt enrichment, enriched manual imports, and live GitHub smoke.
- 2026-05-07: Phase 3 completed with deterministic/local and live OpenAI embedding paths, event-index clustering, latest-event query surface, cluster smoke, and audit-reviewed ingestion separation.
- 2026-05-07: Phase 4 (prompt_version retrofit) and Phase 5 (personal_signals) added. Out-of-scope list rewritten to reflect personal-use direction: all 9 content types stay; Hermes / llm-wiki export and self-evolution explicitly deferred.
