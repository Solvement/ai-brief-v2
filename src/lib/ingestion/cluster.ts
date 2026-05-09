import type { EventCluster } from "../content/events";
import type { AnyContentItem, ContentItem, ContentType } from "../content/types";
import { cosineSimilarity, embed } from "./embedding";

interface ClusterState {
  content_type: ContentType;
  items: AnyContentItem[];
  embeddings: number[][];
  centroid: number[];
}

const strongEntityTokens = new Set(["gpt-5", "gpt5", "claude", "code", "mcp", "agent", "openai"]);

function parseTime(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sourceKey(item: ContentItem): string {
  return item.canonical_url ?? `${item.title}:${item.source_name}`;
}

function dedupeByCanonicalUrl<T extends ContentItem>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = sourceKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const length = vectors[0].length;
  const centroid = Array.from({ length }, () => 0);
  for (const vector of vectors) {
    for (let index = 0; index < length; index += 1) {
      centroid[index] += vector[index] ?? 0;
    }
  }
  return centroid.map((value) => value / vectors.length);
}

function textForEmbedding(item: ContentItem): string {
  return `${item.title} ${(item.one_sentence_takeaway || item.summary).slice(0, 200)}`;
}

function anchorTokens(text: string): Set<string> {
  const lower = text.toLowerCase();
  const tokens = new Set<string>();
  for (const token of lower.match(/[a-z][a-z0-9-]+|\bgpt-\d+\b/g) ?? []) {
    tokens.add(token);
  }
  const keywordMap: Array<[RegExp, string]> = [
    [/权限|permission/i, "permission"],
    [/企业|enterprise/i, "enterprise"],
    [/安全|security/i, "security"],
    [/代码|coding|code/i, "code"],
    [/多模态|multimodal/i, "multimodal"],
    [/上下文|context/i, "context"],
    [/成本|cost/i, "cost"],
    [/速度|latency|speed/i, "speed"],
    [/工具调用|tool/i, "tool-use"],
  ];
  for (const [pattern, token] of keywordMap) {
    if (pattern.test(text)) tokens.add(token);
  }
  return tokens;
}

function anchorSimilarity(item: ContentItem, cluster: ClusterState): number {
  const itemTokens = anchorTokens(textForEmbedding(item));
  let bestScore = 0;
  for (const member of cluster.items) {
    const memberTokens = anchorTokens(textForEmbedding(member));
    const shared = [...itemTokens].filter((token) => memberTokens.has(token));
    if (shared.some((token) => /\d/.test(token))) bestScore = Math.max(bestScore, 0.9);
    if (shared.includes("mcp")) bestScore = Math.max(bestScore, 0.84);
    if (shared.includes("claude") && shared.includes("code")) bestScore = Math.max(bestScore, 0.84);
    if (shared.some((token) => strongEntityTokens.has(token)) && shared.length >= 2) bestScore = Math.max(bestScore, 0.82);
    if (shared.length >= 3) bestScore = Math.max(bestScore, 0.8);
  }
  return bestScore;
}

function pickRepresentative(items: AnyContentItem[]): AnyContentItem {
  return [...items].sort((a, b) => {
    if (b.confidence_score !== a.confidence_score) return b.confidence_score - a.confidence_score;
    return parseTime(a.collected_at) - parseTime(b.collected_at);
  })[0];
}

function keywordTokens(items: AnyContentItem[]): string[] {
  const counts = new Map<string, number>();
  const stopwords = new Set(["发布", "支持", "开始", "讨论", "能力", "工具", "调用", "表现"]);
  for (const item of items) {
    const tokens = [
      ...(item.title.match(/[A-Za-z][A-Za-z0-9-]+/g) ?? []),
      ...(item.title.match(/[\u4e00-\u9fff]{2,}/g) ?? []),
    ];
    for (const token of tokens) {
      if (stopwords.has(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([token]) => token);
}

function toEventCluster(state: ClusterState, index: number): EventCluster {
  const items = [...state.items].sort((a, b) => parseTime(a.collected_at) - parseTime(b.collected_at));
  const representative = pickRepresentative(items);
  const sourceNames = [...new Set(items.map((item) => item.source_name))];
  return {
    id: `event-${state.content_type}-${index + 1}-${representative.id}`,
    content_type: state.content_type,
    representative_id: representative.id,
    member_ids: items.map((item) => item.id),
    source_names: sourceNames,
    centroid_keywords: keywordTokens(items),
    earliest_at: items[0].collected_at,
    latest_at: items[items.length - 1].collected_at,
    source_diversity: sourceNames.length,
  };
}

export async function clusterByEvent(
  items: ContentItem[],
  opts: { similarityThreshold?: number; timeWindowHours?: number } = {},
): Promise<EventCluster[]> {
  const similarityThreshold = opts.similarityThreshold ?? 0.78;
  const timeWindowMs = (opts.timeWindowHours ?? 48) * 60 * 60 * 1000;
  const sortedItems = dedupeByCanonicalUrl(items).sort((a, b) => parseTime(a.collected_at) - parseTime(b.collected_at)) as AnyContentItem[];
  const clusters: ClusterState[] = [];

  for (const item of sortedItems) {
    const itemEmbedding = await embed(textForEmbedding(item));
    let bestCluster: ClusterState | null = null;
    let bestSimilarity = -1;

    for (const cluster of clusters) {
      const latestAt = Math.max(...cluster.items.map((member) => parseTime(member.collected_at)));
      const withinWindow = Math.abs(parseTime(item.collected_at) - latestAt) <= timeWindowMs;
      if (cluster.content_type !== item.content_type || !withinWindow) continue;
      const similarity = Math.max(cosineSimilarity(itemEmbedding, cluster.centroid), anchorSimilarity(item, cluster));
      if (similarity >= similarityThreshold && similarity > bestSimilarity) {
        bestCluster = cluster;
        bestSimilarity = similarity;
      }
    }

    if (bestCluster) {
      bestCluster.items.push(item);
      bestCluster.embeddings.push(itemEmbedding);
      bestCluster.centroid = averageVectors(bestCluster.embeddings);
      continue;
    }

    clusters.push({
      content_type: item.content_type,
      items: [item],
      embeddings: [itemEmbedding],
      centroid: itemEmbedding,
    });
  }

  return clusters.map(toEventCluster).sort((a, b) => parseTime(b.latest_at) - parseTime(a.latest_at));
}
