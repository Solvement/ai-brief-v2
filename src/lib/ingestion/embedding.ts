import { getEnv } from "../ai/evaluation/env";

const localDimensions = 256;
let memoryCache: Record<string, number[]> | null = null;

async function nodeImport(moduleName: string): Promise<unknown> {
  const importer = new Function("moduleName", "return import(moduleName)") as (value: string) => Promise<unknown>;
  return importer(moduleName);
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readCache(): Promise<Record<string, number[]>> {
  if (memoryCache) return memoryCache;
  try {
    const fs = (await nodeImport("node:fs/promises")) as { readFile(path: string, encoding: "utf8"): Promise<string> };
    const parsed = JSON.parse(await fs.readFile(".cache/embeddings.json", "utf8")) as Record<string, number[]>;
    memoryCache = parsed && typeof parsed === "object" ? parsed : {};
    return memoryCache;
  } catch {
    memoryCache = {};
    return memoryCache;
  }
}

async function writeCache(cache: Record<string, number[]>): Promise<void> {
  memoryCache = cache;
  try {
    const fs = (await nodeImport("node:fs/promises")) as {
      mkdir(path: string, options: { recursive: boolean }): Promise<void>;
      writeFile(path: string, value: string, encoding: "utf8"): Promise<void>;
    };
    await fs.mkdir(".cache", { recursive: true });
    await fs.writeFile(".cache/embeddings.json", JSON.stringify(cache), "utf8");
  } catch {
    // Browser/client execution cannot use node:fs; keep the in-memory cache and continue.
  }
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const tokens: string[] = [...(lower.match(/[a-z0-9][a-z0-9-]*/g) ?? [])];
  const cjk: string[] = lower.match(/[\u4e00-\u9fff]+/g) ?? [];
  for (const chunk of cjk) {
    for (let index = 0; index < chunk.length - 1; index += 1) {
      tokens.push(chunk.slice(index, index + 2));
    }
  }
  return tokens;
}

function localEmbedding(text: string): number[] {
  const vector = Array.from({ length: localDimensions }, () => 0);
  for (const token of tokenize(text)) {
    const weight = /[0-9-]/.test(token) ? 5 : 1;
    vector[hashToken(token) % localDimensions] += weight;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return magnitude > 0 ? vector.map((value) => value / magnitude) : vector;
}

async function openAiEmbedding(text: string): Promise<number[]> {
  const apiKey = getEnv("EMBEDDING_API_KEY") ?? getEnv("OPENAI_API_KEY");
  if (!apiKey) throw new Error("EMBEDDING_API_KEY is required for live embeddings.");
  const model = getEnv("EMBEDDING_MODEL") ?? "text-embedding-3-small";
  const baseUrl = (getEnv("EMBEDDING_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: text }),
  });
  if (!response.ok) {
    const body = (await response.text())
      .replace(/sk-proj-[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|github_pat_[A-Za-z0-9_]+/g, "[redacted]")
      .slice(0, 300);
    throw new Error(`Embedding request failed with ${response.status}: ${body}`);
  }
  const data = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
  const embedding = data.data?.[0]?.embedding;
  if (!embedding?.length) throw new Error("Embedding response did not include a vector.");
  return embedding;
}

export async function embed(text: string): Promise<number[]> {
  const model = getEnv("EMBEDDING_LIVE") === "1" ? (getEnv("EMBEDDING_MODEL") ?? "text-embedding-3-small") : "local-hash-v1";
  const key = await sha256(`${text}|${model}`);
  const cache = await readCache();
  if (cache[key]) return cache[key];
  const value = getEnv("EMBEDDING_LIVE") === "1" ? await openAiEmbedding(text) : localEmbedding(text);
  cache[key] = value;
  await writeCache(cache);
  return value;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    aNorm += a[index] * a[index];
    bNorm += b[index] * b[index];
  }
  if (aNorm === 0 || bNorm === 0) return 0;
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}
