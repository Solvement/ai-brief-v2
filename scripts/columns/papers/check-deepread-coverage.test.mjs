import { test } from "node:test";
import assert from "node:assert/strict";
import { computeCoverage } from "./check-deepread-coverage.mjs";

const NOW = () => new Date("2026-06-08T12:00:00.000Z");

test("detects a deep-read coverage gap (selected but not authored)", () => {
  const deepReads = [{ arxiv_id: "2606.03458", first_seen_date: "2026-06-06" }];
  const selections = {
    "2026-06-06": [{ arxiv_id: "2606.03458", title: "already authored" }],
    "2026-06-08": [{ arxiv_id: "2606.01249", title: "Trust Region Distillation" }],
  };
  const r = computeCoverage(deepReads, selections, { now: NOW });
  assert.equal(r.ok, false);
  assert.equal(r.ungenerated.length, 1);
  assert.equal(r.ungenerated[0].arxiv_id, "2606.01249");
  assert.equal(r.latestSelectionDate, "2026-06-08");
  assert.equal(r.latestDeepReadDate, "2026-06-06");
  assert.equal(r.lagDays, 2);
});

test("no gap when every selected deep paper is authored", () => {
  const deepReads = [
    { arxiv_id: "2606.03458", first_seen_date: "2026-06-08" },
    { arxiv_id: "2606.01249", first_seen_date: "2026-06-08" },
  ];
  const selections = { "2026-06-08": [{ arxiv_id: "2606.01249" }, { arxiv_id: "2606.03458v2" }] };
  const r = computeCoverage(deepReads, selections, { now: NOW });
  assert.equal(r.ok, true);
  assert.equal(r.ungenerated.length, 0);
});

test("selections older than the lookback window are ignored", () => {
  const deepReads = [];
  const selections = { "2026-05-01": [{ arxiv_id: "2605.00001", title: "stale, out of window" }] };
  const r = computeCoverage(deepReads, selections, { now: NOW, lookbackDays: 7 });
  assert.equal(r.ok, true);
  assert.equal(r.ungenerated.length, 0);
});

test("matches arxiv ids regardless of version suffix", () => {
  const deepReads = [{ arxiv_id: "2606.01249v3", first_seen_date: "2026-06-08" }];
  const selections = { "2026-06-08": [{ arxiv_id: "2606.01249", title: "versioned match" }] };
  const r = computeCoverage(deepReads, selections, { now: NOW });
  assert.equal(r.ok, true);
});
