"use client";
import type { ReactNode } from "react";
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

/** Slug used for heading ids + TOC anchors. Keeps CJK, strips punctuation. */
export function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[()（）·,，。.、/:：?？!！]/g, "")
    .replace(/\s+/g, "-");
}

function textOf(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textOf).join("");
  if (children && typeof children === "object" && "props" in children) {
    return textOf((children as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

export interface TocItem {
  level: number;
  text: string;
  slug: string;
}

/** Extract ## / ### headings (skipping fenced code) for a sticky TOC. */
export function buildToc(source: string): TocItem[] {
  const out: TocItem[] = [];
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2], slug: slugify(m[2]) });
  }
  return out;
}

export function MarkdownRich({ source }: { source: string }) {
  // ONE ReactMarkdown instance over the whole doc so footnotes ([^n]) and any
  // cross-references resolve. Mermaid fences are intercepted at the <pre> level
  // so the diagram renders outside <pre> (heavy lib lazy-loaded in <Mermaid>).
  return (
    <div className="pd-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
          h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
          pre: ({ children }) => {
            const child = (Array.isArray(children) ? children[0] : children) as
              | { props?: { className?: string; children?: ReactNode } }
              | undefined;
            const className = child?.props?.className ?? "";
            if (typeof className === "string" && className.includes("language-mermaid")) {
              const chart = textOf(child?.props?.children).replace(/\n$/, "");
              return <Mermaid chart={chart} />;
            }
            return <pre>{children}</pre>;
          },
        }}
      >
        {preprocess(source)}
      </ReactMarkdown>
    </div>
  );
}
