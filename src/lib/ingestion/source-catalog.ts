import type { ContentTag, ContentType } from "../content/types";
import type { Source } from "./index";
import { columnSourceConfigs, type ColumnSourceConfig } from "./column-source-policy";

export interface LiveFeedSource extends Source {
  default_content_type: Extract<ContentType, "news" | "model" | "article">;
  default_tags: ContentTag[];
  max_items: number;
}

export interface LiveProjectSource extends Source {
  platform: "github" | "huggingface";
  period?: "daily" | "weekly" | "monthly";
  default_tags: ContentTag[];
  max_items: number;
}

export interface LiveCourseSource extends Source {
  default_tags: ContentTag[];
  max_items: number;
}

function asFeedSource(source: ColumnSourceConfig): LiveFeedSource | undefined {
  if (source.adapter !== "rss_feed") return undefined;
  if (!["news", "model", "article"].includes(source.default_content_type)) return undefined;
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    source_type: source.source_type,
    language: source.language,
    reliability_level: source.reliability_level,
    enabled: source.enabled,
    default_content_type: source.default_content_type as LiveFeedSource["default_content_type"],
    default_tags: source.default_tags,
    max_items: source.selected_limit,
  };
}

function asProjectSource(source: ColumnSourceConfig): LiveProjectSource | undefined {
  if (source.column !== "projects") return undefined;
  if (source.adapter !== "github_trending" && source.adapter !== "huggingface_models" && source.adapter !== "huggingface_spaces") return undefined;
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    source_type: source.source_type,
    language: source.language,
    reliability_level: source.reliability_level,
    enabled: source.enabled,
    platform: source.adapter === "github_trending" ? "github" : "huggingface",
    period: source.period,
    default_tags: source.default_tags,
    max_items: source.selected_limit,
  };
}

function asCourseSource(source: ColumnSourceConfig): LiveCourseSource | undefined {
  if (source.column !== "courses") return undefined;
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    source_type: source.source_type,
    language: source.language,
    reliability_level: source.reliability_level,
    enabled: source.enabled,
    default_tags: source.default_tags,
    max_items: source.selected_limit,
  };
}

export const liveFeedSources: LiveFeedSource[] = columnSourceConfigs.flatMap((source) => {
  const mapped = asFeedSource(source);
  return mapped ? [mapped] : [];
});

export const liveProjectSources: LiveProjectSource[] = columnSourceConfigs.flatMap((source) => {
  const mapped = asProjectSource(source);
  return mapped ? [mapped] : [];
});

export const liveCourseSources: LiveCourseSource[] = columnSourceConfigs.flatMap((source) => {
  const mapped = asCourseSource(source);
  return mapped ? [mapped] : [];
});
