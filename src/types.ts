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

export type ProjectDepth = "list_only" | "light" | "analysis" | "deep" | "needs_enrichment";
export type ProjectTier = 0 | 1 | 2 | 3;

/** Per-tier structured fields from the project-radar tier paradigm (2026-06-03). */
export interface ProjectTierTemplate {
  tier?: ProjectTier;
  bucket?: string;
  tag?: string;
  one_sentence_positioning?: string;
  what_it_does?: string;
  /** New concise paradigm (2026-06-08): architecture / data-flow as a ```mermaid block. */
  architecture_diagram?: string;
  metadata?: {
    language?: string | null;
    total_stars?: number | string;
    stars_in_period?: number | string;
    author?: string;
  };
  labels?: string[];
  prose_body?: string;
  // Tier 2+
  pain_point?: string;
  core_capabilities?: string[];
  how_to_run?: { install_command?: string; minimal_example?: string };
  maturity_signals?: {
    star_velocity?: string;
    recent_commit?: string;
    releases?: string;
    issue_activity?: string;
  };
  comparison?: string;
  trajectory_note?: string;
  manual_confirmation?: boolean;
  // Tier 3+
  how_it_works_with_analogy?: string;
  essential_design_difference?: string;
  practitioner_meaning?: string;
  cross_links?: Array<{ label?: string; title?: string; url?: string; type?: string } | string>;
  // Tier 0
  index_only?: { name?: string; url?: string; automatic_tags?: string[] };
}

export interface AnalyzedRepo extends RepoSummary {
  rank: number;
  tldr: string;
  tags: string[];
  light: string;
  worthDeepDive: number;
  deep?: DeepDive;
  // ---- 2026-06-03 deterministic radar fields (project-radar-paradigm) ----
  final_depth?: ProjectDepth;
  ranking_score?: number;
  max_allowed_depth?: ProjectDepth;
  recommended_action?: string;
  needs_enrichment?: boolean;
  ranking_reasons?: string[];
  rejection_reasons?: string[];
  review_verdict?: string;
  review_issues?: string[];
  evidence_summary?: string | Record<string, unknown>;
  depth_decision?: Record<string, unknown>;
  briefSlug?: string;
  brief_slug?: string;
  // ---- 2026-06-03 tier paradigm (replaces light_spine) ----
  project_tier?: ProjectTier;
  project_tier_label?: string;
  project_bucket?: string;
  bucket?: string;
  tier_tag?: string;
  requires_manual_confirmation?: boolean;
  tier_template?: ProjectTierTemplate;
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

export type ModelKind = "open" | "closed";

export type ModelBenchmarkSourceType = "official" | "third-party" | "derived";

export interface ModelBenchmarkChartBar {
  label: string;
  display: string;
  value: number;
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
  attribution?: "自报" | "实测";
}

export interface ModelBenchmark {
  headline: string;
  professorNote: string;
  charts: ModelBenchmarkChart[];
  items: ModelBenchmarkItem[];
  caveats: string[];
}

export interface ModelStatusCard {
  latestVersion: string;
  latestVersionVariants?: string[];
  latestReleasedAt: string;
  latestReleasedAtPrecision?: string;
  isOpen: boolean;
  license: string;
  hasEvalData: boolean;
  evalSources: string[];
  evalThirdPartyPending?: string[];
  hasChangelog: boolean;
  changelogUrl: string;
  lastCheckedAt: string;
}

export interface ModelIdentity {
  id: string;
  name: string;
  vendor: string;
  country: string;
  kind: ModelKind;
}

export interface ModelUnlock {
  point: string;
  forYou: string;
  evidence: string;
  confidence: string;
}

export interface ModelOpenAnalysis {
  oneLineTakeaway: string;
  whatItUnlocks: ModelUnlock[];
  benchmark: ModelBenchmark;
  openSourceMeaning: string;
  whenToUse: string;
  cost_caveats: string;
  sources: ModelSource[];
}

export interface ModelClosedFeature {
  feature: string;
  whatItIs: string;
  forYou: string;
  howToUse: string;
  whenToUse: string;
}

export interface ModelClosedChangelog {
  oneLineTakeaway: string;
  newFeatures: ModelClosedFeature[];
  limitations: string;
  sources: ModelSource[];
}

export interface ModelParadigm {
  tag: string;
  branch: "new_model" | "update" | "variant_merged";
  access: ModelKind;
  tier?: 0 | 1 | 2 | 3;
  updateSize?: "light" | "medium";
  requiresHumanConfirmation?: boolean;
  template: "new_model_card" | "version_update" | "variant_merged";
  card?: Record<string, unknown>;
  update?: Record<string, unknown>;
  variant?: Record<string, unknown>;
}

export interface ModelEntryBase extends ModelIdentity, ModelStatusCard {
  analysisGeneratedAt: string;
  analysisAuthor: string;
  paradigm?: ModelParadigm;
}

export interface ModelOpenEntry extends ModelEntryBase {
  kind: "open";
  isOpen: true;
  analysis: ModelOpenAnalysis;
  changelog?: never;
}

export interface ModelClosedEntry extends ModelEntryBase {
  kind: "closed";
  isOpen: false;
  changelog: ModelClosedChangelog;
  analysis?: never;
}

export type ModelEntry = ModelOpenEntry | ModelClosedEntry;

export interface ModelsData {
  generatedAt: string;
  models: ModelEntry[];
}

// ---- Academic 精读伴读 / reading-companion schema (2026-06-01 rebuild) ----
// Core UX = "先让我自己想，再看 AI 的": a faithful first stage, then free-form AI notes.
// Deleted entirely: verdict / scorecard / FDE memo / claimLedger / evidenceMatrix /
// artifactAudit / falsification. Academic papers have ONE tier: deep.

export type PaperType = "survey" | "theory" | "system" | "benchmark" | "dataset" | "industry_case" | "evaluation_audit" | "tooling" | "position_roadmap";
export type VenueStatus = "verified" | "unverified" | "not_provided";

/** One key figure/table/result listed as TEXT (no real images this round). Factual only. */
export interface PaperKeyResult {
  kind: "figure" | "table" | "result";
  ref: string;        // "Figure 3" / "Table 1" / "Result"
  finding: string;    // factual finding, numbers from the paper — NO evaluation words
}

/** Stage 1 · 原文: one section of the paper, faithful translate + summarize. No AI judgment. */
export interface PaperReadingSection {
  /** The paper's own section heading, translated to plain Chinese. */
  heading: string;
  /** Faithful translate + summarize of that section. NO evaluative language. */
  summary: string;
  /** Up to ~5 key figures/tables/results across the whole paper, listed as text. */
  keyResults?: PaperKeyResult[];
}

export interface AcademicPaperLimits {
  /** What the paper itself states as limitations / future work (faithful). */
  paperStated: string;
  /** Objective notes on evidence strength / sampling scope (facts, not a verdict). */
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

/** Where the paper was found vs whether facts were verified against the primary source. */
export interface PaperSourceReliability {
  /** Discovery channel only (Papers with Code / HF Daily / OpenReview / newsletter…). */
  discoverySource: string;
  /** Whether facts/numbers/venue were checked against a primary source. */
  primarySourceVerified: boolean;
  paperHtmlFetched: boolean;
  pdfFetched: boolean;
  repoFetched: boolean;
  appendixFetched: boolean;
}

export interface PaperMeta {
  paperType: PaperType;
  venueStatus: VenueStatus;
  sourceReliability: PaperSourceReliability;
  tags: string[];
}

/** A weighting factor: a 0-100 number, or "unknown" before deep-stage backfill. */
export type SelectionFactor = number | "unknown";

/** Academic selection-gate factors (NOT shown to the user as a score — audit/debug only). */
export interface SelectionAuditFactors {
  venuePrestige: SelectionFactor;
  citationConvergence: SelectionFactor;
  novelty: SelectionFactor;
  recency: SelectionFactor;
  /** Backfilled after deep analysis (CONTEXT「合成方式 A」). "unknown" until then. */
  evidenceStrength: SelectionFactor;
  /** Backfilled after deep analysis. "unknown" until then. */
  reproducibility: SelectionFactor;
}

/** Selection-gate audit trail. Composed at selection + backfilled post-deep. Not user-facing. */
export interface SelectionAudit {
  candidateCount: number;
  selectedCount: number;
  selectionScore: number;
  selectedReason: string;
  rejectedReasonIfAny: string;       // empty when selected
  weightedFactors: SelectionAuditFactors;
  /** Discovery channel (must differ from primaryEvidenceSource). */
  discoverySource: string;
  /** The primary source the facts were read from (paper full text / PDF / repo). */
  primaryEvidenceSource: string;
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
  tier: "deep" | "light";
  cardKind?: "deep_v2" | "light_card";
  /** 定调 — one framing line (framing, NOT good/bad). */
  leadJudgment: string;
  hook?: string;
  lookahead?: string[];
  meta: PaperMeta;
  /** Stage 1 · 原文: faithful, follows the paper's own section order. No AI judgment. */
  originalReading?: PaperReadingSection[];
  /** Stage 2 · AI 分析: free-form critical commentary. The ONLY place judgment is allowed. */
  analystNotes?: string;
  limitsAndFuture?: AcademicPaperLimits;
  selection: AcademicPaperSelection;
  selectionAudit: SelectionAudit;
  provenance: { sourceUrl: string; evidenceKind: string };
  paradigm?: PaperParadigm;
  sourceContext?: {
    hfDate?: string;
    hfSourceUrl?: string;
    hfUpvotes?: number;
  };
}

/** v2 机器之心-style paper 解读 (paper-paradigm/v1). */
export interface PaperParadigmResultFirst {
  body?: string;
  source_anchor?: string;
}
export interface PaperParadigmDesignComparison {
  choice?: string;
  why_not_common_alternative?: string;
  paper_anchor?: string;
}
export interface PaperParadigmEvidence {
  claim?: string;
  reported_number?: string;
  opponent_or_baseline?: string;
  source_anchor?: string;
}
export interface PaperParadigmAblation {
  question_answered?: string;
  paper_report?: string;
  source_anchor?: string;
}
export interface PaperParadigmSection {
  title?: string;
  body?: string;
  design_comparisons?: PaperParadigmDesignComparison[];
  evidence?: PaperParadigmEvidence[];
  ablations?: PaperParadigmAblation[];
}
export interface PaperParadigmMeaning {
  engineering?: string;
  methodology?: string;
  application_builder?: string;
}
export interface PaperParadigmLimitation {
  limit?: string;
  paper_anchor?: string;
}
export interface PaperParadigmNumericClaim {
  value?: string;
  claim?: string;
  source_anchor?: string;
}
export interface PaperParadigm {
  schemaVersion?: string;
  openingTension?: string;
  oneSentenceClaim?: string;
  resultFirst?: PaperParadigmResultFirst | null;
  lookahead?: string[];
  sections?: PaperParadigmSection[];
  meaning?: PaperParadigmMeaning | null;
  limitations?: PaperParadigmLimitation[];
  closingLine?: string;
  numericClaims?: PaperParadigmNumericClaim[];
  proseMarkdown?: string;
  evidenceTrace?: Record<string, unknown> | null;
  validation?: Record<string, unknown> | null;
  authoring?: Record<string, unknown> | null;
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
