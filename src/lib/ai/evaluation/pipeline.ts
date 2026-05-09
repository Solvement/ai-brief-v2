import type { ActionLabel } from "../../content/types";
import type {
  ActionLayer,
  BriefDetail,
  DeepDive,
  EditorialDiagnosis,
  EvaluationCard,
  EvaluationInput,
  EvaluationResult,
  SourceFact,
} from "./schema";
import { normalizeEvaluationResult } from "./schema";

export function extractSourceFacts(result: Partial<EvaluationResult>, input?: EvaluationInput): SourceFact[] {
  return normalizeEvaluationResult(result, input).source_facts;
}

export function runEditorialDiagnosis(result: Partial<EvaluationResult>, input?: EvaluationInput): EditorialDiagnosis {
  return normalizeEvaluationResult(result, input).editorial_diagnosis;
}

export function generateCard(result: Partial<EvaluationResult>, input?: EvaluationInput): EvaluationCard {
  return normalizeEvaluationResult(result, input).card;
}

export function generateBriefDetail(result: Partial<EvaluationResult>, input?: EvaluationInput): BriefDetail {
  return normalizeEvaluationResult(result, input).brief_detail;
}

export function generateDeepDive(result: Partial<EvaluationResult>, input?: EvaluationInput): DeepDive | undefined {
  const normalized = normalizeEvaluationResult(result, input);
  return normalized.depth_level === "deep" && normalized.deep_dive_status === "generated" ? normalized.deep_dive : undefined;
}

export function generatePlaybookGate(result: Partial<EvaluationResult>, input?: EvaluationInput): {
  should_generate: boolean;
  reason: string;
  recommended_action: ActionLabel;
  action_layer: ActionLayer;
} {
  const normalized = normalizeEvaluationResult(result, input);
  const shouldGenerate = normalized.editorial_diagnosis.playbook_potential === "strong" && normalized.action_layer.playbook_candidate;
  return {
    should_generate: shouldGenerate,
    reason: shouldGenerate
      ? "playbook_potential is strong and the action layer marks this as a playbook candidate."
      : "Playbook generation is skipped unless playbook_potential is strong.",
    recommended_action: normalized.recommended_action,
    action_layer: normalized.action_layer,
  };
}
