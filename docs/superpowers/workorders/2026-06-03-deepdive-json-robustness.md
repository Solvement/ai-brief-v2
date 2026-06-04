# Workorder: fix deep-dive JSON failure rate (POINT-TO-POINT, do NOT run full radar)

Role: implementer. Architecture/diagnosis direction by PM (Claude). Iterate point-to-point — Kevin's rule: testing phase must NOT re-run the full pipeline (pure waste). Test ONLY on the specific failing repos below.

## PROBLEM (measured baseline from logs/gen-projects-20260603-v3.log + published trending.json)
Deep-dive success rate = 18/23 ≈ 78%. **5 deep dives failed on malformed JSON** from DeepSeek and were (correctly) downgraded to needs_enrichment. We want these to SUCCEED — they deserve deep dives. Target: get the 5 failing repos to produce valid deep-dive JSON.

Failing repos (their candidates + evidence are already stored in data/ai-brief.db from the v3 run):
- Chachamaru127/claude-code-harness
- EveryInc/compound-engineering-plugin
- Lum1104/Understand-Anything
- multica-ai/andrej-karpathy-skills
- stefan-jansen/machine-learning-for-trading

## PM ROOT-CAUSE HYPOTHESIS (verify, don't assume)
Errors are at small char positions (2270/2871/3409), NOT max_token truncation (deepDiveMaxTokens is now 16000). Example: "Unterminated string in JSON at position 3409 (line 78 column 1537)" — a very long single line with an unterminated string. Most likely DeepSeek emits invalid JSON: **unescaped double-quotes and/or raw control chars (newlines) inside long Chinese string values**, which `response_format: json_object` does not fully prevent for DeepSeek.

## TASK
1. **DIAGNOSE first (point-to-point):** write a small throwaway harness that loads ONE or two of the 5 failing repos' stored candidate+evidence+triage from data/ai-brief.db, calls the deep-dive LLM with raw output capture (inject `options.chatJson` or call the underlying `chat` with jsonMode), and writes the RAW model output to a file. Inspect it and CONFIRM the exact malformation. Include a short quote of the malformed fragment in your report so the PM can verify the root cause.
2. **FIX** based on what you actually find. Candidate approaches (pick by evidence; prefer the most robust with least fabrication risk):
   - (a) Robust JSON repair in `scripts/lib/parseJson` for DeepSeek's real failure mode (unescaped control chars / quotes inside strings). A vetted minimal repair is fine; if you add a dependency like `jsonrepair`, justify it.
   - (b) Reduce JSON fragility structurally: if one giant JSON with many long Chinese fields is the problem, split the deep-dive into smaller LLM calls (e.g. structured metadata as JSON + long-form section bodies fetched separately) so each parse is small and robust, then assemble.
   - (c) Strengthen the JSON discipline in the deep-dive prompt (deepdive-prompts.mjs) — escape rules, shorter per-field limits.
   You may combine. Keep the happy path unchanged.
3. **TEST POINT-TO-POINT (CRITICAL — do NOT run `daily` / full radar):** re-run the deep-dive for ONLY those 5 repos via your harness (load from db, call generateProjectDeepDive). Report the new success count (target 5/5, or explain any residual). Each LLM call costs money — run the 5, not the 30.
4. Add a unit test in scripts/__tests__/ using a CAPTURED malformed sample (offline, no LLM) asserting parseJson now recovers it.

## CONSTRAINTS
- No full `npm run daily` or `projects daily --limit 30`. Point-to-point only.
- Backend lane is yours; spawn sub-agents if useful.
- Do NOT commit. Report: root-cause finding (with malformed fragment quote), the fix + why, point-to-point result (X/5 now pass), test result, and any deviation. Keep/clean up the throwaway harness (move it under scripts/columns/projects/ with a __diag prefix or delete it — your call, but say which).
