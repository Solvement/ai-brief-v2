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

// Minimal hast shape we touch — we only read tagName/value and splice children.
type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { className?: string | string[]; id?: string };
  children?: HastNode[];
};

function hastText(node: HastNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  if (Array.isArray(node.children)) return node.children.map(hastText).join("");
  return "";
}

/**
 * rehype plugin: wrap the section starting at the first <h2> whose text starts
 * with `headingPrefix` (up to the next <h2> or the footnotes <section>) into a
 * collapsible <details>. Runs on the single hast tree, so footnotes ([^n]) still
 * resolve. The <details> keeps the heading's slug id so the TOC anchor lands on it.
 */
function makeFoldPlugin(headingPrefix: string) {
  return () => (tree: HastNode) => {
    const kids = tree.children;
    if (!Array.isArray(kids)) return;
    const isH2 = (n: HastNode) => n.type === "element" && n.tagName === "h2";
    const start = kids.findIndex((n) => isH2(n) && hastText(n).trim().startsWith(headingPrefix));
    if (start === -1) return;
    let end = kids.length;
    for (let i = start + 1; i < kids.length; i += 1) {
      const n = kids[i];
      if (isH2(n) || (n.type === "element" && n.tagName === "section")) { end = i; break; }
    }
    const title = hastText(kids[start]).trim();
    const body = kids.slice(start + 1, end);
    const details: HastNode = {
      type: "element",
      tagName: "details",
      properties: { className: ["pd-foldout"], id: slugify(title) },
      children: [
        { type: "element", tagName: "summary", properties: {}, children: [{ type: "text", value: `${title} — 点开看复现级机制` }] },
        ...body,
      ],
    };
    kids.splice(start, end - start, details);
  };
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

export function MarkdownRich({ source, collapsibleHeading }: { source: string; collapsibleHeading?: string }) {
  // ONE ReactMarkdown instance over the whole doc so footnotes ([^n]) and any
  // cross-references resolve. Mermaid fences are intercepted at the <pre> level
  // so the diagram renders outside <pre> (heavy lib lazy-loaded in <Mermaid>).
  // collapsibleHeading: fold that section (the deep "技术细节" read-on layer) by default.
  const rehypePlugins = collapsibleHeading ? [makeFoldPlugin(collapsibleHeading)] : [];
  return (
    <div className="pd-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
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
