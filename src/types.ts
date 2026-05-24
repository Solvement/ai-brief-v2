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

export interface ArticlePlainLanguage {
  beginnerSummary: string;
  mentalModel: string;
  whyItWorks: string;
  oneThingToRemember: string;
}

export interface ArticlePrerequisiteTerm {
  term: string;
  plainMeaning: string;
  whyItMatters: string;
}

export interface ArticleFlowStep {
  label: string;
  title: string;
  body: string;
}

export interface ArticleDesignChoice {
  title: string;
  choice: string;
  why: string;
  tradeoff: string;
}

export interface ArticleIdeaArchitecture {
  centralQuestion: string;
  coreMove: string;
  designChoices: ArticleDesignChoice[];
  methodFlow: ArticleFlowStep[];
  optimizationLogic: string;
}

export interface ArticleArchitectureBlock {
  label: string;
  title: string;
  role: string;
  beginnerExplanation: string;
  connectsTo: string;
}

export interface ArticleArchitectureWalkthrough {
  originalPaperBoundary: string;
  modernExtensionBoundary: string;
  blocks: ArticleArchitectureBlock[];
}

export interface ArticleEvidenceLens {
  benchmarkTakeaway: string;
  whatWasCompared: string;
  whatToTrust: string;
  whatNotToOverclaim: string;
}

export interface ArticleExperimentReading {
  question: string;
  setup: string;
  metric: string;
  result: string;
  conclusion: string;
  limitation: string;
}

export interface ArticleStudyLens {
  professorExplanation: string;
  beginnerPath: string[];
  commonMisreadings: string[];
  practicePrompt: string;
}

export interface ArticleVerificationTask {
  level: string;
  title: string;
  task: string;
  passCriteria: string[];
  commonMistake: string;
  sampleAnswer: string;
}

export type PaperType =
  | "benchmark_evaluation"
  | "system_method"
  | "agent_architecture"
  | "survey"
  | "theory_algorithm"
  | "product_engineering_blog";

export interface BenchmarkPaperQuestion {
  researchQuestion: string;
  challengedConclusion: string;
  whyImportant: string;
}

export interface BenchmarkTermPrimerItem {
  term: string;
  explanation: string;
  missingEvidence?: string;
}

export interface BenchmarkClaimMapItem {
  claim: string;
  evidence: string;
  possibleCounterpoint: string;
  confidence: string;
  missingEvidence?: string;
}

export interface BenchmarkExperimentMatrixItem {
  experimentName: string;
  input: string;
  hiddenInformation: string;
  metric: string;
  whatItTests: string;
  whyItMatters: string;
  missingEvidence?: string;
}

export interface BenchmarkResultAnalysisItem {
  mainResult: string;
  interpretation: string;
  supportsClaim: string;
  alternativeExplanation: string;
  missingEvidence?: string;
}

export interface BenchmarkCriticalReview {
  strengths: string[];
  weaknesses: string[];
  missingExperiments: string[];
  generalizationLimits: string[];
  counterArguments: string[];
}

export interface BenchmarkApplicationTranslation {
  howToUse: string;
  concreteImplementationIdea: string;
  evaluationChecklist: string[];
  failureModes: string[];
}

export interface BenchmarkInterviewCard {
  sixtySecondExplanation: string;
  interviewQuestions: string[];
  strongPersonalOpinion: string;
  smallProjectIdea: string;
}

export interface BenchmarkEvaluationAnalysis {
  paperQuestion: BenchmarkPaperQuestion;
  narrativeExplanation: string;
  termPrimer: BenchmarkTermPrimerItem[];
  claimMap: BenchmarkClaimMapItem[];
  experimentMatrix: BenchmarkExperimentMatrixItem[];
  resultsAnalysis: BenchmarkResultAnalysisItem[];
  criticalReview: BenchmarkCriticalReview;
  applicationDeploymentTranslation: BenchmarkApplicationTranslation;
  interviewCard: BenchmarkInterviewCard;
  missingEvidence?: string[];
}

export interface ArticleTemplateDecision {
  suggestedPaperType: PaperType;
  activePaperType: PaperType;
  confidence: string;
  reason: string;
  requiredModules: string[];
  fallbackReason?: string;
}

export interface ArticleQualityDecision {
  qualityScore: number;
  tier: "must_read" | "strong" | "archive" | "ignore";
  selectionReason: string;
  qualitySignals: string[];
  redFlags: string[];
  recommendedUse: string;
  archiveValue: string;
  selectedForDaily: boolean;
}

export interface AcademicArticle {
  id: string;
  title: string;
  shortTitle: string;
  authors: string;
  venue: string;
  arxivId: string;
  contentType: "paper";
  paperType: PaperType;
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
  plainLanguage: ArticlePlainLanguage;
  prerequisiteTerms: ArticlePrerequisiteTerm[];
  ideaArchitecture: ArticleIdeaArchitecture;
  architectureWalkthrough: ArticleArchitectureWalkthrough;
  evidenceLens: ArticleEvidenceLens;
  experimentReadings: ArticleExperimentReading[];
  studyLens: ArticleStudyLens;
  verificationTasks: ArticleVerificationTask[];
  benchmarkEvaluation?: BenchmarkEvaluationAnalysis;
  templateDecision: ArticleTemplateDecision;
  qualityDecision: ArticleQualityDecision;
  showVersionLens?: boolean;
  nextSteps: string[];
}

export interface ArticleTemplatePolicy {
  version: string;
  dailyLimit: number;
  selectionRule: string;
  fallbackRule: string;
  supportedPaperTypes: PaperType[];
}

export interface ArticlesData {
  generatedAt: string;
  dailyLimit?: number;
  activeCount?: number;
  archiveCount?: number;
  pipelineRun?: AgentPipelineRunRef;
  agentFlow?: AgentPipelineFlowStep[];
  qualityGate?: AgentQualityGate;
  templatePolicy?: ArticleTemplatePolicy;
  papers: AcademicArticle[];
}

export interface ArticlesArchiveData {
  generatedAt: string;
  archiveCount: number;
  pipelineRun?: AgentPipelineRunRef;
  papers: (AcademicArticle & {
    archivedAt: string;
    archiveReason: string;
    reusableFor: string[];
  })[];
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
