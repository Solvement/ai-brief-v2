import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AcademicPaperAnalysis,
  ArticlesData,
  PaperAnalysisSection,
  PaperDeepDive,
  PaperRadarPublicData,
  ScoreCardItem,
} from "../types";
import { loadArticles, loadPaperRadar } from "../lib/data";
import { SiteHeader } from "../components/SiteHeader";

interface Props {
  paperId?: string;
}

type RefreshState = "idle" | "running" | "done" | "error";

function formatDate(iso: string): string {
  const day = (iso || "").split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day.replaceAll("-", ".");
  return iso;
}

function formatMs(ms?: number): string {
  if (!Number.isFinite(ms)) return "n/a";
  if ((ms || 0) < 1000) return `${Math.round(ms || 0)}ms`;
  return `${Math.round((ms || 0) / 100) / 10}s`;
}

/** Deep dives first, then most recently verified. No AI quality score — Kevin judges. */
function sortPapers(papers: AcademicPaperAnalysis[]): AcademicPaperAnalysis[] {
  return [...papers].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === "deep" ? -1 : 1;
    return Date.parse(b.verifiedAt || "") - Date.parse(a.verifiedAt || "");
  });
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

  const sorted = useMemo(() => {
    if (!data) return null;
    return { ...data, papers: sortPapers(data.papers) };
  }, [data]);

  if (err) {
    return (
      <>
        <SiteHeader active="articles" />
        <main className="page"><div className="notice error">加载 Articles 数据失败：{err}</div></main>
      </>
    );
  }
  if (!data || !sorted) {
    return (
      <>
        <SiteHeader active="articles" />
        <main className="page"><div className="loading">正在加载 Articles...</div></main>
      </>
    );
  }
  if (paperId && !paper) {
    return (
      <>
        <SiteHeader active="articles" />
        <main className="page">
          <div className="breadcrumb"><a href="#/articles">Articles</a><span className="sep">/</span><span>{paperId}</span></div>
          <div className="notice">还没有这篇论文的分析。</div>
        </main>
      </>
    );
  }
  if (paper) return <ArticleDetail paper={paper} generatedAt={sorted.generatedAt} />;
  return <ArticlesIndex data={sorted} />;
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

  const runStream = async (endpoint: string) => {
    if (refresh === "running") return;
    setRefresh("running");
    setLog("");
    try {
      const res = await fetch(endpoint, { method: "POST" });
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

  return (
    <>
      <SiteHeader
        active="articles"
        meta={(
          <>
            <span className="meta-text">Articles 更新于 {formatDate(data.generatedAt)} · {data.papers.length} 篇</span>
            <button className="refresh-btn" onClick={() => runStream("/__publish-papers")} disabled={refresh === "running"}>
              {refresh === "running" ? "运行中..." : "重跑分析"}
            </button>
            <button className="refresh-btn" onClick={() => runStream("/__refresh-paper-radar")} disabled={refresh === "running"}>
              {refresh === "running" ? "运行中..." : "刷新 Radar"}
            </button>
          </>
        )}
      />
      <main className="page articles-page">
        <section className="articles-intro">
          <div>
            <div className="eyebrow">Academic · 学术</div>
            <h1>顺着论文自己的思路，把它讲透</h1>
            <p>
              先用<b> 汇聚 × 赛道 × idea </b>筛出值得存进知识库的论文，再像教授一样顺着它自己的版块讲清楚：每块大白话翻译，关键处只<b>定位承重点、摆证据强弱</b>——好坏你来判断。
            </p>
          </div>
          <div className="article-read-model">
            <span>定调</span>
            <span>顺版块</span>
            <span>承重点</span>
            <span>证据</span>
            <span>局限</span>
          </div>
        </section>

        <PaperRadarPanel radar={radar} error={radarErr} />

        {data.papers.length === 0 ? (
          <div className="notice">本轮没有论文通过汇聚×赛道×idea 的选择关。点“重跑分析”跑一次在线管线。</div>
        ) : (
          <section className="article-card-grid">
            {data.papers.map((paper) => <ArticleCard key={paper.id} paper={paper} />)}
          </section>
        )}
      </main>

      {refresh !== "idle" && (
        <div className="ingest-overlay" role="dialog" aria-modal="true">
          <div className="ingest-modal">
            <div className="ingest-head">
              <div>
                {refresh === "running" && <><span className="spinner" /> 正在运行论文管线并校验...</>}
                {refresh === "done" && <>完成，正在重新加载页面</>}
                {refresh === "error" && <>运行出错</>}
              </div>
              <button className="ingest-close" onClick={closeLog} disabled={refresh === "running"}>
                {refresh === "running" ? "请等待" : "关闭"}
              </button>
            </div>
            <pre className="ingest-log" ref={logRef}>{log || "（等待 server 响应...）"}</pre>
          </div>
        </div>
      )}
    </>
  );
}

function ArticleCard({ paper }: { paper: AcademicPaperAnalysis }) {
  return (
    <a className="article-card" href={`#/articles/${paper.id}`}>
      <div className="article-card-top">
        <div className="article-card-source">
          <span>{paper.venue || paper.sourceName}</span>
          {paper.arxivId ? <span className="muted-mono">{paper.arxivId}</span> : null}
        </div>
        <b className={`tier-badge tier-${paper.tier}`}>{paper.tier === "deep" ? "深读" : "速览"}</b>
      </div>
      <h2 className="article-title">{paper.title}</h2>
      <p className="article-lead">{paper.leadJudgment}</p>
      {paper.selection?.track?.length ? (
        <div className="tag-row">
          {paper.selection.track.slice(0, 3).map((t) => <span className="tag" key={t}>{t}</span>)}
        </div>
      ) : null}
      <div className="article-card-foot">
        <span>{paper.sections?.length || 0} 个版块</span>
        <span>核验于 {formatDate(paper.verifiedAt)}</span>
      </div>
    </a>
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

      {(radar.agentFlow?.length || radar.runTrace || radar.reflection) && (
        <details className="radar-more">
          <summary>展开今日流水线</summary>
          <div className="paper-radar-flow">
            {radar.agentFlow.map((step) => (
              <article key={step.role}>
                <b>{step.role}</b>
                <p>{step.responsibility}</p>
                <small>{step.signal}</small>
              </article>
            ))}
          </div>
          {radar.runTrace && (
            <div className="radar-trace-metrics">
              <InfoMini label="Reviewed" value={String(radar.runTrace.summary.reviewedCount || 0)} />
              <InfoMini label="Source Fail" value={String(radar.runTrace.summary.sourceFailureCount || 0)} />
              <InfoMini label="Model Calls" value={String(radar.runTrace.summary.modelCalls || 0)} />
              <InfoMini label="Tokens" value={String(radar.runTrace.summary.totalTokens || 0)} />
            </div>
          )}
        </details>
      )}
    </section>
  );
}

function ArticleDetail({ paper, generatedAt }: { paper: AcademicPaperAnalysis; generatedAt: string }) {
  return (
    <>
      <SiteHeader active="articles" meta={`Articles 更新于 ${formatDate(generatedAt)}`} />
      <main className="detail article-detail">
        <div className="breadcrumb">
          <a href="#/articles">Articles</a><span className="sep">/</span><span>{paper.title}</span>
        </div>

        <section className="paper-hero">
          <div className="eyebrow">{paper.venue || paper.sourceName} · 学术</div>
          <h1>{paper.title}</h1>
          <p className="paper-lead">{paper.leadJudgment}</p>
          <div className="paper-meta-strip">
            <span>{paper.authors}</span>
            <span className="sep">·</span>
            <a href={paper.provenance?.sourceUrl || paper.sourceUrl} target="_blank" rel="noreferrer">{paper.sourceName}</a>
            <span className="sep">·</span>
            <span className="muted-mono">核验于 {formatDate(paper.verifiedAt)}</span>
            {paper.arxivId ? <><span className="sep">·</span><span className="muted-mono">{paper.arxivId}</span></> : null}
          </div>
          {paper.selection ? (
            <div className="paper-selection">
              {paper.selection.convergence?.length ? <EvidenceFact label="汇聚" body={paper.selection.convergence.join("、")} /> : null}
              {paper.selection.track?.length ? <EvidenceFact label="赛道" body={paper.selection.track.join("、")} /> : null}
              {paper.selection.ideaSignal ? <EvidenceFact label="idea 信号" body={paper.selection.ideaSignal} /> : null}
            </div>
          ) : null}
        </section>

        {paper.deepDive ? (
          <DeepDiveView dive={paper.deepDive} scorecard={paper.scorecard} />
        ) : (
          <section className="paper-sections">
            {paper.sections.map((section, i) => <PaperSection key={`${section.heading}-${i}`} section={section} />)}
          </section>
        )}

        {!paper.deepDive && paper.limitsAndFuture ? (
          <section className="paper-limits">
            <div className="section-kicker">局限 & 未来</div>
            {paper.limitsAndFuture.paperStated ? (
              <div className="limit-block">
                <span className="limit-label">论文自陈</span>
                <p>{paper.limitsAndFuture.paperStated}</p>
              </div>
            ) : null}
            {paper.limitsAndFuture.evidenceNotes ? (
              <div className="limit-block">
                <span className="limit-label">证据强弱（客观）</span>
                <p>{paper.limitsAndFuture.evidenceNotes}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="paper-provenance">
          <span>来源</span>
          <a href={paper.provenance?.sourceUrl || paper.sourceUrl} target="_blank" rel="noreferrer">
            {paper.provenance?.sourceUrl || paper.sourceUrl}
          </a>
        </section>
      </main>
    </>
  );
}

function DeepDiveView({ dive, scorecard }: { dive: PaperDeepDive; scorecard?: ScoreCardItem[] }) {
  return (
    <div className="deep-dive">
      {dive.reframe ? (
        <section className="dd-block">
          <div className="section-kicker">重判定位</div>
          <p className="dd-reframe">{dive.reframe}</p>
        </section>
      ) : null}

      {dive.contributionLayers?.length ? (
        <section className="dd-block">
          <div className="section-kicker">真正的贡献 · 主张 vs 判断</div>
          <div className="dd-layers">
            {dive.contributionLayers.map((l, i) => (
              <div className="dd-layer" key={i}>
                <b>{l.layer}</b>
                <div className="dd-layer-cols">
                  <div><span>论文主张</span><p>{l.claim}</p></div>
                  {l.evidence ? <div><span>证据</span><p>{l.evidence}</p></div> : null}
                  <div><span>我的判断</span><p>{l.judgment}</p></div>
                  {l.fdeMeaning ? <div className="dd-fde-cell"><span>FDE 意义</span><p>{l.fdeMeaning}</p></div> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {dive.mechanism ? (
        <section className="dd-block">
          <div className="section-kicker">关键机制 · 为什么可能有效</div>
          <p className="section-summary">{dive.mechanism}</p>
        </section>
      ) : null}

      {dive.evidenceChain?.length ? (
        <section className="dd-block">
          <div className="section-kicker">证据链</div>
          {dive.evidenceChain.map((e, i) => (
            <div className="dd-evidence" key={i}>
              <b>{e.component}</b>
              {e.metrics?.length ? (
                <table className="dd-metrics"><tbody>
                  {e.metrics.map((m, j) => (
                    <tr key={j}><td>{m.label}</td><td className="dd-metric-val">{m.value}</td><td>{m.note}</td></tr>
                  ))}
                </tbody></table>
              ) : null}
              <p className="dd-review">{e.reviewerNote}</p>
            </div>
          ))}
        </section>
      ) : null}

      {dive.audit?.length ? (
        <section className="dd-block dd-audit-block">
          <div className="section-kicker">外部核验 · 声明 vs 现实</div>
          {dive.audit.map((a, i) => (
            <div className="dd-audit" key={i}>
              <p><b>声明</b> {a.claim}</p>
              <p><b>核验</b> {a.finding}</p>
              {a.source ? <a href={a.source} target="_blank" rel="noreferrer">{a.source}</a> : null}
            </div>
          ))}
        </section>
      ) : null}

      <section className="dd-cards">
        {dive.loadBearingClaim ? <div className="dd-card"><span>承重主张</span><p>{dive.loadBearingClaim}</p></div> : null}
        {dive.strongestEvidence?.length ? <div className="dd-card"><span>最强证据</span><ul>{dive.strongestEvidence.map((s, i) => <li key={i}>{s}</li>)}</ul></div> : null}
        {dive.limitations?.length ? <div className="dd-card"><span>最大局限</span><ul>{dive.limitations.map((s, i) => <li key={i}>{s}</li>)}</ul></div> : null}
        {dive.suggestedExperiments?.length ? <div className="dd-card"><span>该补的实验</span><ul>{dive.suggestedExperiments.map((s, i) => <li key={i}>{s}</li>)}</ul></div> : null}
      </section>

      {dive.fdeTakeaways ? (
        <section className="dd-block dd-fde">
          <div className="section-kicker">FDE 项目化 memo · 用在客户现场</div>
          {dive.fdeTakeaways.customerProblem ? <FdeRow label="客户痛点" text={dive.fdeTakeaways.customerProblem} /> : null}
          <FdeRow label="该问客户的问题" items={dive.fdeTakeaways.customerQuestions} />
          <FdeRow label="要审计的 artifact" items={dive.fdeTakeaways.artifactsToAudit} />
          <FdeRow label="实施 checklist" items={dive.fdeTakeaways.implementationChecklist} />
          <FdeRow label="评估方案" items={dive.fdeTakeaways.evalPlan} />
          <FdeRow label="上线路线" items={dive.fdeTakeaways.rolloutPlan} />
          <FdeRow label="风险登记" items={dive.fdeTakeaways.riskRegister} />
          {dive.fdeTakeaways.roiHypothesis ? <FdeRow label="ROI 假设" text={dive.fdeTakeaways.roiHypothesis} /> : null}
          {dive.fdeTakeaways.interviewStory ? <FdeRow label="面试故事" text={dive.fdeTakeaways.interviewStory} /> : null}
        </section>
      ) : null}

      {scorecard?.length ? (
        <section className="dd-block">
          <div className="section-kicker">审稿式评分</div>
          <div className="dd-scorecard">
            {scorecard.map((s, i) => (
              <div className="dd-score" key={i}>
                <div className="dd-score-head"><b>{s.dimension}</b><span>{s.score}/10</span></div>
                <p>{s.reason}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PaperSection({ section }: { section: PaperAnalysisSection }) {
  return (
    <article className="paper-section">
      <h2>{section.heading}</h2>
      <p className="section-summary">{section.summary}</p>
      {section.loadBearing ? (
        <div className="section-callout callout-load">
          <span>承重</span>
          <p>{section.loadBearing}</p>
        </div>
      ) : null}
      {section.evidence ? (
        <div className="section-callout callout-evidence">
          <span>证据</span>
          <p>{section.evidence}</p>
        </div>
      ) : null}
      {section.fold ? (
        <details className="section-fold">
          <summary>展开更深一层</summary>
          <p>{section.fold}</p>
        </details>
      ) : null}
    </article>
  );
}

function FdeRow({ label, items, text }: { label: string; items?: string[]; text?: string }) {
  if (!text && !(items && items.length)) return null;
  return (
    <div className="dd-fde-row">
      <span>{label}</span>
      {text ? <p>{text}</p> : <ul>{(items || []).map((s, i) => <li key={i}>{s}</li>)}</ul>}
    </div>
  );
}

function InfoMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-mini">
      <span>{label}</span>
      <b>{value}</b>
    </div>
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
