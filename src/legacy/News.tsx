"use client";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";

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

  // Group by day; each day = a full-width content-card grid.
  const groups = useMemo(() => {
    if (!data?.items) return [];
    const map = new Map<string, NewsItem[]>();
    for (const item of data.items) {
      const key = dateKey(item.publishedAt);
      (map.get(key) || map.set(key, []).get(key)!).push(item);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, items]) => ({ key, items: items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)) }));
  }, [data]);

  return (
    <AppShell active="news">
      <section className="column-shell">
        <header className="column-hero column-hero-news">
          <div className="section-kicker">Timeline</div>
          <h1 className="column-hero-title">新闻</h1>
          <p className="column-hero-sub">聚合官方公告、媒体报道与社区热帖，自动中译，只保留需要快速知道的事实、影响和后续观察点。点卡片跳原文。</p>
        </header>

        {err ? <div className="column-notice column-notice-error">加载资讯数据失败：{err}</div> : null}
        {!err && !data ? <div className="column-notice">正在加载资讯...</div> : null}
        {!err && data && groups.length === 0 ? <div className="column-notice">暂无资讯。</div> : null}

        {groups.map((group) => (
          <section className="column-day" key={group.key}>
            <div className="column-day-head">
              <span className="column-day-label">{friendlyDate(group.key)}</span>
              <span className="column-day-count">{group.items.length} 条</span>
            </div>
            <div className="home-card-grid home-card-grid-articles">
              {group.items.map((item, i) => <NewsCard key={`${item.url}-${i}`} item={item} />)}
            </div>
          </section>
        ))}
      </section>
    </AppShell>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const typeClass = sourceTypeClass(item.sourceType);
  // Only items with a real image get the image hero. Imageless items (the majority)
  // render as compact text cards — avoids a wall of identical gradient placeholders.
  const hasImage = Boolean(item.imageUrl);
  return (
    <article className={`content-card content-card-news${hasImage ? "" : " content-card-textonly"}`}>
      <a className="content-card-shell" href={item.url} target="_blank" rel="noreferrer">
        {hasImage ? <img className="content-card-visual-image" src={item.imageUrl} alt="" /> : null}
        <div className="content-card-copy">
          <span className="content-card-title">{zh(item)}</span>
          {item.summaryZh ? <p className="content-card-summary">{item.summaryZh}</p> : null}
          <div className="content-card-meta">
            <span className={`news-source-badge ${typeClass}`}>{SOURCE_TYPE_LABEL[item.sourceType] || "来源"}</span>
            <span>{item.source}</span>
            {typeof item.points === "number" ? <span>▲ {item.points}</span> : null}
            <span>{relativeTime(item.publishedAt)}</span>
          </div>
        </div>
      </a>
    </article>
  );
}
