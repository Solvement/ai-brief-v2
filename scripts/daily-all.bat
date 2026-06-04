@echo off
REM Double-click: full manual refresh in one go -> deterministic daily + deep-reads + gate + push (deploy).
cd /d "C:\Users\Ykw18\OneDrive\Desktop\Study\Project\AI-Brief v2"
echo === AI-Brief: full daily (refresh + deep-read + deploy) ===
call git pull --rebase --autostash
echo --- deterministic refresh (news/papers/projects/models) ---
call npm run daily
echo --- author deep-reads (strong model) ---
call npm run papers:deepread
echo --- aggregate + gate ---
call node scripts/columns/papers/build-index.mjs
call npm run lint || goto :gatefail
call npm run validate || goto :gatefail
echo --- commit + push (deploy to ai-brief-v2.vercel.app) ---
call git add -A
call git commit -m "chore(daily): manual refresh + deep-read"
call git push origin feat/nextjs-migration:main
call git push origin feat/nextjs-migration
echo === Done. Live in ~2-3 min: https://ai-brief-v2.vercel.app ===
pause
goto :eof
:gatefail
echo !!! Quality gate failed -> NOT pushing. Fix and rerun.
pause
