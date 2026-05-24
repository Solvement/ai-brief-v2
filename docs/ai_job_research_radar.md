# AI Job Research Radar

Last updated: 2026-05-20

## Purpose

AI Job Research Radar is an independent paper discovery and review pipeline for AI engineer job preparation.

It is intentionally separate from the existing News and Projects pipeline.

The goal is not to ingest every paper. The goal is to find a small number of papers that help with:

- AI engineer interviews;
- portfolio project ideas;
- agent / RAG / AI coding system design;
- benchmark and evaluation literacy;
- production AI architecture judgment;
- professor-style paper reading: what to learn, what is good, what is weak, and how to transfer the idea into future work.

Freshness and hotness are quality signals, not the whole standard. The pipeline should prefer new or high-signal papers from trusted sources, then review only the few papers that can produce useful engineering judgment.

## Commands

```bash
npm run papers:discover
npm run papers:triage
npm run papers:review
npm run papers:daily
npm run papers:run
```

`papers:run` executes the full sequence:

```text
discover -> triage -> review -> daily
```

Use a dry run for review verification without spending a Pro model call:

```bash
npm run papers:review -- --dry-run
```

Force a re-review when the user explicitly wants to regenerate reviews with a new model:

```bash
npm run papers:review -- --force
```

## Data Layout

```text
data/papers/
|-- candidates-YYYY-MM-DD.json
|-- triage-YYYY-MM-DD.json
|-- reviews-YYYY-MM-DD.json
|-- daily-YYYY-MM-DD.json
|-- cache/
|   `-- radar-cache.json
`-- reviewed/
    `-- <paper-id>-YYYY-MM-DD.json
```

`reviewed/` is the durable store for completed reviews.

The cache prevents re-reviewing the same paper version. A paper can be reviewed again only when its `version` changes.

## Sources

Implemented source adapters:

- Hugging Face Daily Papers;
- Papers with Code trending;
- arXiv filtered search;
- OpenReview selected venues;
- ACL Anthology selected events;
- CVF Open Access selected events;
- company research pages:
  - OpenAI;
  - Anthropic;
  - Google DeepMind;
  - Meta;
  - Microsoft;
  - NVIDIA.

The adapters are deliberately narrow. They fetch candidate pools, not the entire arXiv corpus.

## Focus Topics

The radar only keeps candidates that match at least one focus topic:

- AI Agents;
- Tool Use;
- AI Coding / SWE Agents;
- Agent Harness / Observability;
- RAG / Knowledge Systems;
- AIGC image/video/product workflows;
- Multimodal UI;
- Evaluation / Benchmarks;
- LLM Security / Reliability;
- Human-AI Interaction.

## Pipeline

### `papers:discover`

Fetches candidates without using a model.

Output:

```text
data/papers/candidates-YYYY-MM-DD.json
```

Discovery does:

- source fetch;
- targeted arXiv queries for emerging job-ready concepts such as agent harnesses, observability, execution traces, Terminal-Bench, self-improving coding agents, and SWE-style evaluation;
- lightweight HTML / Atom / JSON parsing;
- arXiv metadata enrichment when arXiv IDs are available;
- de-duplication by arXiv ID, URL, DOI, or normalized title;
- focus-topic filtering;
- resume-cache fallback from recent candidate files when live sources are rate-limited or return too little high-signal paper metadata.

### `papers:triage`

Scores candidates with deterministic rules and, when available, a cheap model pass.

Output:

```text
data/papers/triage-YYYY-MM-DD.json
```

Score fields:

- `role_relevance`;
- `architecture_value`;
- `practicality`;
- `novelty`;
- `evaluation_quality`;
- `interview_value`;
- `build_potential`.

Triage also records quality signals:

- `freshness_signal`: `new`, `recent`, or `archive`;
- `hotness_signal`: whether the paper came from a high-signal source such as Hugging Face Daily Papers, Papers with Code, OpenReview, or major lab research pages.

Allowed decisions:

- `ignore`;
- `skim`;
- `read`;
- `review`;
- `deep_dive`;
- `implement`.

Only the top 10 non-ignored papers are written to triage output.

### `papers:review`

Reviews only the top 1-2 papers from triage. It prefers `deep_dive`, `review`, and `implement` decisions, but falls back to the best non-ignored papers so a daily run does not silently produce zero reviews.

Output:

```text
data/papers/reviewed/<paper-id>-YYYY-MM-DD.json
data/papers/reviews-YYYY-MM-DD.json
```

The review model is configured by:

```text
PAPERS_REVIEW_MODEL=
```

Set this to the DeepSeek V4 Pro deployment name available in your account. The default is `deepseek-v4-pro`.

Review output includes:

- `abstract_takeaway`;
- `motivation`;
- `solution`;
- `design`;
- `evaluation`;
- `results`;
- `strengths`;
- `weaknesses`;
- `professor_lens`;
- `what_to_learn`;
- `good_ideas`;
- `bad_ideas_or_limits`;
- `transferable_patterns`;
- `future_work_applications`;
- `reading_questions`;
- `learning_tasks`;
- `architecture_takeaway`;
- `interview_talking_points`;
- `likely_interview_questions`;
- `project_ideas`.

Interview value is still tracked, but it is not the only objective. The review should teach the user how to extract reusable design judgment from a paper.

### `papers:daily`

Creates the daily job-prep digest.

Output:

```text
data/papers/daily-YYYY-MM-DD.json
```

Daily output contains:

- one must-read paper;
- three skim papers;
- one professor lesson;
- one good idea to steal;
- one bad idea or risk;
- one transferable pattern;
- one future work application;
- one architecture takeaway;
- one interview talking point;
- one project idea.

## Windows Task Scheduler

Manual one-time setup example:

```powershell
schtasks /Create /SC DAILY /ST 08:30 /TN "AI Brief Paper Radar" /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"C:\path\to\AI-Brief\scripts\run-papers-radar.ps1\""
```

Replace the `-File` path with the absolute path to `scripts/run-papers-radar.ps1` on your machine.

Run immediately:

```powershell
schtasks /Run /TN "AI Brief Paper Radar"
```

Delete:

```powershell
schtasks /Delete /TN "AI Brief Paper Radar" /F
```

If the path changes, update the `-File` path.

## Current Limitations

- Company research pages are parsed with lightweight HTML extraction; some dynamic pages may yield few candidates.
- arXiv and other public sources may rate-limit requests. The resume cache prevents a weak daily digest, but it is still a fallback, not a replacement for live source discovery.
