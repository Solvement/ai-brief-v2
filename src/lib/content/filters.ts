import {
  actionLabels,
  audiences,
  contentTags,
  type ActionLabel,
  type AnyContentItem,
  type Audience,
  type ContentTag,
} from "./types";

export interface ContentFilters {
  tag?: ContentTag;
  audience?: Audience;
  action?: ActionLabel;
}

export function parseContentFilters(search: string): ContentFilters {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const tag = params.get("tag");
  const audience = params.get("audience");
  const action = params.get("action");

  return {
    tag: contentTags.includes(tag as ContentTag) ? (tag as ContentTag) : undefined,
    audience: audiences.includes(audience as Audience) ? (audience as Audience) : undefined,
    action: actionLabels.includes(action as ActionLabel) ? (action as ActionLabel) : undefined,
  };
}

export function filterContentItems(items: AnyContentItem[], filters: ContentFilters): AnyContentItem[] {
  return items.filter((item) => {
    if (filters.tag && !item.tags.includes(filters.tag)) return false;
    if (filters.audience && !item.target_audience.includes(filters.audience)) return false;
    if (filters.action && item.recommended_action !== filters.action) return false;
    return true;
  });
}

export function hasActiveFilters(filters: ContentFilters): boolean {
  return Boolean(filters.tag || filters.audience || filters.action);
}
