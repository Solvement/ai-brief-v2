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
function firstSentence(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  const match = trimmed.match(/^(.+?[。！？.!?])\s*/);
  const sentence = match ? match[1] : trimmed;
  return sentence.length > 92 ? sentence.slice(0, 90) + "…" : sentence;
}
function audienceHint(repo: AnalyzedRepo): string {
  if (repo.tags.length > 0) return `你在关注 ${repo.tags.slice(0, 2).join(" / ")}`;
  if (repo.language) return `你想找 ${repo.language} 项目练手`;
  return "你想快速判断一个新项目值不值得试";
}
function actionHint(repo: AnalyzedRepo): string {
  if (repo.deep) return "打开 Deep Dive，先看 Overview 和 Try it";
  if (repo.worthDeepDive >= 60) return "先速读，再决定是否深挖";
  return "速读即可，暂时不必投入太久";
}

interface Props { repo: AnalyzedRepo }

export function RepoCard({ repo }: Props) {
  const hasDeep = !!repo.deep;
  const detailUrl = `#/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
  const total = repo.deep ? totalScore(repo.deep.score) : 0;
  // Badge shows deep dive total if available, else the AI's worth verdict.
  const badgeValue = hasDeep ? total : repo.worthDeepDive;
  const badgeCls = hasDeep ? scoreCls(total) : worthCls(repo.worthDeepDive);
  const badgeLabel = hasDeep ? "总分" : "价值";

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
      <div className={`score-badge labeled ${badgeCls}`} title={hasDeep ? `综合分 ${total}/100` : `worthDeepDive ${repo.worthDeepDive}/100`}>
        <span>{badgeLabel}</span>
        <b>{badgeValue}</b>
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

      <div className="repo-decision-grid">
        <div><span>为什么重要</span><b>{firstSentence(repo.deep?.atGlance || repo.light)}</b></div>
        <div><span>适合你如果</span><b>{audienceHint(repo)}</b></div>
        <div><span>建议动作</span><b>{actionHint(repo)}</b></div>
      </div>

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
