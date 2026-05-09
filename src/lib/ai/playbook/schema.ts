import type { Audience } from "../../content/types";

export interface PlaybookStep {
  title: string;
  instruction: string;
  expected_result: string;
  common_failure?: string;
}

export interface Playbook {
  title: string;
  outcome: string;
  suitable_for: Audience[];
  prerequisites: string[];
  tools_needed: string[];
  estimated_time_minutes: number;
  steps: PlaybookStep[];
  prompts: string[];
  checklist: string[];
  validation_methods: string[];
  risks: string[];
  fallback_options: string[];
}

export interface QualityIssue {
  severity: "error" | "warning";
  message: string;
}
