import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// @ts-ignore Local ESM pipeline module has no TypeScript declarations.
import { checkAllModelStatuses } from "../../../../scripts/columns/models/sources.mjs";
// @ts-ignore Local ESM pipeline module has no TypeScript declarations.
import { MODEL_REGISTRY } from "../../../../scripts/columns/models/registry.mjs";
// @ts-ignore Local ESM pipeline module has no TypeScript declarations.
import { isAuthorizedRefreshToken } from "../../../../scripts/lib/refresh-auth.mjs";

export const runtime = "nodejs";

const MODELS_FILE = path.join(process.cwd(), "public", "data", "models.json");
const STATUS_FIELDS = [
  "latestVersion",
  "latestVersionVariants",
  "latestReleasedAt",
  "latestReleasedAtPrecision",
  "isOpen",
  "license",
  "hasEvalData",
  "evalSources",
  "evalThirdPartyPending",
  "hasChangelog",
  "changelogUrl",
  "lastCheckedAt",
] as const;

type ModelConfig = {
  id: string;
  name: string;
  vendor: string;
  country: string;
  kind: "open" | "closed";
  latestVersionHint?: string;
};

type FetchedStatus = {
  model: ModelConfig;
  status?: Record<string, unknown>;
};

type ModelsDoc = {
  generatedAt?: string;
  models?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

type RefreshBody = {
  only?: unknown;
  token?: unknown;
};

export async function POST(req: Request) {
  const body = await readRequestJson(req).catch(() => null);
  if (!body) return json({ ok: false, error: "invalid JSON body" }, 400);

  if (!isAuthorizedRefreshToken(body.token)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  try {
    const selected = selectModels(body.only);
    if ("error" in selected) return json({ ok: false, error: selected.error }, selected.status);

    const fetched = (await checkAllModelStatuses(selected.models, {
      logger: console,
    })) as FetchedStatus[];
    const persisted = await persistStatusCards(fetched);
    const updated = fetched.map((item) => ({
      id: item.model.id,
      latestVersion: cleanString(item.status?.latestVersion),
      lastCheckedAt: cleanString(item.status?.lastCheckedAt),
    }));

    return json({
      ok: true,
      checked: fetched.length,
      updated,
      persisted,
    });
  } catch (error) {
    return json({ ok: false, error: shortError(error) }, 500);
  }
}

async function readRequestJson(req: Request): Promise<RefreshBody> {
  const raw = await req.text();
  if (!raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    throw new Error("invalid JSON body");
  }
}

function selectModels(only: unknown):
  | { models: ModelConfig[] }
  | { error: string; status: number } {
  const registry = MODEL_REGISTRY as ModelConfig[];
  if (only === undefined) return { models: [...registry] };

  if (!Array.isArray(only) || !only.every((id) => typeof id === "string")) {
    return { error: "only must be an array of model ids", status: 400 };
  }

  const ids = [...new Set(only.map((id) => id.trim()).filter(Boolean))];
  const knownIds = new Set(registry.map((model) => model.id));
  const unknown = ids.filter((id) => !knownIds.has(id));
  if (unknown.length) return { error: `unknown model id: ${unknown.join(", ")}`, status: 404 };

  const selected = registry.filter((model) => ids.includes(model.id));
  return { models: selected };
}

async function persistStatusCards(fetched: FetchedStatus[]): Promise<boolean> {
  if (!fetched.length) return true;

  try {
    const current = await readModelsDoc();
    const existingModels = Array.isArray(current.models) ? current.models : [];
    const existingById = new Map(existingModels.map((entry) => [String(entry.id), entry]));
    const updatesById = new Map<string, Record<string, unknown>>();

    for (const item of fetched) {
      const existing = existingById.get(item.model.id);
      updatesById.set(item.model.id, mergeStatusFields(existing, item.model, item));
    }

    const nextModels = mergeModelOrder(existingModels, updatesById, fetched.map((item) => item.model));
    const nextDoc = {
      ...current,
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

function mergeStatusFields(
  existing: Record<string, unknown> | undefined,
  model: ModelConfig,
  fetched: FetchedStatus,
) {
  const base = existing || baseEntry(model);
  const statusPatch = buildStatusPatch(model, fetched, existing);
  const next: Record<string, unknown> = {
    ...base,
    ...statusPatch,
  };

  for (const field of STATUS_FIELDS) {
    if (!(field in statusPatch)) delete next[field];
  }

  return next;
}

function baseEntry(model: ModelConfig) {
  return {
    id: model.id,
    name: model.name,
    vendor: model.vendor,
    country: model.country,
    kind: model.kind,
  };
}

function buildStatusPatch(
  model: ModelConfig,
  fetched: FetchedStatus,
  existing: Record<string, unknown> | undefined,
) {
  const status = fetched.status || {};
  const isOpen = model.kind === "open";
  const out: Record<string, unknown> = {
    latestVersion: cleanString(status.latestVersion || existing?.latestVersion || model.latestVersionHint || model.name),
    latestReleasedAt: cleanString(status.latestReleasedAt),
    latestReleasedAtPrecision: cleanOptionalString(status.latestReleasedAtPrecision),
    isOpen,
    license: cleanString(status.license || (isOpen ? "unknown" : "closed")),
    hasEvalData: Boolean(status.hasEvalData),
    evalSources: normalizeStringArray(status.evalSources),
    evalThirdPartyPending: isOpen ? normalizeStringArray(status.evalThirdPartyPending) : undefined,
    hasChangelog: Boolean(status.hasChangelog),
    changelogUrl: cleanString(status.changelogUrl),
    lastCheckedAt: cleanString(status.lastCheckedAt || new Date().toISOString()),
  };
  const variants = normalizeStringArray(status.latestVersionVariants);
  if (variants.length) out.latestVersionVariants = variants;
  return compactObject(out);
}

function mergeModelOrder(
  existingModels: Array<Record<string, unknown>>,
  updatesById: Map<string, Record<string, unknown>>,
  selectedModels: ModelConfig[],
) {
  const existingIds = new Set(existingModels.map((entry) => String(entry.id)));
  const out = existingModels.map((entry) => updatesById.get(String(entry.id)) || entry);
  for (const model of selectedModels) {
    if (!existingIds.has(model.id) && updatesById.has(model.id)) out.push(updatesById.get(model.id)!);
  }
  return out;
}

function compactObject(object: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function cleanOptionalString(value: unknown) {
  const text = cleanString(value);
  return text || undefined;
}

function cleanString(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function normalizeStringArray(value: unknown) {
  const items = value == null ? [] : Array.isArray(value) ? value : [value];
  return items.map((item) => cleanString(item)).filter(Boolean);
}

function shortError(error: unknown) {
  return error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 160) : "refresh failed";
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}
