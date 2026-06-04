# Workorder: deep-dive FAITHFULNESS fix (attribution + number discipline + unknowns-constrains-body)

Role: implementer. PM ran a 2nd independent cold audit on the regenerated deep dives. Traceability/clarity/builder-angle improved, but **Faithfulness dropped to 2/5** due to 3 specific, prompt-addressable problems. Fix the generation prompt + add render guards. Point-to-point test only (no full radar).

## THE 3 PROBLEMS (with audit evidence)
1. **Treats README marketing/badges as established fact.** Example: agent-governance-toolkit deep-dive says "覆盖 10/10 OWASP Agentic Top 10"; the repo's own docs/compliance doc shows reality = ASI framework, 8/11 FULL + 3/11 PARTIAL. The README badge self-claims "10/10"; the deep-dive repeated it as fact.
2. **Invents precise numbers.** Example: aitoearn deep-dive says "14 个平台"; README actually says "10+" and explicitly lists 13.
3. **`unknowns` section is honest but the BODY ignores it** — states undocumented internals as fact (e.g. "四个特权环沙箱", "通过浏览器插件实现自动点赞") while `unknowns` simultaneously says these are未说明. Self-contradiction.

## PROMPT CHANGES (scripts/columns/projects/deepdive-prompts.mjs / prompts.mjs)
1. **Attribution discipline:** any claim sourced from the README/marketing/badges (especially coverage %, "supports N", benchmarks, superlatives) MUST be framed as attribution, not fact — e.g. "README 自称覆盖 10/10 OWASP" / "README 声称比 Whisper 快 170x"，NOT "覆盖 10/10" / "快 170x". The reader must be able to tell "the project claims this" from "this is verified".
2. **Number discipline:** NEVER invent, round up, or infer a count/metric. Quote the source's exact wording. If the README says "10+" and lists 13, write "README 称 10+，实际列出 13 个"，never "14 个". If unsure, use "约/至少" + cite.
3. **Unknowns must constrain the body (HARD RULE):** if something is in `unknowns`, the narrative body MUST NOT assert it as fact. It must hedge ("README 未说明其实现，推测…") or be omitted. The body and `unknowns` may not contradict. Prefer "未说明" over confident invention every time.
4. **Render/lint guard:** add a deterministic check that scans the rendered body for high-risk unattributed patterns — bare coverage/percent/superlative claims without a 来源/自称 marker, and any term that also appears in `unknowns` being asserted without a hedge — and emit a warning (or downgrade) so we can see violations. Keep it conservative (warn, don't silently rewrite).

Do NOT remove the earlier improvements (inline anchors, builder_reuse, dependency_platform_risk, unknowns). This sharpens them toward honesty.

## POINT-TO-POINT TEST (no full radar)
- Regenerate the SAME 2 repos via the existing harness: `microsoft/agent-governance-toolkit`, `yikart/AiToEarn`. Max 2 LLM completions.
- Write outputs to a clearly labeled dir (e.g. logs/deepdive-faithfulness-p2p/) so the PM can re-audit.
- Report: prompt diff summary, output locations, `npm test` still green, and self-check: does the new AGT output now say "README 自称 10/10" (attributed) and does AiToEarn avoid the invented "14"?

## CONSTRAINTS
- 2 regenerations max. No full daily. Backend lane; spawn sub-agents if useful. Do NOT commit. Report concisely.
