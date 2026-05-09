import type { AnyContentItem } from "../../content/types";
import type { Playbook, QualityIssue } from "./schema";

export type { Playbook, PlaybookStep, QualityIssue } from "./schema";

export type PlaybookGenerationResult =
  | { status: "generated"; playbook: Playbook }
  | { status: "not_actionable"; explanation: string; recommended_action: "monitor" | "read" };

function toolsFor(item: AnyContentItem): string[] {
  if (item.content_type === "model") return ["current model baseline", "candidate model", "evaluation sheet"];
  if (item.content_type === "tool" || item.content_type === "project") return ["test account", "sandbox workspace", "rollback note"];
  if (item.content_type === "integration") return ["least-privilege config", "test workspace", "audit log"];
  if (item.content_type === "guide") return ["source guide", "checklist", "validation notes"];
  return ["source article", "notes document", "validation checklist"];
}

export function generatePlaybookFromContent(item: AnyContentItem): PlaybookGenerationResult {
  if (item.actionability_score < 40 || item.next_steps.length === 0) {
    return {
      status: "not_actionable",
      explanation: "Content lacks enough executable next steps to become a reliable playbook.",
      recommended_action: item.confidence_score >= 70 ? "read" : "monitor",
    };
  }

  const steps = item.next_steps.slice(0, 3).map((step, index) => ({
    title: `Step ${index + 1}: ${step}`,
    instruction: `Use the source item "${item.title}" to complete: ${step}`,
    expected_result: item.key_facts[index % item.key_facts.length] ?? "A concrete output is produced.",
    common_failure: item.risks[index % item.risks.length],
  }));

  while (steps.length < 3) {
    steps.push({
      title: `Step ${steps.length + 1}: Validate output`,
      instruction: "Check the output against the source facts and risk notes.",
      expected_result: "The output can be verified against source evidence.",
      common_failure: "The result is too vague to verify.",
    });
  }

  const fallback = item.risks.map((risk) => `If this risk appears, pause and switch to manual review: ${risk}`);

  return {
    status: "generated",
    playbook: {
      title: `Playbook: ${item.title}`,
      outcome: item.content_type === "guide" ? item.outcome : item.one_sentence_takeaway,
      suitable_for: item.target_audience,
      prerequisites: ["Source item has been reviewed", "Success criteria are written before execution"],
      tools_needed: toolsFor(item),
      estimated_time_minutes: Math.max(15, item.reading_time_minutes * 5),
      steps,
      prompts:
        item.content_type === "guide" && item.prompts.length > 0
          ? item.prompts
          : [`Turn this item into an executable checklist with evidence, risks, and validation: ${item.title}`],
      checklist: [...item.next_steps.slice(0, 4), "Record evidence", "Record failure modes"],
      validation_methods:
        item.content_type === "guide" ? item.validation_methods : ["Output matches key facts", "Risks have mitigation notes", "Next action is clear"],
      risks: item.risks,
      fallback_options: fallback.length > 0 ? fallback : ["Save for later and monitor for stronger evidence."],
    },
  };
}

export function validatePlaybookQuality(playbook: Playbook): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (!playbook.outcome) issues.push({ severity: "error", message: "Playbook requires outcome." });
  if (playbook.suitable_for.length === 0) issues.push({ severity: "error", message: "Playbook requires suitable_for." });
  if (playbook.prerequisites.length === 0) issues.push({ severity: "error", message: "Playbook requires prerequisites." });
  if (playbook.tools_needed.length === 0) issues.push({ severity: "error", message: "Playbook requires tools_needed." });
  if (playbook.steps.length === 0) issues.push({ severity: "error", message: "Playbook requires steps." });
  if (playbook.steps.some((step) => !step.expected_result)) {
    issues.push({ severity: "error", message: "Every step requires expected_result." });
  }
  if (playbook.prompts.length === 0) issues.push({ severity: "error", message: "Playbook requires prompts." });
  if (playbook.validation_methods.length === 0) issues.push({ severity: "error", message: "Playbook requires validation_methods." });
  if (playbook.risks.length === 0) issues.push({ severity: "warning", message: "Playbook should include risks." });
  if (playbook.fallback_options.length === 0) issues.push({ severity: "error", message: "Playbook requires fallback_options." });
  if (playbook.checklist.length < 3) issues.push({ severity: "warning", message: "Checklist should have at least 3 items." });

  return issues;
}
