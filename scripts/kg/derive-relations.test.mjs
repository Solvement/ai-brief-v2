import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import { buildDerivedRelations, deriveRelations } from "./derive-relations.mjs";

async function writeYaml(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, stringifyYaml(value), "utf8");
}

async function makeRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "ros-derive-"));
  const registry = path.join(root, "data", "knowledge-graph", "registry");
  await mkdir(registry, { recursive: true });
  await writeYaml(path.join(registry, "concepts.yaml"), [
    { id: "mem.learned-policy-controller", distinct_from: ["mem.fixed-rule-hooks"], conflicts_with: [] },
    { id: "mem.fixed-rule-hooks", distinct_from: ["mem.learned-policy-controller"], conflicts_with: [] },
  ]);
  await writeYaml(path.join(registry, "benchmarks.yaml"), [
    { id: "bench.memoryagentbench", evaluates: ["mem.lifecycle-management"] },
  ]);
  return root;
}

function object({ slug, concept, mechanismConcept = concept }) {
  return {
    schema: "ros-v1",
    object_id: `paper/${slug}`,
    slug,
    kind: "paper",
    title: slug,
    one_sentence_thesis: "fixture thesis",
    canonical: {
      problems: ["mem.lifecycle-management"],
      concepts: [concept],
      benchmarks: ["bench.memoryagentbench"],
      proposed_problems: [],
      proposed_concepts: [],
    },
    claims: [],
    mechanisms: [{
      id: `${slug}.m1`,
      canonical_concept: mechanismConcept,
      problem: "mem.lifecycle-management",
      input: "state",
      output: "action",
      operations: ["act"],
      anchor: `${slug} §2`,
    }],
    assumptions: [{
      id: `${slug}.a1`,
      statement: "assumption",
      kind: "explicit",
      anchor: `${slug} §3`,
      conflicts_hint: "opposes another memory control assumption",
    }],
    failure_modes: [],
    trigger_hooks: [],
    exam_questions: [],
    self_evo_verdict: { state: "queue", reason: "fixture" },
  };
}

test("buildDerivedRelations emits structural joins and residual queue deterministically", async () => {
  const root = await makeRoot();
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "alpha.yaml"), object({
    slug: "alpha",
    concept: "mem.learned-policy-controller",
  }));
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "beta.yaml"), object({
    slug: "beta",
    concept: "mem.learned-policy-controller",
  }));
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "gamma.yaml"), object({
    slug: "gamma",
    concept: "mem.fixed-rule-hooks",
  }));

  const first = await buildDerivedRelations({ root });
  const second = await buildDerivedRelations({ root });
  assert.equal(first.derivedYaml, second.derivedYaml);
  assert.equal(first.residualYaml, second.residualYaml);

  const types = first.relations.map((relation) => relation.relation_type);
  assert.ok(types.includes("shares_problem"));
  assert.ok(types.includes("can_be_evaluated_by"));
  assert.ok(types.includes("compares_with"));
  assert.ok(types.includes("tension_with"));
  assert.equal(first.relations[0].id, "r-0001");
  assert.equal(first.residualQueue.length, 0, "same concept/tension structural rules cover all shared-problem pairs");
});

test("deriveRelations writes files and --check detects drift", async () => {
  const root = await makeRoot();
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "alpha.yaml"), object({
    slug: "alpha",
    concept: "mem.learned-policy-controller",
  }));
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "delta.yaml"), object({
    slug: "delta",
    concept: "mem.learned-policy-controller",
    mechanismConcept: "mem.fixed-rule-hooks",
  }));

  const wrote = await deriveRelations({ root });
  assert.equal(wrote.ok, true);
  const derivedFile = path.join(root, "data", "knowledge-graph", "relations", "derived.yaml");
  const residualFile = path.join(root, "data", "knowledge-graph", "relations", "residual-queue.yaml");
  const before = await readFile(derivedFile, "utf8");
  assert.ok(parseYaml(before).length > 0);
  assert.equal((await deriveRelations({ root, check: true })).ok, true);

  await writeFile(residualFile, "[]\n# drift\n", "utf8");
  const check = await deriveRelations({ root, check: true });
  assert.equal(check.ok, false);
  assert.deepEqual(check.mismatches, ["residual-queue.yaml"]);
});
