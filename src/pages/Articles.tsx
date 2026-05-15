import { useEffect, useMemo, useState } from "react";
import type { AcademicArticle, ArticleChart, ArticleVersion, ArticlesData } from "../types";
import { loadArticles } from "../lib/data";
import { SiteHeader } from "../components/SiteHeader";

interface Props {
  paperId?: string;
}

function formatDate(iso: string): string {
  const day = iso.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day.replaceAll("-", ".");
  return iso;
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

  if (paper) return <ArticleDetail paper={paper} generatedAt={data.generatedAt} papers={data.papers} />;
  return <ArticlesIndex data={data} />;
}

function ArticlesIndex({ data }: { data: ArticlesData }) {
  return (
    <>
      <SiteHeader active="articles" meta={`Articles 更新于 ${formatDate(data.generatedAt)}`} />
      <main className="page articles-page">
        <section className="articles-intro">
          <div>
            <div className="eyebrow">Academic Articles</div>
            <h1>按版本读论文，而不是只读摘要</h1>
            <p>
              每篇论文拆成 arXiv 版本时间线、方法变化、实验可信度、局限和复现检查清单。目标是让你知道这篇论文为什么重要、版本之间为什么改、你应该怎么验证自己读懂了。
            </p>
          </div>
          <div className="article-read-model">
            <span>Version</span>
            <span>Method</span>
            <span>Evidence</span>
            <span>Action</span>
          </div>
        </section>

        <section className="article-card-grid">
          {data.papers.map((paper) => (
            <a className="article-card" href={`#/articles/${paper.id}`} key={paper.id}>
              <div className="article-card-top">
                <div>
                  <span>{paper.arxivId}</span>
                  <h2>{paper.shortTitle}</h2>
                </div>
                <b>{paper.versions.length} versions</b>
              </div>
              <p className="article-title">{paper.title}</p>
              <p>{paper.oneSentenceTakeaway}</p>
              <div className="tag-row">
                {paper.tags.slice(0, 5).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
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
    </>
  );
}

function ArticleDetail({ paper, generatedAt, papers }: { paper: AcademicArticle; generatedAt: string; papers: AcademicArticle[] }) {
  const [activeVersionId, setActiveVersionId] = useState(paper.versions[0]?.id || "");
  const activeVersion = paper.versions.find((version) => version.id === activeVersionId) || paper.versions[0];

  useEffect(() => {
    setActiveVersionId(paper.versions[0]?.id || "");
  }, [paper.id, paper.versions]);

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
                <small>{item.versions.length} versions</small>
              </a>
            ))}
          </aside>

          <div className="article-main">
            <section className="version-question">
              <div>
                <div className="section-kicker">Version Question</div>
                <h2>{paper.versionQuestion}</h2>
                <p>{paper.versionRelation}</p>
              </div>
              <SourceLinks sources={paper.sources} />
            </section>

            <div className="version-timeline">
              {paper.versions.map((version) => (
                <button
                  key={version.id}
                  className={`version-node${version.id === activeVersion.id ? " active" : ""}`}
                  onClick={() => setActiveVersionId(version.id)}
                >
                  <span>{version.label}</span>
                  <small>{formatDate(version.submittedAt)}</small>
                </button>
              ))}
            </div>

            <section className="article-focus-grid">
              <VersionPanel version={activeVersion} />
              <div className="article-side-stack">
                <ConceptPanel concepts={paper.conceptMap} />
                {paper.charts.map((chart) => <ArticleChartView chart={chart} key={chart.title} />)}
              </div>
            </section>

            <section className="article-analysis-grid">
              <AnalysisCard title="核心论点" body={paper.analysis.thesis} />
              <AnalysisCard title="背景问题" body={paper.analysis.background} />
              <AnalysisCard title="方法设计" body={paper.analysis.method} />
              <AnalysisCard title="实验证据" body={paper.analysis.experiments} />
              <AnalysisCard title="局限性" body={paper.analysis.limitations} />
              <AnalysisCard title="教授视角" body={paper.analysis.professorLens} />
            </section>

            <section className="article-checklist">
              <div>
                <div className="section-kicker">Verification</div>
                <h3>怎么验证自己读懂了</h3>
              </div>
              <div className="check-grid">
                {paper.analysis.verificationChecklist.map((item) => <span key={item}>{item}</span>)}
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
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
