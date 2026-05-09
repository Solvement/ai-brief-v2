import {
  getAllContentItems,
  getContentBySlug,
  getContentByType,
  getHomeBrief,
  getHomeBriefFromItems,
  getRecommendedContent,
  getRelatedContent,
} from "../src/lib/content/queries";
import { liveContentItems } from "../src/lib/content/live.generated";
import { contentItems } from "../src/lib/content/seed";
import {
  actionLabels,
  contentTypes,
  isScore,
  type ContentItem,
} from "../src/lib/content/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertContentItem(item: ContentItem) {
  assert(item.id, "item must have id");
  assert(item.slug, "item must have slug");
  assert(item.title, "item must have title");
  assert(item.summary, "item must have summary");
  assert(item.one_sentence_takeaway, "item must have takeaway");
  assert(item.why_it_matters, "item must have why_it_matters");
  assert(item.source_name, "item must have source name");
  assert(item.source_url, "item must have source URL");
  assert(actionLabels.includes(item.recommended_action), "recommended_action must be legal");
  assert(item.target_audience.length > 0, "target_audience must not be empty");
  assert(isScore(item.readability_score), "readability_score must be 0-100");
  assert(isScore(item.impact_score), "impact_score must be 0-100");
  assert(isScore(item.actionability_score), "actionability_score must be 0-100");
  assert(isScore(item.confidence_score), "confidence_score must be 0-100");
}

for (const item of contentItems) {
  assertContentItem(item);
}

for (const type of contentTypes) {
  assert(
    contentItems.some((item) => item.content_type === type),
    `seed data must include at least one ${type}`,
  );
}

const runtimeItems = getAllContentItems();
assertEqual(runtimeItems.length, liveContentItems.length, "public runtime queries must use live content only");
assert(
  runtimeItems.every((item) => !contentItems.some((seed) => seed.id === item.id)),
  "public runtime queries must not leak seed/mock items",
);

const homeBrief = getHomeBriefFromItems(contentItems);
assert(homeBrief.mustRead.length > 0 && homeBrief.mustRead.length <= 3, "Home must read should return up to 3 items");
assert(homeBrief.tryToday.length > 0, "Home try today should return actionable items");
assert(homeBrief.modelRadar.length > 0, "Home model radar should return model items");
assert(homeBrief.playbookOfTheDay, "Home should return one playbook");
assert(homeBrief.deepRead.length > 0, "Home should return deep read items");

const heroSectionIds = [
  ...homeBrief.mustRead.map((item) => item.id),
  ...homeBrief.tryToday.map((item) => item.id),
  homeBrief.playbookOfTheDay.id,
];
assertEqual(new Set(heroSectionIds).size, heroSectionIds.length, "Home primary sections should not duplicate items");

const first = contentItems[0];
assertEqual(getContentBySlug(first.slug), undefined, "public slug lookup must not resolve seed/mock items");

const runtimeHomeBrief = getHomeBrief();
assert(runtimeHomeBrief.mustRead.length <= 3, "Runtime Home must read should return up to 3 live items");
for (const type of contentTypes) {
  assert(
    getContentByType(type).every((item) => liveContentItems.some((live) => live.id === item.id)),
    `${type} section must only return live items`,
  );
}

if (liveContentItems.length > 0) {
  const firstLive = liveContentItems[0];
  assertEqual(getContentBySlug(firstLive.slug)?.id, firstLive.id, "getContentBySlug should find live content by slug");
  assert(getRelatedContent(firstLive.id).every((item) => item.id !== firstLive.id), "related content must not include itself");
  assert(
    getRecommendedContent(["MCP", "AI Coding"]).every((item) => item.tags.some((tag) => ["MCP", "AI Coding"].includes(tag))),
    "tag recommendations should match requested interests",
  );
}
