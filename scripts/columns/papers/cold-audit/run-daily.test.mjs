// Unit tests for the cold-audit daily runner: selection (new-only · cap · skip-existing),
// metadata marking, grandfather seeding, and the end-to-end runDaily wiring — all mocked.
// NO real codex/claude CLI and NO network/disk are touched.
// Run: node --test scripts/columns/papers/cold-audit/run-daily.test.mjs

import assert from "node:assert/strict";
import test from "node:test";

import {
  majorDiagnosis,
  makeMockAuditFn,
  makeMockAuthorFn,
  passDiagnosis,
} from "./orchestrator.mjs";
import {
  grandfatherExisting,
  markOutcome,
  recordToPaper,
  runDaily,
  scanDeepReads,
  selectUnaudited,
} from "./run-daily.mjs";

// ---- helpers ---------------------------------------------------------------

function rec(slug, metadata) {
  return { slug, contentDir: `/fake/content/papers/${slug}`, metadata };
}
function deepRead(slug, extra = {}) {
  return rec(slug, { arxiv_id: slug, title: slug, status: "deep_read", ...extra });
}
function silent() {
  return { log() {}, warn() {} };
}

// ---- selectUnaudited: new-only · cap · skip-existing ------------------------

test("selectUnaudited: picks only new (no cold_audit) deep_reads", () => {
  const records = [
    deepRead("new-1"),
    deepRead("new-2"),
    deepRead("grandfathered-1", { cold_audit: { status: "grandfathered" } }),
    deepRead("already-pass", { cold_audit: { status: "ready_to_publish" } }),
    deepRead("already-hold", { cold_audit: { status: "hold" } }),
  ];
  const out = selectUnaudited(records, { dailyCap: 10 });
  assert.deepEqual(out.selected.map((r) => r.slug), ["new-1", "new-2"]);
  assert.deepEqual(out.skippedGrandfathered, ["grandfathered-1"]);
  assert.deepEqual(out.skippedAudited.sort(), ["already-hold", "already-pass"]);
  assert.deepEqual(out.overflow, []);
});

test("selectUnaudited: caps at dailyCap and reports overflow for next run", () => {
  const records = [deepRead("a"), deepRead("b"), deepRead("c"), deepRead("d"), deepRead("e")];
  const out = selectUnaudited(records, { dailyCap: 3 });
  assert.deepEqual(out.selected.map((r) => r.slug), ["a", "b", "c"]);
  assert.deepEqual(out.overflow, ["d", "e"]);
});

test("selectUnaudited: skips non-deep_read records (radar/light/other status)", () => {
  const records = [
    deepRead("real"),
    rec("radar", { status: "radar", arxiv_id: "radar" }),
    rec("light", { status: "light", arxiv_id: "light" }),
    rec("no-status", { arxiv_id: "x" }),
  ];
  const out = selectUnaudited(records, { dailyCap: 10 });
  assert.deepEqual(out.selected.map((r) => r.slug), ["real"]);
  assert.deepEqual(out.skippedNonDeep.sort(), ["light", "no-status", "radar"]);
});

test("selectUnaudited: an unknown cold_audit state is treated as still-unaudited", () => {
  // Defensive: a non-terminal/garbage state must not silently skip a paper from the gate.
  const records = [deepRead("weird", { cold_audit: { status: "in_progress" } })];
  const out = selectUnaudited(records, { dailyCap: 10 });
  assert.deepEqual(out.selected.map((r) => r.slug), ["weird"]);
});

test("selectUnaudited: default cap is 3", () => {
  const records = Array.from({ length: 5 }, (_, i) => deepRead(`p${i}`));
  const out = selectUnaudited(records);
  assert.equal(out.selected.length, 3);
  assert.equal(out.overflow.length, 2);
});

// ---- scanDeepReads: injectable I/O -----------------------------------------

test("scanDeepReads: reads metadata.json per dir, skips invalid", async () => {
  // Key the mock fs by dir name (last-but-one path segment) so it's separator-agnostic
  // (production joins with path.sep → backslashes on Windows).
  const byDir = {
    good: JSON.stringify({ status: "deep_read", arxiv_id: "1" }),
    broken: "{ not json",
  };
  const records = await scanDeepReads({
    contentDir: "/c/papers",
    readdirFn: async () => [
      { name: "good", isDirectory: () => true },
      { name: "broken", isDirectory: () => true },
      { name: "afile.txt", isDirectory: () => false },
    ],
    readFileFn: async (p) => {
      const parts = p.split(/[\\/]/);
      const dir = parts[parts.length - 2];
      if (dir in byDir) return byDir[dir];
      throw new Error(`ENOENT ${p}`);
    },
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].slug, "good");
  assert.equal(records[0].metadata.arxiv_id, "1");
});

// ---- recordToPaper ---------------------------------------------------------

test("recordToPaper maps metadata → orchestrator paper descriptor", () => {
  const p = recordToPaper(
    rec("2606.02060-drift", {
      arxiv_id: "2606.02060",
      title: "DRIFT",
      huggingface_url: "https://huggingface.co/papers/2606.02060",
      paper_url: "https://arxiv.org/abs/2606.02060",
      code_url: "https://github.com/NJU-LINK/DRIFT",
    }),
  );
  assert.equal(p.arxivId, "2606.02060");
  assert.equal(p.sourceUrl, "https://huggingface.co/papers/2606.02060");
  assert.equal(p.codeUrl, "https://github.com/NJU-LINK/DRIFT");
  assert.equal(p.slug, "2606.02060-drift");
});

// ---- markOutcome -----------------------------------------------------------

test("markOutcome writes cold_audit.status into metadata.json (ready_to_publish)", async () => {
  const written = {};
  const meta = await markOutcome(
    deepRead("p"),
    { status: "ready_to_publish", rounds: 1, finalDiagnosis: passDiagnosis() },
    {
      readFileFn: async () => JSON.stringify({ status: "deep_read", arxiv_id: "p" }),
      writeFileFn: async (path, data) => {
        written[path] = data;
      },
      now: () => new Date("2026-06-05T08:00:00Z"),
    },
  );
  assert.equal(meta.cold_audit.status, "ready_to_publish");
  assert.equal(meta.cold_audit.rounds, 1);
  assert.equal(meta.cold_audit.auditor, "claude-cold-audit");
  assert.ok(Object.keys(written)[0].endsWith("metadata.json"));
});

test("markOutcome records major gaps on HOLD", async () => {
  const meta = await markOutcome(
    deepRead("p"),
    { status: "hold", rounds: 3, finalDiagnosis: majorDiagnosis("faithful", "fabricated 92%", "remove it") },
    {
      readFileFn: async () => JSON.stringify({ status: "deep_read", arxiv_id: "p" }),
      writeFileFn: async () => {},
      now: () => new Date("2026-06-05T08:00:00Z"),
    },
  );
  assert.equal(meta.cold_audit.status, "hold");
  assert.ok(meta.cold_audit.major_gaps.some((g) => g.criterion === "faithful"));
});

// ---- grandfatherExisting ---------------------------------------------------

test("grandfatherExisting marks only un-audited deep_reads, leaves audited ones alone", async () => {
  const writes = {};
  const marked = await grandfatherExisting({
    contentDir: "/c/papers",
    readdirFn: async () => [
      { name: "old-1", isDirectory: () => true },
      { name: "old-2", isDirectory: () => true },
      { name: "already", isDirectory: () => true },
    ],
    readFileFn: async (p) => {
      if (p.includes("already")) return JSON.stringify({ status: "deep_read", cold_audit: { status: "ready_to_publish" } });
      return JSON.stringify({ status: "deep_read", arxiv_id: p });
    },
    writeFileFn: async (p, data) => {
      writes[p] = data;
    },
    now: () => new Date("2026-06-05T08:00:00Z"),
  });
  assert.deepEqual(marked.sort(), ["old-1", "old-2"]);
  // the already-audited one must NOT be rewritten
  assert.ok(!Object.keys(writes).some((p) => p.includes("already")));
  // grandfathered ones carry the terminal status
  assert.ok(Object.values(writes).every((d) => JSON.parse(d).cold_audit.status === "grandfathered"));
});

// ---- runDaily end-to-end (mocked author/audit, no files) -------------------

test("runDaily: audits only new deep_reads, caps, skips grandfathered+audited", async () => {
  const records = [
    deepRead("new-pass"),
    deepRead("new-hold"),
    deepRead("new-overflow"),
    deepRead("gf", { cold_audit: { status: "grandfathered" } }),
    deepRead("done", { cold_audit: { status: "ready_to_publish" } }),
  ];

  const authorFn = makeMockAuthorFn({ artifacts: [{ v: "a" }, { v: "b" }, { v: "c" }] });
  // pass for new-pass, hold for new-hold (3 majors).
  const auditFn = makeMockAuditFn({
    audit: (artifact, source, ctx) =>
      ctx.paper.slug === "new-hold" ? majorDiagnosis() : passDiagnosis(),
  });

  const marks = [];
  const notified = [];
  const out = await runDaily({
    dailyCap: 2,
    writeFiles: false, // don't touch disk; but we still capture marks via markFn
    logger: silent(),
    now: () => new Date("2026-06-05T08:00:00Z"),
    scan: async () => records,
    loadArtifactFn: async (dir) => ({ paperMdx: `mdx for ${dir}`, careerMdx: "", metadata: {} }),
    loadSourceFn: async () => ({ fullText: "FULL TEXT", available: true }),
    authorFn,
    auditFn,
    notify: async (alert) => notified.push(alert),
    markFn: async (rec, gate) => marks.push({ slug: rec.slug, status: gate.status }),
  });

  // cap=2 → only first two new ones processed; third is overflow.
  assert.deepEqual(out.selected, ["new-pass", "new-hold"]);
  assert.deepEqual(out.overflow, ["new-overflow"]);
  assert.deepEqual(out.skippedGrandfathered, ["gf"]);
  assert.deepEqual(out.skippedAudited, ["done"]);

  // batch outcomes
  const byId = Object.fromEntries(out.batch.results.map((r) => [r.paperId, r.status]));
  assert.equal(byId["new-pass"], "ready_to_publish");
  assert.equal(byId["new-hold"], "hold");

  // exactly one HOLD alert
  assert.equal(notified.length, 1);
  assert.equal(notified[0].paperId, "new-hold");
});

test("runDaily: writeFiles=false still skips markFn (status only persisted when writeFiles)", async () => {
  const records = [deepRead("p")];
  const marks = [];
  const out = await runDaily({
    dailyCap: 3,
    writeFiles: false,
    logger: silent(),
    now: () => new Date("2026-06-05T08:00:00Z"),
    scan: async () => records,
    loadArtifactFn: async () => ({ paperMdx: "x", careerMdx: "", metadata: {} }),
    loadSourceFn: async () => ({ fullText: "t", available: true }),
    authorFn: makeMockAuthorFn({ artifacts: [{ v: "a" }] }),
    auditFn: makeMockAuditFn({ diagnoses: [passDiagnosis()] }),
    markFn: async (rec, gate) => marks.push({ slug: rec.slug, status: gate.status }),
  });
  assert.equal(out.audited.length, 1);
  assert.equal(out.audited[0].status, "ready_to_publish");
  assert.equal(marks.length, 0, "markFn not called when writeFiles=false");
});

test("runDaily: no candidates → no batch, returns cleanly", async () => {
  const out = await runDaily({
    logger: silent(),
    now: () => new Date("2026-06-05T08:00:00Z"),
    scan: async () => [deepRead("gf", { cold_audit: { status: "grandfathered" } })],
  });
  assert.equal(out.selected.length, 0);
  assert.equal(out.batch, null);
});

test("runDaily: artifact LOAD FAILURE → force-HOLD + alert, never audits the thin author handle", async () => {
  // Fix #4: a paper whose on-disk artifact can't be read must NOT fall back to the in-memory
  // author handle. It is force-held, alerted, and never reaches the auditor.
  const records = [deepRead("loadfail"), deepRead("ok")];
  const audited = [];
  const notified = [];
  const marks = [];
  const out = await runDaily({
    dailyCap: 5,
    writeFiles: false,
    logger: silent(),
    now: () => new Date("2026-06-05T08:00:00Z"),
    scan: async () => records,
    loadArtifactFn: async (dir) => {
      if (dir.includes("loadfail")) throw new Error("ENOENT paper.mdx gone");
      return { paperMdx: "ON-DISK", careerMdx: "", metadata: {} };
    },
    loadSourceFn: async () => ({ fullText: "t", available: true }),
    authorFn: makeMockAuthorFn({ author: (p, c) => ({ thin: "author-handle", round: c.round }) }),
    auditFn: makeMockAuditFn({
      audit: (artifact) => {
        audited.push(artifact);
        return passDiagnosis();
      },
    }),
    notify: async (a) => notified.push(a),
    markFn: async (rec, gate) => marks.push({ slug: rec.slug, status: gate.status }),
  });

  // the auditor was NEVER handed the thin author handle for the load-fail paper.
  assert.ok(!audited.some((a) => a && a.thin === "author-handle"), "thin author handle never audited");
  // load-fail paper is HELD with an alert; the healthy one passed.
  const byId = Object.fromEntries(out.batch.results.map((r) => [r.paperId, r.status]));
  assert.equal(byId["loadfail"], "hold");
  assert.equal(byId["ok"], "ready_to_publish");
  assert.ok(notified.some((n) => n.paperId === "loadfail"), "load-failure raised a HOLD alert");
});

test("runDaily: auditor reads the on-disk artifact (Stage A), not the author handle", async () => {
  const records = [deepRead("p")];
  let auditedArtifact = null;
  await runDaily({
    dailyCap: 1,
    writeFiles: false,
    logger: silent(),
    now: () => new Date("2026-06-05T08:00:00Z"),
    scan: async () => records,
    loadArtifactFn: async (dir) => ({ paperMdx: "ON-DISK MDX", careerMdx: "", metadata: { from: "disk" } }),
    loadSourceFn: async () => ({ fullText: "t", available: true }),
    authorFn: makeMockAuthorFn({ artifacts: [{ thin: "author-handle" }] }),
    auditFn: makeMockAuditFn({
      audit: (artifact) => {
        auditedArtifact = artifact;
        return passDiagnosis();
      },
    }),
    markFn: async () => {},
  });
  assert.equal(auditedArtifact.paperMdx, "ON-DISK MDX", "auditor saw the on-disk deep-read");
});
