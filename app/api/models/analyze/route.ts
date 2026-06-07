import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// @ts-ignore Local ESM pipeline module has no TypeScript declarations.
import { fetchModelStatus } from "../../../../scripts/columns/models/sources.mjs";
// @ts-ignore Local ESM pipeline module has no TypeScript declarations.
import { generateModelEntry } from "../../../../scripts/columns/models/generate.mjs";
// @ts-ignore Local ESM pipeline module has no TypeScript declarations.
import { getModelConfig } from "../../../../scripts/columns/models/registry.mjs";
// @ts-ignore Local ESM pipeline module has no TypeScript declarations.
import { isAuthorizedRefreshToken } from "../../../../scripts/lib/refresh-auth.mjs";

export const runtime = "nodejs";

const MODELS_FILE = path.join(process.cwd(), "public", "data", "models.json");

type ModelConfig = {
  id: string;
  name: string;
  vendor: string;
  country: string;
  kind: "open" | "closed";
};

type AnalyzeBody = {
  id?: unknown;
  token?: unknown;
};

type ModelsDoc = {
  generatedAt?: string;
  models?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export async function POST(req: Request) {
  const body = await readRequestJson(req).catch(() => null);
  if (!body) return json({ ok: false, error: "invalid JSON body" }, 400);

  if (!isAuthorizedRefreshToken(body.token)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return json({ ok: false, error: "id is required" }, 400);

  const model = getModelConfig(id) as ModelConfig | null;
  if (!model) return json({ ok: false, error: "model not found" }, 404);

  try {
    const fetched = await fetchModelStatus(model, { logger: console });
    const entry = (await generateModelEntry({
      model,
      fetched,
      logger: console,
    })) as Record<string, unknown>;
    const persisted = await persistEntry(entry);

    return json({ ok: true, entry, persisted });
  } catch (error) {
    return json({ ok: false, error: shortError(error) }, 500);
  }
}

async function readRequestJson(req: Request): Promise<AnalyzeBody> {
  const raw = await req.text();
  if (!raw.trim()) return {};

  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : {};
}

async function persistEntry(entry: Record<string, unknown>): Promise<boolean> {
  try {
    const current = await readModelsDoc();
    const existingModels = Array.isArray(current.models) ? current.models : [];
    const entryId = String(entry.id);
    const exists = existingModels.some((model) => String(model.id) === entryId);
    const nextModels = exists
      ? existingModels.map((model) => (String(model.id) === entryId ? entry : model))
      : [...existingModels, entry];
    const nextDoc = {
      ...current,
      generatedAt: cleanString(entry.analysisGeneratedAt || current.generatedAt || new Date().toISOString()),
      models: nextModels,
    };

    // TODO: cloud persistence via Vercel KV — not yet wired.
    await writeModelsDoc(nextDoc);
    return true;
  } catch {
    return false;
  }
}

async function readModelsDoc(): Promise<ModelsDoc> {
  try {
    return JSON.parse(await readFile(MODELS_FILE, "utf8")) as ModelsDoc;
  } catch {
    return { generatedAt: "", models: [] };
  }
}

async function writeModelsDoc(doc: ModelsDoc) {
  await mkdir(path.dirname(MODELS_FILE), { recursive: true });
  await writeFile(MODELS_FILE, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
}

function cleanString(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function shortError(error: unknown) {
  const message = error instanceof Error ? error.message : "analysis failed";
  return `analysis failed: ${message.replace(/\s+/g, " ").slice(0, 140)}`;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}
