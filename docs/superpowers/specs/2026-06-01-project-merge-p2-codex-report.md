# Project Merge P2 Codex Report

## Files added

- `scripts/columns/projects/deepdive-prompts.mjs`
- `scripts/columns/projects/brief-writer.mjs`
- `scripts/columns/projects/deepdive.mjs`
- `docs/superpowers/specs/2026-06-01-project-merge-p2-codex-report.md`

I did not run npm/node/git/tests and did not call an LLM.

## What Phase 2 implements

Agent C is additive only. It does not modify `scripts/brief/*`, paper flows, `pipeline-kernel`, or `scripts/columns/projects/index.mjs`.

- `deepdive-prompts.mjs` defines the Chinese project deep-dive prompt and project_type-dispatched technical focus.
- `brief-writer.mjs` writes the pi-shaped brief-wiki entity set:
  - `content/<slug>.md`
  - `source-packs/<slug>-source-pack.md`
  - `evidence-packs/<slug>-evidence-pack.md`
  - `deep-dives/<slug>-deep-dive.md`
  - `concepts/<concept-slug>.md`
  - `claims/<claim-slug>.md`
  - `artifacts/<artifact-slug>.md`
- `deepdive.mjs` exports `generateProjectDeepDive({ candidate, evidence, triage, options, logger })` and provides a direct CLI.

## Generator JSON schema

The LLM/stub payload consumed by the writer is:

- `one_line_positioning`
- `why_hot[]`
- `artifact_audit_rows[]` with `{ item, status, evidence }`
- `tech_breakdown_md`
- `value_to_us { learn, to_aibrief, to_briefmem, resume }`
- `risks[]`
- `next_actions[]`
- `memory_card { problem_pattern, architecture_pattern, reusable_pattern, risk_pattern, similar_projects }`
- `reasoning_trace { paper_type_decision, central_contribution, inspected[], top_claims[], evidence_needed[], main_threats[], transfer_decision }`
- `project_verdict { verdict, relevance_to_ai_engineer, engineering_depth, reuse_value, maturity, main_risk }`
- `claim_ledger[]` with `{ claim, plain_english, source, evidence_strength, supports, does_not_support, threat }`
- `concepts[]` with reusable concept fields
- `artifact { artifact_type, url, official_or_third_party, status, license, runnable, missing_parts, last_checked, summary }`

The prompt enforces grounded Chinese, 大白话 two-layer style, and the rule that missing facts must be written as `未在 README/artifact 说明`.

## Mappings

`project_type -> deep-dive shape`:

- `agent_framework -> agent-build`
- `devtool_cli -> howto-use`
- `library_sdk -> howto-use`
- `model_infra -> howto-use`
- `ai_app -> howto-use`
- `frontend_ui -> howto-use`
- `dataset_benchmark -> research-impl`
- `template_boilerplate -> install`
- `non_ai_eng -> howto-use`
- `triage.intent=teaching -> roadmap`

`project_type -> content.project_kind`:

- `agent_framework/devtool_cli/library_sdk/model_infra/ai_app/frontend_ui/non_ai_eng -> functional_software`
- `dataset_benchmark -> research`
- `template_boilerplate -> skill`
- `triage.intent=teaching -> teaching`

## CLI

Online:

```bash
node scripts/columns/projects/deepdive.mjs <owner/name>
```

Offline stub:

```bash
node scripts/columns/projects/deepdive.mjs <owner/name> --offline
```

Optional:

```bash
node scripts/columns/projects/deepdive.mjs <owner/name> --source github-trending:weekly --wiki-root brief-wiki
```

Online mode runs `collectEvidence`, `evaluate`, then the project deep-dive LLM using `createDeepSeekClient().chatJson` and `projectDeepModel()`. Offline mode sets `noLlm/offline` and writes a clearly marked deterministic stub.

## PM verification

Run:

```bash
node scripts/columns/projects/deepdive.mjs <repo>
npm run brief:lint
npm run brief:build
```

Also test offline shape without model spend:

```bash
node scripts/columns/projects/deepdive.mjs <repo> --offline
npm run brief:lint
```

Recommended spot checks:

- Confirm generated deep-dive frontmatter has `reasoning_trace`, `project_verdict`, `next_actions`, `claim_ledger.plain_english`, and `artifact_audit.reproducibility_status`.
- Confirm content body links back to generated source/evidence/deep/concept/claim/artifact files.
- Confirm concept/claim/artifact frontmatter links to `content:<slug>`.
- Confirm no stub content is accepted as a real published analysis.

## Phase 3 wiring

Phase 3 should:

- Replace or branch the project `analyze` stage to call `generateProjectDeepDive` for `deep_dive` / `clone_and_run` verdicts.
- Decide whether to keep the old public `trending.json` deep payload or make deep project cards read from the brief-wiki mirror.
- Add guard sequencing: generate -> `brief:lint` -> reviewer -> `brief:build`.
- Add DB/memory bookkeeping that marks a repo as deep-dived after the brief-wiki entity set is written.

## P2.1 fixes

1. Content title is now short and repo-description based: `renderContent()` uses `contentTitle()` instead of `one_line_positioning` (`scripts/columns/projects/brief-writer.mjs:154`, `:779-792`), and `normalizeRepo()` can pick up audit descriptions for direct CLI runs (`:843`). Deep-dive title remains `<Name> — 深度拆解` in `renderDeepDive()` (`:254`).
2. Frontmatter object stringification is guarded: `normalizeReasoningTrace()` still emits string/string-array fields (`scripts/columns/projects/brief-writer.mjs:630-636`), while `STRUCTURED_TEXT_FIELDS`, `normalizeStringArray()`, `cleanString()`, `cleanMultiline()`, and `extractStructuredText()` coerce model objects without `[object Object]` (`:1093-1158`).
3. `why_selected` no longer appends triage metadata: `whySelected()` now returns clean prose from `triage.reason` or positioning only (`scripts/columns/projects/brief-writer.mjs:764-765`).
4. One-line positioning and punchline are distinct: schema/prompt adds `one_line_punchline` (`scripts/columns/projects/deepdive-prompts.mjs:1-6`, `:100`), offline stub emits it (`scripts/columns/projects/deepdive.mjs:79-80`), `normalizeProjectDeepDive()` normalizes it (`scripts/columns/projects/brief-writer.mjs:379-389`), and `renderDeepDive()` omits the blockquote when no distinct punchline exists (`:263-267`, `:703-711`).
5. Tech breakdown headings are constrained and normalized: prompt forbids `#`/`##` in `tech_breakdown_md` (`scripts/columns/projects/deepdive-prompts.mjs:6`, `:101`), and `normalizeTechBreakdownMarkdown()` removes duplicate leading tech headings and demotes line-leading `#`/`##` to `###` (`scripts/columns/projects/brief-writer.mjs:692-696`, used at `:281` and `:392`).
6. Artifact slug is fixed to `<contentSlug>-repo`: `normalizeArtifact()` ignores model-provided artifact slugs and reserves `${contentSlug}-repo` (`scripts/columns/projects/brief-writer.mjs:492-493`).
7. Offline/online content slugs now share `deriveSlug()`: `writeProjectBriefWikiEntities()` reads content-only collisions and calls `deriveSlug()` (`scripts/columns/projects/brief-writer.mjs:69-74`), `readExistingContentSlugs()` scans only `brief-wiki/content` (`:884-908`), and `deriveSlug()` prefers repo name before owner-prefixing (`:910-923`).

PM reminder: delete the old `brief-wiki/*/sakanaai-ai-scientist-v2*` files and `brief-wiki/artifacts/sakanaai-*` files, then re-run `node scripts/columns/projects/deepdive.mjs SakanaAI/AI-Scientist-v2 --source github-trending:monthly`, then `npm run brief:lint` + `npm run brief:build`.
