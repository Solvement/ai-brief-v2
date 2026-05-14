import type { AnalyzedRepo } from "../types";

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(n);
}
function totalScore(s: NonNullable<AnalyzedRepo["deep"]>["score"]): number {
  return s.novelty + s.engineering + s.reproducibility + s.timeToValue;
}
function scoreCls(total: number): string {
  if (total >= 80) return "good";
  if (total >= 60) return "ok";
  return "low";
}
function worthCls(w: number): string {
  if (w >= 80) return "good";
  if (w >= 60) return "ok";
  return "low";
}

interface Props { repo: AnalyzedRepo }

export function RepoCard({ repo }: Props) {
  const hasDeep = !!repo.deep;
  const detailUrl = `#/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
  const total = repo.deep ? totalScore(repo.deep.score) : 0;
  // Badge shows deep dive total if available, else the AI's worth verdict.
  const badgeValue = hasDeep ? total : repo.worthDeepDive;
  const badgeCls = hasDeep ? scoreCls(total) : worthCls(repo.worthDeepDive);

  const goDetail = () => { window.location.hash = detailUrl; };
  const onCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a.external")) return;
    goDetail();
  };

  return (
    <div
      className={`card clickable${hasDeep ? " has-deep" : ""}`}
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goDetail(); }
      }}
    >
      <div className={`score-badge ${badgeCls}`} title={hasDeep ? `综合分 ${total}/100` : `worthDeepDive ${repo.worthDeepDive}/100`}>
        {badgeValue}
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

      {repo.tags.length > 0 && (
        <div className="tag-row">
          {repo.tags.slice(0, 5).map((t) => <span className="tag" key={t}>{t}</span>)}
        </div>
      )}

      <div className="card-foot-row">
        <div className="meta-row">
          {repo.language && (
            <span>
              <span className="lang-dot" style={{ background: repo.languageColor || "var(--line-strong)" }} />
              {repo.language}
            </span>
          )}
          <span>★ {fmt(repo.stars)}</span>
          {repo.starsGained > 0 && <span className="gain">+{fmt(repo.starsGained)} ★</span>}
        </div>
        {hasDeep ? (
          <button className="deep-btn" onClick={(e) => { e.stopPropagation(); goDetail(); }}>
            Deep Dive →
          </button>
        ) : (
          <button className="read-btn" onClick={(e) => { e.stopPropagation(); goDetail(); }}>
            速读 →
          </button>
        )}
      </div>
    </div>
  );
}
