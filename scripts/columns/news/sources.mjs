import { fetchWithRetry } from "../../lib/http.mjs";

const DEFAULT_USER_AGENT = "Mozilla/5.0 (compatible; ai-brief/0.1; news aggregator)";
const DEFAULT_PER_SOURCE_LIMIT = 30;
const HN_POINTS_THRESHOLD = 8;
const HTML_TEXT_LIMIT = 220;
const OFFICIAL_SOURCE_NAMES = new Set(["OpenAI", "Anthropic", "Google DeepMind", "Mistral AI", "DeepSeek", "Qwen", "Meta AI", "xAI"]);

export const AI_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "llm",
  "large language model",
  "gpt",
  "openai",
  "anthropic",
  "claude",
  "gemini",
  "deepmind",
  "mistral",
  "deepseek",
  "qwen",
  "alibaba",
  "xai",
  "grok",
  "meta ai",
  "llama",
  "model",
  "agent",
  "agents",
  "rag",
  "inference",
  "multimodal",
  "benchmark",
  "eval",
  "gpu",
  "nvidia",
];

const RSS_SOURCES = [
  {
    id: "openai",
    name: "OpenAI",
    sourceType: "official",
    url: "https://openai.com/news/rss.xml",
    assumeAi: true,
  },
  {
    id: "techcrunch-ai",
    name: "TechCrunch AI",
    sourceType: "press",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    assumeAi: true,
  },
  {
    id: "venturebeat-ai",
    name: "VentureBeat AI",
    sourceType: "press",
    url: "https://venturebeat.com/category/ai/feed/",
    assumeAi: true,
  },
  {
    id: "the-verge-ai",
    name: "The Verge AI",
    sourceType: "press",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    assumeAi: true,
  },
];

const HTML_SOURCES = [
  {
    id: "anthropic",
    name: "Anthropic",
    sourceType: "official",
    url: "https://www.anthropic.com/news",
    baseUrl: "https://www.anthropic.com",
    pathIncludes: ["/news/"],
    assumeAi: true,
  },
  {
    id: "deepmind",
    name: "Google DeepMind",
    sourceType: "official",
    url: "https://deepmind.google/blog/",
    baseUrl: "https://deepmind.google",
    pathIncludes: ["/discover/blog/", "/blog/", "blog.google/innovation-and-ai/models-and-research/google-deepmind/"],
    assumeAi: true,
  },
  {
    id: "meta-ai",
    name: "Meta AI",
    sourceType: "official",
    url: "https://ai.meta.com/blog/",
    baseUrl: "https://ai.meta.com",
    pathIncludes: ["/blog/"],
    assumeAi: true,
  },
  {
    id: "mistral",
    name: "Mistral AI",
    sourceType: "official",
    url: "https://mistral.ai/news/",
    baseUrl: "https://mistral.ai",
    pathIncludes: ["/news/"],
    assumeAi: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    sourceType: "official",
    url: "https://www.deepseek.com/",
    baseUrl: "https://www.deepseek.com",
    assumeAi: true,
  },
  {
    id: "qwen",
    name: "Qwen",
    sourceType: "official",
    url: "https://qwenlm.github.io/blog/index.xml",
    baseUrl: "https://qwenlm.github.io",
    parser: "rss",
    pathIncludes: ["/blog/"],
    assumeAi: true,
  },
  {
    id: "xai",
    name: "xAI",
    sourceType: "official",
    url: "https://x.ai/news",
    baseUrl: "https://x.ai",
    fallbackUrls: ["https://x.ai/news/rss.xml"],
    pathIncludes: ["/news/"],
    assumeAi: true,
  },
];

const HN_TERMS = ["AI", "LLM", "GPT", "Claude", "Gemini", "model", "agent", "OpenAI", "Anthropic", "DeepSeek", "Qwen"];
const REDDIT_SOURCES = [
  { id: "reddit-local-llama", name: "r/LocalLLaMA", subreddit: "LocalLLaMA", sourceType: "reddit" },
  { id: "reddit-machine-learning", name: "r/MachineLearning", subreddit: "MachineLearning", sourceType: "reddit" },
];

export async function discoverNews(options = {}) {
  const perSourceLimit = numberOption(options.perSourceLimit, DEFAULT_PER_SOURCE_LIMIT);
  const logger = options.logger;
  const discoveredAt = nowIso(options);
  const sourceResults = await Promise.all([
    ...RSS_SOURCES.map((source) => fetchRssSource(source, { ...options, perSourceLimit, discoveredAt })),
    ...HTML_SOURCES.map((source) => fetchHtmlSource(source, { ...options, perSourceLimit, discoveredAt })),
    fetchHackerNews({ ...options, perSourceLimit, discoveredAt }),
    ...REDDIT_SOURCES.map((source) => fetchRedditSource(source, { ...options, perSourceLimit, discoveredAt })),
  ]);

  const items = [];
  const sourceStats = [];
  for (const result of sourceResults) {
    sourceStats.push(result.stat);
    if (result.items?.length) items.push(...result.items);
    if (!result.stat.ok) logger?.warn?.(`news source ${result.stat.id} failed: ${result.stat.error}`);
  }

  return { items, sourceStats, discoveredAt };
}

export async function fetchRssSource(source, options = {}) {
  try {
    const xml = await fetchText(source.url, options, `rss ${source.id}`, "application/rss+xml,application/atom+xml,application/xml;q=0.9,*/*;q=0.8");
    const items = parseRssItems(xml)
      .map((entry) => normalizeNewsItem({
        title: entry.title,
        source: source.name,
        sourceType: source.sourceType,
        url: entry.url,
        publishedAt: entry.publishedAt || options.discoveredAt,
        summary: entry.summary,
      }))
      .filter((item) => item && (source.assumeAi || isAiRelated(item)))
      .slice(0, options.perSourceLimit);
    return okSource(source, items);
  } catch (error) {
    return failedSource(source, error);
  }
}

export async function fetchHtmlSource(source, options = {}) {
  if (source.parser === "rss") return fetchRssSource(source, options);
  const urls = [source.url, ...(source.fallbackUrls || [])];
  const errors = [];
  for (const url of urls) {
    const fetchSource = { ...source, url };
    try {
      const html = await fetchText(url, options, `html ${source.id}`);
      const items = parseHtmlLinks(html, fetchSource)
        .map((entry) => normalizeNewsItem({
          title: entry.title,
          source: source.name,
          sourceType: source.sourceType,
          url: entry.url,
          publishedAt: entry.publishedAt || options.discoveredAt,
          summary: entry.summary,
        }))
        .filter((item) => item && (source.assumeAi || isAiRelated(item)))
        .slice(0, options.perSourceLimit);
      return okSource(source, items);
    } catch (error) {
      errors.push(error);
    }
  }
  return failedSource(source, combineErrors(errors, `No usable HTML source for ${source.id}`));
}

export async function fetchHackerNews(options = {}) {
  const source = { id: "hacker-news", name: "Hacker News", sourceType: "community" };
  const byUrl = new Map();
  const termStats = [];
  await Promise.all(HN_TERMS.map(async (term) => {
    const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
    url.searchParams.set("tags", "story");
    url.searchParams.set("query", term);
    url.searchParams.set("hitsPerPage", String(options.perSourceLimit));
    try {
      const data = await fetchJson(url, options, `hn ${term}`);
      const hits = Array.isArray(data.hits) ? data.hits : [];
      for (const hit of hits) {
        const points = Number(hit.points) || 0;
        const storyUrl = hit.url || (hit.objectID ? `https://news.ycombinator.com/item?id=${hit.objectID}` : "");
        const item = normalizeNewsItem({
          title: hit.title || hit.story_title,
          source: source.name,
          sourceType: source.sourceType,
          url: storyUrl,
          publishedAt: hit.created_at || options.discoveredAt,
          points,
        });
        if (!item || points < HN_POINTS_THRESHOLD || !isAiRelated(item)) continue;
        const key = normalizeUrl(item.url) || normalizeTitle(item.title);
        if (!byUrl.has(key)) byUrl.set(key, item);
      }
      termStats.push({ term, ok: true, count: hits.length });
    } catch (error) {
      termStats.push({ term, ok: false, error: error.message || String(error) });
    }
  }));
  const items = [...byUrl.values()]
    .sort(compareNewsItems)
    .slice(0, options.perSourceLimit);
  const failures = termStats.filter((stat) => !stat.ok);
  return {
    items,
    stat: {
      id: source.id,
      source: source.name,
      sourceType: source.sourceType,
      ok: failures.length < HN_TERMS.length,
      count: items.length,
      error: failures.length ? `${failures.length}/${HN_TERMS.length} term searches failed` : "",
    },
  };
}

export async function fetchRedditSource(source, options = {}) {
  const attempts = [
    { kind: "rss", url: `https://www.reddit.com/r/${source.subreddit}/.rss` },
    { kind: "rss", url: `https://old.reddit.com/r/${source.subreddit}/.rss` },
    { kind: "json", url: `https://www.reddit.com/r/${source.subreddit}/top.json?t=day&limit=${options.perSourceLimit}` },
    { kind: "json", url: `https://old.reddit.com/r/${source.subreddit}/top.json?t=day&limit=${options.perSourceLimit}` },
  ];
  const errors = [];
  for (const attempt of attempts) {
    try {
      const items = attempt.kind === "json"
        ? await fetchRedditJsonItems(attempt.url, source, options)
        : await fetchRedditRssItems(attempt.url, source, options);
      return okSource(source, items);
    } catch (error) {
      errors.push(error);
    }
  }
  return failedSource(source, combineErrors(errors, `No usable Reddit source for ${source.subreddit}`));
}

async function fetchRedditJsonItems(url, source, options) {
  const data = await fetchJson(url, { ...options, cache: "no-store" }, `reddit ${source.subreddit}`);
  const children = Array.isArray(data?.data?.children) ? data.data.children : [];
  return children
    .map((child) => child?.data || {})
    .map((post) => normalizeNewsItem({
      title: post.title,
      source: source.name,
      sourceType: source.sourceType,
      url: post.url_overridden_by_dest || (post.permalink ? `https://www.reddit.com${post.permalink}` : ""),
      publishedAt: post.created_utc ? new Date(Number(post.created_utc) * 1000).toISOString() : options.discoveredAt,
      score: Number(post.score) || 0,
    }))
    .filter((item) => item && isAiRelated(item))
    .slice(0, options.perSourceLimit);
}

async function fetchRedditRssItems(url, source, options) {
  const xml = await fetchText(url, { ...options, cache: "no-store" }, `reddit rss ${source.subreddit}`, "application/rss+xml,application/atom+xml,application/xml;q=0.9,*/*;q=0.8");
  return parseRssItems(xml)
    .map((entry) => normalizeNewsItem({
      title: entry.title,
      source: source.name,
      sourceType: source.sourceType,
      url: entry.url,
      publishedAt: entry.publishedAt || options.discoveredAt,
      summary: entry.summary,
    }))
    .filter((item) => item && isAiRelated(item))
    .slice(0, options.perSourceLimit);
}

export function normalizeNewsItem(input = {}) {
  const title = cleanText(input.title);
  const url = normalizeAbsoluteUrl(input.url);
  if (!title || !url) return null;
  const out = {
    title,
    source: cleanText(input.source),
    sourceType: cleanText(input.sourceType),
    url,
    publishedAt: normalizeDate(input.publishedAt),
  };
  if (Number.isFinite(Number(input.points))) out.points = Number(input.points);
  if (Number.isFinite(Number(input.score))) out.score = Number(input.score);
  const summary = cleanText(input.summary);
  if (summary) out.summary = summary.slice(0, HTML_TEXT_LIMIT);
  const titleZh = cleanText(input.titleZh);
  if (titleZh) out.titleZh = titleZh;
  const summaryZh = cleanText(input.summaryZh);
  if (summaryZh && title) out.summaryZh = summaryZh;
  const imageUrl = normalizeAbsoluteUrl(input.imageUrl);
  if (imageUrl) out.imageUrl = imageUrl;
  return out;
}

export function dedupeNewsItems(items = []) {
  const byUrl = new Map();
  const byTitle = new Map();
  for (const raw of items) {
    const item = normalizeNewsItem(raw);
    if (!item) continue;
    const urlKey = normalizeUrl(item.url);
    const titleKey = normalizeTitle(item.title);
    const existingKey = byUrl.has(urlKey) ? urlKey : titleKey && byTitle.get(titleKey);
    if (existingKey) {
      const merged = choosePreferredItem(byUrl.get(existingKey), item);
      byUrl.set(existingKey, merged);
      byTitle.set(normalizeTitle(merged.title), existingKey);
      continue;
    }
    byUrl.set(urlKey, item);
    if (titleKey) byTitle.set(titleKey, urlKey);
  }
  return [...byUrl.values()].sort(compareNewsItems);
}

export function isAiRelated(item = {}) {
  const text = `${item.title || ""} ${item.summary || ""} ${item.url || ""}`.toLowerCase();
  return AI_KEYWORDS.some((keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  });
}

export function normalizeUrl(value) {
  const absolute = normalizeAbsoluteUrl(value);
  if (!absolute) return "";
  try {
    const url = new URL(absolute);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref$)/i.test(key)) url.searchParams.delete(key);
    }
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeTitle(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/['"“”‘’]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\b(ai|llm|gpt)\b/g, (match) => match)
    .trim();
}

export function parseRssItems(xml) {
  const text = String(xml || "");
  const blocks = matchBlocks(text, "item").concat(matchBlocks(text, "entry"));
  return blocks.map((block) => ({
    title: decodeEntities(firstTag(block, "title")),
    url: decodeEntities(firstTag(block, "link") || firstAtomLink(block)),
    publishedAt: decodeEntities(firstTag(block, "pubDate") || firstTag(block, "published") || firstTag(block, "updated") || firstTag(block, "dc:date")),
    summary: htmlToText(decodeEntities(firstTag(block, "description") || firstTag(block, "summary") || firstTag(block, "content:encoded"))),
  })).filter((item) => item.title && item.url);
}

export function parseHtmlLinks(html, source) {
  const text = String(html || "");
  if (source?.id === "deepmind") return parseDeepMindLinks(text, source);
  const out = [];
  const seen = new Set();
  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRe.exec(text))) {
    const rawHref = decodeEntities(match[1]);
    const title = cleanText(htmlToText(match[2]));
    if (!looksLikeNewsTitle(title)) continue;
    const url = normalizeAbsoluteUrl(rawHref, source.baseUrl || source.url);
    if (!url || seen.has(url) || isAssetUrl(url) || !matchesSourcePath(url, source)) continue;
    seen.add(url);
    const around = text.slice(Math.max(0, match.index - 500), Math.min(text.length, match.index + 800));
    out.push({
      title,
      url,
      publishedAt: extractDate(`${match[2]} ${around}`),
      summary: "",
    });
  }
  return out;
}

export function mergeWithExisting(existingItems = [], discoveredItems = [], options = {}) {
  const generatedAt = nowIso(options);
  const retentionDays = numberOption(options.retentionDays, 14);
  const retentionLimit = numberOption(options.retentionLimit, 300);
  const dailyCap = numberOption(options.dailyCap, 0);
  const cutoffMs = Date.parse(generatedAt) - retentionDays * 24 * 60 * 60 * 1000;
  const merged = dedupeNewsItems([...discoveredItems, ...existingItems])
    .filter((item) => isAiRelated(item) && !isNavigationItem(item))
    .filter((item) => {
      const time = Date.parse(item.publishedAt);
      return !Number.isFinite(time) || time >= cutoffMs;
    });
  return capItemsByDay(merged, dailyCap)
    .slice(0, retentionLimit);
}

export function compareNewsItems(left, right) {
  const leftTime = Date.parse(left?.publishedAt || "") || 0;
  const rightTime = Date.parse(right?.publishedAt || "") || 0;
  if (rightTime !== leftTime) return rightTime - leftTime;
  return String(left?.title || "").localeCompare(String(right?.title || ""));
}

export function compareNewsImportance(left, right) {
  const leftTier = importanceTier(left);
  const rightTier = importanceTier(right);
  if (leftTier !== rightTier) return leftTier - rightTier;
  const leftEngagement = Number(left?.points ?? left?.score) || 0;
  const rightEngagement = Number(right?.points ?? right?.score) || 0;
  if (rightEngagement !== leftEngagement) return rightEngagement - leftEngagement;
  return compareNewsItems(left, right);
}

export function capItemsByDay(items = [], dailyCap = 0) {
  const cap = Math.max(0, Math.floor(Number(dailyCap) || 0));
  const byDay = new Map();
  for (const item of items) {
    const day = publishedDay(item) || "unknown";
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(item);
  }
  return [...byDay.entries()]
    .sort(([leftDay], [rightDay]) => rightDay.localeCompare(leftDay))
    .flatMap(([, dayItems]) => dayItems
      .sort(compareNewsImportance)
      .slice(0, cap || undefined));
}

function choosePreferredItem(left, right) {
  const leftOfficial = left.sourceType === "official";
  const rightOfficial = right.sourceType === "official";
  if (leftOfficial !== rightOfficial) return leftOfficial ? left : right;
  const leftTime = Date.parse(left.publishedAt) || Number.MAX_SAFE_INTEGER;
  const rightTime = Date.parse(right.publishedAt) || Number.MAX_SAFE_INTEGER;
  if (leftTime !== rightTime) return leftTime <= rightTime ? left : right;
  const leftScore = Number(left.points ?? left.score) || 0;
  const rightScore = Number(right.points ?? right.score) || 0;
  return rightScore > leftScore ? right : left;
}

async function fetchText(url, options = {}, label = String(url), accept = "text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8") {
  const response = await fetchWithRetry(url, { headers: requestHeaders(options, accept), cache: options.cache }, {
    logger: options.logger,
    label,
  });
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status}`);
  return response.text();
}

async function fetchJson(url, options = {}, label = String(url)) {
  const response = await fetchWithRetry(url, { headers: requestHeaders(options, "application/json,*/*;q=0.8"), cache: options.cache }, {
    logger: options.logger,
    label,
  });
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status}`);
  return response.json();
}

function requestHeaders(options = {}, accept) {
  return {
    accept,
    "user-agent": options.userAgent || DEFAULT_USER_AGENT,
  };
}

function okSource(source, items) {
  return {
    items,
    stat: {
      id: source.id,
      source: source.name,
      sourceType: source.sourceType,
      ok: true,
      count: items.length,
      error: "",
    },
  };
}

function parseDeepMindLinks(html, source) {
  const out = [];
  const seen = new Set();
  const articleRe = /<article\b[\s\S]*?<\/article>/gi;
  for (const articleMatch of html.matchAll(articleRe)) {
    const block = articleMatch[0];
    const href = firstAttr(block, "href");
    const title = cleanText(htmlToText(firstClassBlock(block, "card__title") || firstTag(block, "h3") || firstTag(block, "h2")));
    const url = normalizeAbsoluteUrl(href, source.baseUrl || source.url);
    if (!url || !title || seen.has(url) || isAssetUrl(url) || !matchesSourcePath(url, source)) continue;
    seen.add(url);
    out.push({
      title,
      url,
      publishedAt: firstAttr(block, "datetime") || extractDate(block),
      summary: "",
    });
  }
  if (out.length) return out;
  return parseGenericDataEventLinks(html, source);
}

function parseGenericDataEventLinks(html, source) {
  const out = [];
  const seen = new Set();
  const re = /data-event-content-name=["']([^"']+?)\s+-\s+Learn more["'][\s\S]{0,700}?href=["']([^"']+)["']/gi;
  for (const match of html.matchAll(re)) {
    const title = cleanText(match[1]);
    const url = normalizeAbsoluteUrl(decodeEntities(match[2]), source.baseUrl || source.url);
    if (!url || !title || seen.has(url) || isAssetUrl(url) || !matchesSourcePath(url, source)) continue;
    seen.add(url);
    const around = html.slice(Math.max(0, match.index - 500), Math.min(html.length, match.index + 900));
    out.push({ title, url, publishedAt: extractDate(around), summary: "" });
  }
  return out;
}

function failedSource(source, error) {
  return {
    items: [],
    stat: {
      id: source.id,
      source: source.name,
      sourceType: source.sourceType,
      ok: false,
      count: 0,
      error: error.message || String(error),
    },
  };
}

function combineErrors(errors = [], fallbackMessage) {
  const messages = errors
    .map((error) => error?.message || String(error))
    .filter(Boolean);
  return new Error(messages.length ? messages.join("; ") : fallbackMessage);
}

function matchBlocks(text, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  return [...text.matchAll(re)].map((match) => match[1]);
}

function firstTag(text, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i");
  const match = re.exec(text);
  return match ? stripCdata(match[1]).trim() : "";
}

function firstAttr(text, attr) {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}=["']([^"']+)["']`, "i");
  const match = re.exec(text);
  return match ? decodeEntities(match[1]).trim() : "";
}

function firstClassBlock(text, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<([a-z0-9]+)\\b[^>]*class=["'][^"']*${escaped}[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`, "i");
  const match = re.exec(text);
  return match ? match[2] : "";
}

function firstAtomLink(text) {
  const href = text.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return href ? href[1] : "";
}

function stripCdata(value) {
  return String(value || "").replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function cleanText(value) {
  return decodeEntities(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeNewsTitle(title) {
  const text = cleanText(title);
  if (text.length < 12 || text.length > 180) return false;
  if (isNavigationTitle(text)) return false;
  return /[a-z0-9\u4e00-\u9fff]/i.test(text);
}

function matchesSourcePath(url, source = {}) {
  if (!Array.isArray(source.pathIncludes) || source.pathIncludes.length === 0) return true;
  try {
    const parsed = new URL(url);
    const base = new URL(source.baseUrl || source.url);
    return source.pathIncludes.some((part) => {
      if (/^[a-z0-9.-]+\//i.test(part)) {
        return `${parsed.hostname}${parsed.pathname}`.includes(part);
      }
      return parsed.hostname === base.hostname && parsed.pathname.includes(part);
    });
  } catch {
    return false;
  }
}

function isNavigationItem(item = {}) {
  return isNavigationTitle(item.title) || isKnownNonNewsUrl(item.url) || isOfficialNonArticleUrl(item);
}

function isNavigationTitle(title) {
  const text = cleanText(title);
  return /^(home|blog|news|careers|privacy|terms|contact|subscribe|learn more|read more|read all news|api reference|documentation|docs|build with gemini|deepseek\s*网页版)$/i.test(text)
    || /ICP备|公网安备|开放平台|开始对话|调用\s*DeepSeek|体验全新旗舰模型/i.test(text);
}

function isKnownNonNewsUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "chat.deepseek.com" || host === "platform.deepseek.com" || host === "docs.mistral.ai") return true;
    if (host === "download.deepseek.com") return true;
    if (host === "support.claude.com") return true;
    if (host === "github.com" && url.pathname.toLowerCase().startsWith("/deepseek-ai/")) return true;
    if (host === "mistral.ai" && /^\/(?:products|contact)(?:\/|$)/i.test(url.pathname)) return true;
    if (host === "claude.com") return true;
    if (host === "aistudio.google.com") return true;
    return false;
  } catch {
    return false;
  }
}

function isOfficialNonArticleUrl(item = {}) {
  if (item.sourceType !== "official") return false;
  try {
    const url = new URL(item.url);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "mp.weixin.qq.com") return false;
    return !/(^|\/)(news|blog|research|posts?|articles?)(\/|$)/i.test(url.pathname);
  } catch {
    return true;
  }
}

function importanceTier(item = {}) {
  if (item.sourceType === "official" && OFFICIAL_SOURCE_NAMES.has(item.source)) return 0;
  if (item.source === "Hacker News" || (item.sourceType === "press" && Number(item.points) > 0)) return 1;
  return 2;
}

function publishedDay(item = {}) {
  const time = Date.parse(item.publishedAt || "");
  if (!Number.isFinite(time)) return "";
  return new Date(time).toISOString().slice(0, 10);
}

function normalizeAbsoluteUrl(value, base) {
  const raw = cleanText(value);
  if (!raw || raw.startsWith("mailto:") || raw.startsWith("javascript:")) return "";
  try {
    return new URL(raw, base).toString();
  } catch {
    return "";
  }
}

function isAssetUrl(url) {
  return /\.(png|jpe?g|gif|svg|webp|pdf|zip)(?:$|[?#])/i.test(url);
}

function normalizeDate(value) {
  const raw = cleanText(value);
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  return new Date().toISOString();
}

function extractDate(text) {
  const iso = String(text || "").match(/\b20\d{2}-\d{2}-\d{2}\b/);
  if (iso) return iso[0];
  const datetime = String(text || "").match(/datetime=["']([^"']+)["']/i);
  if (datetime) return datetime[1];
  const month = String(text || "").match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+20\d{2}\b/i);
  return month ? month[0] : "";
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}
