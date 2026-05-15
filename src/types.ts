export type TrendingWindow = "daily" | "weekly" | "monthly";

export interface RepoSummary {
  fullName: string;
  owner: string;
  name: string;
  url: string;
  ownerAvatarUrl: string;
  description: string | null;
  language: string | null;
  languageColor: string | null;
  stars: number;
  forks: number;
  starsGained: number;
}

export interface ScoreBreakdown {
  novelty: number;
  engineering: number;
  reproducibility: number;
  timeToValue: number;
}

export interface WhyMatters { title: string; body: string }
export interface KeyConcept { term: string; explain: string }
export interface LimitationItem { title: string; body: string }
export interface TryStep { step: string; cmd?: string; note?: string }

export interface DeepDive {
  atGlance: string;
  whyItMatters: WhyMatters[];
  keyConcepts: KeyConcept[];
  /** Markdown-ish: supports ## subheading, **bold**, `code` */
  howItWorks: string;
  novelty: string;
  ecosystem: string;
  /** Structured array OR legacy string (for backward compatibility) */
  limitations: LimitationItem[] | string;
  /** Structured array OR legacy string */
  tryIt: TryStep[] | string;
  score: ScoreBreakdown;
}

export interface AnalyzedRepo extends RepoSummary {
  rank: number;
  tldr: string;
  tags: string[];
  light: string;
  worthDeepDive: number;
  deep?: DeepDive;
}

export interface Board {
  window: TrendingWindow;
  generatedAt: string;
  repos: AnalyzedRepo[];
}

export interface TrendingData {
  generatedAt: string;
  daily: Board;
  weekly: Board;
  monthly: Board;
}

export interface ModelSource {
  name: string;
  url: string;
}

export interface ModelApiInfo {
  modelNames: string[];
  contextWindow: string;
  maxOutput: string;
  modes: string[];
}

export interface ModelNextRelation {
  toReleaseId: string;
  summary: string;
  inherits: string;
  changes: string;
  why: string;
  solvedBy: string;
  teacherNote: string;
}

export type ModelBenchmarkSourceType = "official" | "third-party" | "derived";

export interface ModelBenchmarkChartBar {
  label: string;
  value: number;
  display: string;
  highlight?: boolean;
}

export interface ModelBenchmarkChart {
  title: string;
  metric: string;
  unit: string;
  higherIsBetter: boolean;
  maxValue?: number;
  sourceType: ModelBenchmarkSourceType;
  bars: ModelBenchmarkChartBar[];
}

export interface ModelBenchmarkItem {
  label: string;
  score: string;
  comparator: string;
  interpretation: string;
  sourceType: ModelBenchmarkSourceType;
}

export interface ModelBenchmarkLens {
  headline: string;
  professorNote: string;
  caveats: string[];
  charts: ModelBenchmarkChart[];
  items: ModelBenchmarkItem[];
}

export interface ModelAnalysisSection {
  headline: string;
  professorNote: string;
  bullets: string[];
}

export interface ModelAnalysis {
  benchmark: ModelBenchmarkLens;
  architecture: ModelAnalysisSection;
  designLineage: ModelAnalysisSection;
  trainingData: ModelAnalysisSection;
  innovation: ModelAnalysisSection;
  limitations: ModelAnalysisSection;
  professorLens: ModelAnalysisSection;
}

export interface ModelRelease {
  id: string;
  name: string;
  kind: string;
  publishedAt: string;
  positioning: string;
  oneSentenceTakeaway: string;
  problemSolved: string;
  keyChanges: string[];
  whyChanged: string;
  howSolved: string;
  tradeoffs: string[];
  studentTakeaways: string[];
  experiments: string[];
  api?: ModelApiInfo;
  modelAnalysis: ModelAnalysis;
  teacherNote: string;
  sources: ModelSource[];
  nextRelation?: ModelNextRelation;
}

export interface ModelSeries {
  id: string;
  title: string;
  summary: string;
  teacherNote: string;
  releases: ModelRelease[];
}

export interface ModelLearningItem {
  title: string;
  body: string;
}

export interface ModelUpdate {
  id: string;
  title: string;
  kind: string;
  publishedAt: string;
  summary: string;
  whyItMatters: string;
  studentTakeaway: string;
  sources: ModelSource[];
}

export interface ModelCompany {
  id: string;
  name: string;
  shortName: string;
  country: string;
  updatedAt: string;
  publishedAt: string;
  oneSentenceTakeaway: string;
  whyItMatters: string;
  contentType: "model";
  targetAudience: string[];
  readingTime: string;
  actionLabel: string;
  impactScore: number;
  readabilityScore: number;
  actionabilityScore: number;
  confidenceScore: number;
  difficulty: string;
  recommendedAction: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  nextSteps: string[];
  sources: ModelSource[];
  learningPath: ModelLearningItem[];
  series: ModelSeries[];
  updates: ModelUpdate[];
}

export interface ModelsData {
  generatedAt: string;
  companies: ModelCompany[];
}

export interface ArticleSource {
  name: string;
  url: string;
}

export interface ArticleVersion {
  id: string;
  label: string;
  submittedAt: string;
  versionType: string;
  changeSummary: string;
  whyChanged: string;
  readerQuestion: string;
  evidence: string;
  impactScore: number;
}

export interface ArticleChartBar {
  label: string;
  value: number;
  display: string;
  highlight?: boolean;
}

export interface ArticleChart {
  title: string;
  metric: string;
  unit: string;
  maxValue?: number;
  bars: ArticleChartBar[];
}

export interface ArticleAnalysis {
  thesis: string;
  background: string;
  method: string;
  experiments: string;
  limitations: string;
  professorLens: string;
  verificationChecklist: string[];
}

export interface AcademicArticle {
  id: string;
  title: string;
  shortTitle: string;
  authors: string;
  venue: string;
  arxivId: string;
  contentType: "paper";
  publishedAt: string;
  updatedAt: string;
  oneSentenceTakeaway: string;
  whyItMatters: string;
  targetAudience: string[];
  readingTime: string;
  actionLabel: string;
  impactScore: number;
  readabilityScore: number;
  actionabilityScore: number;
  confidenceScore: number;
  difficulty: string;
  recommendedAction: string;
  tags: string[];
  sourceName: string;
  sourceUrl: string;
  sources: ArticleSource[];
  versionQuestion: string;
  versions: ArticleVersion[];
  versionRelation: string;
  conceptMap: string[];
  charts: ArticleChart[];
  analysis: ArticleAnalysis;
  nextSteps: string[];
}

export interface ArticlesData {
  generatedAt: string;
  papers: AcademicArticle[];
}
