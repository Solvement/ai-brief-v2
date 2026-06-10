# AI-Brief Daily watchdog (2026-06-10, Kevin-approved 三件套之 b).
# WHY: the main pipeline's host process can die silently (observed: console CTRL_C/window-close kills,
# 0xC000013A, three times on 6-09/6-10) and Task Scheduler's RestartCount only covers *failed* starts,
# not a killed-mid-run console. The pipeline's stages are idempotent (ledger marks authored/audited;
# once-per-day marker written only at the very end), so the cheap durable answer is: re-launch and let
# it resume — finished work is skipped, only the unfinished tail reruns.
# Registered by scripts/register-boot-daily.ps1 to run every 30 min. Max 3 revives/day (no ping-pong
# when the pipeline fails deterministically — after 3 the health file / log is the alert surface).
$today = Get-Date -Format "yyyy-MM-dd"
$marker = Join-Path $env:TEMP "ai-brief-boot-$today.done"
if (Test-Path $marker) { exit 0 }                                  # today already completed

if ((Get-Date).Hour -lt 9) { exit 0 }                              # pipeline window starts 09:00

$running = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match "boot-daily\.ps1" }
if ($running) { exit 0 }                                           # main pipeline alive, leave it be

$counter = Join-Path $env:TEMP "ai-brief-watchdog-$today.count"
$n = 0
if (Test-Path $counter) { $n = [int](Get-Content $counter -ErrorAction SilentlyContinue) }
if ($n -ge 3) { exit 0 }                                           # revive budget spent; humans take over
Set-Content -Path $counter -Value ($n + 1)

$proj = "C:\Users\Ykw18\OneDrive\Desktop\Study\Project\AI-Brief v2"
$log = Join-Path $proj "logs\watchdog-$today.log"
Add-Content -Path $log -Value "$(Get-Date -Format HH:mm:ss) pipeline dead + no done-marker -> revive #$($n + 1) (schtasks /Run)"
schtasks /Run /TN "AI-Brief Daily" | Out-Null
