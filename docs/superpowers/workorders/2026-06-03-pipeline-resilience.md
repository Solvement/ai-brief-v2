# Workorder: pipeline resilience + JSON robustness (P0 — blocks daily content)

Role: implementer. Spawn your own sub-agents if helpful. Architecture below is fixed by the PM (Claude); implement it faithfully, add tests, run `npm test`, do NOT commit (leave in working tree + report).

## ROOT CAUSE (verified from logs/gen-projects-20260603-v2.log)
The projects deep-dive LLM (DeepSeek) sometimes returns malformed/truncated JSON. `chatJson` (scripts/lib/llm.mjs) retries twice then THROWS. The kernel's `analyze` stage runs items via `mapLimit` (scripts/lib/pipeline-kernel.mjs:146-159) whose worker does `out[index] = await fn(...)` with NO try/catch — so a single item's throw rejects the whole `Promise.all`, aborts the `analyze` stage, and `publish` NEVER runs. Result: ~6 successful deep dives were written to brief-wiki/ but `public/data/trending.json` was never regenerated (still dated 2026-05-30). One bad repo loses the entire run.

Evidence: log shows multiple "JSON parse retry 1/2 ... Unterminated string / Unexpected end of JSON input", then `SyntaxError ... at generateProjectDeepDive (deepdive.mjs:76) -> analyze (index.mjs:122) -> pipeline-kernel.mjs:101 -> mapLimit:155`. Exit code 0 but trending.json not updated.

## FIX (three parts, in priority order)

### ① Kernel per-item resilience (CRITICAL — affects ALL columns: papers/projects/models)
In `scripts/lib/pipeline-kernel.mjs`, the `analyze` and `qaGate` stages must isolate per-item failures so one item cannot abort the batch:
- Wrap each item's `module.analyze(...)` call in try/catch. On error: keep the item but set `analysis: null` and `analysisError: <message>`, and `logger.warn` it. The stage MUST complete so `publish` runs.
- Do the same for the `qaGate` stage (`qa: null, qaError: <message>` on throw).
- Record per-stage failure counts on the stage record (e.g. `record.failures = N`) so it's transparent, not silent.
- Consider a small shared helper `mapLimitSettled` or an inline try/catch — your call, but keep `mapLimit` itself unchanged for other callers OR add the try/catch at the call sites (lines ~96-103 and ~105-112). Prefer call-site try/catch to avoid changing mapLimit semantics globally.

### ② JSON robustness in `scripts/lib/llm.mjs`
- Harden `parseJson(raw)`:
  1. strip markdown fences (already done)
  2. if direct `JSON.parse` fails, extract the substring from the first `{` to the last `}` (balanced) and try again
  3. remove trailing commas before `}`/`]`
  4. only then give up
- In `chat(...)`: capture `finish_reason` from the DeepSeek response (`d.choices[0].finish_reason`). If it is `"length"`, the output was truncated — log a clear warning (this is the real cause of "Unterminated string"). Optionally retry once with higher max_tokens.
- Raise the deep-dive default max_tokens: in `scripts/columns/projects/deepdive.mjs:80` the fallback is `12000`; bump the default to `16000` (keep env overrides PROJECT_DEEP_DIVE_MAX_TOKENS first).

### ③ Column-level fallback (so a failed deep dive still yields a radar entry)
In `scripts/columns/projects/index.mjs` `analyze` (~line 122): if the deep-dive `chatJson` ultimately fails, CATCH it and fall back to the light-tier payload / `needs_enrichment` decision for that repo (so it still appears on the radar at a lower tier with a recorded reason) instead of propagating the throw. Do NOT fabricate analysis content — mark it honestly as failed/needs_enrichment.

## TESTS (add to scripts/__tests__/)
- `parseJson` robustness: fenced JSON, JSON with leading prose, trailing commas, and a truncated/unterminated string (should still recover the valid prefix object OR throw cleanly — assert the recoverable cases parse).
- Kernel resilience: a fake module whose `analyze` throws on one item — assert the stage still completes, the failed item has `analysisError`, and `publish` is still invoked.
- Keep all existing tests green: run `npm test` and report the count.

## CONSTRAINTS
- No projects/papers pipeline is running now, so you MAY run `npm test`. Do NOT run `npm run daily` (the PM will do the validating re-run).
- Do not change behavior for the happy path (valid JSON) — only add resilience.
- Do NOT commit. Report: files changed, what each fix does, test results (X passed), and any deviation from this spec with reasoning.
