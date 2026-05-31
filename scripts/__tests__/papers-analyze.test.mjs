import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAnalysis } from "../columns/papers/analyze.mjs";

const raw = {
  leadJudgment: "可靠性的瓶颈是 harness，不是模型。",
  sections: [{ heading: "它赌的那句话", summary: "harness 决定上限。", loadBearing: "归因推论是承重墙" }],
  limitsAndFuture: { paperStated: "可观测/治理研究薄", evidenceNotes: "综述无实验，靠3个引用" },
};

const cand = {
  id: "h",
  raw: {
    title: "Agent Harness Engineering: A Survey",
    authors: "双盲匿名",
    venue: "TMLR · 在审",
    sourceUrl: "https://openreview.net/pdf?id=3hXEPbG0dh",
    sourceName: "OpenReview",
  },
};

test("normalize fills server fields + tier + provenance, strips verdicts", () => {
  const out = normalizeAnalysis(raw, {
    candidate: cand,
    tier: "deep",
    evidence: { kind: "paper-text" },
    now: () => "2026-05-30T00:00:00Z",
  });

  assert.equal(out.tier, "deep");
  assert.equal(out.verifiedAt, "2026-05-30T00:00:00Z");
  assert.equal(out.provenance.sourceUrl, cand.raw.sourceUrl);
  assert.ok(out.sections.length >= 1 && out.sections[0].heading && out.sections[0].summary);
  assert.equal(out.title, cand.raw.title);
});

test("offline fallback yields a valid shape from evidence only", () => {
  const out = normalizeAnalysis(null, {
    candidate: cand,
    tier: "light",
    evidence: { kind: "paper-text", content: "abstract..." },
    now: () => "2026-05-30T00:00:00Z",
  });

  assert.ok(out.leadJudgment && out.sections.length >= 1);
  assert.equal(out.tier, "light");
});
