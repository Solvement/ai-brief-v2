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

test("deep FDE-relevant analysis adds grounded fdeTakeaways fallback", () => {
  const out = normalizeAnalysis({
    ...raw,
    deepDive: {
      reframe: "The paper is about production RAG workflow reliability.",
      contributionLayers: [],
      mechanism: "It treats retrieval, tool calls, and observability as system components.",
      evidenceChain: [],
      audit: [],
      loadBearingClaim: "Production RAG systems need workflow-level evaluation.",
      strongestEvidence: [],
      limitations: ["Artifact availability is stated by the paper."],
      suggestedExperiments: [],
    },
  }, {
    candidate: {
      id: "fde",
      raw: {
        ...cand.raw,
        abstract: "A production RAG workflow paper covering API endpoints, tool calls, permissions, observability, and deployment.",
      },
    },
    tier: "deep",
    evidence: {
      kind: "paper-text",
      content: "The evidence discusses production RAG workflow integration, API endpoints, tool calls, permission checks, observability traces, and deployment gates.",
    },
    evaluation: {
      selection: { track: ["AI Application Engineering / FDE"] },
    },
    now: () => "2026-05-30T00:00:00Z",
  });

  assert.ok(out.deepDive.fdeTakeaways);
  assert.equal(out.deepDive.fdeTakeaways.questions.length, 5);
  assert.ok(out.deepDive.fdeTakeaways.checklist.some((item) => /Endpoint|input schema|response schema/.test(item)));
  assert.ok(out.deepDive.fdeTakeaways.artifactsToAudit.includes("OpenAPI specs"));
  assert.match(out.deepDive.fdeTakeaways.roiRisk, /readiness and risk-reduction/);
});

test("pure algorithm papers omit fdeTakeaways", () => {
  const out = normalizeAnalysis({
    ...raw,
    deepDive: {
      reframe: "The paper studies a transformer scaling law.",
      contributionLayers: [],
      mechanism: "It changes a pre-training optimizer and reports leaderboard movement.",
      evidenceChain: [],
      audit: [],
      loadBearingClaim: "The scaling law must transfer across model sizes.",
      strongestEvidence: [],
      limitations: ["Artifact availability is stated by the paper."],
      suggestedExperiments: [],
      fdeTakeaways: {
        questions: ["Which customer workflow should use it?"],
        checklist: ["Workflow readiness is checked."],
        artifactsToAudit: ["customer tickets"],
        roiRisk: "This would reduce deployment risk.",
      },
    },
  }, {
    candidate: {
      id: "algo",
      raw: {
        ...cand.raw,
        title: "A Scaling Law for Sparse Attention Pre-Training",
        abstract: "A pure model-scaling paper about sparse attention, optimizer changes, parameter count, and state-of-the-art leaderboard results.",
      },
    },
    tier: "deep",
    evidence: {
      kind: "paper-text",
      content: "The paper discusses scaling law, pre-training recipe, sparse attention, optimizer changes, parameter count, SOTA, and leaderboard results.",
    },
    now: () => "2026-05-30T00:00:00Z",
  });

  assert.equal(out.deepDive.fdeTakeaways, undefined);
});

test("audit normalization dedupes by URL and drops garbled or cut-off text", () => {
  const out = normalizeAnalysis({
    ...raw,
    deepDive: {
      reframe: "The paper is about production RAG workflow reliability.",
      contributionLayers: [],
      mechanism: "It treats retrieval, tool calls, and observability as system components.",
      evidenceChain: [],
      audit: [
        {
          claim: "1 1 1 Broken extracted claim.",
          finding: "github.com repository page is reachable.",
          source: "https://github.com/example/repo",
        },
        {
          claim: "Paper releases a code repository at https://github.com/example/repo.",
          finding: "github.com repository page is reachable; no obvious archived warning was detected.",
          source: "https://github.com/example/repo/",
        },
        {
          claim: "The paper names a customer workflow artifact.",
          finding: "The artifact claim is present in the fetched text.",
        },
        {
          claim: "This audit claim is cut off...",
          finding: "The finding is otherwise complete.",
          source: "https://example.com/cut",
        },
      ],
      loadBearingClaim: "Production RAG systems need workflow-level evaluation.",
      strongestEvidence: [],
      limitations: ["This limitation is cut off...", "Artifact availability is stated by the paper."],
      suggestedExperiments: [],
    },
  }, {
    candidate: {
      id: "audit",
      raw: {
        ...cand.raw,
        abstract: "A production RAG workflow paper covering API endpoints, permissions, observability, and deployment.",
      },
    },
    tier: "deep",
    evidence: { kind: "paper-text", content: "production RAG workflow API observability deployment" },
    now: () => "2026-05-30T00:00:00Z",
  });

  assert.equal(out.deepDive.audit.length, 2);
  assert.ok(out.deepDive.audit.every((item) => !/^1 1 1/.test(item.claim)));
  assert.equal(out.deepDive.audit.filter((item) => item.source?.startsWith("https://github.com/example/repo")).length, 1);
  assert.deepEqual(out.deepDive.limitations, ["Artifact availability is stated by the paper."]);
});
