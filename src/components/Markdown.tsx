import React from "react";

/**
 * Lightweight markdown-ish renderer for LLM-generated prose.
 * Supports:
 *   ## subheading   -> <h4>
 *   **bold**        -> <strong>
 *   `code`          -> <code>
 *   1. / 2. / ...   -> <ol>
 *   - / • / *       -> <ul>
 *   blank line      -> new <p>
 * Falls back gracefully if input is plain prose.
 */

function renderInline(text: string): React.ReactNode[] {
  // Split by **bold** and `code` while keeping markers.
  const tokens: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      tokens.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      tokens.push(<code key={key++}>{tok.slice(1, -1)}</code>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) tokens.push(text.slice(last));
  return tokens;
}

interface Props { text: string }

export function Markdown({ text }: Props) {
  if (!text) return null;

  // Split into "blocks" — separated by blank lines.
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  const out: React.ReactNode[] = [];
  let key = 0;

  for (const block of blocks) {
    // Subheading: starts with ## or ###
    const h = block.match(/^#{2,4}\s+(.+)/);
    if (h) {
      out.push(<h4 key={key++} className="md-h">{renderInline(h[1].trim())}</h4>);
      const rest = block.slice(block.indexOf("\n") + 1).trim();
      if (rest) {
        renderListOrPara(rest, out, () => key++);
      }
      continue;
    }
    renderListOrPara(block, out, () => key++);
  }

  return <>{out}</>;
}

function renderListOrPara(block: string, out: React.ReactNode[], nextKey: () => number) {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

  // ordered list: lines start with "N." or "N)"
  const olMatch = lines.every((l) => /^\d+[.)]\s/.test(l));
  if (olMatch && lines.length >= 2) {
    const items = lines.map((l) => l.replace(/^\d+[.)]\s*/, ""));
    out.push(
      <ol key={nextKey()} className="md-ol">
        {items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}
      </ol>
    );
    return;
  }

  // unordered list: lines start with "-" or "•" or "*"
  const ulMatch = lines.every((l) => /^[-•*]\s/.test(l));
  if (ulMatch && lines.length >= 2) {
    const items = lines.map((l) => l.replace(/^[-•*]\s*/, ""));
    out.push(
      <ul key={nextKey()} className="md-ul">
        {items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}
      </ul>
    );
    return;
  }

  // paragraph (preserve internal soft breaks)
  out.push(
    <p key={nextKey()} className="md-p">
      {block.split("\n").map((ln, i, arr) => (
        <React.Fragment key={i}>
          {renderInline(ln)}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  );
}
