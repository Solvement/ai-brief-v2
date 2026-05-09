import type { ContentTag } from "../content/types";
import type { ManualImportRow } from "./index";

export type GitHubTrendingPeriod = "daily" | "weekly" | "monthly";

export interface GitHubTrendingRepository {
  full_name: string;
  html_url: string;
  description: string;
  language?: string;
  trending_period: GitHubTrendingPeriod;
}

export interface HuggingFaceModelSummary {
  id: string;
  pipeline_tag?: string;
  tags?: string[];
  likes?: number;
  downloads?: number;
  lastModified?: string;
}

export type LiveProjectRow = ManualImportRow & {
  title: string;
  url: string;
  summary: string;
  source_text: string;
};

const allowedTags = new Set<ContentTag>([
  "Agent",
  "AI Coding",
  "MCP",
  "Workflow",
  "Prompt",
  "RAG",
  "Multimodal",
  "Local AI",
  "Business",
  "Research",
  "Safety",
  "China",
  "Open Source",
]);

function decodeHtml(value = ""): string {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueTags(values: Array<ContentTag | "">): ContentTag[] {
  return [...new Set(values.filter((value): value is ContentTag => allowedTags.has(value as ContentTag)))];
}

function inferProjectTags(text: string): ContentTag[] {
  const lower = text.toLowerCase();
  return uniqueTags([
    "Open Source",
    /agent|assistant|autonomous/.test(lower) ? "Agent" : "",
    /coding|code|developer|ide|cli|tui/.test(lower) ? "AI Coding" : "",
    /\bmcp\b|connector|hook|skill/.test(lower) ? "MCP" : "",
    /rag|retrieval|vector|embedding/.test(lower) ? "RAG" : "",
    /workflow|automation/.test(lower) ? "Workflow" : "",
    /prompt/.test(lower) ? "Prompt" : "",
    /image|video|audio|multimodal|vision/.test(lower) ? "Multimodal" : "",
    /local|ollama|llama\.cpp|vllm/.test(lower) ? "Local AI" : "",
    /security|safety|policy|guardrail/.test(lower) ? "Safety" : "",
    /research|paper|benchmark|dataset|eval/.test(lower) ? "Research" : "",
  ]);
}

function inferProjectContentType(text: string): "tool" | "project" | "integration" {
  const lower = text.toLowerCase();
  if (/\bmcp\b|connector|integration|hook|skill/.test(lower)) return "integration";
  if (/tool|app|assistant|agent|cli|tui|ide|workflow|studio|dashboard/.test(lower)) return "tool";
  return "project";
}

export function parseGitHubTrendingRepositories(html: string, period: GitHubTrendingPeriod): GitHubTrendingRepository[] {
  const articleMatches = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)];
  const articles = articleMatches.length > 0 ? articleMatches.map((match) => match[1]) : [html];

  return articles
    .map((article): GitHubTrendingRepository | undefined => {
      const linkMatch = article.match(/<h2\b[\s\S]*?<a[^>]+href=["']\/([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch) return undefined;
      const href = linkMatch[1].replace(/^\/+|\/+$/g, "");
      const fullName = decodeHtml(linkMatch[2]).replace(/\s+/g, "");
      if (!/^[^/]+\/[^/]+$/.test(fullName) || href.split("/").length < 2) return undefined;
      const description = decodeHtml(article.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
      const language = decodeHtml(article.match(/itemprop=["']programmingLanguage["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "") || undefined;
      const repository: GitHubTrendingRepository = {
        full_name: fullName,
        html_url: `https://github.com/${fullName}`,
        description,
        language,
        trending_period: period,
      };
      return repository;
    })
    .filter((repo): repo is GitHubTrendingRepository => Boolean(repo));
}

export function buildGitHubTrendingRows(repositories: GitHubTrendingRepository[]): LiveProjectRow[] {
  return repositories.map((repo) => {
    const text = `${repo.full_name} ${repo.description} ${repo.language ?? ""}`;
    return {
      title: repo.full_name,
      url: repo.html_url,
      published_at: new Date().toISOString(),
      summary: `${repo.description || "GitHub Trending repository."} Trending period: ${repo.trending_period}. Language: ${repo.language ?? "unknown"}.`,
      content_type: inferProjectContentType(text),
      tags: inferProjectTags(text),
      source_text: [
        `GitHub Trending period: ${repo.trending_period}`,
        `Repository: ${repo.full_name}`,
        `Description: ${repo.description || "No description"}`,
        `Language: ${repo.language ?? "unknown"}`,
      ].join("\n"),
    };
  });
}

export function buildHuggingFaceProjectRows(models: HuggingFaceModelSummary[]): LiveProjectRow[] {
  return models
    .filter((model) => model.id)
    .map((model) => {
      const tags = model.tags ?? [];
      const text = `${model.id} ${model.pipeline_tag ?? ""} ${tags.join(" ")}`;
      return {
        title: model.id,
        url: `https://huggingface.co/${model.id}`,
        published_at: model.lastModified,
        summary: `Hugging Face trending model/project. Pipeline: ${model.pipeline_tag ?? "unknown"}. Likes: ${model.likes ?? "unknown"}. Downloads: ${model.downloads ?? "unknown"}.`,
        content_type: "project",
        tags: inferProjectTags(text),
        source_text: [
          `Hugging Face model/project: ${model.id}`,
          `pipeline_tag: ${model.pipeline_tag ?? "unknown"}`,
          `tags: ${tags.join(", ") || "none"}`,
          `likes: ${model.likes ?? "unknown"}`,
          `downloads: ${model.downloads ?? "unknown"}`,
          `lastModified: ${model.lastModified ?? "unknown"}`,
        ].join("\n"),
      };
    });
}
