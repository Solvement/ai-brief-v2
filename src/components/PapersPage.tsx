"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { loadPapersIndex, type PapersIndex } from "../lib/data";

type Mode = "hf" | "conference";
type DeepRead = PapersIndex["deepReads"][number];
const MODE_LABEL: Record<Mode, string> = { hf: "HF 精读", conference: "顶会最佳" };
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
            <a className="radar-repo-link" href={hfHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{external ? "HF ↗" : "arXiv ↗"}</a>
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

/** A deep-read rendered as a card (shared by HF 精读 + 顶会最佳). */
function DeepCard({ d }: { d: DeepRead }) {
  return (
    <PaperCard
      href={`/papers/${encodeURIComponent(d.slug)}`}
      score={d.scores?.evidence_quality}
      category={d.tags?.[0]}
      title={d.title}
      line={d.one_sentence_judgment}
      ctaLabel="深读 →"
      hfHref={`https://arxiv.org/abs/${d.arxiv_id}`}
    />
  );
}

function dateKey(s?: string): string {
  return (s || "").split("T")[0] || "";
}
function tabLabel(key: string): string {
  if (key === "foundational") return "奠基论文";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (key === today) return "今天";
  if (key === yesterday) return "昨天";
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(key);
  return m ? `${Number(m[1])}月${Number(m[2])}日` : (key || "未知");
}

export function PapersPage() {
  const [data, setData] = useState<PapersIndex | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("hf");
  const [activeDate, setActiveDate] = useState<string>("");

  useEffect(() => { loadPapersIndex().then(setData).catch((e) => setErr(e?.message || String(e))); }, []);
  useEffect(() => { setActiveDate(""); }, [mode]); // each mode starts at its own latest day

  const track = mode === "conference" ? "conference" : "hf";

  // Deep reads for the active track, grouped by 精读日期 (first_seen_date), newest day first.
  // Like the News column: each day shows only its own reads; history sits behind date tabs.
  const groups = useMemo(() => {
    if (!data) return [] as Array<{ key: string; items: DeepRead[] }>;
    const map = new Map<string, DeepRead[]>();
    const foundational: DeepRead[] = [];
    for (const d of data.deepReads) {
      if ((d.track || "hf") !== track) continue;
      // Foundational (one-time backfilled seminal papers, e.g. MetaGPT) are NOT "a given day's
      // reads" — keep them out of the daily date tabs and behind their own 奠基 tab so the date
      // tabs reflect genuine daily curation.
      if (d.foundational) { foundational.push(d); continue; }
      const k = dateKey(d.first_seen_date || d.date) || "未知";
      (map.get(k) || map.set(k, []).get(k)!).push(d);
    }
    const dated = [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, items]) => ({ key, items }));
    if (foundational.length) dated.push({ key: "foundational", items: foundational });
    return dated;
  }, [data, track]);

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

  if (err) return (<main className="page"><div className="notice error">加载论文数据失败：{err}</div></main>);
  if (!data) return (<main className="page radar-page"><div className="loading">正在加载论文…</div></main>);

  const deepSlugByArxiv = new Map(data.deepReads.map((d) => [d.arxiv_id, d.slug]));
  const current = groups.find((g) => g.key === activeDate) || groups[0] || null;
  const isLatestDay = Boolean(current && groups[0] && current.key === groups[0].key);
  const totalDeep = groups.reduce((n, g) => n + g.items.length, 0);
  const pendingCandidates = data.deepCandidates.filter((c) => !(c.deep_slug || deepSlugByArxiv.get(c.arxiv_id)));

  // 顶会最佳: within the selected day, also group by 会议名称 (venue).
  const venueGroups = (() => {
    if (mode !== "conference" || !current) return [] as Array<[string, DeepRead[]]>;
    const m = new Map<string, DeepRead[]>();
    for (const d of current.items) {
      const v = d.venue || "其他顶会";
      (m.get(v) || m.set(v, []).get(v)!).push(d);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  })();

  const countLabel = mode === "conference" ? `${totalDeep} 篇顶会` : `${totalDeep} 篇精读`;

  return (
    <main className="page radar-page">
      <header className="radar-header">
        <h1 className="radar-title">文章</h1>
        <p className="radar-subtitle">HF 高赞论文的机器之心式精读为主线，AI 顶会最佳论文人工策展兜底。每天只看当天精读的，历史按精读日期收在标签里。</p>
      </header>

      <div className="radar-filters">
        <div className="radar-chip-group">
          {(["hf", "conference"] as Mode[]).map((m) => (
            <button key={m} className={`radar-chip${mode === m ? " active" : ""}`} onClick={() => setMode(m)}>{MODE_LABEL[m]}</button>
          ))}
        </div>
        <div className="radar-chip-group radar-chip-group-right">
          <span className="radar-chip radar-chip-static">{countLabel}</span>
        </div>
      </div>

      {groups.length === 0 ? (
          <div className="notice">{mode === "conference" ? "暂无顶会精读。" : "暂无精读。"}</div>
        ) : (
          <>
            <div className="news-datebar" role="tablist" aria-label="按精读日期切换">
              {groups.map((g) => (
                <button
                  key={g.key}
                  id={`paper-datetab-${g.key}`}
                  type="button"
                  role="tab"
                  aria-selected={current?.key === g.key}
                  aria-controls="paper-date-panel"
                  tabIndex={current?.key === g.key ? 0 : -1}
                  className={`news-datetab${current?.key === g.key ? " active" : ""}`}
                  onClick={() => setActiveDate(g.key)}
                >
                  {tabLabel(g.key)}<span className="news-datetab-n">{g.items.length}</span>
                </button>
              ))}
            </div>

            {current && (
              <div id="paper-date-panel" role="tabpanel" aria-labelledby={`paper-datetab-${current.key}`} tabIndex={0}>
                <SecHead
                  label={`${tabLabel(current.key)} · ${mode === "conference" ? "顶会精读" : "精读"}`}
                  n={current.items.length}
                  hint={mode === "conference" ? "按会议分组" : "点开读全文解读"}
                />
                {mode === "conference" ? (
                  venueGroups.map(([venue, items]) => (
                    <div className="paper-catgroup" key={venue}>
                      <div className="paper-cat-h">{venue} <span>{items.length}</span></div>
                      <div className="radar-grid">{items.map((d) => <DeepCard key={d.slug} d={d} />)}</div>
                    </div>
                  ))
                ) : (
                  <div className="radar-grid">{current.items.map((d) => <DeepCard key={d.slug} d={d} />)}</div>
                )}
              </div>
            )}

            {/* HF latest-day extras: today's selected-but-not-yet-deep-read candidates + the idea radar. */}
            {mode === "hf" && isLatestDay && pendingCandidates.length > 0 && (
              <>
                <SecHead label="今日候选 · 待深读" n={pendingCandidates.length} hint="高赞已选中，深读稍后补上" />
                <div className="radar-grid">
                  {pendingCandidates.map((c) => (
                    <PaperCard
                      key={c.arxiv_id}
                      href={`https://huggingface.co/papers/${c.arxiv_id}`}
                      external
                      score={c.final_score}
                      category={c.category}
                      rel={c.autosci_relevance}
                      pending
                      title={c.title}
                      line={c.one_line}
                      ctaLabel="看论文 →"
                      hfHref={`https://huggingface.co/papers/${c.arxiv_id}`}
                    />
                  ))}
                </div>
              </>
            )}

            {mode === "hf" && isLatestDay && !data.radarEmpty && radarGroups.length > 0 && (
              <>
                <SecHead label="想法雷达 · 按主题" n={data.counts.radar} hint="扫想法即可，不必深读" />
                {radarGroups.map(([cat, items]) => (
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
                ))}
              </>
            )}
          </>
        )}
    </main>
  );
}
