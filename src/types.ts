import type { ActionLabel, AnyContentItem, ContentTag, ContentType, Audience, NavigationItem } from "./lib/content/types";

export type { ActionLabel, AnyContentItem, ContentTag, ContentType, Audience, NavigationItem };

export interface EvaluatedContentCard {
  id: string;
  title: string;
  one_sentence_takeaway: string;
  why_it_matters: string;
  content_type: ContentType;
  target_audience: Audience[];
  reading_time: string;
  action_label: string;
  impact_score: number;
  readability_score: number;
  actionability_score: number;
  confidence_score: number;
  source_name: string;
  source_url: string;
  published_at: string;
  tags: ContentTag[];
  difficulty: "beginner" | "intermediate" | "advanced";
  recommended_action: ActionLabel;
  risks: string[];
  next_steps: string[];
}

export interface DecisionBrief {
  label: string;
  card: EvaluatedContentCard;
}

export interface ModelRadarRow {
  scenario: string;
  primaryMetric: string;
  costLevel: "低" | "中" | "高";
  valueLevel: "中" | "中高" | "高";
  nextStep: string;
}

export interface ToolAssessment {
  name: string;
  label: ContentTag;
  maturity: "实验" | "可用" | "生产可用";
  cost: string;
  risk: string;
}

export interface PlaybookItem {
  title: string;
  time: string;
  output: string;
}

export interface LearnPath {
  title: string;
  text: string;
}
