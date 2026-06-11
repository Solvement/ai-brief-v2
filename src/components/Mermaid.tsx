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

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadMermaid()
      .then(async (mermaid) => {
        // parse-first with suppressErrors: invalid diagrams return false WITHOUT
        // mermaid injecting a global "Syntax error" element into the DOM.
        const ok = await mermaid.parse(chart, { suppressErrors: true });
        if (ok === false) { if (active) setFailed(true); return; }
        const id = "m" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, chart);
        if (active && ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [chart]);

  // graceful fallback: show the mermaid source as a code block if render fails
  if (failed) return <pre className="pd-mermaid-fallback">{chart}</pre>;
  return <div className="pd-mermaid" ref={ref} role="img" aria-label="diagram" />;
}
