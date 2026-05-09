export interface HtmlMetadata {
  title?: string;
  description?: string;
  siteName?: string;
  publishedTime?: string;
  author?: string;
  imageUrl?: string;
}

export function decodeHtmlEntities(value = ""): string {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_match, code) => {
      const point = Number(code);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
      const point = Number.parseInt(code, 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtmlToText(html = ""): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<\/?(article|section|main|header|footer|aside|div|p|h[1-6]|li|ul|ol|br)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

export function extractHtmlMetadata(html = ""): HtmlMetadata {
  const title = decodeHtmlEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  return {
    title: firstNonEmpty(getMetaContent(html, "property", "og:title"), getMetaContent(html, "name", "twitter:title"), title),
    description: firstNonEmpty(
      getMetaContent(html, "name", "description"),
      getMetaContent(html, "property", "og:description"),
      getMetaContent(html, "name", "twitter:description"),
    ),
    siteName: getMetaContent(html, "property", "og:site_name"),
    publishedTime: firstNonEmpty(getMetaContent(html, "property", "article:published_time"), getMetaContent(html, "name", "pubdate")),
    author: firstNonEmpty(getMetaContent(html, "name", "author"), getMetaContent(html, "property", "article:author")),
    imageUrl: firstNonEmpty(getMetaContent(html, "property", "og:image"), getMetaContent(html, "name", "twitter:image")),
  };
}

export function buildReadablePageTextFromHtml(html = "", maxBodyCharacters = 10000): string {
  const metadata = extractHtmlMetadata(html);
  const bodyText = stripHtmlToText(html).slice(0, maxBodyCharacters);
  return [
    metadata.title ? `Page title: ${metadata.title}` : "",
    metadata.description ? `Page description: ${metadata.description}` : "",
    metadata.siteName ? `Site: ${metadata.siteName}` : "",
    metadata.publishedTime ? `Published: ${metadata.publishedTime}` : "",
    metadata.author ? `Author: ${metadata.author}` : "",
    bodyText ? `Page text:\n${bodyText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => Boolean(value?.trim()));
}

function getMetaContent(html: string, matchAttribute: "name" | "property", expectedValue: string): string | undefined {
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag[0]);
    if (attributes[matchAttribute]?.toLowerCase() === expectedValue.toLowerCase()) {
      return decodeHtmlEntities(attributes.content ?? "");
    }
  }
  return undefined;
}

function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}
