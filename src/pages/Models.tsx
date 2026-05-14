import { useEffect, useMemo, useState } from "react";
import type { ModelAnalysisSection, ModelBenchmarkChart, ModelCompany, ModelRelease, ModelSeries, ModelsData } from "../types";
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

type LensKey = "benchmark" | "architecture" | "training" | "innovation" | "professor";

const LENS_OPTIONS: { key: LensKey; label: string; helper: string }[] = [
  { key: "benchmark", label: "Benchmark", helper: "先看和谁比、测什么" },
  { key: "architecture", label: "架构", helper: "模型怎样被设计" },
  { key: "training", label: "训练/数据", helper: "能力怎样被塑造" },
  { key: "innovation", label: "创新/局限", helper: "贡献和边界" },
  { key: "professor", label: "教授视角", helper: "学生该怎么学" },
];

function ModelFocusPanel({ release, series }: { release: ModelRelease; series: ModelSeries }) {
  const [activeLens, setActiveLens] = useState<LensKey>("benchmark");

  useEffect(() => {
    setActiveLens("benchmark");
  }, [release.id]);

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
          <ModelSnapshotTile label="定位" value={release.positioning} tone="green" />
          <ModelSnapshotTile label="解决的问题" value={release.problemSolved} tone="blue" />
          <ModelSnapshotTile label="设计动机" value={release.whyChanged} tone="amber" />
          <ModelSnapshotTile label="技术解法" value={release.howSolved} tone="slate" />
        </div>

        <LensTabs activeLens={activeLens} onChange={setActiveLens} />
        <LensView release={release} activeLens={activeLens} />

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

function ModelSnapshotTile({ label, value, tone }: { label: string; value: string; tone: "green" | "blue" | "amber" | "slate" }) {
  return (
    <div className={"analysis-tile " + tone}>
      <h4>{label}</h4>
      <p>{value}</p>
    </div>
  );
}

function LensTabs({ activeLens, onChange }: { activeLens: LensKey; onChange: (lens: LensKey) => void }) {
  return (
    <div className="lens-tabs" role="tablist" aria-label="Model analysis lenses">
      {LENS_OPTIONS.map((option) => (
        <button
          key={option.key}
          className={"lens-tab" + (activeLens === option.key ? " active" : "")}
          onClick={() => onChange(option.key)}
          role="tab"
          aria-selected={activeLens === option.key}
        >
          <span>{option.label}</span>
          <small>{option.helper}</small>
        </button>
      ))}
    </div>
  );
}

function LensView({ release, activeLens }: { release: ModelRelease; activeLens: LensKey }) {
  const analysis = release.modelAnalysis;

  if (!analysis) return <MissingAnalysisFallback release={release} />;
  if (activeLens === "benchmark") return <BenchmarkLens release={release} />;
  if (activeLens === "architecture") {
    return (
      <CompoundLens
        kicker="Architecture Lens"
        sections={[
          { title: "架构设计", section: analysis.architecture },
          { title: "思路来源", section: analysis.designLineage },
        ]}
      />
    );
  }
  if (activeLens === "training") {
    return (
      <CompoundLens
        kicker="Training Lens"
        sections={[
          { title: "训练方式 / 数据结果", section: analysis.trainingData },
          {
            title: "关键能力变化",
            section: {
              headline: "这一版公开可观察到的能力变化",
              professorNote: "把官方发布点拆成可测试任务，才不会只停在宣传语。",
              bullets: release.keyChanges,
            },
          },
        ]}
      />
    );
  }
  if (activeLens === "innovation") {
    return (
      <CompoundLens
        kicker="Innovation Lens"
        sections={[
          { title: "创新点", section: analysis.innovation },
          { title: "局限性", section: analysis.limitations },
        ]}
      />
    );
  }
  return <ProfessorLens release={release} />;
}

function MissingAnalysisFallback({ release }: { release: ModelRelease }) {
  return (
    <section className="analysis-lens stale-analysis-fallback">
      <div className="section-kicker">Data Refresh Needed</div>
      <h3>这个模型版本还没有加载到新的分析结构</h3>
      <p>如果你刚刚更新过项目，刷新页面即可拿到 Benchmark、架构、训练、创新和教授视角。当前先显示基础摘要，避免旧缓存导致页面白屏。</p>
      <div className="model-lens-row">
        <ListBlock title="关键能力" items={release.keyChanges} />
        <ListBlock title="适合重点学习" items={release.studentTakeaways} />
      </div>
    </section>
  );
}

function BenchmarkLens({ release }: { release: ModelRelease }) {
  const benchmark = release.modelAnalysis?.benchmark;
  if (
    !benchmark ||
    !Array.isArray(benchmark.charts) ||
    !Array.isArray(benchmark.items) ||
    !Array.isArray(benchmark.caveats)
  ) {
    return <MissingAnalysisFallback release={release} />;
  }

  return (
    <section className="analysis-lens benchmark-lens">
      <div className="lens-head">
        <div>
          <div className="section-kicker">Benchmark Lens</div>
          <h3>{benchmark.headline}</h3>
        </div>
        <span className="lens-badge">发布时第一眼</span>
      </div>
      <p className="professor-note">{benchmark.professorNote}</p>
      <div className="benchmark-chart-grid">
        {benchmark.charts.map((chartItem) => <BenchmarkChart key={chartItem.title} chart={chartItem} />)}
      </div>
      <div className="benchmark-grid benchmark-notes-grid">
        {benchmark.items.map((item) => (
          <div className="benchmark-card" key={item.label + "-" + item.score}>
            <div className="benchmark-card-top">
              <span>{item.label}</span>
              <b>{sourceTypeLabel(item.sourceType)}</b>
            </div>
            <strong>{item.score}</strong>
            <p>{item.comparator}</p>
            <small>{item.interpretation}</small>
          </div>
        ))}
      </div>
      <div className="benchmark-caveats">
        {benchmark.caveats.map((caveat) => <span key={caveat}>{caveat}</span>)}
      </div>
    </section>
  );
}

function BenchmarkChart({ chart }: { chart: ModelBenchmarkChart }) {
  const bars = Array.isArray(chart.bars) ? chart.bars : [];
  const maxValue = chart.maxValue || Math.max(...bars.map((barItem) => barItem.value), 1);
  return (
    <div className="benchmark-chart-card">
      <div className="benchmark-chart-head">
        <div>
          <span>{chart.title}</span>
          <small>{chart.metric}</small>
        </div>
        <b>{sourceTypeLabel(chart.sourceType)}</b>
      </div>
      <div className="chart-bars">
        {bars.map((barItem) => {
          const width = Math.max(4, Math.min(100, (barItem.value / maxValue) * 100));
          return (
            <div className={`chart-row${barItem.highlight ? " highlight" : ""}`} key={`${chart.title}-${barItem.label}`}>
              <div className="chart-row-meta">
                <span>{barItem.label}</span>
                <b>{barItem.display}</b>
              </div>
              <div className="chart-track" aria-label={`${barItem.label}: ${barItem.display}`}>
                <div className="chart-fill" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="chart-foot">{chart.higherIsBetter ? "数值越高越好" : "数值越低越好"} · {chart.unit}</div>
    </div>
  );
}

function CompoundLens({ kicker, sections }: { kicker: string; sections: { title: string; section?: ModelAnalysisSection }[] }) {
  return (
    <section className="analysis-lens">
      <div className="section-kicker">{kicker}</div>
      <div className="lens-section-grid">
        {sections.map(({ title, section }) => (
          <AnalysisSection key={title} title={title} section={section} />
        ))}
      </div>
    </section>
  );
}

function ProfessorLens({ release }: { release: ModelRelease }) {
  return (
    <section className="analysis-lens professor-lens">
      <AnalysisSection title="教授视角" section={release.modelAnalysis.professorLens} />
      <div className="professor-action-grid">
        <ListBlock title="适合重点学习" items={release.studentTakeaways} />
        <ListBlock title="可以马上做的实验" items={release.experiments} />
      </div>
    </section>
  );
}

function AnalysisSection({ title, section }: { title: string; section?: ModelAnalysisSection }) {
  const bullets = Array.isArray(section?.bullets) ? section.bullets : [];
  return (
    <div className="lens-section">
      <span>{title}</span>
      <h4>{section?.headline || "分析数据未就绪"}</h4>
      <p>{section?.professorNote || "当前数据缺少这个分析维度，先用基础信息继续阅读，避免页面白屏。"}</p>
      <ul>
        {bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
      </ul>
    </div>
  );
}

function sourceTypeLabel(sourceType: string): string {
  if (sourceType === "third-party") return "第三方";
  if (sourceType === "derived") return "推导";
  return "官方";
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
