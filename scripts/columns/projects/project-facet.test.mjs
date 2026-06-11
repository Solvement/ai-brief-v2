import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

import {
  enqueueProjectKgIngest,
  normalizeProjectMindPalace,
  precheckProjectFacet,
} from "./project-facet.mjs";

const validFacet = {
  problem_solved: "Project deep reads need to become retrievable KG facets.",
  discovery_trace: "数据不足",
  method: "Extract a source-grounded mechanism chain and queue it for KG ingest.",
  self_evo_use: "记忆: stores project mechanisms. 理解: preserves design tradeoffs. 自进化: feeds reusable implementation patterns back into the agent.",
  core_concepts: [
    { name: "项目机制链", role: "primary", evidence: "README Architecture" },
    { name: "来源锚点", role: "supporting", evidence: "docs/evidence.md" },
    { name: "KG 入图队列", role: "supporting", evidence: "pipeline queue" },
  ],
};

test("normalizeProjectMindPalace accepts camelCase aliases and normalizes concepts", () => {
  const normalized = normalizeProjectMindPalace({
    problemSolved: validFacet.problem_solved,
    discoveryTrace: validFacet.discovery_trace,
    method: validFacet.method,
    selfEvoUse: validFacet.self_evo_use,
    coreConcepts: validFacet.core_concepts,
  });

  assert.equal(normalized.problem_solved, validFacet.problem_solved);
  assert.equal(normalized.core_concepts.length, 3);
  assert.deepEqual(precheckProjectFacet(normalized), []);
});

test("precheckProjectFacet rejects missing self_evo_use segments", () => {
  const errors = precheckProjectFacet({ ...validFacet, self_evo_use: "记忆: only storage." });
  assert.ok(errors.some((error) => error.includes("理解")));
  assert.ok(errors.some((error) => error.includes("自进化")));
});

test("enqueueProjectKgIngest appends a JSONL queued record after precheck", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "project-facet-"));
  const queueFile = path.join(dir, "queue.jsonl");
  const record = await enqueueProjectKgIngest({
    repo: { fullName: "owner/repo" },
    slug: "owner-repo",
    mindPalace: validFacet,
    sourceFile: "brief-wiki/deep-dives/owner-repo.md",
    generatedAt: "2026-06-11T12:00:00.000Z",
    queueFile,
  });

  assert.equal(record.status, "queued");
  const lines = (await readFile(queueFile, "utf8")).trim().split(/\r?\n/);
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).repo, "owner/repo");
});
