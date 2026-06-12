import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { stringify as stringifyYaml } from "yaml";

import { writeBlindtest } from "./exam-blindtest.mjs";

async function writeYaml(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, stringifyYaml(value), "utf8");
}

test("writeBlindtest creates A/B papers with the same questions and scoring axes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ros-blindtest-"));
  const outDir = path.join(root, ".agent", "blindtest");
  await writeYaml(path.join(root, "data", "knowledge-graph", "objects", "agemem.yaml"), {
    schema: "ros-v1",
    slug: "agemem",
    title: "AgeMem",
    one_sentence_thesis: "AgeMem learns memory lifecycle actions from feedback.",
    exam_questions: [
      { q: "Counterfactual question?", type: "counterfactual", expected_points: ["Point A"], tested_objects: ["agemem.c1"] },
      { q: "Boundary question?", type: "boundary", expected_points: ["Point B"], tested_objects: ["agemem.a1"] },
      { q: "Transfer question?", type: "transfer", expected_points: ["Point C"], tested_objects: ["agemem.m1"] },
    ],
  });

  const result = await writeBlindtest("agemem", { root, outDir });
  assert.equal(result.questions, 3);
  const a = await readFile(result.aFile, "utf8");
  const b = await readFile(result.bFile, "utf8");
  assert.ok(a.includes("Condition A"));
  assert.ok(a.includes("One-sentence thesis"));
  assert.ok(!a.includes("```yaml"));
  assert.ok(b.includes("Condition B"));
  assert.ok(b.includes("```yaml"));
  for (const question of ["Counterfactual question?", "Boundary question?", "Transfer question?"]) {
    assert.ok(a.includes(question));
    assert.ok(b.includes(question));
  }
  for (const axis of ["准确性", "证据引用", "边界意识", "幻觉率", "可验证实验"]) {
    assert.ok(a.includes(axis));
    assert.ok(b.includes(axis));
  }
});
