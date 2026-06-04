# Workorder: raise deep-dive analysis QUALITY via prompt/rubric (POINT-TO-POINT)

Role: implementer. PM (Claude) ran an independent COLD audit of 4 freshly generated project deep dives; avg quality 3.2/5 — not good enough for the L0 knowledge base Kevin + the future learning agent will learn from. Fix the GENERATION prompt/rubric so quality rises. Test point-to-point ONLY (Kevin's rule: no full radar runs while tuning).

## AUDIT FINDINGS (systemic weaknesses across all 4 deep dives)
1. **Citation hygiene (#1):** claims are sourced inside `claim_ledger`, but the flowing narrative prose (the body sections: at-a-glance, tech breakdown, value, risks) has almost NO inline source anchors. A reader can't verify a body claim without hunting the ledger.
2. **Overconfidence on undocumented features:** when the README/source does NOT document something, the analysis SPECULATES with "可能…" (maybe), creating false precision (e.g. agent-governance-toolkit's "四层特权环" and AiToEarn's agent-loop/state/sandbox were invented-ish). This violates the project's no-fabrication / grounding rule.
3. **Missing builder how-to:** none answer "if I wanted to BUILD something like this, what is the key abstraction/pattern to reuse?" in concrete terms. The audience is an applied-AI builder (AI PM/FDE/app dev) — analysis must serve "what this unlocks for building AI apps", not just describe.
4. **Third-party/platform risk underexplored:** when a project depends on external platforms/ecosystems, the "what breaks if that dependency changes" scenario is buried as a one-line risk instead of analyzed.

## CHANGES TO THE DEEP-DIVE PROMPT (scripts/columns/projects/deepdive-prompts.mjs, and prompts.mjs if relevant)
Encode these as explicit instructions/required fields in the project deep-dive system/user prompt:
1. **Inline source anchors in prose:** EVERY substantive factual claim in the narrative body must carry a short inline anchor to where in the source it came from, e.g. `（来源：README Key Features 表）` or `（来源：package.json deps）`. Not just in claim_ledger — in the body text the reader actually reads.
2. **Honest unknowns, ban speculation:** if the source does not document something, DO NOT write "可能…" guesses. Either omit it, or list it explicitly under a `unknowns` / `未知与待确认` field. Forbid presenting inferred internals as fact. Better to say "README 未说明" than to invent a mechanism.
3. **Builder reuse section:** require a concrete "如果我要造类似的东西，可复用的关键抽象/模式是什么" — name the specific pattern (e.g. "MCP tool-server pattern", "token-compression middleware") and what to copy vs. skip. Vague "可迁移经验" is not acceptable.
4. **Dependency/platform risk scenario:** if the project depends on third parties (a host ecosystem, social platforms, external APIs), require a short "what-if" — what concretely breaks and how exposed the project is.

Keep the existing strengths (claim_ledger plain_english two-layer style, project_verdict ratings, reasoning_trace). Do NOT bloat token usage gratuitously — these are quality redirects, not "write more".

## POINT-TO-POINT TEST (do NOT run full radar / daily)
- Extend the existing diag harness (scripts/columns/projects/__diag-deepdive-json.mjs) or add a sibling so it can regenerate deep dives for arbitrary named repos loaded from data/ai-brief.db.
- Regenerate ONLY these 2 (the audit's REVISE cases): `EveryInc/compound-engineering-plugin`? NO — use the two that were audited as REVISE: **`microsoft/agent-governance-toolkit`** and **`yikart/AiToEarn`** (owner names as stored in db; confirm against db).
- Write the regenerated deep dives so the PM can re-audit them (to brief-wiki or a clearly-labeled output dir — say which).
- Report: the prompt diff summary, the 2 regenerated outputs' locations, and confirm `npm test` still green.

## CONSTRAINTS
- 2 LLM regenerations max for the test. No full run.
- Backend lane is yours; spawn sub-agents if useful. Do NOT commit. Report concisely.
