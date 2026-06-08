"use client";
import { useState } from "react";
import { MarkdownRich } from "./MarkdownRich";
import { FeedbackWidget } from "./FeedbackWidget";

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
  track?: string;
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

/** Remove footnote markers `[^x]` and their `[^x]: …` definition block from the
 *  rendered text. The source .mdx keeps footnotes for provenance/AutoSci — this
 *  only declutters the reading page (Kevin: the 来源 section is noise). */
function stripFootnotes(md: string): string {
  return md
    .replace(/^\[\^[^\]]+\]:.*(?:\n(?!\[\^|#|\S).*)*$/gm, "") // definition lines (+ wrapped continuations)
    .replace(/\[\^[^\]]+\]/g, "")                              // inline refs
    .replace(/[ \t]+\n/g, "\n")                                // trailing spaces left behind
    .replace(/\n{3,}/g, "\n\n")                                // collapse blank runs
    .trimEnd();
}

export function PaperDeepDive({ meta, paper, career }: { meta: PaperMeta; paper: string; career: string }) {
  const [tab, setTab] = useState<Tab>("paper");
  const scores = meta.scores || {};
  // Strip footnote refs + definitions from the rendered page (Kevin: the 来源 section is noise);
  // the source .mdx keeps them for provenance/AutoSci.
  const source = stripFootnotes(tab === "paper" ? paper : career);
  // Fold the deep "技术细节(选读)" read-on layer by default (progressive disclosure).
  const foldHeading = tab === "paper" ? "技术细节" : undefined;

  return (
    <>
      <main className="page pd-page pd-page--full">
        <a className="pd-back" href="/articles">← 文章</a>

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

        <div className="pd-tabs" role="tablist" aria-label="解读视角">
          <button id="pd-tab-paper" type="button" className={`pd-tab${tab === "paper" ? " active" : ""}`} onClick={() => setTab("paper")} role="tab" aria-selected={tab === "paper"} aria-controls="pd-panel" tabIndex={tab === "paper" ? 0 : -1}>论文</button>
          <button id="pd-tab-career" type="button" className={`pd-tab${tab === "career" ? " active" : ""}`} onClick={() => setTab("career")} role="tab" aria-selected={tab === "career"} aria-controls="pd-panel" tabIndex={tab === "career" ? 0 : -1}>职业</button>
        </div>

        <div className="pd-body" id="pd-panel" role="tabpanel" aria-labelledby={`pd-tab-${tab}`} tabIndex={0}>
          <article className="pd-article">
            <MarkdownRich source={source} collapsibleHeading={foldHeading} />
          </article>
        </div>

        <FeedbackWidget itemType="paper" itemId={meta.arxiv_id} itemTitle={meta.title} />
      </main>
    </>
  );
}
