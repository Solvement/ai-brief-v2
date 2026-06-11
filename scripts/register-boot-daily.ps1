# Register the "AI-Brief Daily" boot task. Reliable dual-trigger design (2026-06-05):
#   - At logon (+5 min delay so it doesn't race the user the instant they log in), AND
#   - Daily at 09:00 (StartWhenAvailable, so a powered-off machine catches up on next wake).
# Both triggers share boot-daily.ps1's once-per-day marker, so the data refresh runs at most once/day.
# Resilient to interruption: auto-restart 3x (10 min apart), 2-hour time limit.
# See docs/ops/daily-update-reliability.md for the root-cause analysis this replaces.
# Run once:  powershell -ExecutionPolicy Bypass -File scripts\register-boot-daily.ps1
# Remove:    schtasks /Delete /TN "AI-Brief Daily" /F
$proj = "C:\Users\Ykw18\OneDrive\Desktop\Study\Project\AI-Brief v2"
$script = Join-Path $proj "scripts\boot-daily.ps1"

# Hidden (2026-06-10): Minimized still creates a closable console window in the user's session —
# three runs died with 0xC000013A (console CTRL_C/close) on 6-09/6-10, killing the whole pipeline
# including in-flight codex audits. Hidden = no window to close; pipeline output lives in the log.
# Branch checkout in the ACTION (2026-06-11): a concurrent session can leave the shared working dir on
# a branch where boot-daily.ps1 does not even exist (e.g. an old UI branch) — then -File would fail to
# find the script and the whole pipeline silently no-ops. So the action -Command first checks out the
# deploy branch (stashing any other-session WIP into a recoverable named stash), THEN runs the script.
$deployBranch = "feat/nextjs-migration"
$bootCmd = "Set-Location '$proj'; " +
  "if ((git rev-parse --abbrev-ref HEAD).Trim() -ne '$deployBranch') { " +
  "if (git status --porcelain) { git stash push -u -m 'boot-task-autostash' | Out-Null }; " +
  "git checkout $deployBranch | Out-Null }; " +
  "& '$script'"
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command `"$bootCmd`"" `
  -WorkingDirectory $proj

# Two triggers: at logon (delayed 5 min) + daily wall-clock 09:00.
$tLogon = New-ScheduledTaskTrigger -AtLogOn
$tLogon.Delay = "PT5M"
$tDaily = New-ScheduledTaskTrigger -Daily -At 9:00am

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Hours 4) `
  -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10) `
  -MultipleInstances IgnoreNew

# Default principal = the registering interactive user (same as the original task that fired today).
# Specifying an explicit -Principal with a UserId requires admin; we don't need it.
Register-ScheduledTask -TaskName "AI-Brief Daily" `
  -Action $action -Trigger @($tLogon, $tDaily) -Settings $settings `
  -Description "Daily refresh: deterministic (news/papers/projects/models) + full-auto deep-read gated by cross-model cold-audit (needs_human->ready_to_publish/HOLD) + quality gate + push. Triggers: logon(+5m) and 09:00; once/day via marker." `
  -Force | Out-Null

Write-Output "Registered 'AI-Brief Daily' (logon+5m AND daily 09:00; restart 3x; 4h limit; Hidden; once/day via marker)."

# --- Watchdog (2026-06-10): every 30 min, revive a silently-killed pipeline (max 3/day inside the
# script). Stages are ledger-idempotent so a revive only reruns the unfinished tail. ---
$wdScript = Join-Path $proj "scripts\watchdog-daily.ps1"
$wdAction = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$wdScript`"" `
  -WorkingDirectory $proj
# BUGFIX 2026-06-11: -Once trigger's 12h repetition only covered the REGISTRATION day —
# watchdog silently died after day 1 (NextRunTime empty; 6-11 boot ^C went unrevived).
# Daily trigger + repetition pattern = revives every day 09:00-21:00.
$wdTrigger = New-ScheduledTaskTrigger -Daily -At 9:00am
$wdRep = New-ScheduledTaskTrigger -Once -At 9:00am `
  -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Hours 12)
$wdTrigger.Repetition = $wdRep.Repetition
$wdSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName "AI-Brief Daily Watchdog" `
  -Action $wdAction -Trigger $wdTrigger -Settings $wdSettings `
  -Description "Every 30 min 09:00-21:00: if no done-marker for today and no boot-daily.ps1 process, re-run 'AI-Brief Daily' (max 3 revives/day; stages are idempotent via ledger)." `
  -Force | Out-Null
Write-Output "Registered 'AI-Brief Daily Watchdog' (every 30 min, 09:00-21:00, revive max 3/day)."
