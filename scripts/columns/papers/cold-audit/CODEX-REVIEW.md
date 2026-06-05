# Cold-audit — Codex cross-review checklist

Cross-review commissioned per the multi-agent-doctrine: generator (Claude) ≠ critic (codex).
Reviewer sees: this artifact + the source files + the rubric below. No generation context shared.

---

## 1. CLI command strings (Windows correctness)

**Author (codex) — `makeCodexAuthorFn` in `orchestrator.mjs` lines 314-329:**

```
node %APPDATA%\npm\node_modules\@openai\codex\bin\codex.js \
  exec -c model_reasoning_effort="high" -m gpt-5.5 \
  --dangerously-bypass-approvals-and-sandbox \
  -C <ROOT> --color never \
  --output-last-message logs/papers-cold-audit/<id>/round-<n>/codex-last-message.json \
  -
# prompt piped on stdin
```

Verify:
- [ ] `resolveCodexCommand` (orchestrator.mjs line 558-564) resolves the `codex.js` path via
  `%APPDATA%\npm\node_modules\@openai\codex\bin\codex.js` on Windows — confirm this path is
  correct on Kevin's machine (run `where codex` or check `%APPDATA%\npm`).
- [ ] `--dangerously-bypass-approvals-and-sandbox` is accepted by the codex version installed
  (mirrors `codex-deepdive.mjs`; if that script works, this one should too).
- [ ] `--output-last-message <path>` is accepted and writes the last message to the path as JSON.
- [ ] Prompt piped on stdin (`-` final arg) is received by codex (not dropped on Windows PowerShell).

**Auditor (Claude) — `makeClaudeAuditFn` in `orchestrator.mjs` line 372:**

```
claude -p "<two-stage cold-audit prompt>" --output-format json
```

Verify:
- [ ] `claude` is on the PATH on Kevin's Windows machine (or confirm where it resolves).
- [ ] `--output-format json` produces an envelope `{ "result": "<text>", ... }` — the unwrap logic
  in `makeClaudeAuditFn` (lines 380-382) reads `envelope.result` and re-parses it as JSON.
  Confirm the envelope shape matches the installed claude CLI version.
- [ ] The `-p` flag runs in headless print mode (no interactive prompt, exits after one turn).

---

## 2. `buildAuditPrompt`: blind Stage A before open-book Stage B (seams.mjs)

Check `buildAuditPrompt` in `seams.mjs`:

- [ ] The prompt presents the artifact to the auditor FIRST, before any mention of the full source.
  Stage A ("盲读") requires the auditor writes its retell and lists confusions using ONLY the
  artifact — if the source is shown first, Stage A is void (auditor already knows the ground truth).
- [ ] Stage B ("开卷") opens the full-text + repo and asks the auditor to diff its Stage A retell
  against the source. The prompt must make Stage B CONDITIONAL on Stage A being complete.
- [ ] The prompt demands strict JSON only matching the diagnosis schema
  `{ stageA, stageB, perCriterion:[{criterion,severity,gap,fix}], verdict }` — no prose outside
  the JSON, so `makeClaudeAuditFn` can parse without guessing.
- [ ] Zero-fabrication is explicitly instructed in the same prompt call (not in a separate system
  message the auditor might not see): any claim the source does not support = fabrication, any
  mismatched number = fabrication, both at zero tolerance.
- [ ] Both Stage A blind-read and zero-fabrication enforcement are in ONE model call (not split
  across two calls where the model might re-read earlier context between them).

---

## 3. Grandfather / selection contract (run-daily.mjs)

Check `grandfatherExisting` (lines 206-220) and `selectUnaudited` (lines 59-95):

- [ ] `grandfatherExisting` only marks records where `metadata.status === "deep_read"` AND
  `metadata.cold_audit?.status` is absent/falsy — it leaves already-terminal records untouched.
  Idempotent: running `--grandfather` twice changes nothing the second time.
- [ ] `selectUnaudited` skips a record if `cold_audit.status` is any member of `TERMINAL_STATES`
  (`grandfathered`, `ready_to_publish`, `hold`). An unknown/garbage state (e.g. `"pending"`) is
  NOT in `TERMINAL_STATES` and is therefore treated as still-unaudited — confirm this defensive
  behavior is intentional (it is: never silently drop a paper).
- [ ] After the grandfather run (verified 2026-06-05): all 10 existing deep-reads have
  `cold_audit.status === "grandfathered"`. A subsequent `--dry-run` shows 0 would-audit,
  10 grandfathered. Only deep-reads authored after the grandfather pass (no `cold_audit` field)
  will be selected.

---

## 4. `auditFn` always loads the on-disk artifact (run-daily.mjs)

Check the `auditFn` wrapper inside `runDaily` (lines 281-291):

- [ ] The wrapper calls `loadArtifactFn(rec.contentDir)` and passes the result to `auditFn` as
  `toAudit`, replacing (or supplementing) whatever `artifact` the `authorFn` returned.
  This ensures Stage A always reads the committed on-disk deep-read (`paper.mdx`, `career.mdx`,
  `metadata.json`), not an ephemeral in-memory handle that the authorFn returned.
- [ ] If `loadArtifactFn` throws (e.g. missing file), the wrapper falls back to `artifact`
  from the authorFn — it does NOT propagate the error or silently audit empty content.
  Confirm the catch-and-fallback on line 287 is correct: `toAudit = artifact`.
- [ ] `deps.preloadArtifact !== false` guard: setting `preloadArtifact: false` in deps disables the
  override (test escape hatch). Confirm no production caller sets this flag.

---

## 5. `build-index` publish filter for HOLDs

The orchestrator writes `metadata.cold_audit.status` but never publishes. The remaining open
question is whether `build-index.mjs` hard-filters HOLDs from the public index.

Current state (deliberate stub — PM to wire):
- [ ] Confirm `build-index.mjs` `collectDeepReads` does NOT yet filter on `cold_audit.status`.
  Papers with `status: "hold"` would appear in the public index if indexed. Since no paper has
  been through the gate yet (all existing are grandfathered), this is safe today.
- [ ] Recommended one-line filter in `collectDeepReads`:
  ```js
  // Only publish papers that are not held by the cold-audit gate.
  if (meta.cold_audit?.status === "hold") continue;
  ```
  Alternatively require `=== "ready_to_publish"` (stricter — also blocks grandfathered from the
  index; use this only if Kevin wants the index to be explicitly gate-aware).
- [ ] Decision: use the permissive filter (skip HOLD only) so grandfathered papers remain
  published without re-auditing. Document the decision here when wired.

---

## Daily / boot pipeline slot

`papers:cold-audit` runs as a SEPARATE stage, **between `papers:deepread` and `build-index`**:

```
papers:hf          # discover + curate candidates (HF → ledger)
  ↓
papers:deepread    # Claude authors deep-reads into content/papers/<slug>/
  ↓
papers:cold-audit  # NEW: gate each new deep-read (no cold_audit state) through codex→Claude loop
                   #      PASS → metadata.cold_audit.status = "ready_to_publish"
                   #      HOLD → metadata.cold_audit.status = "hold" + alert, NOT published
  ↓
build-index        # collects content/papers/**/metadata.json → public/data/papers-index.json
                   # (optionally: filter out status="hold" here — see checklist item 5)
  ↓
validate           # lint + schema checks
```

npm scripts wired (2026-06-05):
- `papers:cold-audit`            → `node --no-warnings scripts/columns/papers/cold-audit/run-daily.mjs`
- `papers:cold-audit:grandfather`→ `node --no-warnings scripts/columns/papers/cold-audit/run-daily.mjs --grandfather`

The `--grandfather` script was run ONCE on 2026-06-05 and stamped all 10 existing deep-reads.
It must NOT be run again unless explicitly authorised by Kevin (idempotent, but needlessly noisy).

Daily cap default = 3 (configurable via `--cap N`). On a boot where `papers:deepread` authors
more than 3 new deep-reads, the overflow is automatically deferred to the next run.

---

## What is deliberately out of scope for codex review

- The prompt content inside `buildPrompt` / `buildAuditPrompt` (paradigm content, PM owns).
- The `publish` wiring (the red line: this code never publishes; caller wires it).
- The `build-index` filter (stub, PM to wire — see item 5 above).
