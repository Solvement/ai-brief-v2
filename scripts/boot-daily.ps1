# AI-Brief daily boot task (P0-2, deterministic part). Runs once on first logon each day.
#   git pull -> npm run daily (deterministic: news / papers curation / projects / models + build-index)
#   -> quality gate -> commit + push -> live site ai-brief-v2.vercel.app updates.
# NOTE: the paper DEEP-READ authoring is a strong-model (open-ended agent) step. Per the project's
#   red line ("no open-ended agent in the daily pipeline; it must be a deterministic script"), it is
#   NOT in this unattended task. Run it supervised after boot:  npm run papers:deepread
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

  $cand = Join-Path $proj "content\deep-dive-candidates\$today.md"
  if (Test-Path $cand) { Log "NOTE: today's deep-read candidates ready ($cand). When present, run:  npm run papers:deepread  (strong model, supervised)." }

  New-Item -ItemType File -Force -Path $marker | Out-Null
  Log "=== deterministic daily done ==="
} catch { Log "!!! FAILED: $($_.Exception.Message)"; exit 1 }
