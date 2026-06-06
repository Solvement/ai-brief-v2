"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  AcademicPaperAnalysis,
  ArticlesData,
  PaperKeyResult,
  PaperReadingSection,
} from "../types";
import { loadArticles } from "../lib/data";
import { ProseMarkdown } from "../components/ProseMarkdown";

interface Props {
  paperId?: string;
}

type RefreshState = "idle" | "running" | "done" | "error";

const PT_LABEL: Record<string, string> = { survey: "综述", theory: "理论", system: "系统", benchmark: "基准", dataset: "数据集", industry_case: "工业案例", evaluation_audit: "评估/审计", tooling: "工具", position_roadmap: "立场/路线" };
const VS_LABEL: Record<string, string> = { verified: "Venue: 已核验", unverified: "Venue: not verified", not_provided: "Venue: 未提供" };
const KR_LABEL: Record<string, string> = { figure: "图", table: "表", result: "结果" };

function formatDate(iso: string): string {
  const day = (iso || "").split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day.replaceAll("-", ".");
  return iso;
}

/** Deep dives first, then most recently verified. No AI quality score — Kevin judges. */
function sortPapers(papers: AcademicPaperAnalysis[]): AcademicPaperAnalysis[] {
  return [...papers].sort((a, b) => Date.parse(b.verifiedAt || "") - Date.parse(a.verifiedAt || ""));
}

export function Articles({ paperId }: Props) {
  const [data, setData] = useState<ArticlesData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadArticles().then(setData).catch((e) => setErr(e?.message || String(e)));
  }, []);

  const paper = useMemo(() => {
    if (!data || !paperId) return null;
    return data.papers.find((item) => item.id === paperId) || null;
  }, [data, paperId]);

  const sorted = useMemo(() => {
    if (!data) return null;
    return { ...data, papers: sortPapers(data.papers) };
  }, [data]);

  if (err) {
    return (
      <>
        <main className="page"><div className="notice error">加载 Articles 数据失败：{err}</div></main>
      </>
    );
  }
  if (!data || !sorted) {
    return (
      <>
        <main className="page"><div className="loading">正在加载 Articles...</div></main>
      </>
    );
  }
  if (paperId && !paper) {
    return (
      <>
        <main className="page">
          <div className="breadcrumb"><a href="/articles">Articles</a><span className="sep">/</span><span>{paperId}</span></div>
          <div className="notice">还没有这篇论文的分析。</div>
        </main>
      </>
    );
  }
  if (paper) return <ArticleDetail paper={paper} generatedAt={sorted.generatedAt} />;
  return <ArticlesIndex data={sorted} />;
}

function ArticlesIndex({ data }: { data: ArticlesData }) {
  const [refresh, setRefresh] = useState<RefreshState>("idle");
  const [log, setLog] = useState("");
  const logRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const runStream = async (endpoint: string) => {
    if (refresh === "running") return;
    setRefresh("running");
    setLog("");
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok || !res.body) {
        if (res.status === 404) throw new Error("dev server middleware 没生效。请重启 npm run dev。");
        throw new Error("HTTP " + res.status);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        setLog(buf);
      }
      setRefresh("done");
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      setRefresh("error");
      setLog((prev) => prev + "\n[error] " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const closeLog = () => { if (refresh !== "running") { setRefresh("idle"); setLog(""); } };

  return (
    <>
      <main className="page articles-page">
        <section className="articles-intro">
          <div>
            <div className="eyebrow">Academic · 学术精读</div>
            <h1>一篇论文，机器之心式读法读完</h1>
            <p>
              选题闸门按<b> 学术信誉(顶会评奖 × 跨平台被引 × 新颖性) </b>替你把关，能进来的都值得读。点开是<b>机器之心式解读</b>：先讲清这篇要解决的<b>问题</b>，再把核心<b>结果</b>摆在最前面，列出值得关注的<b>看点</b>，最后用大白话给一段有依据的<b>带读解读</b>。
            </p>
          </div>
          <div className="article-read-model">
            <span>问题驱动</span>
            <span>结果先看</span>
            <span>看点先读</span>
            <span>带读解读</span>
          </div>
        </section>

        {data.papers.length === 0 ? (
          <div className="notice">本轮没有论文越过选题阈值（宁缺毋滥，允许空窗）。点“重跑分析”跑一次在线管线。</div>
        ) : (
          <section className="article-card-grid">
            {data.papers.map((paper) => <ArticleCard key={paper.id} paper={paper} />)}
          </section>
        )}
      </main>

      {refresh !== "idle" && (
        <div className="ingest-overlay" role="dialog" aria-modal="true">
          <div className="ingest-modal">
            <div className="ingest-head">
              <div>
                {refresh === "running" && <><span className="spinner" /> 正在运行论文管线并校验...</>}
                {refresh === "done" && <>完成，正在重新加载页面</>}
                {refresh === "error" && <>运行出错</>}
              </div>
              <button className="ingest-close" onClick={closeLog} disabled={refresh === "running"}>
                {refresh === "running" ? "请等待" : "关闭"}
              </button>
            </div>
            <pre className="ingest-log" ref={logRef}>{log || "（等待 server 响应...）"}</pre>
          </div>
        </div>
      )}
    </>
  );
}

function ArticleCard({ paper }: { paper: AcademicPaperAnalysis }) {
  const meta = paper.meta;
  const isLight = paper.tier === "light";
  const pa = paper.paradigm;
  // Result-forward: prefer the v2 one-sentence claim / hook for the lead line.
  const hook = pa?.oneSentenceClaim || paper.hook || paper.leadJudgment;
  const lookahead = pa?.lookahead?.length ? pa.lookahead : paper.lookahead;
  return (
    <a className={`article-card ${isLight ? "article-card-light" : ""}`} href={`/articles/${encodeURIComponent(paper.id)}`}>
      <div className="article-card-top">
        <div className="article-card-source">
          <span>{paper.venue || paper.sourceName}</span>
          {paper.arxivId ? <span className="muted-mono">{paper.arxivId}</span> : null}
        </div>
        <span className={`ac-tier ac-tier-${isLight ? "light" : "deep"}`}>{isLight ? "速读" : "深度解读"}</span>
      </div>
      <h2 className="article-title">{paper.title}</h2>
      <p className="article-lead">{hook}</p>
      {lookahead?.length ? (
        <ul className="article-lookahead">
          {lookahead.slice(0, 3).map((point) => <li key={point}>{point}</li>)}
        </ul>
      ) : null}
      <div className="article-card-badges">
        {!isLight && meta?.paperType ? (
          <span className="ac-type">{PT_LABEL[meta.paperType] || meta.paperType}</span>
        ) : null}
        {meta?.venueStatus ? (
          <span className={`ac-venue ac-venue-${meta.venueStatus}`}>{VS_LABEL[meta.venueStatus] || meta.venueStatus}</span>
        ) : null}
        {paper.selection?.convergence?.length ? (
          <span className="ac-converge">汇聚 {paper.selection.convergence.length} 源</span>
        ) : null}
      </div>
      {paper.selection?.track?.length ? (
        <div className="tag-row">
          {paper.selection.track.slice(0, 3).map((t) => <span className="tag" key={t}>{t}</span>)}
        </div>
      ) : null}
      <div className="article-card-foot">
        <span>{isLight ? "快速一览" : "完整解读"}</span>
        <span>核验于 {formatDate(paper.verifiedAt)}</span>
      </div>
    </a>
  );
}

function ArticleDetail({ paper, generatedAt }: { paper: AcademicPaperAnalysis; generatedAt: string }) {
  const pa = paper.paradigm;
  // v2 机器之心-style 解读: render the full prose_markdown reading page.
  if (pa?.proseMarkdown) return <PaperDetailV2 paper={paper} generatedAt={generatedAt} />;
  // Light papers without v2 prose: compact reading.
  if (paper.tier === "light") return <PaperDetailLight paper={paper} generatedAt={generatedAt} />;
  const reading = paper.originalReading || [];
  return (
    <>
      <main className="detail article-detail">
        <div className="breadcrumb">
          <a href="/articles">Articles</a><span className="sep">/</span><span>{paper.title}</span>
        </div>

        <section className="paper-hero">
          <div className="eyebrow">{paper.venue || paper.sourceName} · 学术精读</div>
          <h1>{paper.title}</h1>
          <p className="paper-lead">{paper.leadJudgment}</p>
          <div className="paper-meta-strip">
            <span>{paper.authors}</span>
            <span className="sep">·</span>
            <a href={paper.provenance?.sourceUrl || paper.sourceUrl} target="_blank" rel="noreferrer">{paper.sourceName}</a>
            <span className="sep">·</span>
            <span className="muted-mono">核验于 {formatDate(paper.verifiedAt)}</span>
            {paper.arxivId ? <><span className="sep">·</span><span className="muted-mono">{paper.arxivId}</span></> : null}
          </div>
          <div className="paper-hero-badges">
            {paper.meta?.paperType ? <span className="ac-type">{PT_LABEL[paper.meta.paperType] || paper.meta.paperType}</span> : null}
            {paper.meta?.venueStatus ? <span className={`ac-venue ac-venue-${paper.meta.venueStatus}`}>{VS_LABEL[paper.meta.venueStatus] || paper.meta.venueStatus}</span> : null}
            {paper.meta?.sourceReliability?.discoverySource ? <span className="ac-disc">发现自 {paper.meta.sourceReliability.discoverySource}</span> : null}
          </div>
          {paper.selection ? (
            <div className="paper-selection">
              {paper.selection.convergence?.length ? <EvidenceFact label="汇聚来源" body={paper.selection.convergence.join("、")} /> : null}
              {paper.selection.track?.length ? <EvidenceFact label="赛道" body={paper.selection.track.join("、")} /> : null}
              {paper.selection.ideaSignal ? <EvidenceFact label="idea 信号" body={paper.selection.ideaSignal} /> : null}
            </div>
          ) : null}
        </section>

        <div className="dd-layout">
          <div className="dd-main">
            {/* Stage 1 · 原文（忠实，先让你自己判断） */}
            <section className="reading-stage">
              <div className="stage-tag stage-tag-original">第一段 · 原文翻译总结<small>忠实复述，不含 AI 判断</small></div>
              <div className="paper-sections">
                {reading.map((section, i) => (
                  <ReadingSection key={`${section.heading}-${i}`} section={section} index={i} />
                ))}
              </div>
            </section>

            {/* 视觉分隔：原文 → AI 分析 */}
            <div className="analysis-divider" id="analyst-notes">
              <span>以下是 AI 的分析，非原文</span>
            </div>

            {/* Stage 2 · AI 分析（自由批判：依据 + 理由 + 意义） */}
            <section className="reading-stage">
              <div className="stage-tag stage-tag-analyst">第二段 · AI 深度点评<small>有依据 · 有理由 · 有意义</small></div>
              <div className="analyst-notes">
                <MarkdownLite text={paper.analystNotes || ""} />
              </div>
            </section>

            {paper.limitsAndFuture ? (
              <section className="paper-limits">
                <div className="section-kicker">局限 & 未来</div>
                {paper.limitsAndFuture.paperStated ? (
                  <div className="limit-block">
                    <span className="limit-label">论文自陈</span>
                    <p>{paper.limitsAndFuture.paperStated}</p>
                  </div>
                ) : null}
                {paper.limitsAndFuture.evidenceNotes ? (
                  <div className="limit-block">
                    <span className="limit-label">证据强弱（客观）</span>
                    <p>{paper.limitsAndFuture.evidenceNotes}</p>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="paper-provenance">
              <span>来源</span>
              <a href={paper.provenance?.sourceUrl || paper.sourceUrl} target="_blank" rel="noreferrer">
                {paper.provenance?.sourceUrl || paper.sourceUrl}
              </a>
            </section>
          </div>

          <ReadingNav sections={reading} />
        </div>
      </main>
    </>
  );
}

/* ── v2 机器之心-style paper 解读 (paradigm.proseMarkdown) ── */
function PaperDetailV2({ paper, generatedAt }: { paper: AcademicPaperAnalysis; generatedAt: string }) {
  const pa = paper.paradigm!;
  const lookahead = pa.lookahead?.length ? pa.lookahead : paper.lookahead;
  const resultBody = pa.resultFirst?.body;
  return (
    <>
      <main className="detail article-detail paper-v2">
        <div className="breadcrumb">
          <a href="/articles">Articles</a><span className="sep">/</span><span>{paper.title}</span>
        </div>

        <section className="paper-hero paper-v2-hero">
          <div className="eyebrow">{paper.venue || paper.sourceName} · 深度解读</div>
          <h1>{paper.title}</h1>
          {pa.oneSentenceClaim ? <p className="paper-lead">{pa.oneSentenceClaim}</p> : null}
          <div className="paper-meta-strip">
            <span>{paper.authors}</span>
            <span className="sep">·</span>
            <a href={paper.provenance?.sourceUrl || paper.sourceUrl} target="_blank" rel="noreferrer">{paper.sourceName}</a>
            {paper.arxivId ? <><span className="sep">·</span><span className="muted-mono">{paper.arxivId}</span></> : null}
            <span className="sep">·</span>
            <span className="muted-mono">核验于 {formatDate(paper.verifiedAt)}</span>
          </div>
          <div className="paper-hero-badges">
            {paper.meta?.paperType ? <span className="ac-type">{PT_LABEL[paper.meta.paperType] || paper.meta.paperType}</span> : null}
            {paper.meta?.venueStatus ? <span className={`ac-venue ac-venue-${paper.meta.venueStatus}`}>{VS_LABEL[paper.meta.venueStatus] || paper.meta.venueStatus}</span> : null}
          </div>
          <p className="paper-selfreport-note">📊 本页所有 benchmark 数字均为<strong>论文自报</strong>，非第三方实测。</p>
        </section>

        <div className="paper-v2-layout">
          <div className="paper-v2-main">
            {resultBody ? (
              <aside className="paper-result-first">
                <span className="paper-result-kicker">结果先看</span>
                <p>{resultBody}</p>
                {pa.resultFirst?.source_anchor ? (
                  <span className="paper-result-anchor">出处：{pa.resultFirst.source_anchor}</span>
                ) : null}
              </aside>
            ) : null}

            {lookahead?.length ? (
              <section className="paper-lookahead-box">
                <span className="paper-result-kicker">看点先读</span>
                <ul>
                  {lookahead.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </section>
            ) : null}

            <article className="paper-v2-prose">
              <ProseMarkdown text={pa.proseMarkdown!} dropLeadingH1 />
            </article>

            {pa.closingLine ? <p className="paper-closing">{pa.closingLine}</p> : null}

            <section className="paper-provenance">
              <span>来源</span>
              <a href={paper.provenance?.sourceUrl || paper.sourceUrl} target="_blank" rel="noreferrer">
                {paper.provenance?.sourceUrl || paper.sourceUrl}
              </a>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

/* ── Light paper: compact reading (hook + 看点), no heavy detail. ── */
function PaperDetailLight({ paper, generatedAt }: { paper: AcademicPaperAnalysis; generatedAt: string }) {
  const lookahead = paper.paradigm?.lookahead?.length ? paper.paradigm.lookahead : paper.lookahead;
  return (
    <>
      <main className="detail article-detail paper-light-detail">
        <div className="breadcrumb">
          <a href="/articles">Articles</a><span className="sep">/</span><span>{paper.title}</span>
        </div>
        <section className="paper-hero">
          <div className="eyebrow">{paper.venue || paper.sourceName} · 速读</div>
          <h1>{paper.title}</h1>
          {paper.hook ? <p className="paper-lead">{paper.hook}</p> : null}
          <div className="paper-meta-strip">
            <span>{paper.authors}</span>
            <span className="sep">·</span>
            <a href={paper.provenance?.sourceUrl || paper.sourceUrl} target="_blank" rel="noreferrer">{paper.sourceName}</a>
            {paper.arxivId ? <><span className="sep">·</span><span className="muted-mono">{paper.arxivId}</span></> : null}
          </div>
        </section>
        {lookahead?.length ? (
          <section className="paper-lookahead-box">
            <span className="paper-result-kicker">看点</span>
            <ul>{lookahead.map((p) => <li key={p}>{p}</li>)}</ul>
          </section>
        ) : null}
        <section className="paper-provenance">
          <span>来源</span>
          <a href={paper.provenance?.sourceUrl || paper.sourceUrl} target="_blank" rel="noreferrer">
            {paper.provenance?.sourceUrl || paper.sourceUrl}
          </a>
        </section>
      </main>
    </>
  );
}

function ReadingNav({ sections }: { sections: PaperReadingSection[] }) {
  if (!sections || sections.length < 2) return null;
  return (
    <nav className="dd-toc" aria-label="原文目录">
      <div className="dd-toc-inner">
        <div className="dd-toc-title">精读目录</div>
        <ul>
          {sections.map((s, i) => (
            <li key={`${s.heading}-${i}`}>
              <a href={`#sec-${i}`}>
                <span className="dd-toc-dot" />
                <span className="dd-toc-label">{s.heading}</span>
                {s.keyResults?.length ? <span className="dd-toc-status">{s.keyResults.length} 图表</span> : null}
              </a>
            </li>
          ))}
          <li>
            <a href="#analyst-notes">
              <span className="dd-toc-dot dd-toc-medium" />
              <span className="dd-toc-label">AI 分析</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function ReadingSection({ section, index }: { section: PaperReadingSection; index: number }) {
  return (
    <article className="paper-section" id={`sec-${index}`} style={{ scrollMarginTop: "84px" }}>
      <h2>{section.heading}</h2>
      <p className="section-summary">{section.summary}</p>
      {section.keyResults?.length ? (
        <div className="key-results">
          {section.keyResults.map((kr, i) => <KeyResultRow key={i} kr={kr} />)}
        </div>
      ) : null}
    </article>
  );
}

function KeyResultRow({ kr }: { kr: PaperKeyResult }) {
  return (
    <div className="key-result">
      <span className={`kr-tag kr-${kr.kind}`}>{KR_LABEL[kr.kind] || kr.kind}</span>
      <b className="kr-ref">{kr.ref}</b>
      <p className="kr-finding">{kr.finding}</p>
    </div>
  );
}

/** Minimal markdown: paragraph splitting + **bold** + leading "- " bullets. No raw HTML. */
function MarkdownLite({ text }: { text: string }) {
  const blocks = String(text || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
        const isList = lines.length > 1 && lines.every((l) => /^[-*•]\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} className="an-list">
              {lines.map((l, j) => <li key={j}>{renderInline(l.replace(/^[-*•]\s+/, ""))}</li>)}
            </ul>
          );
        }
        const heading = block.match(/^#{1,4}\s+(.*)$/);
        if (heading) return <h3 key={i} className="an-h">{renderInline(heading[1])}</h3>;
        return <p key={i}>{renderInline(block.replace(/\n/g, " "))}</p>;
      })}
    </>
  );
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={key++}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function EvidenceFact({ label, body }: { label: string; body: string }) {
  return (
    <div className="evidence-fact">
      <span>{label}</span>
      <p>{body}</p>
    </div>
  );
}
