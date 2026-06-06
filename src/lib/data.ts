import type { ArticlesData, ModelsData, PipelineStatusData, TrendingData } from "../types";

let cached: TrendingData | null = null;
let inflight: Promise<TrendingData> | null = null;
let cachedModels: ModelsData | null = null;
let inflightModels: Promise<ModelsData> | null = null;
let cachedArticles: ArticlesData | null = null;
let inflightArticles: Promise<ArticlesData> | null = null;
let cachedPipelineStatus: PipelineStatusData | null = null;
let inflightPipelineStatus: Promise<PipelineStatusData | null> | null = null;

/**
 * Cross-window de-duplication: GitHub trending lists the same repo in daily/weekly/
 * monthly simultaneously, so switching tabs shows the same project repeatedly. Keep
 * each repo in its highest-priority window only (daily > weekly > monthly) so the three
 * boards stay distinct. (Backend dedup is the eventual home; this is the frontend guard.)
 */
function dedupeAcrossWindows(data: TrendingData): TrendingData {
  const claimed = new Set<string>();
  const out = { ...data } as TrendingData;
  for (const win of ["daily", "weekly", "monthly"] as const) {
    const board = data[win];
    if (!board?.repos) continue;
    const kept = board.repos.filter((r) => {
      const key = r.fullName;
      if (!key || claimed.has(key)) return false;
      claimed.add(key);
      return true;
    });
    out[win] = { ...board, repos: kept };
  }
  return out;
}

/**
 * Load the static trending.json produced by `npm run ingest`.
 * The file lives in /public/data and is served at /data/trending.json.
 */
export function loadTrending(): Promise<TrendingData> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetch("/data/trending.json", { cache: "no-cache" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`加载 trending.json 失败：HTTP ${res.status}`);
      const data = dedupeAcrossWindows((await res.json()) as TrendingData);
      cached = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function loadModels(opts?: { force?: boolean }): Promise<ModelsData> {
  if (opts?.force) {
    cachedModels = null;
    inflightModels = null;
  }
  if (cachedModels) return Promise.resolve(cachedModels);
  if (inflightModels) return inflightModels;
  const url = opts?.force ? `/data/models.json?t=${Date.now()}` : "/data/models.json";
  inflightModels = fetch(url, { cache: "no-cache" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`加载 models.json 失败：HTTP ${res.status}`);
      const data = (await res.json()) as ModelsData;
      cachedModels = data;
      return data;
    })
    .finally(() => {
      inflightModels = null;
    });
  return inflightModels;
}

export function loadArticles(): Promise<ArticlesData> {
  if (cachedArticles) return Promise.resolve(cachedArticles);
  if (inflightArticles) return inflightArticles;
  inflightArticles = fetch("/data/articles.json", { cache: "no-cache" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`加载 articles.json 失败：HTTP ${res.status}`);
      const data = (await res.json()) as ArticlesData;
      cachedArticles = data;
      return data;
    })
    .finally(() => {
      inflightArticles = null;
    });
  return inflightArticles;
}

/**
 * Generic loader for a BriefMem entity mirror produced by `npm run brief:build`.
 * Files live in /public/data/brief and are served at /data/brief/<name>.json.
 * Shape: { generatedAt, entity, directory, count, items: [...] }.
 */
export interface BriefEntityFile<T = Record<string, unknown>> {
  generatedAt: string;
  entity: string;
  directory: string;
  count: number;
  items: T[];
}

const briefCache = new Map<string, BriefEntityFile>();

export function loadBriefEntity<T = Record<string, unknown>>(name: string): Promise<BriefEntityFile<T>> {
  const cached = briefCache.get(name);
  if (cached) return Promise.resolve(cached as BriefEntityFile<T>);
  return fetch(`/data/brief/${name}.json`, { cache: "no-cache" }).then(async (res) => {
    if (!res.ok) throw new Error(`加载 brief/${name}.json 失败：HTTP ${res.status}`);
    const data = (await res.json()) as BriefEntityFile<T>;
    briefCache.set(name, data as BriefEntityFile);
    return data;
  });
}

export interface PapersIndex {
  generatedAt: string;
  date: string;
  counts: { deepReads: number; radar: number; deepCandidates: number };
  deepReads: Array<{ slug: string; arxiv_id: string; title: string; date: string; first_seen_date?: string; must_read?: boolean; authors: string[]; tags: string[]; scores: Record<string, number>; source_rankings: string[]; one_sentence_judgment: string; thumbnail_url: string }>;
  deepCandidates: Array<{ arxiv_id: string; title: string; final_score: number; category: string; autosci_relevance: string; one_line: string; deep_slug: string | null }>;
  radar: Array<{ arxiv_id: string; title: string; final_score: number; category: string; one_line: string; deep_slug: string | null }>;
  radarEmpty: boolean;
  board: Record<"daily" | "weekly" | "monthly", Array<{ arxiv_id: string; title: string; upvotes: number; num_comments: number; authors: string[]; thumbnail_url: string; hf_paper_url: string; paper_url: string; already_done: boolean }>>;
}

let cachedPapersIndex: PapersIndex | null = null;
export function loadPapersIndex(): Promise<PapersIndex> {
  if (cachedPapersIndex) return Promise.resolve(cachedPapersIndex);
  return fetch("/data/papers-index.json", { cache: "no-cache" }).then(async (res) => {
    if (!res.ok) throw new Error(`加载 papers-index.json 失败：HTTP ${res.status}`);
    const data = (await res.json()) as PapersIndex;
    cachedPapersIndex = data;
    return data;
  });
}

export function loadPipelineStatus(): Promise<PipelineStatusData | null> {
  if (cachedPipelineStatus) return Promise.resolve(cachedPipelineStatus);
  if (inflightPipelineStatus) return inflightPipelineStatus;
  inflightPipelineStatus = fetch("/data/pipeline-status.json", { cache: "no-cache" })
    .then(async (res) => {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`加载 pipeline-status.json 失败：HTTP ${res.status}`);
      const data = (await res.json()) as PipelineStatusData;
      cachedPipelineStatus = data;
      return data;
    })
    .finally(() => {
      inflightPipelineStatus = null;
    });
  return inflightPipelineStatus;
}
