import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { openAiBriefDb, sqliteDriverDecision } from "../lib/db.mjs";

test("db schema roundtrips candidate evidence eval analysis qa and run rows", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ai-brief-db-"));
  const dbPath = path.join(dir, "ai-brief.db");
  const db = await openAiBriefDb(dbPath);

  try {
    const decision = await sqliteDriverDecision();
    assert.equal(decision.name, "node:sqlite");

    const candidate = db.upsertCandidate({
      id: "cand-1",
      column: "projects",
      source: "github-trending",
      dedupeKey: "owner/repo",
      raw: { fullName: "owner/repo", stars: 123 },
      discoveredAt: "2026-05-29T00:00:00.000Z",
    });
    assert.deepEqual(candidate.raw, { fullName: "owner/repo", stars: 123 });
    assert.equal(candidate.column, "projects");

    const evidence = db.upsertEvidence({
      candidateId: "cand-1",
      kind: "readme",
      content: "# Repo\nUseful AI engineer project.",
      fetchedAt: "2026-05-29T01:00:00.000Z",
    });
    assert.equal(evidence.kind, "readme");
    assert.equal(db.listEvidence("cand-1").length, 1);

    const evaluation = db.upsertEval({
      candidateId: "cand-1",
      decision: "select",
      mode: "rank",
      score: 88,
      signals: ["agent", "eval"],
      reason: "Strong learning value",
      evaluatedAt: "2026-05-29T02:00:00.000Z",
    });
    assert.deepEqual(evaluation.signals, ["agent", "eval"]);
    assert.equal(evaluation.score, 88);

    const analysis = db.insertAnalysis({
      id: "analysis-1",
      candidateId: "cand-1",
      tier: "deep",
      payload: { atGlance: "Deep analysis", claims: [{ text: "README-backed", sourceUrl: "https://example.com" }] },
      model: "deepseek-v4-pro",
      generatedAt: "2026-05-29T03:00:00.000Z",
    });
    assert.equal(analysis.payload.claims[0].text, "README-backed");
    assert.equal(db.listAnalyses("cand-1").length, 1);

    const qa = db.upsertQaVerdict({
      analysisId: "analysis-1",
      structuralPass: true,
      groundedScore: 0.91,
      flags: [],
      verdict: "pass",
    });
    assert.equal(qa.structuralPass, true);
    assert.equal(qa.groundedScore, 0.91);

    const run = db.recordRun({
      id: "run-1",
      column: "projects",
      stage: "discover",
      status: "pass",
      metrics: { candidates: 1 },
      ranAt: "2026-05-29T04:00:00.000Z",
    });
    assert.deepEqual(run.metrics, { candidates: 1 });
    assert.equal(db.listRuns({ column: "projects" }).length, 1);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
