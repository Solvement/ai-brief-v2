# Models DeepSeek Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first AI-brief `Models` column with a DeepSeek company page and model generation timeline.

**Architecture:** Use static typed JSON for curated model data, a data loader beside the existing trending loader, and hash routes for `#/models` and `#/models/deepseek`. Keep the feature independent from the GitHub Trending ingestion path.

**Tech Stack:** React, TypeScript, Vite, static JSON, Node validation scripts.

---

## File Structure

- Create `public/data/models.json`: curated DeepSeek model/company data.
- Create `scripts/validate-models.mjs`: schema and relationship validation for model data.
- Modify `package.json`: include model validation in `validate`.
- Modify `src/types.ts`: add explicit model data interfaces.
- Modify `src/lib/data.ts`: add `loadModels()`.
- Create `src/components/SiteHeader.tsx`: shared header/nav for Home, Models, detail pages.
- Create `src/pages/Models.tsx`: models index and company detail page.
- Modify `src/pages/Home.tsx`: use shared header.
- Modify `src/pages/Detail.tsx`: use shared header.
- Modify `src/App.tsx`: add hash routes.
- Modify `src/styles.css`: add Models styles.
- Modify `README.md`: document the new column and validation command.

## Tasks

### Task 1: Validation First

- [ ] Create `scripts/validate-models.mjs` that reads `public/data/models.json`, validates required fields, validates score ranges, validates official source URLs, and validates `nextRelation.toReleaseId` references.
- [ ] Run `node scripts/validate-models.mjs`.
- [ ] Expected result before data exists: fail with a missing file or JSON validation error.

### Task 2: Data Contract

- [ ] Add model interfaces to `src/types.ts`.
- [ ] Add `public/data/models.json` with DeepSeek data using official DeepSeek sources.
- [ ] Run `node scripts/validate-models.mjs`.
- [ ] Expected result: `models.json validation passed`.

### Task 3: Runtime Loading and Routing

- [ ] Add `loadModels()` to `src/lib/data.ts`.
- [ ] Add `models` and `modelCompany` route cases in `src/App.tsx`.
- [ ] Ensure unknown model company IDs render a user-facing empty state.

### Task 4: UI

- [ ] Add `SiteHeader`.
- [ ] Update existing pages to use `SiteHeader`.
- [ ] Add `Models` page with company cards and DeepSeek detail view.
- [ ] Add CSS for company cards, release timeline, relation blocks, update blocks, and source lists.

### Task 5: Verification

- [ ] Run `npm run validate`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Open the local app and check `#/models` and `#/models/deepseek` in a browser.
