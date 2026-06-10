// Unit tests for the cold-audit orchestrator. Mock author/audit fns ONLY — no real CLIs.
// Run: node --test scripts/columns/papers/cold-audit/orchestrator.test.mjs

import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  CRITERIA,
  MAX_ROUNDS,
  auditArxivReferences,
  collectFixes,
  decideOutcome,
  extractArxivIdsFromArtifact,
  hasMajorGap,
  isUntrustworthyDiagnosis,
  localArxivIdSuspicion,
  majorDiagnosis,
  makeClaudeAuditFn,
  makeMockAuditFn,
  makeMockAuthorFn,
  minorDiagnosis,
  normalizeDiagnosis,
  passDiagnosis,
  runBatch,
  runColdAuditGate,
} from "./orchestrator.mjs";
import { buildStageAPrompt, buildStageBPrompt } from "./seams.mjs";

const PAPER = { arxivId: "2606.02060", title: "DRIFT span-level error localization" };

// ---- pure gate logic -------------------------------------------------------

test("hasMajorGap: malformed/degenerate diagnosis is treated as blocking", () => {
  assert.equal(hasMajorGap(null), true);
  // empty/missing perCriterion is now UNTRUSTWORTHY → blocking (a degenerate audit must not pass).
  assert.equal(hasMajorGap({}), true);
  assert.equal(hasMajorGap({ perCriterion: [] }), true);
  assert.equal(hasMajorGap(passDiagnosis()), false);
  assert.equal(hasMajorGap(majorDiagnosis()), true);
  assert.equal(hasMajorGap(minorDiagnosis()), false);
});

test("isUntrustworthyDiagnosis: empty/partial perCriterion → untrustworthy, full set → trusted", () => {
  assert.equal(isUntrustworthyDiagnosis(null), true);
  assert.equal(isUntrustworthyDiagnosis({}), true);
  assert.equal(isUntrustworthyDiagnosis({ perCriterion: [] }), true);
  // only 2 of the 5 required criteria → still untrustworthy.
  assert.equal(
    isUntrustworthyDiagnosis({
      perCriterion: [
        { criterion: "retellable", severity: "none" },
        { criterion: "faithful", severity: "none" },
      ],
    }),
    true,
  );
  // all 5 present → trusted.
  assert.equal(isUntrustworthyDiagnosis(passDiagnosis()), false);
});

test("gate HOLDS a malformed-but-parseable audit (missing criteria) — never passes", async () => {
  // A degenerate response with an empty perCriterion would, pre-fix, read as "no major gap → pass".
  // Now it must HOLD (after exhausting rounds) instead of slipping through.
  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a1" }, { v: "a2" }, { v: "a3" }] });
  const auditFn = makeMockAuditFn({ audit: () => ({ stageA: {}, stageB: {}, perCriterion: [] }) });

  const out = await runColdAuditGate(PAPER, { authorFn, auditFn, logger: silent() });
  assert.equal(out.status, "hold", "empty perCriterion must not pass the gate");
  assert.equal(out.rounds, MAX_ROUNDS);
});

test("gate HOLDS when only a subset of the 5 criteria is returned", async () => {
  const partial = {
    stageA: { retell: "x" },
    stageB: { faithful: true },
    perCriterion: [
      { criterion: "retellable", severity: "none" },
      { criterion: "faithful", severity: "none" },
    ],
    verdict: "pass",
  };
  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a1" }, { v: "a2" }, { v: "a3" }] });
  const auditFn = makeMockAuditFn({ audit: () => partial });

  const out = await runColdAuditGate(PAPER, { authorFn, auditFn, logger: silent() });
  assert.equal(out.status, "hold", "subset-of-criteria audit must not pass the gate");
});

test("decideOutcome: major-vs-minor gating + round exhaustion", () => {
  // minor gap never blocks → pass
  assert.equal(decideOutcome(minorDiagnosis(), 1), "pass");
  // clean → pass
  assert.equal(decideOutcome(passDiagnosis(), 1), "pass");
  // major gap with rounds remaining → revise
  assert.equal(decideOutcome(majorDiagnosis(), 1), "revise");
  assert.equal(decideOutcome(majorDiagnosis(), 2), "revise");
  // major gap at the final round → hold
  assert.equal(decideOutcome(majorDiagnosis(), MAX_ROUNDS), "hold");
});

test("collectFixes: pulls major-gap fixes and dedupes", () => {
  const d = normalizeDiagnosis({
    perCriterion: [
      { criterion: "faithful", severity: "major", gap: "fabricated 92%", fix: "remove the number" },
      { criterion: "concrete", severity: "minor", gap: "x", fix: "skip me" },
    ],
    fixes: ["补 TELBench 加密发布事实"],
  });
  const fixes = collectFixes(d);
  assert.ok(fixes.some((f) => f.includes("[faithful]")));
  assert.ok(fixes.some((f) => f.includes("remove the number")));
  assert.ok(fixes.some((f) => f.includes("TELBench")));
  // minor fix must NOT be pulled
  assert.ok(!fixes.some((f) => f.includes("skip me")));
});

// ---- arXiv citation verification ------------------------------------------

test("extractArxivIdsFromArtifact: scans deep-read text fields only", () => {
  const ids = extractArxivIdsFromArtifact({
    paperMdx: "引用 2606.02060 和 arXiv:2601.19290v2。",
    careerMdx: "另一个 2603.02701。",
    paper: "9999.00001", // thin author handles are not deep-read citation text.
  });
  assert.deepEqual(ids, ["2601.19290v2", "2603.02701", "2606.02060"]);
});

test("localArxivIdSuspicion: future arXiv month is suspicious", () => {
  assert.deepEqual(localArxivIdSuspicion("2612.12345", new Date("2026-06-08T00:00:00Z")), {
    suspicious: true,
    reason: "future_arxiv_month",
  });
  assert.equal(localArxivIdSuspicion("2606.02060", new Date("2026-06-08T00:00:00Z")).suspicious, false);
});

test("auditArxivReferences: suspicious/future arXiv ID is downgraded to 推断/待核", async () => {
  const audit = await auditArxivReferences(
    { paperMdx: "这段深读前向引用了 2612.12345，并且还引用了 2606.02060。" },
    {
      now: () => new Date("2026-06-08T00:00:00Z"),
      resolveArxivId: async (id) => ({ resolvable: id === "2606.02060", reason: id === "2606.02060" ? "" : "no_entry" }),
      logger: silent(),
    },
  );
  assert.equal(audit.checkedCount, 2);
  assert.equal(audit.unresolved.length, 1);
  assert.equal(audit.unresolved[0].id, "2612.12345");
  assert.equal(audit.unresolved[0].downgradeLabel, "推断/待核");
  assert.match(audit.unresolved[0].downgradedCitation, /推断\/待核/);
});

test("runColdAuditGate: arXiv citation audit is attached to the cold-audit report", async () => {
  const authorFn = makeMockAuthorFn({ artifacts: [{ paperMdx: "可疑引用 2612.12345", careerMdx: "" }] });
  const auditFn = makeMockAuditFn({ diagnoses: [passDiagnosis()] });

  const out = await runColdAuditGate(PAPER, {
    authorFn,
    auditFn,
    logger: silent(),
    now: () => new Date("2026-06-08T00:00:00Z"),
  });

  assert.equal(out.status, "ready_to_publish");
  assert.equal(out.finalDiagnosis.arxivCitationAudit.unresolved[0].id, "2612.12345");
  assert.equal(out.finalDiagnosis.arxivCitationAudit.unresolved[0].downgradeLabel, "推断/待核");
});

// ---- single-paper loop -----------------------------------------------------

test("pass on first audit: 1 round, ready_to_publish", async () => {
  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a1" }] });
  const auditFn = makeMockAuditFn({ diagnoses: [passDiagnosis()] });

  const out = await runColdAuditGate(PAPER, { authorFn, auditFn, logger: silent() });

  assert.equal(out.status, "ready_to_publish");
  assert.equal(out.rounds, 1);
  assert.equal(authorFn.calls.length, 1);
  assert.equal(auditFn.calls.length, 1);
  assert.equal(out.history[0].outcome, "pass");
});

test("revise then pass: 2 rounds, fixes fed back to author", async () => {
  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a1" }, { v: "a2" }] });
  const auditFn = makeMockAuditFn({
    diagnoses: [majorDiagnosis("faithful", "fabricated 92%", "remove it"), passDiagnosis()],
  });

  const out = await runColdAuditGate(PAPER, { authorFn, auditFn, logger: silent() });

  assert.equal(out.status, "ready_to_publish");
  assert.equal(out.rounds, 2);
  assert.equal(authorFn.calls.length, 2);
  // round 2 author call must have received the fixes from round-1 audit
  const round2Ctx = authorFn.calls[1].ctx;
  assert.equal(round2Ctx.round, 2);
  assert.ok(round2Ctx.fixes.some((f) => f.includes("remove it")));
  assert.deepEqual(
    out.history.map((h) => h.outcome),
    ["revise", "pass"],
  );
});

test("hold after 3 failed audits: never publishes, keeps best-so-far", async () => {
  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a1" }, { v: "a2" }, { v: "a3" }] });
  const auditFn = makeMockAuditFn({
    diagnoses: [majorDiagnosis(), majorDiagnosis(), majorDiagnosis()],
  });

  const out = await runColdAuditGate(PAPER, { authorFn, auditFn, logger: silent() });

  assert.equal(out.status, "hold");
  assert.equal(out.rounds, MAX_ROUNDS);
  assert.equal(authorFn.calls.length, MAX_ROUNDS); // exactly 3 author calls, no more
  assert.equal(auditFn.calls.length, MAX_ROUNDS);
  assert.ok(out.artifact, "best-so-far artifact retained");
  assert.deepEqual(
    out.history.map((h) => h.outcome),
    ["revise", "revise", "hold"],
  );
});

test("minor-only gaps pass without ever revising", async () => {
  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a1" }] });
  const auditFn = makeMockAuditFn({ diagnoses: [minorDiagnosis("concrete")] });

  const out = await runColdAuditGate(PAPER, { authorFn, auditFn, logger: silent() });

  assert.equal(out.status, "ready_to_publish");
  assert.equal(out.rounds, 1);
  assert.equal(authorFn.calls.length, 1, "no revise round for a minor gap");
});

test("gate honors the major gap even if auditor mislabels verdict as pass", async () => {
  // auditor says verdict:"pass" but flags a MAJOR faithful gap → gate must NOT pass.
  const lyingDiagnosis = { ...majorDiagnosis(), verdict: "pass" };
  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a1" }, { v: "a2" }] });
  const auditFn = makeMockAuditFn({ diagnoses: [lyingDiagnosis, passDiagnosis()] });

  const out = await runColdAuditGate(PAPER, { authorFn, auditFn, logger: silent() });

  assert.equal(out.history[0].outcome, "revise"); // major gap won over the "pass" label
  assert.equal(out.status, "ready_to_publish");
  assert.equal(out.rounds, 2);
});

// ---- batch: daily cap, status/alert/digest --------------------------------

test("daily cap enforcement: only N processed, rest skipped", async () => {
  const papers = [
    { arxivId: "2606.0001", title: "p1" },
    { arxivId: "2606.0002", title: "p2" },
    { arxivId: "2606.0003", title: "p3" },
    { arxivId: "2606.0004", title: "p4" },
    { arxivId: "2606.0005", title: "p5" },
  ];
  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a1" }] });
  const auditFn = makeMockAuditFn({ diagnoses: [passDiagnosis()] });

  const out = await runBatch(papers, {
    authorFn,
    auditFn,
    dailyCap: 2,
    writeFiles: false,
    logger: silent(),
    now: () => new Date("2026-06-05T08:00:00Z"),
  });

  assert.equal(out.processed, 2);
  assert.equal(out.dailyCap, 2);
  assert.deepEqual(out.skipped, ["2606.0003", "2606.0004", "2606.0005"]);
  // author called once per processed paper (all passed first round)
  assert.equal(authorFn.calls.length, 2);
});

test("batch: HOLD triggers alert + notify, pass does not", async () => {
  const papers = [
    { arxivId: "2606.0010", title: "passes" },
    { arxivId: "2606.0011", title: "holds" },
  ];
  // First paper passes; second holds (major gap every round).
  const authorFn = makeMockAuthorFn({
    author: (paper, ctx) => ({ paper: paper.arxivId, round: ctx.round }),
  });
  const auditFn = makeMockAuditFn({
    audit: (artifact) => (artifact.paper === "2606.0011" ? majorDiagnosis() : passDiagnosis()),
  });

  const notified = [];
  const out = await runBatch(papers, {
    authorFn,
    auditFn,
    dailyCap: 5,
    writeFiles: false,
    logger: silent(),
    notify: async (alert) => notified.push(alert),
    now: () => new Date("2026-06-05T08:00:00Z"),
  });

  const pass = out.results.find((r) => r.paperId === "2606.0010");
  const hold = out.results.find((r) => r.paperId === "2606.0011");
  assert.equal(pass.status, "ready_to_publish");
  assert.equal(hold.status, "hold");
  assert.equal(notified.length, 1, "exactly one HOLD alert fired");
  assert.equal(notified[0].paperId, "2606.0011");
  assert.ok(notified[0].message.includes("HOLD"));
});

test("batch: one paper's gate crash is ISOLATED — audit_error recorded, rest of batch continues", async () => {
  // 2026-06-10 regression: an unparseable auditor JSON threw out of runColdAuditGate and killed the
  // whole batch (0/3 audited that day). A single paper's failure must never starve the others.
  const papers = [
    { arxivId: "2606.0030", title: "crashes" },
    { arxivId: "2606.0031", title: "passes" },
  ];
  const authorFn = makeMockAuthorFn({
    author: (paper, ctx) => ({ paper: paper.arxivId, round: ctx.round }),
  });
  const auditFn = makeMockAuditFn({
    audit: (artifact) => {
      if (artifact.paper === "2606.0030") throw new Error("could not parse JSON from output");
      return passDiagnosis();
    },
  });

  const notified = [];
  const out = await runBatch(papers, {
    authorFn,
    auditFn,
    dailyCap: 5,
    writeFiles: false,
    logger: silent(),
    notify: async (alert) => notified.push(alert),
    now: () => new Date("2026-06-10T08:00:00Z"),
  });

  const crashed = out.results.find((r) => r.paperId === "2606.0030");
  const pass = out.results.find((r) => r.paperId === "2606.0031");
  assert.equal(crashed.status, "audit_error");
  assert.match(crashed.error, /could not parse JSON/);
  assert.equal(pass.status, "ready_to_publish", "second paper still audited after first crashed");
  assert.ok(notified.some((a) => a.kind === "cold-audit-error" && a.paperId === "2606.0030"));
});

test("batch: notifier failure is non-fatal (gate still completes)", async () => {
  const papers = [{ arxivId: "2606.0020", title: "holds" }];
  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a" }, { v: "b" }, { v: "c" }] });
  const auditFn = makeMockAuditFn({ diagnoses: [majorDiagnosis()] });

  const out = await runBatch(papers, {
    authorFn,
    auditFn,
    writeFiles: false,
    logger: silent(),
    notify: async () => {
      throw new Error("toast service down");
    },
    now: () => new Date("2026-06-05T08:00:00Z"),
  });

  assert.equal(out.results[0].status, "hold"); // did not crash on notify failure
});

test("batch writes status, alert, and digest files", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "cold-audit-test-"));
  try {
    const papers = [
      { arxivId: "2606.0030", title: "good" },
      { arxivId: "2606.0031", title: "bad" },
    ];
    const authorFn = makeMockAuthorFn({
      author: (paper, ctx) => ({ paper: paper.arxivId, round: ctx.round }),
    });
    const auditFn = makeMockAuditFn({
      audit: (artifact) => (artifact.paper === "2606.0031" ? majorDiagnosis() : passDiagnosis()),
    });

    const out = await runBatch(papers, {
      authorFn,
      auditFn,
      auditRoot: dir,
      logger: silent(),
      notify: async () => {},
      now: () => new Date("2026-06-05T08:00:00Z"),
    });

    // status files
    const goodStatus = JSON.parse(await readFile(path.join(dir, "2606.0030", "status.json"), "utf8"));
    const badStatus = JSON.parse(await readFile(path.join(dir, "2606.0031", "status.json"), "utf8"));
    assert.equal(goodStatus.status, "ready_to_publish");
    assert.equal(badStatus.status, "hold");
    // alert file only for the HOLD
    const alert = JSON.parse(await readFile(path.join(dir, "2606.0031", "alert.json"), "utf8"));
    assert.equal(alert.kind, "cold-audit-hold");
    // digest mentions both buckets
    const digest = await readFile(out.digestPath, "utf8");
    assert.ok(digest.includes("ready-to-publish"));
    assert.ok(digest.includes("HOLD"));
    assert.ok(digest.includes("2606.0030"));
    assert.ok(digest.includes("2606.0031"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("batch report lists unresolved arXiv references with downgrade label", async () => {
  const papers = [{ arxivId: "2606.0040", title: "future ref" }];
  const authorFn = makeMockAuthorFn({ artifacts: [{ paperMdx: "引用不存在/未来 arXiv 2612.12345", careerMdx: "" }] });
  const auditFn = makeMockAuditFn({ diagnoses: [passDiagnosis()] });

  const out = await runBatch(papers, {
    authorFn,
    auditFn,
    dailyCap: 1,
    writeFiles: false,
    logger: silent(),
    now: () => new Date("2026-06-08T00:00:00Z"),
  });

  assert.equal(out.results[0].unresolvedArxivReferences.length, 1);
  assert.equal(out.results[0].unresolvedArxivReferences[0].downgradeLabel, "推断/待核");
  assert.match(out.digest, /arXiv 引用待核/);
  assert.match(out.digest, /2612\.12345/);
  assert.match(out.digest, /推断\/待核/);
});

// ---- normalizeDiagnosis ----------------------------------------------------

test("normalizeDiagnosis preserves only the criteria the auditor returned (no backfill)", () => {
  // CRITICAL (Fix #5): we must NOT manufacture missing criteria as severity:"none" — that would
  // mask a degenerate audit. Only the auditor's actual entries are kept (normalized).
  const d = normalizeDiagnosis({
    perCriterion: [
      { criterion: "faithful", severity: "major", gap: "g", fix: "f" },
      { criterion: "novel-extra", severity: "minor", gap: "x", fix: "y" },
    ],
    verdict: "revise",
  });
  // returned criteria are kept...
  assert.ok(d.perCriterion.find((e) => e.criterion === "faithful"), "returned criterion kept");
  assert.ok(d.perCriterion.find((e) => e.criterion === "novel-extra"), "extra criterion kept");
  // ...but the 4 NOT returned are NOT backfilled.
  assert.equal(d.perCriterion.length, 2, "no missing criteria invented");
  assert.equal(d.perCriterion.find((e) => e.criterion === "mechanism"), undefined);
  // and such a partial diagnosis is correctly flagged untrustworthy.
  assert.equal(isUntrustworthyDiagnosis(d), true);
});

test("normalizeDiagnosis: a complete auditor response stays trustworthy", () => {
  const d = normalizeDiagnosis(passDiagnosis());
  for (const c of CRITERIA) {
    assert.ok(d.perCriterion.find((e) => e.criterion === c), `criterion ${c} present`);
  }
  assert.equal(isUntrustworthyDiagnosis(d), false);
});

// ---- makeClaudeAuditFn: TWO-CALL blind sequence (Stage A before Stage B sees source) -------

test("makeClaudeAuditFn: makes 2 calls; Stage A prompt has NO source and runs BEFORE Stage B", async () => {
  const artifact = { paperMdx: "深读正文 ARTIFACT_MARKER", careerMdx: "", metadata: {} };
  const SOURCE_MARKER = "FULL_SOURCE_TEXT_MARKER";
  const source = { fullText: SOURCE_MARKER, fullTextUrl: "u", repoUrl: "r", available: true };

  const calls = [];
  // Fake runClaude: record (label, prompt), return per-stage JSON. Stage A returns ONLY stageA;
  // Stage B returns the diff + a full, trustworthy perCriterion.
  const runClaude = async (prompt, label /*, ctx */) => {
    calls.push({ label, prompt });
    if (label === "stageA") {
      // At Stage A time, Stage B must NOT have run yet (blind ordering).
      assert.deepEqual(calls.map((c) => c.label), ["stageA"], "Stage A is the first call");
      return { stageA: { retell: "blind retell", confusions: [] } };
    }
    return {
      stageB: { faithful: true },
      perCriterion: CRITERIA.map((criterion) => ({ criterion, severity: "none", gap: "", fix: "" })),
      verdict: "pass",
    };
  };

  const auditFn = makeClaudeAuditFn({ buildStageAPrompt, buildStageBPrompt, runClaude, logger: silent() });
  const diagnosis = await auditFn(artifact, source, { round: 1, paper: { arxivId: "x" } });

  // exactly two calls, in order
  assert.deepEqual(calls.map((c) => c.label), ["stageA", "stageB"]);
  // STRUCTURAL BLINDNESS: the Stage A prompt must not contain the source text anywhere.
  const stageAPrompt = calls[0].prompt;
  assert.ok(stageAPrompt.includes("ARTIFACT_MARKER"), "Stage A sees the artifact");
  assert.ok(!stageAPrompt.includes(SOURCE_MARKER), "Stage A prompt MUST NOT contain the source");
  // Stage B DOES carry both the source and the committed stageA retell.
  const stageBPrompt = calls[1].prompt;
  assert.ok(stageBPrompt.includes(SOURCE_MARKER), "Stage B sees the source");
  assert.ok(stageBPrompt.includes("blind retell"), "Stage B carries the committed Stage A");
  // merged diagnosis carries the blind stageA + the open-book result, and passes (trustworthy + clean).
  assert.equal(diagnosis.stageA.retell, "blind retell");
  assert.equal(hasMajorGap(diagnosis), false);
});

function silent() {
  return { log() {}, warn() {} };
}
