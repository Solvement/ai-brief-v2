"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mermaid } from "./Mermaid";

// GitHub-style callouts ([!key]/[!warn]/[!note]) → leading emoji so a plain
// blockquote reads as a callout (styled in CSS). Keeps the source AI-readable.
function preprocess(md: string): string {
  return md
    .replace(/\[!key\]\s*/gi, "💡 ")
    .replace(/\[!warn\]\s*/gi, "⚠️ ")
    .replace(/\[!note\]\s*/gi, "📌 ");
}

const MERMAID_FENCE = /```mermaid\n([\s\S]*?)```/g;

/** Split into markdown / mermaid segments so mermaid never lands inside <pre>. */
function segment(md: string): Array<{ type: "md" | "mermaid"; content: string }> {
  const out: Array<{ type: "md" | "mermaid"; content: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  MERMAID_FENCE.lastIndex = 0;
  while ((m = MERMAID_FENCE.exec(md))) {
    if (m.index > last) out.push({ type: "md", content: md.slice(last, m.index) });
    out.push({ type: "mermaid", content: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < md.length) out.push({ type: "md", content: md.slice(last) });
  return out;
}

export function MarkdownRich({ source }: { source: string }) {
  const parts = segment(preprocess(source));
  return (
    <div className="pd-prose">
      {parts.map((p, i) =>
        p.type === "mermaid"
          ? <Mermaid key={i} chart={p.content} />
          : <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{p.content}</ReactMarkdown>,
      )}
    </div>
  );
}
