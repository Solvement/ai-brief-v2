# Quality Gates

AI-brief is complete only when code, content, and decision logic pass local checks.

## Commands

- `npm run typecheck`: TypeScript must compile.
- `npm run lint`: local lint validation must pass.
- `npm test`: unit and smoke tests must pass.
- `npm run validate`: content validation must pass.
- `npm run validate:content`: validates published content fields and scores.
- `npm run validate:evaluation`: validates evaluation schema/rubric behavior through tests.
- `npm run validate:playbook`: validates playbook generator quality through tests.
- `npm run build`: production build must pass.

## Content Rules

- Published content needs title, summary, why_it_matters, source_url, legal scores, legal action labels, and target audience.
- Guide/playbook content needs executable steps, checklist, validation methods, risks, and fallback options.
- Imported content stays draft until reviewed.

## CI

`.github/workflows/quality.yml` runs typecheck, lint, test, validate, and build on pull requests. CI must not call external AI APIs.
