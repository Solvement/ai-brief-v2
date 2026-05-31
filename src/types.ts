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
  analysisModels?: {
    projectLight: string;
    projectDeep: string;
  };
  pipelineRun?: AgentPipelineRunRef;
  agentFlow?: AgentPipelineFlowStep[];
  qualityGate?: AgentQualityGate;
  daily: Board;
  weekly: Board;
  monthly: Board;
}

export interface AgentPipelineFlowStep {
  stage?: string;
  role: string;
  responsibility: string;
  signal: string;
}

export interface AgentQualityGateCheck {
  id: string;
  label: string;
  status: "pass" | "warning" | "fail";
  details: string;
}

export interface AgentQualityGate {
  schemaVersion: number;
  surface: string;
  status: "pass" | "warning" | "fail";
  checkedAt: string;
  checks: AgentQualityGateCheck[];
}

export interface AgentPipelineRunRef {
  id: string;
  memoryFile: string;
  statusFile: string;
}

export interface AgentPipelinePublicRun {
  id: string;
  surface: string;
  date: string;
  generatedAt: string;
  qualityStatus: "pass" | "warning" | "fail" | "unknown";
  selectedCount: number;
  archivedCount: number;
  traceSummary?: AgentPipelineTraceSummary | null;
  reflectionSummary?: string;
  highlights: string[];
  nextActions: string[];
}

export interface AgentPipelineTraceSummary {
  candidateCount?: number;
  selectedCount?: number;
  reviewedCount?: number;
  sourceFailureCount?: number;
  modelCalls?: number;
  totalTokens?: number;
}

export interface AgentMemoryPattern {
  text: string;
  source: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface AgentPipelineSurfaceStatus {
  surface: string;
  updatedAt: string;
  latestRun: AgentPipelinePublicRun | null;
  runCount: number;
  reusablePatterns: AgentMemoryPattern[];
}

export interface PipelineStatusData {
  schemaVersion: number;
  generatedAt: string;
  principle: string;
  surfaces: AgentPipelineSurfaceStatus[];
  recentRuns: AgentPipelinePublicRun[];
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

// ---- Academic analysis (2026-05-30 redesign): mirrors the paper's own sections ----
export interface PaperAnalysisSection {
  /** The paper's own section, heading translated to plain Chinese (顺着论文版块走). */
  heading: string;
  /** Plain-language translate + summarize of that section. */
  summary: string;
  /** Optional: locates the load-bearing claim/assumption — LOCATE only, no verdict. */
  loadBearing?: string;
  /** Optional: objective facts about evidence strength / scope — facts, no verdict. */
  evidence?: string;
  /** Optional deep-tier material folded behind a 线头. */
  fold?: string;
}

export interface AcademicPaperLimits {
  /** What the paper itself states as limitations / future work (faithful). */
  paperStated: string;
  /** AI's objective notes on evidence strength / sampling scope (facts, not a verdict). */
  evidenceNotes: string;
}

export interface AcademicPaperSelection {
  /** Independent trusted sources that converged on this paper (汇聚). */
  convergence: string[];
  /** Matched focus tracks (赛道) — kept broad. */
  track: string[];
  /** One-line idea-quality signal from triage (a fact, not a verdict). */
  ideaSignal: string;
}

// ---- Reviewer-style deep dive (2026-05-31): the "审稿式" deep tier ----
/** One contribution layer: what the paper claims vs the analyst's judgment (kept separate). */
export interface ContributionLayer {
  layer: string;       // e.g. 基础设施层 / 训练方法层 / 通用性层
  claim: string;       // 论文主张
  judgment: string;    // 我的判断 (assessment, not a bare verdict)
}
/** A real metric pulled from the full text (with provenance note). */
export interface EvidenceMetric {
  label: string;
  value: string;       // keep as string to preserve units / ranges
  note?: string;       // what it means / caveat
}
/** One component of the evidence chain: real numbers + a reviewer point. */
export interface EvidenceChainItem {
  component: string;   // e.g. Orchard Env / SWE / BAR / GUI / Claw
  metrics: EvidenceMetric[];
  reviewerNote: string; // strong / weak / confounded — distinguish headline vs driver
}
/** An external claim audited against reality (e.g. open-source / reproducibility / "latest"). */
export interface ClaimAudit {
  claim: string;       // what the paper/source asserts
  finding: string;     // what verification actually found
  source?: string;     // url checked
}
/** Reasoned reviewer score (NOT a black-box pill): dimension + /10 + justification. */
export interface ScoreCardItem {
  dimension: string;   // 问题重要性 / 系统设计 / 算法新颖性 / 实验强度 / 泛化 / 可复现性 / 影响
  score: number;       // 0-10
  reason: string;
}
export interface PaperDeepDive {
  /** 重判定位 — what the paper REALLY is, not its self-description. */
  reframe: string;
  contributionLayers: ContributionLayer[];
  /** Key mechanism: why it might work (precise + plain). */
  mechanism: string;
  evidenceChain: EvidenceChainItem[];
  /** External-claim audit (reproducibility / repo status / "latest"). May be empty. */
  audit: ClaimAudit[];
  loadBearingClaim: string;
  strongestEvidence: string[];
  limitations: string[];
  suggestedExperiments: string[];
}

export interface AcademicPaperAnalysis {
  id: string;
  title: string;
  authors: string;            // may be "双盲匿名"
  venue: string;
  sourceName: string;
  sourceUrl: string;
  arxivId?: string;
  publishedAt?: string;
  verifiedAt: string;         // RULES §6
  tier: "light" | "deep";
  /** 定调 — one framing judgment line (framing, NOT good/bad). */
  leadJudgment: string;
  /** Mirrors the paper's own sections, in order. */
  sections: PaperAnalysisSection[];
  limitsAndFuture: AcademicPaperLimits;
  selection: AcademicPaperSelection;
  provenance: { sourceUrl: string; evidenceKind: string };
  /** Reasoned reviewer scorecard (deep tier) — dimensions with /10 + justification. */
  scorecard?: ScoreCardItem[];
  /** Reviewer-style deep dive (deep tier only). */
  deepDive?: PaperDeepDive;
}

export interface ArticlesData {
  generatedAt: string;
  pipelineRun?: AgentPipelineRunRef;
  agentFlow?: AgentPipelineFlowStep[];
  qualityGate?: AgentQualityGate;
  papers: AcademicPaperAnalysis[];
}

export interface PaperRadarSummaryPaper {
  id: string;
  title: string;
  daily_action: string;
  triage_decision: string;
  total_score: number;
  sourceName: string;
  sourceUrl: string;
  matched_topics: string[];
  freshness_signal: string;
  hotness_signal: string;
  reason: string;
}

export interface PaperRadarAgentFlowStep {
  stage?: string;
  role: string;
  responsibility: string;
  signal: string;
}

export interface PaperRadarSelectionTraceItem {
  id: string;
  title: string;
  score: number;
  decision: string;
  status: string;
  reason: string;
  aheSignals: string[];
  freshness: string;
  hotness: string;
}

export interface PaperRadarRunTraceStage {
  stage: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  modelUsage?: {
    calls: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    models: Record<string, {
      calls: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    }>;
  };
  [key: string]: unknown;
}

export interface PaperRadarRunTrace {
  summary: AgentPipelineTraceSummary;
  stages: PaperRadarRunTraceStage[];
  modelUsage: PaperRadarRunTraceStage["modelUsage"];
  sourceFailures: {
    source: string;
    queryLabel: string;
    failureReason: string;
  }[];
}

export interface PaperRadarReflection {
  schemaVersion: number;
  summary: string;
  averageReviewDepth: number;
  whatWorked: string[];
  whatToWatch: string[];
  selfCorrections: string[];
  nextRunAdjustments: string[];
}

export interface PaperRadarPublicData {
  schemaVersion: number;
  date: string;
  generatedAt: string;
  sourceFiles: {
    daily: string;
    triage: string;
  };
  pipelineRun?: AgentPipelineRunRef | null;
  qualityGate?: AgentQualityGate | null;
  runTrace?: PaperRadarRunTrace | null;
  reflection?: PaperRadarReflection | null;
  memoryVersion?: number;
  triageSummary: {
    candidateCount: number;
    scoredCount: number;
    selectedCount: number;
    rejectedCount: number;
    belowTopCutoffCount: number;
    cutoffScore: number;
  } | null;
  agentFlow: PaperRadarAgentFlowStep[];
  mustRead: PaperRadarSummaryPaper | null;
  skim: PaperRadarSummaryPaper[];
  professorLesson: string;
  goodIdeaToSteal: string;
  badIdeaOrRisk: string;
  transferablePattern: string;
  futureWorkApplication: string;
  architectureTakeaway: string;
  interviewTalkingPoint: string;
  projectIdea: string;
  topPapers: PaperRadarSummaryPaper[];
  selectionTrace: PaperRadarSelectionTraceItem[];
}
