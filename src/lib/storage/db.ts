import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type DatabaseInstance = DatabaseSync;

/**
 * Single SQLite handle for the whole process. Node's built-in SQLite API is
 * synchronous, which is the right ergonomic for Node tooling (ingestion,
 * scripts, tests) without adding a native npm addon.
 * The browser bundle never imports this file; public routes read the generated
 * live snapshot until we ship a server build.
 */

const projectRoot = resolve(process.env.AIBRIEF_PROJECT_ROOT ?? process.cwd());
const defaultDbPath = process.env.AIBRIEF_DB_PATH ?? join(projectRoot, ".data", "aibrief.db");
const migrationsDir = join(projectRoot, "src", "lib", "storage", "migrations");

let cached: DatabaseInstance | null = null;

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export interface OpenDbOptions {
  /** Override the on-disk path (test isolation, alternate environments). */
  path?: string;
  /** Open as `:memory:` for repository tests. */
  memory?: boolean;
  /** Force a new handle even if one is cached. */
  fresh?: boolean;
}

export function openDb(options: OpenDbOptions = {}): DatabaseInstance {
  if (cached && !options.fresh && !options.path && !options.memory) {
    return cached;
  }

  const path = options.memory ? ":memory:" : options.path ?? defaultDbPath;
  if (path !== ":memory:") ensureDir(path);

  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");

  runPendingMigrations(db);

  if (!options.path && !options.memory && !options.fresh) {
    cached = db;
  }
  return db;
}

export function closeDb(): void {
  if (cached) {
    cached.close();
    cached = null;
  }
}

interface AppliedMigration {
  filename: string;
  applied_at: string;
}

function runPendingMigrations(db: DatabaseInstance): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename TEXT PRIMARY KEY,
       applied_at TEXT NOT NULL DEFAULT (datetime('now'))
     );`,
  );
  const appliedRows = db.prepare("SELECT filename, applied_at FROM schema_migrations").all() as unknown as AppliedMigration[];
  const applied = new Set<string>(appliedRows.map((row) => row.filename));

  if (!existsSync(migrationsDir)) return;
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const recordMigration = db.prepare("INSERT INTO schema_migrations (filename) VALUES (?)");

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    runInTransaction(db, () => {
      db.exec(sql);
      recordMigration.run(file);
    });
  }
}

export function runInTransaction<T>(db: DatabaseInstance, callback: () => T): T {
  db.exec("BEGIN");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

/** For tests / scripts that want a clean slate. */
export function resetDb(path?: string): void {
  closeDb();
  const target = path ?? defaultDbPath;
  // SQLite keeps WAL/SHM siblings; remove all three.
  for (const suffix of ["", "-wal", "-shm"]) {
    const candidate = `${target}${suffix}`;
    if (existsSync(candidate)) unlinkSync(candidate);
  }
}
