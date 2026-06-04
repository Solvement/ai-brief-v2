"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "./SiteHeader";
import { loadPapersIndex, type PapersIndex } from "../lib/data";

type Win = "daily" | "weekly" | "monthly";
type Mode = "curated" | "board";
const WIN_LABEL: Record<Win, string> = { daily: "日榜", weekly: "周榜", monthly: "月榜" };
const REL_LABEL: Record<string, string> = { direct: "AutoSci 直接", indirect: "AutoSci 间接", inspiration: "AutoSci 启发", none: "" };

function thumbUrl(arxivId: string) {
  return arxivId ? `https://cdn-thumbnails.huggingface.co/social-thumbnails/papers/${arxivId}.png` : "";
}
function Thumb({ src, alt, w = "132px" }: { src: string; alt: string; w?: string }) {
  if (!src) return <div className="pp-thumb pp-thumb--empty" style={{ width: w }} />;
  return (
    <div className="pp-thumb" style={{ width: w }}>
      <Image src={src} alt={alt} fill sizes={w} onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
    </div>
  );
}

export function PapersPage() {
  const [data, setData] = useState<PapersIndex | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("curated");
  const [win, setWin] = useState<Win>("daily");
  const [limit, setLimit] = useState(16);

  useEffect(() => { loadPapersIndex().then(setData).catch((e) => setErr(e?.message || String(e))); }, []);

  // group radar by category for the 速览-by-theme section
  const radarGroups = useMemo(() => {
    if (!data) return [] as Array<[string, PapersIndex["radar"]]>;
    const m = new Map<string, PapersIndex["radar"]>();
    for (const r of data.radar) {
      const k = r.category || "other";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [data]);

  useEffect(() => { setLimit(16); }, [win]);

  if (err) return (<><SiteHeader active="articles" /><main className="page"><div className="notice error">加载论文数据失败：{err}<br />请先运行 <code>npm run papers:hf</code> 再 <code>node scripts/columns/papers/build-index.mjs</code>。</div></main></>);
  if (!data) return (<><SiteHeader active="articles" /><main className="page"><div className="loading">正在加载论文…</div></main></>);

  const deepSlugByArxiv = new Map(data.deepReads.map((d) => [d.arxiv_id, d.slug]));
  const board = data.board[win] || [];
  const boardShown = board.slice(0, limit);

  return (
    <>
      <SiteHeader active="articles" meta={`更新于 ${data.date}`} />
      <main className="page pp2-page">
        <header className="pp2-hero">
          <div>
            <div className="pp2-eyebrow">Articles · 文章</div>
            <h1 className="pp2-title">Analysis <span className="accent">Articles</span>. Structured Thinking.</h1>
            <p className="pp2-sub">HuggingFace 日/周/月榜的高赞论文 → idea-first 策展。每天只挑 1-3 篇值得读全文，其余按主题扫想法即可，不必篇篇深读。</p>
          </div>
          <div className="pp2-stats">
            <div className="pp2-stat"><b>{data.deepCandidates.length}</b><span>今日精读</span></div>
            <div className="pp2-stat"><b>{data.counts.radar}</b><span>雷达</span></div>
            <div className="pp2-stat"><b>{data.counts.deepReads}</b><span>已深读</span></div>
          </div>
        </header>

        <div className="pp2-shell">
          <aside className="pp2-rail">
            <div className="pp2-rail-block">
              <div className="pp2-rail-h">模式</div>
              <div className="pp2-rail-chips">
                <button className={`pp2-chip${mode === "curated" ? " active" : ""}`} onClick={() => setMode("curated")}>精选(分类)</button>
                <button className={`pp2-chip${mode === "board" ? " active" : ""}`} onClick={() => setMode("board")}>HF 全榜</button>
              </div>
            </div>
            {mode === "board" && (
              <div className="pp2-rail-block">
                <div className="pp2-rail-h">榜单</div>
                <div className="pp2-rail-chips">
                  {(["daily", "weekly", "monthly"] as Win[]).map((w) => (
                    <button key={w} className={`pp2-chip${win === w ? " active" : ""}`} onClick={() => setWin(w)}>{WIN_LABEL[w]}<span>{data.board[w].length}</span></button>
                  ))}
                </div>
              </div>
            )}
            {mode === "curated" && radarGroups.length > 0 && (
              <div className="pp2-rail-block">
                <div className="pp2-rail-h">主题</div>
                <div className="pp2-rail-chips wrap">
                  {radarGroups.map(([c, items]) => <a key={c} className="pp2-chip sm" href={`#cat-${c}`}>{c}<span>{items.length}</span></a>)}
                </div>
              </div>
            )}
            <div className="pp2-rail-block">
              <div className="pp2-rail-h">已深读归档</div>
              <div className="pp2-archive">
                {data.deepReads.length === 0 ? <span className="pp2-muted">暂无</span> :
                  data.deepReads.map((d) => <Link key={d.slug} className="pp2-archive-item" href={`/papers/${encodeURIComponent(d.slug)}`}>{d.title}</Link>)}
              </div>
            </div>
          </aside>

          <section className="pp2-main">
            {mode === "curated" ? (
              <>
                <div className="pp2-section-h">今日精读 <span className="pp2-section-n">{data.deepCandidates.length}</span><em>值得读全文</em></div>
                {data.deepCandidates.length === 0 ? <div className="notice">今日无高赞新论文，精读空。</div> : (
                  <div className="pp2-grid">
                    {data.deepCandidates.map((c) => {
                      const slug = c.deep_slug || deepSlugByArxiv.get(c.arxiv_id) || null;
                      const Inner = (
                        <>
                          <Thumb src={thumbUrl(c.arxiv_id)} alt={c.title} />
                          <div className="pp2-card-body">
                            <div className="pp2-card-kicker">
                              <span className="pp2-cardscore">{c.final_score}</span>
                              {c.category && <span className="pp2-cat">{c.category}</span>}
                              {REL_LABEL[c.autosci_relevance] && <span className="pp2-rel">{REL_LABEL[c.autosci_relevance]}</span>}
                              {!slug && <span className="pp2-pending">待深读</span>}
                            </div>
                            <h3 className="pp2-card-title">{c.title}</h3>
                            {c.one_line && <p className="pp2-card-desc">{c.one_line}</p>}
                            <span className={`radar-cta${slug ? " deep" : ""}`}>{slug ? "深读 →" : "看论文 →"}</span>
                          </div>
                        </>
                      );
                      return slug
                        ? <Link key={c.arxiv_id} className="pp2-card has-deep" href={`/papers/${encodeURIComponent(slug)}`}>{Inner}</Link>
                        : <a key={c.arxiv_id} className="pp2-card" href={`https://huggingface.co/papers/${c.arxiv_id}`} target="_blank" rel="noreferrer">{Inner}</a>;
                    })}
                  </div>
                )}

                <div className="pp2-section-h" style={{ marginTop: 30 }}>想法雷达 · 按主题 <span className="pp2-section-n">{data.counts.radar}</span><em>扫想法即可，不必深读</em></div>
                {data.radarEmpty || radarGroups.length === 0 ? <div className="notice">今日雷达空。</div> : (
                  radarGroups.map(([cat, items]) => (
                    <div className="pp2-catgroup" key={cat} id={`cat-${cat}`}>
                      <div className="pp2-cat-h">{cat} <span>{items.length}</span></div>
                      <div className="pp2-radar-rows">
                        {items.map((r) => {
                          const slug = r.deep_slug || deepSlugByArxiv.get(r.arxiv_id) || null;
                          return (
                            <a key={r.arxiv_id} className="pp2-rrow" href={slug ? `/papers/${encodeURIComponent(slug)}` : `https://huggingface.co/papers/${r.arxiv_id}`} target={slug ? undefined : "_blank"} rel="noreferrer">
                              <span className="pp2-rrow-score">{r.final_score}</span>
                              <span className="pp2-rrow-main"><b>{r.title}</b>{r.one_line && <span className="pp2-rrow-line">{r.one_line}</span>}</span>
                              <span className="pp2-rrow-cta">{slug ? "深读 →" : "↗"}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              <>
                <div className="pp2-feed-head">{WIN_LABEL[win]} · HF 全榜 {board.length} 篇(原始榜单，未分类)</div>
                <div className="pp2-grid">
                  {boardShown.map((b, i) => (
                    <a key={b.arxiv_id} className="pp2-card" href={b.hf_paper_url} target="_blank" rel="noreferrer">
                      <Thumb src={b.thumbnail_url} alt={b.title} />
                      <div className="pp2-card-body">
                        <div className="pp2-card-kicker"><span className="pp2-rank">#{i + 1}</span><span className="pp2-up">▲{b.upvotes}</span>{b.already_done && <span className="pp2-deepbadge">已深读</span>}</div>
                        <h3 className="pp2-card-title">{b.title}</h3>
                        {b.authors.length > 0 && <div className="pp2-card-authors">{b.authors.join(", ")}</div>}
                        <span className="radar-cta">看论文 →</span>
                      </div>
                    </a>
                  ))}
                </div>
                {limit < board.length && <div className="pp2-more"><button className="pp2-more-btn" onClick={() => setLimit((l) => l + 16)}>加载更多 ({board.length - limit})</button></div>}
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
