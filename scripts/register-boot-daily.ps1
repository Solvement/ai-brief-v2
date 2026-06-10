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

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$script`"" `
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

Write-Output "Registered 'AI-Brief Daily' (logon+5m AND daily 09:00; restart 3x; 2h limit; once/day via marker)."
