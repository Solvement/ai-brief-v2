# Workorder: universal pre-LLM dedup gate (skip already-analyzed across runs)

Role: implementer. Architecture fixed by PM (Claude). Goal: stop paying LLM tokens to re-analyze items we already analyzed in a previous run. Kevin's words: "如果分析过了，比如看了标题发现已经有记忆了，就不要再分析了，节省 token 和时间。"

## PRINCIPLE (do not violate)
Skip is keyed on STABLE IDENTITY **and** "not materially changed". NEVER blind-skip — that would freeze content and break freshness/updates. Re-analyze ONLY when the item is new OR materially updated. Freshness comes from ADDING new items + surfacing updates, not from re-analyzing unchanged ones. Models already implement this pattern (version check) — mirror it.

## CURRENT STATE (audited by PM — re-verify before changing)
- **Models** ✅ already correct: `scripts/columns/models/daily.mjs` checks existing by id and only regenerates when `isNewOrChangedVersion`. Leave as the reference pattern.
- **Projects** ✅ deep tier correct: `scripts/columns/projects/sources.mjs` discover filters out repos already deep-dived in brief-wiki BEFORE the pipeline (`readBriefWikiDeepDivedProjectRepos`); confirmed by log "skipped N already deep-dived". GAP: the LIGHT tier may re-run the cheap LLM evaluate for already-seen-but-not-deep repos each run. Lower priority (cheap model) but worth a skip if a recent light analysis exists in the SQLite db / agent-memory and the repo's signals (stars bucket, pushed_at) are unchanged.
- **Papers** ⚠️ MAIN GAP: dedup is only WITHIN a run (source `seen` sets) and at PUBLISH merge (`dedupe-by-paper-id`). There is NO pre-analyze cross-run skip, so a paper already deep-analyzed in a prior run can be sent to the expensive analyze LLM again, then discarded at publish. Fix this.

## WHAT TO IMPLEMENT
1. **Audit precisely** how each column stores prior analyses (SQLite `data/ai-brief.db` analyses/runs tables, `data/agent-memory/*.json`, and published `articles-archive.json` / brief-wiki). Use the existing store; do NOT invent a new one.
2. **Add a pre-LLM skip in the papers pipeline**: before the `analyze` stage runs for a candidate, check whether a stored analysis already exists for that stable id (arxiv id / paper key) AND the paper version/updatedAt has not advanced. If so, REUSE the stored analysis (load from db/archive) instead of calling the LLM. Only analyze new or version-advanced papers. Make sure the reused analysis still flows through publish so the item stays visible.
3. **Projects light tier**: if a recent light analysis exists for a repo and its key signals are unchanged, reuse it instead of re-calling the cheap LLM. (Deep tier already gated — keep it.)
4. **Force/refresh override**: add a flag (e.g. `--force-reanalyze` / `options.forceReanalyze`, and an env like `FORCE_REANALYZE=1`) that bypasses the skip for intentional full re-runs. Default OFF.
5. **Logging/transparency**: log per column how many were skipped-as-already-analyzed vs analyzed-fresh (like the existing "skipped N already deep-dived" line), so we can see the savings.

## TESTS (scripts/__tests__/)
- papers: a candidate whose id already has a stored analysis + unchanged version → analyze LLM NOT called (mock the chatJson and assert call count 0), stored analysis reused and present in output.
- papers: a candidate with an advanced version → analyze IS called.
- projects light: unchanged repo → cheap LLM not called; changed signals → called.
- force flag bypasses skip.
- Keep all existing tests green (`npm test`).

## CONSTRAINTS
- Reuse existing identity keys (arxiv id, repo fullName lowercased dedupeKey, model id) — do not introduce new id schemes.
- Do not change happy-path output shape; skipped items must look identical to freshly-analyzed ones downstream.
- Do NOT commit; report files changed, skip logic per column, test results, and any deviation with reasoning.
- Only dispatch when no daily pipeline is running (PM will confirm).
