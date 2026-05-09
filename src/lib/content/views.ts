// View-model adapters: take ContentItem records from `seed`/queries and shape
// them into the props the legacy home-page components consume. This file used
// to live at `src/fixtures/content.ts`. It was moved into the content layer so
// every place that derives presentation data from ContentItem lives next to
// the data definitions, not in a separate `fixtures/` directory that implied
// "test data" but was actually shipping in production.

import { getContentByType, getHomeBrief } from "./queries";
import { navigationItems, type ActionLabel, type AnyContentItem } from "./types";
import type {
  DecisionBrief,
  EvaluatedContentCard,
  LearnPath,
  ModelRadarRow,
  NavigationItem,
  PlaybookItem,
  ToolAssessment,
} from "../../types";

export const navItems: NavigationItem[] = [...navigationItems];

const actionLabelText: Record<ActionLabel, string> = {
  know: "知道即可",
  read: "值得深读",
  try: "值得试",
  save: "收藏",
  use_now: "马上用",
  monitor: "监控",
  avoid: "谨慎观望",
};

function toCard(item: AnyContentItem): EvaluatedContentCard {
  return {
    id: item.id,
    title: item.title,
    one_sentence_takeaway: item.one_sentence_takeaway,
    why_it_matters: item.why_it_matters,
    content_type: item.content_type,
    target_audience: item.target_audience,
    reading_time: `${item.reading_time_minutes} min`,
    action_label: actionLabelText[item.recommended_action],
    impact_score: item.impact_score,
    readability_score: item.readability_score,
    actionability_score: item.actionability_score,
    confidence_score: item.confidence_score,
    source_name: item.source_name,
    source_url: item.source_url,
    published_at: item.published_at ?? item.collected_at,
    tags: item.tags,
    difficulty: item.difficulty,
    recommended_action: item.recommended_action,
    risks: item.risks,
    next_steps: item.next_steps,
  };
}

const homeBrief = getHomeBrief();
const topCards = homeBrief.mustRead.map(toCard);

export const contentCards: EvaluatedContentCard[] = topCards;

export const decisionBriefs: DecisionBrief[] = [
  { label: "今日必看", card: topCards[0] },
  { label: "今日可试", card: toCard(homeBrief.tryToday[0]) },
  { label: "今日可用", card: toCard(homeBrief.playbookOfTheDay ?? homeBrief.tryToday[1]) },
];

export const newsCards: EvaluatedContentCard[] = getContentByType("news").slice(0, 3).map(toCard);

export const modelRows: ModelRadarRow[] = getContentByType("model")
  .slice(0, 3)
  .map((model) => ({
    scenario: model.category === "ai-coding" ? "代码 Agent" : model.category === "multimodal" ? "视觉 Brief" : "中文长文",
    primaryMetric: model.primary_capability,
    costLevel: model.pricing_note.includes("低") ? "低" : "中",
    valueLevel: model.impact_score >= 86 ? "高" : "中高",
    nextStep: model.next_steps[0],
  }));

const maturityText = {
  experimental: "实验",
  usable: "可用",
  production_ready: "生产可用",
} as const;

export const toolAssessments: ToolAssessment[] = getContentByType("tool")
  .slice(0, 3)
  .map((tool) => ({
    name: tool.title,
    label: tool.tags[0],
    maturity: maturityText[tool.maturity],
    cost: `${tool.installation_minutes} 分钟起步`,
    risk: tool.risks[0],
  }));

export const playbooks: PlaybookItem[] = getContentByType("guide")
  .slice(0, 3)
  .map((guide) => ({
    title: guide.title,
    time: `${guide.reading_time_minutes} 分钟`,
    output: guide.outcome,
  }));

export const learnPaths: LearnPath[] = getContentByType("course")
  .slice(0, 4)
  .map((course) => ({
    title: course.title,
    text: course.learning_outcomes.join("、"),
  }));
