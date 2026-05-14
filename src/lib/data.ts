import type { TrendingData } from "../types";

let cached: TrendingData | null = null;
let inflight: Promise<TrendingData> | null = null;

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
