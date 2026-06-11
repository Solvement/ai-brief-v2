import test from "node:test";
import assert from "node:assert/strict";

import { PROJECT_DEEP_DIVE_OUTPUT_SCHEMA, projectDeepDiveSystemPrompt } from "./deepdive-prompts.mjs";

test("project deep-dive schema exposes Mind Palace hook fields", () => {
  assert.ok(PROJECT_DEEP_DIVE_OUTPUT_SCHEMA.mind_palace);
  assert.equal(PROJECT_DEEP_DIVE_OUTPUT_SCHEMA.mind_palace.problem_solved.includes("项目解决"), true);
  assert.equal(PROJECT_DEEP_DIVE_OUTPUT_SCHEMA.mind_palace.core_concepts[0].role, "primary|supporting|mentioned");
});

test("projectDeepDiveSystemPrompt requires self_evo_use memory understanding evolution segments", () => {
  const prompt = projectDeepDiveSystemPrompt("agent_framework", "analysis");

  assert.match(prompt, /mind_palace\.problem_solved/);
  assert.match(prompt, /记忆、理解、自进化/);
  assert.match(prompt, /source_span/);
});
