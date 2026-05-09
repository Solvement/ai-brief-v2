# Media And Image Policy

AI-brief treats images as editorial assets, not as automatic decoration.

Current rule:

- The app does **not** call image-generation APIs.
- The evaluator may emit an `image_plan` so an editor knows what kind of image would help.
- Public pages render only approved `MediaAsset` records.
- Source-provided thumbnails may be used when they are attached as approved `source_image` assets with alt text and credit.
- Generated editorial images, if created manually outside the app, should be stored under `public/assets/` with prompt traceability.
- If no approved media exists, cards use deterministic CSS placeholders from `src/lib/media/index.ts`.

See [`docs/image-policy.md`](./image-policy.md) for the canonical matrix and admin checklist.

## What Is Not Implemented

- No paid image API integration.
- No local SVG cover generator.
- No automatic screenshot capture.
- No automatic resize/crop pipeline.

Any future media automation must keep the approval-only public rendering rule.
