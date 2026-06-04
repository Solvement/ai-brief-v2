"use client";
import { useState } from "react";
import { SiteHeader } from "./SiteHeader";
import { MarkdownRich } from "./MarkdownRich";

interface PaperMeta {
  paper_id: string;
  arxiv_id: string;
  title: string;
  authors?: string[];
  date?: string;
  huggingface_url?: string;
  paper_url?: string;
  code_url?: string;
  source_rankings?: string[];
  tags?: string[];
  scores?: Record<string, number>;
  one_sentence_judgment?: string;
}

const SCORE_LABEL: Record<string, string> = {
  idea_novelty: "想法新颖",
  system_design_value: "系统设计",
  career_value: "职业价值",
  autosci_reuse_value: "AutoSci 复用",
  buildability: "可造性",
  evaluation_value: "评测价值",
  breadth_value: "拓宽视野",
  evidence_quality: "证据质量",
};

type Tab = "paper" | "career";

export function PaperDeepDive({ meta, paper, career }: { meta: PaperMeta; paper: string; career: string }) {
  const [tab, setTab] = useState<Tab>("paper");
  const scores = meta.scores || {};

  return (
    <>
      <SiteHeader active="articles" />
      <main className="page pd-page">
        <a className="pd-back" href="/articles">← 论文</a>

        <header className="pd-header">
          <div className="pd-kicker">
            {meta.arxiv_id && <span className="pd-id">arXiv {meta.arxiv_id}</span>}
            {(meta.source_rankings || []).map((r) => <span className="pd-rank" key={r}>{r === "weekly" ? "周榜" : r === "monthly" ? "月榜" : r === "daily" ? "日榜" : r}</span>)}
            {meta.date && <span className="pd-date">{meta.date}</span>}
          </div>
          <h1 className="pd-title">{meta.title}</h1>
          {meta.authors?.length ? <p className="pd-authors">{meta.authors.join(" · ")}</p> : null}

          <div className="pd-links">
            {meta.paper_url && <a href={meta.paper_url} target="_blank" rel="noreferrer">arXiv ↗</a>}
            {meta.huggingface_url && <a href={meta.huggingface_url} target="_blank" rel="noreferrer">HF ↗</a>}
            {meta.code_url && <a href={meta.code_url} target="_blank" rel="noreferrer">Code ↗</a>}
          </div>

          {meta.one_sentence_judgment && <p className="pd-judgment">{meta.one_sentence_judgment}</p>}

          {Object.keys(scores).length > 0 && (
            <div className="pd-scores">
              {Object.entries(scores).map(([k, v]) => (
                <span className="pd-score" key={k}>
                  <b>{v}</b>{SCORE_LABEL[k] || k}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="pd-tabs" role="tablist">
          <button className={`pd-tab${tab === "paper" ? " active" : ""}`} onClick={() => setTab("paper")} role="tab" aria-selected={tab === "paper"}>论文</button>
          <button className={`pd-tab${tab === "career" ? " active" : ""}`} onClick={() => setTab("career")} role="tab" aria-selected={tab === "career"}>职业</button>
        </div>

        <article className="pd-body">
          {tab === "paper" ? <MarkdownRich source={paper} /> : <MarkdownRich source={career} />}
        </article>
      </main>
    </>
  );
}
