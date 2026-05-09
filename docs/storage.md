# Storage layer

AI-brief uses **SQLite via Node's built-in `node:sqlite`** as the persistence layer for
ingestion, evaluation cache, and personal signals. SQLite is a single file
sitting at `.data/aibrief.db` (gitignored). Browser code never touches the DB
directly; the Vite dev/prod build reads the generated live snapshot from
`src/lib/content/live.generated.ts`. The DB is the source of truth for Node tooling
(scripts, ingestion, and any future SSR layer).

## Why SQLite (and not localStorage / Postgres / a JSON file)

- **Single file** - `git clone` + `npm install` + `npm run db:init` and you're
  running. No external service to provision. Friendly to reviewers, HR, and
  judges of dev competitions.
- **Synchronous API** - `node:sqlite` keeps storage scripts simple. They read
  like plain code; tests do not have to await each insert.
- **Indexes** - sorting by impact + filtering by tag is `WHERE/ORDER BY`,
  not a JSON full-scan.
- **Forward path** - when we want vector search we add the
  [`sqlite-vec`](https://github.com/asg017/sqlite-vec) extension; no rewrite.
- **Backups are trivial** - copy the `.db` file.

## Layout

```
src/lib/storage/
  db.ts                              # singleton handle + migration runner
  index.ts                           # public Node API surface
  migrations/
    001_content.sql                  # content_items, content_tags, evaluations, sources, ingestion_log
    002_personal_signals.sql         # per-item personal feedback
  repositories/
    content.ts                       # upsert / list / get / delete content_items
    evaluation.ts                    # cache by SHA-256 cache_key + prompt_version
    signals.ts                       # personal_signals CRUD
```

## Tables

| Table              | What it stores                                    | Key                |
| ------------------ | ------------------------------------------------- | ------------------ |
| `content_items`    | Every `ContentItem` (full JSON in `payload`)      | `id`               |
| `content_tags`     | Many-to-many between content and tag             | (`content_id`,`tag`) |
| `evaluations`      | Cached `EvaluationResult` keyed by SHA-256        | `cache_key`        |
| `sources`          | Ingestion sources (RSS / API / GitHub repos)      | `id`               |
| `ingestion_log`    | Per-source info / error log                       | autoincrement      |
| `personal_signals` | Kevin's feedback per content item                 | `content_id`       |
| `schema_migrations`| Records each applied `.sql` migration             | `filename`         |

The `payload` columns hold the full JSON of the original TS object. Flat
columns (scores, status, content_type, etc.) are projections from the JSON,
populated by the repository at write time, used for `WHERE/ORDER BY`.

## Migrations

Files in `src/lib/storage/migrations/` are applied in lexicographic order.
Each is wrapped in a transaction and recorded in `schema_migrations` so they
run exactly once. To add a new table or column:

1. Create `src/lib/storage/migrations/00N_<name>.sql`.
2. Use `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE`.
3. Run `npm run db:init`. The runner picks up the new file automatically.

There is no down-migration mechanism. Reset with `npm run db:reset` and
re-init when you need a clean slate.

## Scripts

```
npm test           # compile .tmp/test-build/ used by db:init
npm run db:init    # apply migrations + seed content_items from seed.ts
npm run db:reset   # delete .data/aibrief.db (and WAL/SHM siblings)
```

`db:init` compiles the TypeScript modules it needs into `.tmp/db-build/` before
loading `seed.js` and `storage/index.js`, so it works after `npm install`
without requiring a prior `npm test` run.

## Browser separation

The browser bundle MUST NOT import from `src/lib/storage/`. `node:sqlite` is
a Node-only API and Vite cannot bundle it. The convention here is:

- `src/lib/content/queries.ts` is browser-friendly and reads
  `live.generated.ts` directly for public routes.
- Scripts under `scripts/` and tests under `tests/` may import the storage
  layer.
- When SSR or a server-rendered page is added, that surface will sit beside
  the existing browser code and call into `src/lib/storage/`.

## Cache integration with the evaluator

The Phase 1 evaluator caches results in `.cache/evaluations.json`. The DB
gives us a structured replacement: `evaluations.cache_key` is the same
SHA-256 hash, but rows also carry `prompt_version` and `model` so we can
invalidate stale generations with a single `WHERE prompt_version = ?` query
(see `listStaleEvaluations`). The migration is incremental: new evaluations
write to both, and the JSON cache will be retired in a follow-up phase once
all callers are on the DB path.
