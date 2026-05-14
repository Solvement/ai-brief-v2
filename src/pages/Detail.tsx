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
          <div className="breadcrumb"><a href="#/">← 返回榜单</a></div>
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
          <a href="#/">榜单</a><span className="sep">/</span>
          <a href="#/">{BOARD_LABEL[win]}</a><span className="sep">/</span>
          <span>{repo.fullName}</span>
        </div>

        {!deep ? (
          <>
            <Hero repo={repo} win={win} deep={null} />
            <section className="section">
              <h3>Quick read · README 速读</h3>
              <div className="body prose"><Markdown text={repo.light} /></div>
            </section>
            <div className="notice">
              这个项目 AI 评估 <b>worthDeepDive = {repo.worthDeepDive}</b>，未达 deep dive 阈值（60）或被 cap 挤出。
              如果你想强制深度分析它，命令行加 <code>--worth=0 --cap=10</code> 重跑 ingest。
            </div>
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
                  <section className="section">
                    <h3>📖 Quick read · README 速读</h3>
                    <div className="body prose"><Markdown text={repo.light} /></div>
                  </section>
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
                      <p>这不是 README 翻译。目标读者是 <strong>有 ML / LLM / agent 基础但没读过这份 README 的研究生</strong>。所以会拆解项目特有的术语（<a href="#" onClick={(e) => { e.preventDefault(); setTab("concepts"); }}>Key Concepts</a>），讲清架构和数据流（<a href="#" onClick={(e) => { e.preventDefault(); setTab("howItWorks"); }}>How it works</a>），跟同类工作的位置（<a href="#" onClick={(e) => { e.preventDefault(); setTab("novelty"); }}>Novelty</a>），在生态里的搭档（<a href="#" onClick={(e) => { e.preventDefault(); setTab("ecosystem"); }}>Ecosystem</a>），已知坑（<a href="#" onClick={(e) => { e.preventDefault(); setTab("limitations"); }}>Limitations</a>），以及最短上手路径（<a href="#" onClick={(e) => { e.preventDefault(); setTab("tryIt"); }}>Try it</a>）。</p>
                      <p>右侧总分 4 维度（新意 / 工程 / 复现 / 上手）各 0-25，总分 0-100。AI 还另给了 <strong>worthDeepDive = {repo.worthDeepDive}</strong>，超过 60 才会做这份深度解读，所以你看到这页就说明它通过了筛选。</p>
                    </div>
                  </section>
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
  return <SiteHeader active="home" />;
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
