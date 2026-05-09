import { liveContentItems } from "./live.generated";
import type { EventCluster } from "./events";
import { clusterByEvent } from "../ingestion/cluster";
import type {
  AnyContentItem,
  ContentTag,
  ContentType,
  HomeBrief,
  ModelItem,
  ProjectItem,
  ToolItem,
  IntegrationItem,
  ArticleItem,
  PaperItem,
  CourseItem,
  GuideItem,
} from "./types";

function contentDedupeKey(item: AnyContentItem): string {
  return item.canonical_url ?? item.source_url ?? item.id;
}

function isSameContent(left: AnyContentItem, right: AnyContentItem): boolean {
  if (left.id === right.id || left.slug === right.slug) return true;
  return contentDedupeKey(left) === contentDedupeKey(right);
}

export function mergeContentItems(baseItems: AnyContentItem[], liveItems: AnyContentItem[]): AnyContentItem[] {
  const merged = [...baseItems];
  for (const item of liveItems) {
    const existingIndex = merged.findIndex((candidate) => isSameContent(candidate, item));
    if (existingIndex >= 0) {
      merged[existingIndex] = item;
    } else {
      merged.push(item);
    }
  }
  return merged;
}

export function getAllContentItems(): AnyContentItem[] {
  return [...liveContentItems];
}

const allContentItems = getAllContentItems();
const publishedItems = allContentItems.filter((item) => item.status === "published");
type ContentColumn = "news" | "models" | "projects" | "skills" | "articles" | "courses";

function sortByDecisionValue(items: AnyContentItem[]): AnyContentItem[] {
  return [...items].sort((a, b) => {
    const aScore = a.impact_score * 0.38 + a.confidence_score * 0.24 + a.actionability_score * 0.24 + a.readability_score * 0.14;
    const bScore = b.impact_score * 0.38 + b.confidence_score * 0.24 + b.actionability_score * 0.24 + b.readability_score * 0.14;
    return bScore - aScore;
  });
}

function hasType<T extends ContentType>(item: AnyContentItem, type: T): item is Extract<AnyContentItem, { content_type: T }> {
  return item.content_type === type;
}

function isLiveContentItem(item: AnyContentItem): boolean {
  return item.id.startsWith("import-");
}

function selectPreferred(
  items: AnyContentItem[],
  predicate: (item: AnyContentItem) => boolean,
  limit: number,
  usedIds: Set<string> = new Set(),
): AnyContentItem[] {
  return sortByDecisionValue(items.filter((item) => predicate(item) && !usedIds.has(item.id))).slice(0, limit);
}

export function getContentByType<T extends ContentType>(type: T): Array<Extract<AnyContentItem, { content_type: T }>> {
  return sortByDecisionValue(publishedItems).filter((item): item is Extract<AnyContentItem, { content_type: T }> =>
    hasType(item, type),
  );
}

function fallbackColumnForItem(item: AnyContentItem): ContentColumn {
  if (item.content_type === "news") return "news";
  if (item.content_type === "model") return "models";
  if (item.content_type === "course") return "courses";
  if (item.content_type === "article" || item.content_type === "paper") return "articles";
  if (item.content_type === "integration") return "skills";
  return "projects";
}

export function getContentByColumn(column: ContentColumn): AnyContentItem[] {
  return sortByDecisionValue(publishedItems).filter((item) => (item.source_column ?? fallbackColumnForItem(item)) === column);
}

export function getContentBySlug(slug: string): AnyContentItem | undefined {
  return publishedItems.find((item) => item.slug === slug);
}

export function getRelatedContent(id: string, limit = 4): AnyContentItem[] {
  const source = allContentItems.find((item) => item.id === id);
  if (!source) {
    return [];
  }

  const explicit = source.related_ids
    .map((relatedId) => publishedItems.find((item) => item.id === relatedId))
    .filter((item): item is AnyContentItem => Boolean(item));

  const tagMatched = sortByDecisionValue(
    publishedItems.filter(
      (item) => item.id !== source.id && item.tags.some((tag) => source.tags.includes(tag)) && !explicit.some((match) => match.id === item.id),
    ),
  );

  return [...explicit, ...tagMatched].slice(0, limit);
}

export function getRecommendedContent(userInterestTags: ContentTag[] = [], limit = 8): AnyContentItem[] {
  const candidates =
    userInterestTags.length === 0
      ? publishedItems
      : publishedItems.filter((item) => item.tags.some((tag) => userInterestTags.includes(tag)));

  return sortByDecisionValue(candidates).slice(0, limit);
}

function getContentByTypeFromItems<T extends ContentType>(items: AnyContentItem[], type: T): Array<Extract<AnyContentItem, { content_type: T }>> {
  return sortByDecisionValue(items).filter((item): item is Extract<AnyContentItem, { content_type: T }> => hasType(item, type));
}

function getContentByColumnFromItems(items: AnyContentItem[], column: ContentColumn): AnyContentItem[] {
  return sortByDecisionValue(items).filter((item) => (item.source_column ?? fallbackColumnForItem(item)) === column);
}

export function getHomeBriefFromItems(items: AnyContentItem[]): HomeBrief {
  const liveOnlyItems = items.some(isLiveContentItem) ? items.filter(isLiveContentItem) : items;
  const localPublishedItems = liveOnlyItems.filter((item) => item.status === "published");
  const mustRead = selectPreferred(localPublishedItems, (item) => item.confidence_score >= 60, 3);
  const usedPrimaryIds = new Set(mustRead.map((item) => item.id));
  const tryToday = selectPreferred(
    localPublishedItems,
    (item) => item.recommended_action === "try" || item.recommended_action === "use_now",
    3,
    usedPrimaryIds,
  );
  for (const item of tryToday) {
    usedPrimaryIds.add(item.id);
  }
  const modelRadar = getContentByColumnFromItems(localPublishedItems, "models").slice(0, 3) as ModelItem[];
  const toolsAndProjects = getContentByColumnFromItems(localPublishedItems, "projects").slice(0, 4) as Array<ToolItem | ProjectItem | IntegrationItem>;
  const playbookOfTheDay = getContentByTypeFromItems(localPublishedItems, "guide").find((item) => !usedPrimaryIds.has(item.id)) as GuideItem | undefined;
  const deepRead = [...getContentByColumnFromItems(localPublishedItems, "articles"), ...getContentByColumnFromItems(localPublishedItems, "courses")]
    .slice(0, 4) as Array<ArticleItem | PaperItem | CourseItem>;

  return {
    dailyTakeaway: "今天最值得关注的是：模型、工具和视觉资产都要回到可验证的行动。",
    mustRead,
    tryToday,
    modelRadar,
    toolsAndProjects,
    playbookOfTheDay,
    deepRead,
  };
}

export function getHomeBrief(): HomeBrief {
  return getHomeBriefFromItems(publishedItems);
}

export async function getLatestEventClusters(items: AnyContentItem[] = publishedItems, limit = 12): Promise<EventCluster[]> {
  const clusters = await clusterByEvent(items);
  return clusters.slice(0, limit);
}
