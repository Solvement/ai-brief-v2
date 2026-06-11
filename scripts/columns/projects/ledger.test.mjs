import test from "node:test";
import assert from "node:assert/strict";

import {
  filterNewProjectCandidates,
  isProjectDone,
  projectLedgerKey,
  upsertProjectSeen,
} from "./ledger.mjs";

function candidate(fullName, source, extra = {}) {
  return {
    id: `project:${fullName.toLowerCase()}`,
    source,
    discoveredAt: "2026-06-11T12:00:00.000Z",
    raw: {
      fullName,
      url: `https://github.com/${fullName}`,
      provenance: [{ source, seen_at: "2026-06-11T12:00:00.000Z", metrics: extra.metrics || {} }],
      ...extra,
    },
  };
}

test("projectLedgerKey normalizes URL and full_name collisions", () => {
  assert.equal(projectLedgerKey({ fullName: "Owner/Repo" }), "owner/repo");
  assert.equal(projectLedgerKey({ url: "https://github.com/Owner/Repo.git" }), "owner/repo");
  assert.equal(projectLedgerKey({ raw: { full_name: "Owner/Repo" } }), "owner/repo");
});

test("upsertProjectSeen is idempotent and merges provenance by repo full_name", () => {
  const ledger = new Map();
  const first = upsertProjectSeen(ledger, candidate("Owner/Repo", "github-trending:daily"));
  const second = upsertProjectSeen(ledger, candidate("owner/repo", "hacker-news:show-hn", { metrics: { hn_points: 123 } }));

  assert.equal(first.isNew, true);
  assert.equal(second.isNew, false);
  assert.equal(ledger.size, 1);
  const record = ledger.get("owner/repo");
  assert.deepEqual(record.sources.sort(), ["github-trending:daily", "hacker-news:show-hn"]);
  assert.equal(record.provenance.length, 2);
  assert.equal(record.provenance.find((item) => item.source === "hacker-news:show-hn").metrics.hn_points, 123);
});

test("filterNewProjectCandidates skips analyzed and deep_dived ledger records", () => {
  const ledger = new Map([
    ["done/repo", { full_name: "done/repo", status: "analyzed" }],
    ["deep/repo", { full_name: "deep/repo", status: "deep_dived" }],
  ]);
  assert.equal(isProjectDone(ledger.get("done/repo")), true);

  const { accepted, skipped } = filterNewProjectCandidates([
    candidate("done/repo", "github-trending:daily"),
    candidate("deep/repo", "github-trending:weekly"),
    candidate("new/repo", "github-search-growth:agent"),
  ], ledger);

  assert.deepEqual(accepted.map((item) => item.raw.fullName), ["new/repo"]);
  assert.deepEqual(skipped.map((item) => item.reason), ["ledger_status:analyzed", "ledger_status:deep_dived"]);
});
