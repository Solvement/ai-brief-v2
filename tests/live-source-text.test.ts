import { evaluateContentDeterministic } from "../src/lib/ai/evaluation";
import { buildLiveEvaluationInput, isAiRepositoryCandidate, isLiveEvaluationPublishable } from "../src/lib/ingestion/live-sources";
import type { AnyContentItem } from "../src/lib/content/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(
  !isAiRepositoryCandidate({
    name: "ClickHouse",
    description: "ClickHouse is a real-time analytics database management system",
    topics: ["database", "analytics"],
  }),
  "live GitHub ingestion should reject generic non-AI infrastructure repos",
);

assert(
  !isAiRepositoryCandidate({
    name: "ClickHouse",
    description: "ClickHouse is a real-time analytics database management system",
    topics: ["ai", "database", "analytics"],
  }),
  "a single broad ai topic should not be enough for generic infrastructure repos",
);

assert(
  isAiRepositoryCandidate({
    name: "agent-skills",
    description: "Production-grade engineering skills for AI coding agents",
    topics: ["ai", "coding-agent", "skills"],
  }),
  "live GitHub ingestion should accept AI agent skill/project repos",
);

const draft = {
  id: "draft-agent-skills",
  slug: "agent-skills",
  title: "addyosmani/agent-skills",
  summary: "Production-grade engineering skills for AI coding agents.",
  one_sentence_takeaway: "Agent skills should be judged by install value and behavior change.",
  why_it_matters: "Skill packs can turn engineering workflow discipline into reusable agent behavior.",
  content_type: "tool",
  category: "tool",
  tags: ["Agent", "AI Coding", "Open Source"],
  target_audience: ["developer"],
  source_name: "GitHub",
  source_url: "https://github.com/addyosmani/agent-skills",
  canonical_url: "https://github.com/addyosmani/agent-skills",
  collected_at: "2026-05-08T12:00:00-04:00",
  language: "en",
  reading_time_minutes: 5,
  status: "draft",
  readability_score: 0,
  impact_score: 0,
  actionability_score: 0,
  confidence_score: 0,
  difficulty: "intermediate",
  recommended_action: "monitor",
  key_facts: [],
  opportunities: [],
  risks: [],
  next_steps: [],
  related_ids: [],
  product_url: "https://github.com/addyosmani/agent-skills",
  maturity: "usable",
  installation_minutes: 10,
  alternatives: [],
} satisfies AnyContentItem;

const readme = [
  "# Agent Skills",
  "Production-grade engineering skills for AI coding agents.",
  "This pack includes workflows for spec, plan, build, test, review, and ship.",
  "Each skill defines triggers, quality gates, evidence requirements, and exit criteria.",
  "Agents should not skip tests or reviews when a skill requires verification.",
].join("\n").repeat(20);

const input = buildLiveEvaluationInput(draft, "github", readme);
assert(input.input_quality === "raw_full_text", "README-sized source text should be marked raw_full_text");
assert(input.sources?.[0]?.text.includes("quality gates"), "live evaluator input should include README source text");
assert(!input.sources?.[0]?.text.includes("AI-brief evaluator"), "live evaluator input should not inject internal fallback language");

const fallbackEvaluation = evaluateContentDeterministic(input);
assert(!isLiveEvaluationPublishable(fallbackEvaluation), "live ingestion should not publish deterministic fallback results");
assert(
  isLiveEvaluationPublishable({ ...fallbackEvaluation, prompt_version: "eval-v1" }),
  "live ingestion should publish schema-valid real LLM evaluation results",
);

console.log("live source text tests passed");
