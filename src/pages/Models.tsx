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

        <div className="detail-grid">
          <div className="main-col">
            <section className="section">
              <h3>学习路线</h3>
              <div className="learning-list">
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
            </section>

            {company.series.map((series) => <SeriesSection key={series.id} series={series} />)}

            <section className="section">
              <h3>大更新与产品能力</h3>
              <div className="update-list">
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
          </div>

          <aside className="aside-col">
            <div className="aside">
              <h4 className="aside-title"><span className="ico">i</span>Key facts</h4>
              <InfoRow label="Company" value={company.shortName} />
              <InfoRow label="Audience" value={company.targetAudience.join(" / ")} />
              <InfoRow label="Difficulty" value={company.difficulty} />
              <InfoRow label="Action" value={company.recommendedAction} />
              <InfoRow label="Published" value={formatDate(company.publishedAt)} />
            </div>

            <div className="aside">
              <h4 className="aside-title"><span className="ico">→</span>Checklist</h4>
              {company.nextSteps.map((step) => <div className="next-step" key={step}>{step}</div>)}
            </div>

            <div className="aside">
              <h4 className="aside-title"><span className="ico">↗</span>Sources</h4>
              <SourceLinks sources={company.sources} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function SeriesSection({ series }: { series: ModelSeries }) {
  const releaseNames = new Map(series.releases.map((release) => [release.id, release.name]));
  return (
    <section className="section model-series-section">
      <div className="section-kicker">Model Series</div>
      <h3>{series.title}</h3>
      <p className="section-lead">{series.summary}</p>
      <div className="teacher-note">{series.teacherNote}</div>
      <div className="release-timeline">
        {series.releases.map((release) => (
          <ReleaseCard key={release.id} release={release} nextName={release.nextRelation ? releaseNames.get(release.nextRelation.toReleaseId) : undefined} />
        ))}
      </div>
    </section>
  );
}

function ReleaseCard({ release, nextName }: { release: ModelRelease; nextName?: string }) {
  return (
    <article className="release-card">
      <div className="release-date">{formatDate(release.publishedAt)}</div>
      <div className="release-body">
        <div className="release-head">
          <div>
            <h4>{release.name}</h4>
            <p>{release.oneSentenceTakeaway}</p>
          </div>
          <span className="content-pill">{release.kind}</span>
        </div>

        <div className="release-block">
          <h5>这一代是什么</h5>
          <p>{release.positioning}</p>
        </div>
        <div className="release-block">
          <h5>上一阶段的问题</h5>
          <p>{release.problemSolved}</p>
        </div>
        <div className="release-columns">
          <ListBlock title="核心改动" items={release.keyChanges} />
          <div className="release-block">
            <h5>为什么这么改</h5>
            <p>{release.whyChanged}</p>
          </div>
          <div className="release-block">
            <h5>怎么解决</h5>
            <p>{release.howSolved}</p>
          </div>
        </div>
        <div className="release-columns">
          <ListBlock title="取舍" items={release.tradeoffs} />
          <ListBlock title="学生要学" items={release.studentTakeaways} />
          <ListBlock title="可做实验" items={release.experiments} />
        </div>

        {release.api && (
          <div className="api-strip">
            <InfoRow label="Model" value={release.api.modelNames.join(" / ")} />
            <InfoRow label="Context" value={release.api.contextWindow} />
            <InfoRow label="Max output" value={release.api.maxOutput} />
            <InfoRow label="Modes" value={release.api.modes.join(" / ")} />
          </div>
        )}

        <div className="teacher-note">{release.teacherNote}</div>
        <SourceLinks sources={release.sources} />

        {release.nextRelation && (
          <div className="relation-block">
            <div className="relation-title">和后一代的关系：{release.name} -&gt; {nextName || release.nextRelation.toReleaseId}</div>
            <p>{release.nextRelation.summary}</p>
            <div className="relation-grid">
              <InfoRow label="继承" value={release.nextRelation.inherits} />
              <InfoRow label="改变" value={release.nextRelation.changes} />
              <InfoRow label="原因" value={release.nextRelation.why} />
              <InfoRow label="解法" value={release.nextRelation.solvedBy} />
            </div>
            <div className="teacher-note">{release.nextRelation.teacherNote}</div>
          </div>
        )}
      </div>
    </article>
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
