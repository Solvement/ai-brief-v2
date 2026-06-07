// Unit tests for the paper ledger's pure de-dupe and status invariants.
// Pure in-memory Maps only; this file must not read or write data/papers/ledger.jsonl.

import assert from "node:assert/strict";
import test from "node:test";

import { DONE_STATUSES, isDone, ledgerKey, normalizeTitle, upsertSeen } from "./ledger.mjs";

test("ledgerKey: arxiv_id wins over title/url and de-dupes collisions", () => {
  assert.equal(
    ledgerKey({ arxiv_id: "2606.01993", normalized_title: "first", hf_paper_url: "https://hf.co/papers/a" }),
    "arxiv:2606.01993",
  );
  assert.equal(
    ledgerKey({ arxiv_id: "2606.01993", normalized_title: "different", hf_paper_url: "https://hf.co/papers/b" }),
    "arxiv:2606.01993",
  );
  assert.notEqual(
    ledgerKey({ arxiv_id: "2606.01993", normalized_title: "same", hf_paper_url: "https://hf.co/papers/a" }),
    ledgerKey({ arxiv_id: "2606.01994", normalized_title: "same", hf_paper_url: "https://hf.co/papers/a" }),
  );
});

test("ledgerKey: title/url fallback de-dupes only exact fallback matches", () => {
  const first = { normalized_title: "same paper", hf_paper_url: "https://hf.co/papers/1" };

  assert.equal(ledgerKey(first), ledgerKey({ normalized_title: "same paper", hf_paper_url: "https://hf.co/papers/1" }));
  assert.notEqual(ledgerKey(first), ledgerKey({ normalized_title: "same paper", hf_paper_url: "https://hf.co/papers/2" }));
  assert.notEqual(ledgerKey(first), ledgerKey({ normalized_title: "other paper", hf_paper_url: "https://hf.co/papers/1" }));
});

test("ledgerKey: empty inputs are stable and do not throw", () => {
  assert.equal(ledgerKey({}), "title:::");
  assert.equal(ledgerKey(), "title:::");
});

test("isDone: DONE_STATUSES are excluded and all other statuses are not done", () => {
  assert.deepEqual([...DONE_STATUSES].sort(), ["analyzed", "deep_read", "published"]);

  for (const status of DONE_STATUSES) {
    assert.equal(isDone({ status }), true);
  }

  for (const status of ["new", "triaged", undefined, "unknown"]) {
    assert.equal(isDone({ status }), false);
  }

  assert.equal(isDone(null), false);
  assert.equal(isDone(undefined), false);
});

test("upsertSeen: duplicate arxiv_id is idempotent and widens sources only", () => {
  const map = new Map();

  const first = upsertSeen(
    map,
    { arxiv_id: "2606.01993", title: "X" },
    { date: "2026-06-07", source: "hf" },
  );

  assert.equal(first.isNew, true);
  assert.equal(map.size, 1);
  assert.equal(first.record.status, "new");
  assert.equal(first.record.first_seen_date, "2026-06-07");
  assert.equal(first.record.first_seen_source, "hf");
  assert.deepEqual(first.record.all_seen_sources, ["hf"]);

  const second = upsertSeen(
    map,
    { arxiv_id: "2606.01993", title: "Changed Title" },
    { date: "2026-06-08", source: "arxiv" },
  );

  assert.equal(second.isNew, false);
  assert.equal(map.size, 1);
  assert.equal(second.record.status, "new");
  assert.equal(second.record.first_seen_date, "2026-06-07");
  assert.equal(second.record.first_seen_source, "hf");
  assert.deepEqual(second.record.all_seen_sources, ["hf", "arxiv"]);

  const third = upsertSeen(
    map,
    { arxiv_id: "2606.01993", title: "Changed Again" },
    { date: "2026-06-09", source: "arxiv" },
  );

  assert.equal(third.isNew, false);
  assert.equal(map.size, 1);
  assert.equal(third.record.first_seen_date, "2026-06-07");
  assert.equal(third.record.first_seen_source, "hf");
  assert.deepEqual(third.record.all_seen_sources, ["hf", "arxiv"]);
});

test("upsertSeen: existing done status is never downgraded to new", () => {
  const map = new Map();
  const first = upsertSeen(
    map,
    { arxiv_id: "2606.01993", title: "Already Done" },
    { date: "2026-06-07", source: "hf" },
  );
  first.record.status = "deep_read";

  const second = upsertSeen(
    map,
    { arxiv_id: "2606.01993", title: "Already Done Reappeared" },
    { date: "2026-06-08", source: "arxiv" },
  );

  assert.equal(second.isNew, false);
  assert.equal(map.size, 1);
  assert.equal(second.record.status, "deep_read");
  assert.equal(second.record.first_seen_date, "2026-06-07");
  assert.equal(second.record.first_seen_source, "hf");
  assert.deepEqual(second.record.all_seen_sources, ["hf", "arxiv"]);
});

test("upsertSeen: backfills missing title on duplicate record", () => {
  const candidate = { arxiv_id: "2606.01993", normalized_title: "missing title", hf_paper_url: "https://hf.co/papers/1" };
  const existing = {
    ...candidate,
    title: "",
    first_seen_date: "2026-06-07",
    first_seen_source: "hf",
    all_seen_sources: ["hf"],
    status: "new",
  };
  const map = new Map([[ledgerKey(existing), existing]]);

  const result = upsertSeen(
    map,
    { ...candidate, title: "Backfilled Title" },
    { date: "2026-06-08", source: "arxiv" },
  );

  assert.equal(result.isNew, false);
  assert.equal(result.record.title, "Backfilled Title");
  assert.equal(map.get(ledgerKey(candidate)).title, "Backfilled Title");
});

test("upsertSeen: title/url fallback de-dupes candidates without arxiv_id", () => {
  const map = new Map();

  const first = upsertSeen(
    map,
    { normalized_title: "fallback paper", hf_paper_url: "https://hf.co/papers/fallback", title: "Fallback Paper" },
    { date: "2026-06-07", source: "hf" },
  );
  const second = upsertSeen(
    map,
    { normalized_title: "fallback paper", hf_paper_url: "https://hf.co/papers/fallback", title: "Fallback Paper Again" },
    { date: "2026-06-08", source: "arxiv" },
  );

  assert.equal(first.isNew, true);
  assert.equal(second.isNew, false);
  assert.equal(map.size, 1);
  assert.deepEqual(second.record.all_seen_sources, ["hf", "arxiv"]);
});

test("normalizeTitle: lowercases, collapses punctuation/space, trims, and preserves CJK", () => {
  assert.equal(normalizeTitle("  Hello,  世界!! "), "hello 世界");
});
