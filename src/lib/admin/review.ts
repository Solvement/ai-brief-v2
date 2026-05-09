import type { AnyContentItem } from "../content/types";

export interface QualityWarning {
  code:
    | "low_confidence"
    | "missing_source_url"
    | "missing_key_facts"
    | "action_without_next_steps"
    | "use_now_low_confidence";
  message: string;
}

export function getQualityWarnings(item: AnyContentItem): QualityWarning[] {
  const warnings: QualityWarning[] = [];

  if (item.confidence_score < 60) warnings.push({ code: "low_confidence", message: "confidence_score is below 60." });
  if (!item.source_url) warnings.push({ code: "missing_source_url", message: "source_url is missing." });
  if (item.key_facts.length === 0) warnings.push({ code: "missing_key_facts", message: "key_facts are missing." });
  if (item.actionability_score >= 75 && item.next_steps.length === 0) {
    warnings.push({ code: "action_without_next_steps", message: "High actionability requires next_steps." });
  }
  if (item.recommended_action === "use_now" && item.confidence_score < 70) {
    warnings.push({ code: "use_now_low_confidence", message: "use_now requires stronger confidence." });
  }

  return warnings;
}

export function getReviewQueue(items: AnyContentItem[]): AnyContentItem[] {
  return items.filter((item) => item.status === "draft" || item.status === "needs_review");
}

export function publishContent(item: AnyContentItem): AnyContentItem {
  if (getQualityWarnings(item).some((warning) => warning.code !== "action_without_next_steps")) {
    return { ...item, status: "needs_review" };
  }

  return { ...item, status: "published" };
}

export function archiveContent(item: AnyContentItem): AnyContentItem {
  return { ...item, status: "archived" };
}
