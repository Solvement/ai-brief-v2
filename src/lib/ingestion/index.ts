import type { AnyContentItem, ContentTag, ContentType } from "../content/types";
import { fetchGitHubRepoStats, type GitHubRepoStats } from "./github";
import { parseGitHubRepoUrl } from "./url-router";

export interface Source {
  id: string;
  name: string;
  url: string;
  source_type: "official" | "media" | "community" | "github" | "paper" | "course";
  language: "zh" | "en" | "other";
  reliability_level: 1 | 2 | 3 | 4 | 5;
  enabled: boolean;
  last_checked_at?: string;
}

export interface IngestionLog {
  level: "info" | "error";
  message: string;
  source_id: string;
}

export interface ManualImportRow {
  title?: string;
  url?: string;
  canonical_url?: string;
  source_name?: string;
  published_at?: string;
  summary?: string;
  content_type?: ContentType;
  tags?: ContentTag[];
  image_url?: string;
  image_alt?: string;
  image_credit?: string;
}

export interface ImportResult {
  items: AnyContentItem[];
  logs: IngestionLog[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function isGitHubEnrichable(contentType: ContentType): boolean {
  return contentType === "tool" || contentType === "project" || contentType === "integration";
}

function maturityFromGitHub(stats?: GitHubRepoStats | null): "experimental" | "usable" | "production_ready" {
  if (!stats || stats.archived) return "experimental";
  if (stats.stars >= 500 && stats.last_commit_days_ago <= 90 && stats.contributors_count >= 5) return "production_ready";
  if (stats.stars >= 50 && stats.last_commit_days_ago <= 180) return "usable";
  return "experimental";
}

function installationMinutesFromGitHub(stats?: GitHubRepoStats | null): number {
  if (!stats) return 30;
  if (stats.releases_last_90d > 0 && stats.license) return 15;
  if (stats.primary_language) return 25;
  return 35;
}

function makeDraftItem(
  source: Source,
  row: Required<Pick<ManualImportRow, "title" | "url" | "summary">> & ManualImportRow,
  githubStats?: GitHubRepoStats | null,
): AnyContentItem {
  const contentType = row.content_type ?? "news";
  const now = new Date().toISOString();
  const publishedAt = row.published_at ?? now;
  const sourceName = row.source_name ?? source.name;
  const canonicalUrl = row.canonical_url ?? row.url;

  return {
    id: `import-${slugify(row.title)}`,
    slug: slugify(row.title),
    title: row.title,
    summary: row.summary,
    one_sentence_takeaway: row.summary,
    why_it_matters: "Needs editor review before publication.",
    content_type: contentType,
    category: contentType,
    tags: row.tags ?? [],
    target_audience: ["pm"],
    source_name: sourceName,
    source_url: row.url,
    canonical_url: canonicalUrl,
    published_at: publishedAt,
    collected_at: now,
    language: source.language,
    reading_time_minutes: 3,
    status: "draft",
    readability_score: 50,
    impact_score: 50,
    actionability_score: 40,
    confidence_score: source.reliability_level * 15,
    difficulty: "beginner",
    recommended_action: "monitor",
    key_facts: ["Imported item requires review."],
    opportunities: ["Evaluate whether it can become a briefing item."],
    risks: ["Imported content may be incomplete."],
    next_steps: ["Review source.", "Run evaluation.", "Decide publish status."],
    related_ids: [],
    ...(row.image_url
      ? {
          thumbnail_image: {
            id: `media-${slugify(row.title)}-thumb`,
            type: "thumbnail" as const,
            source_type: "source_image" as const,
            url: row.image_url,
            alt: row.image_alt ?? `${row.title} source image`,
            credit: row.image_credit ?? sourceName,
            aspect_ratio: "16:9" as const,
            status: "approved" as const,
            created_at: now,
          },
          media_assets: [
            {
              id: `media-${slugify(row.title)}-thumb`,
              type: "thumbnail" as const,
              source_type: "source_image" as const,
              url: row.image_url,
              alt: row.image_alt ?? `${row.title} source image`,
              credit: row.image_credit ?? sourceName,
              aspect_ratio: "16:9" as const,
              status: "approved" as const,
              created_at: now,
            },
          ],
        }
      : {}),
    github_stats: githubStats ?? undefined,
    ...(contentType === "news"
      ? { news_scope: "industry" as const, affected_groups: ["pm" as const] }
      : contentType === "model"
        ? {
            model_provider: "unknown",
            primary_capability: "unknown",
            pricing_note: "unknown",
            latency_note: "unknown",
            benchmark_notes: ["Source-specific benchmark evidence pending manual review."],
            test_prompts: ["test with a real task"],
          }
        : contentType === "tool"
          ? { product_url: row.url, maturity: maturityFromGitHub(githubStats), installation_minutes: installationMinutesFromGitHub(githubStats), alternatives: [] }
          : contentType === "project"
            ? { repository_url: row.url, maturity: maturityFromGitHub(githubStats), installation_minutes: installationMinutesFromGitHub(githubStats), alternatives: [] }
            : contentType === "integration"
              ? { integration_target: "unknown", permission_level: "read" as const, verification_methods: ["least privilege test"] }
              : contentType === "article"
                ? { core_argument: row.summary, evidence_strength: "medium" as const, counterpoints: ["Source evidence still needs editorial verification."] }
                : contentType === "paper"
                  ? { paper_url: row.url, method_summary: row.summary, limitations: ["Source evidence still needs editorial verification."], reproducibility: "unknown" as const }
                  : contentType === "guide"
                    ? { outcome: row.summary, prerequisites: ["review source"], prompts: ["turn into steps"], checklist: ["review"], validation_methods: ["manual review"] }
                    : {
                        provider: source.name,
                        duration: "unknown",
                        learning_outcomes: [row.summary],
                        project_based: false,
                      }),
  } as AnyContentItem;
}

export function importManualJson(source: Source, rows: ManualImportRow[]): ImportResult {
  const items: AnyContentItem[] = [];
  const logs: IngestionLog[] = [];

  for (const row of rows) {
    if (!row.title || !row.url || !row.summary) {
      logs.push({ level: "error", message: "Skipping row with missing title, url, or summary.", source_id: source.id });
      continue;
    }
    items.push(makeDraftItem(source, row as Required<Pick<ManualImportRow, "title" | "url" | "summary">> & ManualImportRow));
  }

  logs.push({ level: "info", message: `Imported ${items.length} item(s).`, source_id: source.id });
  return { items: dedupeImportedItems(items), logs };
}

export async function importManualJsonWithEnrichment(source: Source, rows: ManualImportRow[]): Promise<ImportResult> {
  const items: AnyContentItem[] = [];
  const logs: IngestionLog[] = [];

  for (const row of rows) {
    if (!row.title || !row.url || !row.summary) {
      logs.push({ level: "error", message: "Skipping row with missing title, url, or summary.", source_id: source.id });
      continue;
    }

    const contentType = row.content_type ?? "news";
    const repoRef = parseGitHubRepoUrl(row.url);
    let githubStats: GitHubRepoStats | null = null;
    if (repoRef && isGitHubEnrichable(contentType)) {
      try {
        githubStats = await fetchGitHubRepoStats(repoRef.owner, repoRef.repo);
        if (githubStats) {
          logs.push({ level: "info", message: `Attached GitHub stats for ${githubStats.full_name}.`, source_id: source.id });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logs.push({ level: "error", message: `GitHub enrichment failed: ${message}`, source_id: source.id });
      }
    }

    items.push(makeDraftItem(source, row as Required<Pick<ManualImportRow, "title" | "url" | "summary">> & ManualImportRow, githubStats));
  }

  logs.push({ level: "info", message: `Imported ${items.length} item(s).`, source_id: source.id });
  return { items: dedupeImportedItems(items), logs };
}

export function dedupeImportedItems(items: AnyContentItem[]): AnyContentItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.canonical_url ?? `${item.title}:${item.source_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractTagValue(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

export function normalizeRssItems(source: Source, rssXml: string): ImportResult {
  const itemMatches = [...rssXml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)];
  const rows = itemMatches.map((match) => {
    const itemXml = match[1];
    return {
      title: extractTagValue(itemXml, "title"),
      url: extractTagValue(itemXml, "link"),
      summary: extractTagValue(itemXml, "description") ?? "RSS item imported for review.",
      content_type: "news" as const,
    };
  });

  return importManualJson(source, rows);
}
