"use client";
import Link from "next/link";
import type { AnalyzedRepo, ProjectDepth } from "../types";

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(n);
}

const DEPTH_LABEL: Record<ProjectDepth, string> = {
  deep: "深扒",
  analysis: "分析",
  light: "速读",
  list_only: "雷达",
  needs_enrichment: "待补全",
};
const DEPTH_CLS: Record<ProjectDepth, string> = {
  deep: "depth-deep",
  analysis: "depth-analysis",
  light: "depth-light",
  list_only: "depth-list",
  needs_enrichment: "depth-needs",
};
const ACTION_LABEL: Record<string, string> = {
  ignore: "忽略", monitor: "观望", try: "可一试", analyze: "值得分析",
  deep_dive: "值得深扒", clone_and_run: "克隆来跑", extract: "提炼复用",
};

function depthOf(repo: AnalyzedRepo): ProjectDepth {
  return repo.final_depth || (repo.deep ? "deep" : "list_only");
}
function slugOf(repo: AnalyzedRepo): string {
  return repo.briefSlug || repo.brief_slug || "";
}
function firstSentence(text: string): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  const m = t.match(/^(.+?[。！？.!?])\s*/);
  const s = m ? m[1] : t;
  return s.length > 92 ? s.slice(0, 90) + "…" : s;
}

interface Props { repo: AnalyzedRepo }

export function RepoCard({ repo }: Props) {
  const depth = depthOf(repo);
  const slug = slugOf(repo);
  const hasBrief = (depth === "deep" || depth === "analysis") && Boolean(slug);
  const score = typeof repo.ranking_score === "number" ? repo.ranking_score : repo.worthDeepDive;
  const action = repo.recommended_action ? (ACTION_LABEL[repo.recommended_action] || repo.recommended_action) : null;
  const whyNot = !hasBrief ? (repo.rejection_reasons?.[0] || (repo.needs_enrichment ? "证据不足，待补全后再判" : "")) : "";

  const inner = (
    <>
      <div className={`depth-badge ${DEPTH_CLS[depth]}`} title={`ranking ${score}`}>
        <span>{DEPTH_LABEL[depth]}</span>
        <b>{score}</b>
      </div>

      <div className="card-row">
        <img className="avatar" src={repo.ownerAvatarUrl} alt={repo.owner} loading="lazy" />
        <div className="card-title-row">
          <div className="rank-row">
            <span className="rank">#{repo.rank}</span>
            <span className="repo-name">{repo.fullName}</span>
          </div>
          {repo.tldr && <p className="tldr">{repo.tldr}</p>}
        </div>
      </div>

      {repo.tags?.length > 0 && (
        <div className="tag-row">{repo.tags.slice(0, 5).map((t) => <span className="tag" key={t}>{t}</span>)}</div>
      )}

      <div className="repo-decision-grid">
        <div><span>为什么重要</span><b>{firstSentence(repo.deep?.atGlance || repo.light || repo.description || "")}</b></div>
        {action && <div><span>建议动作</span><b>{action}</b></div>}
        {whyNot && <div><span>为何未深扒</span><b>{whyNot}</b></div>}
      </div>

      <div className="card-foot-row">
        <div className="meta-row">
          {repo.language && (
            <span><span className="lang-dot" style={{ background: repo.languageColor || "var(--line-strong)" }} />{repo.language}</span>
          )}
          <span>★ {fmt(repo.stars)}</span>
          {repo.starsGained > 0 && <span className="gain">+{fmt(repo.starsGained)} ★</span>}
        </div>
        <span className={`repo-cta ${hasBrief ? "deep" : ""}`}>
          {hasBrief ? `${DEPTH_LABEL[depth]} →` : "看仓库 →"}
        </span>
      </div>
    </>
  );

  if (hasBrief) {
    return <Link className={`card clickable has-deep ${DEPTH_CLS[depth]}`} href={`/brief/${encodeURIComponent(slug)}`}>{inner}</Link>;
  }
  return (
    <a className={`card clickable ${DEPTH_CLS[depth]}`} href={repo.url} target="_blank" rel="noreferrer">{inner}</a>
  );
}
