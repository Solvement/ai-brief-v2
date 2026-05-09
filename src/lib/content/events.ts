import type { ContentType } from "./types";

export interface EventCluster {
  id: string;
  content_type: ContentType;
  representative_id: string;
  member_ids: string[];
  source_names: string[];
  centroid_keywords: string[];
  earliest_at: string;
  latest_at: string;
  source_diversity: number;
}
