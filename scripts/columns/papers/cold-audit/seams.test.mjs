// Unit tests for the cold-audit seams: buildPrompt (author/revise), buildAuditPrompt
// (two-stage), loadSource, loadArtifact. Pure string/object builders — no CLI/network.
// Run: node --test scripts/columns/papers/cold-audit/seams.test.mjs

import assert from "node:assert/strict";
import test from "node:test";

import {
  CRITERIA,
  GOLD_SAMPLE_DIR,
  buildPrompt,
  buildStageAPrompt,
  buildStageBPrompt,
  loadArtifact,
  loadSource,
} from "./seams.mjs";

const PAPER = {
  arxivId: "2606.02060",
  title: "DRIFT span-level error localization",
  sourceUrl: "https://huggingface.co/papers/2606.02060",
  paperUrl: "https://arxiv.org/abs/2606.02060",
  codeUrl: "https://github.com/NJU-LINK/DRIFT",
  contentDir: "content/papers/2606.02060-drift",
};

// ---- buildPrompt (author / revise) -----------------------------------------

test("buildPrompt round 1: instructs full-source authoring, names repo + gold sample", () => {
  const prompt = buildPrompt(PAPER, { round: 1, fixes: [], prevArtifact: null });
  assert.match(prompt, /第 1 轮/);
  assert.match(prompt, /FULL 全文/);
  assert.match(prompt, /NJU-LINK\/DRIFT/); // repo to clone
  assert.match(prompt, new RegExp(GOLD_SAMPLE_DIR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(prompt, /status:"deep_read"/);
  // round 1 must NOT contain a revise/fixes section
  assert.doesNotMatch(prompt, /需修复/);
});

test("buildPrompt round 2: embeds auditor fixes + prev artifact, demands targeted revise", () => {
  const fixes = ["[faithful] 编造 92% → 删除该数字,引到 Table 2", "[concrete] 停在类目层 → 补真实 config"];
  const prompt = buildPrompt(PAPER, {
    round: 2,
    fixes,
    prevArtifact: { paperMdx: "上一版正文……", careerMdx: "职业栏……" },
  });
  assert.match(prompt, /第 2 轮/);
  assert.match(prompt, /需修复/);
  assert.match(prompt, /编造 92%/);
  assert.match(prompt, /补真实 config/);
  assert.match(prompt, /别整篇重写|别动已通过/); // targeted, not wholesale
  assert.match(prompt, /上一版正文/); // prev artifact embedded
});

test("buildPrompt round 2 with no fixes: falls back to five-criteria self-check", () => {
  const prompt = buildPrompt(PAPER, { round: 2, fixes: [], prevArtifact: null });
  assert.match(prompt, /retellable\/faithful\/mechanism\/concrete\/judgment/);
});

// ---- buildStageAPrompt / buildStageBPrompt (TWO-CALL blind audit) -----------

test("buildStageAPrompt: BLIND — embeds the artifact but contains NO source text at all", () => {
  const artifact = { paperMdx: "## 一句话\n深读正文 ARTIFACT_MARKER", careerMdx: "职业角度", metadata: { scores: {} } };
  const sourceMarker = "FULL_PAPER_SOURCE_TEXT_MARKER";
  const prompt = buildStageAPrompt(artifact, { round: 1, paper: PAPER });

  // forbids author context + names itself the blind first stage
  assert.match(prompt, /独立冷审/);
  assert.match(prompt, /不许复用作者/);
  assert.match(prompt, /Stage A/);
  assert.match(prompt, /盲读/);
  // the artifact IS embedded (the auditor must retell it)
  assert.ok(prompt.includes("ARTIFACT_MARKER"), "artifact embedded in Stage A");
  // STRUCTURAL BLINDNESS: the source must NOT appear anywhere in the Stage A prompt.
  assert.ok(!prompt.includes(sourceMarker), "Stage A prompt must contain NO source");
  assert.ok(!prompt.includes("原始来源"), "Stage A prompt must not even mention the original source section");
  // Stage A only asks for the stageA JSON; no perCriterion/verdict in the blind call.
  assert.match(prompt, /"stageA"/);
  assert.ok(!prompt.includes("perCriterion"), "Stage A must not solicit perCriterion");
});

test("buildStageBPrompt: open-book — embeds artifact + source + the committed stageA, demands JSON", () => {
  const artifact = { paperMdx: "## 一句话\n深读正文", careerMdx: "职业角度", metadata: { scores: {} } };
  const source = { fullText: "FULL PAPER TEXT", fullTextUrl: PAPER.paperUrl, repoUrl: PAPER.codeUrl, available: true };
  const stageA = { retell: "盲读复述内容 STAGEA_MARKER", confusions: ["没懂A"] };
  const prompt = buildStageBPrompt(artifact, source, stageA, { round: 1, paper: PAPER });

  // (a) forbid reusing author context
  assert.match(prompt, /独立冷审/);
  assert.match(prompt, /不许复用作者/);
  // (b) Stage B carries the FIXED stageA so it can only diff (not retro-fit) the blind retell
  assert.match(prompt, /Stage B/);
  assert.ok(prompt.includes("STAGEA_MARKER"), "committed stageA embedded in Stage B");
  assert.match(prompt, /不许改它|不可改/);
  // (c) strict JSON only
  assert.match(prompt, /严格 JSON/);
  assert.match(prompt, /"perCriterion"/);
  assert.match(prompt, /"verdict": "pass\|revise\|hold"/);
  // (d) rubric criteria + gold sample + all-5 requirement
  for (const c of CRITERIA) assert.ok(prompt.includes(c), `criterion ${c} named in Stage B prompt`);
  assert.match(prompt, new RegExp(GOLD_SAMPLE_DIR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(prompt, /一个都不能少/); // must emit all 5 criteria
  // gate keys off severity:major, not the verdict label
  assert.match(prompt, /以 severity=major 为准/);
  // the artifact + source are both embedded
  assert.match(prompt, /深读正文/);
  assert.match(prompt, /FULL PAPER TEXT/);
});

test("buildStageBPrompt: when source unavailable, instructs no-fabrication on the gap", () => {
  const artifact = "整篇深读字符串";
  const source = { fullText: "", available: false, note: "全文未取到", repoUrl: "" };
  const prompt = buildStageBPrompt(artifact, source, { retell: "x", confusions: [] }, { round: 2, paper: PAPER });
  assert.match(prompt, /全文未取到/);
  assert.match(prompt, /数据不足/);
  assert.match(prompt, /round=2/);
});

// ---- loadSource (mocked fetch) ---------------------------------------------

test("loadSource: returns full text + repo url, available=true", async () => {
  const src = await loadSource(PAPER, {
    fetchFullText: async () => ({ text: "x".repeat(500), url: PAPER.paperUrl, kind: "html" }),
  });
  assert.equal(src.available, true);
  assert.equal(src.fullText.length, 500);
  assert.equal(src.fullTextKind, "html");
  assert.equal(src.repoUrl, PAPER.codeUrl);
});

test("loadSource: caps to maxChars", async () => {
  const src = await loadSource(PAPER, {
    fetchFullText: async () => ({ text: "y".repeat(10000), url: "u", kind: "pdf" }),
    maxChars: 100,
  });
  assert.equal(src.fullText.length, 100);
});

test("loadSource: fetch failure → available=false + honest note, never throws", async () => {
  const src = await loadSource(PAPER, {
    fetchFullText: async () => {
      throw new Error("arXiv 429");
    },
    logger: { warn() {} },
  });
  assert.equal(src.available, false);
  assert.equal(src.fullText, "");
  assert.match(src.note, /未取到/);
  // repo url still surfaced for the limited Stage B
  assert.equal(src.repoUrl, PAPER.codeUrl);
});

test("loadSource: null fetch result → available=false", async () => {
  const src = await loadSource(PAPER, { fetchFullText: async () => null });
  assert.equal(src.available, false);
  assert.equal(src.fullTextUrl, PAPER.paperUrl); // falls back to paper url
});

// ---- loadArtifact (mocked read) --------------------------------------------

test("loadArtifact: reads paper.mdx + career.mdx + metadata.json", async () => {
  const files = {
    "paper.mdx": "# Paper\n正文",
    "career.mdx": "# Career\n职业",
    "metadata.json": JSON.stringify({ status: "deep_read", arxiv_id: "2606.02060" }),
  };
  const art = await loadArtifact("content/papers/x", {
    readFileFn: async (p) => {
      const base = p.split(/[\\/]/).pop();
      if (base in files) return files[base];
      throw new Error(`ENOENT ${p}`);
    },
  });
  assert.match(art.paperMdx, /正文/);
  assert.match(art.careerMdx, /职业/);
  assert.equal(art.metadata.arxiv_id, "2606.02060");
});

test("loadArtifact: missing files degrade to empty strings, not throw", async () => {
  const art = await loadArtifact("content/papers/missing", {
    readFileFn: async () => {
      throw new Error("ENOENT");
    },
  });
  assert.equal(art.paperMdx, "");
  assert.equal(art.careerMdx, "");
  assert.deepEqual(art.metadata, {});
});
