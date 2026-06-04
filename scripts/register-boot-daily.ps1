# Register the "AI-Brief Daily" boot task (triggers at each logon; the script itself runs once per day).
# Run once:  powershell -ExecutionPolicy Bypass -File scripts\register-boot-daily.ps1
# Remove:    schtasks /Delete /TN "AI-Brief Daily" /F
$proj = "C:\Users\Ykw18\OneDrive\Desktop\Study\Project\AI-Brief v2"
$script = Join-Path $proj "scripts\boot-daily.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$script`"" `
  -WorkingDirectory $proj
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT2M"   # wait 2 min after logon (network / OneDrive sync ready)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1) -RestartCount 1 -RestartInterval (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName "AI-Brief Daily" -Action $action -Trigger $trigger -Settings $settings `
  -Description "First logon each day: deterministic refresh (news/papers/projects/models) + gate + push. Deep-read = separate supervised cmd: npm run papers:deepread" -Force | Out-Null
Write-Output "Registered 'AI-Brief Daily' (at logon, once per day via script guard)."
