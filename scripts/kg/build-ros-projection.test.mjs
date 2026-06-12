import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { stringify as stringifyYaml } from "yaml";

import { buildRosProjection } from "./build-ros-projection.mjs";

async function writeYaml(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, stringifyYaml(value), "utf8");
}

async function makeRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "ros-projection-"));
  const kg = path.join(root, "data", "knowledge-graph");
  await writeYaml(path.join(kg, "registry", "propositions.yaml"), [{
    id: "prop.fixture",
    statement: "Learned memory policy beats fixed hooks only under feedback.",
    support: ["paper-a.c1"],
    oppose: ["project-x.c1"],
    possible_synthesis: "hybrid controller",
    state: "open",
  }]);
  await writeYaml(path.join(kg, "registry", "problems.yaml"), [{ id: "mem.lifecycle-management" }]);
  await writeYaml(path.join(kg, "registry", "concepts.yaml"), [{ id: "mem.learned-policy-controller" }]);
  await writeYaml(path.join(kg, "registry", "benchmarks.yaml"), []);
  return root;
}

function object(slug, kind = "paper") {
  return {
    schema: "ros-v1",
    object_id: `${kind}/${slug}`,
    slug,
    kind,
    title: slug,
    one_sentence_thesis: `${slug} thesis`,
    canonical: {
      problems: ["mem.lifecycle-management"],
      concepts: ["mem.learned-policy-controller"],
      benchmarks: [],
      proposed_problems: [],
      proposed_concepts: [],
    },
    claims: [{ id: `${slug}.c1`, statement: `${slug} claim` }],
    mechanisms: [{ id: `${slug}.m1`, name: `${slug} mechanism`, problem: "mem.lifecycle-management", reusable_pattern: `${slug} pattern` }],
    assumptions: [{ id: `${slug}.a1`, statement: `${slug} assumption` }],
    failure_modes: [],
    trigger_hooks: [{ symptom: `${slug} symptom` }],
    exam_questions: [{ q: `${slug} question` }],
    self_evo_verdict: { state: "queue", reason: "fixture" },
    status: "draft",
  };
}

test("buildRosProjection aggregates paper-paper relations and filters project graph endpoints", async () => {
  const root = await makeRoot();
  const objectsDir = path.join(root, "data", "knowledge-graph", "objects");
  await writeYaml(path.join(objectsDir, "paper-a.yaml"), object("paper-a"));
  await writeYaml(path.join(objectsDir, "paper-b.yaml"), object("paper-b"));
  await writeYaml(path.join(objectsDir, "project-x.yaml"), object("project-x", "project"));
  await writeYaml(path.join(root, "data", "knowledge-graph", "relations", "derived.yaml"), [
    {
      source: { type: "object", id: "paper/paper-a" },
      target: { type: "object", id: "paper/paper-b" },
      relation_type: "shares_problem",
      derived_by: "structural_join",
      confidence: { value: "medium", reason: "same problem" },
      boundary: "",
    },
    {
      source: { type: "mechanism", id: "paper-a.m1" },
      target: { type: "mechanism", id: "paper-b.m1" },
      relation_type: "complements",
      derived_by: "llm_judgment",
      confidence: { value: "high", reason: "specific mechanisms align" },
      boundary: "fixture boundary",
    },
    {
      source: { type: "object", id: "paper/paper-a" },
      target: { type: "object", id: "project/project-x" },
      relation_type: "tension_with",
      derived_by: "structural_join",
      confidence: { value: "high", reason: "project must not project" },
    },
  ]);
  await writeYaml(path.join(root, "data", "knowledge-graph", "relations", "judged.yaml"), []);

  const projection = await buildRosProjection({ root });
  assert.deepEqual(projection.graph.nodes.map((node) => node.id), ["paper/paper-a", "paper/paper-b"]);
  assert.equal(projection.objectFiles.has("project-x.json"), false);
  assert.equal(projection.graph.edges.length, 1);
  assert.equal(projection.graph.edges[0].primary_type, "complements");
  assert.equal(projection.graph.edges[0].confidence, "high");
  assert.equal(projection.graph.edges[0].count, 2);
  assert.equal(projection.graph.propositions[0].oppose[0].owner_kind, "project");
  assert.equal(projection.graph.propositions[0].oppose[0].owner, "project-x");
});
