> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 013: Brief issue page

## Goal

Create `/briefs` and `/briefs/[slug]` as newsletter-style AI Brief pages.

## Required Structure

`/briefs`:

- Issue list.
- Date.
- Title.
- One-sentence takeaway.
- Reading time.
- Cover image or placeholder.
- Top categories.

`/briefs/[slug]`:

- Issue header.
- Opening.
- In today's AI brief.
- Latest Developments.
- Development blocks with:
  - category/source label
  - cover image
  - AI-brief summary
  - details bullets
  - why it matters
  - what to do
- Quick hits.
- Related Playbooks.

## Explicitly Out Of Scope

- Subscription CTA.
- Email capture.
- Login or account state.

## Acceptance Criteria

- Brief issue page can render from seed data.
- Missing optional fields are handled gracefully.
- Development blocks preserve Information -> Judgment -> Action.
- Empty/loading/error states exist.
- Typecheck, lint, tests, and build pass.
