# Daily update reliability — root cause + stable fix

> Status: **diagnosis + proposal only.** Nothing below has been executed. Do not register/modify
> the scheduled task, run the pipeline, or push until Kevin approves (the fix auto-pushes to prod).
> Written 2026-06-05.

## TL;DR

The scheduled task **exists and fires**, but it runs on a **single at-logon trigger** and got
**killed mid-run today right after the `news` step** (before papers / projects / models / gate / push).
Because the once-per-day marker is only written on full success, the data ended up half-stale.
The fix is to (a) add a **daily wall-clock trigger** alongside at-logon (both guarded by the existing
once-per-day marker so it still runs at most once/day), (b) make the run **resilient to being
interrupted** (restart-on-fail, longer/again time limit, don't race the user), and (c) keep the
existing lightweight `predev` catch-up as a fallback. Registering an **unattended auto-push to prod
needs Kevin's explicit OK.**

## Evidence

- **Task IS registered.** `Get-ScheduledTask -TaskName "AI-Brief Daily"` → `State: Ready`,
  registered by `scripts\register-boot-daily.ps1`.
  - Trigger: **`MSFT_TaskLogonTrigger`** (at-logon for user `Ykw18`), `Delay = PT2M`. **Only one
    trigger — no daily time trigger.**
  - Action: `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File
    "...\scripts\boot-daily.ps1"`, WorkingDirectory = project root.
  - Principal: `UserId = Ykw18`, `LogonType = Interactive`, `RunLevel = Limited` (not elevated).
  - Settings: `ExecutionTimeLimit = PT1H`, `StartWhenAvailable = True`,
    `DisallowStartIfOnBatteries = True`, `StopIfGoingOnBatteries = True`, `MultipleInstances = IgnoreNew`.

- **It RAN today and FAILED.** `Get-ScheduledTaskInfo` →
  `LastRunTime = 2026/6/5 8:06:09`, **`LastTaskResult = 3221225786` = `0xC000013A` =
  `STATUS_CONTROL_C_EXIT`** (the process was **terminated**, not a script error).

- **No boot markers exist** (`$env:TEMP\ai-brief-boot-*.done`, TEMP = `C:\Users\Ykw18\AppData\Local\Temp`)
  for any date. The marker is only written at the very end of a fully successful run, so a killed run
  leaves none — consistent with the task dying before completion.

- **The boot log proves where it died.** `logs\boot-daily-2026-06-05.log` ends at:
  ```
  08:06:12 git pull...   Already up to date.
  08:06:13 deterministic daily (npm run daily ...)
  [daily] news: starting
  ```
  There is **no `[daily] news: ok`** line, **no `news: failed`** line, and **no `!!! FAILED`** from
  the script's `catch`. In `scripts/daily.mjs`, each column runs inside a per-column `try/catch`
  (`runColumn`) that would log `news: failed` on an error — so the absence of any completion line
  means the **whole process was killed externally mid-news**, not that news threw. (`boot-daily-2026-06-04.log`
  ends at the identical point — same failure mode yesterday.)

- **File timestamps confirm the partial run + what actually refreshed the data:**
  - `public/data/news.json` LastWrite = **06-05 08:07:37** → the news step *did* finish writing
    (~84s after `news: starting`), then the process was killed during the **next** step (papers).
  - `public/data/papers-index.json` LastWrite = **06-05 10:43:14**, `trending.json` = **06-05 10:07:41**
    → refreshed **later, by Kevin's manual dev session** (commits today 09:41–10:58), **not** by the
    boot task. Their internal `date`/`generatedAt` still read 06-04 because manual index rebuilds
    reuse the already-curated 06-04 data rather than re-curating.
  - `public/data/models.json` = **06-04 18:25** → never touched today; confirms the boot task never
    reached the `models` step.

- **Task Scheduler Operational event log is disabled** (`no AI-Brief task scheduler operational
  events`), so we rely on the task's own log + `LastTaskResult` above (which are conclusive).

## Root cause

**The daily refresh depends on a single fragile trigger (at-logon) and a run that got interrupted.**

1. **Single at-logon trigger, no time-of-day trigger.** The task only fires when Kevin logs on. If
   the machine is already on/logged-in for the day, or logon happens once and the run is interrupted,
   there is **no second chance** — nothing re-attempts later in the day.
2. **The run was killed mid-flight (`0xC000013A`, Ctrl-C/terminated), right after `news`.** The most
   likely killer is **the run racing the user**: the task starts only 2 min after logon, minimized,
   exactly when Kevin starts using the machine. Today news finished at 08:07:37 and the process was
   terminated immediately after — consistent with the session/parent being torn down or the minimized
   PowerShell being interrupted as Kevin began his own dev work (which then separately refreshed
   papers/trending at 10:07–10:43). It was **not** the 1-hour `ExecutionTimeLimit` (only ~90s elapsed)
   and **not** a script exception (the `catch` never logged).
3. **Marker-on-success-only means an interrupted run looks identical to "never ran."** Good for
   retry semantics, but with no retry trigger it just leaves the data half-updated (fresh news,
   stale papers/projects/models).

Net: the design assumes "first logon of the day = a clean, uninterrupted window," which doesn't hold.

## Proposed stable design (NOT YET APPLIED)

### (a) Two triggers, same once-per-day marker

Keep the existing `if (Test-Path $marker) { exit 0 }` guard in `boot-daily.ps1` (it already makes the
script idempotent for the day). Register **both** triggers so whichever happens first wins, and the
other is a no-op:

- **At logon** (with a slightly longer delay, e.g. `PT5M`, so it stops racing the user the instant
  they log in), **and**
- **Daily at a fixed wall-clock time** (e.g. **09:00**) with `StartWhenAvailable` so if the machine
  was off at 09:00 it runs as soon as it next wakes.

Because both share the marker, the data still updates **at most once per day**, but now there are
**two independent chances** to catch a clean window.

### (b) Make the run resilient to interruption

- **Restart on failure / interruption:** `-RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10)`
  so a killed run (like today's) is automatically retried. Since the marker isn't written on a killed
  run, the retry will actually do the work.
- **Give it room:** raise `ExecutionTimeLimit` to e.g. **2 hours** (`PT2H`) so news+papers+projects+models
  have headroom, and keep `MultipleInstances = IgnoreNew`.
- **Stop racing the user:** the longer logon delay (above) plus the daily 09:00 trigger means the run
  usually fires when the machine is idle-ish, not in the first 2 minutes of a session.
- **(Optional hardening, code-side — separate change):** in `boot-daily.ps1`, only treat the run as
  "done" (write the marker) if `npm run daily` exits 0 **and** the gate passed; today's behavior already
  does this, so a killed run correctly re-attempts.

### (c) Keep the lightweight "catch-up on first interaction" fallback

This already exists and should stay as a backstop: `npm run predev` →
`scripts/maybe-ingest.mjs` re-runs **ingest** (projects/trending) when `public/data/trending.json`
is older than `INGEST_INTERVAL_HOURS` (default 18h) before `npm run dev`. It's a *partial* refresh
(projects only, not the full news/papers/models/gate/push), so it's a safety net for local viewing,
**not** a replacement for the scheduled full run. No change needed; just noted.

## Exact commands to register the improved task (run ONE of these, after Kevin's OK)

> Run from the project root as the logged-in user `Ykw18`. `RunLevel = Limited` (no elevation) is
> fine — the current task already runs un-elevated and writes to OneDrive without issue, so we do
> **not** request highest privileges (avoids a UAC/registration friction with no benefit). The task
> survives the OneDrive path because the action uses the **absolute** project path for both
> `-File` and `WorkingDirectory` (same as today).

### Option 1 — PowerShell `Register-ScheduledTask` (preferred; mirrors the existing register script)

```powershell
$proj   = "C:\Users\Ykw18\OneDrive\Desktop\Study\Project\AI-Brief v2"
$script = Join-Path $proj "scripts\boot-daily.ps1"

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$script`"" `
  -WorkingDirectory $proj

# Two triggers: at logon (delayed 5 min so it doesn't race the user) + daily at 09:00.
$tLogon = New-ScheduledTaskTrigger -AtLogOn
$tLogon.Delay = "PT5M"
$tDaily = New-ScheduledTaskTrigger -Daily -At 9:00am

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
  -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10) `
  -MultipleInstances IgnoreNew

# Run as the logged-in interactive user, only when logged on (so the OneDrive path is mounted).
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName "AI-Brief Daily" `
  -Action $action -Trigger @($tLogon, $tDaily) -Settings $settings -Principal $principal `
  -Description "Daily deterministic refresh (news/papers/projects/models) + gate + push. Triggers: logon(+5m) and 09:00; once/day via marker. Deep-read = supervised: npm run papers:deepread" `
  -Force
```

(This is a drop-in upgrade of `scripts\register-boot-daily.ps1` — same name, so `-Force` overwrites
the current single-trigger task. The cleanest path is to **edit that script** to the above and re-run
it once.)

### Option 2 — `schtasks` equivalent (two registrations, same script, marker dedupes)

`schtasks /create` can't attach two triggers in one call, so register the same action twice under one
logical task by using `/SC ONLOGON` and a second `/SC DAILY`. Simpler is to keep Option 1; if using
`schtasks`, do:

```bat
schtasks /Create /TN "AI-Brief Daily (logon)" /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File \"C:\Users\Ykw18\OneDrive\Desktop\Study\Project\AI-Brief v2\scripts\boot-daily.ps1\"" /SC ONLOGON /DELAY 0005:00 /RL LIMITED /F

schtasks /Create /TN "AI-Brief Daily (0900)" /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File \"C:\Users\Ykw18\OneDrive\Desktop\Study\Project\AI-Brief v2\scripts\boot-daily.ps1\"" /SC DAILY /ST 09:00 /RL LIMITED /F
```

Both share the same `boot-daily.ps1`, whose `$env:TEMP\ai-brief-boot-<date>.done` marker guarantees
the actual data refresh runs **at most once per day** regardless of how many triggers fire.
(`schtasks` doesn't expose `RestartCount`/`ExecutionTimeLimit` as cleanly, so **Option 1 is preferred**.)

### Verify after registering (read-only)

```powershell
Get-ScheduledTask -TaskName "AI-Brief Daily" | Select-Object -Expand Triggers
Get-ScheduledTaskInfo -TaskName "AI-Brief Daily" | Format-List LastRunTime,LastTaskResult,NextRunTime
# To force a one-off test (will run the real pipeline incl. push — only with Kevin present):
# Start-ScheduledTask -TaskName "AI-Brief Daily"
```

## Risks / flags for Kevin

- **It auto-pushes to PRODUCTION unattended.** `boot-daily.ps1` ends with
  `git push origin feat/nextjs-migration:main` → Vercel prod (`ai-brief-v2.vercel.app`).
  A reliable scheduler means **prod updates with no human in the loop**. This violates the spirit of
  the red line "首次上线/删除性操作必须经我确认" for the *deploy* step. **Registering the
  improved unattended auto-push task needs Kevin's explicit OK.** The gate (`lint` + `validate`)
  does protect against publishing broken data (it exits before push on failure), which mitigates but
  does not remove this.
- **Marker lives in `$env:TEMP`**, which Windows can clear. That's fine for "once per day" (worst case
  it runs twice in a day, still idempotent-ish), but it's not durable — acceptable.
- **Deep-read is deliberately NOT in the task** (open-ended strong-model agent; project red line bans
  open-ended agents in the daily pipeline). It stays the supervised `npm run papers:deepread`. So even
  with a perfectly reliable scheduler, **paper deep-reads still require a manual step** — the scheduler
  only guarantees the deterministic curation/news/projects/models refresh + deploy.
- **Daily 09:00 + auto-push** means if Kevin is mid-edit on the branch at 09:00, the task does
  `git pull --rebase --autostash` then commits/pushes — low risk but worth knowing it touches the
  working tree.
