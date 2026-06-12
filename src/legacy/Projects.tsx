"use client";
import { useEffect, useRef, useState } from "react";
import type { Board, TrendingData, TrendingWindow } from "../types";
import { loadTrending } from "../lib/data";
import { RepoCard } from "../components/RepoCard";

const TITLES: Record<TrendingWindow, string> = { daily: "今日榜", weekly: "本周榜", monthly: "本月榜" };
const SORT_LABEL = "综合排序";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.round(h / 24)} 天前`;
}

function depthOf(repo: { final_depth?: string; deep?: unknown }): string {
  return repo.final_depth || (repo.deep ? "deep" : "list_only");
}

function RadarGrid({ board, win }: { board: Board; win: TrendingWindow }) {
  const repos = board.repos;
  if (repos.length === 0) return <div className="empty">这个榜没抓到数据</div>;
  const deepCount = repos.filter((r) => depthOf(r) === "deep").length;
  const analysisCount = repos.filter((r) => depthOf(r) === "analysis").length;
  return (
    <>
      <div className="radar-grid">
        {repos.map((r, i) => <RepoCard key={r.fullName} repo={r} featured={i === 0} fromWin={win} />)}
      </div>
      <div className="radar-footstats">
        已收录 <b>{repos.length}</b> 个项目 · 深扒 <b>{deepCount}</b> · 分析 <b>{analysisCount}</b>
      </div>
    </>
  );
}

type IngestState = "idle" | "running" | "done" | "error";

export function Projects() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [win, setWin] = useState<TrendingWindow>("daily");
  const [err, setErr] = useState<string | null>(null);
  const [ingest, setIngest] = useState<IngestState>("idle");
  const [log, setLog] = useState("");
  const logRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    loadTrending().then(setData).catch((e) => setErr(e?.message || String(e)));
  }, []);

  // 从 URL 恢复来源榜（?win=monthly）：详情页返回/浏览器后退时回到离开的榜，而不是重置今日榜
  useEffect(() => {
    const w = new URLSearchParams(location.search).get("win");
    if (w === "daily" || w === "weekly" || w === "monthly") setWin(w);
  }, []);
  const switchWin = (w: TrendingWindow) => {
    setWin(w);
    const url = new URL(location.href);
    url.searchParams.set("win", w);
    history.replaceState(null, "", url.toString());
  };

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
      <main className="page radar-page">
        <header className="radar-header">
          <h1 className="radar-title">项目雷达</h1>
          <p className="radar-subtitle">
            GitHub Trending 的日 / 周 / 月项目雷达。每张卡片先回答这是什么、为什么值得看、适合谁、建议你读还是试。
          </p>
        </header>

        <div className="radar-filters">
          <div className="radar-chip-group">
            {(["daily", "weekly", "monthly"] as TrendingWindow[]).map((w) => (
              <button
                key={w}
                className={`radar-chip${win === w ? " active" : ""}`}
                onClick={() => switchWin(w)}
              >
                {TITLES[w]}
                {data && <span className="radar-chip-count">{data[w].repos.length}</span>}
              </button>
            ))}
          </div>
          <div className="radar-chip-group radar-chip-group-right">
            <span className="radar-chip radar-chip-static active">全部领域</span>
            <span className="radar-chip radar-chip-static radar-chip-sort">{SORT_LABEL} ▾</span>
          </div>
        </div>

        {err && (
          <div className="notice error">
            加载失败：{err}<br />
            请先运行 <code>npm run ingest</code> 生成 <code>public/data/trending.json</code>。
          </div>
        )}

        {!data && !err && <div className="loading">正在加载榜单…</div>}

        {data && <RadarGrid board={data[win]} win={win} />}
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