"use client";
import { useEffect, useRef, useState } from "react";

// Lazy-load mermaid only when a diagram is actually present (it's a heavy lib).
let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      const mermaid = m.default;
      mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose", fontFamily: "inherit" });
      return mermaid;
    });
  }
  return mermaidPromise;
}

const MIN = 0.5;
const MAX = 3;
const STEP = 0.25;
const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v * 100) / 100));

// Zoomable Mermaid (Kevin 2026-06-11): wide/横向 diagrams shrink to fit and become unreadable.
// Zoom in enlarges the SVG; the scroll container lets you pan horizontally to follow it. Tall/纵向
// diagrams are unaffected at scale 1. Zero new deps — CSS transform + a scrollable wrapper.
export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let active = true;
    loadMermaid()
      .then(async (mermaid) => {
        const ok = await mermaid.parse(chart, { suppressErrors: true });
        if (ok === false) { if (active) setFailed(true); return; }
        const id = "m" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, chart);
        if (active && ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [chart]);

  if (failed) return <pre className="pd-mermaid-fallback">{chart}</pre>;

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // only Ctrl/Cmd+wheel zooms; plain wheel scrolls
    e.preventDefault();
    setScale((s) => clamp(s + (e.deltaY < 0 ? STEP : -STEP)));
  };

  return (
    <div className="pd-mermaid-wrap">
      <div className="pd-mermaid-controls" role="group" aria-label="架构图缩放">
        <button type="button" onClick={() => setScale((s) => clamp(s - STEP))} aria-label="缩小" disabled={scale <= MIN}>−</button>
        <span className="pd-mermaid-zoom" aria-live="polite">{Math.round(scale * 100)}%</span>
        <button type="button" onClick={() => setScale((s) => clamp(s + STEP))} aria-label="放大" disabled={scale >= MAX}>＋</button>
        <button type="button" onClick={() => setScale(1)} aria-label="复位" disabled={scale === 1}>复位</button>
      </div>
      <div className="pd-mermaid-scroll" onWheel={onWheel}>
        {/* Scale via the SVG's own width (CSS var --mz), NOT transform: transform doesn't grow the
            layout box, so the scroll container couldn't pan a widened diagram. Widening the SVG box
            makes overflow real → horizontal scroll works. */}
        <div
          className="pd-mermaid"
          ref={ref}
          role="img"
          aria-label="diagram"
          style={{ ["--mz" as string]: String(scale) } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
