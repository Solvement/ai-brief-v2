import { contentItems } from "../src/lib/content/seed";
import { generatePlaybookFromContent, validatePlaybookQuality } from "../src/lib/ai/playbook";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const convertibleItems = contentItems.filter((item) => ["model", "tool", "integration", "article", "guide"].includes(item.content_type)).slice(0, 3);

for (const item of convertibleItems) {
  const result = generatePlaybookFromContent(item);
  assert(result.status === "generated", `${item.content_type} should produce a playbook`);
  if (result.status === "generated") {
    const playbook = result.playbook;
    assert(playbook.outcome.length > 0, "playbook should have outcome");
    assert(playbook.suitable_for.length > 0, "playbook should have audience");
    assert(playbook.prerequisites.length > 0, "playbook should have prerequisites");
    assert(playbook.tools_needed.length > 0, "playbook should have tools");
    assert(playbook.steps.length >= 3, "playbook should have at least 3 steps");
    assert(playbook.steps.every((step) => step.expected_result.length > 0), "each step should have expected_result");
    assert(playbook.prompts.length > 0, "playbook should have prompts");
    assert(playbook.checklist.length >= 3, "playbook should have checklist");
    assert(playbook.validation_methods.length > 0, "playbook should have validation methods");
    assert(playbook.risks.length > 0, "playbook should have risks");
    assert(playbook.fallback_options.length > 0, "playbook should have fallback options");
    assert(validatePlaybookQuality(playbook).filter((issue) => issue.severity === "error").length === 0, "generated playbook should have no quality errors");
  }
}

const lowActionability = { ...contentItems[0], actionability_score: 15, next_steps: [] };
const rejected = generatePlaybookFromContent(lowActionability);
assert(rejected.status === "not_actionable", "non-actionable content should not force a playbook");
