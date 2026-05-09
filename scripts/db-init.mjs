#!/usr/bin/env node
// Bootstrap the SQLite database with the latest migrations and seed data.
// Run this once after `npm install`, or when migrations change. Idempotent.

import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(projectRoot, ".tmp", "db-build");
const tsc = join(projectRoot, "node_modules", "typescript", "bin", "tsc");

execFileSync(process.execPath, [tsc, "-p", "tsconfig.test.json", "--outDir", outDir], {
  cwd: projectRoot,
  stdio: "inherit",
});

const compiledSeed = join(outDir, "src", "lib", "content", "seed.js");
const compiledStorage = join(outDir, "src", "lib", "storage", "index.js");

const seedModule = await import(pathToFileURL(compiledSeed).href);
const storage = await import(pathToFileURL(compiledStorage).href);

const items = seedModule.contentItems ?? [];

console.log(`[db-init] Loading ${items.length} content items into SQLite...`);
storage.openDb();
const written = storage.bulkUpsertContent(items);
console.log(`[db-init] Upserted ${written} records.`);

const total = storage.countContent();
console.log(`[db-init] DB now contains ${total} content items.`);
storage.closeDb();
console.log("[db-init] Done.");
