import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { stringify as stringifyYaml } from "yaml";

import { writeRosProjection } from "./build-ros-projection.mjs";
import { validateRosProjection } from "./validate-ros-projection.mjs";

async function writeYaml(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, stringifyYaml(value), "utf8");
}

async function makeRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "ros-validate-"));
  const kg = path.join(root, "data", "knowledge-graph");
  await writeYaml(path.join(kg, "registry", "propositions.yaml"), []);
  await writeYaml(path.join(kg, "registry", "problems.yaml"), [{ id: "mem.lifecycle-management" }]);
  await writeYaml(path.join(kg, "registry", "concepts.yaml"), [{ id: "mem.learned-policy-controller" }]);
  await writeYaml(path.join(kg, "registry", "benchmarks.yaml"), []);
  await writeYaml(path.join(kg, "relations", "derived.yaml"), []);
  await writeYaml(path.join(kg, "relations", "judged.yaml"), []);
  await writeYaml(path.join(kg, "objects", "alpha.yaml"), {
    schema: "ros-v1",
    object_id: "paper/alpha",
    slug: "alpha",
    kind: "paper",
    title: "Alpha",
    one_sentence_thesis: "Alpha thesis",
    canonical: {
      problems: ["mem.lifecycle-management"],
      concepts: ["mem.learned-policy-controller"],
      benchmarks: [],
      proposed_problems: [],
      proposed_concepts: [],
    },
    claims: [{ id: "alpha.c1", statement: "alpha claim" }],
    mechanisms: [],
    assumptions: [],
    failure_modes: [],
    trigger_hooks: [],
    exam_questions: [],
    self_evo_verdict: { state: "queue", reason: "fixture" },
  });
  return root;
}

test("validateRosProjection passes generated projection and detects manual drift", async () => {
  const root = await makeRoot();
  await writeRosProjection({ root });
  const pass = await validateRosProjection({ root });
  assert.equal(pass.ok, true);

  await writeFile(path.join(root, "public", "data", "brief", "ros-graph.json"), "{\"schema\":\"ros-graph-v1\",\"nodes\":[],\"edges\":[],\"propositions\":[]}\n", "utf8");
  const fail = await validateRosProjection({ root });
  assert.equal(fail.ok, false);
  assert.ok(fail.errors.some((error) => error.includes("differs from build-ros-projection output")));
});
