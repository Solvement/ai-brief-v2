import { test } from "node:test";
import assert from "node:assert";
import {
  capItemsByDay,
  dedupeNewsItems,
  isAiRelated,
  mergeWithExisting,
  normalizeNewsItem,
  normalizeTitle,
  normalizeUrl,
  parseHtmlLinks,
  parseRssItems,
} from "../columns/news/sources.mjs";
import { buildNewsHealth, parseArgs as parseNewsDailyArgs } from "../columns/news/daily.mjs";

test("normalizes news items and strips tracking from dedupe URLs", () => {
  const item = normalizeNewsItem({
    title: "  OpenAI launches a new agent model  ",
    source: "OpenAI",
    sourceType: "official",
    url: "https://openai.com/news/example/?utm_source=x#section",
    publishedAt: "2026-06-03T10:00:00Z",
    points: "42",
  });

  assert.equal(item.title, "OpenAI launches a new agent model");
  assert.equal(item.points, 42);
  assert.equal(normalizeUrl(item.url), "https://openai.com/news/example");
  assert.equal(isAiRelated(item), true);
  assert.equal(normalizeTitle("OpenAI launches: a new agent model!"), "openai launches a new agent model");
});

test("dedupes by normalized URL and title, preferring official and earliest items", () => {
  const items = dedupeNewsItems([
    {
      title: "OpenAI launches a new agent model",
      source: "Tech Press",
      sourceType: "press",
      url: "https://example.com/openai-agent?utm_campaign=x",
      publishedAt: "2026-06-03T12:00:00Z",
    },
    {
      title: "OpenAI launches a new agent model",
      source: "OpenAI",
      sourceType: "official",
      url: "https://openai.com/news/openai-agent",
      publishedAt: "2026-06-03T13:00:00Z",
    },
    {
      title: "Different Claude model story",
      source: "Hacker News",
      sourceType: "community",
      url: "https://news.ycombinator.com/item?id=1",
      publishedAt: "2026-06-03T14:00:00Z",
      points: 99,
    },
  ]);

  assert.equal(items.length, 2);
  assert.equal(items.find((item) => item.title.includes("OpenAI")).source, "OpenAI");
});

test("parses RSS items without an XML dependency", () => {
  const items = parseRssItems(`
    <rss><channel><item>
      <title><![CDATA[Anthropic releases Claude update]]></title>
      <link>https://www.anthropic.com/news/claude-update</link>
      <pubDate>Wed, 03 Jun 2026 10:00:00 GMT</pubDate>
      <description><![CDATA[<p>Model update details.</p>]]></description>
    </item></channel></rss>
  `);

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Anthropic releases Claude update");
  assert.equal(items[0].summary, "Model update details.");
});

test("retention keeps recent deduped items and caps the rolling feed", () => {
  const items = mergeWithExisting([
    {
      title: "Old AI model item",
      source: "Archive",
      sourceType: "press",
      url: "https://example.com/old",
      publishedAt: "2026-05-01T00:00:00Z",
    },
  ], [
    {
      title: "New Gemini agent item",
      source: "Press",
      sourceType: "press",
      url: "https://example.com/new",
      publishedAt: "2026-06-03T00:00:00Z",
    },
  ], {
    retentionDays: 14,
    retentionLimit: 10,
    now: () => "2026-06-04T00:00:00Z",
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "New Gemini agent item");
});

test("daily cap keeps each retained day digestible and ranks official sources first", () => {
  const items = mergeWithExisting([], [
    {
      title: "Community discussion about Gemini agents",
      source: "Hacker News",
      sourceType: "community",
      url: "https://news.ycombinator.com/item?id=1",
      publishedAt: "2026-06-03T11:00:00Z",
      points: 120,
    },
    {
      title: "OpenAI announces a new agent model",
      source: "OpenAI",
      sourceType: "official",
      url: "https://openai.com/news/agent-model",
      publishedAt: "2026-06-03T10:00:00Z",
    },
    {
      title: "Press report on Claude model updates",
      source: "TechCrunch AI",
      sourceType: "press",
      url: "https://techcrunch.com/claude-model-update",
      publishedAt: "2026-06-03T12:00:00Z",
    },
    {
      title: "Meta AI releases Llama agent update",
      source: "Meta AI",
      sourceType: "official",
      url: "https://ai.meta.com/blog/llama-agent-update",
      publishedAt: "2026-06-02T12:00:00Z",
    },
    {
      title: "Another press AI model item",
      source: "VentureBeat AI",
      sourceType: "press",
      url: "https://venturebeat.com/ai/model-item",
      publishedAt: "2026-06-02T13:00:00Z",
    },
  ], {
    dailyCap: 2,
    retentionDays: 14,
    retentionLimit: 10,
    now: () => "2026-06-04T00:00:00Z",
  });

  assert.equal(items.length, 4);
  assert.equal(items.filter((item) => item.publishedAt.startsWith("2026-06-03")).length, 2);
  assert.equal(items[0].source, "OpenAI");
  assert.equal(items[1].source, "Hacker News");
});

test("daily cap can be disabled for after-dedupe counts", () => {
  const items = capItemsByDay([
    { title: "OpenAI model one", source: "OpenAI", sourceType: "official", url: "https://openai.com/news/one", publishedAt: "2026-06-03T00:00:00Z" },
    { title: "OpenAI model two", source: "OpenAI", sourceType: "official", url: "https://openai.com/news/two", publishedAt: "2026-06-03T01:00:00Z" },
  ], 0);

  assert.equal(items.length, 2);
});

test("parses DeepMind card titles from hydrated HTML", () => {
  const items = parseHtmlLinks(`
    <article class="card card-blog">
      <a aria-label="Learn more" href="/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/"></a>
      <div class="card__content">
        <h3 class="heading-6 card__title">AlphaEvolve: A Gemini-powered coding agent for designing advanced algorithms</h3>
        <time datetime="May 2026">May 2026</time>
      </div>
    </article>
  `, {
    id: "deepmind",
    url: "https://deepmind.google/blog/",
    baseUrl: "https://deepmind.google",
    pathIncludes: ["/blog/"],
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "AlphaEvolve: A Gemini-powered coding agent for designing advanced algorithms");
});

test("news daily args include daily cap option and env default", () => {
  assert.equal(parseNewsDailyArgs(["--daily-cap", "12"]).dailyCap, 12);
  assert.equal(parseNewsDailyArgs([]).enableLlm, false);
  assert.equal(parseNewsDailyArgs(["--enable-llm"]).enableLlm, true);
});

test("news health passes with fresh generated-day items and partial source failures", () => {
  const health = buildNewsHealth({
    generatedAt: "2026-06-11T12:00:00.000Z",
    sourceStats: [
      { id: "openai", source: "OpenAI", ok: false, count: 0, error: "fetch failed" },
      { id: "techcrunch-ai", source: "TechCrunch AI", ok: true, count: 5, error: "" },
    ],
    totalDiscovered: 5,
    totalPublished: 12,
    totalPublishedForGeneratedDay: 3,
  }, {
    now: () => new Date("2026-06-11T13:00:00.000Z"),
  });

  assert.equal(health.ok, true);
  assert.equal(health.status, "pass");
  assert.equal(health.failedSourceCount, 1);
});

test("news health fails stale or empty all-source runs", () => {
  const health = buildNewsHealth({
    generatedAt: "2026-06-08T12:00:00.000Z",
    sourceStats: [
      { id: "openai", source: "OpenAI", ok: false, count: 0, error: "fetch failed" },
      { id: "hacker-news", source: "Hacker News", ok: false, count: 0, error: "timeout" },
    ],
    totalDiscovered: 0,
    totalPublished: 10,
    totalPublishedForGeneratedDay: 0,
  }, {
    now: () => new Date("2026-06-11T13:00:00.000Z"),
  });

  assert.equal(health.ok, false);
  assert.equal(health.status, "fail");
  assert.match(health.failures.join("\n"), /freshness/);
  assert.match(health.failures.join("\n"), /source-availability/);
  assert.match(health.failures.join("\n"), /discovery-nonempty/);
  assert.match(health.failures.join("\n"), /generated-day-nonempty/);
});
