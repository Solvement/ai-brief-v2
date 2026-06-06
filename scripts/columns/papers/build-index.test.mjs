// Unit tests for build-index's cold-audit publish filter (Fix #3): a HELD / needs-human
// deep-read must NEVER be published into the index. Pure object logic + injectable I/O — no disk.
// Run: node --test scripts/columns/papers/build-index.test.mjs

import assert from "node:assert/strict";
import test from "node:test";

import { coldAuditAllowsPublish, collectDeepReads } from "./build-index.mjs";

// ---- coldAuditAllowsPublish (the pure predicate) ---------------------------

test("coldAuditAllowsPublish: absent cold_audit (legacy) → publishable", () => {
  assert.equal(coldAuditAllowsPublish({ status: "deep_read" }), true);
  assert.equal(coldAuditAllowsPublish({ status: "deep_read", cold_audit: {} }), true); // no status field
});

test("coldAuditAllowsPublish: ready_to_publish & grandfathered → publishable", () => {
  assert.equal(coldAuditAllowsPublish({ cold_audit: { status: "ready_to_publish" } }), true);
  assert.equal(coldAuditAllowsPublish({ cold_audit: { status: "grandfathered" } }), true);
});

test("coldAuditAllowsPublish: hold / needs_human / unknown → NOT publishable", () => {
  assert.equal(coldAuditAllowsPublish({ cold_audit: { status: "hold" } }), false);
  assert.equal(coldAuditAllowsPublish({ cold_audit: { status: "needs_human" } }), false);
  assert.equal(coldAuditAllowsPublish({ cold_audit: { status: "in_progress" } }), false);
});

// ---- collectDeepReads filters HELD content out of the published index ------

function dirent(name) {
  return { name, isDirectory: () => true };
}

test("collectDeepReads: excludes HELD deep-reads, keeps passed/grandfathered/legacy", async () => {
  const byDir = {
    "held-1": { status: "deep_read", arxiv_id: "h1", title: "held", cold_audit: { status: "hold" } },
    "needs-human-1": { status: "deep_read", arxiv_id: "n1", title: "nh", cold_audit: { status: "needs_human" } },
    "passed-1": { status: "deep_read", arxiv_id: "p1", title: "passed", cold_audit: { status: "ready_to_publish" } },
    "grandfathered-1": { status: "deep_read", arxiv_id: "g1", title: "gf", cold_audit: { status: "grandfathered" } },
    "legacy-1": { status: "deep_read", arxiv_id: "l1", title: "legacy" }, // no cold_audit
  };
  const out = await collectDeepReads({
    contentDir: "/c/papers",
    readdirFn: async () => Object.keys(byDir).map(dirent),
    readJsonFn: async (p) => {
      const parts = p.split(/[\\/]/);
      const dir = parts[parts.length - 2];
      return byDir[dir] ?? null;
    },
  });

  const ids = out.map((d) => d.arxiv_id).sort();
  // held + needs_human are gone; passed + grandfathered + legacy remain.
  assert.deepEqual(ids, ["g1", "l1", "p1"]);
  assert.ok(!ids.includes("h1"), "HELD deep-read must not ship");
  assert.ok(!ids.includes("n1"), "needs-human deep-read must not ship");
});

test("collectDeepReads: still skips non-deep_read records", async () => {
  const byDir = {
    "real": { status: "deep_read", arxiv_id: "r1", cold_audit: { status: "ready_to_publish" } },
    "radar": { status: "radar", arxiv_id: "x1" },
  };
  const out = await collectDeepReads({
    contentDir: "/c/papers",
    readdirFn: async () => Object.keys(byDir).map(dirent),
    readJsonFn: async (p) => {
      const parts = p.split(/[\\/]/);
      const dir = parts[parts.length - 2];
      return byDir[dir] ?? null;
    },
  });
  assert.deepEqual(out.map((d) => d.arxiv_id), ["r1"]);
});
