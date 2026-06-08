import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { analyze, enrichFromDb } from "../columns/projects/index.mjs";
import { selectAuthoringRecords } from "../columns/projects/codex-deepdive.mjs";
import { isProjectAlreadyDeepDived } from "../columns/projects/brief-pipeline.mjs";

function candidate() {
  return {
    id: "project:owner/repo",
    column: "projects",
    source: "github-trending:daily",
    raw: {
      fullName: "owner/repo",
      owner: "owner",
      name: "repo",
      url: "https://github.com/owner/repo",
      description: "Deep candidate",
      windows: ["daily"],
    },
  };
}

function triage() {
  return {
    candidateId: "project:owner/repo",
    decision: "radar",
    mode: "deterministic-radar",
    score: 90,
    final_depth: "deep",
    depth_decision: {
      final_depth: "deep",
      max_allowed_depth: "deep",
      needs_enrichment: false,
      recommended_action: "deep_dive",
    },
  };
}

function briefWikiRow(tierTemplate) {
  return {
    id: "brief-row",
    tier: "brief-wiki",
    payload: {
      repo: "owner/repo",
      slug: "repo",
      final_depth: "deep",
      tier_template: tierTemplate,
    },
  };
}

const emptyTierTemplate = {
  pain_point: "数据不足",
  comparison: "数据不足",
  how_it_works_with_analogy: "数据不足",
  essential_design_difference: "数据不足",
  practitioner_meaning: "数据不足",
};

const authoredTierTemplate = {
  ...emptyTierTemplate,
  pain_point: "这个项目解决的是多工具代理在真实仓库中缺少可审计执行链的问题。",
};

function dbWith(row) {
  return {
    listAnalyses(candidateId) {
      assert.equal(candidateId, "project:owner/repo");
      return row ? [row] : [];
    },
  };
}

function dbForEnrich({ briefWikiRow: row, lightPayload }) {
  return {
    listAnalyses(candidateId) {
      assert.equal(candidateId, "project:owner/repo");
      return [
        {
          id: "light-latest",
          tier: "light",
          generatedAt: "2026-06-08T18:04:52.797Z",
          payload: lightPayload,
        },
        {
          ...row,
          generatedAt: "2026-06-08T14:00:33.831Z",
        },
      ];
    },
    getQaVerdict() {
      return null;
    },
    getEval() {
      return { score: 10 };
    },
  };
}

function durableMarkdownBriefWikiRow() {
  const dir = mkdtempSync(path.join(tmpdir(), "project-brief-wiki-"));
  const deepDive = path.join(dir, "owner-repo-deep-dive.md");
  writeFileSync(deepDive, `---
kind: "deep-dive"
project_type: "agent_framework"
tier_template:
  tier: 3
  pain_point: "authored pain"
  comparison: "authored comparison"
  how_it_works_with_analogy: "authored mechanism"
  essential_design_difference: "authored design"
  practitioner_meaning: "authored meaning"
---

## Deep
`, "utf8");
  return {
    id: "brief-row",
    tier: "brief-wiki",
    payload: {
      repo: "owner/repo",
      slug: "owner-repo",
      final_depth: "deep",
      depth_decision: {
        final_depth: "deep",
        project_tier: 3,
        project_tier_label: "Tier 3",
      },
      paths: {
        "deep-dives/owner-repo-deep-dive.md": deepDive,
      },
      rawPayload: path.join(dir, "missing-author-payload.json"),
    },
  };
}

test("empty brief-wiki deep-dive rows are not treated as already completed", async () => {
  const item = { candidate: candidate(), eval: triage() };
  const db = dbWith(briefWikiRow(emptyTierTemplate));

  assert.equal(isProjectAlreadyDeepDived(item.candidate, { db }), false);

  const result = await analyze(item, {}, {
    logger: { info() {}, warn() {} },
    options: { projectBriefWiki: true, db },
  });

  assert.equal(result.status, "pending_codex_authoring");
  assert.notEqual(result.status, "already_deep_dived");
});

test("authored tier_template rows are treated as completed deep-dives", async () => {
  const item = { candidate: candidate(), eval: triage() };
  const db = dbWith(briefWikiRow(authoredTierTemplate));

  assert.equal(isProjectAlreadyDeepDived(item.candidate, { db }), true);

  const result = await analyze(item, {}, {
    logger: { info() {}, warn() {} },
    options: { projectBriefWiki: true, db },
  });

  assert.equal(result.status, "already_deep_dived");
});

test("codex-deepdive auto-selection retries failed empty brief-wiki rows", () => {
  const failed = {
    candidate: candidate(),
    repo: candidate().raw,
    finalDepth: "deep",
    briefWikiRow: briefWikiRow(emptyTierTemplate),
  };
  const completed = {
    ...failed,
    briefWikiRow: briefWikiRow(authoredTierTemplate),
  };

  assert.deepEqual(selectAuthoringRecords([failed], {}).map((record) => record.repo.fullName), ["owner/repo"]);
  assert.deepEqual(selectAuthoringRecords([completed], {}), []);
});

test("durable brief-wiki markdown marks older deep-dives completed when raw codex logs are gone", () => {
  const row = durableMarkdownBriefWikiRow();
  const db = dbWith(row);

  assert.equal(isProjectAlreadyDeepDived(candidate(), { db }), true);
});

test("authored brief-wiki content overrides newer light rows during publish enrichment", () => {
  const row = durableMarkdownBriefWikiRow();
  const lightPayload = {
    tldr: "new light",
    light: "new light",
    ranking_score: 10,
    worthDeepDive: 10,
    final_depth: "light",
    project_tier: 1,
    tier_template: emptyTierTemplate,
    depth_decision: {
      final_depth: "light",
      project_tier: 1,
    },
  };

  const enriched = enrichFromDb(dbForEnrich({ briefWikiRow: row, lightPayload }), candidate());

  assert.equal(enriched.light.final_depth, "deep");
  assert.equal(enriched.light.project_tier, 3);
  assert.equal(enriched.light.depth_decision.final_depth, "deep");
  assert.equal(enriched.light.tier_template.comparison, "authored comparison");
  assert.equal(enriched.briefSlug, "owner-repo");
});
