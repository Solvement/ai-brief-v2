"use client";
import { useEffect, useMemo, useState } from "react";
import type { AnalyzedRepo, ScoreBreakdown, TrendingData, TrendingWindow, LimitationItem, TryStep } from "../types";
import { loadTrending } from "../lib/data";
import { Markdown } from "../components/Markdown";
import type { FacetRecord } from "../components/ProjectFacetSpine";

/* ============================================================
   /repo/[owner]/[name] — 统一项目页契约（Kevin 2026-06-11）
   每个项目页固定结构：Hero → Mind Palace 内化（有则显示）→ 分析正文。
   - 有深读：判断先行的单滚动阅读页（RuView/Spine 风格），Tab 分叉淘汰。
   - 无深读：诚实速读块——判断口径唯一（recommended_action / 深度门），
     不再出现「文案说值得深扒、面板说不建议投入」的自相矛盾。
   ============================================================ */

interface Props { owner: string; name: string }

const BOARD_LABEL: Record<TrendingWindow, string> = { daily: "今日榜", weekly: "本周榜", monthly: "本月榜" };

/** 与 RepoCard 同一张映射：判断口径全站唯一 */
const ACTION_LABEL: Record<string, string> = {
  ignore: "忽略", monitor: "观望", try: "可一试", analyze: "值得分析",
  deep_dive: "值得深扒", clone_and_run: "克隆来跑", extract: "提炼复用",
};

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
function plainText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
function compactText(text: string, max = 180): string {
  const clean = plainText(text);
  if (clean.length <= max) return clean;
  const sentence = firstSentence(clean);
  if (sentence.length <= max) return sentence;
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

/** 判断口径的唯一来源：管线 recommended_action 优先，否则按实际深度/门控推导。 */
function verdictOf(repo: AnalyzedRepo): { label: string; reason: string } {
  if (repo.recommended_action && ACTION_LABEL[repo.recommended_action]) {
    return { label: ACTION_LABEL[repo.recommended_action], reason: "" };
  }
  if (repo.deep) return { label: "值得深扒", reason: "已通过深度门控并完成深读。" };
  if (repo.worthDeepDive >= 60) {
    return { label: "值得分析", reason: `价值分 ${repo.worthDeepDive}/100 已过深读线，深读生成中。` };
  }
  return { label: "了解趋势即可", reason: `价值分 ${repo.worthDeepDive}/100，未到深读线（60）。` };
}

/** 是不是还没被重生成的旧模板机器话（「得分 57，信号是 project_type:...」）——渲染端兜底不展示垃圾 */
function isTemplateJunk(light: string): boolean {
  return /信号是\s*project_type|signal_score\s*[:：]/.test(light || "");
}

type ProjectDeepDive = NonNullable<AnalyzedRepo["deep"]>;
type WorkflowStep = { title: string; body: string };

export function Detail({ owner, name }: Props) {
  const [data, setData] = useState<TrendingData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [facetsMap, setFacetsMap] = useState<Record<string, FacetRecord> | null>(null);
  const [backHref, setBackHref] = useState("/projects");

  useEffect(() => { loadTrending().then(setData).catch((e) => setErr(e?.message || String(e))); }, []);
  useEffect(() => {
    fetch("/data/brief/facets.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setFacetsMap(j?.facets ?? {}))
      .catch(() => setFacetsMap({}));
  }, []);
  // 返回到来源榜（?win=monthly），不重置今日榜
  useEffect(() => {
    const w = new URLSearchParams(location.search).get("win");
    if (w === "daily" || w === "weekly" || w === "monthly") setBackHref(`/projects?win=${w}`);
  }, []);

  const found = useMemo(() => (data ? findRepo(data, owner, name) : null), [data, owner, name]);
  const facet = useMemo(() => {
    if (!facetsMap) return null;
    for (const c of [`${owner}-${name}`, name, owner].map((s) => s.toLowerCase())) {
      if (facetsMap[c]) return facetsMap[c];
    }
    return null;
  }, [facetsMap, owner, name]);

  if (err) return (<div className="detail"><div className="notice error">加载数据失败：{err}</div></div>);
  if (!data) return (<div className="detail"><div className="loading">正在加载…</div></div>);
  if (!found) {
    return (
      <div className="detail">
        <div className="breadcrumb"><a href={backHref}>← 返回项目榜单</a></div>
        <div className="notice">没找到 <b>{owner}/{name}</b>。可能不在当前的日 / 周 / 月榜上。</div>
      </div>
    );
  }

  const { repo, window: win } = found;
  const deep = repo.deep;
  const boardHref = `/projects?win=${win}`;

  return (
    <div className="detail">
      <div className="breadcrumb">
        <a href={backHref}>Projects</a><span className="sep">/</span>
        <a href={boardHref}>{BOARD_LABEL[win]}</a><span className="sep">/</span>
        <span>{repo.fullName}</span>
      </div>

      <Hero repo={repo} win={win} deep={deep ?? null} />

      {/* 蒸馏内化归 Mind Palace 检索区（Kevin 2026-06-11 深夜：项目页=纯精读，不混蒸馏关联）——只留一条直达链接 */}
      {facet && (
        <a className="mp-link-bar" href={`/mind-palace?q=${encodeURIComponent(name)}`}>
          🧠 此项目已内化进 Mind Palace——蒸馏拆解与知识关联在检索区查看 →
        </a>
      )}

      {deep ? <DeepReading repo={repo} deep={deep} /> : <RadarLite repo={repo} hasFacet={!!facet} />}
    </div>
  );
}

/* ───────────── 无深读：诚实速读（判断口径唯一，无矛盾） ───────────── */

function RadarLite({ repo, hasFacet }: { repo: AnalyzedRepo; hasFacet: boolean }) {
  const v = verdictOf(repo);
  const showLight = repo.light && !isTemplateJunk(repo.light);
  return (
    <div className="lite-project-grid">
      <section className="section">
        <h3>雷达速读</h3>
        {showLight ? (
          <div className="body prose"><Markdown text={repo.light} /></div>
        ) : (
          <div className="body">
            {repo.tldr && <p>{repo.tldr}</p>}
            <p style={{ color: "var(--ink-3)" }}>这个项目还没有人话速读{hasFacet ? "（已内化进 Mind Palace，见上方链接）" : ""}，下方判断来自确定性深度门控。</p>
          </div>
        )}
      </section>
      <aside className="aside">
        <h4 className="aside-title"><span className="ico">⚖</span>判断</h4>
        <div className="project-decision-stack">
          <div><span>建议动作</span><b>{v.label}</b></div>
          {v.reason && <div><span>为什么</span><b>{v.reason}</b></div>}
          <div><span>价值分</span><b>{repo.worthDeepDive}/100</b></div>
        </div>
        <div className="aside-note">
          判断口径全站唯一：卡片、本页、文案出自同一个门控决定。要安装/运行，去 GitHub README 看官方方式。
        </div>
      </aside>
    </div>
  );
}

/* ───────────── 有深读：判断先行的单滚动阅读页（Tab 淘汰） ───────────── */

function DeepReading({ repo, deep }: { repo: AnalyzedRepo; deep: ProjectDeepDive }) {
  return (
    <div className="detail-grid">
      <div className="main-col">
        <ReaderBrief repo={repo} deep={deep} />

        <section className="section" id="sec-flow">
          <h3>架构与流程</h3>
          <WorkflowSketch deep={deep} />
          <div className="body prose"><Markdown text={deep.howItWorks} /></div>
        </section>

        {deep.keyConcepts.length > 1 && (
          <section className="section" id="sec-concepts">
            <h3>项目特有术语</h3>
            <div className="concept-list">
              {deep.keyConcepts.slice(1).map((c, i) => (
                <div className="concept" key={i}>
                  <div className="concept-term"><span className="concept-num">{i + 2}</span>{c.term}</div>
                  <div className="concept-explain prose"><Markdown text={c.explain} /></div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="section" id="sec-novelty">
          <h3>跟同类工作的差异</h3>
          <div className="body prose"><Markdown text={deep.novelty} /></div>
        </section>

        <section className="section" id="sec-ecosystem">
          <h3>在生态里的位置</h3>
          <div className="body prose"><Markdown text={deep.ecosystem} /></div>
        </section>

        <section className="section" id="sec-limitations">
          <h3>已知短板</h3>
          <LimitationView lim={deep.limitations} />
        </section>

        <section className="section" id="sec-tryit">
          <h3>最短上手路径</h3>
          <TryItView steps={deep.tryIt} />
        </section>

        <VerificationPanel repo={repo} deep={deep} />
      </div>

      <aside className="aside-col">
        <ScoreCard score={deep.score} worthDeepDive={repo.worthDeepDive} />
        <QuickSummary text={deep.atGlance} />
        <SourceCard repo={repo} />
      </aside>
    </div>
  );
}

function ReaderBrief({ repo, deep }: { repo: AnalyzedRepo; deep: ProjectDeepDive }) {
  const firstConcept = deep.keyConcepts[0];
  const reasons = deep.whyItMatters.slice(0, 3);
  const showLight = repo.light && !isTemplateJunk(repo.light);
  return (
    <section className="dd-lead">
      <div className="dd-kicker">先给判断</div>
      <h2 className="dd-verdict">{firstSentence(deep.atGlance)}</h2>
      {showLight && <p className="dd-verdict-sub">{compactText(repo.light, 190)}</p>}

      <div className="dd-insight">
        <div className="dd-insight-tag">核心洞见</div>
        <p>{compactText(deep.novelty, 240)}</p>
      </div>

      {reasons.length > 0 && (
        <div className="dd-why">
          {reasons.map((reason) => (
            <article key={reason.title}>
              <b>{reason.title}</b>
              <span>{compactText(reason.body, 70)}</span>
            </article>
          ))}
        </div>
      )}

      {firstConcept && (
        <>
          <div className="dd-block-kicker">先懂一个概念</div>
          <div className="dd-concept">
            <div className="dd-term"><i>1</i>{firstConcept.term}</div>
            <div className="dd-concept-body prose"><Markdown text={firstConcept.explain} /></div>
          </div>
        </>
      )}

      <div className="dd-threads">
        <div className="dd-threads-lab">往下读（同一页，按需跳）：</div>
        <div className="dd-chips">
          <a className="dd-chip" href="#sec-flow">↓ 完整流程</a>
          {deep.keyConcepts.length > 1 && <a className="dd-chip" href="#sec-concepts">↓ 全部术语</a>}
          <a className="dd-chip" href="#sec-novelty">↓ 跟同类的差异</a>
          <a className="dd-chip" href="#sec-tryit">↓ 上手步骤</a>
        </div>
      </div>
    </section>
  );
}

function markdownSections(text: string): WorkflowStep[] {
  const sections: WorkflowStep[] = [];
  const lines = text.split(/\r?\n/);
  let currentTitle = "";
  let body: string[] = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      if (currentTitle || body.length) {
        sections.push({ title: currentTitle || "说明", body: body.join("\n") });
      }
      currentTitle = match[1].trim();
      body = [];
    } else {
      body.push(line);
    }
  }
  if (currentTitle || body.length) sections.push({ title: currentTitle || "说明", body: body.join("\n") });
  return sections.filter((section) => plainText(section.body));
}

function workflowSteps(deep: ProjectDeepDive): WorkflowStep[] {
  const sectionSteps = markdownSections(deep.howItWorks)
    .slice(0, 4)
    .map((section) => ({
      title: section.title.replace(/^#+\s*/, ""),
      body: compactText(section.body, 110),
    }));
  if (sectionSteps.length >= 2) return sectionSteps;

  if (Array.isArray(deep.tryIt) && deep.tryIt.length > 0) {
    return deep.tryIt.slice(0, 4).map((step, index) => ({
      title: `步骤 ${index + 1}`,
      body: compactText(step.step, 110),
    }));
  }

  return [
    { title: "输入", body: "先看用户或系统把什么交给这个项目处理。" },
    { title: "处理", body: compactText(deep.atGlance, 110) },
    { title: "输出", body: "再看它最终产出什么结果，以及结果如何被验证。" },
  ];
}

function WorkflowSketch({ deep }: { deep: ProjectDeepDive }) {
  const steps = workflowSteps(deep);
  return (
    <div className="workflow-sketch-section">
      <div className="workflow-sketch" aria-label="项目工作流">
        {steps.map((step, index) => (
          <article key={`${step.title}-${index}`}>
            <span>{index + 1}</span>
            <b>{step.title}</b>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function VerificationPanel({ repo, deep }: { repo: AnalyzedRepo; deep: ProjectDeepDive }) {
  const firstTry = firstTryStep(deep.tryIt);
  return (
    <section className="section project-verification-panel">
      <div className="section-kicker">Verification</div>
      <h3>最后用三件事验收</h3>
      <div className="verification-compact-grid">
        <article>
          <b>1. 说清价值</b>
          <p>不看 README，用一句话说明它解决谁的什么问题。</p>
          <span>答案应包含：{compactText(repo.tldr, 95)}</span>
        </article>
        <article>
          <b>2. 画出流程</b>
          <p>写出输入、核心处理、输出三段，不需要画复杂系统图。</p>
          <span>通过标准：能解释中间处理为什么有价值。</span>
        </article>
        <article>
          <b>3. 跑一次最小验证</b>
          <p>{firstTry}</p>
          <span>通过标准：知道成功结果长什么样，失败时能定位到安装、配置、依赖或项目限制。</span>
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
            {deep && <span className="gold-pill">Deep Dive</span>}
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
              {s.note && <div className="try-note">{s.note}</div>}
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
