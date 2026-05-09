import { mergeSignals, type PersonalSignals } from "./signals";

/**
 * Browser-side adapter for PersonalSignals. Writes to localStorage under a
 * single JSON key so the whole map fits in one read/write. Falls back to an
 * in-memory map when localStorage is unavailable (SSR, restricted iframe,
 * private mode), and warns once.
 *
 * The Node side has its own SQLite-backed equivalent in
 * `src/lib/storage/repositories/signals.ts`. Both expose the same shape so
 * components can stay agnostic.
 */

const STORAGE_KEY = "aibrief.personal_signals.v1";

type SignalMap = Record<string, PersonalSignals>;

let memoryMap: SignalMap = {};
let warnedOnceAboutMissingStorage = false;

function hasLocalStorage(): boolean {
  try {
    return typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function warnMissingStorage(): void {
  if (warnedOnceAboutMissingStorage) return;
  warnedOnceAboutMissingStorage = true;
  console.warn(
    "[personal_signals] localStorage is not available; personal signals will only persist for this session.",
  );
}

function readMap(): SignalMap {
  if (!hasLocalStorage()) {
    warnMissingStorage();
    return memoryMap;
  }
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as SignalMap) : {};
  } catch (error) {
    console.warn("[personal_signals] failed to parse localStorage value, resetting:", error);
    return {};
  }
}

function writeMap(map: SignalMap): void {
  if (!hasLocalStorage()) {
    warnMissingStorage();
    memoryMap = map;
    return;
  }
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.warn("[personal_signals] failed to write localStorage value:", error);
  }
}

export function readSignals(itemId: string): PersonalSignals | null {
  const map = readMap();
  return map[itemId] ?? null;
}

export function writeSignals(itemId: string, partial: Partial<PersonalSignals>): PersonalSignals {
  const map = readMap();
  const next = mergeSignals(map[itemId], partial);
  map[itemId] = next;
  writeMap(map);
  notifySubscribers();
  return next;
}

export function deleteSignals(itemId: string): void {
  const map = readMap();
  if (!(itemId in map)) return;
  delete map[itemId];
  writeMap(map);
  notifySubscribers();
}

export function listAllSignals(): SignalMap {
  return readMap();
}

export function exportSignalsAsJson(): string {
  return JSON.stringify(readMap(), null, 2);
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

export function importSignalsFromJson(json: string, mode: "merge" | "replace"): ImportResult {
  let parsed: SignalMap;
  try {
    parsed = JSON.parse(json) as SignalMap;
  } catch {
    throw new Error("Imported JSON is not valid.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Imported JSON must be an object keyed by content id.");
  }

  if (mode === "replace") {
    writeMap(parsed);
    notifySubscribers();
    return { imported: Object.keys(parsed).length, skipped: 0 };
  }

  const map = readMap();
  let imported = 0;
  let skipped = 0;
  for (const [key, candidate] of Object.entries(parsed)) {
    const existing = map[key];
    if (!existing) {
      map[key] = candidate;
      imported += 1;
      continue;
    }
    const candidateTime = Date.parse(candidate.updated_at ?? "") || 0;
    const existingTime = Date.parse(existing.updated_at ?? "") || 0;
    if (candidateTime > existingTime) {
      map[key] = candidate;
      imported += 1;
    } else {
      skipped += 1;
    }
  }
  writeMap(map);
  notifySubscribers();
  return { imported, skipped };
}

type Subscriber = () => void;
const subscribers = new Set<Subscriber>();

function notifySubscribers(): void {
  for (const fn of subscribers) {
    try {
      fn();
    } catch (error) {
      console.warn("[personal_signals] subscriber threw:", error);
    }
  }
}

export function subscribe(callback: Subscriber): () => void {
  subscribers.add(callback);
  // React to cross-tab updates — when another tab writes localStorage, fire too.
  if (hasLocalStorage() && typeof globalThis.addEventListener === "function") {
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) callback();
    };
    globalThis.addEventListener("storage", handler);
    return () => {
      subscribers.delete(callback);
      globalThis.removeEventListener("storage", handler);
    };
  }
  return () => {
    subscribers.delete(callback);
  };
}
