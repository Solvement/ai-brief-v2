import { contentItems } from "../src/lib/content/seed";
import { cosineSimilarity, embed } from "../src/lib/ingestion/embedding";
import { clusterByEvent } from "../src/lib/ingestion/cluster";
import { getLatestEventClusters } from "../src/lib/content/queries";
import type { AnyContentItem } from "../src/lib/content/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function item(overrides: Partial<AnyContentItem> & Pick<AnyContentItem, "id" | "title" | "content_type" | "source_name" | "collected_at" | "confidence_score">): AnyContentItem {
  return {
    ...contentItems[0],
    slug: overrides.id,
    summary: overrides.title,
    one_sentence_takeaway: overrides.title,
    why_it_matters: "用于测试事件聚类的内容。",
    tags: ["Research"],
    source_url: `https://example.com/${overrides.id}`,
    canonical_url: `https://example.com/${overrides.id}`,
    status: "published",
    ...overrides,
  } as AnyContentItem;
}

async function main() {
  const embeddingA = await embed("GPT-5 发布 支持 代码 推理 多模态");
  const embeddingB = await embed("GPT-5 发布 支持 代码 推理 多模态");
  assert(cosineSimilarity(embeddingA, embeddingB) > 0.99, "same text embeddings should be nearly identical");

  const fixtures = [
    item({
      id: "official-gpt5",
      title: "OpenAI 发布 GPT-5，代码和多模态能力升级",
      content_type: "news",
      source_name: "OpenAI",
      collected_at: "2026-05-07T08:00:00-04:00",
      confidence_score: 91,
    }),
    item({
      id: "media-gpt5",
      title: "GPT-5 发布后开发者开始测试代码 Agent",
      content_type: "news",
      source_name: "机器之心",
      collected_at: "2026-05-07T12:00:00-04:00",
      confidence_score: 74,
    }),
    item({
      id: "community-gpt5",
      title: "社区讨论 GPT-5 的上下文窗口和工具调用表现",
      content_type: "news",
      source_name: "Hacker News",
      collected_at: "2026-05-07T16:00:00-04:00",
      confidence_score: 62,
    }),
    item({
      id: "duplicate-gpt5-url",
      title: "OpenAI 发布 GPT-5，代码和多模态能力升级",
      content_type: "news",
      source_name: "OpenAI mirror",
      collected_at: "2026-05-07T08:05:00-04:00",
      confidence_score: 90,
      canonical_url: "https://example.com/official-gpt5",
    }),
    item({
      id: "tool-gpt5",
      title: "GPT-5 代码工具插件发布",
      content_type: "tool",
      source_name: "GitHub",
      collected_at: "2026-05-07T17:00:00-04:00",
      confidence_score: 80,
    }),
    item({
      id: "old-gpt5",
      title: "GPT-5 发布前传闻继续发酵",
      content_type: "news",
      source_name: "Reddit",
      collected_at: "2026-05-01T08:00:00-04:00",
      confidence_score: 55,
    }),
  ];
  fixtures[0].canonical_url = "https://example.com/official-gpt5";

  const clusters = await clusterByEvent(fixtures, { similarityThreshold: 0.45, timeWindowHours: 48 });
  const gpt5Cluster = clusters.find((cluster) => cluster.member_ids.includes("official-gpt5"));
  assert(gpt5Cluster, "official GPT-5 item should belong to a cluster");
  assert(gpt5Cluster.member_ids.length === 3, "three same-event news items should cluster together");
  assert(!gpt5Cluster.member_ids.includes("duplicate-gpt5-url"), "same canonical URL should be removed by the cheap pre-pass");
  assert(gpt5Cluster.representative_id === "official-gpt5", "representative should be highest-confidence item");
  assert(gpt5Cluster.content_type === "news", "cluster should expose content type for Brief surfaces");
  assert(!gpt5Cluster.member_ids.includes("tool-gpt5"), "similar wording across different content_type should not cluster");
  assert(!gpt5Cluster.member_ids.includes("old-gpt5"), "items outside the time window should not cluster");
  assert(gpt5Cluster.source_diversity === 3, "source diversity should count distinct source names");
  assert(gpt5Cluster.source_names.includes("OpenAI") && gpt5Cluster.source_names.includes("机器之心"), "cluster should keep source names as evidence");
  assert(gpt5Cluster.centroid_keywords.length > 0, "cluster should expose centroid keywords");

  const latestClusters = await getLatestEventClusters(fixtures);
  assert(latestClusters.length >= 3, "query should return latest event clusters");
}

export default main();
