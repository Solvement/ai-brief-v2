import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const viewsPath = resolve(root, "src/lib/content/views.ts");
const seedPath = resolve(root, "src/lib/content/seed.ts");
const livePath = resolve(root, "src/lib/content/live.generated.ts");

const views = await readFile(viewsPath, "utf8");
const seed = await readFile(seedPath, "utf8");
const live = await readFile(livePath, "utf8");

const requiredViewFields = [
  "title",
  "one_sentence_takeaway",
  "why_it_matters",
  "content_type",
  "target_audience",
  "reading_time",
  "action_label",
  "impact_score",
  "readability_score",
  "actionability_score",
  "confidence_score",
  "source_name",
  "source_url",
  "published_at",
];

const missingFromViews = requiredViewFields.filter((field) => !views.includes(`${field}:`));
if (missingFromViews.length > 0) {
  throw new Error(`Card view model is missing required fields: ${missingFromViews.join(", ")}`);
}

const requiredSeedFields = [
  "title",
  "one_sentence_takeaway",
  "why_it_matters",
  "content_type",
  "target_audience",
  "impact_score",
  "readability_score",
  "actionability_score",
  "confidence_score",
  "source_name",
  "source_url",
];

const missingFromSeed = requiredSeedFields.filter((field) => !seed.includes(`${field}:`));
if (missingFromSeed.length > 0) {
  throw new Error(`Seed data is missing required ContentItem fields: ${missingFromSeed.join(", ")}`);
}

const scoreMatches = [...seed.matchAll(/(?:impact|readability|actionability|confidence)_score:\s*(\d+)/g)];
const invalidScores = scoreMatches
  .map((match) => Number(match[1]))
  .filter((score) => score < 0 || score > 100);

if (invalidScores.length > 0) {
  throw new Error(`Scores must be between 0 and 100. Invalid values: ${invalidScores.join(", ")}`);
}

const liveMatch = live.match(/export const liveContentItems: AnyContentItem\[] = ([\s\S]*);\s*$/);
if (!liveMatch) {
  throw new Error("Unable to parse live.generated.ts");
}

const liveItems = JSON.parse(liveMatch[1]);
if (!Array.isArray(liveItems)) {
  throw new Error("live.generated.ts must export an array");
}

const requiredLiveFields = [
  "id",
  "slug",
  "title",
  "summary",
  "one_sentence_takeaway",
  "why_it_matters",
  "content_type",
  "target_audience",
  "source_name",
  "source_url",
  "source_column",
  "published_at",
  "collected_at",
  "readability_score",
  "impact_score",
  "actionability_score",
  "confidence_score",
  "recommended_action",
  "prompt_version",
  "detail_depth",
  "deep_dive_status",
  "key_facts",
  "risks",
  "next_steps",
];

function hasUiScrapeJunk(value = "") {
  return [
    /\brole=checkbox\b/i,
    /\baria-[a-z-]+=/i,
    /\bdata-testid\b/i,
    /\bclass(Name)?=/i,
    /\bstyle=/i,
    /<\/?(div|span|button|input|script|style|svg|img|a|p|ul|li|section|article|header|footer|main|form|label|select|option|textarea)(\s|>|\/)/i,
    /\b(function|const|let|var)\s+[a-z0-9_$]*\s*[=(]/i,
    /\b(window|document)\./i,
    /\{[^}]{20,}\}/,
    /;\s*(color|font|display|background|transform|position)\s*:/i,
  ].some((pattern) => pattern.test(String(value)));
}

function hasPublicFallbackText(value = "") {
  return [
    /\u9700\u8981\u7f16\u8f91\u8865\u5145/i,
    /\u53ef\u4ee5\u8f6c\u6210\u66f4\u6e05\u6670\u7684\u4e8b\u5b9e-\u5224\u65ad-\u884c\u52a8\u94fe\u8def/i,
    /\u53ef\u4ee5\u6c89\u6dc0\u4e3a\u540e\u7eed Brief/i,
    /\u6838\u67e5\u6765\u6e90\u6587\u672c/i,
    /\u786e\u8ba4\u4e8b\u5b9e\u548c\u5224\u65ad\u662f\u5426\u5206\u79bb/i,
    /\u662f\u5426\u6709\u6e05\u6670\s*README\s*\u548c\u53ef\u8fd0\u884c\s*demo/i,
    /README\s*\u8bf4\u5f97\u591a\u4f46\u65e0\u6cd5\u5feb\u901f\u8dd1\u901a/i,
    /\u9009\u4e00\u4e2a\u4f4e\u98ce\u9669\u771f\u5b9e\u4efb\u52a1/i,
    /\u9009\u62e9\u4e00\u4e2a\u5c0f\u8303\u56f4\u771f\u5b9e\u4efb\u52a1\u9a8c\u8bc1\u5224\u65ad\u662f\u5426\u6210\u7acb/i,
    /\u70ed\u5ea6\u9ad8\u4f46\u7f3a\u5c11\s*benchmark/i,
    /\u6765\u6e90\u4e8b\u5b9e\u660e\u786e/i,
    /\u6709\u5b89\u88c5\u6b65\u9aa4\u548c\u9a8c\u8bc1\u65b9\u6cd5/i,
    /Small validation example/i,
    /Use this as a learning signal/i,
    /Source did not publish complete pricing/i,
    /Source did not publish full latency data/i,
    /\u9700\u8981\u57fa\u4e8e\u6765\u6e90\u6587\u672c\u8865\u6210\u4e2d\u6587\u6458\u8981/i,
    /\u6765\u6e90\u6587\u672c\u4e0d\u8db3\u4ee5\u5f62\u6210\u53ef\u53d1\u5e03\u6458\u8981/i,
    /\u5f53\u524d\u53ea\u80fd\u4f5c\u4e3a\u5f85\u590d\u6838\u7ebf\u7d22/i,
    /\u53d1\u5e03\u524d\u9700\u8981\u8865\u9f50\u6765\u6e90\u4e8b\u5b9e/i,
    /\u5f85\u590d\u6838\u7ebf\u7d22/i,
  ].some((pattern) => pattern.test(String(value)));
}

function hasMojibakeOrReplacementText(value = "") {
  const text = String(value);
  const mojibakePatterns = [
    new RegExp("(?:\\u00c3\\u0192|\\u00c3\\u201a|\\u00c3\\u00a2\\u00e2\\u201a\\u00ac|\\u00c3\\u00a5\\u00c2\\u00bd|\\u00c3\\u00a6\\u00c5\\u201c|\\u00c3\\u00a7\\u00c5\\u201c){2,}"),
    new RegExp("(?:[\\u00c0-\\u00ff][\\u0080-\\u00bf\\u2018-\\u203a]){2,}"),
  ];
  return /[?]{4,}/.test(text) || mojibakePatterns.some((pattern) => pattern.test(text));
}

function isConcreteCourseUrl(url = "") {
  return [
    /\/learn\/[^/?#]+/i,
    /\/training\/(?:modules|paths|courses)\/[^/?#]+/i,
    /\/short-courses\/[^/?#]+/i,
    /course\.fast\.ai\/?$/i,
  ].some((pattern) => pattern.test(String(url)));
}

const liveQualityGates = {
  news: { minimum_published: 3, minimum_source_diversity: 2 },
  models: { minimum_published: 3, minimum_source_diversity: 2 },
  projects: { minimum_published: 4, minimum_source_diversity: 2 },
  skills: { minimum_published: 3, minimum_source_diversity: 2 },
  articles: { minimum_published: 3, minimum_source_diversity: 2 },
  courses: { minimum_published: 2, minimum_source_diversity: 2 },
};

const liveIssues = [];
const seenLiveIds = new Set();
const seenLiveSlugs = new Set();
const seenLiveCanonicals = new Set();
const perColumnSources = new Map(Object.keys(liveQualityGates).map((column) => [column, new Set()]));
const perColumnCounts = new Map(Object.keys(liveQualityGates).map((column) => [column, 0]));
function collectStrings(value, strings = []) {
  if (typeof value === "string") {
    strings.push(value);
  } else if (Array.isArray(value)) {
    for (const child of value) collectStrings(child, strings);
  } else if (value && typeof value === "object") {
    for (const child of Object.values(value)) collectStrings(child, strings);
  }
  return strings;
}

for (const item of liveItems) {
  if (seenLiveIds.has(item.id)) liveIssues.push(`duplicate live id: ${item.id}`);
  seenLiveIds.add(item.id);
  if (seenLiveSlugs.has(item.slug)) liveIssues.push(`duplicate live slug: ${item.slug}`);
  seenLiveSlugs.add(item.slug);
  const canonical = item.canonical_url ?? item.source_url;
  if (canonical && seenLiveCanonicals.has(canonical)) liveIssues.push(`duplicate live canonical/source URL: ${canonical}`);
  if (canonical) seenLiveCanonicals.add(canonical);

  for (const field of requiredLiveFields) {
    if (item[field] === undefined || item[field] === null || item[field] === "") {
      liveIssues.push(`${item.slug ?? item.id ?? "unknown"} missing ${field}`);
    }
  }
  for (const scoreField of ["readability_score", "impact_score", "actionability_score", "confidence_score"]) {
    if (!Number.isFinite(item[scoreField]) || item[scoreField] < 0 || item[scoreField] > 100) {
      liveIssues.push(`${item.slug ?? item.id} has invalid ${scoreField}: ${item[scoreField]}`);
    }
  }
  if (!Array.isArray(item.key_facts) || item.key_facts.length === 0) {
    liveIssues.push(`${item.slug ?? item.id} must include source-backed key_facts`);
  }
  if (hasUiScrapeJunk(item.title) || hasUiScrapeJunk(item.summary) || hasUiScrapeJunk(item.one_sentence_takeaway)) {
    liveIssues.push(`${item.slug ?? item.id} contains raw UI/scrape fragments in public text`);
  }
  if (collectStrings(item).some(hasUiScrapeJunk)) {
    liveIssues.push(`${item.slug ?? item.id} contains raw UI/scrape fragments in public detail fields`);
  }
  if (collectStrings(item).some((value) => /\bneeds review\b/i.test(value))) {
    liveIssues.push(`${item.slug ?? item.id} contains unresolved "needs review" placeholder text`);
  }
  if (collectStrings(item).some(hasPublicFallbackText)) {
    liveIssues.push(`${item.slug ?? item.id} contains public fallback/editorial boilerplate text`);
  }
  if (!/^(eval-v\d+|deterministic-v\d+)$/.test(String(item.prompt_version ?? ""))) {
    liveIssues.push(`${item.slug ?? item.id} missing valid prompt_version provenance`);
  }
  if (String(item.prompt_version ?? "").startsWith("deterministic-")) {
    liveIssues.push(`${item.slug ?? item.id} was published from deterministic fallback instead of a live LLM evaluation`);
  }
  if (!["card_only", "brief", "standard", "deep"].includes(item.detail_depth)) {
    liveIssues.push(`${item.slug ?? item.id} missing legal detail_depth`);
  }
  if (!["not_needed", "needed_not_generated", "generated", "needs_human_review"].includes(item.deep_dive_status)) {
    liveIssues.push(`${item.slug ?? item.id} missing legal deep_dive_status`);
  }
  if (item.detail_depth === "deep" && item.deep_dive_status !== "generated") {
    liveIssues.push(`${item.slug ?? item.id} cannot use detail_depth=deep without generated DeepDive`);
  }
  if (item.deep_dive_status === "generated" && (!item.deep_dive || item.detail_depth !== "deep")) {
    liveIssues.push(`${item.slug ?? item.id} has generated DeepDive status without a deep detail payload`);
  }
  if (!Object.hasOwn(liveQualityGates, item.source_column)) {
    liveIssues.push(`${item.slug ?? item.id} missing valid source_column`);
  }
  if (hasMojibakeOrReplacementText([item.title, item.summary, item.one_sentence_takeaway, item.why_it_matters].join(" "))) {
    liveIssues.push(`${item.slug ?? item.id} contains mojibake or replacement text in public card fields`);
  }
  if (collectStrings(item).some(hasMojibakeOrReplacementText)) {
    liveIssues.push(`${item.slug ?? item.id} contains mojibake or replacement text in public detail fields`);
  }
  if (item.content_type === "news" && /news\.google\.com\/rss/i.test(`${item.source_url} ${item.canonical_url ?? ""}`)) {
    liveIssues.push(`${item.slug ?? item.id} uses Google News RSS as a published news source instead of a primary story source`);
  }
  if (item.content_type === "course" && !isConcreteCourseUrl(item.source_url)) {
    liveIssues.push(`${item.slug ?? item.id} uses a course homepage instead of a concrete course/module URL`);
  }
  if (item.confidence_score < 60 && ["try", "use_now"].includes(item.recommended_action)) {
    liveIssues.push(`${item.slug ?? item.id} cannot recommend ${item.recommended_action} with confidence_score ${item.confidence_score}`);
  }
  for (const field of ["model_provider", "primary_capability", "pricing_note", "latency_note", "integration_target", "duration"]) {
    if (item[field] === "unknown") liveIssues.push(`${item.slug ?? item.id} has unresolved placeholder field ${field}`);
  }
  const factText = Array.isArray(item.key_facts) ? item.key_facts.join(" ") : "";
  if (/unknown_source|mock fixture|editorial_seed/i.test(factText)) {
    liveIssues.push(`${item.slug ?? item.id} contains placeholder source facts`);
  }
  const bucket = item.source_column;
  if (perColumnCounts.has(bucket)) perColumnCounts.set(bucket, (perColumnCounts.get(bucket) ?? 0) + 1);
  if (perColumnSources.has(bucket)) perColumnSources.get(bucket).add(item.source_name);
}

for (const [column, gate] of Object.entries(liveQualityGates)) {
  const published = perColumnCounts.get(column) ?? 0;
  const sourceCount = perColumnSources.get(column)?.size ?? 0;
  if (published < gate.minimum_published) {
    liveIssues.push(`${column} needs at least ${gate.minimum_published} live items for public snapshot quality; found ${published}`);
  }
  if (sourceCount < gate.minimum_source_diversity) {
    liveIssues.push(`${column} needs at least ${gate.minimum_source_diversity} source names; found ${sourceCount}`);
  }
}

if (liveIssues.length > 0) {
  throw new Error(`Live content validation failed:\n- ${liveIssues.join("\n- ")}`);
}

console.log("content validation passed");
