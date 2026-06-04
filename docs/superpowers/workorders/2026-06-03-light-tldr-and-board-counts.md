# Workorder: (2) Chinese light-tier one-liner + (C) consistent board counts

Role: implementer. Two backend fixes for the projects column. You MAY run cheap/offline verification (discover + light + publish), but do NOT run the expensive codex deep-dive authoring / full deep tier. Do NOT commit.

## (2) Light-tier one-liner is an English placeholder
Symptom: radar cards show "<repo>: analysis candidate with enough repo evidence" / "deep radar candidate with agent/tooling evidence" — generic English placeholders, not useful.
- Find where the light-tier `tldr` / one-liner is produced (likely scripts/columns/projects/evaluate.mjs light path + its prompt in prompts.mjs, or a fallback string). 
- Make the light one-liner: **Chinese, concrete, informative** — what the project IS + what it's for, in one plain sentence, grounded in the repo evidence (description/README/topics). Not a generic "candidate with evidence" string. If truly no evidence, a short honest Chinese fallback (e.g. "证据不足，待补全") — not English filler.
- This is the cheap light model (DeepSeek); keep it cheap. Verify on a few repos that the one-liner is now a real Chinese sentence.

## (C) Board counts inconsistent (daily 6 / weekly 16 / monthly 12)
Root cause (confirmed by PM): the discover step REMOVES already-deep-dived repos from candidates entirely (`readBriefWikiDeepDivedProjectRepos` filter in sources.mjs, "skipped N already deep-dived"), so they vanish from the day/week/month boards, and each board loses a different number → inconsistent counts.
- Fix the SEMANTICS: dedup should prevent **re-ANALYSIS**, NOT remove repos from the board LISTING. Already-deep-dived repos should STILL appear on their trending board(s), linked to their EXISTING deep dive (briefSlug), just skipped for re-analysis.
- Each board (daily/weekly/monthly) should carry a consistent top-N of what GitHub trending returned for that window (don't whittle boards down by dedup). Pick a sensible consistent N (GitHub trending pages return ~25; the user expects each board to be a full, consistent set, not 6/16/12). Make the three board counts consistent and complete.
- Ensure already-deep-dived repos in the boards keep their briefSlug so the card links to the existing deep dive (not just the repo URL).
- Verify with an OFFLINE/light run (no deep LLM): after the fix, daily/weekly/monthly board counts should be consistent and each include already-deep-dived repos (linked). Report the new counts.

## CONSTRAINTS
- No expensive deep-dive authoring run. `npm test` stays green. Backend lane; spawn sub-agents if useful. Do NOT commit. Report: what each fix changed, the new board counts, a sample new Chinese one-liner, test result.
