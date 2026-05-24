import type { ArticlesData, ModelsData, PaperRadarPublicData, PipelineStatusData, TrendingData } from "../types";

let cached: TrendingData | null = null;
let inflight: Promise<TrendingData> | null = null;
let cachedModels: ModelsData | null = null;
let inflightModels: Promise<ModelsData> | null = null;
let cachedArticles: ArticlesData | null = null;
let inflightArticles: Promise<ArticlesData> | null = null;
let cachedPaperRadar: PaperRadarPublicData | null = null;
let inflightPaperRadar: Promise<PaperRadarPublicData | null> | null = null;
let cachedPipelineStatus: PipelineStatusData | null = null;
let inflightPipelineStatus: Promise<PipelineStatusData | null> | null = null;

/**
 * Load the static trending.json produced by `npm run ingest`.
 * The file lives in /public/data and is served at /data/trending.json.
 */
export function loadTrending(): Promise<TrendingData> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetch("./data/trending.json", { cache: "no-cache" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`加载 trending.json 失败：HTTP ${res.status}`);
      const data = (await res.json()) as TrendingData;
      cached = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function loadModels(): Promise<ModelsData> {
  if (cachedModels) return Promise.resolve(cachedModels);
  if (inflightModels) return inflightModels;
  inflightModels = fetch("./data/models.json", { cache: "no-cache" })
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
  inflightArticles = fetch("./data/articles.json", { cache: "no-cache" })
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

export function loadPaperRadar(): Promise<PaperRadarPublicData | null> {
  if (cachedPaperRadar) return Promise.resolve(cachedPaperRadar);
  if (inflightPaperRadar) return inflightPaperRadar;
  inflightPaperRadar = fetch("./data/paper-radar.json", { cache: "no-cache" })
    .then(async (res) => {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`加载 paper-radar.json 失败：HTTP ${res.status}`);
      const data = (await res.json()) as PaperRadarPublicData;
      cachedPaperRadar = data;
      return data;
    })
    .finally(() => {
      inflightPaperRadar = null;
    });
  return inflightPaperRadar;
}

export function loadPipelineStatus(): Promise<PipelineStatusData | null> {
  if (cachedPipelineStatus) return Promise.resolve(cachedPipelineStatus);
  if (inflightPipelineStatus) return inflightPipelineStatus;
  inflightPipelineStatus = fetch("./data/pipeline-status.json", { cache: "no-cache" })
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
