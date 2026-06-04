# Workorder: deep-dive CONCRETENESS rework (medium vs high A/B) — point-to-point

Role: implementer. Kevin's sharpest critique: the deep dives are too ABSTRACT — "甚至不如把全文翻译放上去", "该具体的完全没有具体，只是草草地说了大致的框架". The last iterations over-rotated on faithfulness/attribution and the model learned to safely generalize. Fix: demand CONCRETENESS. Point-to-point test only; no full radar.

## THE REQUIREMENT (add to the deep-dive authoring prompt: deepdive-prompts.mjs / prompts.mjs used by codex-deepdive.mjs)
Every section must contain SPECIFIC, concrete detail extracted from the actual repo — NOT category labels or framework sketches:
1. **它怎么 work**: walk the REAL flow with a REAL example. Include the actual config/code: e.g. the actual policy.yaml rule text, the actual `govern(tool, policy)` call, the actual deny/allow path step-by-step. Forbid "它用一个策略引擎做拦截" without showing the concrete mechanism + a real example.
2. **关键主张与证据**: each claim must state the CONCRETE mechanism / number / example (what it literally does + the real figure), not "提供 X 能力" abstractions. Quote the real number/config/path.
3. Actively pull REAL snippets, config, commands, numbers, and file paths from README + source code + docs. The deep dive should read like someone who actually ran/read the code, not skimmed the README.
4. **Standard = "比全文翻译更有用":** keep ALL the concrete detail a raw translation would carry, PLUS organize + judge it. A section that gives only a framework/category with NO concrete example/number/snippet is a FAILURE — flag it in render_warnings.
5. CONCRETENESS MUST NOT REINTRODUCE FABRICATION: every concrete specific must be sourced (keep the 自称/已核实 attribution + inline 来源). Depth, not loosened grounding. If you can't find a concrete detail, say 未知 — don't invent one.

Keep the light-spine structure + attribution discipline already in place. This sharpens DEPTH within it.

## A/B TEST (point-to-point, codex authoring)
Author the AGT deep dive (`microsoft/agent-governance-toolkit`) with the new concreteness prompt at BOTH:
- `model_reasoning_effort=medium`
- `model_reasoning_effort=high`
Write each to a clearly-labeled dir (e.g. logs/deepdive-concreteness-ab/{medium,high}/). 2 codex calls. Report both output locations + your own quick read: does each section now carry concrete examples/config/numbers/steps, or still abstract? Which effort is concrete enough?

## CONSTRAINTS
- No full radar / daily. Backend lane; spawn sub-agents if useful. `npm test` stays green. Do NOT commit. Report concisely: prompt diff, both outputs, medium-vs-high concreteness read.
