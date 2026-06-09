import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { openAiBriefDb } from "../../lib/db.mjs";
import {
  pMap,
  processOneRecord,
  resolveDeepDiveConcurrency,
  main,
} from "./codex-deepdive.mjs";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function record(fullName) {
  return {
    candidate: { id: `project:${fullName}`, raw: { fullName } },
    repo: { fullName },
    light: { final_depth: "deep", depth_decision: { final_depth: "deep" } },
    finalDepth: "deep",
    briefWikiRow: null,
  };
}

// ── pMap: fixed-concurrency pool ───────────────────────────────────────────────

test("pMap runs at most N tasks concurrently and preserves input order", async () => {
  const items = [0, 1, 2, 3, 4, 5];
  let active = 0;
  let maxActive = 0;
  const gates = items.map(() => deferred());

  const promise = pMap(
    items,
    async (item) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await gates[item].promise;
      active -= 1;
      return item * 10;
    },
    3,
  );

  // Let the first wave start.
  await new Promise((r) => setImmediate(r));
  assert.equal(maxActive, 3, "exactly 3 tasks should be in flight at once");

  // Drain in arbitrary order; the pool should keep pulling new work.
  for (const gate of gates) gate.resolve();
  const out = await promise;

  assert.deepEqual(out, [0, 10, 20, 30, 40, 50], "results are in input order");
  assert.equal(maxActive, 3, "concurrency never exceeded N");
});

test("pMap with concurrency 1 is effectively sequential", async () => {
  const order = [];
  await pMap(
    ["a", "b", "c"],
    async (item) => {
      order.push(`start:${item}`);
      await new Promise((r) => setImmediate(r));
      order.push(`end:${item}`);
    },
    1,
  );
  assert.deepEqual(order, ["start:a", "end:a", "start:b", "end:b", "start:c", "end:c"]);
});

// ── single-failure isolation ───────────────────────────────────────────────────

test("one task throwing/timing out does not block the others (allSettled semantics)", async () => {
  const records = [record("owner/a"), record("owner/b"), record("owner/c")];
  const slow = deferred();

  // Inject a fake author: owner/b hangs then rejects (the roboflow/supervision
  // scenario); the others succeed quickly.
  const fakeAuthor = async (rec) => {
    if (rec.repo.fullName === "owner/b") {
      await slow.promise;
      throw new Error("codex exec timed out after 1200000ms");
    }
    return { repo: rec.repo.fullName, status: "generated", slug: rec.repo.fullName.replace("/", "-") };
  };
  const fakeEnrich = (rec, error) => ({
    repo: rec.repo.fullName,
    status: "needs_enrichment",
    generated: false,
    error: error.message,
  });
  const deps = { authorOneDeepDive: fakeAuthor, markNeedsEnrichment: fakeEnrich };

  // a and c should resolve while b is still hung.
  const aResult = await processOneRecord(records[0], { force: true }, deps);
  const cResult = await processOneRecord(records[2], { force: true }, deps);
  assert.equal(aResult.status, "generated");
  assert.equal(cResult.status, "generated");

  // Now release b — it fails, but is isolated to a needs_enrichment fallback.
  slow.resolve();
  const bResult = await processOneRecord(records[1], { force: true }, deps);
  assert.equal(bResult.status, "needs_enrichment");
  assert.equal(bResult.generated, false);
});

test("processOneRecord never throws even when the author and enrich both error", async () => {
  const rec = record("owner/x");
  const deps = {
    authorOneDeepDive: async () => {
      throw new Error("author boom");
    },
    markNeedsEnrichment: () => ({ repo: "owner/x", status: "needs_enrichment", generated: false }),
  };
  const result = await processOneRecord(rec, { force: true }, deps);
  assert.equal(result.status, "needs_enrichment");
});

// ── concurrency resolution ─────────────────────────────────────────────────────

test("resolveDeepDiveConcurrency reads env, defaults to 3, ignores junk", () => {
  assert.equal(resolveDeepDiveConcurrency({}), 3);
  assert.equal(resolveDeepDiveConcurrency({ PROJECT_DEEPDIVE_CONCURRENCY: "5" }), 5);
  assert.equal(resolveDeepDiveConcurrency({ PROJECT_DEEPDIVE_CONCURRENCY: "0" }), 3);
  assert.equal(resolveDeepDiveConcurrency({ PROJECT_DEEPDIVE_CONCURRENCY: "nope" }), 3);
});

// ── end-to-end main(): rebuild ALWAYS runs via allSettled ──────────────────────

async function seedDeepCandidate(db, fullName) {
  db.upsertCandidate({
    id: `project:${fullName}`,
    column: "projects",
    source: "github-trending:daily",
    dedupeKey: fullName,
    raw: { fullName, owner: fullName.split("/")[0], name: fullName.split("/")[1], url: `https://github.com/${fullName}` },
    discoveredAt: new Date().toISOString(),
  });
  db.insertAnalysis({
    candidateId: `project:${fullName}`,
    tier: "light",
    payload: { final_depth: "deep", depth_decision: { final_depth: "deep" } },
    model: "deterministic-radar",
    generatedAt: new Date().toISOString(),
  });
}

test("main() authors in parallel, isolates a hang, and STILL runs the rebuild", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "codex-deepdive-"));
  const dbPath = path.join(dir, "ai-brief.db");
  const logRoot = path.join(dir, "logs");
  const db = await openAiBriefDb(dbPath);
  await seedDeepCandidate(db, "owner/good1");
  await seedDeepCandidate(db, "owner/hang");
  await seedDeepCandidate(db, "owner/good2");
  db.close();

  let rebuildRan = 0;
  const order = [];
  const fakeAuthor = async (rec) => {
    order.push(`start:${rec.repo.fullName}`);
    if (rec.repo.fullName === "owner/hang") {
      // The stuck project: rejects after the others would have completed.
      await new Promise((r) => setTimeout(r, 30));
      throw new Error("codex exec timed out");
    }
    await new Promise((r) => setImmediate(r));
    order.push(`end:${rec.repo.fullName}`);
    return { repo: rec.repo.fullName, status: "generated", slug: rec.repo.fullName.replace("/", "-") };
  };
  const deps = {
    authorOneDeepDive: fakeAuthor,
    markNeedsEnrichment: (rec, error) => ({
      repo: rec.repo.fullName,
      status: "needs_enrichment",
      generated: false,
      error: error?.message,
    }),
    publishBriefMirror: async () => {
      rebuildRan += 1;
      return { outputs: { ok: true } };
    },
  };

  const summary = await main(
    ["--db", dbPath, "--limit", "10", "--force", "--no-trending", "--log-root", logRoot],
    deps,
  );

  assert.ok(summary, "main returned a summary");
  assert.equal(summary.results.length, 3, "all three records produced a result");

  const byRepo = Object.fromEntries(summary.results.map((r) => [r.repo, r]));
  assert.equal(byRepo["owner/good1"].status, "generated");
  assert.equal(byRepo["owner/good2"].status, "generated");
  assert.equal(byRepo["owner/hang"].status, "needs_enrichment", "the hung project is isolated");

  // The whole point: the rebuild ran exactly once despite one project failing.
  assert.equal(rebuildRan, 1, "rebuild ALWAYS runs via allSettled, not blocked by the hang");
  assert.ok(summary.briefMirror, "summary carries the rebuild result");
  assert.equal(summary.concurrency, 3, "default concurrency surfaced in summary");

  // Proof of parallelism: both good projects START before the hang END resolves —
  // i.e. they did not run strictly one-after-another behind the slow one.
  const hangIndex = order.indexOf("start:owner/hang");
  const good2Start = order.indexOf("start:owner/good2");
  assert.ok(good2Start <= hangIndex + 1, "second good project started without waiting for the hang to finish");

  await rm(dir, { recursive: true, force: true });
});
