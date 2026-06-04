import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseArgs,
  parseHuggingFaceDailyPayload,
  selectTopPapers,
  validateParadigmPayload,
} from "../columns/papers/codex-deepdive.mjs";

test("parseHuggingFaceDailyPayload reads embedded date, arXiv id, title, and upvotes", () => {
  const props = {
    dateString: "2026-06-04",
    dailyPapers: [{
      paper: {
        id: "2606.01286",
        title: "BenchEvolver: A Test Case Evolving Framework",
        summary: "A benchmark paper about coding models.",
        authors: [{ name: "Yangzhen Wu" }],
        publishedAt: "2026-06-03T00:00:00.000Z",
        submittedOnDailyAt: "2026-06-04T00:00:00.000Z",
      },
      upvotes: 73,
      numComments: 2,
      githubRepo: "https://github.com/example/repo",
    }],
  };
  const attr = JSON.stringify(props).replace(/"/g, "&quot;");
  const html = `<div class="SVELTE_HYDRATER" data-target="DailyPapers" data-props="${attr}"></div>`;

  const out = parseHuggingFaceDailyPayload(html, "https://huggingface.co/papers");

  assert.equal(out.dateString, "2026-06-04");
  assert.equal(out.papers.length, 1);
  assert.equal(out.papers[0].arxivId, "2606.01286");
  assert.equal(out.papers[0].upvotes, 73);
  assert.equal(out.papers[0].sourceUrl, "https://huggingface.co/papers/2606.01286");
  assert.equal(out.papers[0].paperUrl, "https://arxiv.org/abs/2606.01286");
});

test("parseArgs supports production top-N with a sane max", () => {
  assert.equal(parseArgs(["--limit", "5"]).limit, 5);
  assert.equal(parseArgs(["--limit", "20"]).limit, 12);
  assert.equal(parseArgs(["--limit", "7", "--max-limit", "6"]).limit, 6);
});

test("selectTopPapers sorts by HF upvotes before evaluator score", async () => {
  const papers = [
    {
      id: "low",
      title: "Reliable RAG workflow benchmark",
      abstract: "RAG benchmark evaluation workflow for AI agents.",
      arxivId: "2606.00001",
      source: "huggingface_daily",
      sourceName: "Hugging Face Daily Papers",
      sourceUrl: "https://huggingface.co/papers/2606.00001",
      paperUrl: "https://arxiv.org/abs/2606.00001",
      authors: [],
      tags: [],
      sourceSignals: ["Hugging Face Daily Papers"],
      focusTopics: ["RAG / Knowledge Systems"],
      upvotes: 3,
    },
    {
      id: "high",
      title: "Tiny unrelated model note",
      abstract: "A short AI model note.",
      arxivId: "2606.00002",
      source: "huggingface_daily",
      sourceName: "Hugging Face Daily Papers",
      sourceUrl: "https://huggingface.co/papers/2606.00002",
      paperUrl: "https://arxiv.org/abs/2606.00002",
      authors: [],
      tags: [],
      sourceSignals: ["Hugging Face Daily Papers"],
      focusTopics: ["Broad AI / ML"],
      upvotes: 10,
    },
  ];

  const selected = await selectTopPapers(papers, { limit: 1, now: () => "2026-06-04T00:00:00.000Z" });

  assert.equal(selected.length, 1);
  assert.equal(selected[0].paper.arxivId, "2606.00002");
});

test("validateParadigmPayload requires full-text trace and anchors numeric claims", () => {
  const payload = {
    meta: {
      title_result_institution_mechanism: "Title",
      one_sentence_hook: "Hook",
    },
    opening_tension: "tension",
    one_sentence_claim: "claim",
    result_first: { body: "论文报告 62.6%（来源：Table 1）" },
    lookahead: ["a", "b"],
    sections: [{
      title: "为什么这个设计成立?",
      evidence: [{ reported_number: "62.6%", source_anchor: "Table 1" }],
    }],
    meaning: { engineering: "e", methodology: "m", application_builder: "a" },
    limitations: [{ limit: "l", paper_anchor: "Section 6" }],
    closing_line: "close",
    prose_markdown: "# Title",
    numeric_claims: [{ value: "62.6%", claim: "reported", source_anchor: "Table 1" }],
    evidenceTrace: { fullTextRead: true },
  };

  assert.equal(validateParadigmPayload(payload).passed, true);
  payload.numeric_claims = [{ value: "62.6%", claim: "reported", source_anchor: "" }];
  assert.equal(validateParadigmPayload(payload).passed, false);
  assert.match(validateParadigmPayload(payload).warnings.join("\n"), /numeric_claim_unanchored/);
});
