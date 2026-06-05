# Cold-audit orchestrator — papers deep-read quality gate

Runtime orchestrator for the deep-read quality gate decided 2026-06-04 (Kevin).
Spec/rubric: [`docs/superpowers/specs/cold-audit-prompt.md`](../../../../docs/superpowers/specs/cold-audit-prompt.md).
Memory: `cold-audit-deepread-gate`, `quality-gate-double-review`, `multi-agent-doctrine`.

## The one rule it enforces: generator ≠ critic, CROSS-MODEL

A deep-read that audits its own work is worthless — a model rationalizes its own
hallucinations. So the two roles are split across **different models**:

| role | model | context | reads |
| --- | --- | --- | --- |
| **author** (作者) | **codex GPT-5.5, effort `high`** | authoring session | the **FULL** source (arXiv HTML / PDF + cloned repo) |
| **cold auditor** (冷审) | **Claude** | **FRESH, no generation history** | the artifact (Stage A), then full text + repo (Stage B) |

Only a *different model in a clean context* reliably catches the author's own
blind spots. Same-agent self-audit is **forbidden**.

## The loop

```
round 1..3:
  author(codex)  → authors (round 1) or revises per `fixes` (round >1)
  audit(Claude)  → two-stage cold audit → diagnosis JSON
  gate:
    no MAJOR gap            → PASS  → write ready-to-publish status (does NOT publish)
    MAJOR gap, round < 3    → REVISE→ feed fixes back to the author, loop
    MAJOR gap, round == 3   → HOLD  → alert + keep best-so-far, never publish
```

The two-stage audit (per the spec):

- **Stage A — 盲读 / blind comprehension.** Auditor sees **ONLY the analysis**, retells
  (problem / mechanism / evidence) and lists what it cannot follow. Honestly tests
  "can a student learn from this analysis alone." If the auditor reads the source first,
  this test is void.
- **Stage B — 开卷 / open-book faithfulness diff.** Now with full text + repo, diff the
  blind retell vs the source: wrong retell = taught wrong; missing = coverage gap;
  any claim the source doesn't support / any mismatched number = **fabrication (zero tolerance)**.

The 5 「透彻」criteria (any `major` blocks): `retellable`, `faithful`, `mechanism`,
`concrete`, `judgment`. A gap is **MAJOR** only if it misleads the reader or makes a
core element un-understandable; minor (nice-to-have) gaps never block. Cap at 3 rounds —
"宁可那天少一篇，不可带病进 L0 地基."

## Red-line: this orchestrator NEVER publishes

CLAUDE.md red line is "禁未过审内容自动落库/上线". On PASS it only writes a
`status.json` (`ready_to_publish`). **Wiring publish to that status is the caller's job**,
behind the async human-review surface. On HOLD it writes `alert.json` + fires a best-effort
desktop notification and keeps the best-so-far artifact unpublished. A **daily cap N**
(default 3) guards the codex/Claude quota from being silently burned.

## API (library-first)

```js
import {
  runColdAuditGate, runBatch,
  makeCodexAuthorFn, makeClaudeAuditFn,   // REAL seams (shell out)
  makeMockAuthorFn, makeMockAuditFn,      // test seams
} from "./orchestrator.mjs";

// one paper
const result = await runColdAuditGate(paper, { authorFn, auditFn, loadSource });
//   result.status ∈ { ready_to_publish, hold }

// daily batch (cap + status/alert/digest files)
const batch = await runBatch(papers, { authorFn, auditFn, dailyCap: 3 });
```

Outputs (under `logs/papers-cold-audit/`):
`<id>/status.json`, `<id>/diagnosis.json`, `<id>/alert.json` (HOLD only),
and `digest-<date>.md` (pass / hold / needs-human + skipped-over-cap).

## The seams — `authorFn` and `auditFn` are injectable

Both are injected so the loop / gate / hold logic is **fully unit-tested without any CLI**
(see `orchestrator.test.mjs`, 13 cases). The real implementations shell out; the mock
implementations drive the tests.

### What the PM must wire before going live

The real seams need a **prompt builder** each (the orchestrator does not hardcode prompts —
those are paradigm content the PM/codex owns). Wire:

1. **`buildPrompt(paper, { round, fixes, prevArtifact })`** for `makeCodexAuthorFn`.
   Round 1 = author from full source (reuse the paradigm prompt in
   `scripts/columns/papers/codex-deepdive.mjs` `buildCodexAuthorPrompt`). Round > 1 = embed
   the auditor's `fixes` and `prevArtifact` and instruct a targeted revise (do not rewrite
   wholesale). MUST instruct codex to read the FULL source.

2. **`buildAuditPrompt(artifact, source, { round, paper })`** for `makeClaudeAuditFn`.
   MUST: (a) forbid reusing any author context; (b) gate Stage B behind Stage A so the blind
   retell is honest; (c) demand **strict JSON only** matching the diagnosis schema below;
   (d) reference the rubric + the DRIFT gold sample
   (`content/papers/2606.02060-drift-agent-error-localization/`).

3. Confirm the CLI command strings below run on Kevin's machine, then add the npm script
   (the PM wires `package.json` after review — **this deliverable does not touch it**).

### Intended CLI command strings

**Author (codex)** — mirrors `codex-deepdive.mjs`; Windows OS sandbox is broken
(`deploy-update-flow` memory) so it must bypass:

```
codex exec -c model_reasoning_effort="high" -m gpt-5.5 \
  --dangerously-bypass-approvals-and-sandbox \
  -C <ROOT> --color never \
  --output-last-message logs/papers-cold-audit/<id>/round-<n>/codex-last-message.json -
# prompt piped on stdin; output = the deep-read artifact JSON (last message)
```

On Windows, `makeCodexAuthorFn` resolves codex via `node <APPDATA>\npm\...\@openai\codex\bin\codex.js`
(same trick as `codex-deepdive.mjs resolveCodexCommand`).

**Cold auditor (Claude)** — fresh headless context, JSON output:

```
claude -p "<two-stage cold-audit prompt>" --output-format json
# -p = headless print; envelope { result: "<text>" }; the auditor text is the diagnosis JSON
```

> Cross-model is the whole point: the auditor is a **different model** (Claude) than the
> author (codex). Do not collapse them onto one model.

### Diagnosis schema the auditor must return

```json
{
  "stageA": { "retell": "...", "confusions": ["..."] },
  "stageB": { "faithful": true, "notes": "..." },
  "perCriterion": [
    { "criterion": "retellable|faithful|mechanism|concrete|judgment",
      "severity": "major|minor|none", "gap": "...", "fix": "在哪个文件/小节补什么，引到原文哪处" }
  ],
  "verdict": "pass|revise|hold"
}
```

The gate keys off `severity:"major"` (not the self-labeled `verdict`) — so the decision stays
honest even if the auditor mislabels. `normalizeDiagnosis` backfills any missing criterion as
`none` and keeps extras.

## Tests

```
node --test scripts/columns/papers/cold-audit/orchestrator.test.mjs
```

Covers: pass-on-first-audit, revise-then-pass (fixes fed back), hold-after-3-fails
(best-so-far retained), daily-cap enforcement, major-vs-minor gating, mislabeled-verdict
override, HOLD alert/notify (+ non-fatal notifier failure), and status/alert/digest file output.
All seams mocked — **no real CLI is invoked.**

## Daily wiring — `run-daily.mjs` + `seams.mjs`

The gate is wired into the daily deep-read flow by two new files:

- **`seams.mjs`** — the previously-stubbed prompt builders + source loader, now implemented as
  PURE string/object builders (no CLI spend):
  - `buildPrompt(paper, { round, fixes, prevArtifact })` — codex author (round 1 = full-source
    authoring per `daily-deepread-prompt.md`) / revise (round > 1 = targeted fixes-only, embeds the
    auditor `fixes` + prev artifact, forbids wholesale rewrite). Names the repo to clone + the gold sample.
  - `buildAuditPrompt(artifact, source, { round, paper })` — the two-stage cold-audit prompt:
    forbids reusing author context, instructs blind Stage A before open-book Stage B, demands strict
    JSON matching the diagnosis schema, references the 5 criteria + the DRIFT gold sample, and tells
    the auditor the gate keys off `severity:"major"` (not the `verdict` label).
  - `loadSource(paper)` — fetches full text via `sources.mjs` `fetchFullPaperText` (+ repo URL) for
    Stage B, capped to a token budget; fetch failure → `available:false` + an honest "数据不足" note
    (never throws, never lets the auditor fabricate).
  - `loadArtifact(contentDir)` — reads the on-disk `paper.mdx` + `career.mdx` + `metadata.json`
    (the Stage-A artifact).

- **`run-daily.mjs`** — the daily entrypoint:
  - **Selection (`selectUnaudited`, pure + unit-tested):** a deep-read is audited iff
    `metadata.status === "deep_read"` AND it has **no terminal `cold_audit` state**. Terminal states
    `grandfathered` / `ready_to_publish` / `hold` are **skipped**. Result is capped at `dailyCap`
    (default 3); the overflow rolls to the next run. An unknown/garbage `cold_audit` state is treated
    as still-unaudited (defensive, never silently skips).
  - **Grandfathering:** `--grandfather` runs ONCE before going live to stamp every existing
    un-audited `deep_read` as `cold_audit.status="grandfathered"` — this is how Kevin's "do NOT
    retro-audit existing deep-reads" is enforced. After seeding, only deep-reads authored afterwards
    (no `cold_audit` field) are picked up.
  - **Run:** scans the corpus → selects → maps records to `paper` descriptors → `runBatch` with the
    real codex/claude seams (or injected mocks) → on PASS flips `metadata.cold_audit.status` to
    `ready_to_publish`, on HOLD to `hold` (+ the orchestrator's alert/digest). The auditFn is wrapped
    so the auditor always reads the **on-disk artifact** (Stage A) for the paper under audit.
  - **`--dry-run`** prints the selection (audit / overflow / grandfathered / already-audited) with
    NO CLI invoked.

### The hook into the daily flow (where the PM wires it)

`run-daily.mjs` runs as a **separate stage AFTER** `papers:deepread` authors the files and BEFORE
`build-index.mjs` treats them as published. **No edit to `daily.mjs` or `codex-deepdive.mjs` was
made** (those drive a different, older articles.json path; the live deep-read corpus is the
file-based `content/papers/<slug>/` written by the `papers:deepread` claude prompt). The PM wires:

1. An npm script, e.g. `"papers:cold-audit": "node scripts/columns/papers/cold-audit/run-daily.mjs"`,
   run in the boot pipeline **between** `papers:deepread` and `build-index` (this deliverable does
   NOT touch `package.json`).
2. Run `node scripts/columns/papers/cold-audit/run-daily.mjs --grandfather` ONCE before the first
   live run (the existing ~10 deep-reads currently have no `cold_audit` field and would otherwise be
   selected — see `--dry-run` output).
3. (Optional, separate) a one-line filter in `build-index.mjs` `collectDeepReads` to only publish
   deep-reads whose `metadata.cold_audit.status !== "hold"` (or require `=== "ready_to_publish"`),
   so HOLDs stay out of the public index. **Left to the PM** — the runner only writes the status,
   honoring the red line that this code never publishes.

## Status / next steps

- Implemented: the full author→audit→revise loop, 3-round hold, daily cap, status/alert/digest
  files, desktop notify (PowerShell `msg`), real codex/claude shell-out seams, mock seams, tests
  **+ the daily entrypoint (`run-daily.mjs`) and the prompt-builder/source seams (`seams.mjs`)**.
- **Still stubbed (PM to wire, deliberately):** the `package.json` npm script + boot-pipeline order,
  the one-time `--grandfather` run, and the optional `build-index` publish filter. Heavy repo-clone
  for Stage B is referenced by URL (codex clones during authoring); the auditor diffs claims against
  the full text + repo URL.
- Will itself be **cross-reviewed by codex** before wiring (same generator ≠ critic principle).
