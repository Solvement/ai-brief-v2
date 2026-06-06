"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { loadPapersIndex, type PapersIndex } from "../lib/data";

type Win = "daily" | "weekly" | "monthly";
type Mode = "curated" | "board";
const WIN_LABEL: Record<Win, string> = { daily: "日榜", weekly: "周榜", monthly: "月榜" };
const REL_LABEL: Record<string, string> = { direct: "AutoSci 直接", indirect: "AutoSci 间接", inspiration: "AutoSci 启发", none: "" };

function thumbUrl(arxivId: string) {
  return arxivId ? `https://cdn-thumbnails.huggingface.co/social-thumbnails/papers/${arxivId}.png` : "";
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  if (!src) return <div className="paper-thumb paper-thumb--empty" />;
  return (
    <div className="paper-thumb">
      <Image src={src} alt={alt} fill sizes="320px" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
    </div>
  );
}

/** One clean paper card — same chrome/palette as the project radar cards. */
function PaperCard({
  href, external, score, category, rel, pending, title, line, foot, ctaLabel, hfHref,
}: {
  href: string; external?: boolean; score?: number | string; category?: string; rel?: string;
  pending?: boolean; title: string; line?: string; foot?: React.ReactNode; ctaLabel: string; hfHref?: string;
}) {
  const inner = (
    <>
      <div className="radar-card-top">
        <div className="paper-card-badges">
          {score != null && score !== "" && <span className="radar-score">{score}</span>}
          {category && <span className="paper-cat">{category}</span>}
        </div>
        {rel && REL_LABEL[rel] && <span className="paper-rel">{REL_LABEL[rel]}</span>}
        {pending && <span className="paper-pending">待深读</span>}
      </div>
      <h3 className="radar-name paper-name">{title}</h3>
      {line && <p className="radar-summary">{line}</p>}
      <div className="radar-foot">
        <div className="radar-meta">{foot}</div>
        <span className="radar-foot-right">
          {hfHref && (
            <a className="radar-repo-link" href={hfHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>HF ↗</a>
          )}
          <span className="radar-cta deep">{ctaLabel}</span>
        </span>
      </div>
    </>
  );
  if (external) {
    return <a className="radar-card paper-card" href={href} target="_blank" rel="noreferrer">{inner}</a>;
  }
  return (
    <div className="radar-card paper-card">
      <Link className="radar-card-cover" href={href} aria-label={title} />
      {inner}
    </div>
  );
}

function SecHead({ label, n, hint }: { label: string; n: number; hint: string }) {
  return (
    <div className="paper-sec">
      <h2>{label} <span className="paper-sec-n">{n}</span></h2>
      <em>{hint}</em>
    </div>
  );
}

export function PapersPage() {
  const [data, setData] = useState<PapersIndex | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("curated");
  const [win, setWin] = useState<Win>("daily");
  const [limit, setLimit] = useState(18);

  useEffect(() => { loadPapersIndex().then(setData).catch((e) => setErr(e?.message || String(e))); }, []);
  useEffect(() => { setLimit(18); }, [win]);

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

  if (err) return (<><main className="page"><div className="notice error">加载论文数据失败：{err}</div></main></>);
  if (!data) return (<><main className="page radar-page"><div className="loading">正在加载论文…</div></main></>);

  const deepSlugByArxiv = new Map(data.deepReads.map((d) => [d.arxiv_id, d.slug]));
  const board = data.board[win] || [];
  const boardShown = board.slice(0, limit);

  return (
    <>
      <main className="page radar-page">
        <header className="radar-header">
          <h1 className="radar-title">文章雷达</h1>
          <p className="radar-subtitle">HuggingFace 日 / 周 / 月榜的高赞论文 → 机器之心式解读。每天精读 1-3 篇值得读全文的，其余按主题扫想法即可。</p>
        </header>

        <div className="radar-filters">
          <div className="radar-chip-group">
            <button className={`radar-chip${mode === "curated" ? " active" : ""}`} onClick={() => setMode("curated")}>精选</button>
            <button className={`radar-chip${mode === "board" ? " active" : ""}`} onClick={() => setMode("board")}>HF 全榜</button>
          </div>
          {mode === "board" && (
            <div className="radar-chip-group">
              {(["daily", "weekly", "monthly"] as Win[]).map((w) => (
                <button key={w} className={`radar-chip${win === w ? " active" : ""}`} onClick={() => setWin(w)}>
                  {WIN_LABEL[w]}<span className="radar-chip-count">{data.board[w].length}</span>
                </button>
              ))}
            </div>
          )}
          <div className="radar-chip-group radar-chip-group-right">
            <span className="radar-chip radar-chip-static">{data.counts.deepReads} 已深读</span>
          </div>
        </div>

        {mode === "curated" ? (
          <>
            <SecHead label="今日精读" n={data.deepCandidates.length} hint="值得读全文" />
            {data.deepCandidates.length === 0 ? <div className="notice">今日无高赞新论文，精读空。</div> : (
              <div className="radar-grid">
                {data.deepCandidates.map((c) => {
                  const slug = c.deep_slug || deepSlugByArxiv.get(c.arxiv_id) || null;
                  return (
                    <PaperCard
                      key={c.arxiv_id}
                      href={slug ? `/papers/${encodeURIComponent(slug)}` : `https://huggingface.co/papers/${c.arxiv_id}`}
                      external={!slug}
                      score={c.final_score}
                      category={c.category}
                      rel={c.autosci_relevance}
                      pending={!slug}
                      title={c.title}
                      line={c.one_line}
                      ctaLabel={slug ? "深读 →" : "看论文 →"}
                      hfHref={`https://huggingface.co/papers/${c.arxiv_id}`}
                    />
                  );
                })}
              </div>
            )}

            <SecHead label="想法雷达 · 按主题" n={data.counts.radar} hint="扫想法即可，不必深读" />
            {data.radarEmpty || radarGroups.length === 0 ? <div className="notice">今日雷达空。</div> : (
              radarGroups.map(([cat, items]) => (
                <div className="paper-catgroup" key={cat} id={`cat-${cat}`}>
                  <div className="paper-cat-h">{cat} <span>{items.length}</span></div>
                  <div className="radar-grid">
                    {items.map((r) => {
                      const slug = r.deep_slug || deepSlugByArxiv.get(r.arxiv_id) || null;
                      return (
                        <PaperCard
                          key={r.arxiv_id}
                          href={slug ? `/papers/${encodeURIComponent(slug)}` : `https://huggingface.co/papers/${r.arxiv_id}`}
                          external={!slug}
                          score={r.final_score}
                          category={r.category}
                          title={r.title}
                          line={r.one_line}
                          ctaLabel={slug ? "深读 →" : "看论文 →"}
                          hfHref={`https://huggingface.co/papers/${r.arxiv_id}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <SecHead label={`${WIN_LABEL[win]} · HF 全榜`} n={board.length} hint="原始榜单，未分类" />
            <div className="radar-grid">
              {boardShown.map((b, i) => (
                <a key={b.arxiv_id} className="radar-card paper-card paper-card-board" href={b.hf_paper_url} target="_blank" rel="noreferrer">
                  <Thumb src={b.thumbnail_url || thumbUrl(b.arxiv_id)} alt={b.title} />
                  <div className="radar-card-top">
                    <div className="paper-card-badges">
                      <span className="paper-rank">#{i + 1}</span>
                      <span className="radar-score">▲{b.upvotes}</span>
                    </div>
                    {b.already_done && <span className="paper-rel">已深读</span>}
                  </div>
                  <h3 className="radar-name paper-name">{b.title}</h3>
                  {b.authors.length > 0 && <p className="radar-summary paper-authors">{b.authors.join(", ")}</p>}
                  <div className="radar-foot">
                    <div className="radar-meta" />
                    <span className="radar-foot-right"><span className="radar-cta deep">看论文 →</span></span>
                  </div>
                </a>
              ))}
            </div>
            {limit < board.length && (
              <div className="paper-more"><button className="radar-more-btn" onClick={() => setLimit((l) => l + 18)}>加载更多（{board.length - limit}）</button></div>
            )}
          </>
        )}

        {data.deepReads.length > 0 && (
          <section className="paper-archive-sec">
            <div className="paper-cat-h">已深读归档 <span>{data.deepReads.length}</span></div>
            <div className="paper-archive">
              {data.deepReads.map((d) => (
                <Link key={d.slug} className="paper-archive-item" href={`/papers/${encodeURIComponent(d.slug)}`}>{d.title}</Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
