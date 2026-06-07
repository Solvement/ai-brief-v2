"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "./AppShell";
import { loadPapersIndex, type PapersIndex } from "../lib/data";
import type { HomeRepo } from "../lib/home";

// Home is deliberately ONE simple screen: today's must-read + a plain name list of
// today's papers and projects. Everything else lives in the left-nav columns.
interface HomeProps {
  initialPapers?: PapersIndex | null;
  // Pre-selected (≤8) slim projects from the server, so the full ~720KB
  // trending.json never enters the client payload. See src/lib/home.ts.
  initialProjects?: HomeRepo[] | null;
}

/** YYYY-MM-DD → 「2026 年 6 月 6 日」; falls back to the raw string. */
function zhDate(d?: string): string {
  if (!d) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  return m ? `${Number(m[1])} 年 ${Number(m[2])} 月 ${Number(m[3])} 日` : d;
}

const newest = (a: { first_seen_date?: string; date: string }, b: { first_seen_date?: string; date: string }) =>
  String(b.first_seen_date || b.date).localeCompare(String(a.first_seen_date || a.date));

export function HomePage({ initialPapers = null, initialProjects = null }: HomeProps) {
  const [papers, setPapers] = useState<PapersIndex | null>(initialPapers);

  useEffect(() => {
    if (!initialPapers) loadPapersIndex().then(setPapers).catch(() => {});
  }, [initialPapers]);

  const deepReads = useMemo(() => papers?.deepReads ?? [], [papers]);
  const candidates = papers?.deepCandidates ?? [];

  const mustRead = useMemo(() => {
    if (!deepReads.length) return null;
    return deepReads.find((d) => d.must_read) || [...deepReads].sort(newest)[0];
  }, [deepReads]);

  const recentDeep = useMemo(
    () => [...deepReads].filter((d) => !mustRead || d.slug !== mustRead.slug).sort(newest).slice(0, 5),
    [deepReads, mustRead],
  );

  // Already selected + slimmed server-side (src/lib/home.ts); render as-is.
  const projects = initialProjects ?? [];

  const todayZh = zhDate(papers?.date);

  return (
    <AppShell active="home">
      <main className="home-simple">
        <header className="home-simple-head">
          <p className="home-simple-kicker">AI Brief{todayZh ? ` · ${todayZh}` : ""}</p>
          <h1>今日必读</h1>
          <p className="home-simple-sub">挑过的一版。点名字进去看；要全量去左边各栏。</p>
        </header>

        {mustRead && (
          <Link className="home-feature" href={`/papers/${mustRead.slug}`}>
            <span className="home-feature-tag">当日必读</span>
            <strong className="home-feature-title">{mustRead.title}</strong>
            {mustRead.one_sentence_judgment ? <p className="home-feature-line">{mustRead.one_sentence_judgment}</p> : null}
          </Link>
        )}

        <div className="home-simple-cols">
          <section className="home-simple-col">
            <div className="home-simple-colhead"><h2>今日论文</h2><Link href="/articles">全部 →</Link></div>
            <ul className="home-namelist">
              {candidates.map((c) => (
                <li key={c.arxiv_id}>
                  {c.deep_slug
                    ? <Link href={`/papers/${c.deep_slug}`}>{c.title}</Link>
                    : <a href={`https://huggingface.co/papers/${c.arxiv_id}`} target="_blank" rel="noreferrer">{c.title}</a>}
                  <span className="home-name-tag">{c.deep_slug ? "深读" : "HF 精选"}</span>
                </li>
              ))}
              {recentDeep.map((d) => (
                <li key={d.slug}>
                  <Link href={`/papers/${d.slug}`}>{d.title}</Link>
                  <span className="home-name-tag">深读</span>
                </li>
              ))}
              {candidates.length === 0 && recentDeep.length === 0 ? <li className="home-name-empty">今日暂无</li> : null}
            </ul>
          </section>

          <section className="home-simple-col">
            <div className="home-simple-colhead"><h2>今日项目</h2><Link href="/projects">全部 →</Link></div>
            <ul className="home-namelist">
              {projects.map((r) => {
                const slug = r.briefSlug || r.brief_slug;
                const href = slug ? `/brief/${slug}` : r.url;
                const stars = Intl.NumberFormat("en", { notation: "compact" }).format(r.stars || 0);
                const isDeep = r.final_depth === "deep" || r.project_tier === 3;
                return (
                  <li key={r.fullName}>
                    {href.startsWith("/")
                      ? <Link href={href}>{r.fullName}</Link>
                      : <a href={href} target="_blank" rel="noreferrer">{r.fullName}</a>}
                    <span className="home-name-tag">{isDeep ? "深读 · " : ""}★ {stars}</span>
                  </li>
                );
              })}
              {projects.length === 0 ? <li className="home-name-empty">今日暂无</li> : null}
            </ul>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
