"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Episode {
  slug: string;
  title: string;
  guest?: string;
  source?: string;
  lang?: string;
  topic?: string;
  url?: string;
  duration?: string;
  ingested?: string;
  tldr?: string;
  verdict?: string;
  tags?: string[];
}
interface PodcastsData { generatedAt: string; count: number; episodes: Episode[] }

export function Podcast() {
  const [data, setData] = useState<PodcastsData | null>(null);
  useEffect(() => {
    fetch("/data/podcasts.json").then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => setData({ generatedAt: "", count: 0, episodes: [] }));
  }, []);

  const episodes = data?.episodes ?? [];

  return (
    <>
      <main className="page radar-page">
        <header className="radar-header">
          <h1 className="radar-title">播客洞见</h1>
          <p className="radar-subtitle">播客是消费成本最高的内容——一两小时、音频、不能扫读。这一栏把它蒸馏成你能刷的洞见：脉络 + 带时间戳的核心观点 + 金句 + 值不值得听。转录稿只当内部证据。</p>
        </header>

        {episodes.length > 0 && (
          <>
            <div className="paper-sec"><h2>最新蒸馏 <span className="paper-sec-n">{episodes.length}</span></h2><em>一两小时 → 一页洞见</em></div>
            <div className="radar-grid">
              {episodes.map((e) => (
                <div className="radar-card paper-card" key={e.slug}>
                  <Link className="radar-card-cover" href={`/podcast/${encodeURIComponent(e.slug)}`} aria-label={e.title} />
                  <div className="radar-card-top">
                    <div className="paper-card-badges">
                      {e.source && <span className="paper-cat">{e.source}</span>}
                      {e.lang && <span className="paper-rel">{e.lang}</span>}
                    </div>
                    {e.duration && <span className="pod-dur">{e.duration}</span>}
                  </div>
                  <h3 className="radar-name paper-name">{e.title}</h3>
                  {e.guest && <div className="pod-guest">嘉宾 · {e.guest}</div>}
                  {e.tldr && <p className="radar-summary">{e.tldr}</p>}
                  <div className="radar-foot">
                    <div className="radar-meta" />
                    <span className="radar-foot-right">
                      {e.url && <a className="radar-repo-link" href={e.url} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()}>▶ 原片</a>}
                      <span className="radar-cta deep">看洞见 →</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </main>
    </>
  );
}
