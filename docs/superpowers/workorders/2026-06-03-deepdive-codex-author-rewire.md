# Workorder: rewire project deep-dive authoring to codex GPT-5.5 (medium) + light-spine schema

Role: implementer. Architecture fixed by PM. This changes HOW deep dives are authored (model + format). Point-to-point test only — NO full radar run. Do NOT commit.

## DECISIONS (locked with Kevin 2026-06-03)
- Deep-dive analysis = authored by **codex GPT-5.5 at `model_reasoning_effort=medium`** (headless), NOT DeepSeek API. Rationale + A/B evidence: see memory; medium cleared the faithfulness bar on the AGT trap, saves quota vs high/xhigh.
- Cheap layers (discover / triage / light / radar ranking / model version-check) STAY on DeepSeek, run locally.
- Deep-dive FORMAT = **light common spine + free-form body**, with HARD quality principles (do not relax these): traceability (inline 来源 anchors), no-fabrication (attribute README/marketing as "自称" vs "已核实", exact numbers, undocumented → 未知, no speculation-as-fact), plain-language two-layer, concrete builder-reuse.
- Light spine sections (stable data contract for renderer + future learning agent): 一句话 / 为什么值得看 / 关键主张与证据(每条: claim + plain_english + 来源 + 自称|已核实 + evidence_strength) / 它怎么work / 复用什么抽象 / 依赖平台风险 / 未知与待确认 / 判断(action + ratings{相关度,工程深度,复用价值,成熟度}). The body under each is free-form Chinese sized to the material — no padding.

## INTEGRATION (you choose the cleanest shape, then explain it)
The deep-dive authoring must invoke codex (e.g. `codex exec -c model_reasoning_effort="medium" -m gpt-5.5 --sandbox danger-full-access`) and let the model AUTONOMOUSLY read the real repo (README + deeper docs/ — the whole point: it gathers its own evidence, not just the enrichment README). Two viable shapes — pick one, justify:
  (A) Decouple: keep the DeepSeek pipeline producing candidates/evidence/light/radar + publishing trending.json; add a SEPARATE codex-driven deep-dive authoring pass that runs for new deep-tier candidates, writes brief-wiki + back-fills briefSlug into trending.json. (Likely cleaner.)
  (B) In-pipeline: the analyze stage shells out to codex for deep tier.
Prefer (A) decoupling unless (B) is clearly simpler. Keep the existing resilience (per-item isolation), dedup skip (already-deep-dived repos skipped), and fallback (failed → needs_enrichment, honest).

## OUTPUT SCHEMA
Emit the light-spine fields above as structured data the frontend can render (JSON/frontmatter), PLUS the free-form body markdown per section. Keep it parseable but do not force rigid sub-field counts. Preserve briefSlug wiring into trending.json.

## POINT-TO-POINT TEST (NO full radar)
- Author deep dives for 2 repos via the new codex path: `microsoft/agent-governance-toolkit` and one fresh project from today's run (your pick from data/ai-brief.db deep candidates).
- Show the outputs (file locations) for PM cold-audit.
- Confirm: codex was invoked at medium; outputs follow the light spine; attribution discipline present (自称 vs 已核实); briefSlug wiring intact.
- `npm test` still green.

## CONSTRAINTS
- 2-3 codex authoring calls max for the test. No full daily. No commit.
- Backend lane; spawn sub-agents if useful. Report: integration shape chosen + why, files changed, test outputs, npm test result, deviations.
