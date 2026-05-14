import { useEffect, useRef, useState } from "react";
import type { Board, TrendingData, TrendingWindow } from "../types";
import { loadTrending } from "../lib/data";
import { RepoCard } from "../components/RepoCard";

const TITLES: Record<TrendingWindow, string> = { daily: "今日榜", weekly: "本周榜", monthly: "本月榜" };
const ICONS: Record<TrendingWindow, string> = { daily: "日", weekly: "周", monthly: "月" };

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.round(h / 24)} 天前`;
}

function BoardCol({ board }: { board: Board }) {
  const deepCount = board.repos.filter((r) => r.deep).length;
  return (
    <section className="board">
      <header className="board-head">
        <h2><span className="board-icon">{ICONS[board.window]}</span>{TITLES[board.window]}</h2>
        <span className="board-tag">
          {board.repos.length} 个 · <b style={{ color: "var(--gold-deep)" }}>{deepCount}</b> 个点金
        </span>
      </header>
      {board.repos.length === 0 ? (
        <div className="empty">这个榜没抓到数据</div>
      ) : (
        board.repos.map((r) => <RepoCard key={r.fullName} repo={r} />)
      )}
    </section>
  );
}

type IngestState = "idle" | "running" | "done" | "error";

export function Home() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ingest, setIngest] = useState<IngestState>("idle");
  const [log, setLog] = useState("");
  const logRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    loadTrending().then(setData).catch((e) => setErr(e?.message || String(e)));
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const refreshData = async (force = false) => {
    if (ingest === "running") return;
    setIngest("running");
    setLog("");
    try {
      const res = await fetch("/__ingest" + (force ? "?force=1" : ""), { method: "POST" });
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
      setIngest("done");
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      setIngest("error");
      setLog((prev) => prev + "\n[error] " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const closeLog = () => { if (ingest !== "running") { setIngest("idle"); setLog(""); } };

  return (
    <>
      <header className="site-top">
        <div className="site-top-inner">
          <div className="brand">
            <span className="brand-mark">GH</span>
            <span className="brand-text">
              Trending · Deep Dive
              <span className="muted">日 / 周 / 月榜 · AI 研究生导读</span>
            </span>
          </div>
          {data && (
            <div className="site-meta">
              数据更新于 {relativeTime(data.generatedAt)}{" "}
              <button className="refresh-btn" onClick={() => refreshData(false)} disabled={ingest === "running"}>
                {ingest === "running" ? "更新中…" : "🔄 立即更新"}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="page">
        <div className="page-intro">
          GitHub Trending 的<b>日 / 周 / 月</b>榜单。每张卡片右上角的<b> AI 评分</b>来自 DeepSeek 对该项目的全维度评估，
          只有得分够高的项目才会进入<b> 深度解读</b>——而不是固定 top 3。
          <div style={{ marginTop: 10, color: "var(--ink-3)", fontSize: 13 }}>
            <b>分析视角</b>：给有 AI 基础但不熟此项目术语的研究生看。
            深度解读包含 Quick read · Key Concepts · How it works · Novelty · Ecosystem · Limitations · Try it 七个板块。
          </div>
        </div>

        {err && (
          <div className="notice error">
            加载失败：{err}<br />
            请先运行 <code>npm run ingest</code> 生成 <code>public/data/trending.json</code>。
          </div>
        )}

        {!data && !err && <div className="loading">正在加载榜单…</div>}

        {data && (
          <div className="boards">
            <BoardCol board={data.daily} />
            <BoardCol board={data.weekly} />
            <BoardCol board={data.monthly} />
          </div>
        )}
      </main>

      {ingest !== "idle" && (
        <div className="ingest-overlay" role="dialog" aria-modal="true">
          <div className="ingest-modal">
            <div className="ingest-head">
              <div>
                {ingest === "running" && <><span className="spinner" /> 正在抓取榜单并调用 DeepSeek…</>}
                {ingest === "done" && <>✅ 完成，正在重新加载页面</>}
                {ingest === "error" && <>❌ 出错</>}
              </div>
              <button className="ingest-close" onClick={closeLog} disabled={ingest === "running"}>
                {ingest === "running" ? "请等待" : "关闭"}
              </button>
            </div>
            <pre className="ingest-log" ref={logRef}>{log || "（等待 server 响应…）"}</pre>
            {ingest === "running" && (
              <div className="ingest-hint">
                通常 30-90 秒。已分析过的项目会命中缓存自动跳过。
              </div>
            )}
            {ingest === "error" && (
              <div className="ingest-hint">
                <button className="refresh-btn" onClick={() => refreshData(false)}>重试</button>
                <button className="refresh-btn" onClick={() => refreshData(true)} style={{ marginLeft: 8 }}>强制重跑（无缓存）</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
