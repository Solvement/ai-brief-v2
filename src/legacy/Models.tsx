"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ModelBenchmark,
  ModelBenchmarkChart,
  ModelClosedEntry,
  ModelEntry,
  ModelOpenEntry,
  ModelsData,
  ModelSource,
} from "../types";
import { loadModels } from "../lib/data";
import { SiteHeader } from "../components/SiteHeader";

interface Props {
  modelId?: string;
}

function formatDate(iso: string): string {
  const day = (iso || "").split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day.replaceAll("-", ".");
  return iso || "—";
}

function relativeTime(iso: string): string {
  if (!iso) return "";
  const value = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "";
  const days = Math.round((Date.now() - t) / 86400000);
  if (days <= 0) return "今天";
  if (days < 30) return `${days} 天前`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.round(months / 12)} 年前`;
}

function takeaway(entry: ModelEntry): string {
  return entry.kind === "open" ? entry.analysis.oneLineTakeaway : entry.changelog.oneLineTakeaway;
}

export function Models({ modelId }: Props) {
  const [data, setData] = useState<ModelsData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // stage-1 cheap version check (no LLM); best-effort, ignore failures
      await fetch("/api/models/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }).catch(() => {});
      const d = await loadModels({ force: true });
      setData(d);
      setErr(null);
    } catch (e) {
      setErr((e as Error)?.message || String(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadModels().then(setData).catch((e) => setErr(e?.message || String(e)));
  }, []);

  const entry = useMemo(() => {
    if (!data || !modelId) return null;
    return data.models.find((m) => m.id === modelId) || null;
  }, [data, modelId]);

  if (err) {
    return (
      <>
        <SiteHeader active="models" />
        <main className="page"><div className="notice error">加载 Models 数据失败：{err}</div></main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <SiteHeader active="models" />
        <main className="page"><div className="loading">正在加载 Models...</div></main>
      </>
    );
  }

  if (modelId && !entry) {
    return (
      <>
        <SiteHeader active="models" />
        <main className="page">
          <div className="breadcrumb"><a href="/models">Models</a><span className="sep">/</span><span>{modelId}</span></div>
          <div className="notice">还没有这个模型的档案。点刷新或换一个。</div>
        </main>
      </>
    );
  }

  if (entry) return <ModelDetail entry={entry} generatedAt={data.generatedAt} onRefresh={refresh} refreshing={refreshing} />;
  return <ModelsIndex data={data} onRefresh={refresh} refreshing={refreshing} />;
}

function KindBadge({ entry }: { entry: ModelEntry }) {
  return (
    <span className={`model-kind-badge ${entry.kind}`}>
      {entry.kind === "open" ? `开源 · ${entry.license || "?"}` : "闭源"}
    </span>
  );
}

function StatusChips({ entry, inCard }: { entry: ModelEntry; inCard?: boolean }) {
  const hasChangelog = entry.hasChangelog && entry.changelogUrl;
  return (
    <div className="model-status-chips">
      <span className={entry.isOpen ? "chip on" : "chip"}>{entry.isOpen ? "可自部署" : "仅 API"}</span>
      <span className={entry.hasEvalData ? "chip on" : "chip off"}>{entry.hasEvalData ? "有测评数据" : "暂无测评"}</span>
      {hasChangelog && inCard ? (
        <span className="chip link">有官方 changelog</span>
      ) : hasChangelog ? (
        <a className="chip link" href={entry.changelogUrl} target="_blank" rel="noreferrer">官方 changelog ↗</a>
      ) : (
        <span className="chip off">无 changelog</span>
      )}
    </div>
  );
}

function ModelsIndex({ data, onRefresh, refreshing }: { data: ModelsData; onRefresh: () => void; refreshing: boolean }) {
  return (
    <>
      <SiteHeader active="models" meta={`Models 更新于 ${formatDate(data.generatedAt)}`} />
      <main className="page models-page">
        <section className="models-intro">
          <div>
            <div className="eyebrow">Models</div>
            <h1>每个模型的最新版本，对做 AI 应用的你意味着什么</h1>
            <p>不是模型新闻流。只看每个家族的最新版：开源讲它解锁了什么、要不要用；闭源讲新功能怎么用、什么时候用。</p>
          </div>
          <RefreshButton onRefresh={onRefresh} refreshing={refreshing} lastChecked={data.generatedAt} />
        </section>

        <div className="models-grid">
          {data.models.map((entry) => (
            <a key={entry.id} className={`model-card ${entry.kind}`} href={`/models/${entry.id}`}>
              <div className="model-card-head">
                <div>
                  <div className="model-card-vendor">{entry.vendor} · {entry.country}</div>
                  <h2>{entry.name}</h2>
                </div>
                <KindBadge entry={entry} />
              </div>
              <div className="model-card-version">
                <b>{entry.latestVersion}</b>
                <span>{relativeTime(entry.latestReleasedAt)}</span>
              </div>
              <p className="model-card-takeaway">{takeaway(entry)}</p>
              <StatusChips entry={entry} inCard />
              <div className="model-card-foot"><span>查看分析 &gt;</span></div>
            </a>
          ))}
        </div>
      </main>
    </>
  );
}

function RefreshButton({ onRefresh, refreshing, lastChecked }: { onRefresh: () => void; refreshing: boolean; lastChecked: string }) {
  return (
    <div className="model-refresh">
      <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? "刷新中…" : "↻ 刷新"}
      </button>
      <small>数据更新于 {formatDate(lastChecked)}</small>
    </div>
  );
}

function ModelDetail({ entry, generatedAt, onRefresh, refreshing }: { entry: ModelEntry; generatedAt: string; onRefresh: () => void; refreshing: boolean }) {
  return (
    <>
      <SiteHeader active="models" meta={`Models 更新于 ${formatDate(generatedAt)}`} />
      <main className="detail model-detail">
        <div className="breadcrumb"><a href="/models">Models</a><span className="sep">/</span><span>{entry.name}</span></div>

        <section className="model-hero">
          <div>
            <div className="eyebrow">{entry.vendor} · {entry.country} · {entry.kind === "open" ? "开源" : "闭源"} · {relativeTime(entry.latestReleasedAt)}</div>
            <h1>{entry.name}</h1>
            <p className="model-hero-version"><b>最新版本</b> · {entry.latestVersion}{entry.latestReleasedAtPrecision ? `（${entry.latestReleasedAtPrecision}）` : ""}</p>
            <p className="model-hero-tldr"><b>一句话</b> · {takeaway(entry)}</p>
            <StatusChips entry={entry} />
          </div>
          <aside className="model-status-panel">
            <InfoRow label="最新版本" value={entry.latestVersion} />
            <InfoRow label="开源" value={entry.isOpen ? `是 · ${entry.license}` : "否（仅 API）"} />
            <InfoRow label="测评数据" value={entry.hasEvalData ? (entry.evalSources.join(" / ") || "有") : "暂无"} />
            <InfoRow label="changelog" value={entry.hasChangelog ? "有（见上方链接）" : "无"} />
            <InfoRow label="最近核对" value={formatDate(entry.lastCheckedAt)} />
            <RefreshButton onRefresh={onRefresh} refreshing={refreshing} lastChecked={generatedAt} />
          </aside>
        </section>

        {entry.kind === "open" ? <OpenAnalysisView entry={entry} /> : <ClosedChangelogView entry={entry} />}

        <p className="model-author-note">{entry.analysisAuthor} · 分析生成于 {formatDate(entry.analysisGeneratedAt)}</p>
      </main>
    </>
  );
}

function OpenAnalysisView({ entry }: { entry: ModelOpenEntry }) {
  const a = entry.analysis;
  return (
    <>
      <section className="section">
        <div className="section-kicker">对你能做什么</div>
        <h3>这次更新解锁了什么</h3>
        <div className="unlock-grid">
          {a.whatItUnlocks.map((u) => (
            <article className="unlock-card" key={u.point}>
              <h4>{u.point}</h4>
              <p>{u.forYou}</p>
              <div className="unlock-meta">
                <span className="unlock-evidence">来源：{u.evidence}</span>
                <span className={`unlock-conf ${u.confidence.startsWith("high") ? "high" : u.confidence.startsWith("low") ? "low" : "mid"}`}>{u.confidence}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BenchmarkBlock benchmark={a.benchmark} />

      <section className="section model-applied-grid">
        <div className="applied-tile">
          <h4>开源对你意味着什么</h4>
          <p>{a.openSourceMeaning}</p>
        </div>
        <div className="applied-tile">
          <h4>要不要用 / 什么时候用</h4>
          <p>{a.whenToUse}</p>
        </div>
        <div className="applied-tile warn">
          <h4>代价与边界</h4>
          <p>{a.cost_caveats}</p>
        </div>
      </section>

      <SourceList sources={a.sources} />
    </>
  );
}

function ClosedChangelogView({ entry }: { entry: ModelClosedEntry }) {
  const c = entry.changelog;
  return (
    <>
      <section className="section">
        <div className="section-kicker">新功能 · 怎么用</div>
        <h3>这次更新有什么新东西，对你怎么用</h3>
        <div className="feature-list">
          {c.newFeatures.map((f) => (
            <article className="feature-item" key={f.feature}>
              <h4>{f.feature}</h4>
              <p className="feature-what"><b>是什么</b>：{f.whatItIs}</p>
              <p className="feature-for"><b>对你有什么用</b>：{f.forYou}</p>
              <p className="feature-how"><b>怎么用</b>：{f.howToUse}</p>
              <p className="feature-when"><b>什么时候用</b>：{f.whenToUse}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="applied-tile warn">
          <h4>限制与注意</h4>
          <p>{c.limitations}</p>
        </div>
      </section>

      <SourceList sources={c.sources} />
    </>
  );
}

function BenchmarkBlock({ benchmark }: { benchmark: ModelBenchmark }) {
  if (!benchmark || !Array.isArray(benchmark.charts)) return null;
  return (
    <section className="section analysis-lens benchmark-lens">
      <div className="lens-head">
        <div>
          <div className="section-kicker">它到底强不强</div>
          <h3>{benchmark.headline}</h3>
        </div>
        <span className="lens-badge">看证据</span>
      </div>
      <p className="professor-note">{benchmark.professorNote}</p>
      <div className="benchmark-chart-grid">
        {benchmark.charts.map((chart) => <BenchmarkChart key={chart.title} chart={chart} />)}
      </div>
      {benchmark.items.length > 0 && (
        <div className="benchmark-grid benchmark-notes-grid">
          {benchmark.items.map((item) => (
            <div className="benchmark-card" key={item.label + item.score}>
              <div className="benchmark-card-top"><span>{item.label}</span><b>{sourceTypeLabel(item.sourceType)}</b></div>
              <strong>{item.score}</strong>
              <p>{item.comparator}</p>
              <small>{item.interpretation}</small>
            </div>
          ))}
        </div>
      )}
      {benchmark.caveats.length > 0 && (
        <div className="benchmark-caveats">
          {benchmark.caveats.map((c) => <span key={c}>{c}</span>)}
        </div>
      )}
    </section>
  );
}

function BenchmarkChart({ chart }: { chart: ModelBenchmarkChart }) {
  const bars = Array.isArray(chart.bars) ? chart.bars : [];
  const maxValue = chart.maxValue || Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="benchmark-chart-card">
      <div className="benchmark-chart-head">
        <div><span>{chart.title}</span><small>{chart.metric}</small></div>
        <b>{sourceTypeLabel(chart.sourceType)}</b>
      </div>
      <div className="chart-bars">
        {bars.map((bar) => {
          const width = Math.max(4, Math.min(100, (bar.value / maxValue) * 100));
          return (
            <div className={`chart-row${bar.highlight ? " highlight" : ""}`} key={`${chart.title}-${bar.label}`}>
              <div className="chart-row-meta"><span>{bar.label}</span><b>{bar.display}</b></div>
              <div className="chart-track" aria-label={`${bar.label}: ${bar.display}`}><div className="chart-fill" style={{ width: `${width}%` }} /></div>
            </div>
          );
        })}
      </div>
      <div className="chart-foot">{chart.higherIsBetter ? "数值越高越好" : "数值越低越好"} · {chart.unit}</div>
    </div>
  );
}

function sourceTypeLabel(sourceType: string): string {
  if (sourceType === "third-party") return "第三方";
  if (sourceType === "derived") return "推导";
  return "官方";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="info-row"><span>{label}</span><b>{value}</b></div>;
}

function SourceList({ sources }: { sources: ModelSource[] }) {
  if (!sources?.length) return null;
  return (
    <section className="section">
      <div className="section-kicker">来源</div>
      <div className="model-source-list">
        {sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.name}</a>)}
      </div>
    </section>
  );
}