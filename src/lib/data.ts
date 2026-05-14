import type { ModelsData, TrendingData } from "../types";

let cached: TrendingData | null = null;
let inflight: Promise<TrendingData> | null = null;
let cachedModels: ModelsData | null = null;
let inflightModels: Promise<ModelsData> | null = null;

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
