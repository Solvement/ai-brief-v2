> **ARCHIVED.** This spec drove an earlier phase and is no longer the source of truth.
> See `docs/tasks/archive/README.md` for the archive policy and `docs/handoff/codex-next-tasks.md` for the active queue.

# Task 016: AI image pipeline

## Goal

Add a media and AI-generated image pipeline for AI-brief, inspired by mature AI media products, without copying external brand assets.

## Requirements

1. Add `MediaAsset` type.
2. Add `cover_image`, `thumbnail_image`, `media_assets`, and `visual_style` fields to `ContentItem`.
3. Create style presets:
   - editorial
   - model_radar
   - tool_product
   - workflow_guide
   - abstract_research
4. Create `generateImagePrompt(contentItem, preset)`.
5. Create `generateCoverImage(contentItem)`.
6. In dev/test, use mock image generation and placeholder assets.
7. In production, use the local SVG generator by default. External image APIs are out of scope unless a future task explicitly opts in.
8. Store generated image metadata:
   - source_type
   - prompt
   - revised_prompt
   - model
   - alt
   - credit
   - status
9. Add admin review states:
   - draft
   - needs_review
   - approved
   - rejected

## Constraints

- Do not copy Rundown.ai images.
- Do not use real logos unless approved.
- Do not generate real person likenesses for news portraits.
- Do not put readable text in generated images by default.
- Image generation must be optional and mockable.
- Public pages only show approved images.
- Tests must not call external APIs.
- Generated report covers, article covers, model radar images, and guide visuals should be created locally from structured text fields.

## Acceptance Criteria

- Content cards can display approved thumbnails or safe placeholders.
- Detail pages can display approved cover images or safe placeholders.
- Generated images have alt text and credit.
- Prompt builder is covered by tests.
- Mock generation is deterministic.
- Typecheck, lint, tests, and build pass.
