@echo off
REM Double-click: author today's paper deep-reads (strong model; watch it ~1 min).
REM Board/radar already auto-refresh in the cloud; this only adds the deep-reads.
cd /d "C:\Users\Ykw18\OneDrive\Desktop\Study\Project\AI-Brief v2"
echo === AI-Brief: authoring today's deep-reads ===
call npm run papers:deepread
echo.
echo === Done. To publish: run daily-all (or git add/commit/push). ===
pause
