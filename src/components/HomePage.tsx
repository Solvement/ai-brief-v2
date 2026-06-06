"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "./AppShell";
import { loadPapersIndex, loadTrending, type PapersIndex } from "../lib/data";
import type { TrendingData, AnalyzedRepo, ModelsData, ModelEntry } from "../types";

interface NewsItem { title: string; titleZh?: string; summaryZh?: string; imageUrl?: string; source: string; sourceType: string; url: string; publishedAt: string }

// 今日 3 分钟日报：聚类去噪后的当日全栏摘要。从 public/data/daily-digest.json 渲染（数据优先红线）。
type DigestKind = "paper" | "project" | "model" | "news" | "podcast";
interface DigestItem { kind: DigestKind; title: string; one_line?: string; href: string; score?: number }
interface DigestCluster { id: string; theme: string; why_it_matters?: string; items: DigestItem[] }
interface DailyDigest { generatedAt: string; date: string; readMinutes?: number; lede: string; clusters: DigestCluster[]; audio?: { available: boolean; note?: string } }

const KIND_LABEL: Record<DigestKind, string> = { paper: "论文", project: "项目", model: "模型", news: "资讯", podcast: "播客" };

function isInternal(href: string) { return href.startsWith("/"); }

/** 把数据里的 YYYY-MM-DD 转成中文「2026 年 6 月 5 日」。无法解析时回退原串。 */
function zhDate(d?: string): string {
  if (!d) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  return `${Number(m[1])} 年 ${Number(m[2])} 月 ${Number(m[3])} 日`;
}

interface HomeProps {
  initialPapers?: PapersIndex | null;
  initialTrending?: TrendingData | null;
  initialNews?: NewsItem[];
  initialDigest?: DailyDigest | null;
  initialModels?: ModelsData | null;
}

type ProjectTabName = "daily" | "weekly" | "monthly";
const TAB_LABEL: Record<ProjectTabName, string> = { daily: "日榜", weekly: "周榜", monthly: "月榜" };

export function HomePage({ initialPapers = null, initialTrending = null, initialNews = [], initialDigest = null, initialModels = null }: HomeProps) {
  const [papers, setPapers] = useState<PapersIndex | null>(initialPapers);
  const [trending, setTrending] = useState<TrendingData | null>(initialTrending);
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [digest, setDigest] = useState<DailyDigest | null>(initialDigest);
  const [models, setModels] = useState<ModelsData | null>(initialModels);

  // Hydration-safe greeting: neutral default on the server / first paint, then the
  // client-local time-based greeting after mount (no SSR mismatch).
  const [greeting, setGreeting] = useState<string>("Hello");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    if (!initialPapers) loadPapersIndex().then(setPapers).catch(() => {});
    if (!initialTrending) loadTrending().then(setTrending).catch(() => {});
    if (!initialNews?.length) fetch("/data/news.json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : null).then((d) => d?.items && setNews(d.items)).catch(() => {});
    if (!initialDigest) fetch("/data/daily-digest.json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : null).then((d) => d?.clusters && setDigest(d)).catch(() => {});
    if (!initialModels) fetch("/data/models.json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : null).then((d) => d?.models && setModels(d)).catch(() => {});
  }, [initialPapers, initialTrending, initialNews, initialDigest, initialModels]);

  // ── Real counts for the metric row ──
  const allRepos: AnalyzedRepo[] = trending ? [...new Map([
    ...(trending.monthly?.repos || []), ...(trending.weekly?.repos || []), ...(trending.daily?.repos || []),
  ].map((r) => [r.fullName, r])).values()] : [];
  const cProjects = allRepos.filter((r) => r.final_depth === "deep" || r.project_tier === 3).length;
  const cPapers = papers?.board.daily.length ?? 0;
  const cDeep = papers?.counts.deepReads ?? 0;
  const cNews = news.length;

  const todayZh = zhDate(digest?.date || papers?.date);
  const hasDigest = Boolean(digest?.clusters?.length);

  const briefingLine = `今天更新 ${cPapers} 篇论文 · ${cProjects} 个推荐项目 · 深读 ${cDeep} 篇 · ${cNews} 条资讯，挑你今天最该看的开始。`;

  return (
    <AppShell active="home">
      <main className="home-shell">
        {/* ── Today header ── */}
        <header className="home-today-header">
          <div>
            <p className="home-kicker">AI-Brief Daily{todayZh ? ` · ${todayZh}` : ""}</p>
            <h1>{greeting}, Kevin</h1>
            <p className="home-briefing">{briefingLine}</p>
          </div>
          <dl className="home-metrics" aria-label="今日统计">
            <Metric label="今日论文" value={cPapers} />
            <Metric label="深读内容" value={cDeep} />
            <Metric label="推荐项目" value={cProjects} />
          </dl>
        </header>

        {/* ── 今日 3 分钟（先读我）── */}
        {hasDigest && digest && <DigestSection digest={digest} />}

        {/* ── 精读论文 ── */}
        <PapersSection papers={papers} />

        {/* ── 项目榜单 ── */}
        <ProjectsSection trending={trending} />

        {/* ── 资讯 ── */}
        <NewsSection news={news} />

        {/* ── 模型 ── */}
        <ModelsSection models={models} />
      </main>
    </AppShell>
  );
}

function SectionHeader({ kicker, title, href, action }: { kicker: string; title: string; href: string; action: string }) {
  return (
    <div className="home-section-head">
      <div>
        <p className="home-kicker">{kicker}</p>
        <h2>{title}</h2>
      </div>
      <Link href={href}>{action}</Link>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// ── 今日 3 分钟 digest, restyled into the v3 card system ──
function DigestSection({ digest }: { digest: DailyDigest }) {
  return (
    <section className="home-section" id="digest">
      <div className="home-section-head">
        <div>
          <p className="home-kicker">Read me first · 先读我</p>
          <h2>今日 {digest.readMinutes ?? 3} 分钟</h2>
        </div>
        <button type="button" className="home-audio-btn" disabled aria-disabled="true" title={digest.audio?.note || "音频简报即将上线"}>
          ▶ 听简报 <span className="home-audio-soon">即将</span>
        </button>
      </div>
      <p className="home-digest-lede">{digest.lede}</p>
      <div className="home-card-grid home-digest-grid">
        {digest.clusters.map((c, ci) => (
          <article className={`digest-cluster${ci === 0 ? " digest-cluster-feature" : ""}`} key={c.id}>
            <div className="digest-cluster-top">
              <span className="digest-cluster-no">{String(ci + 1).padStart(2, "0")}</span>
              <h3>{c.theme}</h3>
            </div>
            {c.why_it_matters && <p className="digest-cluster-why">{c.why_it_matters}</p>}
            <ul className="digest-cluster-items">
              {c.items.slice(0, ci === 0 ? 4 : 3).map((it, i) => {
                const inner = (
                  <>
                    <span className={`digest-kind digest-kind-${it.kind}`}>{KIND_LABEL[it.kind]}</span>
                    <span className="digest-item-text">
                      <b>{it.title}</b>
                      {ci === 0 && it.one_line && <span>{it.one_line}</span>}
                    </span>
                    <span className="digest-item-arrow" aria-hidden="true">→</span>
                  </>
                );
                return (
                  <li key={`${c.id}-${i}`}>
                    {isInternal(it.href)
                      ? <Link className="digest-item" href={it.href}>{inner}</Link>
                      : <a className="digest-item" href={it.href} target="_blank" rel="noreferrer">{inner}</a>}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── 精读论文：deepReads → top-pick cards ──
function PapersSection({ papers }: { papers: PapersIndex | null }) {
  const picks = (papers?.deepReads ?? []).slice(0, 5);
  if (!picks.length) return null;
  return (
    <section className="home-section">
      <SectionHeader kicker="Papers" title="今日精读论文" href="/articles" action="看全部文章" />
      <div className="top-picks-grid">
        {picks.map((p, i) => (
          <article className="top-pick-card" key={p.arxiv_id}>
            <div className="top-pick-card-head">
              <div className="top-pick-rank">#{i + 1}</div>
              <div className="top-pick-signals">
                <span className="verdict-badge verdict-badge-deep_read">深读</span>
                {p.tags?.[0] ? <span className="trust-badge trust-badge-high">{p.tags[0]}</span> : null}
              </div>
            </div>
            <Link href={`/papers/${p.slug}`}>{p.title}</Link>
            {p.one_sentence_judgment ? <p>{p.one_sentence_judgment}</p> : null}
            <span className="top-pick-meta">Paper · 深度解读 · {p.date}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── 项目榜单：trending daily/weekly/monthly tabs → project cards ──
function ProjectsSection({ trending }: { trending: TrendingData | null }) {
  const [active, setActive] = useState<ProjectTabName>("daily");
  const current = useMemo<AnalyzedRepo[]>(() => {
    const board = trending?.[active]?.repos ?? [];
    return [...board].slice(0, 8);
  }, [trending, active]);
  const hasAny = (["daily", "weekly", "monthly"] as ProjectTabName[]).some((t) => (trending?.[t]?.repos?.length ?? 0) > 0);
  if (!hasAny) return null;
  return (
    <section className="home-section">
      <SectionHeader kicker="Projects" title="项目：先筛可复用的工程" href="/projects" action="看全部项目" />
      <div className="home-tabbar" role="tablist" aria-label="项目榜单">
        {(["daily", "weekly", "monthly"] as ProjectTabName[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === active}
            className={t === active ? "home-tab-active" : ""}
            onClick={() => setActive(t)}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="home-card-grid">
        {current.map((repo, i) => <ProjectCard key={repo.fullName} repo={repo} rank={i + 1} />)}
      </div>
    </section>
  );
}

function repoHref(repo: AnalyzedRepo): string {
  const slug = repo.briefSlug || repo.brief_slug;
  if (slug) return `/brief/${slug}`;
  return repo.url;
}

function ProjectCard({ repo, rank }: { repo: AnalyzedRepo; rank: number }) {
  const isDeep = repo.final_depth === "deep" || repo.project_tier === 3;
  const href = repoHref(repo);
  const internal = href.startsWith("/");
  const desc = repo.tldr || repo.description || "";
  const mono = (repo.name || repo.fullName || "AI").split(/[\/\s-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "AI";
  const avatar = repo.ownerAvatarUrl;
  const Title = internal
    ? <Link className="project-card-v2-title" href={href}>{repo.fullName}</Link>
    : <a className="project-card-v2-title" href={href} target="_blank" rel="noreferrer">{repo.fullName}</a>;
  const Cta = internal
    ? <Link className={isDeep ? "project-card-v2-cta project-card-v2-cta-deep" : "project-card-v2-cta"} href={href}>{isDeep ? "Deep Dive" : "速读"} →</Link>
    : <a className="project-card-v2-cta" href={href} target="_blank" rel="noreferrer">原仓库 →</a>;
  return (
    <article className={`project-card-v2 ${isDeep ? "project-card-v2-high" : "project-card-v2-medium"}`}>
      <div className="project-card-v2-head">
        {avatar
          ? <img className="project-avatar" src={avatar} alt="" />
          : <div className="project-avatar project-avatar-fallback">{mono}</div>}
        <div style={{ minWidth: 0 }}>
          <div className="project-card-v2-title-row">
            <span className="project-rank-pill">#{rank}</span>
            {Title}
          </div>
          <div className="project-card-v2-meta">
            <span>{repo.language || "GitHub"}</span>
            <span>{isDeep ? "深度解读" : "轻度分析"}</span>
          </div>
        </div>
      </div>
      <p className="project-card-v2-summary">{desc}</p>
      <div className="project-card-v2-footer">
        <div className="project-card-v2-footmeta">
          <span className="project-lang-dot project-lang-dot-github" />
          <span>★ {Intl.NumberFormat("en", { notation: "compact" }).format(repo.stars || 0)}</span>
        </div>
        {Cta}
      </div>
    </article>
  );
}

// ── 资讯：news.json → news image cards ──
function NewsSection({ news }: { news: NewsItem[] }) {
  const items = news.slice(0, 6);
  if (!items.length) return null;
  return (
    <section className="home-section">
      <SectionHeader kicker="News" title="资讯：今天该知道的事" href="/news" action="看全部资讯" />
      <div className="home-card-grid home-card-grid-articles">
        {items.map((item, i) => <NewsCard key={`${item.url}-${i}`} item={item} />)}
      </div>
    </section>
  );
}

const SOURCE_TYPE_LABEL: Record<string, string> = { official: "官方", press: "媒体", community: "社区", reddit: "社区" };

function NewsCard({ item }: { item: NewsItem }) {
  const title = item.titleZh || item.title;
  const typeClass = item.sourceType === "official" ? "official" : item.sourceType === "press" ? "press" : "community";
  const hasImage = Boolean(item.imageUrl);
  return (
    <article className={`content-card content-card-news${hasImage ? "" : " content-card-textonly"}`}>
      <a className="content-card-shell" href={item.url} target="_blank" rel="noreferrer">
        {hasImage ? <img className="content-card-visual-image" src={item.imageUrl} alt="" /> : null}
        <div className="content-card-copy">
          <span className="content-card-title">{title}</span>
          {item.summaryZh ? <p className="content-card-summary">{item.summaryZh}</p> : null}
          <div className="content-card-meta">
            <span className={`news-source-badge ${typeClass}`}>{SOURCE_TYPE_LABEL[item.sourceType] || "来源"}</span>
            <span>{item.source}</span>
          </div>
        </div>
      </a>
    </article>
  );
}

// ── 模型：models.json → vendor timeline cards ──
function ModelsSection({ models }: { models: ModelsData | null }) {
  const cards = models?.models ?? [];
  if (!cards.length) return null;
  return (
    <section className="home-section">
      <SectionHeader kicker="Models" title="模型：大厂时间线 + 开源热点" href="/models" action="看模型库" />
      <div className="model-timeline-grid">
        {cards.map((m) => <ModelCardView key={m.id} model={m} />)}
      </div>
    </section>
  );
}

function ModelCardView({ model }: { model: ModelEntry }) {
  return (
    <Link className="vendor-timeline-card" href={`/models/${model.id}`}>
      <span>{model.vendor}{model.isOpen ? " · 开源" : " · 闭源"}</span>
      <strong>{model.latestVersion || model.name}</strong>
      <p>{model.name}{model.latestReleasedAt ? ` · 发布于 ${model.latestReleasedAt}` : ""}</p>
      <em>{model.isOpen ? "开放权重，可深读" : "厂商更新，看变更"}</em>
    </Link>
  );
}
