import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function loadDotEnvLocal() {
  const envPath = resolve(".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function compileForNode() {
  const tsc = join("node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.test.json"], { stdio: "inherit" });
}

function htmlToText(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function inferTitle(text, url) {
  const firstHeading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (firstHeading) return firstHeading.slice(0, 120);
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ").slice(0, 120) || url;
  } catch {
    return url;
  }
}

loadDotEnvLocal();

if (process.env.EVALUATOR_LIVE !== "1") {
  throw new Error("Run with EVALUATOR_LIVE=1 so this smoke uses the real evaluator provider.");
}
if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error("EVALUATOR_LIVE=1 requires DEEPSEEK_API_KEY in .env.local or the environment.");
}

const url = process.argv[2];
const contentType = process.argv[3] ?? "article";
const sourceType = process.argv[4] ?? "unknown";
if (!url) {
  throw new Error("Usage: EVALUATOR_LIVE=1 node scripts/eval-url-smoke.mjs <url> [content_type] [source_type]");
}

compileForNode();

const response = await fetch(url, { headers: { "user-agent": "AI-brief evaluator smoke" } });
if (!response.ok) throw new Error(`Fetch failed with ${response.status}: ${url}`);
const raw = await response.text();
const contentTypeHeader = response.headers.get("content-type") ?? "";
const text = (contentTypeHeader.includes("html") ? htmlToText(raw) : raw.replace(/\s+/g, " ").trim()).slice(0, 6000);
if (text.length < 200) throw new Error(`Fetched text is too short for evaluation: ${text.length} chars.`);

const { evaluateContent } = await import(pathToFileURL(resolve(".tmp/test-build/src/lib/ai/evaluation/index.js")).href);

const result = await evaluateContent(
  {
    content_type: contentType,
    title: inferTitle(raw, url),
    sources: [
      {
        id: "source_1",
        url,
        source_name: new URL(url).hostname,
        source_type: sourceType,
        text,
      },
    ],
    metadata: {
      source_type: sourceType,
      source_count: 1,
      has_official_source: sourceType === "official",
      collected_at: new Date().toISOString(),
    },
    input_quality: text.length > 2500 ? "raw_full_text" : "raw_excerpt",
  },
  { cacheKeyExtra: `url-smoke-${url}` },
);

console.log(JSON.stringify({ url, text_length: text.length, evaluation: result }, null, 2));
