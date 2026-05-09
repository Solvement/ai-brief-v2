import { buildReadablePageTextFromHtml, extractHtmlMetadata, stripHtmlToText } from "../src/lib/ingestion/html-extract";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const html = `
<!doctype html>
<html>
  <head>
    <title>OpenAI launches a new model for enterprise agents</title>
    <meta name="description" content="OpenAI says the model improves tool use, lower latency, and enterprise controls.">
    <meta property="og:site_name" content="Example AI News">
    <meta property="article:published_time" content="2026-05-08T12:00:00Z">
    <meta name="author" content="Jane Reporter">
    <meta property="og:image" content="https://example.com/cover.jpg">
  </head>
  <body>
    <script>window.secret = "ignore me";</script>
    <article>
      <h1>OpenAI launches a new model</h1>
      <p>The company said the model improves tool-use reliability for agent workflows.</p>
      <p>Developers should compare latency, cost, and tool-call success rates before switching.</p>
    </article>
  </body>
</html>`;

const metadata = extractHtmlMetadata(html);
assert(metadata.title === "OpenAI launches a new model for enterprise agents", "metadata should extract title");
assert(metadata.description?.includes("tool use"), "metadata should extract description");
assert(metadata.siteName === "Example AI News", "metadata should extract site name");
assert(metadata.publishedTime === "2026-05-08T12:00:00Z", "metadata should extract published time");
assert(metadata.author === "Jane Reporter", "metadata should extract author");
assert(metadata.imageUrl === "https://example.com/cover.jpg", "metadata should extract image URL");

const stripped = stripHtmlToText(html);
assert(stripped.includes("tool-use reliability"), "stripped text should keep article body");
assert(!stripped.includes("window.secret"), "stripped text should remove scripts");

const readable = buildReadablePageTextFromHtml(html);
assert(readable.includes("Page title: OpenAI launches a new model"), "readable text should include title");
assert(readable.includes("Page description: OpenAI says"), "readable text should include description");
assert(readable.includes("Published: 2026-05-08T12:00:00Z"), "readable text should include publication time");
assert(readable.includes("Page text:"), "readable text should label body text");

console.log("html extraction tests passed");
