import type { AnyContentItem } from "../content/types";
import type { EvaluationInput, EvaluationResult, InputQuality, SourceType } from "../ai/evaluation/schema";

export interface RepositoryCandidate {
  name?: string;
  full_name?: string;
  description?: string | null;
  topics?: string[] | null;
  language?: string | null;
}

const strongAiSignals = [
  /\bagents?\b/i,
  /\bllm\b/i,
  /\brag\b/i,
  /\bmcp\b/i,
  /\bcopilot\b/i,
  /\bchatbot\b/i,
  /\bopenai\b/i,
  /\bclaude\b/i,
  /\bcursor\b/i,
  /\bcodex\b/i,
  /\bdeepseek\b/i,
  /\btransformers?\b/i,
  /\bdiffusion\b/i,
  /\bembedding\b/i,
  /\bprompt\b/i,
  /\bskill pack\b/i,
  /\bai coding\b/i,
];

const weakAiSignals = [/\bai\b/i, /\bml\b/i, /\bmachine learning\b/i, /\bartificial intelligence\b/i];

export function isAiRepositoryCandidate(repo: RepositoryCandidate): boolean {
  const text = [repo.full_name, repo.name, repo.description, ...(repo.topics ?? [])].filter(Boolean).join(" ");
  if (strongAiSignals.some((signal) => signal.test(text))) return true;
  return weakAiSignals.filter((signal) => signal.test(text)).length >= 2;
}

function sourceTextQuality(text: string | undefined, fallbackText: string): InputQuality {
  const value = (text ?? "").trim();
  if (value.length >= 1200) return "raw_full_text";
  if (value.length >= 240) return "raw_excerpt";
  return fallbackText.trim().length >= 240 ? "multi_source_summary" : "raw_excerpt";
}

function githubStatsText(item: AnyContentItem): string {
  const stats = item.github_stats;
  if (!stats) return "";
  return [
    "GitHub stats:",
    `full_name: ${stats.full_name}`,
    `stars: ${stats.stars}`,
    `forks: ${stats.forks}`,
    `open_issues: ${stats.open_issues}`,
    `open_prs: ${stats.open_prs}`,
    `contributors_count: ${stats.contributors_count}`,
    `license: ${stats.license ?? "unknown"}`,
    `last_commit_days_ago: ${stats.last_commit_days_ago}`,
    `releases_last_90d: ${stats.releases_last_90d}`,
    `primary_language: ${stats.primary_language ?? "unknown"}`,
  ].join("\n");
}

export function buildLiveEvaluationInput(item: AnyContentItem, sourceType: SourceType, richSourceText?: string): EvaluationInput {
  const statsText = githubStatsText(item);
  const fallbackText = [item.title, item.summary, statsText].filter(Boolean).join("\n\n");
  const sourceText = [item.title, richSourceText?.trim() || item.summary, statsText].filter(Boolean).join("\n\n");

  return {
    content_type: item.content_type,
    title: item.title,
    sources: [
      {
        id: "live_source",
        title: item.title,
        url: item.source_url,
        source_name: item.source_name,
        source_type: sourceType,
        published_at: item.published_at,
        text: sourceText,
      },
    ],
    metadata: {
      source_type: sourceType,
      source_count: 1,
      has_official_source: sourceType === "official" || sourceType === "paper",
      collected_at: new Date().toISOString(),
    },
    input_quality: sourceTextQuality(richSourceText, fallbackText),
    github_stats: item.github_stats,
  };
}

export function isLiveEvaluationPublishable(result: EvaluationResult): boolean {
  return /^eval-v\d+$/.test(result.prompt_version);
}
