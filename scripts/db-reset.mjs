#!/usr/bin/env node
// Wipe the SQLite database file and WAL/SHM siblings. Useful when migrations
// change in incompatible ways or when you want a fresh demo state. After
// running, re-run `npm run db:init` to repopulate.

import { existsSync, unlinkSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = resolve(projectRoot, ".data");
const dbPath = resolve(process.env.AIBRIEF_DB_PATH ?? join(dataRoot, "aibrief.db"));
const dataRelative = relative(dataRoot, dbPath);
const externalAllowed = process.argv.includes("--force-external-db-path");

if ((dataRelative.startsWith("..") || dataRelative === "" || dataRelative.includes(":")) && !externalAllowed) {
  throw new Error(
    `[db-reset] Refusing to delete outside ${dataRoot}. Pass --force-external-db-path only for an explicitly reviewed external DB path.`,
  );
}

let removed = 0;
for (const suffix of ["", "-wal", "-shm"]) {
  const target = `${dbPath}${suffix}`;
  if (existsSync(target)) {
    unlinkSync(target);
    removed += 1;
    console.log(`[db-reset] removed ${target}`);
  }
}

if (removed === 0) {
  console.log(`[db-reset] no database at ${dbPath}; nothing to remove.`);
}
