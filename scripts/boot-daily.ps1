# AI-Brief daily boot task (P0-2, deterministic part). Runs once on first logon each day.
#   git pull -> npm run daily (deterministic: news / papers curation / projects / models + build-index)
#   -> quality gate -> commit + push -> live site ai-brief-v2.vercel.app updates.
# DEEP-READ is now FULL-AUTO (Kevin 2026-06-06, option A) but gated: new deep-reads are authored as
#   cold_audit.status="needs_human" (build-index excludes them) -> the CROSS-MODEL cold-audit gate
#   (codex author / claude audit) flips PASS->"ready_to_publish" (published) or HOLD (excluded+alert).
#   RED LINE (no unreviewed auto-publish) holds: only ready_to_publish/grandfathered reach the index.
#   The author/gate stage is BEST-EFFORT (non-fatal) so a failure never blocks the deterministic push.
# Register: scripts\register-boot-daily.ps1   Logs: logs\boot-daily-<date>.log   Remove: schtasks /Delete /TN "AI-Brief Daily" /F
$ErrorActionPreference = "Stop"
$proj = "C:\Users\Ykw18\OneDrive\Desktop\Study\Project\AI-Brief v2"
Set-Location $proj
$today = Get-Date -Format "yyyy-MM-dd"
$marker = Join-Path $env:TEMP "ai-brief-boot-$today.done"
if (Test-Path $marker) { Write-Output "already ran $today, skip"; exit 0 }   # once per day

New-Item -ItemType Directory -Force -Path (Join-Path $proj "logs") | Out-Null
$log = Join-Path $proj "logs\boot-daily-$today.log"
function Log($m) { $line = "$(Get-Date -Format HH:mm:ss) $m"; Write-Output $line; Add-Content -Path $log -Value $line }

Log "=== AI-Brief daily boot (deterministic) $today ==="
try {
  Log "git pull..."; git pull --rebase --autostash 2>&1 | Tee-Object -FilePath $log -Append

  Log "deterministic daily (npm run daily: news / papers-curation / projects / models + build-index)..."
  npm run daily 2>&1 | Tee-Object -FilePath $log -Append

  # --- full-auto deep-read + cold-audit gate (best-effort; never blocks the deterministic push) ---
  # New reads are authored as needs_human, then the cross-model gate flips PASS->ready_to_publish
  # (published) or HOLD (excluded + alert). Review held items: logs\papers-cold-audit\digest-<date>.md
  try {
    Log "deep-read authoring (strong model, full-text; new reads = needs_human)..."
    npm run papers:deepread 2>&1 | Tee-Object -FilePath $log -Append
    Log "cold-audit gate (cross-model: codex author / claude audit; cap 3; PASS->publishable, HOLD->held)..."
    npm run papers:cold-audit 2>&1 | Tee-Object -FilePath $log -Append
    Log "rebuild index (apply gate statuses: ready_to_publish in, hold/needs_human out)..."
    node scripts/columns/papers/build-index.mjs 2>&1 | Tee-Object -FilePath $log -Append
  } catch { Log "WARN deep-read/cold-audit stage failed (non-fatal; deterministic refresh still publishes): $($_.Exception.Message)" }

  Log "quality gate (fail => no push)..."
  npm run lint 2>&1 | Tee-Object -FilePath $log -Append; $lintOk = ($LASTEXITCODE -eq 0)
  npm run validate 2>&1 | Tee-Object -FilePath $log -Append; $valOk = ($LASTEXITCODE -eq 0)
  if (-not ($lintOk -and $valOk)) { Log "!!! gate failed (lint=$lintOk val=$valOk) => no push, keep last good (no done-marker, can rerun)"; exit 1 }

  Log "commit + push (deploy)..."
  git add -A 2>&1 | Out-Null
  if (git status --porcelain) {
    git commit -m "chore(daily): boot deterministic refresh $today" 2>&1 | Tee-Object -FilePath $log -Append
    git push origin feat/nextjs-migration:main 2>&1 | Tee-Object -FilePath $log -Append
    git push origin feat/nextjs-migration 2>&1 | Tee-Object -FilePath $log -Append
    Log "pushed -> Vercel production updates"
  } else { Log "no data changes, nothing to push" }

  $digest = Join-Path $proj "logs\papers-cold-audit\digest-$today.md"
  if (Test-Path $digest) { Log "NOTE: cold-audit review digest ready ($digest) - held (needs-human) deep-reads listed there." }

  New-Item -ItemType File -Force -Path $marker | Out-Null
  Log "=== deterministic daily done ==="
} catch { Log "!!! FAILED: $($_.Exception.Message)"; exit 1 }
