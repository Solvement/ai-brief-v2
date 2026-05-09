import { contentItems } from "../src/lib/content/seed";
import { getHomeBriefFromItems, mergeContentItems } from "../src/lib/content/queries";
import { evaluationToPublishedContentItem } from "../src/lib/ingestion/live";
import { evaluateContentDeterministic } from "../src/lib/ai/evaluation";
import type { AnyContentItem } from "../src/lib/content/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const seedItem = contentItems[0];
const liveReplacement: AnyContentItem = {
  ...seedItem,
  id: "live-replacement",
  slug: "live-replacement",
  title: "Live Replacement",
  canonical_url: seedItem.canonical_url ?? seedItem.source_url,
  collected_at: "2026-05-08T10:00:00-04:00",
  status: "published",
};

const merged = mergeContentItems([seedItem], [liveReplacement]);
assert(merged.length === 1, "live content should dedupe against seed by canonical URL");
assert(merged[0].id === "live-replacement", "live content should win over older seed content");

const liveOnlyItem: AnyContentItem = {
  ...seedItem,
  id: "import-live-home-item",
  slug: "live-home-item",
  title: "Live Home Item",
  canonical_url: "https://example.com/live-home-item",
  source_url: "https://example.com/live-home-item",
  source_name: "GitHub Live Search",
  impact_score: 62,
  confidence_score: 76,
  actionability_score: 71,
  status: "published",
};
const highSeedItem: AnyContentItem = {
  ...seedItem,
  id: "seed-high-score",
  slug: "seed-high-score",
  title: "Seed High Score",
  canonical_url: "https://example.com/seed-high-score",
  source_url: "https://example.com/seed-high-score",
  impact_score: 98,
  confidence_score: 98,
  actionability_score: 98,
  status: "published",
};
const homeBrief = getHomeBriefFromItems([highSeedItem, liveOnlyItem]);
assert(
  homeBrief.mustRead.some((item) => item.id === "import-live-home-item") ||
    homeBrief.tryToday.some((item) => item.id === "import-live-home-item"),
  "Home should surface live imported content before falling back to seed demos",
);
assert(
  !homeBrief.mustRead.some((item) => item.id === "seed-high-score"),
  "Home primary sections should not mix seed demos into live results when live content is available",
);

const draft = contentItems.find((item) => item.content_type === "project");
assert(draft, "fixture project is required");

const evaluation = evaluateContentDeterministic({
  content_type: "project",
  title: "Real GitHub project",
  sources: [
    {
      id: "github_repo",
      source_type: "github",
      source_name: "GitHub",
      url: "https://github.com/example/project",
      text: "A real GitHub project with README, installation instructions, workflow rules, tests, and active maintenance.",
    },
  ],
  metadata: {
    source_type: "github",
    source_count: 1,
    has_official_source: false,
    collected_at: "2026-05-08T10:00:00-04:00",
  },
  input_quality: "raw_excerpt",
});

const published = evaluationToPublishedContentItem(draft, evaluation);
assert(published.status === "published", "evaluated live item should be published for local use");
assert(published.summary === evaluation.summary, "published item should use evaluator summary");
assert(published.brief_detail?.tldr === evaluation.brief_detail.tldr, "published item should carry BriefDetail");
assert(published.key_facts.length >= 2, "published item should carry source facts into key_facts");
assert(published.image_plan?.policy, "published item should carry image plan metadata");

console.log("live content tests passed");
