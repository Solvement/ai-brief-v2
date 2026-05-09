import type { GitHubRepoStats } from "../ingestion/github";

export const navigationItems = ["Home", "News", "Models", "Projects", "Skills", "Articles", "Courses"] as const;
export type NavigationItem = (typeof navigationItems)[number];

export const contentTags = [
  "Agent",
  "AI Coding",
  "MCP",
  "Workflow",
  "Prompt",
  "RAG",
  "Multimodal",
  "Local AI",
  "Business",
  "Research",
  "Safety",
  "China",
  "Open Source",
] as const;
export type ContentTag = (typeof contentTags)[number];

export const contentTypes = [
  "news",
  "model",
  "tool",
  "project",
  "integration",
  "article",
  "paper",
  "guide",
  "course",
] as const;
export type ContentType = (typeof contentTypes)[number];

export const actionLabels = ["know", "read", "try", "save", "use_now", "monitor", "avoid"] as const;
export type ActionLabel = (typeof actionLabels)[number];

export const audiences = ["developer", "pm", "founder", "creator", "operator", "researcher", "enterprise"] as const;
export type Audience = (typeof audiences)[number];

export type ContentLanguage = "zh" | "en" | "other";
export type ContentStatus = "collected" | "draft" | "ai_evaluated" | "needs_review" | "reviewed" | "published" | "archived";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type VisualStyle = "editorial" | "diagram" | "product" | "workflow" | "abstract";
export type DetailDepth = "card_only" | "brief" | "standard" | "deep";
export type DeepDiveStatus = "not_needed" | "needed_not_generated" | "generated" | "needs_human_review";

export const imagePolicies = [
  "none",
  "logo_only",
  "thumbnail_only",
  "cover",
  "cover_and_diagram",
  "screenshot_required",
  "step_images",
] as const;
export type ImagePolicy = (typeof imagePolicies)[number];

export const recommendedImageTypes = ["cover", "diagram", "screenshot", "logo", "rule_card"] as const;
export type RecommendedImageType = (typeof recommendedImageTypes)[number];

export interface ImagePlan {
  policy: ImagePolicy;
  reason: string;
  recommended_types: RecommendedImageType[];
  prompt?: string;
  alt: string;
}

export interface MediaAsset {
  id: string;
  type: "cover" | "thumbnail" | "inline" | "step_screenshot" | "logo";
  source_type:
    | "source_image"
    | "generated_editorial"
    | "generated_diagram"
    | "tool_logo"
    | "screenshot"
    | "manual_upload"
    | "placeholder";
  url: string;
  alt: string;
  credit?: string;
  prompt?: string;
  revised_prompt?: string;
  model?: string;
  aspect_ratio?: "16:9" | "4:3" | "1:1" | "3:2";
  status: "draft" | "approved" | "rejected" | "needs_review";
  created_at: string;
}

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  original_title?: string;
  summary: string;
  one_sentence_takeaway: string;
  why_it_matters: string;
  content_type: ContentType;
  category: string;
  tags: ContentTag[];
  target_audience: Audience[];
  source_name: string;
  source_url: string;
  source_column?: "news" | "models" | "projects" | "skills" | "articles" | "courses";
  source_id?: string;
  source_tier?: string;
  canonical_url?: string;
  author?: string;
  published_at?: string;
  collected_at: string;
  language: ContentLanguage;
  reading_time_minutes: number;
  status: ContentStatus;
  readability_score: number;
  impact_score: number;
  actionability_score: number;
  confidence_score: number;
  difficulty: Difficulty;
  recommended_action: ActionLabel;
  key_facts: string[];
  opportunities: string[];
  risks: string[];
  next_steps: string[];
  related_ids: string[];
  cover_image?: MediaAsset;
  thumbnail_image?: MediaAsset;
  media_assets?: MediaAsset[];
  visual_style?: VisualStyle;
  image_plan?: ImagePlan;
  prompt_version?: string;
  github_stats?: GitHubRepoStats;
  detail_depth?: DetailDepth;
  deep_dive_status?: DeepDiveStatus;
  brief_detail?: {
    tldr: string;
    beginner_explanation?: string;
    background: string;
    key_points: string[];
    why_it_matters: string;
    core_concepts?: Array<{ name: string; explanation: string; why_it_matters_here: string }>;
    terminology?: Array<{ term: string; plain_explanation: string; why_it_matters: string }>;
    mechanism_explanation?: string;
    what_changed?: string;
    why_now?: string;
    innovation_analysis?: string;
    value_analysis?: string;
    impact_by_audience?: Array<{ audience: Audience | string; impact: string }>;
    risks_and_uncertainties: string[];
    open_questions?: string[];
    practical_examples?: Array<string | { scenario: string; explanation: string; expected_value: string }>;
    examples?: Array<{ scenario: string; explanation: string; expected_value: string }>;
    what_to_look_for?: string[];
    good_signs?: string[];
    watch_outs?: string[];
    adoption_readiness?: string;
    action_summary: string;
    validation_methods: string[];
  };
  deep_dive?: {
    core_question: string;
    background: string;
    core_concepts: Array<{ name: string; explanation: string; why_it_matters_here: string }>;
    mechanism_explanation: string;
    what_changed: string;
    comparison_or_alternatives?: string[];
    why_it_matters_deep: string;
    risks_and_uncertainties: string[];
    practical_test_plan: string[];
    validation_methods: string[];
    learning_takeaways: string[];
    related_playbook_idea: string;
  };
}

export interface NewsItem extends ContentItem {
  content_type: "news";
  news_scope: "model_release" | "product_update" | "company" | "policy" | "security" | "industry";
  affected_groups: Audience[];
}

export interface ModelItem extends ContentItem {
  content_type: "model";
  model_provider: string;
  primary_capability: string;
  pricing_note: string;
  latency_note: string;
  benchmark_notes: string[];
  test_prompts: string[];
}

export interface ToolItem extends ContentItem {
  content_type: "tool";
  product_url: string;
  maturity: "experimental" | "usable" | "production_ready";
  installation_minutes: number;
  alternatives: string[];
}

export interface ProjectItem extends ContentItem {
  content_type: "project";
  repository_url: string;
  maturity: "experimental" | "usable" | "production_ready";
  installation_minutes: number;
  alternatives: string[];
}

export interface IntegrationItem extends ContentItem {
  content_type: "integration";
  integration_target: string;
  permission_level: "read" | "write" | "execute";
  verification_methods: string[];
}

export interface ArticleItem extends ContentItem {
  content_type: "article";
  core_argument: string;
  evidence_strength: "weak" | "medium" | "strong";
  counterpoints: string[];
}

export interface PaperItem extends ContentItem {
  content_type: "paper";
  paper_url: string;
  method_summary: string;
  limitations: string[];
  reproducibility: "unknown" | "partial" | "strong";
}

export interface GuideItem extends ContentItem {
  content_type: "guide";
  outcome: string;
  prerequisites: string[];
  prompts: string[];
  checklist: string[];
  validation_methods: string[];
}

export interface CourseItem extends ContentItem {
  content_type: "course";
  provider: string;
  duration: string;
  learning_outcomes: string[];
  project_based: boolean;
}

export type AnyContentItem =
  | NewsItem
  | ModelItem
  | ToolItem
  | ProjectItem
  | IntegrationItem
  | ArticleItem
  | PaperItem
  | GuideItem
  | CourseItem;

export interface HomeBrief {
  dailyTakeaway: string;
  mustRead: AnyContentItem[];
  tryToday: AnyContentItem[];
  modelRadar: ModelItem[];
  toolsAndProjects: Array<ToolItem | ProjectItem | IntegrationItem>;
  playbookOfTheDay?: GuideItem;
  deepRead: Array<ArticleItem | PaperItem | CourseItem>;
}

export function isScore(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}
