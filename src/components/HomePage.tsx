"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "./SiteHeader";
import { loadPapersIndex, loadTrending, type PapersIndex } from "../lib/data";
import type { TrendingData, AnalyzedRepo } from "../types";

interface NewsItem { title: string; titleZh?: string; summaryZh?: string; imageUrl?: string; source: string; sourceType: string; url: string; publishedAt: string }

function fmt(n: number): string { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n); }
function thumb(id: string) { return id ? `https://cdn-thumbnails.huggingface.co/social-thumbnails/papers/${id}.png` : ""; }

interface HomeProps { initialPapers?: PapersIndex | null; initialTrending?: TrendingData | null; initialNews?: NewsItem[] }

export function HomePage({ initialPapers = null, initialTrending = null, initialNews = [] }: HomeProps) {
  const [papers, setPapers] = useState<PapersIndex | null>(initialPapers);
  const [trending, setTrending] = useState<TrendingData | null>(initialTrending);
  const [news, setNews] = useState<NewsItem[]>(initialNews);

  useEffect(() => {
    // SSR already provides initial data; only fetch client-side if it was missing.
    if (!initialPapers) loadPapersIndex().then(setPapers).catch(() => {});
    if (!initialTrending) loadTrending().then(setTrending).catch(() => {});
    if (!initialNews?.length) fetch("/data/news.json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : null).then((d) => d?.items && setNews(d.items)).catch(() => {});
  }, [initialPapers, initialTrending, initialNews]);

  // top picks
  const deepReads = papers?.deepReads || [];
  const deepCands = papers?.deepCandidates || [];
  const radar = papers?.radar || [];
  const allRepos: AnalyzedRepo[] = trending ? [...new Map([
    ...(trending.monthly?.repos || []), ...(trending.weekly?.repos || []), ...(trending.daily?.repos || []),
  ].map((r) => [r.fullName, r])).values()] : [];
  const allDeepRepos = allRepos
    .filter((r) => r.final_depth === "deep" || r.project_tier === 3)
    .sort((a, b) => (Number(b.starsGained) || 0) - (Number(a.starsGained) || 0));
  const deepRepos = allDeepRepos.slice(0, 4);
  const topNews = news.slice(0, 4);
  const cats = [...new Set(radar.map((r) => r.category).filter(Boolean))].slice(0, 8);

  const stats = [
    { n: papers?.counts.deepReads ?? 0, label: "论文深读" },
    { n: papers?.board.daily.length ?? 0, label: "今日论文" },
    { n: allDeepRepos.length, label: "项目深扒" },
    { n: news.length, label: "今日资讯" },
  ];

  return (
    <>
      <SiteHeader active="home" />
      <main className="page home-page">
        <header className="home-hero">
          <div className="home-hero-text">
            <div className="home-eyebrow">AI BRIEF</div>
            <h1 className="home-title">AI 研究情报 — <span className="accent">为我，也为 AutoSci</span></h1>
            <p className="home-sub">中文优先的 AI 情报工作台：HuggingFace 论文、GitHub 项目、模型版本、AI 资讯 → idea-first 策展 + 深读。先给你新鲜的，再让你一键往里看。</p>
            <div className="home-cta-row">
              <Link className="home-cta primary" href="/articles">看今日精读 →</Link>
              <Link className="home-cta" href="/projects">项目雷达</Link>
            </div>
          </div>
          <div className="home-stats">
            {stats.map((s) => <div className="home-stat" key={s.label}><b>{s.n}</b><span>{s.label}</span></div>)}
          </div>
        </header>

        {/* 今日精读论文 */}
        <section className="home-sec">
          <div className="home-sec-h"><h2>今日精读</h2><Link href="/articles">全部 →</Link></div>
          <div className="home-paper-grid">
            {[...deepReads.map((d) => ({ id: d.arxiv_id, title: d.title, slug: d.slug, line: d.one_sentence_judgment, done: true })),
              ...deepCands.filter((c) => !deepReads.some((d) => d.arxiv_id === c.arxiv_id)).map((c) => ({ id: c.arxiv_id, title: c.title, slug: c.deep_slug, line: c.one_line, done: Boolean(c.deep_slug) }))]
              .slice(0, 3).map((p) => {
                const inner = (<>
                  <div className="home-paper-thumb">
                    <Image src={thumb(p.id)} alt="" fill sizes="(max-width: 860px) 100vw, 33vw" />
                  </div>
                  <div className="home-paper-body">
                    <h3>{p.title}</h3>
                    {p.line && <p>{p.line}</p>}
                    <span className={`radar-cta${p.slug ? " deep" : ""}`}>{p.slug ? "深读 →" : "看论文 →"}</span>
                  </div>
                </>);
                return p.slug
                  ? <Link key={p.id} className="home-paper-card" href={`/papers/${encodeURIComponent(p.slug)}`}>{inner}</Link>
                  : <a key={p.id} className="home-paper-card" href={`https://huggingface.co/papers/${p.id}`} target="_blank" rel="noreferrer">{inner}</a>;
              })}
          </div>
        </section>

        {/* 本月项目标杆 */}
        {deepRepos.length > 0 && (
          <section className="home-sec">
            <div className="home-sec-h"><h2>项目标杆 · 本月高增长</h2><Link href="/projects">全部 →</Link></div>
            <div className="home-repo-grid">
              {deepRepos.map((r) => {
                const slug = r.briefSlug || r.brief_slug;
                const inner = (<>
                  <img className="home-repo-avatar" src={r.ownerAvatarUrl} alt={r.owner} loading="lazy" />
                  <div className="home-repo-body">
                    <div className="home-repo-name"><b>{r.name}</b><span>{r.owner}</span></div>
                    <div className="home-repo-meta">★+{fmt(Number(r.starsGained) || r.stars)} · 深扒</div>
                  </div>
                </>);
                return slug
                  ? <Link key={r.fullName} className="home-repo-card" href={`/brief/${encodeURIComponent(slug)}`}>{inner}</Link>
                  : <a key={r.fullName} className="home-repo-card" href={r.url} target="_blank" rel="noreferrer">{inner}</a>;
              })}
            </div>
          </section>
        )}

        {/* AI 资讯 + 热门主题 */}
        <div className="home-two-col">
          {topNews.length > 0 && (
            <section className="home-sec">
              <div className="home-sec-h"><h2>AI 资讯</h2><Link href="/news">全部 →</Link></div>
              <div className="home-news-list">
                {topNews.map((n, i) => (
                  <a className="home-news-row" key={`${n.url}-${i}`} href={n.url} target="_blank" rel="noreferrer">
                    {n.imageUrl ? <img className="home-news-thumb" src={n.imageUrl} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <span className="home-news-dot" />}
                    <span className="home-news-title">{n.titleZh || n.title}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
          {cats.length > 0 && (
            <section className="home-sec">
              <div className="home-sec-h"><h2>热门主题</h2></div>
              <div className="home-tags">
                {cats.map((c) => <Link key={c} className="home-tag" href="/articles">{c}</Link>)}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
