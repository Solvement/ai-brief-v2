import { dedupeImportedItems, importManualJson, normalizeRssItems, type Source } from "../src/lib/ingestion";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const source: Source = {
  id: "source-local",
  name: "Local Manual Source",
  url: "https://example.com/feed",
  source_type: "official",
  language: "zh",
  reliability_level: 4,
  enabled: true,
  last_checked_at: undefined,
};

const result = importManualJson(source, [
  {
    title: "Local model update",
    url: "https://example.com/local-model-update",
    summary: "A model update that should be reviewed before publishing.",
    content_type: "model",
    tags: ["AI Coding"],
  },
]);

assert(result.items.length === 1, "manual JSON import should produce one item");
assert(result.items[0].status === "draft", "imported items should be draft by default");
assert(result.items[0].source_name === source.name, "imported items should retain source name");
assert(result.logs[0].level === "info", "successful import should log info");

const duplicates = dedupeImportedItems([...result.items, { ...result.items[0], id: "duplicate" }]);
assert(duplicates.length === 1, "dedupe should remove duplicate canonical URL/title entries");

const rssItems = normalizeRssItems(source, "<rss><channel><item><title>RSS Item</title><link>https://example.com/rss-item</link><description>RSS summary</description></item></channel></rss>");
assert(rssItems.items.length === 1, "RSS structure should normalize item entries");
assert(rssItems.items[0].status === "draft", "RSS items should be draft by default");

const badImport = importManualJson(source, [{ url: "https://example.com/missing-title" }]);
assert(badImport.logs.some((log) => log.level === "error"), "invalid rows should log errors without crashing");
