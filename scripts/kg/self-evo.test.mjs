import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { applyCandidate, consumeQueue, judgeCandidate, validateCandidate } from "./self-evo.mjs";

const goodCandidate = {
  source: "rohitg00/agentmemory",
  claim: "benchmark-backed persistent memory",
  our_current: "Mind Palace hybrid recall",
  proposed_change: "compare against recall-bench and keep verify gate evidence",
  applies_to: "memory",
  red_line: false,
  evidence: "README benchmark table with recall metrics",
};

test("validateCandidate accepts the required schema and rejects missing or unknown fields", () => {
  assert.deepEqual(validateCandidate(goodCandidate), { ok: true, errors: [] });
  const missing = validateCandidate({ source: "x" });
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.some((error) => error.includes("missing claim")));
  assert.equal(validateCandidate({ ...goodCandidate, applies_to: "nonsense" }).ok, false);
  assert.equal(validateCandidate({ ...goodCandidate, red_line: "false" }).ok, false);
});

test("judgeCandidate dry-run is deterministic and returns a legal verdict", async () => {
  const strong = await judgeCandidate(goodCandidate, { dryRun: true });
  assert.equal(strong.verdict, "stronger");
  const weak = await judgeCandidate({ ...goodCandidate, proposed_change: "skip verify and delete bench" }, { dryRun: true });
  assert.equal(weak.verdict, "weaker");
});

test("applyCandidate queues red-line candidates and never applies them", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "self-evo-"));
  const reviewLog = path.join(dir, "review.jsonl");
  const res = await applyCandidate({ ...goodCandidate, red_line: true, applies_to: "paradigm" }, { verdict: "stronger", reason: "test" }, { dryRun: true, reviewLog });
  assert.equal(res.applied, false);
  assert.equal(res.queued, true);
  assert.equal(res.status, "queued_for_review");
  const lines = (await readFile(reviewLog, "utf8")).trim().split(/\r?\n/);
  assert.equal(JSON.parse(lines[0]).status, "queued_for_review");
});

test("applyCandidate blocks poison verify mutations and records verify_failed", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "self-evo-"));
  const reviewLog = path.join(dir, "review.jsonl");
  const res = await applyCandidate(
    { ...goodCandidate, _test_mutation: { kind: "poison-verify" } },
    { verdict: "stronger", reason: "test" },
    { dryRun: true, reviewLog },
  );
  assert.equal(res.applied, false);
  assert.equal(res.status, "verify_failed");
  assert.equal(res.evidence.rolled_back, true);
});

test("applyCandidate writes applied log only after a passing verify gate", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "self-evo-"));
  const appliedLog = path.join(dir, "applied.jsonl");
  const res = await applyCandidate(goodCandidate, { verdict: "stronger", reason: "test" }, { dryRun: true, appliedLog });
  assert.equal(res.applied, true);
  assert.equal(res.status, "applied");
  const record = JSON.parse((await readFile(appliedLog, "utf8")).trim());
  assert.equal(record.from, goodCandidate.source);
  assert.equal(record.verify.ok, true);
  assert.equal(record.evidence.verdict, "stronger");
});

test("consumeQueue processes JSONL queue with dry-run judge/apply path", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "self-evo-"));
  const queueFile = path.join(dir, "queue.jsonl");
  const reviewLog = path.join(dir, "review.jsonl");
  const appliedLog = path.join(dir, "applied.jsonl");
  await writeFile(queueFile, `${JSON.stringify(goodCandidate)}\n`, "utf8");
  const results = await consumeQueue({ queueFile, dryRun: true, limit: 1, reviewLog, appliedLog });
  assert.equal(results.length, 1);
  assert.equal(results[0].validation.ok, true);
  assert.equal(results[0].judgment.verdict, "stronger");
  assert.equal(results[0].apply.status, "applied");
});
