import type { EvaluationResult } from "./schema";

export interface CacheEntry {
  key: string;
  value: EvaluationResult;
  cached_at: string;
}

const memoryCache = new Map<string, EvaluationResult>();
const cacheFile = process.env.AIBRIEF_EVALUATION_CACHE_PATH ?? ".cache/evaluations.json";

async function nodeImport(moduleName: string): Promise<unknown> {
  const importer = new Function("moduleName", "return import(moduleName)") as (value: string) => Promise<unknown>;
  return importer(moduleName);
}

async function loadEntries(): Promise<CacheEntry[]> {
  try {
    const fs = (await nodeImport("node:fs/promises")) as {
      readFile(path: string, encoding: "utf8"): Promise<string>;
    };
    const text = await fs.readFile(cacheFile, "utf8");
    const parsed = JSON.parse(text) as CacheEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveEntries(entries: CacheEntry[]): Promise<void> {
  const fs = (await nodeImport("node:fs/promises")) as {
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
    writeFile(path: string, value: string, encoding: "utf8"): Promise<void>;
  };
  await fs.mkdir(".cache", { recursive: true });
  await fs.writeFile(cacheFile, JSON.stringify(entries, null, 2), "utf8");
}

export async function readCache(key: string): Promise<EvaluationResult | null> {
  const memoryHit = memoryCache.get(key);
  if (memoryHit) return memoryHit;

  const entries = await loadEntries();
  const hit = entries.find((entry) => entry.key === key);
  if (!hit) return null;
  memoryCache.set(key, hit.value);
  return hit.value;
}

export async function writeCache(key: string, value: EvaluationResult): Promise<void> {
  memoryCache.set(key, value);
  const entries = (await loadEntries()).filter((entry) => entry.key !== key);
  entries.push({ key, value, cached_at: new Date().toISOString() });
  await saveEntries(entries);
}
