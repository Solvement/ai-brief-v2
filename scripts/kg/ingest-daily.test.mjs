// Unit tests for the daily KG ingest stage's pure logic (selection / slug / yaml extract / precheck).
// Run: node --test scripts/kg/ingest-daily.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

import { buildFacetPrompt, extractYaml, facetSlugFromDir, precheckFacet, selectUnfaceted } from "./ingest-daily.mjs";

const rec = (dirName, coldStatus, status = "deep_read") => ({
  dirName,
  contentDir: `/fake/${dirName}`,
  metadata: { arxiv_id: (/(\d{4}\.\d{4,5})/.exec(dirName) || [])[1], status, ...(coldStatus ? { cold_audit: { status: coldStatus } } : {}) },
});

test("selectUnfaceted: only ready_to_publish, skips faceted/needs_human/hold/grandfathered", () => {
  const records = [
    rec("2606.0001-pass-new", "ready_to_publish"),
    rec("2606.0002-already-faceted", "ready_to_publish"),
    rec("2606.0003-pending", "needs_human"),
    rec("2606.0004-held", "hold"),
    rec("2606.0005-old", "grandfathered"),
    rec("2606.0006-radar", "ready_to_publish", "radar"),
  ];
  const { selected, skipped } = selectUnfaceted(records, new Set(["2606.0002"]), { cap: 5 });
  assert.deepEqual(selected.map((r) => r.dirName), ["2606.0001-pass-new"]);
  assert.equal(skipped.find((s) => s.dirName === "2606.0002-already-faceted").reason, "already-faceted");
  assert.equal(skipped.find((s) => s.dirName === "2606.0004-held").reason, "gate=hold");
});

test("selectUnfaceted: cap + overflow; grandfathered included only in backfill mode", () => {
  const records = [rec("2606.0001-a", "ready_to_publish"), rec("2606.0002-b", "ready_to_publish"), rec("2606.0003-old", "grandfathered")];
  const daily = selectUnfaceted(records, new Set(), { cap: 1 });
  assert.deepEqual(daily.selected.map((r) => r.dirName), ["2606.0001-a"]);
  assert.deepEqual(daily.overflow, ["2606.0002-b"]);
  const backfill = selectUnfaceted(records, new Set(), { cap: 5, includeGrandfathered: true });
  assert.equal(backfill.selected.length, 3);
});

test("selectUnfaceted: --paper pins a single paper regardless of order", () => {
  const records = [rec("2606.0001-a", "ready_to_publish"), rec("2402.16823-gptswarm-agents-as-graphs", "grandfathered")];
  const out = selectUnfaceted(records, new Set(), { cap: 5, includeGrandfathered: true, paperId: "2402.16823" });
  assert.deepEqual(out.selected.map((r) => r.dirName), ["2402.16823-gptswarm-agents-as-graphs"]);
});

test("facetSlugFromDir: strips arxiv prefix, takes first token, dedupes on collision", () => {
  assert.equal(facetSlugFromDir("2605.29307-grepseek-dci-search-agent"), "grepseek");
  assert.equal(facetSlugFromDir("2402.16823-gptswarm-agents-as-graphs"), "gptswarm");
  assert.equal(facetSlugFromDir("2606.06087-latentskill-weight-space-skills", new Set(["latentskill"])), "latentskill-260606087");
});

test("extractYaml: yaml fence, bare fence with schema, and raw passthrough", () => {
  assert.equal(extractYaml("text\n```yaml\nschema: v2\nslug: x\nstatus: extracted\n```\nmore"), "schema: v2\nslug: x\nstatus: extracted");
  assert.equal(extractYaml("noise before\nschema: v2\nslug: x"), "schema: v2\nslug: x");
  assert.ok(extractYaml("# comment\nschema: v2\nslug: y").startsWith("# comment"));
});

test("extractYaml: inner mermaid fence must NOT truncate the document (2026-06-10 live failure)", () => {
  const doc = [
    "schema: v2",
    "slug: x",
    "facets:",
    "  architecture: |",
    "    ```mermaid",
    "    flowchart TD",
    "      A --> B",
    "    ```",
    "core_concepts:",
    "  - name: a",
    "    role: primary",
    "    evidence: e",
    "edges: []",
    "status: extracted",
  ].join("\n");
  const out = extractYaml("Here is the facet:\n```yaml\n" + doc + "\n```\nHope this helps!");
  assert.ok(out.includes("```mermaid"), "mermaid fence survived");
  assert.ok(out.includes("core_concepts:"), "content after architecture survived");
  assert.ok(out.trim().endsWith("status: extracted"), "ends at status line");
  assert.ok(!out.includes("Hope this helps"), "trailing prose stripped");
});

test("precheckFacet: catches the gate-relevant violations", () => {
  const good = {
    schema: "v2",
    node_id: "paper:2402.16823",
    slug: "gptswarm",
    facets: { problem_solved: "y", method: "x", result: "z", innovation: "i", weakness: "w", transfer: "t" },
    core_concepts: [
      { name: "a", role: "primary", evidence: "e1" },
      { name: "b", role: "supporting", evidence: "e2" },
      { name: "c", role: "primary", evidence: "e3" },
    ],
    discovery_trace: "数据不足",
    edges: [],
  };
  assert.deepEqual(precheckFacet(good, { nodeId: "paper:2402.16823", slug: "gptswarm" }), []);

  const bad = structuredClone(good);
  bad.discovery_trace = { hypothesis: "h", failed_attempts: "f" }; // missing source_span
  bad.edges = [{ type: "extends", to: "x" }]; // auto-ingest must not propose edges
  bad.core_concepts = good.core_concepts.slice(0, 2); // too few
  const errors = precheckFacet(bad, { nodeId: "paper:2402.16823", slug: "gptswarm" });
  assert.ok(errors.some((e) => e.includes("source_span")));
  assert.ok(errors.some((e) => e.includes("NO_EDGE")));
  assert.ok(errors.some((e) => e.includes("3-5")));
});

test("buildFacetPrompt embeds hard rules, vocab, example, and the paper", () => {
  const p = buildFacetPrompt({ nodeId: "paper:1", slug: "s", dirName: "d", paperMdx: "PAPER-BODY", vocabJson: "[VOCAB]", exampleYaml: "EXAMPLE" });
  for (const must of ["node_id: paper:1", "slug: s", "PAPER-BODY", "[VOCAB]", "EXAMPLE", "source_span", "NO_EDGE", "逐字短语"]) {
    assert.ok(p.includes(must), `prompt missing ${must}`);
  }
});
