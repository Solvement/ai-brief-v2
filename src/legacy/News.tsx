"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { SiteHeader } from "../components/SiteHeader";

interface NewsItem {
  title: string;
  titleZh?: string;
  summaryZh?: string;
  imageUrl?: string;
  source: string;
  sourceType: string; // official / press / community / reddit
  url: string;
  publishedAt: string;
  points?: number;
  summary?: string;
}

interface NewsData {
  generatedAt: string;
  column?: string;
  items: NewsItem[];
}

function formatDate(iso: string): string {
  const day = (iso || "").split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day.replaceAll("-", ".");
  return iso || "—";
}
function dateKey(iso: string): string {
  return (iso || "").split("T")[0] || "未知日期";
}
function relativeTime(iso: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} 天前`;
  return `${Math.round(days / 30)} 个月前`;
}
function friendlyDate(key: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (key === today) return "今天";
  if (key === yesterday) return "昨天";
  return key.replaceAll("-", ".");
}

const SOURCE_TYPE_LABEL: Record<string, string> = { official: "官方", press: "媒体", community: "社区", reddit: "社区" };
function sourceTypeClass(t: string): string {
  if (t === "official") return "official";
  if (t === "press") return "press";
  return "community";
}
const zh = (i: NewsItem) => i.titleZh || i.title;

/** consistent monogram fallback when an item has no usable image (never a broken img) */
function Monogram({ item }: { item: NewsItem }) {
  const ch = (item.source || "?").trim().charAt(0).toUpperCase();
  return <div className={`news-mono ${sourceTypeClass(item.sourceType)}`} aria-hidden>{ch}</div>;
}

export function News({ initial = null }: { initial?: NewsData | null }) {
  const [data, setData] = useState<NewsData | null>(initial);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.items?.length) return; // SSR provided data
    fetch("/data/news.json", { cache: "no-cache" })
      .then(async (res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return (await res.json()) as NewsData; })
      .then(setData)
      .catch((e) => setErr((e as Error)?.message || String(e)));
  }, [initial]);

  const groups = useMemo(() => {
    if (!data?.items) return [];
    const map = new Map<string, NewsItem[]>();
    for (const item of data.items) {
      const key = dateKey(item.publishedAt);
      (map.get(key) || map.set(key, []).get(key)!).push(item);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, items]) => {
        const sorted = items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
        // hero = up to 3 items that actually have an image; rest = clean rows
        const heroes = sorted.filter((i) => i.imageUrl).slice(0, 3);
        const heroSet = new Set(heroes);
        return { key, heroes, rows: sorted.filter((i) => !heroSet.has(i)) };
      });
  }, [data]);

  if (err) return (<><SiteHeader active="news" /><main className="page"><div className="notice error">加载资讯数据失败：{err}</div></main></>);
  if (!data) return (<><SiteHeader active="news" /><main className="page"><div className="loading">正在加载资讯...</div></main></>);

  return (
    <>
      <SiteHeader active="news" meta={`资讯更新于 ${formatDate(data.generatedAt)}`} />
      <main className="page news-page">
        <section className="models-intro">
          <div>
            <div className="eyebrow">News · 资讯</div>
            <h1>每天的 AI 动态，一屏扫完</h1>
            <p>聚合官方公告、媒体报道与社区热帖，自动中译。点卡片跳原文。</p>
          </div>
        </section>

        {groups.length === 0 ? <div className="notice">暂无资讯。</div> : (
          <div className="news-feed">
            {groups.map((group) => (
              <section className="news-day" key={group.key}>
                <div className="news-day-head">
                  <span className="news-day-label">{friendlyDate(group.key)}</span>
                  <span className="news-day-count">{group.heroes.length + group.rows.length} 条</span>
                </div>

                {group.heroes.length > 0 && (
                  <div className="news-hero-grid">
                    {group.heroes.map((item, i) => (
                      <a className="news-hero" key={`h-${item.url}-${i}`} href={item.url} target="_blank" rel="noreferrer">
                        <div className="news-hero-media">
                          <Image src={item.imageUrl!} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" priority={i === 0} />
                        </div>
                        <div className="news-hero-body">
                          <div className="news-hero-title">{zh(item)}</div>
                          {item.summaryZh && <div className="news-hero-summary">{item.summaryZh}</div>}
                          <div className="news-row-meta">
                            <span className={`news-source-badge ${sourceTypeClass(item.sourceType)}`}>{SOURCE_TYPE_LABEL[item.sourceType] || "来源"}</span>
                            <span className="news-source-name">{item.source}</span>
                            <span className="news-time">{relativeTime(item.publishedAt)}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                <div className="news-day-items">
                  {group.rows.map((item, i) => (
                    <a className="news-row" key={`${item.url}-${i}`} href={item.url} target="_blank" rel="noreferrer">
                      <Monogram item={item} />
                      <div className="news-row-main">
                        <div className="news-row-title">{zh(item)}</div>
                        {item.summaryZh && <div className="news-row-summary">{item.summaryZh}</div>}
                        <div className="news-row-meta">
                          <span className={`news-source-badge ${sourceTypeClass(item.sourceType)}`}>{SOURCE_TYPE_LABEL[item.sourceType] || "来源"}</span>
                          <span className="news-source-name">{item.source}</span>
                          {typeof item.points === "number" && <span className="news-points">▲ {item.points}</span>}
                          <span className="news-time">{relativeTime(item.publishedAt)}</span>
                        </div>
                      </div>
                      <span className="news-row-arrow" aria-hidden>↗</span>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
