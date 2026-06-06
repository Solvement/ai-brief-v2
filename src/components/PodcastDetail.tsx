"use client";
import { useEffect, useState } from "react";
import { MarkdownRich } from "./MarkdownRich";

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
  confidence?: string;
  pipeline?: string;
  body: string;
}

export function PodcastDetail({ slug }: { slug: string }) {
  const [ep, setEp] = useState<Episode | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    fetch("/data/podcasts.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const found = (d.episodes || []).find((e: Episode) => e.slug === slug) || null;
        setEp(found);
        setState(found ? "ok" : "missing");
      })
      .catch(() => setState("missing"));
  }, [slug]);

  // strip the leading H1 (title shown in the header instead)
  const body = ep ? ep.body.replace(/^\s*#\s+.*\n+/, "") : "";

  return (
    <>
      <main className="page detail pod-detail">
        <div className="breadcrumb"><a href="/podcast">← 播客</a></div>
        {state === "loading" && <div className="loading">正在加载…</div>}
        {state === "missing" && <div className="notice">没找到这期播客洞见。</div>}
        {ep && (
          <>
            <header className="pod-detail-head">
              <div className="pod-detail-meta">
                {ep.source && <span className="paper-cat">{ep.source}</span>}
                {ep.lang && <span className="paper-rel">{ep.lang}</span>}
                {ep.duration && <span className="pod-dur">{ep.duration}</span>}
                {ep.confidence && <span className="pod-conf">{ep.confidence}</span>}
              </div>
              <h1>{ep.title}</h1>
              {ep.guest && <div className="pod-guest">嘉宾 · {ep.guest}{ep.topic ? ` · ${ep.topic}` : ""}</div>}
              {ep.tldr && <p className="pod-tldr">{ep.tldr}</p>}
              {ep.url && <a className="pod-listen" href={ep.url} target="_blank" rel="noreferrer">▶ 听原片</a>}
            </header>

            {ep.verdict && (
              <div className="pod-verdict"><b>值不值得听</b>{ep.verdict}</div>
            )}

            <article className="pd-prose pod-body">
              <MarkdownRich source={body} />
            </article>

            <p className="pod-foot">{ep.pipeline ? `来源管线：${ep.pipeline}` : ""}{ep.ingested ? ` · 整理于 ${ep.ingested}` : ""}</p>
          </>
        )}
      </main>
    </>
  );
}
