# Models Refresh API Codex Report

## Endpoints

### `POST /api/models/refresh`

Stage 1 only. This is the cheap, anonymous status refresh path. It calls `checkAllModelStatuses` from `scripts/columns/models/sources.mjs` and does not call the LLM generator.

Request body is optional:

```json
{}
```

To limit the refresh to specific registry ids:

```json
{
  "only": ["deepseek-v4", "anthropic-claude"]
}
```

Success response:

```json
{
  "ok": true,
  "checked": 2,
  "updated": [
    {
      "id": "deepseek-v4",
      "latestVersion": "DeepSeek V4 Pro",
      "lastCheckedAt": "2026-06-02T21:15:00.000Z"
    }
  ],
  "persisted": true
}
```

The route attempts to merge status-card fields back into `public/data/models.json` while preserving each entry's existing `analysis` or `changelog`. The filesystem write is wrapped in `try/catch`; on read-only deployments it returns `persisted: false`.

### `POST /api/models/analyze`

Stage 2. This is the money-spending generation path. It first calls `fetchModelStatus`, then passes that fetched payload to `generateModelEntry`.

Request body:

```json
{
  "id": "anthropic-claude",
  "token": "local-refresh-token"
}
```

The route requires `token === process.env.REFRESH_TOKEN`. Missing or mismatched tokens return:

```json
{
  "ok": false,
  "error": "unauthorized"
}
```

Success response:

```json
{
  "ok": true,
  "entry": {
    "id": "anthropic-claude"
  },
  "persisted": true
}
```

`entry` is the full generated model entry returned by `generateModelEntry`. The route attempts to replace or append that entry in `public/data/models.json`; read-only filesystems return `persisted: false`.

## Local PM Test Commands

Start the Next.js dev server, then call stage 1:

```bash
curl -X POST http://localhost:3000/api/models/refresh
```

Limit stage 1 to one or more ids:

```bash
curl -X POST http://localhost:3000/api/models/refresh \
  -H "Content-Type: application/json" \
  -d '{"only":["anthropic-claude"]}'
```

Call stage 2 with the refresh token:

```bash
curl -X POST http://localhost:3000/api/models/analyze \
  -H "Content-Type: application/json" \
  -d '{"id":"anthropic-claude","token":"YOUR_REFRESH_TOKEN"}'
```

## Persistence TODO

Cloud persistence via Vercel KV is not yet wired. The current local/dev behavior writes `public/data/models.json` when the filesystem allows it and silently skips persistence on read-only hosts.

## Remaining Work

- Add Vercel KV persistence for cloud refresh results.
- Wire the frontend `RefreshButton` to call `/api/models/refresh`. PM owns that frontend work.
