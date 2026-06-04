import React from "react";

/**
 * Markdown renderer for the paper-paradigm `proseMarkdown` field.
 *
 * That field arrives as ONE long line (no newlines): `# H1 ... ## H2 ... [^1]`
 * with footnote references `[^n]` inline and footnote definitions `[^n]: ...`
 * appended at the very end. This renderer:
 *   - splits on `# ` / `## ` / `### ` heading markers regardless of newlines
 *   - separates a heading from its trailing body prose with a small heuristic
 *   - splits `- ` bullet runs into <ul>
 *   - peels footnote definitions (`[^n]: text`) off the tail into a footnotes block
 *   - turns inline `[^n]` refs into superscript anchors, plus **bold** / `code`
 * Also works on normal multi-line markdown (headings on their own lines).
 */

interface FootnoteDef {
  id: string;
  text: string;
}

type Block = { level: number; heading?: string; text: string };

/** Render inline tokens: **bold**, `code`, and [^n] footnote refs. */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[\^[\w-]+\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(<strong key={`${keyBase}-b${k++}`}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(<code key={`${keyBase}-c${k++}`}>{tok.slice(1, -1)}</code>);
    } else {
      const id = tok.slice(2, -1);
      out.push(
        <sup key={`${keyBase}-f${k++}`} className="pm-fnref" id={`fnref-${id}`}>
          <a href={`#fn-${id}`}>[{id}]</a>
        </sup>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * In no-newline prose, find the index where a heading ends and its body begins.
 * Headings here are either a question ending in ？/?, a short phrase followed by
 * a "- " bullet run, or a short phrase followed by lead prose. -1 = whole = heading.
 */
function headingCut(rest: string, level: number): number {
  const q = rest.search(/[？?]/);
  if (q >= 0 && q < 60) return q + 1;
  const bullet = rest.search(/\s-\s+/);
  if (bullet > 0 && bullet < 60) return bullet;
  // Short phrase + prose: cut at first space inside the first ~24 chars that
  // precedes a CJK/uppercase prose start.
  const seam = rest.slice(0, 28).search(/(?<=[A-Za-z0-9）)」』”一-鿿])\s+(?=[一-鿿A-Z])/);
  if (seam > 0) return seam;
  if (level === 1) {
    const t = rest.search(/(?<=[A-Za-z0-9一-鿿])\s+(?=[一-鿿Tt])/);
    if (t > 0 && t < 60) return t;
  }
  const p = rest.search(/(?<=[。.!?！？])\s+/);
  return p > 0 ? p + 1 : -1;
}

/** Split into blocks keyed by heading markers (works with or without newlines). */
function splitBlocks(body: string): Block[] {
  const norm = body.replace(/\r\n/g, "\n").trim();
  const blocks: Block[] = [];
  // Find every heading marker position.
  const re = /(^|\s)(#{1,3})[ \t]+/g;
  const heads: Array<{ level: number; start: number; contentStart: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm))) {
    heads.push({ level: m[2].length, start: m.index + m[1].length, contentStart: re.lastIndex });
  }
  if (heads.length === 0) {
    if (norm) blocks.push({ level: 0, text: norm });
    return blocks;
  }
  // Leading paragraph before the first heading.
  const pre = norm.slice(0, heads[0].start).trim();
  if (pre) blocks.push({ level: 0, text: pre });

  for (let i = 0; i < heads.length; i++) {
    const cur = heads[i];
    const next = heads[i + 1];
    const rest = norm.slice(cur.contentStart, next ? next.start : norm.length).trim();
    const nl = rest.indexOf("\n");
    let heading: string;
    let text: string;
    if (nl !== -1) {
      heading = rest.slice(0, nl).trim();
      text = rest.slice(nl + 1).trim();
    } else {
      const cut = headingCut(rest, cur.level);
      if (cut > 0) {
        heading = rest.slice(0, cut).trim();
        text = rest.slice(cut).trim();
      } else {
        heading = rest;
        text = "";
      }
    }
    blocks.push({ level: cur.level, heading, text });
  }
  return blocks;
}

/** Peel footnote definitions `[^n]: ...` off the tail of the body. */
function extractFootnotes(body: string): { body: string; notes: FootnoteDef[] } {
  const notes: FootnoteDef[] = [];
  const firstDef = body.search(/\[\^[\w-]+\]:/);
  if (firstDef === -1) return { body, notes };
  const head = body.slice(0, firstDef);
  const tail = body.slice(firstDef);
  const re = /\[\^([\w-]+)\]:\s*/g;
  const matches: Array<{ id: string; start: number; defEnd: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(tail))) {
    matches.push({ id: m[1], start: m.index, defEnd: m.index + m[0].length });
  }
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const text = tail.slice(cur.defEnd, next ? next.start : undefined).trim();
    notes.push({ id: cur.id, text });
  }
  return { body: head.trim(), notes };
}

/** Render a non-heading text block: bullet list if all "- " items, else paragraphs. */
function renderTextBlock(text: string, keyBase: string): React.ReactNode {
  if (/(?:^|\s)-\s.+(?:\s-\s|\n-\s)/.test(text)) {
    const items = text
      .split(/(?:^|\n|\s)-\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length >= 2) {
      return (
        <ul key={keyBase} className="pm-ul">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it, `${keyBase}-li${i}`)}</li>
          ))}
        </ul>
      );
    }
  }
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <React.Fragment key={keyBase}>
      {paras.map((p, i) => (
        <p key={i} className="pm-p">
          {renderInline(p.replace(/\n/g, " "), `${keyBase}-p${i}`)}
        </p>
      ))}
    </React.Fragment>
  );
}

export function ProseMarkdown({ text, dropLeadingH1 = false }: { text: string; dropLeadingH1?: boolean }) {
  if (!text) return null;
  const { body, notes } = extractFootnotes(text);
  let blocks = splitBlocks(body);
  if (dropLeadingH1 && blocks.length > 0 && blocks[0].level === 1) {
    // The hero already shows the title; keep the H1's body prose (the opening
    // paragraph) but drop the title heading so a mis-split title isn't shown.
    const first = blocks[0];
    blocks = first.text ? [{ level: 0, text: first.text }, ...blocks.slice(1)] : blocks.slice(1);
  }
  const out: React.ReactNode[] = [];

  blocks.forEach((b, i) => {
    const keyBase = `pm-${i}`;
    if (b.level === 1) {
      out.push(<h1 key={`${keyBase}-h`} className="pm-h1">{renderInline(b.heading || "", `${keyBase}-h`)}</h1>);
    } else if (b.level === 2) {
      out.push(<h2 key={`${keyBase}-h`} className="pm-h2">{renderInline(b.heading || "", `${keyBase}-h`)}</h2>);
    } else if (b.level === 3) {
      out.push(<h3 key={`${keyBase}-h`} className="pm-h3">{renderInline(b.heading || "", `${keyBase}-h`)}</h3>);
    }
    if (b.text) out.push(renderTextBlock(b.text, `${keyBase}-t`));
  });

  return (
    <div className="pm">
      {out}
      {notes.length > 0 && (
        <section className="pm-footnotes" aria-label="脚注">
          <h2 className="pm-h2">脚注</h2>
          <ol className="pm-fnlist">
            {notes.map((n) => (
              <li key={n.id} id={`fn-${n.id}`} className="pm-fnitem">
                {renderInline(n.text, `fn-${n.id}`)}{" "}
                <a href={`#fnref-${n.id}`} className="pm-fnback" aria-label="返回正文">↩</a>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
