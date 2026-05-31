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
  assert.ok(out.deepDive.fdeTakeaways.artifactsToAudit.some((item) => item.includes("OpenAPI specs")));
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

test("deep analysis normalizes iteration-2 workbench credibility fields", () => {
  const scorecard = [
    "FDE relevance",
    "engineering realism",
    "problem importance",
    "method novelty",
    "evidence strength",
    "reproducibility",
    "deployability",
    "security governance",
    "roi explainability",
    "career training value",
  ].map((dimension) => ({
    dimension,
    score: 7,
    reason: "The paper has useful system evidence.",
  }));

  const out = normalizeAnalysis({
    ...raw,
    paperType: "benchmark",
    venueStatus: "verified",
    scorecard,
    deepDive: {
      reframe: "The paper is a benchmark for production workflow reliability.",
      contributionLayers: [
        {
          layer: "Benchmark result",
          claim: "The system reports a measured pass@1 result.",
          evidence: "Table 1 reports pass@1.",
          judgment: "The result is useful but benchmark-bound.",
          fdeMeaning: "Use it as a pilot eval pattern, not as a customer ROI proof.",
        },
      ],
      mechanism: "It connects API workflow traces to benchmark outcomes.",
      evidenceChain: [],
      audit: [
        {
          claim: "The paper uses https://github.com/vendor/baseline as a baseline implementation.",
          finding: "github.com repository page is reachable; no obvious archived warning was detected.",
          source: "https://github.com/vendor/baseline",
        },
      ],
      claimLedger: [
        {
          claim: "The system reports 42% pass@1 on the benchmark.",
          claimType: "empirical",
          evidencePointer: "Table 1",
          evidenceStrength: "high",
          threat: "The result may be benchmark-bound.",
          fdeTransfer: "Use the metric shape for customer golden tasks.",
        },
        {
          claim: "The result implies fewer customer incidents.",
          claimType: "fde_extrapolation",
          evidencePointer: "Figure 99",
          evidenceStrength: "high",
          threat: "This is not directly proven by the paper.",
          fdeTransfer: "Validate in a pilot before using it as a delivery claim.",
        },
      ],
      evidenceMatrix: [
        {
          experiment: "Main benchmark",
          sampleSize: "128 tasks",
          modelBackend: "Tool-calling LLM",
          metric: "pass@1",
          result: "42%",
          exactness: "exact",
          limitation: "Only the benchmark distribution is measured.",
        },
        {
          experiment: "Unsupported row",
          metric: "success",
          result: "99%",
          exactness: "exact",
          limitation: "This number is not in fetched text.",
        },
      ],
      artifactAudit: {
        officialCode: "verified",
        data: "available",
        reproducibility: "full",
        notes: ["Repository page is reachable."],
      },
      loadBearingClaim: "Benchmark gains must transfer to workflow reliability.",
      strongestEvidence: [],
      limitations: ["Artifact availability is stated by the paper."],
      suggestedExperiments: [],
      fdeTakeaways: {
        customerProblem: "Customers need reliable production workflow automation.",
        customerQuestions: [
          "Which workflow owns the output?",
          "Which endpoint can fail?",
          "Who approves exceptions?",
          "Which traces are retained?",
          "Which policy blocks launch?",
        ],
        artifactsToAudit: ["OpenAPI specs"],
        implementationChecklist: ["Map endpoints and error states."],
        evalPlan: ["Run an A/B test on golden workflow tasks."],
        rolloutPlan: ["Pilot with human approval before limited production."],
        riskRegister: ["Cost and latency may erase the value."],
        roiHypothesis: "This can improve task success by 50% and reduce cost by 20%.",
        interviewStory: "Translate the benchmark into a customer eval and rollout story.",
      },
    },
  }, {
    candidate: {
      id: "iteration-2",
      raw: {
        ...cand.raw,
        title: "Production Workflow Reliability Benchmark",
        abstract: "A production workflow API endpoint observability deployment benchmark.",
      },
    },
    tier: "deep",
    evidence: {
      kind: "paper-text",
      content: "Section 3 Experiments. Table 1 reports pass@1 = 42% on 128 tasks. The paper uses https://github.com/vendor/baseline as a baseline implementation. The setup covers production workflow API endpoint observability deployment.",
    },
    evaluation: {
      decision: "deep_dive",
      score: 85,
      selection: { track: ["AI Application Engineering / FDE"] },
    },
    now: () => "2026-05-30T00:00:00Z",
  });

  assert.equal(out.paperType, "benchmark");
  assert.equal(out.venueStatus, "verified");
  assert.equal(out.deepDive.verdict.readDecision, "must_read");
  assert.equal(out.deepDive.claimLedger[0].evidencePointer, "Table 1");
  assert.equal(out.deepDive.claimLedger[1].claimType, "fde_extrapolation");
  assert.equal(out.deepDive.claimLedger[1].evidencePointer, "not specified in fetched text");
  assert.equal(out.deepDive.evidenceMatrix.length, 1);
  assert.equal(out.deepDive.evidenceMatrix[0].exactness, "exact");
  assert.equal(out.deepDive.artifactAudit.officialCode, "third_party_only");
  assert.equal(out.deepDive.artifactAudit.reproducibility, "third_party_only");
  assert.ok(out.deepDive.artifactAudit.notes.some((note) => /not treated as the authors' official code release/.test(note)));
  assert.ok(out.deepDive.whatWouldInvalidate.length >= 3);
  assert.doesNotMatch(out.deepDive.fdeTakeaways.roiHypothesis, /50%|20%/);
  assert.match(out.deepDive.fdeTakeaways.roiHypothesis, /A\/B test/);
  assert.ok(out.scorecard.every((item) => /Not higher because/.test(item.reason)));
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
