import { mergeSignals, type PersonalSignals } from "../src/lib/personal/signals";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Minimal localStorage shim — installed BEFORE we import the storage module so
// the singleton picks it up via `globalThis.localStorage`.
function installLocalStorageStub(): { reset: () => void } {
  const map = new Map<string, string>();
  const stub = {
    getItem: (key: string): string | null => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key: string, value: string): void => {
      map.set(key, value);
    },
    removeItem: (key: string): void => {
      map.delete(key);
    },
    clear: (): void => {
      map.clear();
    },
    key: (index: number): string | null => Array.from(map.keys())[index] ?? null,
    get length(): number {
      return map.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: stub, configurable: true });
  return { reset: () => map.clear() };
}

const stub = installLocalStorageStub();

// Import AFTER the stub is installed. `require` is a Node-provided global at
// runtime; the cast through `unknown` is necessary because quality-gates.test.ts
// declares `require` with a narrower return type that doesn't overlap with the
// storage module surface.
const storage = require("../src/lib/personal/storage") as unknown as typeof import("../src/lib/personal/storage");

// 1. mergeSignals does a partial merge and stamps updated_at.
{
  const before: PersonalSignals = { saved_to_kb: false, updated_at: "2026-01-01T00:00:00Z" };
  const after = mergeSignals(before, { evaluation_rating: "accurate" });
  assert(after.saved_to_kb === false, "mergeSignals should preserve saved_to_kb");
  assert(after.evaluation_rating === "accurate", "mergeSignals should apply partial rating");
  assert(after.updated_at !== before.updated_at, "mergeSignals should stamp a fresh updated_at");
}

// 2. writeSignals partial merge preserves existing fields.
stub.reset();
{
  storage.writeSignals("item-1", { evaluation_rating: "insightful" });
  storage.writeSignals("item-1", { notes: "first take" });
  const result = storage.readSignals("item-1");
  assert(result, "expected signals to exist");
  assert(result.evaluation_rating === "insightful", "rating should persist after partial update");
  assert(result.notes === "first take", "notes should be present");
  assert(result.saved_to_kb === false, "default saved_to_kb is false");
}

// 3. readSignals returns null for an unknown id.
stub.reset();
{
  assert(storage.readSignals("does-not-exist") === null, "missing item should return null");
}

// 4. exportSignalsAsJson round-trips through importSignalsFromJson (merge mode).
stub.reset();
{
  storage.writeSignals("item-A", { saved_to_kb: true, notes: "A" });
  storage.writeSignals("item-B", { evaluation_rating: "wrong", notes: "B" });
  const exported = storage.exportSignalsAsJson();

  // Wipe and reimport into the same store.
  stub.reset();
  const result = storage.importSignalsFromJson(exported, "merge");
  assert(result.imported === 2, `merge should import 2 entries, got ${result.imported}`);
  const a = storage.readSignals("item-A");
  const b = storage.readSignals("item-B");
  assert(a && a.saved_to_kb === true, "item-A round-trip preserves saved_to_kb");
  assert(b && b.notes === "B", "item-B round-trip preserves notes");
}

// 5. Merge mode keeps the entry with the later updated_at.
stub.reset();
{
  // Pre-existing newer record.
  storage.writeSignals("item-C", { notes: "newer in store" });
  const newer = storage.readSignals("item-C");
  assert(newer, "newer should exist");
  // Build an older payload to import.
  const olderPayload = JSON.stringify({
    "item-C": { saved_to_kb: false, notes: "older from import", updated_at: "2026-01-01T00:00:00Z" },
  });
  const result = storage.importSignalsFromJson(olderPayload, "merge");
  assert(result.skipped === 1, "older import should be skipped, not imported");
  const final = storage.readSignals("item-C");
  assert(final && final.notes === "newer in store", "newer record should win");
}

// 6. Replace mode wipes existing entries not in the imported payload.
stub.reset();
{
  storage.writeSignals("item-X", { notes: "should be erased" });
  const payload = JSON.stringify({
    "item-Y": { saved_to_kb: false, notes: "Y", updated_at: new Date().toISOString() },
  });
  const result = storage.importSignalsFromJson(payload, "replace");
  assert(result.imported === 1, "replace should import 1 entry");
  assert(storage.readSignals("item-X") === null, "replace should erase entries not in the import");
  assert(storage.readSignals("item-Y") !== null, "replace should keep imported entries");
}

// 7. importSignalsFromJson rejects malformed input.
stub.reset();
{
  let threw = false;
  try {
    storage.importSignalsFromJson("not json", "merge");
  } catch {
    threw = true;
  }
  assert(threw, "invalid JSON must throw");
}

console.log("personal-signals tests passed");
