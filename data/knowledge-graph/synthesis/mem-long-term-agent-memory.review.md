# Cold Adversarial Review — synth.mem.long-term-agent-memory

- **Reviewer role**: independent cold audit (did NOT author the synthesis).
- **Artifact**: `data/knowledge-graph/synthesis/mem-long-term-agent-memory.yaml` (status: draft)
- **Sources cross-checked**: agemem, mempalace, supermemory, memoryagentbench, rohitg00-agentmemory (`data/knowledge-graph/objects/*.yaml`)
- **Verdict**: **Holds with required fixes.** The fusion is honest and well-grounded on the big claims; it does not overclaim novelty and it correctly labels 自报 vs 实测. But two of the three `must_attack` questions expose real weaknesses the synthesis under-states, and there are 2 grounding defects to correct. Not a "break", but it needs revision before it ships as a "good method".

---

## 1. Grounding integrity

Spot-checked every capsule's numbers and every `fusion_hypothesis.layers[].from` against the cited source claims.

### What checks out (verified verbatim)
- **agemem capsule**: 41.96 vs 37.14 (Mem0) and 54.31 vs 45.74 (A-Mem) trace to `agemem.c1`. The "+8.5/+8.7pp from RL" traces to `agemem.c2` (33.43→41.96 = +8.53; 45.59→54.31 = +8.72 — arithmetic correct). "跨域未证 / relatively controlled" traces to `agemem.a1` and `c1.cannot_prove`. **Grounding sound.**
- **mempalace capsule**: R@5 96.6% raw traces to `mempalace.c1`; "默认 search 实为混合检索（非 raw 口径）" traces to `mempalace.c3`; "索引层有损 / 『纯逐字』是分层" traces to `mempalace.c4`. The fact_type split (机制=fact 实读源码 / R@5=author_claim) is correct. **Grounding sound and notably honest** — it does not let mempalace's headline 96.6% pass as the default-path number.
- **supermemory capsule**: version-chain field list (parentMemoryId/isLatest/forgetAfter) traces to `c2` (実読 fact); "hosted 黑箱、消解不可审计、#1 无复现代码" traces to `c3`, `f1`, `c1.cannot_prove`. The "[数据契约实读成立 / 引擎自报不可核验]" label is the most precise in the document. **Grounding sound.**
- **memoryagentbench capsule**: "无全能者 / Claude-3.7 49.6" traces to `c2`; "多跳 SF ≤7% 全行业" traces to `c2` evidence quote ("all methods fail ... at most 7%"); "含场景失配成分 f1" traces to `f1`. Labeled `[实测]` — correct, this is the one genuinely third-party-measured artifact in the set. **Grounding sound.**
- **fusion layers**: L0←rohitg00.m1, L1←mempalace.m1, L2←[rohitg00.m2, mempalace.m2], L3←supermemory.m1, L4←agemem.m1, L5←memoryagentbench.m1 — **all six `from` IDs resolve to real mechanisms in the sources, and each mechanism's `reusable_pattern` matches the `take` text.** No fabricated borrows.

### DEFECT G-1 (minor, must fix) — rohitg00 capsule under-grounds one of its two claims
The rohitg00 capsule Z_degree asserts **two** caveats: (a) "三路 R@10 58.0% 反低于两路 58.6%" and (b) "文档漂移（local 非真默认）". Its `grounding:` list ends in `rohitg00-agentmemory.f3`. In the source, (a) traces to **f3** ✓ but (b) "文档漂移 / local 非真默认" is **f1**, not f3. `f1` is missing from the grounding list. The claim is *true* (f1 exists and says exactly this), but the provenance pointer is wrong/incomplete. **Fix: add `rohitg00-agentmemory.f1` to that capsule's grounding.**

### DEFECT G-2 (minor, should fix) — `prop.*` IDs in capsules are unverifiable from the provided sources
Capsules cite `prop.memory-rule-vs-learned`, `prop.verbatim-vs-extraction`, `prop.retrieval-metrics-insufficient` in `N_related`. These propositions are referenced by the source objects too (e.g. mempalace.a3 conflicts_hint names `prop.retrieval-metrics-insufficient`), so they are plausibly real registry entries — but they were **not in the review set**, so I cannot confirm the proposition bodies actually say what the synthesis implies. Not a break; flag for the registry to confirm these 4 `prop.*` IDs exist and frame the axes as claimed. (No evidence they are wrong; only that they are un-cross-checked here.)

**Grounding verdict: the substantive numbers and borrows are honest and correctly labeled. One real provenance gap (G-1), one unverifiable-here pointer (G-2). No overstatement of any source's claim.**

---

## 2. The three `must_attack` questions

### MA-1 — "Does layering verbatim-base + evolution-layer truly avoid extraction-error poisoning, or just relocate supermemory.f1's black-box risk?"
**Finding: PARTIALLY — the synthesis over-claims resolution; it relocates the risk and reduces its blast radius, but does not eliminate it, and the yaml's own wording oversells this.**

The honest core is right: putting verbatim drawers (`mempalace.m1`) *underneath* the version chain means the original fact is always recoverable, so a bad supersede is **reversible** in a way `supermemory.f1` is not (in supermemory, "遗忘是降权/删除 ... 难回溯"). That is a genuine improvement. **But** the synthesis claims the layering makes the evolution layer "可审计" (auditable). Auditability of the *log* (you can see which supersede happened) is not the same as correctness of the *decision*. The thing that *decides* "I just moved to SF" supersedes "I live in NYC" is still an extraction/judgment step — `supermemory.a2` ("抽取的原子事实可信到能直接覆盖旧记忆") and `agemem.f3`/`a2` (LLM-as-judge bias) both show this decision is exactly where errors enter. Making it a `typed action` (L4) makes the decision *loggable and reversible*, not *correct*. So a wrong supersede still poisons the *latest/active* view and still drives the agent's behavior until someone catches it via the verbatim base. The synthesis's `composability` line ("两层互补") is fair; the `fusion_hypothesis.why` line ("**可审计的**事实版本链") is the overclaim. **Required fix: downgrade "可审计 ⇒ avoids poisoning" to "可审计+可回溯 ⇒ poisoning becomes detectable and reversible, but the supersede decision itself is still an error surface (supermemory.a2, agemem.f3)."**

### MA-2 — "'Rule-start, learning-later' optimistic given agemem.c2 says ~80% of gain from RL — would rule-only even clear a usable bar?"
**Finding: BREAKS the optimistic framing — this is the synthesis's weakest seam and it is materially understated.**

The synthesis (L4 `why`, `composability` bullet 2) leans hard on the claim that agemem's `noRL` ablation *is* the rule version of the typed interface, so "规则起步与学习升级在同一接口上兼容". The compatibility-of-interface argument is fine. The **performance** argument is not, and the synthesis half-buries it. From `agemem.c2`: noRL scores **33.43% (Qwen2.5) / 45.59% (Qwen3)**; with RL **41.96 / 54.31**. So RL is +8.53/+8.72pp — i.e. RL supplies roughly **20% of the absolute score**, not 80%. (The synthesis's own `must_attack` phrasing "增益 80% 来自 RL" is itself imprecise — that 80% is *of the gain over baseline*, not of total capability; the yaml should fix its own number.) The real problem is the other direction: **agemem's `noRL` 33.43% is itself BELOW the strongest modular baselines it claims to beat** — Mem0 37.14 (`agemem.c1`). In other words, *the rule-only version of agemem's interface loses to off-the-shelf Mem0.* So "rule-start is immediately usable" is doing a lot of work that the source actively contradicts: on agemem's own benchmark, the rule-only typed interface is the *worst* configuration, under the baseline. The synthesis never surfaces this. It is partly rescued by the fact that the *production* rule version isn't agemem-noRL — it's rohitg00's hand-tuned RRF stack, whose retrieval R@5 95.2% (`rohitg00.c4`) is strong — **but that is a retrieval number on a different benchmark, not an end-to-end agent score**, so it cannot be used to claim the rule-only *control policy* clears a usable bar. **Required fix: state explicitly that agemem-noRL (the rule version of agemem's own interface) underperforms Mem0 on agemem's benchmark (c1/c2), so "rule-start is usable" rests on rohitg00's *retrieval* competence, not on agemem's *control* competence — and those are not the same capability. Correct the "80%" figure.**

### MA-3 — "Five papers never shared a benchmark (different self-reported R@k). Is '取长补短' stitching incomparable local optima?"
**Finding: HOLDS — the synthesis is unusually disciplined here and largely pre-empts this attack.**

This is where the artifact is strongest. It does **not** stitch the R@k numbers together or pick a "winner" — it explicitly states the opposite: capsules carry per-source `[自报]`/`[实测]` tags; `boundaries_cannot_borrow` says "所有 R@k 均自报、口径不一、未独立复现——别当已核实 SOTA"; the human-layer `honest_boundaries` repeats it. Crucially, the fusion borrows **mechanisms** (typed-action interface, verbatim layer, RRF degradation, version-chain contract, 4-axis eval), **not scores** — and it imports MemoryAgentBench (`c2`, the one *实测* third-party benchmark) precisely as the *shared yardstick* to re-measure the stitched stack (`empirical_opportunity`). So the architecture is not claimed to inherit any source's local optimum; it is explicitly an *unvalidated hypothesis pending a single common benchmark*. The one residual risk: the stack is **never actually run on MAB's four axes** — `empirical_opportunity` is marked "机会层，非阻塞". That is honest, but it means the "取长补短" claim is currently *unfalsified*, not *validated*. Acceptable for status: draft; should be stated as the headline caveat. **No fix required beyond keeping `empirical_opportunity` from drifting into an implied result.**

---

## 3. Hidden contradictions

The synthesis itself names the one real axis-level contradiction: **mempalace.a1 ("保真优先、不抽取") vs supermemory.a2 ("抽取的事实可覆盖旧记忆")** (composability line, "唯一真张力"). I verified the attribution: mempalace.a1 and supermemory.a2 say exactly this. The proposed resolution — "分层（逐字底座不抽取 + 演化层只在指针/判断层抽取）" — **mostly holds but is partly hand-waving on one point**:

- It holds *structurally*: mempalace already proves the layering is internally consistent — `mempalace.c4` shows mempalace itself runs a *lossy* AAAK index layer over verbatim drawers, so "verbatim base + lossy/derived layer on top" is not a contradiction mempalace would reject; it is mempalace's own design. Good — the synthesis even cites this (`composability` bullet 1). So a1 is not violated by adding an abstraction layer *above* the verbatim base.
- It hand-waves on **what the agent acts on**. a1's spirit is not just "keep the bytes" — it is "宁可噪声大也不丢原文", i.e. *fidelity beats abstraction when they conflict*. supermemory.a2's spirit is "the abstracted fact is reliable enough to **supersede** (down-rank/hide) the old one". The moment the evolution layer marks something `isLatest=false` / `isForgotten`, the agent's *default reads* now favor the abstraction over the verbatim record — which is precisely the conflict a1 warns about, just moved to the retrieval-default level. The verbatim base is still *there* (so a1 is not literally broken), but the *operative* behavior tilts toward a2. **This is the same issue as MA-1.** "Layering resolves it" is true for *storage* and false for *what the agent retrieves by default*. **Required fix: same as MA-1 — say the layering resolves the *storage* contradiction but the *retrieval-default* tension (which layer wins when they disagree) remains a live design choice the synthesis has not settled.**

No *other* cross-layer contradiction found: agemem.m1 (typed action) and rohitg00.m1/m2 (rules) are genuinely compatible (rohitg00 = a fixed-rule fill of the same control surface; agemem-noRL confirms a rule version of the interface exists). MAB (eval) is implementation-independent and adds no contradiction.

---

## 4. Overclaim / novelty

**Finding: the novelty claim is FAIR-BUT-MODEST, and the synthesis honestly scopes it.** The `novelty` block does not claim a new mechanism — it claims "分层取长补短 + 把对立轴化解成同栈不同层，而非选边". That is accurate to what's here, and the framing-as-layered-stack is a legitimate contribution over any single source (none of the five proposes this composition). However, a tough skeptic should note: **the stack itself (verbatim store + version/edit layer + typed memory ops + hybrid degradable retrieval + an eval harness) is close to what a competent practitioner would assemble**, and several sources gesture at neighbors of it (memoryagentbench.c1 already frames memory as compression-over-verbatim; rohitg00's exam_question even proposes "hybrid controller: 固定采集地基 + 之上加可学习策略", which is essentially L0–L4). So the novelty is *integrative/curatorial*, not architectural. The yaml's wording ("新意在分层取长补短...而非选边") already says this and does **not** overreach into "novel architecture". Acceptable. **No fix required; optionally soften "新高光" → "整合性高光" to match the modest, integrative nature.**

---

## Overall verdict

**The synthesis holds up as a useful, honest "good method" at draft quality — it is well-grounded, correctly labels 自报 vs 实测, and pre-empts the incomparable-benchmark attack better than most. But it materially understates two weaknesses (MA-1/§3 and MA-2) and has one provenance defect.** It should NOT graduate from `draft` until the required fixes below are applied; with them, it is a sound, defensible recommendation.

### Required fixes (blocking graduation from draft)
1. **MA-2 / hardest seam — "rule-start is usable" is contradicted by the source.** State explicitly that agemem-noRL (the rule version of agemem's *own* typed interface) scores 33.43/45.59 (`c2`), **below Mem0's 37.14** (`c1`); therefore the "立即可用" claim rests on rohitg00's *retrieval* quality (R@5 95.2%, `c4`), which is a different capability from the *control policy*, and is itself only a single-benchmark 自报 number. Also correct the synthesis's own "增益 80% 来自 RL" to "RL adds ~+8.5/+8.7pp (≈20% of absolute score; ~80% of the gain *over baseline*)".
2. **MA-1 / §3 — downgrade the auditability claim.** Change "可审计的事实版本链 ⇒ avoids extraction-error poisoning" to "verbatim base makes a bad supersede **detectable and reversible** (vs supermemory.f1's irreversible black box), but the supersede *decision* (supermemory.a2 / agemem.f3) is still an error surface, and the agent's *default retrieval* tilts toward the abstraction once `isLatest=false` is set — so the a1↔a2 tension is resolved for *storage*, not for *what the agent reads by default*."
3. **G-1 — add `rohitg00-agentmemory.f1`** to the rohitg00 capsule grounding (the "文档漂移 / local 非真默认" caveat traces to f1, not the f3 currently listed).
4. **MA-3 / empirical status — make the headline caveat explicit:** the stitched stack has **never been run on MAB's four axes**; `empirical_opportunity` is unrun, so "取长补短" is currently an *unfalsified hypothesis*, not a validated result. Keep it from reading as if it has been measured.

### Should-fix (non-blocking)
5. **G-2** — confirm the four `prop.*` IDs (`memory-rule-vs-learned`, `verbatim-vs-extraction`, `retrieval-metrics-insufficient`) exist in the registry and say what the axes claim (not verifiable from the 5 objects alone).
6. Optionally reframe "新高光" as **integrative** highlight to match the (fair) modest novelty.

### What NOT to change (these are correct and load-bearing)
- The 自报 vs 实测 labeling across capsules — keep it; it is the artifact's strongest discipline.
- Refusing to stitch R@k numbers / pick a winner — keep it.
- `boundaries_cannot_borrow` (RL loop, hosted engine, FactConsolidation dataset, all-R@k-are-self-reported) — accurate and complete.
- Using MAB (`c2`, the one 实测 source) as the common yardstick — correct choice.
