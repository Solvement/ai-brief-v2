import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAnalysis, backfillSelectionAudit, maxTokens } from "../columns/papers/analyze.mjs";

const cand = {
  id: "h",
  raw: {
    title: "Agent Harness Engineering: A Survey",
    authors: "双盲匿名",
    venue: "ICLR 2026 Oral",
    sourceUrl: "https://openreview.net/pdf?id=3hXEPbG0dh",
    sourceName: "OpenReview",
    publishedAt: "2026-05-25T00:00:00.000Z",
    updatedAt: "2026-05-25T00:00:00.000Z",
    tags: ["agent harness", "observability"],
  },
};

const baseOpts = (overrides = {}) => ({
  candidate: cand,
  evidence: { kind: "paper-text", content: "" },
  now: () => "2026-06-01T00:00:00Z",
  ...overrides,
});

test("normalizeAnalysis emits the two-stage schema with server fields", () => {
  const out = normalizeAnalysis({
    leadJudgment: "本文把可靠性瓶颈定位在 harness 而非模型。",
    meta: { paperType: "survey", venueStatus: "verified", tags: ["harness"] },
    originalReading: [
      { heading: "引言", summary: "作者综述了智能体 harness 的组成与其在可靠性中的角色。" },
    ],
    analystNotes: "这篇综述的承重主张是 harness 决定上限，但缺少对照实验，证据偏弱。",
    limitsAndFuture: { paperStated: "可观测/治理研究薄", evidenceNotes: "综述无实验" },
  }, baseOpts({ evidence: { kind: "paper-text", content: "agent harness reliability survey" } }));

  assert.equal(out.tier, "deep");
  assert.equal(out.verifiedAt, "2026-06-01T00:00:00Z");
  assert.equal(out.title, cand.raw.title);
  assert.equal(out.provenance.sourceUrl, cand.raw.sourceUrl);
  assert.ok(out.originalReading.length >= 1 && out.originalReading[0].heading && out.originalReading[0].summary);
  assert.ok(typeof out.analystNotes === "string" && out.analystNotes.length > 0);
  assert.equal(out.meta.paperType, "survey");
  assert.equal(out.meta.venueStatus, "verified");
  // No removed-module fields leak through.
  assert.equal(out.deepDive, undefined);
  assert.equal(out.scorecard, undefined);
  assert.equal(out.verdict, undefined);
});

test("Stage-1 strips score/verdict language from summaries (faithful)", () => {
  const out = normalizeAnalysis({
    originalReading: [{ heading: "结论", summary: "值得一读。本文给出方法对比，打分：88 分。" }],
    analystNotes: "ok",
  }, baseOpts({ evidence: { kind: "paper-text", content: "method comparison" } }));
  const summary = out.originalReading[0].summary;
  assert.doesNotMatch(summary, /值得一读/);
  assert.doesNotMatch(summary, /打分/);
});

test("keyResults are capped at 5 across the whole paper", () => {
  const letter = "abcdefgh";
  const mkResults = (n) => Array.from({ length: n }, (_, k) => ({ kind: "result", ref: `R-${letter[k]}`, finding: `finding ${letter[k]} no-number` }));
  const out = normalizeAnalysis({
    originalReading: [
      { heading: "A", summary: "节 A", keyResults: mkResults(4) },
      { heading: "B", summary: "节 B", keyResults: mkResults(4) },
    ],
    analystNotes: "ok",
  }, baseOpts({ evidence: { kind: "paper-text", content: "x" } }));
  const total = out.originalReading.reduce((s, sec) => s + (sec.keyResults?.length || 0), 0);
  assert.equal(total, 5);
});

test("keyResults with unsupported numbers are dropped (RULES §6)", () => {
  const out = normalizeAnalysis({
    originalReading: [{
      heading: "实验",
      summary: "实验小节。",
      keyResults: [
        { kind: "table", ref: "Table 1", finding: "pass rate 达到 66%" },     // supported
        { kind: "result", ref: "Result", finding: "准确率高达 99.9%" },         // 99.9 not in evidence
      ],
    }],
    analystNotes: "ok",
  }, baseOpts({ evidence: { kind: "paper-text", content: "Table 1 reports pass rate 66% on the benchmark." } }));
  const refs = out.originalReading[0].keyResults.map((k) => k.ref);
  assert.deepEqual(refs, ["Table 1"]);
});

test("analystNotes is required — missing input yields a grounded fallback", () => {
  const out = normalizeAnalysis({
    originalReading: [{ heading: "A", summary: "节 A。" }],
  }, baseOpts({ evidence: { kind: "paper-text", content: "x" } }));
  assert.ok(typeof out.analystNotes === "string" && out.analystNotes.length > 0);
});

test("selectionAudit: discoverySource differs from primaryEvidenceSource", () => {
  const out = normalizeAnalysis({ originalReading: [{ heading: "A", summary: "节 A。" }], analystNotes: "ok" },
    baseOpts({ evaluation: { score: 82, reason: "selected", selection: { convergence: ["OpenReview"] } } }));
  const audit = out.selectionAudit;
  assert.notEqual(audit.discoverySource.toLowerCase(), audit.primaryEvidenceSource.toLowerCase());
  for (const f of ["venuePrestige", "citationConvergence", "novelty", "recency", "evidenceStrength", "reproducibility"]) {
    assert.ok(f in audit.weightedFactors, `missing factor ${f}`);
  }
  // evidenceStrength/reproducibility start unknown at analyze time.
  assert.equal(audit.weightedFactors.evidenceStrength, "unknown");
  assert.equal(audit.weightedFactors.reproducibility, "unknown");
});

test("backfillSelectionAudit fills evidenceStrength/reproducibility post-deep", () => {
  const out = normalizeAnalysis({
    originalReading: [{
      heading: "实验", summary: "实验小节。",
      keyResults: [{ kind: "table", ref: "Table 1", finding: "pass rate 66%" }],
    }],
    analystNotes: "代码已开源在 github 上。",
    meta: { paperType: "benchmark", venueStatus: "verified" },
  }, baseOpts({ evidence: { kind: "paper-text", content: "Table 1 pass rate 66% github.com/x/y" } }));

  backfillSelectionAudit(out, { candidateCount: 12, selectedCount: 3 });
  assert.notEqual(out.selectionAudit.weightedFactors.evidenceStrength, "unknown");
  assert.notEqual(out.selectionAudit.weightedFactors.reproducibility, "unknown");
  assert.equal(out.selectionAudit.candidateCount, 12);
  assert.equal(out.selectionAudit.selectedCount, 3);
});

test("offline fallback yields a valid two-stage shape from evidence only", () => {
  const out = normalizeAnalysis(null, baseOpts({ evidence: { kind: "paper-text", content: "abstract about agent harness reliability" } }));
  assert.ok(out.leadJudgment && out.originalReading.length >= 1);
  assert.ok(out.analystNotes.length > 0);
  assert.equal(out.tier, "deep");
  assert.ok(out.meta.paperType);
});

test("deep maxTokens floor is at least 12000", () => {
  assert.ok(maxTokens({}, {}) >= 12000);
});
