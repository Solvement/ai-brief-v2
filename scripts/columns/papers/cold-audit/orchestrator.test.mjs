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
  collectFixes,
  decideOutcome,
  hasMajorGap,
  majorDiagnosis,
  makeMockAuditFn,
  makeMockAuthorFn,
  minorDiagnosis,
  normalizeDiagnosis,
  passDiagnosis,
  runBatch,
  runColdAuditGate,
} from "./orchestrator.mjs";

const PAPER = { arxivId: "2606.02060", title: "DRIFT span-level error localization" };

// ---- pure gate logic -------------------------------------------------------

test("hasMajorGap: malformed diagnosis is treated as blocking", () => {
  assert.equal(hasMajorGap(null), true);
  assert.equal(hasMajorGap({}), false); // no perCriterion array → no major gap
  assert.equal(hasMajorGap(passDiagnosis()), false);
  assert.equal(hasMajorGap(majorDiagnosis()), true);
  assert.equal(hasMajorGap(minorDiagnosis()), false);
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

// ---- normalizeDiagnosis ----------------------------------------------------

test("normalizeDiagnosis fills all 5 criteria and keeps extras", () => {
  const d = normalizeDiagnosis({
    perCriterion: [
      { criterion: "faithful", severity: "major", gap: "g", fix: "f" },
      { criterion: "novel-extra", severity: "minor", gap: "x", fix: "y" },
    ],
    verdict: "revise",
  });
  for (const c of CRITERIA) {
    assert.ok(d.perCriterion.find((e) => e.criterion === c), `criterion ${c} present`);
  }
  assert.ok(d.perCriterion.find((e) => e.criterion === "novel-extra"), "extra criterion kept");
  // unspecified criteria default to severity none
  assert.equal(d.perCriterion.find((e) => e.criterion === "mechanism").severity, "none");
});

function silent() {
  return { log() {}, warn() {} };
}
