import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { stringify as stringifyYaml } from "yaml";

import { renderTextReport, validateObjects } from "./validate-objects.mjs";

async function writeYaml(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, stringifyYaml(value), "utf8");
}

async function makeRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "ros-validate-"));
  const registry = path.join(root, "data", "knowledge-graph", "registry");
  await mkdir(registry, { recursive: true });
  await writeYaml(path.join(registry, "problems.yaml"), [
    { id: "mem.lifecycle-management", name: "Memory lifecycle" },
  ]);
  await writeYaml(path.join(registry, "concepts.yaml"), [
    { id: "mem.learned-policy-controller", name: "Learned policy", distinct_from: ["mem.fixed-rule-hooks"], conflicts_with: [] },
    { id: "mem.fixed-rule-hooks", name: "Rule hooks", distinct_from: ["mem.learned-policy-controller"], conflicts_with: [] },
  ]);
  await writeYaml(path.join(registry, "benchmarks.yaml"), [
    { id: "bench.memoryagentbench", name: "MemoryAgentBench", evaluates: ["mem.lifecycle-management"] },
  ]);
  return root;
}

function goodObject(slug = "agemem") {
  return {
    schema: "ros-v1",
    object_id: `paper/${slug}`,
    slug,
    kind: "paper",
    title: "AgeMem",
    source: "fixture",
    one_sentence_thesis: "AgeMem learns a memory policy and evaluates it in a lifecycle setting.",
    human: {
      headline: "Let the agent learn when to store and forget, instead of hardcoding it.",
      plain_summary: "Folds memory operations into the agent policy and trains them, beating modular baselines on long tasks.",
      use_type: "design_inspiration",
      use_type_reason: "The core gain needs a trainable model, so most systems can only borrow the interface idea.",
      how_to_use: "Expose store/update/delete as callable actions first; add learning later.",
      can_borrow: ["Model the control decision as a callable action."],
      cannot_borrow: ["The training loop needs a trainable policy."],
      maturity: "Self-reported on controlled benchmarks.",
    },
    canonical: {
      problems: ["mem.lifecycle-management"],
      concepts: ["mem.learned-policy-controller"],
      benchmarks: ["bench.memoryagentbench"],
      proposed_problems: [],
      proposed_concepts: [],
    },
    claims: [{
      id: `${slug}.c1`,
      statement: "A learned policy controls memory operations.",
      type: "author_claim",
      evidence: [{ anchor: "§1", quote: "learned policy", strength: "strong" }],
      cannot_prove: ["It does not prove universal superiority."],
      confidence: "high",
      confidence_reason: "The fixture states the mechanism directly.",
    }],
    mechanisms: [{
      id: `${slug}.m1`,
      name: "Policy controller",
      canonical_concept: "mem.learned-policy-controller",
      problem: "mem.lifecycle-management",
      input: "task state",
      output: "memory action",
      operations: ["score memory action", "apply selected action"],
      optimization: "reward",
      replaceable: [],
      non_replaceable: [],
      reusable_pattern: "Treat memory as a policy decision.",
      anchor: "§2",
    }],
    assumptions: [{
      id: `${slug}.a1`,
      statement: "Feedback is available.",
      kind: "explicit",
      anchor: "§3",
      conflicts_hint: "conflicts with fixed rule hooks",
    }],
    failure_modes: [{
      id: `${slug}.f1`,
      statement: "Reward misspecification.",
      triggered_when: "feedback is noisy",
      consequence: "bad memory actions",
    }],
    trigger_hooks: [{
      symptom: "A memory system needs to decide when to write or forget.",
      why_recall: "The object gives a learned controller pattern.",
      related_object: `${slug}.m1`,
      risk: "May overfit reward.",
    }],
    exam_questions: [
      { q: "What if feedback is unavailable?", type: "counterfactual", expected_points: ["Discuss policy training boundary."], tested_objects: [`${slug}.c1`] },
      { q: "Where does the method stop applying?", type: "boundary", expected_points: ["Name noisy rewards."], tested_objects: [`${slug}.a1`] },
      { q: "Transfer this to another memory system.", type: "transfer", expected_points: ["Keep lifecycle action interface."], tested_objects: [`${slug}.m1`] },
    ],
    self_evo_verdict: { state: "queue", reason: "Useful pattern." },
    status: "draft",
  };
}

test("validateObjects passes a complete ROS object", async () => {
  const root = await makeRoot();
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "agemem.yaml"), goodObject());
  const report = await validateObjects({ root });
  assert.equal(report.ok, true);
  assert.deepEqual(report.summary, { objects: 1, passed: 1, failed: 0, warnings: 0 });
});

test("validateObjects fails missing hard fields and orphan canonical ids", async () => {
  const root = await makeRoot();
  const bad = goodObject("badmem");
  bad.one_sentence_thesis = "";
  bad.canonical.problems = ["mem.unknown"];
  bad.claims[0].type = "guess";
  bad.claims[0].evidence[0].quote = "";
  bad.claims[0].cannot_prove = [];
  bad.mechanisms[0].operations = [];
  bad.trigger_hooks = [];
  bad.exam_questions = bad.exam_questions.slice(0, 1);
  bad.self_evo_verdict.state = "maybe";
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "badmem.yaml"), bad);
  const report = await validateObjects({ root });
  assert.equal(report.ok, false);
  assert.equal(report.summary.failed, 1);
  assert.ok(report.results[0].errors.some((error) => error.includes("one_sentence_thesis")));
  assert.ok(report.results[0].errors.some((error) => error.includes("orphan id")));
  assert.ok(report.results[0].errors.some((error) => error.includes("claim badmem.c1 has invalid type")));
});

test("validateObjects reports duplicate scoped ids across files", async () => {
  const root = await makeRoot();
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "agemem.yaml"), goodObject("agemem"));
  const other = goodObject("othermem");
  other.claims[0].id = "agemem.c1";
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "othermem.yaml"), other);
  const report = await validateObjects({ root });
  assert.equal(report.ok, false);
  assert.ok(report.results.flatMap((result) => result.errors).some((error) => error.includes("duplicate object id")));
});

test("validateObjects passes gracefully when objects dir is missing or empty", async () => {
  const root = await makeRoot();
  const report = await validateObjects({ root });
  assert.equal(report.ok, true);
  assert.deepEqual(report.summary, { objects: 0, passed: 0, failed: 0, warnings: 0 });
  assert.ok(renderTextReport(report).includes("PASS 0 objects found"));
});
