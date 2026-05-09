import type { ContentType } from "../../content/types";

export interface EvaluationRubric {
  content_type: ContentType;
  goal: string;
  criteria: string[];
}

export const evaluationRubrics: Record<ContentType, EvaluationRubric> = {
  news: {
    content_type: "news",
    goal: "Decide what changed, who is affected, confidence, and whether action is needed.",
    criteria: ["what changed", "why now", "affected audience", "source confidence", "recommended action"],
  },
  model: {
    content_type: "model",
    goal: "Evaluate capability, cost, speed, ecosystem, and migration value.",
    criteria: ["capability delta", "cost impact", "latency impact", "tool support", "test prompts"],
  },
  tool: {
    content_type: "tool",
    goal: "Evaluate whether the product can be tried safely and usefully.",
    criteria: ["use case clarity", "setup cost", "maturity", "privacy risk", "alternatives"],
  },
  project: {
    content_type: "project",
    goal: "Evaluate whether the project can be installed, maintained, and trusted.",
    criteria: ["README clarity", "maintenance health", "demo path", "dependency risk", "fallback"],
  },
  integration: {
    content_type: "integration",
    goal: "Evaluate connection value, permissions, compatibility, and rollback risk.",
    criteria: ["connected system", "read/write/execute scope", "permission boundary", "failure mode", "verification"],
  },
  article: {
    content_type: "article",
    goal: "Evaluate the argument, evidence, limitations, and conversion into action.",
    criteria: ["core claim", "evidence strength", "novelty", "counterpoints", "playbook potential"],
  },
  paper: {
    content_type: "paper",
    goal: "Evaluate method, result, limitation, reproducibility, and practical use.",
    criteria: ["problem", "method", "result", "limitations", "reproducibility"],
  },
  guide: {
    content_type: "guide",
    goal: "Evaluate execution success probability.",
    criteria: ["clear outcome", "complete steps", "validation", "failure handling", "fallback"],
  },
  course: {
    content_type: "course",
    goal: "Evaluate learning return and whether the path produces usable outcomes.",
    criteria: ["audience fit", "learning outcome", "project work", "freshness", "next path"],
  },
};
