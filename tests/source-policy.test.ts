import {
  buildCandidateFilterText,
  createColumnSourcePlan,
  columnIngestionPolicies,
  columnSourceConfigs,
  getCandidateFetchLimitForSource,
  getEnabledSourcesForColumn,
  ingestionColumns,
  sourceTiers,
  shouldKeepCandidateForColumn,
} from "../src/lib/ingestion/column-source-policy";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sourceNames(column: (typeof ingestionColumns)[number]): string[] {
  return getEnabledSourcesForColumn(column).map((source) => source.name);
}

function configuredSourceNames(column: (typeof ingestionColumns)[number]): string[] {
  return columnSourceConfigs.filter((source) => source.column === column).map((source) => source.name);
}

function assertIncludes(names: string[], expected: string, message: string) {
  assert(
    names.some((name) => name.toLowerCase().includes(expected.toLowerCase())),
    `${message}. Missing ${expected}; got ${names.join(", ")}`,
  );
}

for (const column of ingestionColumns) {
  const policy = columnIngestionPolicies[column];
  assert(policy.column === column, `${column} policy should declare its column`);
  assert(policy.raw_limit > policy.selected_limit, `${column} should collect more raw candidates than it publishes`);
  assert(policy.selected_limit > 0, `${column} selected_limit should be positive`);
  assert(policy.include_keywords.length > 0, `${column} should define include keywords`);
  assert(policy.exclude_keywords.length > 0, `${column} should define exclude keywords`);
  assert(policy.output_goal.length > 20, `${column} should explain the output goal`);
  assert(getEnabledSourcesForColumn(column).length > 0, `${column} should have enabled sources`);
}

for (const source of columnSourceConfigs) {
  assert(sourceTiers.includes(source.source_tier), `${source.name} should declare a legal source_tier`);
}

assert(!("home" in columnIngestionPolicies), "Home must not have an ingestion policy; it only aggregates");

const newsNames = configuredSourceNames("news");
const newsSourcePlan = createColumnSourcePlan(["news"]).sources;
assert(
  newsSourcePlan.every((source) => getCandidateFetchLimitForSource(source, 5) > 0),
  "every News source should get its own candidate budget before global column selection",
);
assert(
  newsSourcePlan.every((source) => source.source_tier === "core_discovery"),
  "default News discovery should stay concentrated on daily core sources",
);
for (const triggered of ["Reuters", "AP", "Financial Times", "Bloomberg", "WSJ", "The Information", "Axios"]) {
  assert(
    columnSourceConfigs.some((source) => source.column === "news" && source.name.includes(triggered) && source.source_tier === "triggered_news"),
    `${triggered} should remain configured as triggered_news instead of daily blind crawl`,
  );
}
for (const official of ["NIST", "CAISI"]) {
  assert(
    columnSourceConfigs.some((source) => source.column === "news" && source.name.includes(official) && source.source_tier === "official_primary"),
    `${official} should remain configured as official_primary confirmation source`,
  );
}
for (const expected of [
  "Reuters",
  "AP",
  "Financial Times",
  "Bloomberg",
  "WSJ",
  "The Information",
  "Axios",
  "TechCrunch",
  "The Verge",
  "The Guardian",
  "Tech Xplore",
  "Wired",
  "MIT Technology Review",
  "VentureBeat",
  "Google News",
  "NIST",
  "CAISI",
]) {
  assertIncludes(newsNames, expected, "News policy should prioritize story/reporting sources");
}
assert(shouldKeepCandidateForColumn("news", "OpenAI signs a cloud partnership and regulators respond"), "News should keep story-like AI reporting");
assert(!shouldKeepCandidateForColumn("news", "How to fine tune a toy model in a technical tutorial"), "News should exclude ordinary technical tutorials");
assert(
  !shouldKeepCandidateForColumn(
    "news",
    buildCandidateFilterText("TechCrunch AI", {
      title: "Laid-off Oracle workers tried to negotiate better severance",
      summary: "Oracle said no to severance negotiations after layoffs.",
      source_text: "Feed source: TechCrunch AI\nTitle: Laid-off Oracle workers tried to negotiate better severance",
      tags: ["Business"],
    }),
  ),
  "News filtering must not accept a story only because the source name contains AI",
);

const modelNames = sourceNames("models");
assert(
  getEnabledSourcesForColumn("models").every((source) => ["official_primary", "benchmark_data"].includes(source.source_tier)),
  "Models should use official labs and benchmark_data sources by default",
);
for (const expected of [
  "OpenAI",
  "Anthropic",
  "Google DeepMind",
  "Mistral",
  "Meta AI",
  "DeepSeek",
  "Qwen",
  "Artificial Analysis",
  "OpenRouter",
]) {
  assertIncludes(modelNames, expected, "Models policy should include model capability and benchmark sources");
}
assertIncludes(configuredSourceNames("models"), "LMArena", "Models policy should keep LMArena configured for future parser-backed benchmark ingestion");
assert(
  !getEnabledSourcesForColumn("models").some((source) => source.name.includes("LMArena")),
  "LMArena should remain disabled until the extractor can preserve verifiable ranking provenance",
);
assert(shouldKeepCandidateForColumn("models", "Claude model update improves tool use, context window and pricing"), "Models should keep capability changes");
assert(!shouldKeepCandidateForColumn("models", "Company launches a generic AI marketing campaign"), "Models should reject generic company news");

const projectNames = sourceNames("projects");
for (const expected of ["GitHub Trending", "GitHub AI Topic Search", "Hugging Face Spaces", "Show HN"]) {
  assertIncludes(projectNames, expected, "Projects policy should combine project discovery sources");
}
assertIncludes(configuredSourceNames("projects"), "Product Hunt", "Projects policy should keep Product Hunt configured as opt-in enrichment");
assert(
  !getEnabledSourcesForColumn("projects").some((source) => source.name.includes("Product Hunt")),
  "Product Hunt should not be enabled by default while the public page returns 403",
);
assert(
  getEnabledSourcesForColumn("projects").every((source) => source.source_tier === "core_discovery"),
  "Projects default discovery should stay concentrated on targeted project sources",
);

const skillNames = sourceNames("skills");
for (const expected of ["SKILL.md", "CLAUDE.md", "MCP Server", "Cursor Rules", "Hooks"]) {
  assertIncludes(skillNames, expected, "Skills policy should discover installable agent behavior packs");
}
assert(shouldKeepCandidateForColumn("skills", "A Claude Code SKILL.md pack with hooks and MCP server rules"), "Skills should keep skill-pack candidates");
assert(!shouldKeepCandidateForColumn("skills", "A generic AI SaaS landing page"), "Skills should reject generic tools");
assert(
  getEnabledSourcesForColumn("skills").every((source) => source.source_tier === "weekly_deep"),
  "Skills/MCP/Hooks should run as weekly_deep discovery, not daily broad news",
);

const articleNames = configuredSourceNames("articles");
for (const expected of ["Hugging Face Papers", "Hugging Face Blog", "Google Research Blog", "OpenReview", "ACL Anthology", "NeurIPS", "ICML", "ICLR", "Papers with Code", "Filtered arXiv"]) {
  assertIncludes(articleNames, expected, "Articles/Papers policy should include high-signal research sources");
}
const enabledArticleNames = sourceNames("articles");
for (const expected of ["Hugging Face Papers", "Hugging Face Blog", "Google Research Blog", "BAIR", "Filtered arXiv"]) {
  assertIncludes(enabledArticleNames, expected, "Articles/Papers live ingestion should keep reliable parser-backed sources enabled");
}
assert(
  getEnabledSourcesForColumn("articles").every((source) => ["weekly_deep", "deep_enrichment"].includes(source.source_tier)),
  "Articles/Papers enabled sources should be weekly_deep or deep_enrichment, not blind news crawls",
);
assert(
  columnSourceConfigs.some((source) => source.column === "articles" && source.name.includes("Hacker News") && source.role === "discovery_signal" && !source.enabled),
  "Hacker News should remain configured as disabled discovery-only enrichment for Articles/Papers",
);

const courseNames = sourceNames("courses");
for (const expected of ["Hugging Face LLM Course", "Microsoft Learn Generative AI Fundamentals"]) {
  assertIncludes(courseNames, expected, "Courses live ingestion should use concrete course/module URLs");
}
for (const expected of ["DeepLearning.AI", "OpenAI Academy", "fast.ai"]) {
  assertIncludes(configuredSourceNames("courses"), expected, "Courses policy should keep trusted learning sources configured for future parser-backed imports");
}
assert(
  getEnabledSourcesForColumn("courses").every((source) => /\/learn\/[^/?#]+|\/training\/(modules|paths|courses)\/[^/?#]+|\/short-courses\/[^/?#]+|course\.fast\.ai\/?$/i.test(source.url)),
  "Enabled course sources must be concrete course/module URLs, not catalog homepages",
);
assert(columnIngestionPolicies.courses.cadence === "weekly", "Courses should update weekly");

const scopedPlan = createColumnSourcePlan(["news", "projects"]);
assert(scopedPlan.columns.length === 2, "source plan should honor requested columns");
assert(scopedPlan.columns.includes("news") && scopedPlan.columns.includes("projects"), "source plan should include requested columns");
assert(!scopedPlan.columns.includes("models"), "source plan must not add unrelated columns");
assert(scopedPlan.sources.every((source) => source.column === "news" || source.column === "projects"), "source plan must not include sources from unrelated columns");
assert(
  scopedPlan.sources.some((source) => source.adapter === "github_search" && source.column === "projects"),
  "project source plan should include GitHub topic/query search, not only Trending",
);
assert(
  scopedPlan.sources.some((source) => source.adapter === "hn_discovery" && source.column === "projects"),
  "project source plan should include Show HN as discovery signal",
);
assert(
  createColumnSourcePlan(["home" as never]).columns.length === 0,
  "Home should be ignored by ingestion source planning because it only aggregates",
);
const triggeredNewsPlan = createColumnSourcePlan(["news"], ["triggered_news", "official_primary"]);
assert(
  triggeredNewsPlan.sources.some((source) => source.source_tier === "triggered_news") &&
    triggeredNewsPlan.sources.some((source) => source.source_tier === "official_primary"),
  "source plan should support explicit triggered_news / official_primary backcheck tiers",
);
assert(
  triggeredNewsPlan.sources.every((source) => source.column === "news"),
  "tier-scoped source plan should still honor requested columns",
);

console.log("source policy tests passed");
