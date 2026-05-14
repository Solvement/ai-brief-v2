import { useEffect, useMemo, useState } from "react";
import type { ModelCompany, ModelRelease, ModelSeries, ModelsData } from "../types";
import { loadModels } from "../lib/data";
import { SiteHeader } from "../components/SiteHeader";

interface Props {
  companyId?: string;
}

function formatDate(iso: string): string {
  const day = iso.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day.replaceAll("-", ".");
  return iso;
}

function relativeTime(iso: string): string {
  const value = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso;
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.round(diff / 86400000);
  if (days <= 0) return "今天";
  if (days < 30) return `${days} 天前`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.round(months / 12)} 年前`;
}

export function Models({ companyId }: Props) {
  const [data, setData] = useState<ModelsData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadModels().then(setData).catch((e) => setErr(e?.message || String(e)));
  }, []);

  const company = useMemo(() => {
    if (!data || !companyId) return null;
    return data.companies.find((item) => item.id === companyId) || null;
  }, [companyId, data]);

  if (err) {
    return (
      <>
        <SiteHeader active="models" />
        <main className="page">
          <div className="notice error">加载 Models 数据失败：{err}</div>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <SiteHeader active="models" />
        <main className="page">
          <div className="loading">正在加载 Models...</div>
        </main>
      </>
    );
  }

  if (companyId && !company) {
    return (
      <>
        <SiteHeader active="models" />
        <main className="page">
          <div className="breadcrumb">
            <a href="#/models">Models</a><span className="sep">/</span><span>{companyId}</span>
          </div>
          <div className="notice">
            还没有找到这个公司档案。当前第一版只收录 DeepSeek，后续可以按同一结构继续加 OpenAI、Anthropic、Google DeepMind 等。
          </div>
        </main>
      </>
    );
  }

  if (company) return <CompanyPage company={company} generatedAt={data.generatedAt} />;
  return <ModelsIndex data={data} />;
}

function ModelsIndex({ data }: { data: ModelsData }) {
  return (
    <>
      <SiteHeader active="models" meta={`Models 更新于 ${formatDate(data.generatedAt)}`} />
      <main className="page models-page">
        <section className="models-intro">
          <div>
            <div className="eyebrow">Models</div>
            <h1>按公司理解模型和产品能力演进</h1>
            <p>
              这里不是实时模型新闻流，而是老师视角的模型档案。每个公司页会讲每一代模型自己是什么，
              以及它和后一代之间为什么会这样演进。
            </p>
          </div>
          <div className="models-principle">
            <span>Information</span>
            <span>Judgment</span>
            <span>Action</span>
          </div>
        </section>

        <div className="company-grid">
          {data.companies.map((company) => (
            <a key={company.id} className="company-card" href={`#/models/${company.id}`}>
              <div className="company-card-head">
                <div>
                  <div className="company-country">{company.country}</div>
                  <h2>{company.name}</h2>
                </div>
                <span className="content-pill">{company.contentType}</span>
              </div>
              <p className="company-takeaway">{company.oneSentenceTakeaway}</p>
              <p className="company-why">{company.whyItMatters}</p>
              <div className="tag-row">
                {company.tags.slice(0, 6).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
              <div className="company-score-row">
                <ScoreMini label="Impact" value={company.impactScore} />
                <ScoreMini label="Readability" value={company.readabilityScore} />
                <ScoreMini label="Action" value={company.actionabilityScore} />
                <ScoreMini label="Confidence" value={company.confidenceScore} />
              </div>
              <div className="company-card-foot">
                <span>{company.readingTime}</span>
                <span>{company.actionLabel} &gt;</span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </>
  );
}

function CompanyPage({ company, generatedAt }: { company: ModelCompany; generatedAt: string }) {
  const [view, setView] = useState<"models" | "learning" | "updates">("models");
  const [activeSeriesId, setActiveSeriesId] = useState(company.series[0]?.id || "");
  const activeSeries = useMemo(
    () => company.series.find((series) => series.id === activeSeriesId) || company.series[0],
    [activeSeriesId, company.series],
  );
  const [activeReleaseId, setActiveReleaseId] = useState(activeSeries?.releases[0]?.id || "");

  useEffect(() => {
    if (!activeSeries) return;
    const hasRelease = activeSeries.releases.some((release) => release.id === activeReleaseId);
    if (!hasRelease) setActiveReleaseId(activeSeries.releases[0]?.id || "");
  }, [activeReleaseId, activeSeries]);

  const activeRelease = useMemo(() => {
    if (!activeSeries) return null;
    return activeSeries.releases.find((release) => release.id === activeReleaseId) || activeSeries.releases[0] || null;
  }, [activeReleaseId, activeSeries]);

  return (
    <>
      <SiteHeader active="models" meta={`Models 更新于 ${formatDate(generatedAt)}`} />
      <main className="detail model-detail">
        <div className="breadcrumb">
          <a href="#/models">Models</a><span className="sep">/</span><span>{company.name}</span>
        </div>

        <section className="model-hero">
          <div>
            <div className="eyebrow">{company.country} · {company.contentType} · {relativeTime(company.updatedAt)}</div>
            <h1>{company.name}</h1>
            <p className="model-hero-tldr"><b>TL;DR</b> · {company.oneSentenceTakeaway}</p>
            <p>{company.whyItMatters}</p>
            <div className="tag-row">
              {company.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </div>
          <aside className="model-score-panel">
            <ScoreMini label="Impact" value={company.impactScore} />
            <ScoreMini label="Readability" value={company.readabilityScore} />
            <ScoreMini label="Action" value={company.actionabilityScore} />
            <ScoreMini label="Confidence" value={company.confidenceScore} />
          </aside>
        </section>

        <div className="workspace-tabs" role="tablist" aria-label="DeepSeek learning modes">
          <button className={view === "models" ? "active" : ""} onClick={() => setView("models")}>模型工作台</button>
          <button className={view === "learning" ? "active" : ""} onClick={() => setView("learning")}>学习路线</button>
          <button className={view === "updates" ? "active" : ""} onClick={() => setView("updates")}>大更新</button>
        </div>

        {view === "models" && activeSeries && activeRelease && (
          <ModelWorkbench
            company={company}
            activeSeries={activeSeries}
            activeRelease={activeRelease}
            activeSeriesId={activeSeriesId}
            activeReleaseId={activeReleaseId}
            onSeriesChange={(seriesId) => {
              setActiveSeriesId(seriesId);
              const nextSeries = company.series.find((series) => series.id === seriesId);
              setActiveReleaseId(nextSeries?.releases[0]?.id || "");
            }}
            onReleaseChange={setActiveReleaseId}
          />
        )}

        {view === "learning" && <LearningBoard company={company} />}
        {view === "updates" && <UpdatesBoard company={company} />}
      </main>
    </>
  );
}

function ModelWorkbench({
  company,
  activeSeries,
  activeRelease,
  activeSeriesId,
  activeReleaseId,
  onSeriesChange,
  onReleaseChange,
}: {
  company: ModelCompany;
  activeSeries: ModelSeries;
  activeRelease: ModelRelease;
  activeSeriesId: string;
  activeReleaseId: string;
  onSeriesChange: (seriesId: string) => void;
  onReleaseChange: (releaseId: string) => void;
}) {
  return (
    <section className="model-workbench">
      <aside className="series-rail" aria-label="Model series">
        <div className="rail-label">Series</div>
        {company.series.map((series) => (
          <button
            key={series.id}
            className={`series-pill${activeSeriesId === series.id ? " active" : ""}`}
            onClick={() => onSeriesChange(series.id)}
          >
            <span>{series.title.replace(/：.+$/, "")}</span>
            <small>{series.releases.length} releases</small>
          </button>
        ))}
        <div className="series-note">{activeSeries.teacherNote}</div>
      </aside>

      <div className="workbench-main">
        <ModelMap company={company} activeReleaseId={activeReleaseId} onSeriesChange={onSeriesChange} onReleaseChange={onReleaseChange} />
        <ReleaseSwitcher series={activeSeries} activeReleaseId={activeReleaseId} onReleaseChange={onReleaseChange} />
        <ModelFocusPanel release={activeRelease} series={activeSeries} />
      </div>
    </section>
  );
}

function ModelMap({
  company,
  activeReleaseId,
  onSeriesChange,
  onReleaseChange,
}: {
  company: ModelCompany;
  activeReleaseId: string;
  onSeriesChange: (seriesId: string) => void;
  onReleaseChange: (releaseId: string) => void;
}) {
  const allReleases = company.series.flatMap((series) => series.releases.map((release) => ({ release, seriesId: series.id })));
  return (
    <div className="capability-map">
      <div>
        <div className="section-kicker">Capability Map</div>
        <h3>从推理、效率到 Agent 基座</h3>
      </div>
      <div className="map-canvas">
        {allReleases.map(({ release, seriesId }, index) => (
          <button
            key={release.id}
            className={`map-node map-node-${index + 1}${release.id === activeReleaseId ? " active" : ""}`}
            onClick={() => {
              onSeriesChange(seriesId);
              onReleaseChange(release.id);
            }}
          >
            <span>{release.name.replace("DeepSeek-", "")}</span>
            <small>{release.kind}</small>
          </button>
        ))}
        <div className="map-line line-a" />
        <div className="map-line line-b" />
        <div className="map-line line-c" />
        <div className="map-line line-d" />
        <div className="map-line line-e" />
      </div>
      <div className="map-legend">
        <span>R 系列：推理能力独立化</span>
        <span>V 系列：通用模型吸收推理、工具和长上下文</span>
      </div>
    </div>
  );
}

function ReleaseSwitcher({ series, activeReleaseId, onReleaseChange }: { series: ModelSeries; activeReleaseId: string; onReleaseChange: (releaseId: string) => void }) {
  return (
    <div className="release-switcher" aria-label={`${series.title} releases`}>
      {series.releases.map((release) => (
        <button
          key={release.id}
          className={`release-tab${activeReleaseId === release.id ? " active" : ""}`}
          onClick={() => onReleaseChange(release.id)}
        >
          <span>{release.name.replace("DeepSeek-", "")}</span>
          <small>{formatDate(release.publishedAt)}</small>
        </button>
      ))}
    </div>
  );
}

function ModelFocusPanel({ release, series }: { release: ModelRelease; series: ModelSeries }) {
  return (
    <div className="model-focus-grid">
      <article className="model-profile-panel">
        <div className="model-profile-head">
          <div>
            <div className="section-kicker">{series.title}</div>
            <h2>{release.name}</h2>
            <p>{release.oneSentenceTakeaway}</p>
          </div>
          <span className="content-pill">{formatDate(release.publishedAt)}</span>
        </div>

        <div className="model-profile-grid">
          <AnalysisTile title="这一代是什么" body={release.positioning} tone="green" />
          <AnalysisTile title="它自己解决的问题" body={release.problemSolved} tone="blue" />
          <AnalysisTile title="为什么要这样设计" body={release.whyChanged} tone="amber" />
          <AnalysisTile title="技术上怎么解决" body={release.howSolved} tone="slate" />
        </div>

        <div className="model-lens-row">
          <ListBlock title="模型本体：关键能力" items={release.keyChanges} />
          <ListBlock title="适合重点学习" items={release.studentTakeaways} />
        </div>

        {release.api && (
          <div className="api-strip compact">
            <InfoRow label="Model" value={release.api.modelNames.join(" / ")} />
            <InfoRow label="Context" value={release.api.contextWindow} />
            <InfoRow label="Max output" value={release.api.maxOutput} />
            <InfoRow label="Modes" value={release.api.modes.join(" / ")} />
          </div>
        )}

        <div className="teacher-note">{release.teacherNote}</div>
        <SourceLinks sources={release.sources} />
      </article>

      <aside className="model-side-stack">
        <ListBlock title="取舍与限制" items={release.tradeoffs} />
        <ListBlock title="可以马上做的实验" items={release.experiments} />
        {release.nextRelation ? <VisualRelationPanel release={release} relation={release.nextRelation} /> : <EndOfLinePanel release={release} />}
      </aside>
    </div>
  );
}

function AnalysisTile({ title, body, tone }: { title: string; body: string; tone: "green" | "blue" | "amber" | "slate" }) {
  return (
    <div className={`analysis-tile ${tone}`}>
      <h4>{title}</h4>
      <p>{body}</p>
    </div>
  );
}

function VisualRelationPanel({ release, relation }: { release: ModelRelease; relation: NonNullable<ModelRelease["nextRelation"]> }) {
  return (
    <div className="relation-visual">
      <div className="relation-visual-title">到后一代：{release.name} -&gt; {relation.toReleaseId.replace("deepseek-", "").toUpperCase()}</div>
      <p>{relation.summary}</p>
      <div className="relation-flow">
        <div><span>继承</span><b>{relation.inherits}</b></div>
        <div><span>改变</span><b>{relation.changes}</b></div>
        <div><span>原因</span><b>{relation.why}</b></div>
        <div><span>解法</span><b>{relation.solvedBy}</b></div>
      </div>
      <div className="teacher-note">{relation.teacherNote}</div>
    </div>
  );
}

function EndOfLinePanel({ release }: { release: ModelRelease }) {
  return (
    <div className="relation-visual quiet">
      <div className="relation-visual-title">{release.name} 是当前这条线的最新节点</div>
      <p>这一版先把当前官方资料讲清。后续如果出现新一代模型，再在这里补上“它为什么走向下一代”。</p>
    </div>
  );
}

function LearningBoard({ company }: { company: ModelCompany }) {
  return (
    <section className="section learning-board">
      <div className="section-kicker">Learning Path</div>
      <h3>老师建议的阅读顺序</h3>
      <div className="learning-list visual">
        {company.learningPath.map((item, index) => (
          <div className="learning-item" key={item.title}>
            <span className="learning-num">{index + 1}</span>
            <div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="next-step-grid">
        {company.nextSteps.map((step) => <div className="next-step" key={step}>{step}</div>)}
      </div>
    </section>
  );
}

function UpdatesBoard({ company }: { company: ModelCompany }) {
  return (
    <section className="section updates-board">
      <div className="section-kicker">Product & API Updates</div>
      <h3>模型之外的大更新</h3>
      <div className="update-list visual">
        {company.updates.map((update) => (
          <article className="update-item" key={update.id}>
            <div className="update-meta">{formatDate(update.publishedAt)} · {update.kind}</div>
            <h4>{update.title}</h4>
            <p>{update.summary}</p>
            <p><b>为什么重要：</b>{update.whyItMatters}</p>
            <p><b>学生要学：</b>{update.studentTakeaway}</p>
            <SourceLinks sources={update.sources} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ScoreMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-mini">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="release-block">
      <h5>{title}</h5>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
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
