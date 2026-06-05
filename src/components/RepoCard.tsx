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
/** Tier → label per the project-radar tier paradigm. */
const TIER_LABEL: Record<number, string> = { 3: "深扒", 2: "分析", 1: "速读", 0: "索引" };
const TIER_CLS: Record<number, string> = { 3: "depth-deep", 2: "depth-analysis", 1: "depth-light", 0: "depth-list" };
const DEPTH_CLS: Record<ProjectDepth, string> = {
  deep: "depth-deep",
  analysis: "depth-analysis",
  light: "depth-light",
  list_only: "depth-list",
  needs_enrichment: "depth-needs",
};
/** Action verdict → visual annotation chip. Strength tiers drive the color. */
const ACTION_LABEL: Record<string, string> = {
  ignore: "忽略", monitor: "观望", try: "可一试", analyze: "值得分析",
  deep_dive: "值得深扒", clone_and_run: "克隆来跑", extract: "提炼复用",
};
const ACTION_STRONG = new Set(["deep_dive", "clone_and_run", "extract", "analyze"]);

function depthOf(repo: AnalyzedRepo): ProjectDepth {
  return repo.final_depth || (repo.deep ? "deep" : "list_only");
}
function slugOf(repo: AnalyzedRepo): string {
  return repo.briefSlug || repo.brief_slug || "";
}

/** ranking_score may be 0-100 OR 0-5; worthDeepDive is 0-100. Display the raw number. */
function displayScore(score: number): string {
  if (!Number.isFinite(score)) return "—";
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

/** Hide a failed avatar so the gradient fallback underneath shows instead of a broken icon. */
function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.visibility = "hidden";
}

interface Props { repo: AnalyzedRepo; featured?: boolean }

export function RepoCard({ repo }: Props) {
  const depth = depthOf(repo);
  const slug = slugOf(repo);
  const score = typeof repo.ranking_score === "number" ? repo.ranking_score : repo.worthDeepDive;
  const summary = repo.tier_template?.one_sentence_positioning || repo.tldr || repo.light || repo.description || "";

  // Tier paradigm (2026-06-03): tier drives the badge; depth is the legacy fallback.
  const tier = typeof repo.project_tier === "number" ? repo.project_tier : null;
  const bucket = repo.project_bucket || repo.bucket || repo.tier_template?.bucket || "";
  const tierLabel = tier !== null ? TIER_LABEL[tier] : DEPTH_LABEL[depth];
  const tierCls = tier !== null ? TIER_CLS[tier] : DEPTH_CLS[depth];
  // Prefer the canonical [Tier X｜桶] tag; fall back to a reconstructed label.
  const canonicalTag = repo.tier_tag || repo.tier_template?.tag || "";
  const tierTag = canonicalTag.trim()
    ? canonicalTag
    : `${tier !== null ? `Tier ${tier}` : tierLabel}${bucket ? `｜${bucket}` : ""}`;
  // Tier 0 = 索引 (muted, list-only). Tier 1 = 速读. Tier 2/3 link to a deep-dive page.
  const isIndex = tier === 0 || (tier === null && (depth === "list_only" || depth === "light"));
  const hasBrief = !isIndex && (tier === 2 || tier === 3 || depth === "deep" || depth === "analysis") && Boolean(slug);
  const manualConfirm = repo.requires_manual_confirmation || repo.tier_template?.manual_confirmation;

  const action = repo.recommended_action ? (ACTION_LABEL[repo.recommended_action] || repo.recommended_action) : null;
  const actionStrong = repo.recommended_action ? ACTION_STRONG.has(repo.recommended_action) : false;
  const gained = Number(repo.starsGained) || 0;

  // Uniform card — every repo gets the same shape/size. Visual texture comes from the
  // tier-tinted avatar ring, the owner/name path, and annotation chips (NOT screenshots).
  const inner = (
    <>
      <div className="radar-card-top">
        <span className={`radar-avatar-ring ${tierCls}`}>
          <img className="radar-avatar" src={repo.ownerAvatarUrl} alt={repo.owner} loading="lazy" onError={hideOnError} />
        </span>
        <div className="radar-score-wrap" title={`ranking ${score}`}>
          {Number.isFinite(score) && score > 0 && <span className="radar-score">{displayScore(score)}</span>}
          <span className={`radar-tier ${tierCls}`}>{tierTag}</span>
        </div>
      </div>

      <div className="radar-card-head">
        <h3 className="radar-name">
          <span className="radar-owner-seg">{repo.owner}</span>
          <span className="radar-path-sep">/</span>
          {repo.name || repo.fullName}
        </h3>
        {manualConfirm && <span className="radar-manual">需人工确认</span>}
      </div>

      {summary && <p className="radar-summary">{summary}</p>}

      {repo.tags?.length > 0 && !isIndex && (
        <div className="radar-tags">
          {repo.tags.slice(0, 4).map((t) => <span className="radar-tag" key={t}>{t}</span>)}
        </div>
      )}

      <div className="radar-foot">
        <div className="radar-meta">
          <span className="radar-meta-item">★ {fmt(repo.stars)}</span>
          {gained > 0 && <span className="radar-meta-item radar-gained">+{fmt(gained)}</span>}
          {repo.language && (
            <span className="radar-meta-item">
              <span className="radar-lang-dot" style={{ background: repo.languageColor || "var(--radar-line-strong)" }} />
              {repo.language}
            </span>
          )}
        </div>
        <span className="radar-foot-right">
          {action && <span className={`radar-action ${actionStrong ? "strong" : ""}`}>{action}</span>}
          {repo.url && (
            <a className="radar-repo-link" href={repo.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              仓库 ↗
            </a>
          )}
          <span className="radar-cta deep">{hasBrief ? `${tierLabel} →` : "看分析 →"}</span>
        </span>
      </div>
    </>
  );

  const cls = `radar-card ${tierCls}${hasBrief ? " has-brief" : ""}${isIndex ? " radar-card--index" : ""}`;
  // Card always links to an ANALYSIS page: brief-wiki if generated, else the universal
  // per-repo Detail (/repo/owner/name). The original repo is a SEPARATE footer link.
  const repoName = repo.name || (repo.fullName || "").split("/").slice(1).join("/");
  const analysisHref = hasBrief
    ? `/brief/${encodeURIComponent(slug)}`
    : `/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repoName)}`;

  return (
    <div className={cls}>
      <Link className="radar-card-cover" href={analysisHref} aria-label={`${repo.fullName} 分析`} />
      {inner}
    </div>
  );
}
