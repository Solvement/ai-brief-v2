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
              {entry.paradigm && (
                <div className="model-card-access">
                  <AccessPill label={(entry.paradigm.card as ParadigmCard | undefined)?.开放度标签} access={entry.paradigm.access} />
                  {entry.paradigm.branch === "update" && <span className="model-card-tag">版本更新</span>}
                  {entry.paradigm.branch === "new_model" && <span className="model-card-tag new">新模型</span>}
                </div>
              )}
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

        <ParadigmBlock entry={entry} />

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

// ─────────────────────────── paradigm cards ───────────────────────────

interface ParadigmBenchmark {
  名称?: string;
  分数?: string;
  对手?: string;
  标注?: string; // 自报 / 实测
  解读?: string;
}

interface ParadigmCard {
  名称?: string;
  厂商?: string;
  发布日?: string;
  开放度标签?: string;
  类型?: string;
  规模架构?: string;
  关键benchmark?: ParadigmBenchmark[];
  强弱一句?: string;
  一句话定位?: string;
  术语注解?: string[];
  许可证?: { 名称?: string; 能否商用?: string };
  自托管硬件?: string;
  可用变体?: string[];
  base_model?: string;
  价格?: { 输入每百万token?: string; 输出每百万token?: string };
  知识截止?: string;
  "model string"?: string;
  速率?: string;
  "多模态I/O"?: string;
}

interface ParadigmUpdate {
  版本?: string;
  变了什么?: string[];
  破坏性提醒?: { [k: string]: string };
  值不值得切一句?: string;
}

function isMissing(v?: string): boolean {
  return !v || v === "官方未披露" || v === "000";
}

/** Colored pill for openness label (开放度). */
function AccessPill({ label, access }: { label?: string; access?: string }) {
  const text = label || (access === "open" ? "开源" : "闭源");
  let cls = "closed";
  if (text.includes("真开源")) cls = "open-free";
  else if (text.includes("有条件")) cls = "open-cond";
  else if (text.includes("仅研究")) cls = "research";
  else if (text.includes("闭源") || text.includes("仅API")) cls = "closed";
  return <span className={`access-pill ${cls}`}>{text}</span>;
}

function ParadigmBlock({ entry }: { entry: ModelEntry }) {
  const p = entry.paradigm;
  if (!p) return null;
  if (p.template === "version_update" && p.update) {
    return <VersionUpdateCard entry={entry} card={p.card as ParadigmCard | undefined} update={p.update as ParadigmUpdate} access={p.access} updateSize={p.updateSize} />;
  }
  if (p.template === "variant_merged" || p.branch === "variant_merged" || p.variant) {
    return <VariantMergedCard entry={entry} variant={p.variant as VariantInfo | undefined} card={p.card as ParadigmCard | undefined} />;
  }
  if (p.card) {
    return <NewModelCard entry={entry} card={p.card as ParadigmCard} access={p.access} />;
  }
  return null;
}

interface VariantInfo {
  名称?: string;
  name?: string;
  canonical?: string;
  归并入?: string;
  merged_into?: string;
  可用变体?: string[];
  note?: string;
  备注?: string;
}

/** Fallback card for variant models that were merged into a canonical entry. */
function VariantMergedCard({ entry, variant, card }: { entry: ModelEntry; variant?: VariantInfo; card?: ParadigmCard }) {
  const v = variant || {};
  const variantName = v.名称 || v.name || card?.名称 || entry.latestVersion || entry.id;
  const canonical = v.canonical || v.归并入 || v.merged_into || "";
  const variants = v.可用变体 || card?.可用变体 || [];
  const note = v.note || v.备注 || "";
  return (
    <section className="section">
      <div className="section-kicker">变体已归并</div>
      <article className="paradigm-card variant-merged">
        <div className="pcard-head">
          <h3>{variantName}</h3>
          <span className="access-pill open-cond">[变体·已归并]</span>
        </div>
        <div className="pcard-line">
          <b>说明</b>
          <p>
            这是一个变体版本，已归并到{canonical ? <> 正式版 <b>{canonical}</b></> : "正式版"}下。
            {canonical ? "请在正式版的「可用变体」中查看。" : "详情见对应正式版条目。"}
          </p>
        </div>
        {variants.length > 0 && (
          <div className="pcard-meta pcard-meta--extra">
            <span className="pcard-meta-wide"><b>可用变体</b> {variants.join(" · ")}</span>
          </div>
        )}
        {!isMissing(note) && <div className="pcard-line"><b>备注</b><p>{note}</p></div>}
      </article>
    </section>
  );
}

function BenchAttr({ attr }: { attr?: string }) {
  // No defaulting to 自报: only show a definite pill when the source is known.
  if (attr === "实测") return <span className="bench-attr verified">✓ 实测</span>;
  if (attr === "自报") return <span className="bench-attr self">自报</span>;
  return <span className="bench-attr unknown">来源未披露</span>;
}

function NewModelFields({ card, access }: { card: ParadigmCard; access?: string }) {
  const isOpen = access === "open";
  const benches = (card.关键benchmark || []).filter((b) => !isMissing(b.名称) && !isMissing(b.分数));
  return (
    <>
      <div className="pcard-meta">
        <span><b>厂商</b> {card.厂商 || "—"}</span>
        <span><b>发布日</b> {isMissing(card.发布日) ? "未披露" : card.发布日}</span>
        {!isMissing(card.类型) && <span><b>类型</b> {card.类型}</span>}
        {!isMissing(card.规模架构) && <span><b>规模/架构</b> {card.规模架构}</span>}
      </div>

      {benches.length > 0 && (
        <div className="pcard-section">
          <div className="pcard-label">关键 benchmark</div>
          <div className="pcard-bench-list">
            {benches.map((b, i) => (
              <div className="pcard-bench" key={`${b.名称}-${i}`}>
                <div className="pcard-bench-top">
                  <span className="pcard-bench-name">{b.名称}</span>
                  <BenchAttr attr={b.标注} />
                </div>
                <div className="pcard-bench-score">{b.分数}</div>
                {!isMissing(b.对手) && <div className="pcard-bench-vs">{b.对手}</div>}
                {!isMissing(b.解读) && <div className="pcard-bench-note">{b.解读}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isMissing(card.强弱一句) && (
        <div className="pcard-line"><b>强在哪 / 弱在哪</b><p>{card.强弱一句}</p></div>
      )}
      {!isMissing(card.一句话定位) && (
        <div className="pcard-line"><b>一句话定位</b><p>{card.一句话定位}</p></div>
      )}

      {isOpen ? (
        <div className="pcard-meta pcard-meta--extra">
          {card.许可证 && <span><b>许可证</b> {card.许可证.名称}（{card.许可证.能否商用 || "?"}）</span>}
          {!isMissing(card.自托管硬件) && <span><b>自托管硬件</b> {card.自托管硬件}</span>}
          {!isMissing(card.base_model) && <span><b>base model</b> {card.base_model}</span>}
          {card.可用变体 && card.可用变体.length > 0 && <span className="pcard-meta-wide"><b>可用变体</b> {card.可用变体.join(" · ")}</span>}
        </div>
      ) : (
        <div className="pcard-meta pcard-meta--extra">
          {card.价格 && (!isMissing(card.价格.输入每百万token) || !isMissing(card.价格.输出每百万token)) && (
            <span><b>价格 /百万token</b> 入 {card.价格.输入每百万token || "?"} · 出 {card.价格.输出每百万token || "?"}</span>
          )}
          {!isMissing(card.知识截止) && <span><b>知识截止</b> {card.知识截止}</span>}
          {!isMissing(card["model string"]) && <span><b>model string</b> <code>{card["model string"]}</code></span>}
          {!isMissing(card.速率) && <span><b>速率</b> {card.速率}</span>}
          {!isMissing(card["多模态I/O"]) && <span><b>多模态 I/O</b> {card["多模态I/O"]}</span>}
        </div>
      )}
    </>
  );
}

function NewModelCard({ entry, card, access }: { entry: ModelEntry; card: ParadigmCard; access?: string }) {
  return (
    <section className="section">
      <div className="section-kicker">新模型卡片</div>
      <article className="paradigm-card new-model">
        <div className="pcard-head">
          <h3>{card.名称 || entry.latestVersion}</h3>
          <AccessPill label={card.开放度标签} access={access} />
        </div>
        <NewModelFields card={card} access={access} />
      </article>
    </section>
  );
}

function VersionUpdateCard({
  entry, card, update, access, updateSize,
}: {
  entry: ModelEntry;
  card?: ParadigmCard;
  update: ParadigmUpdate;
  access?: string;
  updateSize?: string;
}) {
  const changes = update.变了什么 || [];
  const breaking = update.破坏性提醒 || {};
  const breakingItems = Object.entries(breaking).filter(([, v]) => !isMissing(v));
  return (
    <section className="section">
      <div className="section-kicker">版本更新</div>
      <article className="paradigm-card version-update">
        <div className="pcard-head">
          <div className="pcard-head-left">
            <h3>{update.版本 || entry.latestVersion}</h3>
            {updateSize && <span className={`update-size ${updateSize}`}>{updateSize === "medium" ? "中等更新" : "小更新"}</span>}
          </div>
          <AccessPill label={card?.开放度标签} access={access} />
        </div>

        {changes.length > 0 && (
          <div className="pcard-section">
            <div className="pcard-label">变了什么</div>
            <ul className="pcard-diff-list">
              {changes.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {breakingItems.length > 0 && (
          <div className="pcard-breaking">
            <div className="pcard-label">破坏性提醒</div>
            <div className="pcard-breaking-rows">
              {breakingItems.map(([k, v]) => (
                <span key={k}><b>{k}</b> {v}</span>
              ))}
            </div>
          </div>
        )}

        {!isMissing(update.值不值得切一句) && (
          <div className="pcard-verdict"><b>值不值得切</b><p>{update.值不值得切一句}</p></div>
        )}
      </article>
    </section>
  );
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