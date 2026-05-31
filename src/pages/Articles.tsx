import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AcademicArticle,
  ArticleArchitectureBlock,
  ArticleChart,
  ArticleDesignChoice,
  ArticleExperimentReading,
  ArticleFlowStep,
  ArticlePrerequisiteTerm,
  ArticleVerificationTask,
  ArticleVersion,
  ArticlesData,
  BenchmarkEvaluationAnalysis,
  PaperRadarPublicData,
} from "../types";
import { loadArticles, loadPaperRadar } from "../lib/data";
import { SiteHeader } from "../components/SiteHeader";

interface Props {
  paperId?: string;
}

function formatDate(iso: string): string {
  const day = iso.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day.replaceAll("-", ".");
  return iso;
}

function formatMs(ms?: number): string {
  if (!Number.isFinite(ms)) return "n/a";
  if ((ms || 0) < 1000) return `${Math.round(ms || 0)}ms`;
  return `${Math.round((ms || 0) / 100) / 10}s`;
}

function sortPapersForAiEngineer(papers: AcademicArticle[]): AcademicArticle[] {
  return [...papers].sort((a, b) => {
    const qualityDelta = (b.qualityDecision?.qualityScore || 0) - (a.qualityDecision?.qualityScore || 0);
    if (qualityDelta !== 0) return qualityDelta;
    const dateDelta = Date.parse(b.updatedAt || b.publishedAt) - Date.parse(a.updatedAt || a.publishedAt);
    if (dateDelta !== 0) return dateDelta;
    return b.impactScore - a.impactScore;
  });
}

type PaperView =
  | "path"
  | "brief"
  | "architecture"
  | "evidence"
  | "professor"
  | "claims"
  | "experiments"
  | "critical"
  | "application"
  | "interview"
  | "versions";
type RefreshState = "idle" | "running" | "done" | "error";

type PaperViewDefinition = { id: PaperView; label: string; hint: string };
type ArchitectureLensSection = { label: string; title: string; body: string };

const defaultPaperViews: PaperViewDefinition[] = [
  { id: "path", label: "主线", hint: "完整读法" },
  { id: "brief", label: "速读", hint: "先听懂" },
  { id: "architecture", label: "架构", hint: "看设计" },
  { id: "evidence", label: "证据", hint: "看实验" },
  { id: "professor", label: "学习/自测", hint: "闭环" },
];

const benchmarkPaperViews: PaperViewDefinition[] = [
  { id: "path", label: "问题", hint: "先定靶" },
  { id: "claims", label: "Claim Map", hint: "论点证据" },
  { id: "experiments", label: "实验矩阵", hint: "拆实验" },
  { id: "critical", label: "批判", hint: "看反方" },
  { id: "application", label: "落地", hint: "怎么用" },
  { id: "interview", label: "面试卡", hint: "会表达" },
];

function shouldShowVersionLens(paper: AcademicArticle): boolean {
  return Boolean(paper.showVersionLens);
}

function getPaperViews(paper: AcademicArticle): PaperViewDefinition[] {
  const baseViews =
    paper.paperType === "benchmark_evaluation" && paper.benchmarkEvaluation
      ? benchmarkPaperViews
      : defaultPaperViews;
  return shouldShowVersionLens(paper)
    ? [...baseViews, { id: "versions", label: "版本", hint: "有变化才看" }]
    : baseViews;
}

function joinNarrativeParts(parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

function compactReadingText(text: string, max = 180): string {
  const clean = text.replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const sentence = clean.match(/^(.+?[。！？.!?])\s*/)?.[1];
  if (sentence && sentence.length <= max) return sentence;
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function firstPaperTask(paper: AcademicArticle): string {
  const task = paper.verificationTasks[0];
  if (task) return compactReadingText(task.task, 150);
  return "读完后用自己的话复述问题、方法、证据和一个可迁移做法。";
}

function paperMechanismLine(paper: AcademicArticle): string {
  if (paper.paperType === "benchmark_evaluation" && paper.benchmarkEvaluation) {
    const claim = paper.benchmarkEvaluation.claimMap[0]?.claim;
    if (claim) return compactReadingText(claim, 150);
  }
  return compactReadingText(joinNarrativeParts([paper.ideaArchitecture.coreMove, paper.ideaArchitecture.optimizationLogic]), 170);
}

function isSystemArchitecturePaper(paper: AcademicArticle): boolean {
  return paper.paperType === "system_method" || paper.paperType === "agent_architecture";
}

function buildArchitectureLensSections(paper: AcademicArticle): ArchitectureLensSection[] {
  const blocks = paper.architectureWalkthrough.blocks;
  const steps = paper.ideaArchitecture.methodFlow;
  const choices = paper.ideaArchitecture.designChoices;
  const firstBlock = blocks[0];
  const lastBlock = blocks[blocks.length - 1];
  const firstExperiment = paper.experimentReadings[0];
  const firstChoice = choices[0];
  const roleSummary = blocks.map((block) => `${block.title}: ${block.role}`).join("; ");
  const interfaceChain = blocks.map((block) => `${block.title} -> ${block.connectsTo}`).join("; ");
  const controlLoop = steps.map((step) => step.title).join(" -> ");

  return [
    {
      label: "Input",
      title: "系统从什么输入边界开始",
      body: joinNarrativeParts([
        `这篇论文的输入问题是：${paper.ideaArchitecture.centralQuestion}`,
        firstBlock && `第一个被处理的对象是 ${firstBlock.title}，它负责${firstBlock.role}。`,
        paper.analysis.background,
      ]),
    },
    {
      label: "Roles",
      title: "把模块看成 agent roles，不只是小技巧",
      body: joinNarrativeParts([
        roleSummary && `如果用多 agent / system 的语言重写，核心角色分工就是 ${roleSummary}。`,
        firstChoice && `第一个关键角色决策是“${firstChoice.title}”：${firstChoice.choice}`,
      ]),
    },
    {
      label: "Loop",
      title: "Orchestrator / control loop 是怎么推动的",
      body: joinNarrativeParts([
        controlLoop && `这篇论文的控制主线可以概括为 ${controlLoop}。`,
        paper.ideaArchitecture.optimizationLogic,
      ]),
    },
    {
      label: "Interfaces",
      title: "Tool / data / memory interface 在哪里",
      body: joinNarrativeParts([
        interfaceChain && `真正可迁移的不是摘要里的口号，而是这条接口链：${interfaceChain}。`,
        firstChoice && `一个值得学的接口取舍是：${firstChoice.why}`,
      ]),
    },
    {
      label: "Feedback",
      title: "反馈循环不是抽象的“变好”",
      body: joinNarrativeParts([
        firstExperiment && `作者用 ${firstExperiment.metric} 来观察反馈，具体问的是“${firstExperiment.question}”。`,
        firstExperiment && `这个反馈循环的含义是：${firstExperiment.conclusion}`,
        paper.studyLens.practicePrompt,
      ]),
    },
    {
      label: "Evaluation",
      title: "评估的焦点是什么，又不能说明什么",
      body: joinNarrativeParts([
        paper.evidenceLens.benchmarkTakeaway,
        firstExperiment && `核心结果是 ${firstExperiment.result}`,
        paper.evidenceLens.whatNotToOverclaim && `但评估边界也要记住：${paper.evidenceLens.whatNotToOverclaim}`,
      ]),
    },
    {
      label: "Pattern",
      title: "最值得带走的 transferable pattern",
      body: joinNarrativeParts([
        paper.analysis.professorLens,
        lastBlock && `如果你要做自己的系统，可以从 ${lastBlock.title} 这个输出点倒推需要哪些上游证据和接口。`,
      ]),
    },
  ];
}

export function Articles({ paperId }: Props) {
  const [data, setData] = useState<ArticlesData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadArticles().then(setData).catch((e) => setErr(e?.message || String(e)));
  }, []);

  const paper = useMemo(() => {
    if (!data || !paperId) return null;
    return data.papers.find((item) => item.id === paperId) || null;
  }, [data, paperId]);

  const sortedData = useMemo(() => {
    if (!data) return null;
    return { ...data, papers: sortPapersForAiEngineer(data.papers) };
  }, [data]);

  if (err) {
    return (
      <>
        <SiteHeader active="articles" />
        <main className="page">
          <div className="notice error">加载 Articles 数据失败：{err}</div>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <SiteHeader active="articles" />
        <main className="page">
          <div className="loading">正在加载 Articles...</div>
        </main>
      </>
    );
  }

  if (paperId && !paper) {
    return (
      <>
        <SiteHeader active="articles" />
        <main className="page">
          <div className="breadcrumb">
            <a href="#/articles">Articles</a><span className="sep">/</span><span>{paperId}</span>
          </div>
          <div className="notice">还没有找到这篇论文的版本分析。</div>
        </main>
      </>
    );
  }

  if (!sortedData) return null;
  if (paper) return <ArticleDetail paper={paper} generatedAt={sortedData.generatedAt} papers={sortedData.papers} />;
  return <ArticlesIndex data={sortedData} />;
}

function ArticlesIndex({ data }: { data: ArticlesData }) {
  const [refresh, setRefresh] = useState<RefreshState>("idle");
  const [log, setLog] = useState("");
  const [radar, setRadar] = useState<PaperRadarPublicData | null>(null);
  const [radarErr, setRadarErr] = useState<string | null>(null);
  const logRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  useEffect(() => {
    loadPaperRadar().then(setRadar).catch((e) => setRadarErr(e?.message || String(e)));
  }, []);

  const refreshArticles = async () => {
    if (refresh === "running") return;
    setRefresh("running");
    setLog("");
    try {
      const res = await fetch("/__publish-papers", { method: "POST" });
      if (!res.ok || !res.body) {
        if (res.status === 404) throw new Error("dev server middleware 没生效。请重启 npm run dev。");
        throw new Error("HTTP " + res.status);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        setLog(buf);
      }
      setRefresh("done");
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      setRefresh("error");
      setLog((prev) => prev + "\n[error] " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const closeLog = () => { if (refresh !== "running") { setRefresh("idle"); setLog(""); } };
  const refreshRadar = async () => {
    if (refresh === "running") return;
    setRefresh("running");
    setLog("");
    try {
      const res = await fetch("/__refresh-paper-radar", { method: "POST" });
      if (!res.ok || !res.body) {
        if (res.status === 404) throw new Error("dev server middleware 没生效。请重启 npm run dev。");
        throw new Error("HTTP " + res.status);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        setLog(buf);
      }
      setRefresh("done");
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      setRefresh("error");
      setLog((prev) => prev + "\n[error] " + (e instanceof Error ? e.message : String(e)));
    }
  };
  const dailyLimit = data.dailyLimit || data.papers.length;
  const archiveCount = data.archiveCount || 0;

  return (
    <>
      <SiteHeader
        active="articles"
        meta={(
          <>
            <span className="meta-text">Articles 更新于 {formatDate(data.generatedAt)} · 今日 {data.papers.length}/{dailyLimit} 篇 · Archive {archiveCount}</span>
            <button className="refresh-btn" onClick={refreshArticles} disabled={refresh === "running"}>
              {refresh === "running" ? "刷新中..." : "刷新文章"}
            </button>
            <button className="refresh-btn" onClick={refreshRadar} disabled={refresh === "running"}>
              {refresh === "running" ? "运行中..." : "刷新 Radar"}
            </button>
          </>
        )}
      />
      <main className="page articles-page">
        <section className="articles-intro">
          <div>
            <div className="eyebrow">Academic Articles</div>
            <h1>按思路读论文，而不是只背摘要</h1>
            <p>
              每天先判断文章好坏，只保留 5 篇高质量 active papers；旧文章进入 archive 保存思路和架构。模板不是入选理由，而是文章通过质量筛选后再选择的解读方式。
            </p>
          </div>
          <div className="article-read-model">
            <span>Question</span>
            <span>Idea</span>
            <span>Architecture</span>
            <span>Evidence</span>
            <span>Practice</span>
          </div>
        </section>

        <PaperRadarPanel radar={radar} error={radarErr} />

        <section className="article-card-grid">
          {data.papers.map((paper) => (
            <a className="article-card" href={`#/articles/${paper.id}`} key={paper.id}>
              <div className="article-card-top">
                <div>
                  <span>{paper.arxivId}</span>
                  <h2>{paper.shortTitle}</h2>
                </div>
                <b>{paper.difficulty}</b>
              </div>
              <p className="article-title">{paper.title}</p>
              <p className="article-question">核心问题：{paper.ideaArchitecture.centralQuestion}</p>
              <p>{paper.oneSentenceTakeaway}</p>
              <div className="article-decision-grid">
                <InfoMini label="适合谁" value={paper.targetAudience.slice(0, 2).join(" / ")} />
                <InfoMini label="预计时间" value={paper.readingTime} />
                <InfoMini label="质量分" value={`${paper.qualityDecision.qualityScore} · ${qualityTierLabel(paper.qualityDecision.tier)}`} />
                <InfoMini label="解读模板" value={paper.templateDecision.activePaperType} />
              </div>
              <p className="article-card-reason"><b>为什么入选：</b>{paper.qualityDecision.selectionReason}</p>
              <p className="article-card-reason"><b>为什么值得读：</b>{paper.whyItMatters}</p>
              <div className="tag-row">
                {paper.tags.slice(0, 3).map((tag) => <span className="tag" key={tag}>主题/影响 · {tag}</span>)}
              </div>
              <div className="article-score-row">
                <ScorePill label="Impact" value={paper.impactScore} />
                <ScorePill label="Action" value={paper.actionabilityScore} />
                <ScorePill label="Confidence" value={paper.confidenceScore} />
              </div>
            </a>
          ))}
        </section>
      </main>

      {refresh !== "idle" && (
        <div className="ingest-overlay" role="dialog" aria-modal="true">
          <div className="ingest-modal">
            <div className="ingest-head">
              <div>
                {refresh === "running" && <><span className="spinner" /> 正在刷新近期 AI 论文并校验编码...</>}
                {refresh === "done" && <>完成，正在重新加载页面</>}
                {refresh === "error" && <>刷新出错</>}
              </div>
              <button className="ingest-close" onClick={closeLog} disabled={refresh === "running"}>
                {refresh === "running" ? "请等待" : "关闭"}
              </button>
            </div>
            <pre className="ingest-log" ref={logRef}>{log || "（等待 server 响应...）"}</pre>
            {refresh === "running" && (
              <div className="ingest-hint">
                文章刷新会写入最新 curated AI engineer 论文池，并自动跑 text encoding 和 articles schema 校验。
              </div>
            )}
            {refresh === "error" && (
              <div className="ingest-hint">
                <button className="refresh-btn" onClick={refreshArticles}>重试</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PaperRadarPanel({ radar, error }: { radar: PaperRadarPublicData | null; error: string | null }) {
  if (error) {
    return (
      <section className="paper-radar-panel">
        <div className="section-kicker">AI Job Research Radar</div>
        <h2>Radar 数据暂时不可用</h2>
        <p>{error}</p>
      </section>
    );
  }

  if (!radar) {
    return (
      <section className="paper-radar-panel">
        <div className="section-kicker">AI Job Research Radar</div>
        <h2>还没有发布今日 Radar</h2>
        <p>点击“刷新 Radar”会运行 discover、triage、daily，并把结果发布到前端可读的数据文件。</p>
      </section>
    );
  }

  const summary = radar.triageSummary;
  return (
    <section className="paper-radar-panel">
      <div className="paper-radar-head">
        <div>
          <div className="section-kicker">AI Job Research Radar · {formatDate(radar.generatedAt)}</div>
          <h2>今天的论文研究流水线</h2>
          <p>{radar.professorLesson}</p>
        </div>
        {summary && (
          <div className="paper-radar-metrics">
            <InfoMini label="候选" value={String(summary.candidateCount)} />
            <InfoMini label="入选" value={String(summary.selectedCount)} />
            <InfoMini label="Cutoff" value={String(summary.cutoffScore)} />
          </div>
        )}
      </div>

      <div className="paper-radar-focus">
        {radar.mustRead && (
          <a className="paper-radar-must" href={radar.mustRead.sourceUrl} target="_blank" rel="noreferrer">
            <span>Must Read · {radar.mustRead.total_score}</span>
            <h3>{radar.mustRead.title}</h3>
            <p>{radar.mustRead.reason}</p>
          </a>
        )}
        <div className="paper-radar-ideas">
          <EvidenceFact label="可偷走的好设计" body={radar.goodIdeaToSteal} />
          <EvidenceFact label="不要照搬的风险" body={radar.badIdeaOrRisk} />
          <EvidenceFact label="可迁移模式" body={radar.transferablePattern} />
          <EvidenceFact label="作品集项目" body={radar.projectIdea} />
        </div>
      </div>

      <div className="paper-radar-flow">
        {radar.agentFlow.map((step) => (
          <article key={step.role}>
            <b>{step.role}</b>
            <p>{step.responsibility}</p>
            <small>{step.signal}</small>
          </article>
        ))}
      </div>

      {(radar.runTrace || radar.reflection) && (
        <div className="paper-radar-observability">
          {radar.runTrace && (
            <article className="radar-trace-card">
              <div className="section-kicker">Trace</div>
              <div className="radar-trace-metrics">
                <InfoMini label="Reviewed" value={String(radar.runTrace.summary.reviewedCount || 0)} />
                <InfoMini label="Source Fail" value={String(radar.runTrace.summary.sourceFailureCount || 0)} />
                <InfoMini label="Model Calls" value={String(radar.runTrace.summary.modelCalls || 0)} />
                <InfoMini label="Tokens" value={String(radar.runTrace.summary.totalTokens || 0)} />
              </div>
              <div className="radar-stage-list">
                {radar.runTrace.stages.map((stage) => (
                  <span key={`${stage.stage}-${stage.startedAt || stage.durationMs}`}>
                    <b>{stage.stage}</b>
                    <small>{formatMs(stage.durationMs)}</small>
                  </span>
                ))}
              </div>
            </article>
          )}

          {radar.reflection && (
            <article className="radar-reflection-card">
              <div className="section-kicker">Reflection</div>
              <h3>{radar.reflection.summary}</h3>
              <p>Review depth: {radar.reflection.averageReviewDepth}</p>
              <div className="radar-reflection-grid">
                <div>
                  <b>Watch</b>
                  {(radar.reflection.whatToWatch.length ? radar.reflection.whatToWatch : ["No watch item in this run."]).slice(0, 3).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div>
                  <b>Next Run</b>
                  {radar.reflection.nextRunAdjustments.slice(0, 3).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
}

function ArticleDetail({ paper, generatedAt, papers }: { paper: AcademicArticle; generatedAt: string; papers: AcademicArticle[] }) {
  const [activeVersionId, setActiveVersionId] = useState(paper.versions[0]?.id || "");
  const [activeView, setActiveView] = useState<PaperView>("path");
  const views = useMemo(() => getPaperViews(paper), [paper]);
  const activeVersion = paper.versions.find((version) => version.id === activeVersionId) || paper.versions[0];

  useEffect(() => {
    setActiveVersionId(paper.versions[0]?.id || "");
    setActiveView("path");
  }, [paper.id, paper.versions]);

  useEffect(() => {
    if (!views.some((view) => view.id === activeView)) setActiveView("path");
  }, [activeView, views]);

  return (
    <>
      <SiteHeader active="articles" meta={`Articles 更新于 ${formatDate(generatedAt)}`} />
      <main className="detail article-detail">
        <div className="breadcrumb">
          <a href="#/articles">Articles</a><span className="sep">/</span><span>{paper.shortTitle}</span>
        </div>

        <section className="paper-hero">
          <div>
            <div className="eyebrow">{paper.venue} · {paper.contentType}</div>
            <h1>{paper.title}</h1>
            <p className="paper-tldr"><b>TL;DR</b> · {paper.oneSentenceTakeaway}</p>
            <p className="paper-question-line"><b>核心问题</b> · {paper.ideaArchitecture.centralQuestion}</p>
            <p>{paper.whyItMatters}</p>
            <div className="tag-row">
              {paper.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </div>
          <aside className="paper-score-panel">
            <ScorePill label="Impact" value={paper.impactScore} />
            <ScorePill label="Readability" value={paper.readabilityScore} />
            <ScorePill label="Action" value={paper.actionabilityScore} />
            <ScorePill label="Confidence" value={paper.confidenceScore} />
          </aside>
        </section>

        <section className="article-workbench">
          <aside className="paper-rail">
            <div className="rail-label">Papers</div>
            {papers.map((item) => (
              <a key={item.id} className={`paper-pill${item.id === paper.id ? " active" : ""}`} href={`#/articles/${item.id}`}>
                <span>{item.shortTitle}</span>
                <small>{difficultyLabel(item.difficulty)} · {item.readingTime}</small>
              </a>
            ))}
            <div className="paper-rail-note">版本不是默认主线。先读问题、证据、实验和可迁移思路；只有论文真的有方法或数据变化时再看版本。</div>
          </aside>

          <div className="article-main">
            <ArticleReaderBrief paper={paper} />

            <nav className="paper-view-tabs" aria-label="论文阅读视图">
              {views.map((view) => (
                <button
                  key={view.id}
                  className={`paper-view-tab${view.id === activeView ? " active" : ""}`}
                  onClick={() => setActiveView(view.id)}
                >
                  <span>{view.label}</span>
                  <small>{view.hint}</small>
                </button>
              ))}
            </nav>

            {activeView === "path" && <PaperMainPathView paper={paper} />}
            {activeView === "brief" && <PlainLanguageView paper={paper} />}
            {activeView === "architecture" && <ArchitectureView paper={paper} />}
            {activeView === "evidence" && <EvidenceView paper={paper} />}
            {activeView === "professor" && <ProfessorView paper={paper} />}
            {activeView === "claims" && paper.benchmarkEvaluation && <BenchmarkClaimMapView analysis={paper.benchmarkEvaluation} />}
            {activeView === "experiments" && paper.benchmarkEvaluation && <BenchmarkExperimentMatrixView analysis={paper.benchmarkEvaluation} charts={paper.charts} />}
            {activeView === "critical" && paper.benchmarkEvaluation && <BenchmarkCriticalReviewView analysis={paper.benchmarkEvaluation} />}
            {activeView === "application" && paper.benchmarkEvaluation && <BenchmarkApplicationView analysis={paper.benchmarkEvaluation} />}
            {activeView === "interview" && paper.benchmarkEvaluation && <BenchmarkInterviewCardView analysis={paper.benchmarkEvaluation} />}
            {activeView === "versions" && (
              <VersionsView
                paper={paper}
                activeVersion={activeVersion}
                onSelectVersion={setActiveVersionId}
              />
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function ArticleReaderBrief({ paper }: { paper: AcademicArticle }) {
  const benchmark = paper.benchmarkEvaluation;
  const firstExperiment = paper.experimentReadings[0];
  const firstTerm = paper.prerequisiteTerms[0];
  const evidenceLine =
    benchmark?.claimMap[0]?.evidence ||
    firstExperiment?.conclusion ||
    paper.evidenceLens.benchmarkTakeaway;
  const transferLine =
    benchmark?.applicationDeploymentTranslation.concreteImplementationIdea ||
    paper.analysis.professorLens;

  return (
    <section className="reader-brief article-reader-brief">
      <div className="reader-brief-lead">
        <div className="section-kicker">Reader First</div>
        <h3>先把论文讲成人话</h3>
        <p>{compactReadingText(paper.plainLanguage.beginnerSummary, 210)}</p>
      </div>

      <div className="reader-brief-grid">
        <article>
          <span>它在问什么</span>
          <p>{compactReadingText(benchmark?.paperQuestion.researchQuestion || paper.ideaArchitecture.centralQuestion, 170)}</p>
        </article>
        <article>
          <span>核心机制</span>
          <p>{paperMechanismLine(paper)}</p>
        </article>
        <article>
          <span>证据怎么看</span>
          <p>{compactReadingText(evidenceLine, 170)}</p>
        </article>
        <article>
          <span>可以迁移什么</span>
          <p>{compactReadingText(transferLine, 170)}</p>
        </article>
      </div>

      <div className="reader-next-line">
        <b>先记住</b>
        <span>{paper.plainLanguage.oneThingToRemember}</span>
      </div>

      <div className="reader-next-line muted">
        <b>下一步</b>
        <span>{firstTerm ? `先懂 ${firstTerm.term}，然后做自测：${firstPaperTask(paper)}` : firstPaperTask(paper)}</span>
      </div>
    </section>
  );
}

function PaperQuestionBoard({ paper }: { paper: AcademicArticle }) {
  const benchmark = paper.benchmarkEvaluation;
  if (paper.paperType === "benchmark_evaluation" && benchmark) {
    return (
      <section className="paper-question-board benchmark-question-board">
        <div>
          <div className="section-kicker">Paper Question · Benchmark Evaluation</div>
          <h2>{benchmark.paperQuestion.researchQuestion}</h2>
          <div className="paper-question-columns">
            <EvidenceFact label="作者质疑什么" body={benchmark.paperQuestion.challengedConclusion} />
            <EvidenceFact label="为什么重要" body={benchmark.paperQuestion.whyImportant} />
          </div>
        </div>
        <SourceLinks sources={paper.sources} />
      </section>
    );
  }

  return (
    <section className="paper-question-board">
      <div>
        <div className="section-kicker">Paper Question</div>
        <h2>{paper.ideaArchitecture.centralQuestion}</h2>
        <p>{paper.ideaArchitecture.coreMove}</p>
      </div>
      <SourceLinks sources={paper.sources} />
    </section>
  );
}

function PaperMainPathView({ paper }: { paper: AcademicArticle }) {
  if (paper.paperType === "benchmark_evaluation" && paper.benchmarkEvaluation) {
    return <BenchmarkMainPathView paper={paper} analysis={paper.benchmarkEvaluation} />;
  }

  const firstExperiment = paper.experimentReadings[0];
  const firstTask = paper.verificationTasks[0];
  return (
    <section className="paper-main-path">
      <article className="main-path-card intro">
        <div className="section-kicker">Step 1 · 先听懂</div>
        <h3>{paper.plainLanguage.oneThingToRemember}</h3>
        <p>{paper.plainLanguage.beginnerSummary}</p>
      </article>
      <section className="main-path-grid">
        <article className="main-path-card compact-list-card">
          <div className="section-kicker">Step 2 · 先扫清术语</div>
          <h3>只先看最影响理解的词</h3>
          <div className="compact-term-list">
            {paper.prerequisiteTerms.slice(0, 4).map((term) => (
              <div key={term.term}>
                <b>{term.term}</b>
                <span>{compactReadingText(term.plainMeaning, 90)}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="main-path-card">
          <div className="section-kicker">Step 3 · 看流程</div>
          <h3>把方法压成一条主线</h3>
          <MethodFlowMini steps={paper.ideaArchitecture.methodFlow.slice(0, 4)} />
        </article>
      </section>
      {firstExperiment && (
        <article className="main-path-card">
          <div className="section-kicker">Step 4 · 看证据</div>
          <h3>{firstExperiment.question}</h3>
          <div className="main-path-evidence">
            <EvidenceFact label="怎么比" body={firstExperiment.setup} />
            <EvidenceFact label="说明什么" body={firstExperiment.conclusion} />
            <EvidenceFact label="不能说明什么" body={firstExperiment.limitation} />
          </div>
        </article>
      )}
      {firstTask && (
        <article className="main-path-card">
          <div className="section-kicker">Step 5 · 自测</div>
          <h3>{firstTask.title}</h3>
          <p>{firstTask.task}</p>
          <div className="main-path-evidence">
            <EvidenceFact label="输出格式" body={verificationDeliverable(firstTask)} />
            <EvidenceFact label="最低通过" body={firstTask.passCriteria.join("；")} />
            <EvidenceFact label="答案关键点" body={firstTask.sampleAnswer} />
          </div>
        </article>
      )}
    </section>
  );
}

function MethodFlowMini({ steps }: { steps: ArticleFlowStep[] }) {
  if (steps.length === 0) return <p>这篇内容没有明确的方法流程，先读核心机制和证据。</p>;
  return (
    <div className="method-flow-mini">
      {steps.map((step, index) => (
        <div key={`${step.title}-${index}`}>
          <span>{index + 1}</span>
          <b>{step.title}</b>
          <p>{compactReadingText(step.body, 95)}</p>
        </div>
      ))}
    </div>
  );
}

function BenchmarkMainPathView({ paper, analysis }: { paper: AcademicArticle; analysis: BenchmarkEvaluationAnalysis }) {
  return (
    <section className="benchmark-main-path">
      <NarrativeBlock
        kicker="Narrative Explanation"
        title="这篇 benchmark 论文到底在提醒我们什么"
        body={analysis.narrativeExplanation}
      />

      <section className="benchmark-route-grid">
        <article className="benchmark-route-panel">
          <div className="section-kicker">Reading Route</div>
          <h3>小型阅读路线</h3>
          <ol>
            <li>先确认作者质疑的是哪个已有结论。</li>
            <li>再把 file path、filtered accuracy、5-gram overlap 这些术语听懂。</li>
            <li>然后看每个 claim 背后用了什么实验支撑。</li>
            <li>最后问：如果我要评估自己的 coding agent，应该加哪几个 anti-contamination probe？</li>
          </ol>
        </article>
        <article className="benchmark-route-panel emphasis">
          <div className="section-kicker">Professor Note</div>
          <h3>{paper.plainLanguage.oneThingToRemember}</h3>
          <p>{paper.studyLens.professorExplanation}</p>
        </article>
      </section>

      <BenchmarkTermPrimer analysis={analysis} limit={6} />

      <section className="benchmark-snapshot">
        <div>
          <div className="section-kicker">Claim Snapshot</div>
          <h3>{analysis.claimMap[0]?.claim}</h3>
          <p>{analysis.claimMap[0]?.evidence}</p>
        </div>
        <div>
          <div className="section-kicker">Key Experiment</div>
          <h3>{analysis.experimentMatrix[0]?.experimentName}</h3>
          <p>{analysis.experimentMatrix[0]?.whyItMatters}</p>
        </div>
      </section>

      <MissingEvidenceList items={analysis.missingEvidence} />
    </section>
  );
}

function NarrativeBlock({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <article className="narrative-block">
      <div className="section-kicker">{kicker}</div>
      <h3>{title}</h3>
      {body.split(/\n{2,}/).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </article>
  );
}

function BenchmarkTermPrimer({ analysis, limit }: { analysis: BenchmarkEvaluationAnalysis; limit?: number }) {
  const terms = limit ? analysis.termPrimer.slice(0, limit) : analysis.termPrimer;
  return (
    <section className="benchmark-section">
      <div className="benchmark-section-head">
        <div>
          <div className="section-kicker">Term Primer</div>
          <h3>先把核心术语讲成人话</h3>
        </div>
      </div>
      <div className="term-primer-list">
        {terms.map((term) => (
          <article key={term.term}>
            <h4>{term.term}</h4>
            <p>{term.explanation}</p>
            {term.missingEvidence && <small>Missing evidence: {term.missingEvidence}</small>}
          </article>
        ))}
      </div>
    </section>
  );
}

function BenchmarkClaimMapView({ analysis }: { analysis: BenchmarkEvaluationAnalysis }) {
  return (
    <section className="benchmark-view">
      <NarrativeBlock
        kicker="Claim Map"
        title="先不要急着相信结论，逐条看 claim 是怎么被支撑的"
        body="Benchmark / Evaluation paper 的读法和普通方法论文不一样。方法论文通常问“这个系统怎么做”；评测论文要先问“作者质疑了什么测量方式，以及证据够不够”。所以这里把每个主张拆成 claim、evidence、possible counterpoint 和 confidence：你要学会同时看正方证据和反方解释。"
      />
      <div className="claim-map-list">
        {analysis.claimMap.map((item, index) => (
          <article className="claim-map-row" key={item.claim}>
            <div className="claim-index">C{index + 1}</div>
            <div>
              <h3>{item.claim}</h3>
              <div className="claim-map-grid">
                <EvidenceFact label="Evidence" body={item.evidence} />
                <EvidenceFact label="Counterpoint" body={item.possibleCounterpoint} />
                <EvidenceFact label="Confidence" body={item.confidence} />
              </div>
              {item.missingEvidence && <p className="missing-evidence">Missing evidence: {item.missingEvidence}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BenchmarkExperimentMatrixView({
  analysis,
  charts,
}: {
  analysis: BenchmarkEvaluationAnalysis;
  charts: ArticleChart[];
}) {
  return (
    <section className="benchmark-view">
      <NarrativeBlock
        kicker="Experiment Matrix"
        title="这篇论文真正的含金量在实验设计，而不只是摘要里的数字"
        body="读 SWE-Bench Illusion 时，你要特别关注实验有没有控制住“模型看到了什么”。file path identification 故意拿走仓库结构，filtered accuracy 拿走显式路径线索，function reproduction 和 prefix completion 则观察模型是否能复现不该凭空知道的代码片段。每个实验都在问同一件事：高分到底来自现场推理，还是来自已经暴露过的线索。"
      />
      <div className="experiment-matrix">
        {analysis.experimentMatrix.map((experiment) => (
          <article className="experiment-matrix-row" key={experiment.experimentName}>
            <div>
              <div className="section-kicker">{experiment.metric}</div>
              <h3>{experiment.experimentName}</h3>
              <p>{experiment.input}</p>
            </div>
            <div className="experiment-matrix-details">
              <EvidenceFact label="隐藏/控制变量" body={experiment.hiddenInformation} />
              <EvidenceFact label="测试什么" body={experiment.whatItTests} />
              <EvidenceFact label="为什么重要" body={experiment.whyItMatters} />
            </div>
            {experiment.missingEvidence && <p className="missing-evidence">Missing evidence: {experiment.missingEvidence}</p>}
          </article>
        ))}
      </div>
      <section className="benchmark-section">
        <div className="benchmark-section-head">
          <div>
            <div className="section-kicker">Results Analysis</div>
            <h3>结果不是数字堆叠，要看它是否真的支持 claim</h3>
          </div>
        </div>
        <div className="results-analysis-list">
          {analysis.resultsAnalysis.map((result, index) => (
            <article key={result.mainResult}>
              <span>R{index + 1}</span>
              <h4>{result.mainResult}</h4>
              <p><b>Interpretation：</b>{result.interpretation}</p>
              <p><b>Supports claim：</b>{result.supportsClaim}</p>
              <p><b>Alternative explanation：</b>{result.alternativeExplanation}</p>
              {result.missingEvidence && <small>Missing evidence: {result.missingEvidence}</small>}
            </article>
          ))}
        </div>
      </section>
      {charts.length > 0 && (
        <div className="evidence-chart-grid">
          {charts.map((chart) => <ArticleChartView chart={chart} key={chart.title} />)}
        </div>
      )}
    </section>
  );
}

function BenchmarkCriticalReviewView({ analysis }: { analysis: BenchmarkEvaluationAnalysis }) {
  return (
    <section className="benchmark-view">
      <NarrativeBlock
        kicker="Critical Review"
        title="好的论文不是只能赞成，也要知道哪里还没证明完"
        body="这篇论文的强处在于它把 benchmark contamination 变成了可执行诊断，而不是停留在情绪化质疑。但你读它时也要保留反方视角：模型也可能学到了真实的软件结构经验，不同 benchmark 的任务分布也可能不完全一致。成熟的读法不是“全信”或“全否”，而是把它变成你自己评估系统时的一组风险检查。"
      />
      <div className="critical-review-grid">
        <ListPanel title="Strengths" items={analysis.criticalReview.strengths} />
        <ListPanel title="Weaknesses" items={analysis.criticalReview.weaknesses} />
        <ListPanel title="Missing Experiments" items={analysis.criticalReview.missingExperiments} />
        <ListPanel title="Generalization Limits" items={analysis.criticalReview.generalizationLimits} />
      </div>
      <article className="counterpoint-panel">
        <div className="section-kicker">Counterarguments</div>
        <h3>反方观点必须认真看</h3>
        <ul>
          {analysis.criticalReview.counterArguments.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </article>
    </section>
  );
}

function BenchmarkApplicationView({ analysis }: { analysis: BenchmarkEvaluationAnalysis }) {
  return (
    <section className="benchmark-view">
      <NarrativeBlock
        kicker="Application / Deployment Translation"
        title="把论文思想迁移到自己的 AI 系统里"
        body={`${analysis.applicationDeploymentTranslation.howToUse}\n\n${analysis.applicationDeploymentTranslation.concreteImplementationIdea}`}
      />
      <div className="application-grid">
        <ListPanel title="Evaluation Checklist" items={analysis.applicationDeploymentTranslation.evaluationChecklist} />
        <ListPanel title="Failure Modes" items={analysis.applicationDeploymentTranslation.failureModes} />
      </div>
      <article className="workflow-panel">
        <div className="section-kicker">Executable Workflow</div>
        <h3>一个可落地的最小流程</h3>
        <ol>
          <li>准备公开 benchmark、私有 holdout、时间后移样本和 outside-repo 样本。</li>
          <li>对每个样本跑正常 agent 修复，记录 search/read/edit/test 轨迹。</li>
          <li>再跑 no-repo path guessing，检查没有仓库结构时是否仍能猜中文件。</li>
          <li>过滤 issue 中显式路径和 import 后重跑，得到 filtered accuracy。</li>
          <li>对生成代码和 ground truth 计算 5-gram overlap，并比较公开集和私有集差距。</li>
          <li>如果公开集显著更高，报告 contamination risk，并降低对 leaderboard 分数的解释强度。</li>
        </ol>
      </article>
    </section>
  );
}

function BenchmarkInterviewCardView({ analysis }: { analysis: BenchmarkEvaluationAnalysis }) {
  return (
    <section className="benchmark-view">
      <article className="interview-card-main">
        <div className="section-kicker">60 Second Explanation</div>
        <h3>面试时可以这样讲</h3>
        <p>{analysis.interviewCard.sixtySecondExplanation}</p>
      </article>
      <div className="interview-grid">
        <ListPanel title="Interview Questions" items={analysis.interviewCard.interviewQuestions} />
        <article className="interview-opinion">
          <div className="section-kicker">Strong Personal Opinion</div>
          <p>{analysis.interviewCard.strongPersonalOpinion}</p>
        </article>
        <article className="interview-opinion">
          <div className="section-kicker">Small Project Idea</div>
          <p>{analysis.interviewCard.smallProjectIdea}</p>
        </article>
      </div>
    </section>
  );
}

function MissingEvidenceList({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <article className="missing-evidence-panel">
      <div className="section-kicker">Missing Evidence</div>
      <h3>这里不能硬编，需要明确标出来</h3>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </article>
  );
}

function LearningLoop({ paper }: { paper: AcademicArticle }) {
  if (paper.paperType === "benchmark_evaluation" && paper.benchmarkEvaluation) {
    return (
      <section className="learning-loop compact-loop">
        <div>
          <div className="section-kicker">Deep Dive Route</div>
          <h3>小型阅读路线</h3>
        </div>
        <div className="learning-loop-steps">
          <span>1. 问题</span>
          <span>2. 术语</span>
          <span>3. Claim</span>
          <span>4. 实验</span>
          <span>5. 反方</span>
          <span>6. 落地</span>
        </div>
      </section>
    );
  }

  const highlightedTasks = paper.verificationTasks.slice(0, 3);

  return (
    <section className="learning-loop compact-loop compact-loop-detailed">
      <div>
        <div className="section-kicker">Deep Dive Loop</div>
        <h3>建议按这个顺序读完，并用自测闭环</h3>
      </div>
      <div className="learning-loop-steps">
        <span>1. 先修词汇</span>
        <span>2. 架构解剖</span>
        <span>3. 实验阅读</span>
        <span>4. 三层自测</span>
      </div>
      <div className="learning-loop-checks compact-checks">
        {highlightedTasks.map((task) => (
          <div key={task.title}>
            <b>{task.level}</b>
            <span>{task.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlainLanguageView({ paper }: { paper: AcademicArticle }) {
  return (
    <section className="paper-view-grid brief-view">
      <article className="plain-card primary">
        <div className="section-kicker">Beginner Explanation</div>
        <h3>这篇论文到底在说什么</h3>
        <p>{paper.plainLanguage.beginnerSummary}</p>
      </article>
      <article className="plain-card">
        <div className="section-kicker">Mental Model</div>
        <h3>用一个直觉先听懂</h3>
        <p>{paper.plainLanguage.mentalModel}</p>
      </article>
      <article className="plain-card">
        <div className="section-kicker">Why It Works</div>
        <h3>为什么这个思路能成立</h3>
        <p>{paper.plainLanguage.whyItWorks}</p>
      </article>
      <article className="remember-strip">
        <span>只记住一件事</span>
        <b>{paper.plainLanguage.oneThingToRemember}</b>
      </article>
      <PrerequisiteTerms terms={paper.prerequisiteTerms} />
      <div className="article-analysis-grid compact">
        <AnalysisCard title="核心论点" body={paper.analysis.thesis} />
        <AnalysisCard title="背景问题" body={paper.analysis.background} />
      </div>
    </section>
  );
}

function PrerequisiteTerms({ terms }: { terms: ArticlePrerequisiteTerm[] }) {
  return (
    <section className="prereq-panel">
      <div className="section-kicker">Prerequisite Terms</div>
      <h3>先把这些词听懂</h3>
      <div className="prereq-grid">
        {terms.map((term) => (
          <article key={term.term}>
            <b>{term.term}</b>
            <p>{term.plainMeaning}</p>
            <small>{term.whyItMatters}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArchitectureView({ paper }: { paper: AcademicArticle }) {
  const systemLensSections = buildArchitectureLensSections(paper);
  const systemLensEnabled = isSystemArchitecturePaper(paper);

  return (
    <section className="architecture-view">
      <NarrativeBlock
        kicker={systemLensEnabled ? "Professor + System Lens" : "Core Move"}
        title={systemLensEnabled ? "先把论文翻译成系统设计问题" : paper.ideaArchitecture.coreMove}
        body={systemLensEnabled ? `${paper.analysis.method}\n\n${paper.analysis.professorLens}` : paper.ideaArchitecture.optimizationLogic}
      />

      <article className="architecture-lead">
        <div>
          <div className="section-kicker">Core Move</div>
          <h3>{paper.ideaArchitecture.coreMove}</h3>
        </div>
        <p>{paper.ideaArchitecture.optimizationLogic}</p>
      </article>

      {systemLensEnabled && <SystemArchitectureWorkbench sections={systemLensSections} />}

      <section className="boundary-grid">
        <article>
          <span>原论文讲什么</span>
          <p>{paper.architectureWalkthrough.originalPaperBoundary}</p>
        </article>
        <article>
          <span>今天的扩展是什么</span>
          <p>{paper.architectureWalkthrough.modernExtensionBoundary}</p>
        </article>
      </section>

      <ArchitectureBlocks blocks={paper.architectureWalkthrough.blocks} />

      <section className="architecture-support-grid">
        <article className="architecture-support-panel">
          <div className="section-kicker">Control Loop</div>
          <h3>方法主线和 orchestration</h3>
          <MethodFlow steps={paper.ideaArchitecture.methodFlow} />
        </article>
        <article className="architecture-support-panel">
          <div className="section-kicker">Transferable Pattern</div>
          <h3>最值得迁移到自己系统里的工程决策</h3>
          <div className="design-choice-list">
            {paper.ideaArchitecture.designChoices.map((choice) => (
              <DesignChoiceCard choice={choice} key={choice.title} />
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}

function SystemArchitectureWorkbench({ sections }: { sections: ArchitectureLensSection[] }) {
  return (
    <article className="system-architecture-panel">
      <div className="section-kicker">System Architecture View</div>
      <h3>用 agent/system 的语言重画这篇论文</h3>
      <div className="system-architecture-outline">
        {sections.map((section) => (
          <section className="system-outline-row" key={section.label}>
            <div className="system-outline-label">{section.label}</div>
            <div>
              <h4>{section.title}</h4>
              <p>{section.body}</p>
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function ArchitectureBlocks({ blocks }: { blocks: ArticleArchitectureBlock[] }) {
  return (
    <section className="architecture-blocks">
      <div className="section-kicker">Block By Block</div>
      <h3>论文里的结构到底怎么搭起来</h3>
      <ArchitectureFlowMap blocks={blocks} />
      <div className="architecture-block-grid">
        {blocks.map((block) => (
          <article key={block.label}>
            <div className="architecture-block-head">
              <span>{block.label}</span>
              <h4>{block.title}</h4>
            </div>
            <p><b>作用：</b>{block.role}</p>
            <p>{block.beginnerExplanation}</p>
            <small>{block.connectsTo}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArchitectureFlowMap({ blocks }: { blocks: ArticleArchitectureBlock[] }) {
  return (
    <div className="architecture-flow-map" aria-label="Architecture flow map">
      {blocks.map((block, index) => (
        <div className="architecture-flow-node" key={block.label}>
          <span>{block.label}</span>
          <b>{block.title}</b>
          {index < blocks.length - 1 && <i aria-hidden="true">→</i>}
        </div>
      ))}
    </div>
  );
}

function EvidenceView({ paper }: { paper: AcademicArticle }) {
  return (
    <section className="evidence-view">
      <NarrativeBlock
        kicker="Evidence Lens"
        title="读实验不是看结果卡片，而是看它到底在检验什么"
        body={`${paper.analysis.experiments}\n\n${paper.analysis.limitations}`}
      />
      <article className="evidence-lead">
        <div className="section-kicker">Benchmark Reading</div>
        <h3>{paper.evidenceLens.benchmarkTakeaway}</h3>
        <div className="evidence-grid">
          <EvidenceFact label="比较对象" body={paper.evidenceLens.whatWasCompared} />
          <EvidenceFact label="可以相信" body={paper.evidenceLens.whatToTrust} />
          <EvidenceFact label="不要过度解读" body={paper.evidenceLens.whatNotToOverclaim} />
        </div>
      </article>
      <ExperimentReadingList items={paper.experimentReadings} />
      <div className="evidence-chart-grid">
        {paper.charts.map((chart) => <ArticleChartView chart={chart} key={chart.title} />)}
      </div>
      <div className="article-analysis-grid compact">
        <AnalysisCard title="实验怎么看" body={paper.analysis.experiments} />
        <AnalysisCard title="局限性" body={paper.analysis.limitations} />
      </div>
    </section>
  );
}

function ExperimentReadingList({ items }: { items: ArticleExperimentReading[] }) {
  return (
    <section className="experiment-reading-list">
      {items.map((item) => (
        <article className="experiment-reading-card" key={item.question}>
          <div>
            <span>要证明什么</span>
            <h4>{item.question}</h4>
          </div>
          <div className="experiment-reading-grid">
            <EvidenceFact label="怎么比" body={item.setup} />
            <EvidenceFact label="看什么指标" body={item.metric} />
            <EvidenceFact label="结果" body={item.result} />
            <EvidenceFact label="说明什么" body={item.conclusion} />
            <EvidenceFact label="不能说明什么" body={item.limitation} />
          </div>
        </article>
      ))}
    </section>
  );
}

function ProfessorView({ paper }: { paper: AcademicArticle }) {
  return (
    <section className="professor-view">
      <NarrativeBlock
        kicker="Professor Memo"
        title="如果把这篇论文当成一节课，最该带走什么"
        body={`${paper.studyLens.professorExplanation}\n\n${paper.analysis.professorLens}`}
      />
      <article className="professor-board">
        <div className="section-kicker">Professor Lens</div>
        <h3>如果我是老师，我会这样带你读</h3>
        <p>{paper.studyLens.professorExplanation}</p>
      </article>
      <div className="professor-grid">
        <ListPanel title="新手阅读顺序" items={paper.studyLens.beginnerPath} />
        <ListPanel title="常见误读" items={paper.studyLens.commonMisreadings} />
      </div>
      <article className="practice-card">
        <span>练习题</span>
        <p>{paper.studyLens.practicePrompt}</p>
      </article>
      <VerificationTaskGrid tasks={paper.verificationTasks} />
    </section>
  );
}

function VerificationTaskGrid({ tasks }: { tasks: ArticleVerificationTask[] }) {
  return (
    <section className="verification-task-panel">
      <div>
        <div className="section-kicker">Verification</div>
        <h3>怎么证明自己真的读懂了</h3>
      </div>
      <div className="verification-task-grid">
        {tasks.map((task) => (
          <article key={task.title} className="verification-task-card">
            <div className="verification-task-head">
              <span>{task.level}</span>
              <h4>{task.title}</h4>
            </div>
            <p>{task.task}</p>
            <div className="verification-meta-grid">
              <EvidenceFact label="预计用时" body={verificationTime(task)} />
              <EvidenceFact label="输出格式" body={verificationDeliverable(task)} />
            </div>
            <div className="verification-pass">
              <b>通过标准</b>
              <ul>
                {task.passCriteria.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="verification-mistake">
              <b>常见错法</b>
              <p>{task.commonMistake}</p>
            </div>
            <div className="verification-answer">
              <b>答案关键点</b>
              <p>{task.sampleAnswer}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function difficultyLabel(difficulty: string): string {
  if (difficulty === "advanced") return "进阶：需有基础";
  if (difficulty === "intermediate") return "中等：可边学边读";
  return "入门";
}

function qualityTierLabel(tier: string): string {
  if (tier === "must_read") return "必读";
  if (tier === "strong") return "强推荐";
  if (tier === "archive") return "归档";
  return "忽略";
}

function verificationTime(task: ArticleVerificationTask): string {
  if (task.level.includes("复述")) return "5-8 分钟";
  if (task.level.includes("画图")) return "12-15 分钟";
  if (task.level.includes("计算")) return "8-12 分钟";
  return "10-15 分钟";
}

function verificationDeliverable(task: ArticleVerificationTask): string {
  if (task.level.includes("复述")) return "3-5 句话，不看原文说清楚。";
  if (task.level.includes("画图")) return "一张手画流程图，加 3 个标注。";
  if (task.level.includes("计算")) return "写出公式、代入数字、解释数量级。";
  return "一段判断理由，加至少 2 个检查点。";
}

function InfoMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-mini">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function VersionsView({
  paper,
  activeVersion,
  onSelectVersion,
}: {
  paper: AcademicArticle;
  activeVersion: ArticleVersion;
  onSelectVersion: (id: string) => void;
}) {
  return (
    <section className="versions-view">
      <article className="version-question">
        <div>
          <div className="section-kicker">Optional Version Lens</div>
          <h2>{paper.versionQuestion}</h2>
          <p>{paper.versionRelation}</p>
        </div>
      </article>
      <div className="version-timeline">
        {paper.versions.map((version) => (
          <button
            key={version.id}
            className={`version-node${version.id === activeVersion.id ? " active" : ""}`}
            onClick={() => onSelectVersion(version.id)}
          >
            <span>{version.label}</span>
            <small>{formatDate(version.submittedAt)}</small>
          </button>
        ))}
      </div>
      <section className="article-focus-grid">
        <VersionPanel version={activeVersion} />
        <ConceptPanel concepts={paper.conceptMap} />
      </section>
    </section>
  );
}

function MethodFlow({ steps }: { steps: ArticleFlowStep[] }) {
  return (
    <div className="method-flow">
      {steps.map((step) => (
        <div className="method-step" key={step.label}>
          <div className="method-step-head">
            <span>{step.label}</span>
            <h4>{step.title}</h4>
          </div>
          <p>{step.body}</p>
        </div>
      ))}
    </div>
  );
}

function DesignChoiceCard({ choice }: { choice: ArticleDesignChoice }) {
  return (
    <article className="design-choice-card">
      <h4>{choice.title}</h4>
      <p><b>怎么做：</b>{choice.choice}</p>
      <p><b>为什么：</b>{choice.why}</p>
      <p><b>代价：</b>{choice.tradeoff}</p>
    </article>
  );
}

function EvidenceFact({ label, body }: { label: string; body: string }) {
  return (
    <div className="evidence-fact">
      <span>{label}</span>
      <p>{body}</p>
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="list-panel">
      <h4>{title}</h4>
      <ol>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ol>
    </article>
  );
}

function VersionPanel({ version }: { version: ArticleVersion }) {
  return (
    <article className="version-panel">
      <div className="version-panel-head">
        <div>
          <div className="section-kicker">{version.versionType}</div>
          <h3>{version.label}</h3>
        </div>
        <b>{version.impactScore}</b>
      </div>
      <p className="version-summary">{version.changeSummary}</p>
      <div className="version-insight">
        <span>为什么改</span>
        <p>{version.whyChanged}</p>
      </div>
      <div className="version-insight">
        <span>读者问题</span>
        <p>{version.readerQuestion}</p>
      </div>
      <div className="version-evidence">{version.evidence}</div>
    </article>
  );
}

function ConceptPanel({ concepts }: { concepts: string[] }) {
  return (
    <div className="article-panel">
      <h4>Concept Map</h4>
      <div className="concept-chip-grid">
        {concepts.map((concept) => <span key={concept}>{concept}</span>)}
      </div>
    </div>
  );
}

function ArticleChartView({ chart }: { chart: ArticleChart }) {
  const maxValue = chart.maxValue || Math.max(...chart.bars.map((bar) => bar.value), 1);
  return (
    <div className="article-panel">
      <h4>{chart.title}</h4>
      <p>{chart.metric} · {chart.unit}</p>
      <div className="chart-bars">
        {chart.bars.map((bar) => {
          const width = Math.max(4, Math.min(100, (bar.value / maxValue) * 100));
          return (
            <div className={`chart-row${bar.highlight ? " highlight" : ""}`} key={bar.label}>
              <div className="chart-row-meta">
                <span>{bar.label}</span>
                <b>{bar.display}</b>
              </div>
              <div className="chart-track">
                <div className="chart-fill" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalysisCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="analysis-card">
      <span>{title}</span>
      <p>{body}</p>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-mini">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function SourceLinks({ sources }: { sources: { name: string; url: string }[] }) {
  return (
    <div className="model-source-list">
      {sources.map((source) => (
        <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
          {source.name}
        </a>
      ))}
    </div>
  );
}
