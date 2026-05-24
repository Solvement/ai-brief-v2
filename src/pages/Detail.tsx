import { useEffect, useMemo, useState } from "react";
import type { AnalyzedRepo, ScoreBreakdown, TrendingData, TrendingWindow, LimitationItem, TryStep } from "../types";
import { loadTrending } from "../lib/data";
import { Markdown } from "../components/Markdown";
import { SiteHeader } from "../components/SiteHeader";

interface Props { owner: string; name: string }

const BOARD_LABEL: Record<TrendingWindow, string> = { daily: "今日榜", weekly: "本周榜", monthly: "本月榜" };

function findRepo(data: TrendingData, owner: string, name: string): { repo: AnalyzedRepo; window: TrendingWindow } | null {
  const full = `${owner}/${name}`.toLowerCase();
  for (const w of ["daily", "weekly", "monthly"] as TrendingWindow[]) {
    const r = data[w].repos.find((x) => x.fullName.toLowerCase() === full);
    if (r) return { repo: r, window: w };
  }
  return null;
}
function totalScore(s: ScoreBreakdown): number { return s.novelty + s.engineering + s.reproducibility + s.timeToValue; }
function scoreLabel(t: number): { text: string; cls: string } {
  if (t >= 80) return { text: "强烈推荐", cls: "" };
  if (t >= 60) return { text: "值得一看", cls: "warn" };
  if (t > 0) return { text: "可选", cls: "low" };
  return { text: "未评分", cls: "low" };
}
function firstSentence(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?[。！？.!?])\s*/);
  return match ? match[1] : normalized;
}
function repoAudience(repo: AnalyzedRepo): string {
  if (repo.tags.length > 0) return `你正在学习 ${repo.tags.slice(0, 3).join(" / ")} 相关项目`;
  if (repo.language) return `你想用 ${repo.language} 读一个真实开源项目`;
  return "你想判断这个项目是否值得继续研究";
}
function repoAction(repo: AnalyzedRepo): string {
  if (repo.deep) return "先看 Overview 的新手路径，再按 Try it 做一次最小验证。";
  if (repo.worthDeepDive >= 60) return "先读轻量摘要，确认是否和你的学习目标相关。";
  return "了解趋势即可，暂时不建议投入大量时间。";
}

type TabKey = "overview" | "concepts" | "howItWorks" | "novelty" | "ecosystem" | "limitations" | "tryIt";
const TAB_DEFS: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "○" },
  { key: "concepts", label: "Key Concepts", icon: "◆" },
  { key: "howItWorks", label: "How it works", icon: "▣" },
  { key: "novelty", label: "Novelty", icon: "✦" },
  { key: "ecosystem", label: "Ecosystem", icon: "⌬" },
  { key: "limitations", label: "Limitations", icon: "⚠" },
  { key: "tryIt", label: "Try it", icon: "▶" },
];

export function Detail({ owner, name }: Props) {
  const [data, setData] = useState<TrendingData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => { loadTrending().then(setData).catch((e) => setErr(e?.message || String(e))); }, []);
  const found = useMemo(() => (data ? findRepo(data, owner, name) : null), [data, owner, name]);

  if (err) return (<><Header /><div className="detail"><div className="notice error">加载数据失败：{err}</div></div></>);
  if (!data) return (<><Header /><div className="detail"><div className="loading">正在加载…</div></div></>);
  if (!found) {
    return (
      <>
        <Header />
        <div className="detail">
          <div className="breadcrumb"><a href="#/projects">← 返回项目榜单</a></div>
          <div className="notice">没找到 <b>{owner}/{name}</b>。可能不在当前的日 / 周 / 月榜上。</div>
        </div>
      </>
    );
  }

  const { repo, window: win } = found;
  const deep = repo.deep;

  return (
    <>
      <Header />
      <div className="detail">
        <div className="breadcrumb">
          <a href="#/projects">Projects</a><span className="sep">/</span>
          <a href="#/projects">{BOARD_LABEL[win]}</a><span className="sep">/</span>
          <span>{repo.fullName}</span>
        </div>

        {!deep ? (
          <>
            <Hero repo={repo} win={win} deep={null} />
            <LiteProjectDetail repo={repo} />
          </>
        ) : (
          <div className="detail-grid">
            <div className="main-col">
              <Hero repo={repo} win={win} deep={deep} />

              <div className="tabs">
                {TAB_DEFS.map((t) => (
                  <button key={t.key} className={`tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
                    <span className="tab-ico">{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>

              {tab === "overview" && (
                <>
                  <ProjectLearningLoop repo={repo} />
                  <section className="section">
                    <h3>📖 Quick read · README 速读</h3>
                    <div className="body prose"><Markdown text={repo.light} /></div>
                  </section>
                  <ProjectOverviewGrid repo={repo} />
                  <section className="section">
                    <h3>✨ Why it matters</h3>
                    <div className="callouts">
                      {deep.whyItMatters.map((w, i) => (
                        <div className="callout" key={i}>
                          <div className="callout-title">{w.title}</div>
                          <div className="callout-body">{w.body}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="section">
                    <h3>这份分析是给谁看的？</h3>
                    <div className="body prose">
                      <p>这不是 README 翻译。默认读者是 <strong>刚开始接触 AI 项目的学生</strong>：先讲它像什么、解决什么痛点，再拆项目特有术语（<a href="#" onClick={(e) => { e.preventDefault(); setTab("concepts"); }}>Key Concepts</a>）、架构和数据流（<a href="#" onClick={(e) => { e.preventDefault(); setTab("howItWorks"); }}>How it works</a>）、同类差异（<a href="#" onClick={(e) => { e.preventDefault(); setTab("novelty"); }}>Novelty</a>）、生态位置（<a href="#" onClick={(e) => { e.preventDefault(); setTab("ecosystem"); }}>Ecosystem</a>）、已知坑（<a href="#" onClick={(e) => { e.preventDefault(); setTab("limitations"); }}>Limitations</a>）和最短上手路径（<a href="#" onClick={(e) => { e.preventDefault(); setTab("tryIt"); }}>Try it</a>）。</p>
                      <p>右侧总分 4 维度（新意 / 工程 / 复现 / 上手）各 0-25，总分 0-100。<strong>worthDeepDive = {repo.worthDeepDive}</strong> 是“是否值得深挖”的价值分，不等于项目质量保证。</p>
                    </div>
                  </section>
                  <ProjectVerificationPanel repo={repo} />
                </>
              )}

              {tab === "concepts" && (
                <section className="section">
                  <h3>◆ Key Concepts · 项目特有术语</h3>
                  {deep.keyConcepts.length === 0 ? (
                    <div className="body">README 里没有特别需要拆解的项目专有术语。</div>
                  ) : (
                    <div className="concept-list">
                      {deep.keyConcepts.map((c, i) => (
                        <div className="concept" key={i}>
                          <div className="concept-term"><span className="concept-num">{i + 1}</span>{c.term}</div>
                          <div className="concept-explain prose"><Markdown text={c.explain} /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {tab === "howItWorks" && (
                <section className="section">
                  <h3>▣ How it works · 架构与流程</h3>
                  <div className="body prose"><Markdown text={deep.howItWorks} /></div>
                </section>
              )}
              {tab === "novelty" && (
                <section className="section">
                  <h3>✦ Novelty · 跟同类工作的差异</h3>
                  <div className="body prose"><Markdown text={deep.novelty} /></div>
                </section>
              )}
              {tab === "ecosystem" && (
                <section className="section">
                  <h3>⌬ Ecosystem · 在生态里的位置</h3>
                  <div className="body prose"><Markdown text={deep.ecosystem} /></div>
                </section>
              )}
              {tab === "limitations" && (
                <section className="section">
                  <h3>⚠ Limitations · 已知短板</h3>
                  <LimitationView lim={deep.limitations} />
                </section>
              )}
              {tab === "tryIt" && (
                <section className="section">
                  <h3>▶ Try it · 最短上手路径</h3>
                  <TryItView steps={deep.tryIt} />
                </section>
              )}
            </div>

            <aside className="aside-col">
              <ScoreCard score={deep.score} worthDeepDive={repo.worthDeepDive} />
              <QuickSummary text={deep.atGlance} />
              <SourceCard repo={repo} />
              <NextSteps repo={repo} />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

function Header() {
  return <SiteHeader active="projects" />;
}

function LiteProjectDetail({ repo }: { repo: AnalyzedRepo }) {
  return (
    <div className="lite-project-grid">
      <section className="section">
        <h3>Quick read · 轻量判断</h3>
        <div className="body prose"><Markdown text={repo.light} /></div>
      </section>
      <aside className="aside">
        <h4 className="aside-title"><span className="ico">?</span>为什么没有 Deep Dive</h4>
        <div className="project-decision-stack">
          <div><span>价值分</span><b>{repo.worthDeepDive}/100</b></div>
          <div><span>适合你如果</span><b>{repoAudience(repo)}</b></div>
          <div><span>建议动作</span><b>{repoAction(repo)}</b></div>
        </div>
        <div className="aside-note">
          这里不展示命令行重跑说明。对学习者来说，先判断它是否和你的目标相关；如果相关，再去 GitHub README 看官方安装方式。
        </div>
      </aside>
    </div>
  );
}

function ProjectLearningLoop({ repo }: { repo: AnalyzedRepo }) {
  return (
    <section className="project-learning-loop">
      <div>
        <div className="section-kicker">Project Deep Dive Loop</div>
        <h3>默认按这条路径读</h3>
      </div>
      <div className="project-loop-steps">
        <span>1. 它本质上像什么</span>
        <span>2. 为什么现在值得看</span>
        <span>3. 怎么工作</span>
        <span>4. 怎么跑一次并验证</span>
      </div>
      <div className="project-loop-target">
        <b>{repoAction(repo)}</b>
        <p>{repo.deep?.atGlance || firstSentence(repo.light)}</p>
      </div>
    </section>
  );
}

function ProjectOverviewGrid({ repo }: { repo: AnalyzedRepo }) {
  const deep = repo.deep;
  if (!deep) return null;
  const firstConcept = deep.keyConcepts[0];
  return (
    <section className="project-overview-grid">
      <div className="analysis-card">
        <span>它本质上像什么</span>
        <p>{deep.atGlance}</p>
      </div>
      <div className="analysis-card">
        <span>适合谁</span>
        <p>{repoAudience(repo)}</p>
      </div>
      <div className="analysis-card">
        <span>先懂一个概念</span>
        <p>{firstConcept ? `${firstConcept.term}：${firstSentence(firstConcept.explain)}` : "这个项目没有明显专有术语，先读 README 里的目标和 quickstart。"}</p>
      </div>
      <div className="analysis-card">
        <span>怎么开始验证</span>
        <p>{firstTryStep(deep.tryIt)}</p>
      </div>
    </section>
  );
}

function ProjectVerificationPanel({ repo }: { repo: AnalyzedRepo }) {
  const deep = repo.deep;
  if (!deep) return null;
  const firstTry = firstTryStep(deep.tryIt);
  return (
    <section className="section project-verification-panel">
      <div className="section-kicker">Verification</div>
      <h3>怎么证明你真的看懂/会用了</h3>
      <div className="verification-task-grid">
        <article className="verification-task-card">
          <div className="verification-task-head"><span>复述题</span><h4>用一句话说清项目价值</h4></div>
          <p>不看 README，用自己的话解释它解决什么痛点，为什么最近值得关注。</p>
          <div className="verification-pass"><b>通过标准</b><ul><li>说出目标用户或使用场景。</li><li>说出它和普通工具/同类项目的差异。</li></ul></div>
          <div className="verification-answer"><b>答案关键点</b><p>{repo.tldr}</p></div>
        </article>
        <article className="verification-task-card">
          <div className="verification-task-head"><span>流程题</span><h4>画出最小工作流</h4></div>
          <p>画出输入、核心处理、输出三段，并标出项目最关键的模块或命令。</p>
          <div className="verification-pass"><b>通过标准</b><ul><li>能标出至少一个输入和一个输出。</li><li>能解释中间处理为什么有价值。</li></ul></div>
          <div className="verification-mistake"><b>常见错法</b><p>只复制项目口号，没有画出数据或用户操作如何流动。</p></div>
        </article>
        <article className="verification-task-card">
          <div className="verification-task-head"><span>实操题</span><h4>完成一次最小试用</h4></div>
          <p>{firstTry}</p>
          <div className="verification-pass"><b>通过标准</b><ul><li>能说出预期看到什么结果。</li><li>失败时能判断是安装、配置、依赖还是项目限制。</li></ul></div>
          <div className="verification-answer"><b>下一步</b><p>如果跑通，再读 Limitations 判断它是否适合真实项目。</p></div>
        </article>
      </div>
    </section>
  );
}

function firstTryStep(steps: TryStep[] | string): string {
  if (Array.isArray(steps) && steps[0]) return steps[0].step;
  if (typeof steps === "string" && steps.trim()) return firstSentence(steps);
  return "先打开官方 README，找 install / quickstart / demo 三个入口。";
}

function Hero({ repo, win, deep }: { repo: AnalyzedRepo; win: TrendingWindow; deep: AnalyzedRepo["deep"] | null }) {
  return (
    <div className="hero">
      <div className="hero-head">
        <img className="hero-avatar" src={repo.ownerAvatarUrl} alt={repo.owner} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            {deep && <span className="gold-pill">⭐ 点金 Deep Dive</span>}
            <span style={{ color: "var(--ink-3)", fontSize: 12 }}>来自 {BOARD_LABEL[win]} · 排名 #{repo.rank}</span>
          </div>
          <h1 className="hero-name"><a href={repo.url} target="_blank" rel="noreferrer">{repo.fullName} ↗</a></h1>
        </div>
      </div>
      {repo.tldr && <p className="hero-desc"><b>TL;DR</b> · {repo.tldr}</p>}
      {repo.description && <p className="hero-desc" style={{ color: "var(--ink-3)" }}>{repo.description}</p>}
      {repo.tags.length > 0 && <div className="hero-tags tag-row">{repo.tags.slice(0, 6).map((t) => <span key={t} className="tag">{t}</span>)}</div>}
      <div className="metric-row">
        <div className="metric">
          <div className="metric-label">Stars · 总量</div>
          <div className="metric-value">{repo.stars.toLocaleString()}</div>
          <div className="metric-sub">forks {repo.forks.toLocaleString()}</div>
        </div>
        <div className="metric">
          <div className="metric-label">本榜窗口新增</div>
          <div className="metric-value" style={{ color: "var(--gold-deep)" }}>{repo.starsGained > 0 ? `+${repo.starsGained.toLocaleString()}` : "—"}</div>
          <div className="metric-sub">{BOARD_LABEL[win]}</div>
        </div>
        <div className="metric">
          <div className="metric-label">语言</div>
          <div className="metric-value">{repo.language ? (<><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: repo.languageColor || "var(--line-strong)", marginRight: 6, verticalAlign: 2 }} />{repo.language}</>) : "—"}</div>
          <div className="metric-sub">主仓库语言</div>
        </div>
      </div>
      {deep && <div className="glance">{deep.atGlance}</div>}
    </div>
  );
}

function LimitationView({ lim }: { lim: LimitationItem[] | string }) {
  if (Array.isArray(lim) && lim.length > 0) {
    return (
      <div className="limit-list">
        {lim.map((it, i) => (
          <div className="limit-item" key={i}>
            <div className="limit-num">{i + 1}</div>
            <div className="limit-body">
              <div className="limit-title">{it.title}</div>
              <div className="limit-text prose"><Markdown text={it.body} /></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  // Legacy: string with "X：内容，Y：内容" — split on Chinese comma if it looks like a packed list.
  const s = typeof lim === "string" ? lim : "";
  if (/，[^，。]{2,8}[：:]/.test(s)) {
    const parts = s.split(/(?=，[^，。]{2,15}[：:])/).map((p) => p.replace(/^，/, "").trim()).filter(Boolean);
    return (
      <div className="limit-list">
        {parts.map((p, i) => {
          const m = p.match(/^([^：:]{2,18})[：:](.+)/);
          const title = m ? m[1].trim() : `条目 ${i + 1}`;
          const body = m ? m[2].trim() : p;
          return (
            <div className="limit-item" key={i}>
              <div className="limit-num">{i + 1}</div>
              <div className="limit-body">
                <div className="limit-title">{title}</div>
                <div className="limit-text prose"><Markdown text={body} /></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return <div className="body prose"><Markdown text={s} /></div>;
}

function TryItView({ steps }: { steps: TryStep[] | string }) {
  if (Array.isArray(steps) && steps.length > 0) {
    return (
      <ol className="try-list">
        {steps.map((s, i) => (
          <li key={i} className="try-step">
            <div className="try-num">{i + 1}</div>
            <div className="try-body">
              <div className="try-text prose"><Markdown text={s.step} /></div>
              {s.cmd && <pre className="try-cmd"><code>{s.cmd}</code></pre>}
              {s.note && <div className="try-note">💡 {s.note}</div>}
            </div>
          </li>
        ))}
      </ol>
    );
  }
  // Legacy: a paragraph like "1. xxx 2. yyy 3. zzz" — split.
  const s = typeof steps === "string" ? steps : "";
  if (/\b\d+\.\s/.test(s)) {
    const parts = s.split(/(?=\b\d+\.\s)/).map((p) => p.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
    return (
      <ol className="try-list">
        {parts.map((p, i) => (
          <li key={i} className="try-step">
            <div className="try-num">{i + 1}</div>
            <div className="try-body"><div className="try-text prose"><Markdown text={p} /></div></div>
          </li>
        ))}
      </ol>
    );
  }
  return <div className="body prose"><Markdown text={s} /></div>;
}

function ScoreCard({ score, worthDeepDive }: { score: ScoreBreakdown; worthDeepDive: number }) {
  const total = totalScore(score);
  const label = scoreLabel(total);
  const rows = [
    { name: "新意 Novelty", v: score.novelty },
    { name: "工程 Engineering", v: score.engineering },
    { name: "复现 Reproducibility", v: score.reproducibility },
    { name: "上手 Time-to-value", v: score.timeToValue },
  ];
  return (
    <div className="aside">
      <h4 className="aside-title"><span className="ico">▲</span>评分</h4>
      <div className="score-total">
        <div>
          <div style={{ color: "var(--ink-3)", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}>Score</div>
          <div className="num">{total}<span style={{ color: "var(--ink-3)", fontSize: 14, fontWeight: 500 }}> / 100</span></div>
        </div>
        <span className={`label ${label.cls}`}>{label.text}</span>
      </div>
      {rows.map((r) => (
        <div className="score-row" key={r.name}>
          <span className="name">{r.name}</span>
          <span className="bar"><i style={{ width: `${(r.v / 25) * 100}%` }} /></span>
          <span className="num">{r.v}/25</span>
        </div>
      ))}
      <div className="aside-note">
        <b>worthDeepDive {worthDeepDive}/100</b>—AI 判断该项目对研究生学习的价值。≥60 才进入 deep dive。
        <br /><br />
        子维度各 0-25。<b>新意</b>=跟同类的差异；<b>工程</b>=代码/文档/测试质量；<b>复现</b>=安装顺畅度；<b>上手</b>=clone 到结果的速度。
      </div>
    </div>
  );
}

function QuickSummary({ text }: { text: string }) {
  return (
    <div className="aside">
      <h4 className="aside-title"><span className="ico">i</span>Quick Summary</h4>
      <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>{text}</div>
    </div>
  );
}

function SourceCard({ repo }: { repo: AnalyzedRepo }) {
  const items = [
    { name: "GitHub repo", url: repo.url, label: "Open" },
    { name: "README", url: `${repo.url}#readme`, label: "View" },
    { name: "Trending 原榜", url: "https://github.com/trending", label: "Open" },
  ];
  return (
    <div className="aside">
      <h4 className="aside-title"><span className="ico">↗</span>Sources</h4>
      {items.map((it) => (
        <div className="source-row" key={it.name}>
          <span className="name">{it.name}</span>
          <a className="open" href={it.url} target="_blank" rel="noreferrer">{it.label}</a>
        </div>
      ))}
    </div>
  );
}

function NextSteps({ repo }: { repo: AnalyzedRepo }) {
  return (
    <div className="aside">
      <h4 className="aside-title"><span className="ico">→</span>Next steps</h4>
      <div className="next-step">读 Try it tab，按提示跑 5 分钟 quickstart</div>
      <div className="next-step">把 Key Concepts 里的术语和你已知的 AI 概念做映射</div>
      <div className="next-step">看 Ecosystem 知道它跟你已知项目的关系</div>
      <div className="next-step">如果工程评分 ≥ 18，clone 下来本地跑 demo</div>
      {repo.language && <div className="next-step">在你自己的 {repo.language} 项目里试它的核心抽象</div>}
    </div>
  );
}
