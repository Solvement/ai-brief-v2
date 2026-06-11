# AI-Brief daily boot task (P0-2, deterministic part). Runs once on first logon each day.
#   git pull -> npm run daily (deterministic: news / papers curation / projects / models + build-index)
#   -> quality gate -> commit + push -> live site ai-brief-v2.vercel.app updates.
# DEEP-READ is now FULL-AUTO (Kevin 2026-06-06, option A) but gated: new deep-reads are authored as
#   cold_audit.status="needs_human" (build-index excludes them) -> the CROSS-MODEL cold-audit gate
#   (codex author / claude audit) flips PASS->"ready_to_publish" (published) or HOLD (excluded+alert).
#   RED LINE (no unreviewed auto-publish) holds: only ready_to_publish/grandfathered reach the index.
#   The author/gate stage is BEST-EFFORT (non-fatal) so a failure never blocks the deterministic push.
# Register: scripts\register-boot-daily.ps1   Logs: logs\boot-daily-<date>.log   Remove: schtasks /Delete /TN "AI-Brief Daily" /F
# ROOT-CAUSE FIX (2026-06-09): was $ErrorActionPreference="Stop" — in PS 5.1, `native 2>&1 | Tee`
# wraps every child stderr line in an ErrorRecord, and EAP=Stop turns the FIRST one into a terminating
# error. 2026-06-09 boot died at 09:15 on a benign news-script retry notice ("transient fetch rss
# openai ... retry 1/3"). Continue + explicit $LASTEXITCODE checks below = real failures still stop,
# stderr chatter doesn't.
$ErrorActionPreference = "Continue"
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
  # Branch pin (2026-06-11): a concurrent session can leave the shared working dir on another branch
  # (e.g. a UI-redesign branch). The nightly pipeline must always run on the deploy branch, else it
  # runs/commits on the wrong branch (or this very script is absent on that branch). Stash any
  # other-session WIP into a NAMED, recoverable stash (never discard) then checkout the deploy branch.
  $deployBranch = "feat/nextjs-migration"
  $curBranch = (git rev-parse --abbrev-ref HEAD 2>$null)
  if ($curBranch) { $curBranch = $curBranch.Trim() }
  if ($curBranch -ne $deployBranch) {
    Log "branch pin: on '$curBranch', switching to '$deployBranch'"
    if (git status --porcelain) {
      git stash push -u -m "boot-pin-autostash-$today" 2>&1 | Tee-Object -FilePath $log -Append
      Log "branch pin: stashed other-session WIP (recover via: git stash list | git stash pop)"
    }
    git checkout $deployBranch 2>&1 | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -ne 0) { throw "branch pin: checkout $deployBranch failed (exit $LASTEXITCODE)" }
  }

  Log "git pull..."; git pull --rebase --autostash 2>&1 | Tee-Object -FilePath $log -Append
  if ($LASTEXITCODE -ne 0) { throw "git pull failed (exit $LASTEXITCODE)" }

  # last30days community-signal discovery sub-layer for the news column (Reddit/HN/Polymarket/GitHub,
  # deterministic/headless, zero keys). Supplements official-blog RSS — which can underperform on a
  # given day (e.g. 2026-06-08 boot got only HN/Reddit). The column still does Chinese + 20/day cap.
  $env:NEWS_LAST30DAYS = "1"

  # Loop Contract Gate bypass (KG-2 harness, 2026-06-09): the gate hook (.claude/hooks/
  # loop_contract_gate.py) blocks implementation writes until a contract is filled — correct for
  # interactive sessions, FATAL for this deterministic pipeline's headless claude -p calls (deep-read
  # authoring would deadlock: it can never fill a contract). Pipeline = deterministic script, already
  # red-line governed; the gate is for interactive/agentic work only.
  $env:LOOP_GATE = "off"

  Log "deterministic daily (npm run daily: news / papers-curation / projects / models + build-index)..."
  npm run daily 2>&1 | Tee-Object -FilePath $log -Append
  if ($LASTEXITCODE -ne 0) { throw "npm run daily failed (exit $LASTEXITCODE)" }

  # --- full-auto deep-read + cold-audit gate (best-effort; never blocks the deterministic push) ---
  # New reads are authored as needs_human, then the cross-model gate flips PASS->ready_to_publish
  # (published) or HOLD (excluded + alert). Review held items: logs\papers-cold-audit\digest-<date>.md
  #
  # ROOT-CAUSE FIX (Kevin 2026-06-08): deep-read + cold-audit author via the Claude CLI on the
  # SUBSCRIPTION. A lingering ANTHROPIC_API_KEY (it was in .env.local + the user env) forced claude -p
  # onto the pay-per-token API instead — whose balance was depleted, so deep-read failed with
  # "Credit balance is too low" SILENTLY for 2 days. Verified: unset the key => claude -p uses the
  # subscription and works. Nothing in scripts/ uses the raw key. Unset it for the boot's claude calls.
  Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
  try {
    Log "deep-read authoring (strong model, full-text; new reads = needs_human)..."
    npm run papers:deepread 2>&1 | Tee-Object -FilePath $log -Append
    Log "cold-audit gate (cross-model: codex author / claude audit; cap 3; PASS->publishable, HOLD->held)..."
    npm run papers:cold-audit 2>&1 | Tee-Object -FilePath $log -Append
    Log "rebuild index (apply gate statuses: ready_to_publish in, hold/needs_human out)..."
    node scripts/columns/papers/build-index.mjs 2>&1 | Tee-Object -FilePath $log -Append

    # Mind Palace auto-ingest (2026-06-10, Kevin acceptance: "中午打开已是…+mind palace"): newly
    # published (ready_to_publish) deep-reads get facet-v2 distilled (fixed-prompt claude -p, cap 2)
    # behind a DOUBLE gate (structural precheck + validate-mind-palace; fail => rollback, no graph
    # pollution). Best-effort: a failure never blocks the deterministic push.
    Log "mind-palace auto-ingest (facet distill -> validator gate -> embed/integrate; cap 2)..."
    npm run kg:ingest 2>&1 | Tee-Object -FilePath $log -Append

    # DURABLE deep-read gap guard (Kevin 2026-06-08): the deep-read stage above is best-effort and
    # used to fail SILENTLY (no alert, no retry) — it sat broken for 2 days (6-07/08) unnoticed. Now:
    # compute a VISIBLE health file (public/data/papers-deepread-health.json, deploys with the site)
    # comparing what was SELECTED for deep-read vs what was AUTHORED+published, and on a gap retry the
    # authoring ONCE in-boot (self-heals transient claude -p failures / rate limits).
    Log "deep-read coverage check (selected-vs-authored; writes visible health file)..."
    node scripts/columns/papers/check-deepread-coverage.mjs 2>&1 | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -ne 0) {
      Log "WARN deep-read coverage GAP -> retry authoring once (self-heal)..."
      npm run papers:deepread 2>&1 | Tee-Object -FilePath $log -Append
      npm run papers:cold-audit 2>&1 | Tee-Object -FilePath $log -Append
      node scripts/columns/papers/build-index.mjs 2>&1 | Tee-Object -FilePath $log -Append
      node scripts/columns/papers/check-deepread-coverage.mjs 2>&1 | Tee-Object -FilePath $log -Append
      if ($LASTEXITCODE -ne 0) { Log "!!! deep-read coverage STILL gapped after one retry -> see public/data/papers-deepread-health.json (deployed/visible); manual rerun needed" }
    }
  } catch { Log "WARN deep-read/cold-audit stage failed (non-fatal; deterministic refresh still publishes): $($_.Exception.Message)" }

  # Machine gate before deploy = `npm run verify` (ESLint + content lint, node:test unit
  # tests, content validate, next build). Lighthouse perf/a11y + visual-regression are
  # MANUAL/periodic (run via /browse), NOT auto-gated here; see specs/quality-gate.md.
  Log "quality gate (npm run verify = lint + test + validate + build; fail => no push)..."
  npm run verify 2>&1 | Tee-Object -FilePath $log -Append; $gateOk = ($LASTEXITCODE -eq 0)
  if (-not $gateOk) { Log "!!! gate failed (npm run verify) => no push, keep last good (no done-marker, can rerun)"; exit 1 }

  Log "commit + push (deploy)..."
  git add -A 2>&1 | Out-Null
  if (git status --porcelain) {
    git commit -m "chore(daily): boot deterministic refresh $today" 2>&1 | Tee-Object -FilePath $log -Append
    git push origin feat/nextjs-migration:main 2>&1 | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -ne 0) { throw "git push to main failed (exit $LASTEXITCODE)" }
    git push origin feat/nextjs-migration 2>&1 | Tee-Object -FilePath $log -Append
    Log "pushed -> Vercel production updates"
  } else { Log "no data changes, nothing to push" }

  $digest = Join-Path $proj "logs\papers-cold-audit\digest-$today.md"
  if (Test-Path $digest) { Log "NOTE: cold-audit review digest ready ($digest) - held (needs-human) deep-reads listed there." }

  New-Item -ItemType File -Force -Path $marker | Out-Null
  Log "=== deterministic daily done ==="
} catch { Log "!!! FAILED: $($_.Exception.Message)"; exit 1 }
